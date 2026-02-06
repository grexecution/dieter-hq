/**
 * Infinite Context Service
 * 
 * Enables chat threads to continue forever without hitting context limits.
 * - Monitors token usage per thread
 * - Auto-summarizes older messages when approaching limits
 * - Injects memory context into new requests
 * - Transparent to user - no /new command needed
 */

import { db } from '@/server/db';
import { messages, memorySnapshots, contextState } from '@/server/db/schema';
import { eq, asc, desc, and, lte, sql } from 'drizzle-orm';
import {
  MemorySnapshot,
  ExtractedEntity,
  ContextState,
  InjectableContext,
  InfiniteContextConfig,
  DEFAULT_CONFIG,
} from './types';

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || 'http://127.0.0.1:18789';
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD;

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

/**
 * Estimate token count for text (rough approximation)
 * Claude uses ~4 chars per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for a message (includes role overhead)
 */
export function estimateMessageTokens(role: string, content: string): number {
  // Add overhead for role markers (~10 tokens)
  return estimateTokens(content) + 10;
}

// ============================================================================
// CONTEXT STATE MANAGEMENT
// ============================================================================

/**
 * Get or create context state for a thread
 */
export async function getContextState(threadId: string): Promise<ContextState> {
  const existing = await db
    .select()
    .from(contextState)
    .where(eq(contextState.threadId, threadId))
    .limit(1);

  if (existing.length > 0) {
    return {
      threadId: existing[0].threadId,
      totalTokens: existing[0].totalTokens,
      activeMessageCount: existing[0].activeMessageCount,
      snapshotCount: existing[0].snapshotCount,
      lastSnapshotAt: existing[0].lastSnapshotAt,
      contextUtilization: (existing[0].totalTokens / DEFAULT_CONFIG.maxContextTokens) * 100,
    };
  }

  // Calculate from scratch if no state exists
  const threadMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId));

  const totalTokens = threadMessages.reduce(
    (sum, m) => sum + estimateMessageTokens(m.role, m.content),
    0
  );

  const snapshots = await db
    .select()
    .from(memorySnapshots)
    .where(eq(memorySnapshots.threadId, threadId));

  const state: ContextState = {
    threadId,
    totalTokens,
    activeMessageCount: threadMessages.length,
    snapshotCount: snapshots.length,
    lastSnapshotAt: snapshots.length > 0 
      ? new Date(Math.max(...snapshots.map(s => s.createdAt.getTime())))
      : null,
    contextUtilization: (totalTokens / DEFAULT_CONFIG.maxContextTokens) * 100,
  };

  // Persist the calculated state
  await db.insert(contextState).values({
    threadId,
    totalTokens: state.totalTokens,
    activeMessageCount: state.activeMessageCount,
    snapshotCount: state.snapshotCount,
    lastSnapshotAt: state.lastSnapshotAt,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: contextState.threadId,
    set: {
      totalTokens: state.totalTokens,
      activeMessageCount: state.activeMessageCount,
      snapshotCount: state.snapshotCount,
      lastSnapshotAt: state.lastSnapshotAt,
      updatedAt: new Date(),
    },
  });

  return state;
}

/**
 * Update context state after adding a message
 */
export async function updateContextState(
  threadId: string,
  addedTokens: number
): Promise<ContextState> {
  const state = await getContextState(threadId);
  
  state.totalTokens += addedTokens;
  state.activeMessageCount += 1;
  state.contextUtilization = (state.totalTokens / DEFAULT_CONFIG.maxContextTokens) * 100;

  await db.update(contextState)
    .set({
      totalTokens: state.totalTokens,
      activeMessageCount: state.activeMessageCount,
      updatedAt: new Date(),
    })
    .where(eq(contextState.threadId, threadId));

  return state;
}

// ============================================================================
// SUMMARIZATION
// ============================================================================

/**
 * Check if summarization is needed
 */
export async function needsSummarization(
  threadId: string,
  config: InfiniteContextConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const state = await getContextState(threadId);
  
  const utilizationTrigger = state.contextUtilization >= config.summarizeThreshold * 100;
  const hasEnoughMessages = state.activeMessageCount >= config.minMessagesToSummarize + config.keepRecentMessages;
  
  return utilizationTrigger && hasEnoughMessages;
}

/**
 * Generate a summary of messages using OpenClaw/LLM
 */
async function generateSummary(
  messagesToSummarize: Array<{ role: string; content: string; createdAt: Date }>
): Promise<{ summary: string; keyPoints: string[]; entities: ExtractedEntity[] }> {
  const conversationText = messagesToSummarize
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n\n');

  const prompt = `Summarize this conversation concisely. Extract:
1. A brief summary (2-3 sentences max)
2. Key points (bullet list, max 5)
3. Important entities (people, projects, decisions, tasks mentioned)

Format your response EXACTLY as JSON:
{
  "summary": "Brief summary here",
  "keyPoints": ["point 1", "point 2"],
  "entities": [{"type": "person|project|decision|task|date|file|url", "value": "name", "mentions": 1}]
}

Conversation:
${conversationText}`;

  try {
    const response = await fetch(`${GATEWAY_HTTP_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GATEWAY_PASSWORD && { 'Authorization': `Bearer ${GATEWAY_PASSWORD}` }),
        'x-openclaw-agent-id': 'main',
        'x-openclaw-session-key': 'agent:main:infinite-context:summarizer',
        'x-openclaw-source': 'dieter-hq-summarizer',
      },
      body: JSON.stringify({
        model: 'openclaw:main',
        messages: [
          { 
            role: 'system', 
            content: 'You are a summarization assistant. Output only valid JSON, no markdown.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Low temperature for consistent summaries
      }),
    });

    if (!response.ok) {
      throw new Error(`Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      summary: parsed.summary || 'Conversation summary unavailable.',
      keyPoints: parsed.keyPoints || [],
      entities: parsed.entities || [],
    };
  } catch (error) {
    console.error('[InfiniteContext] Summarization error:', error);
    
    // Fallback: simple extraction without LLM
    return {
      summary: `Conversation with ${messagesToSummarize.length} messages.`,
      keyPoints: messagesToSummarize
        .filter(m => m.role === 'user')
        .slice(0, 3)
        .map(m => m.content.slice(0, 100)),
      entities: [],
    };
  }
}

/**
 * Perform automatic summarization when context is getting full
 */
export async function autoSummarize(
  threadId: string,
  config: InfiniteContextConfig = DEFAULT_CONFIG
): Promise<MemorySnapshot | null> {
  const state = await getContextState(threadId);
  
  // Double-check we need summarization
  if (state.activeMessageCount < config.minMessagesToSummarize + config.keepRecentMessages) {
    console.log('[InfiniteContext] Not enough messages to summarize');
    return null;
  }

  // Get all messages for this thread
  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));

  if (allMessages.length <= config.keepRecentMessages) {
    return null;
  }

  // Split: messages to summarize vs messages to keep
  const messagesToKeep = allMessages.slice(-config.keepRecentMessages);
  const messagesToSummarize = allMessages.slice(0, -config.keepRecentMessages);

  if (messagesToSummarize.length === 0) {
    return null;
  }

  console.log(`[InfiniteContext] Summarizing ${messagesToSummarize.length} messages for thread ${threadId}`);

  // Calculate original tokens
  const originalTokens = messagesToSummarize.reduce(
    (sum, m) => sum + estimateMessageTokens(m.role, m.content),
    0
  );

  // Generate summary
  const { summary, keyPoints, entities } = await generateSummary(
    messagesToSummarize.map(m => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }))
  );

  // Create memory snapshot
  const snapshotId = crypto.randomUUID();
  const snapshot: MemorySnapshot = {
    id: snapshotId,
    threadId,
    summary,
    keyPoints,
    entities,
    messageCount: messagesToSummarize.length,
    tokenCount: originalTokens,
    compressedTokens: estimateTokens(summary + keyPoints.join(' ')),
    createdAt: new Date(),
    firstMessageId: messagesToSummarize[0].id,
    lastMessageId: messagesToSummarize[messagesToSummarize.length - 1].id,
    firstMessageAt: messagesToSummarize[0].createdAt,
    lastMessageAt: messagesToSummarize[messagesToSummarize.length - 1].createdAt,
  };

  // Save snapshot to DB
  await db.insert(memorySnapshots).values({
    id: snapshot.id,
    threadId: snapshot.threadId,
    summary: snapshot.summary,
    keyPointsJson: JSON.stringify(snapshot.keyPoints),
    entitiesJson: JSON.stringify(snapshot.entities),
    messageCount: snapshot.messageCount,
    tokenCount: snapshot.tokenCount,
    compressedTokens: snapshot.compressedTokens,
    firstMessageId: snapshot.firstMessageId,
    lastMessageId: snapshot.lastMessageId,
    firstMessageAt: snapshot.firstMessageAt,
    lastMessageAt: snapshot.lastMessageAt,
    createdAt: snapshot.createdAt,
  });

  // Delete summarized messages from active messages
  const idsToDelete = messagesToSummarize.map(m => m.id);
  for (const id of idsToDelete) {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Update context state
  const newTokenCount = messagesToKeep.reduce(
    (sum, m) => sum + estimateMessageTokens(m.role, m.content),
    0
  ) + snapshot.compressedTokens;

  await db.update(contextState)
    .set({
      totalTokens: newTokenCount,
      activeMessageCount: messagesToKeep.length,
      snapshotCount: state.snapshotCount + 1,
      lastSnapshotAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contextState.threadId, threadId));

  console.log(`[InfiniteContext] Created snapshot ${snapshotId}: ${originalTokens} tokens → ${snapshot.compressedTokens} tokens (${Math.round((1 - snapshot.compressedTokens / originalTokens) * 100)}% compression)`);

  return snapshot;
}

// ============================================================================
// CONTEXT INJECTION
// ============================================================================

/**
 * Get injectable context for a thread
 * This combines memory snapshots with recent messages
 */
export async function getInjectableContext(
  threadId: string,
  config: InfiniteContextConfig = DEFAULT_CONFIG
): Promise<InjectableContext> {
  // Get memory snapshots (most recent first)
  const snapshots = await db
    .select()
    .from(memorySnapshots)
    .where(eq(memorySnapshots.threadId, threadId))
    .orderBy(desc(memorySnapshots.createdAt))
    .limit(config.maxSnapshotsInContext);

  // Get recent messages
  const recentMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt))
    .limit(config.keepRecentMessages * 2); // Get a bit more for context

  // Build system context from snapshots
  let systemContext = '';
  let snapshotTokens = 0;

  if (snapshots.length > 0) {
    systemContext = `📚 **Conversation Memory**\n\nThis is a continuation of a long conversation. Here's what was discussed previously:\n\n`;
    
    // Reverse to show oldest first
    for (const snap of snapshots.reverse()) {
      const keyPoints = JSON.parse(snap.keyPointsJson) as string[];
      const entities = JSON.parse(snap.entitiesJson) as ExtractedEntity[];
      
      systemContext += `---\n**${snap.firstMessageAt.toLocaleDateString()} - ${snap.lastMessageAt.toLocaleDateString()}** (${snap.messageCount} messages)\n`;
      systemContext += `${snap.summary}\n`;
      
      if (keyPoints.length > 0) {
        systemContext += `Key points:\n${keyPoints.map(p => `• ${p}`).join('\n')}\n`;
      }
      
      if (entities.length > 0) {
        const entityList = entities.slice(0, 5).map(e => `${e.value} (${e.type})`).join(', ');
        systemContext += `Mentioned: ${entityList}\n`;
      }
      
      systemContext += '\n';
      snapshotTokens += snap.compressedTokens;
    }
    
    systemContext += `---\n\n**Recent conversation continues below.**\n`;
  }

  // Calculate total tokens
  const messageTokens = recentMessages.reduce(
    (sum, m) => sum + estimateMessageTokens(m.role, m.content),
    0
  );

  return {
    systemContext,
    recentMessages: recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
    totalTokens: snapshotTokens + messageTokens + estimateTokens(systemContext),
  };
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * Process a new message with infinite context handling
 * Call this BEFORE sending to OpenClaw
 */
export async function processMessageWithInfiniteContext(
  threadId: string,
  userMessage: string,
  config: InfiniteContextConfig = DEFAULT_CONFIG
): Promise<{
  contextMessages: Array<{ role: string; content: string }>;
  contextState: ContextState;
  summarizationTriggered: boolean;
}> {
  // Check if we need to summarize before adding the new message
  let summarizationTriggered = false;
  if (await needsSummarization(threadId, config)) {
    await autoSummarize(threadId, config);
    summarizationTriggered = true;
  }

  // Get injectable context
  const injectable = await getInjectableContext(threadId, config);

  // Build messages array for OpenClaw
  const contextMessages: Array<{ role: string; content: string }> = [];

  // Add memory context as system message (if exists)
  if (injectable.systemContext) {
    contextMessages.push({
      role: 'system',
      content: injectable.systemContext,
    });
  }

  // Add recent messages (conversation history)
  for (const msg of injectable.recentMessages) {
    contextMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add the new user message
  contextMessages.push({
    role: 'user',
    content: userMessage,
  });

  // Update context state with new message tokens
  const newTokens = estimateMessageTokens('user', userMessage);
  const state = await updateContextState(threadId, newTokens);

  return {
    contextMessages,
    contextState: state,
    summarizationTriggered,
  };
}

/**
 * Record assistant response for context tracking
 */
export async function recordAssistantResponse(
  threadId: string,
  response: string
): Promise<void> {
  const tokens = estimateMessageTokens('assistant', response);
  await updateContextState(threadId, tokens);
}

/**
 * Get context status for debugging/display
 */
export async function getContextStatus(threadId: string): Promise<{
  state: ContextState;
  snapshotCount: number;
  oldestSnapshotDate: Date | null;
  latestSnapshotDate: Date | null;
  estimatedConversationLength: string;
}> {
  const state = await getContextState(threadId);
  
  const snapshots = await db
    .select()
    .from(memorySnapshots)
    .where(eq(memorySnapshots.threadId, threadId))
    .orderBy(asc(memorySnapshots.createdAt));

  const totalMessages = state.activeMessageCount + 
    snapshots.reduce((sum, s) => sum + s.messageCount, 0);

  return {
    state,
    snapshotCount: snapshots.length,
    oldestSnapshotDate: snapshots.length > 0 ? snapshots[0].firstMessageAt : null,
    latestSnapshotDate: snapshots.length > 0 ? snapshots[snapshots.length - 1].lastMessageAt : null,
    estimatedConversationLength: `~${totalMessages} messages total (${state.activeMessageCount} active, ${totalMessages - state.activeMessageCount} summarized)`,
  };
}

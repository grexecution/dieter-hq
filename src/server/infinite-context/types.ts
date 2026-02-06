/**
 * Infinite Context System - Type Definitions
 * 
 * Enables chat to continue forever without hitting "context full"
 */

export interface MemorySnapshot {
  id: string;
  threadId: string;
  
  // Summary content
  summary: string;           // Compressed version of conversation
  keyPoints: string[];       // Important bullet points
  entities: ExtractedEntity[]; // People, projects, decisions mentioned
  
  // Metadata
  messageCount: number;      // How many messages were summarized
  tokenCount: number;        // Estimated tokens in original messages
  compressedTokens: number;  // Tokens in the summary
  createdAt: Date;
  
  // Range tracking
  firstMessageId: string;
  lastMessageId: string;
  firstMessageAt: Date;
  lastMessageAt: Date;
}

export interface ExtractedEntity {
  type: 'person' | 'project' | 'decision' | 'task' | 'date' | 'file' | 'url';
  value: string;
  mentions: number;
}

export interface ContextState {
  threadId: string;
  totalTokens: number;
  activeMessageCount: number;
  snapshotCount: number;
  lastSnapshotAt: Date | null;
  contextUtilization: number; // 0-100%
}

export interface SummarizationResult {
  snapshot: MemorySnapshot;
  removedMessageIds: string[];
  tokensSaved: number;
}

export interface InjectableContext {
  systemContext: string;      // Injected as system message
  recentMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  totalTokens: number;
}

// Configuration
export interface InfiniteContextConfig {
  maxContextTokens: number;      // Default: 100k for Claude
  summarizeThreshold: number;    // 0.7 = 70%
  minMessagesToSummarize: number; // Don't summarize if < this
  keepRecentMessages: number;    // Always keep last N messages
  maxSnapshotsInContext: number; // How many snapshots to inject
}

export const DEFAULT_CONFIG: InfiniteContextConfig = {
  maxContextTokens: 100000,      // Conservative for Claude
  summarizeThreshold: 0.7,       // Trigger at 70%
  minMessagesToSummarize: 10,    // Need at least 10 messages
  keepRecentMessages: 20,        // Always keep last 20
  maxSnapshotsInContext: 5,      // Inject up to 5 memory snapshots
};

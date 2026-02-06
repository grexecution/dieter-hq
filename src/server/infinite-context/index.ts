/**
 * Infinite Context System
 * 
 * Enables DieterHQ chats to continue forever without hitting "context full"
 * 
 * Usage:
 * ```ts
 * import { processMessageWithInfiniteContext, recordAssistantResponse } from '@/server/infinite-context';
 * 
 * // Before sending to OpenClaw:
 * const { contextMessages, contextState } = await processMessageWithInfiniteContext(threadId, userMessage);
 * 
 * // Send contextMessages to OpenClaw instead of just the user message
 * 
 * // After receiving response:
 * await recordAssistantResponse(threadId, assistantResponse);
 * ```
 */

export * from './types';
export * from './service';

/**
 * Advanced AI Context Management System - Type Definitions
 * 
 * Comprehensive types for intelligent context routing, dynamic model selection,
 * background task tracking, and multi-context management.
 */

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type ContextType = 
  | 'primary'      // Main user chat
  | 'task'         // Subagent/task execution
  | 'background'   // Heartbeat, cron, monitoring
  | 'external'     // Group chats, channels
  | 'specialist';  // Domain-specific (code, writing, research)

export type ContextStatus = 
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'archived';

export type ThinkingLevel = 'off' | 'low' | 'medium' | 'high';

export interface ModelConfig {
  modelId: string;
  thinkingLevel: ThinkingLevel;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  capabilities: ModelCapability[];
}

export type ModelCapability = 
  | 'code'
  | 'reasoning'
  | 'creative'
  | 'vision'
  | 'tools'
  | 'long_context'
  | 'fast'
  | 'cheap';

// ============================================================================
// CONTEXT STATE
// ============================================================================

export interface Context {
  id: string;
  type: ContextType;
  status: ContextStatus;
  
  // Configuration
  config: ModelConfig;
  
  // Conversation
  messages: ContextMessage[];
  tokenUsage: TokenUsage;
  
  // Task tracking
  tasks: ContextTaskQueue;
  
  // Metadata
  createdAt: Date;
  lastActiveAt: Date;
  parentContextId?: string;
  childContextIds: string[];
  
  // Purpose
  goal?: string;
  priority: number;
  
  // Summarization
  summary?: ContextSummary;
  lastSummarizedAt?: Date;
  
  // Routing hints
  routingHints: RoutingHint[];
  intents: DetectedIntent[];
}

export interface ContextMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  cost?: number;
}

export interface ContextTaskQueue {
  pending: ContextTask[];
  active: ContextTask[];
  completed: ContextTask[];
  failed: ContextTask[];
}

export interface ContextTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  description: string;
  progress: number;        // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: unknown;
  metadata?: Record<string, unknown>;
}

export type TaskType = 
  | 'subagent'
  | 'tool_execution'
  | 'file_operation'
  | 'web_search'
  | 'browser_action'
  | 'background_check'
  | 'scheduled_task';

export type TaskStatus = 
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ============================================================================
// CONTEXT SUMMARIZATION
// ============================================================================

export interface ContextSummary {
  id: string;
  contextId: string;
  
  // Summary content
  shortSummary: string;          // One-liner
  fullSummary: string;           // Detailed summary
  keyPoints: string[];           // Bullet points
  decisions: DecisionRecord[];   // Key decisions made
  
  // Extracted information
  entities: ExtractedEntity[];
  topics: string[];
  sentiment: SentimentScore;
  
  // Metadata
  createdAt: Date;
  messageRange: {
    from: number;
    to: number;
  };
  compressionRatio: number;      // Original tokens / Summary tokens
}

export interface DecisionRecord {
  description: string;
  rationale?: string;
  timestamp: Date;
  confidence: number;
}

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  mentions: number;
  context?: string;
}

export type EntityType = 
  | 'person'
  | 'organization'
  | 'project'
  | 'technology'
  | 'date'
  | 'file'
  | 'url'
  | 'task';

export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  overall: 'positive' | 'negative' | 'neutral';
}

// ============================================================================
// CONTEXT ROUTING
// ============================================================================

export interface RoutingDecision {
  targetContextId: string;
  confidence: number;
  reasoning: string[];
  alternatives: AlternativeRoute[];
  suggestNewContext: boolean;
  suggestedContextType?: ContextType;
}

export interface AlternativeRoute {
  contextId: string;
  confidence: number;
  reasoning: string;
}

export interface RoutingHint {
  pattern: string;              // Regex or keyword pattern
  contextType: ContextType;
  priority: number;
  description?: string;
}

export interface DetectedIntent {
  type: IntentType;
  confidence: number;
  entities: Record<string, string>;
  originalText: string;
}

export type IntentType = 
  | 'question'
  | 'command'
  | 'request'
  | 'clarification'
  | 'feedback'
  | 'task_creation'
  | 'context_switch'
  | 'information'
  | 'greeting'
  | 'farewell';

// ============================================================================
// MODEL SELECTION
// ============================================================================

export interface ModelSelectionCriteria {
  taskComplexity: ComplexityLevel;
  requiresReasoning: boolean;
  requiresCode: boolean;
  requiresCreativity: boolean;
  requiresVision: boolean;
  contextLength: number;
  urgency: UrgencyLevel;
  budgetConstraint?: number;
  qualityRequirement: QualityLevel;
}

export type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';
export type UrgencyLevel = 'immediate' | 'normal' | 'background';
export type QualityLevel = 'draft' | 'standard' | 'high' | 'premium';

export interface ModelCandidate {
  modelId: string;
  displayName: string;
  provider: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  latencyMs: {
    firstToken: number;
    perToken: number;
  };
  qualityScore: number;          // 0-100
  thinkingSupport: boolean;
  maxThinkingLevel: ThinkingLevel;
}

export interface ModelRecommendation {
  model: ModelCandidate;
  config: ModelConfig;
  score: number;
  reasoning: string[];
  estimatedCost: number;
  estimatedLatency: number;
}

// ============================================================================
// THREAD RECOMMENDATIONS
// ============================================================================

export interface ThreadRecommendation {
  contextId: string;
  relevanceScore: number;        // 0-100
  reasons: string[];
  recentActivity?: Date;
  matchedKeywords: string[];
  suggestedAction?: SuggestedAction;
}

export interface SuggestedAction {
  type: 'continue' | 'resume' | 'review' | 'archive' | 'merge';
  description: string;
  priority: number;
}

export interface RecommendationContext {
  currentMessage: string;
  currentContextId?: string;
  userPreferences: UserPreferences;
  recentContexts: string[];
  activeProjects: string[];
}

export interface UserPreferences {
  preferredModels: string[];
  avoidModels: string[];
  maxConcurrentContexts: number;
  autoArchiveAfterDays: number;
  defaultThinkingLevel: ThinkingLevel;
  contextSwitchBehavior: 'prompt' | 'auto' | 'manual';
}

// ============================================================================
// CONTEXT TRANSITIONS
// ============================================================================

export interface ContextTransition {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: TransitionType;
  timestamp: Date;
  
  // Handoff information
  handoffSummary?: string;
  sharedState?: Record<string, unknown>;
  preservedEntities: ExtractedEntity[];
  
  // User experience
  userInitiated: boolean;
  notificationSent: boolean;
}

export type TransitionType = 
  | 'switch'           // User-initiated switch
  | 'spawn'            // Create child context
  | 'complete'         // Task completion, return to parent
  | 'merge'            // Merge contexts together
  | 'escalate'         // Move to more capable context
  | 'delegate'         // Hand off to specialist
  | 'archive';         // Context archived

export interface TransitionPlan {
  transitions: ContextTransition[];
  summary: string;
  estimatedDuration: number;
  requiresUserConfirmation: boolean;
}

// ============================================================================
// BACKGROUND TASK TRACKING
// ============================================================================

export interface BackgroundTaskState {
  tasks: Map<string, TrackedTask>;
  listeners: Map<string, TaskListener[]>;
  history: TaskHistoryEntry[];
}

export interface TrackedTask {
  id: string;
  contextId: string;
  type: TaskType;
  description: string;
  status: TaskStatus;
  progress: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  lastUpdate: Date;
  updates: TaskUpdate[];
  metadata: Record<string, unknown>;
}

export interface TaskUpdate {
  timestamp: Date;
  message: string;
  progress: number;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface TaskListener {
  id: string;
  callback: (task: TrackedTask, event: TaskEvent) => void;
}

export interface TaskEvent {
  type: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';
  task: TrackedTask;
  timestamp: Date;
  data?: unknown;
}

export interface TaskHistoryEntry {
  taskId: string;
  contextId: string;
  type: TaskType;
  description: string;
  startedAt: Date;
  completedAt: Date;
  status: 'completed' | 'failed' | 'cancelled';
  durationMs: number;
  result?: unknown;
  error?: string;
}

// ============================================================================
// MULTI-CONTEXT MANAGEMENT
// ============================================================================

export interface ContextManagerState {
  contexts: Map<string, Context>;
  activeContextId: string | null;
  backgroundContextIds: string[];
  transitionHistory: ContextTransition[];
  backgroundTasks: BackgroundTaskState;
  recommendations: ThreadRecommendation[];
}

export interface ContextManagerConfig {
  maxContexts: number;
  defaultModel: string;
  defaultThinkingLevel: ThinkingLevel;
  summarizeThreshold: number;      // Messages before summarizing
  archiveAfterInactivityMs: number;
  enableAutoRouting: boolean;
  enablePredictiveRecommendations: boolean;
  enableBackgroundTasking: boolean;
}

export interface ContextSwitchOptions {
  preserveState: boolean;
  summarizeBeforeSwitch: boolean;
  notifyUser: boolean;
  handoffMessage?: string;
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface ContextMetrics {
  contextId: string;
  messageCount: number;
  totalTokens: number;
  averageResponseTime: number;
  userSatisfactionScore?: number;
  taskCompletionRate: number;
  errorRate: number;
  modelUsage: Record<string, number>;
}

export interface SystemMetrics {
  totalContexts: number;
  activeContexts: number;
  totalMessages: number;
  totalTokensUsed: number;
  averageContextLength: number;
  mostUsedModels: Array<{ model: string; usage: number }>;
  taskCompletionRate: number;
  averageTaskDuration: number;
}

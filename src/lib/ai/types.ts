/**
 * AI Integration Framework - Core Types
 * 
 * Unified type definitions for the AI-powered task management system
 */

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'someday';
export type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived';
export type TaskEnergyLevel = 'high' | 'medium' | 'low';
export type TaskContextType = 'work' | 'personal' | 'health' | 'finance' | 'learning' | 'social';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Time estimates and tracking
  estimatedMinutes?: number;
  actualMinutes?: number;
  
  // Scheduling
  dueAt?: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // AI-enhanced metadata
  aiPriorityScore?: number;        // 0-100 computed score
  aiUrgencyDecay?: number;         // Rate of urgency increase
  aiImportanceScore?: number;      // Long-term importance
  aiContextFit?: number;           // How well it fits current context
  
  // Context and categorization
  context: TaskContextType[];
  tags: string[];
  projectId?: string;
  parentTaskId?: string;           // For subtasks
  
  // Dependencies
  blockedBy: string[];             // Task IDs
  blocks: string[];                // Task IDs
  
  // Energy and focus requirements
  energyRequired: TaskEnergyLevel;
  focusTimeMinutes?: number;       // Minimum uninterrupted time needed
  
  // Recurrence
  recurrenceRule?: RecurrenceRule;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completionHistory?: CompletionRecord[];
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];           // 0-6, Sunday = 0
  dayOfMonth?: number;
  endAt?: Date;
  maxOccurrences?: number;
}

export interface CompletionRecord {
  completedAt: Date;
  actualMinutes: number;
  energyAfter?: TaskEnergyLevel;
  notes?: string;
}

// ============================================================================
// USER CONTEXT TYPES
// ============================================================================

export interface UserContext {
  currentTime: Date;
  timezone: string;
  
  // Current state
  currentEnergyLevel: TaskEnergyLevel;
  availableMinutes: number;
  currentLocation?: string;
  
  // Preferences
  workHours: TimeRange;
  focusHours: TimeRange[];         // Preferred deep work times
  breakPatterns: BreakPattern[];
  
  // Historical patterns
  productivityByHour: Record<number, number>;    // Hour -> productivity score
  productivityByDay: Record<number, number>;     // Day of week -> score
  averageTaskCompletion: number;                 // Percentage of estimated time
  
  // Active context
  activeProject?: string;
  recentTags: string[];
  upcomingEvents: CalendarEvent[];
}

export interface TimeRange {
  start: string;   // HH:MM format
  end: string;
}

export interface BreakPattern {
  afterMinutes: number;
  durationMinutes: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  isBlocking: boolean;
}

// ============================================================================
// NLP TYPES
// ============================================================================

export interface ParsedTaskIntent {
  title: string;
  description?: string;
  
  // Extracted entities
  dueDate?: Date;
  duration?: number;
  priority?: TaskPriority;
  context?: TaskContextType[];
  tags?: string[];
  project?: string;
  
  // Confidence scores
  confidence: number;
  ambiguities: Ambiguity[];
}

export interface Ambiguity {
  field: string;
  options: string[];
  context: string;
}

export interface NLPEntityExtraction {
  dates: ExtractedDate[];
  durations: ExtractedDuration[];
  priorities: ExtractedPriority[];
  contexts: ExtractedContext[];
  tags: string[];
}

export interface ExtractedDate {
  text: string;
  value: Date;
  confidence: number;
  isRelative: boolean;
}

export interface ExtractedDuration {
  text: string;
  minutes: number;
  confidence: number;
}

export interface ExtractedPriority {
  text: string;
  value: TaskPriority;
  confidence: number;
}

export interface ExtractedContext {
  text: string;
  value: TaskContextType;
  confidence: number;
}

// ============================================================================
// SCHEDULING TYPES
// ============================================================================

export interface ScheduleSlot {
  startAt: Date;
  endAt: Date;
  taskId?: string;
  type: 'task' | 'buffer' | 'break' | 'blocked';
  score?: number;
}

export interface ScheduleRecommendation {
  task: Task;
  suggestedSlot: ScheduleSlot;
  score: number;
  reasoning: string[];
  alternatives: ScheduleSlot[];
}

export interface DailySchedule {
  date: Date;
  slots: ScheduleSlot[];
  totalProductiveMinutes: number;
  totalBreakMinutes: number;
  unscheduledTasks: Task[];
  overflowTasks: Task[];           // Tasks that couldn't fit
}

export interface SchedulePrediction {
  completionProbability: number;
  predictedDuration: number;
  optimalTimeSlots: TimeRange[];
  riskFactors: string[];
}

// ============================================================================
// PRIORITIZATION TYPES
// ============================================================================

export interface PriorityScore {
  taskId: string;
  totalScore: number;              // 0-100
  
  // Component scores
  urgencyScore: number;            // Based on due date
  importanceScore: number;         // Long-term value
  effortScore: number;             // Inverse of complexity
  contextFitScore: number;         // Current context alignment
  dependencyScore: number;         // Blocking other tasks
  momentumScore: number;           // Continuation of recent work
  
  // Explanation
  factors: PriorityFactor[];
  recommendation: string;
}

export interface PriorityFactor {
  name: string;
  weight: number;
  rawValue: number;
  normalizedValue: number;
  explanation: string;
}

export interface PriorityConfig {
  weights: {
    urgency: number;
    importance: number;
    effort: number;
    contextFit: number;
    dependency: number;
    momentum: number;
  };
  
  // Decay functions
  urgencyDecayDays: number;        // Days before due when urgency starts increasing
  importanceHalfLifeDays: number;  // How quickly importance decays if not addressed
}

// ============================================================================
// COMMUNICATION TYPES
// ============================================================================

export interface CommunicationContext {
  recipient: Recipient;
  previousMessages: Message[];
  relatedTasks: Task[];
  relatedEvents: CalendarEvent[];
  tone: CommunicationTone;
  purpose: CommunicationPurpose;
}

export interface Recipient {
  id: string;
  name: string;
  relationship: 'colleague' | 'manager' | 'client' | 'friend' | 'family' | 'acquaintance';
  preferredStyle?: CommunicationTone;
  timezone?: string;
  recentInteractions?: Date[];
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'recipient';
  sentAt: Date;
  channel: 'email' | 'chat' | 'sms';
}

export type CommunicationTone = 'formal' | 'professional' | 'friendly' | 'casual' | 'urgent';
export type CommunicationPurpose = 
  | 'follow_up'
  | 'request'
  | 'update'
  | 'scheduling'
  | 'thank_you'
  | 'apology'
  | 'introduction'
  | 'reminder';

export interface DraftedCommunication {
  subject?: string;
  body: string;
  suggestedRecipients?: string[];
  tone: CommunicationTone;
  confidence: number;
  alternatives: string[];
  contextUsed: string[];
}

// ============================================================================
// OPTIMIZATION TYPES
// ============================================================================

export interface OptimizationResult {
  recommendations: TaskOptimization[];
  patterns: DetectedPattern[];
  insights: Insight[];
  overallScore: number;
}

export interface TaskOptimization {
  taskId: string;
  type: OptimizationType;
  suggestion: string;
  expectedImprovement: number;     // Percentage
  confidence: number;
  implementation: string;
}

export type OptimizationType = 
  | 'batching'                     // Group similar tasks
  | 'time_boxing'                  // Set strict time limits
  | 'delegation'                   // Suggest delegation
  | 'elimination'                  // Remove unnecessary tasks
  | 'automation'                   // Automate repetitive tasks
  | 'reordering'                   // Change execution order
  | 'splitting'                    // Break into smaller tasks
  | 'merging';                     // Combine related tasks

export interface DetectedPattern {
  type: PatternType;
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  tasks: string[];                 // Related task IDs
  suggestion?: string;
}

export type PatternType = 
  | 'procrastination'
  | 'overcommitment'
  | 'energy_mismatch'
  | 'context_switching'
  | 'estimation_bias'
  | 'peak_productivity'
  | 'recurring_delay';

export interface Insight {
  category: 'productivity' | 'time_management' | 'workload' | 'habits';
  title: string;
  description: string;
  actionable: boolean;
  suggestedAction?: string;
  dataPoints: number;
  confidence: number;
}

// ============================================================================
// MACHINE LEARNING TYPES
// ============================================================================

export interface MLFeatures {
  // Task features
  taskAge: number;
  estimatedDuration: number;
  actualDurationHistory: number[];
  completionRateForSimilar: number;
  
  // Temporal features
  hourOfDay: number;
  dayOfWeek: number;
  daysUntilDue: number;
  
  // Context features
  energyLevel: number;
  recentTaskCount: number;
  similarTasksCompleted: number;
  
  // Historical features
  averageDelayForType: number;
  userProductivityScore: number;
}

export interface MLPrediction {
  value: number;
  confidence: number;
  features: string[];              // Most important features
  explanation: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  sampleCount: number;
}

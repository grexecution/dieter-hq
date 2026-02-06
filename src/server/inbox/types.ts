/**
 * Inbox sync types
 */

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
  source: string;
  account?: string;
}

// Email types (gog gmail output)
export interface GogEmailMessage {
  id: string;
  threadId: string;
  date: string;
  from: string;
  subject: string;
  labels: string[];
  body?: string;
}

export interface GogEmailResponse {
  messages: GogEmailMessage[];
  nextPageToken?: string;
}

// WhatsApp types (wacli output)
export interface WacliMessage {
  ChatJID: string;
  ChatName: string;
  MsgID: string;
  SenderJID: string;
  Timestamp: string;
  FromMe: boolean;
  Text: string;
  DisplayText: string;
  MediaType: string;
  Snippet: string;
}

export interface WacliResponse {
  success: boolean;
  data: {
    fts: boolean;
    messages: WacliMessage[];
  };
  error: string | null;
}

// Slack types (Slack Web API)
export interface SlackMessage {
  type: string;
  subtype?: string;
  ts: string;
  user?: string;
  bot_id?: string;
  text: string;
  channel: string;
  thread_ts?: string;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile?: {
    display_name?: string;
    real_name?: string;
    email?: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
}

export interface SlackConversationsHistoryResponse {
  ok: boolean;
  messages?: SlackMessage[];
  has_more?: boolean;
  response_metadata?: {
    next_cursor?: string;
  };
  error?: string;
}

export interface SlackConversationsListResponse {
  ok: boolean;
  channels?: SlackChannel[];
  response_metadata?: {
    next_cursor?: string;
  };
  error?: string;
}

export interface SlackUsersInfoResponse {
  ok: boolean;
  user?: SlackUser;
  error?: string;
}

// Sync state stored in DB
export interface SyncState {
  id: string;
  source: string;
  account: string | null;
  lastSyncAt: Date | null;
  lastMessageId: string | null;
  cursor: string | null;
  metadata: string | null;
}

// Email accounts configuration
export const EMAIL_ACCOUNTS = [
  "greg.wallner@gmail.com",
  "office@dergreg.com",
  "g.wallner@bluemonkeys.com",
  "wallner@sqdconsulting.com",
] as const;

export type EmailAccount = typeof EMAIL_ACCOUNTS[number];

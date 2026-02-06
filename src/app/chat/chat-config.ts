import { MessageCircle, Dumbbell, Briefcase, Code, Inbox } from "lucide-react";

export type ChatTab = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  description: string;
  /** If true, this tab is a workspace with multiple projects */
  isWorkspace?: boolean;
  /** If true, this tab is a special view (not a chat thread) */
  isSpecialView?: boolean;
};

export const CHAT_TABS: ChatTab[] = [
  {
    id: "inbox",
    name: "Inbox",
    icon: Inbox,
    emoji: "📥",
    description: "Unified inbox - alle Nachrichten",
    isSpecialView: true
  },
  {
    id: "life",
    name: "Life", 
    icon: MessageCircle,
    emoji: "🌟",
    description: "Personal conversations & general topics"
  },
  {
    id: "sport",
    name: "Sport",
    icon: Dumbbell,
    emoji: "💪",
    description: "Training, fitness & health discussions"
  },
  {
    id: "work", 
    name: "Work",
    icon: Briefcase,
    emoji: "🚀",
    description: "Business, projects & professional topics"
  },
  {
    id: "dev",
    name: "Dev",
    icon: Code,
    emoji: "⚡",
    description: "Workspace for development projects",
    isWorkspace: true
  }
];

// Simple version without icons for server-side use
export const CHAT_TAB_IDS = CHAT_TABS.map(tab => tab.id);

// Get workspace tab IDs
export const WORKSPACE_TAB_IDS = CHAT_TABS.filter(tab => tab.isWorkspace).map(tab => tab.id);

// Get special view tab IDs (non-chat tabs like Inbox)
export const SPECIAL_VIEW_TAB_IDS = CHAT_TABS.filter(tab => tab.isSpecialView).map(tab => tab.id);
// Fri Feb  6 15:16:43 CET 2026

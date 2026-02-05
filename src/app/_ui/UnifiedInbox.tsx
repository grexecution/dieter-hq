"use client";

import { useState } from "react";
import { Mail, MessageSquare, Calendar, CheckSquare, Star, Archive, Clock, Edit3, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface InboxItem {
  id: string;
  type: "email" | "whatsapp" | "slack" | "calendar" | "clickup";
  sender: string;
  senderAvatar?: string;
  subject: string;
  preview: string;
  timestamp: string;
  isImportant: boolean;
  isUnread: boolean;
  suggestedResponse?: string;
  confidence?: number;
}

const mockInboxItems: InboxItem[] = [
  {
    id: "1",
    type: "email",
    sender: "kunde@olivadis.com",
    subject: "Problem mit Login",
    preview: "Ich kann mich nicht mehr einloggen, bekomme immer eine Fehlermeldung...",
    timestamp: "2m",
    isImportant: true,
    isUnread: true,
    suggestedResponse: "Hi! Das ist ein bekanntes Problem. Können Sie mir bitte die genaue Fehlermeldung schicken?",
    confidence: 85
  },
  {
    id: "2",
    type: "whatsapp",
    sender: "Max Mustermann",
    subject: "Projekt Update",
    preview: "Hey, wann können wir das nächste Meeting machen?",
    timestamp: "15m",
    isImportant: false,
    isUnread: true,
    suggestedResponse: "Hi Max! Wie wäre es mit Donnerstag 14:00?",
    confidence: 92
  },
  {
    id: "3",
    type: "calendar",
    sender: "Google Calendar",
    subject: "Meeting in 30 min",
    preview: "Daily Standup mit Bluemonkeys Team",
    timestamp: "30m",
    isImportant: true,
    isUnread: false
  },
  {
    id: "4",
    type: "slack",
    sender: "#dev-team",
    subject: "PR Review Request",
    preview: "@greg kann du mal auf den hotfix PR schauen?",
    timestamp: "1h",
    isImportant: false,
    isUnread: true,
    suggestedResponse: "Schaue ich mir gleich an!",
    confidence: 78
  }
];

const typeIcons = {
  email: Mail,
  whatsapp: MessageSquare,
  slack: MessageSquare,
  calendar: Calendar,
  clickup: CheckSquare
};

const typeColors = {
  email: "text-blue-500",
  whatsapp: "text-green-500", 
  slack: "text-purple-500",
  calendar: "text-orange-500",
  clickup: "text-indigo-500"
};

export function UnifiedInbox() {
  const [items, setItems] = useState(mockInboxItems);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const unreadCount = items.filter(item => item.isUnread).length;

  const handleMarkAsRead = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isUnread: false } : item
    ));
  };

  const handleSnooze = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleArchive = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/40 shadow-xl backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Unified Inbox</h2>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm">
          <Archive className="h-4 w-4" />
        </Button>
      </div>

      {/* Inbox Items */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {items.map((item) => {
            const Icon = typeIcons[item.type];
            const isSelected = selectedItem === item.id;
            
            return (
              <div
                key={item.id}
                className={cn(
                  "group cursor-pointer rounded-lg border p-3 transition-all hover:bg-white/50 dark:hover:bg-white/5",
                  isSelected && "bg-white/60 dark:bg-white/10",
                  item.isUnread && "border-primary/30 bg-primary/5",
                  !item.isUnread && "border-white/10 dark:border-white/5"
                )}
                onClick={() => setSelectedItem(isSelected ? null : item.id)}
              >
                {/* Main Content */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", typeColors[item.type])} />
                    {item.isUnread && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm font-medium truncate",
                        item.isUnread && "font-semibold"
                      )}>
                        {item.sender}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                    
                    <p className={cn(
                      "text-sm truncate",
                      item.isUnread ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {item.subject}
                    </p>
                    
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {item.preview}
                    </p>

                    {item.isImportant && (
                      <Star className="h-3 w-3 text-yellow-500 mt-1 fill-current" />
                    )}
                  </div>
                </div>

                {/* Action Suggestions (expanded) */}
                {isSelected && item.suggestedResponse && (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Dieter suggests:</span>
                      <Badge variant="secondary" className="text-xs h-4">
                        {item.confidence}% confident
                      </Badge>
                    </div>
                    
                    <div className="rounded-md bg-white/30 p-2 text-xs dark:bg-white/5">
                      {item.suggestedResponse}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="h-6 text-xs">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 text-xs">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {isSelected && (
                  <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSnooze(item.id);
                      }}
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Action Suggestions Footer */}
      <div className="border-t border-white/10 p-3 dark:border-white/5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>💡 {items.filter(i => i.suggestedResponse).length} suggestions available</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}
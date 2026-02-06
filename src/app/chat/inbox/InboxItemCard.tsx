"use client";

import { useState, useRef, memo, useCallback, useMemo, FormEvent } from "react";
import { 
  Archive, 
  Clock, 
  MoreVertical, 
  ChevronDown, 
  ChevronUp,
  Reply,
  Mail,
  MessageCircle,
  CheckSquare,
  Slack
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  InboxItem, 
  SOURCE_CONFIG, 
  PRIORITY_CONFIG, 
  STATUS_CONFIG,
  InboxStatus,
  InboxSource
} from "./types";
import { RecommendationCard } from "./RecommendationCard";
import { formatInboxTime } from "./utils/timeFormat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InboxItemCardProps {
  item: InboxItem;
  onStatusChange: (id: string, status: InboxStatus) => Promise<void>;
  onExecuteRecommendation: (id: string, approve: boolean, modifiedPayload?: string) => Promise<void>;
  onSendCustomReply?: (id: string, message: string) => Promise<void>;
  isExpanded?: boolean;
  isSelected?: boolean;
  onToggleExpand?: () => void;
}

// WhatsApp icon component (official logo style)
const WhatsAppIcon = memo(({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
));
WhatsAppIcon.displayName = "WhatsAppIcon";

// Source icons mapping
const SOURCE_ICONS: Record<InboxSource, React.FC<{ className?: string }>> = {
  email: Mail,
  whatsapp: WhatsAppIcon,
  clickup: CheckSquare,
  slack: Slack,
};

// Swipe action thresholds
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;

// Memoized card content to prevent re-renders during drag
const CardContent = memo(function CardContent({
  item,
  sourceConfig,
  SourceIcon,
  timeLabel,
  isUnread,
  isExpanded,
  topRecommendation,
  senderInitials,
  showQuickActions,
  setShowQuickActions,
  isUpdating,
  onToggleExpand,
  handleStatusChange,
  onExecuteRecommendation,
  onSendCustomReply,
  showCustomReply,
  setShowCustomReply,
  customReplyText,
  setCustomReplyText,
  isSendingReply,
}: {
  item: InboxItem;
  sourceConfig: typeof SOURCE_CONFIG[InboxSource];
  SourceIcon: React.FC<{ className?: string }>;
  timeLabel: string;
  isUnread: boolean;
  isExpanded: boolean;
  topRecommendation: InboxItem["recommendations"] extends (infer T)[] | undefined ? T : never;
  senderInitials: string;
  showQuickActions: boolean;
  setShowQuickActions: (v: boolean) => void;
  isUpdating: boolean;
  onToggleExpand?: () => void;
  handleStatusChange: (status: InboxStatus) => void;
  onExecuteRecommendation: (id: string, approve: boolean, modifiedPayload?: string) => Promise<void>;
  onSendCustomReply?: (message: string) => Promise<void>;
  showCustomReply: boolean;
  setShowCustomReply: (v: boolean) => void;
  customReplyText: string;
  setCustomReplyText: (v: string) => void;
  isSendingReply: boolean;
}) {
  return (
    <>
      {/* Main content row */}
      <div 
        className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Avatar / Source icon */}
        <div className="shrink-0 pt-0.5">
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarImage src={undefined} alt={item.senderName || item.sender} />
              <AvatarFallback 
                className={cn(
                  "text-xs font-medium",
                  isUnread 
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {senderInitials}
              </AvatarFallback>
            </Avatar>
            {/* Source indicator badge */}
            <div 
              className={cn(
                "absolute -bottom-0.5 -right-0.5 rounded-full p-0.5",
                "bg-white dark:bg-zinc-900 shadow-sm"
              )}
            >
              <SourceIcon className={cn("h-3.5 w-3.5", sourceConfig.color)} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn(
              "text-sm truncate",
              isUnread 
                ? "font-semibold text-zinc-900 dark:text-zinc-100" 
                : "font-medium text-zinc-700 dark:text-zinc-300"
            )}>
              {item.senderName || item.sender}
            </span>
            
            {/* Priority indicator */}
            {item.priority === "urgent" && (
              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
            {item.priority === "high" && (
              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-orange-500" />
            )}
            
            {item.sourceAccount && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                → {item.sourceAccount}
              </span>
            )}
            <div className="flex-1" />
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
              {timeLabel}
            </span>
          </div>

          {/* Subject */}
          {item.subject && (
            <p className={cn(
              "text-sm truncate mb-0.5",
              isUnread 
                ? "text-zinc-800 dark:text-zinc-200" 
                : "text-zinc-600 dark:text-zinc-400"
            )}>
              {item.subject}
            </p>
          )}

          {/* Preview */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {item.preview}
          </p>

          {/* Inline recommendation (collapsed view) */}
          {!isExpanded && topRecommendation && (
            <div className="mt-2">
              <RecommendationCard 
                recommendation={topRecommendation}
                onExecute={onExecuteRecommendation}
                compact
              />
            </div>
          )}
        </div>

        {/* Right side: actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* Unread indicator */}
          {isUnread && (
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
          )}

          {/* Expand/collapse */}
          <button 
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Quick actions (hover) */}
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-0.5"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("archived");
                  }}
                  disabled={isUpdating || item.status === "archived"}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  title="Archivieren"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("snoozed");
                  }}
                  disabled={isUpdating || item.status === "snoozed"}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  title="Zurückstellen"
                >
                  <Clock className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {item.status !== "archived" && (
                <DropdownMenuItem 
                  onClick={() => handleStatusChange("archived")}
                  disabled={isUpdating}
                >
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  Archivieren
                </DropdownMenuItem>
              )}
              {item.status !== "snoozed" && (
                <DropdownMenuItem 
                  onClick={() => handleStatusChange("snoozed")}
                  disabled={isUpdating}
                >
                  <Clock className="h-3.5 w-3.5 mr-2" />
                  Zurückstellen
                </DropdownMenuItem>
              )}
              {item.status !== "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange("pending")}
                    disabled={isUpdating}
                  >
                    {STATUS_CONFIG.pending.emoji} Als offen markieren
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-3 space-y-3">
              {/* Full content */}
              {item.content && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3"
                >
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </motion.div>
              )}

              {/* All recommendations */}
              {item.recommendations && item.recommendations.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-2"
                >
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Empfohlene Aktionen
                  </h4>
                  {item.recommendations.map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      <RecommendationCard
                        recommendation={rec}
                        onExecute={onExecuteRecommendation}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Quick actions */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800"
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("archived")}
                  disabled={isUpdating || item.status === "archived"}
                  className="transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Archive className="h-3.5 w-3.5 mr-1" />
                  Archivieren
                </Button>
                {onSendCustomReply && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCustomReply(!showCustomReply)}
                    disabled={isUpdating}
                    className={cn(
                      "transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      showCustomReply && "bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700"
                    )}
                  >
                    <Reply className="h-3.5 w-3.5 mr-1" />
                    Antworten
                  </Button>
                )}
              </motion.div>

              {/* Custom Reply Input */}
              <AnimatePresence>
                {showCustomReply && onSendCustomReply && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2">
                      <textarea
                        value={customReplyText}
                        onChange={(e) => setCustomReplyText(e.target.value)}
                        placeholder="Deine Nachricht..."
                        className={cn(
                          "w-full rounded-lg border border-zinc-200 dark:border-zinc-700",
                          "bg-white dark:bg-zinc-800 px-3 py-2",
                          "text-sm placeholder:text-zinc-400 dark:text-zinc-100",
                          "focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400",
                          "transition-colors resize-none"
                        )}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCustomReply(false);
                            setCustomReplyText("");
                          }}
                          className="h-7 text-xs"
                        >
                          Abbrechen
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSendCustomReply(customReplyText)}
                          disabled={isSendingReply || !customReplyText.trim()}
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                        >
                          {isSendingReply ? "Sende..." : "Senden"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export const InboxItemCard = memo(function InboxItemCard({ 
  item, 
  onStatusChange, 
  onExecuteRecommendation,
  onSendCustomReply,
  isExpanded = false,
  isSelected = false,
  onToggleExpand
}: InboxItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCustomReply, setShowCustomReply] = useState(false);
  const [customReplyText, setCustomReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Handle sending custom reply
  const handleSendCustomReply = useCallback(async (message: string) => {
    if (!onSendCustomReply || !message.trim()) return;
    setIsSendingReply(true);
    try {
      await onSendCustomReply(item.id, message);
      setCustomReplyText("");
      setShowCustomReply(false);
    } finally {
      setIsSendingReply(false);
    }
  }, [item.id, onSendCustomReply]);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Use motion values for GPU-accelerated transforms (no re-renders during drag)
  const x = useMotionValue(0);
  const leftActionOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rightActionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const leftActionScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1]);
  const rightActionScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8]);

  // Memoize static data to prevent re-renders
  const sourceConfig = useMemo(() => SOURCE_CONFIG[item.source], [item.source]);
  const SourceIcon = useMemo(() => SOURCE_ICONS[item.source], [item.source]);
  const timeLabel = useMemo(() => formatInboxTime(item.receivedAt), [item.receivedAt]);
  const isUnread = item.status === "pending";

  const pendingRecommendations = useMemo(
    () => item.recommendations?.filter(r => r.status === "pending") || [],
    [item.recommendations]
  );
  const topRecommendation = pendingRecommendations[0];

  // Memoize sender initials
  const senderInitials = useMemo(() => 
    (item.senderName || item.sender)
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    [item.senderName, item.sender]
  );

  // Memoize handlers to prevent re-renders
  const handleStatusChange = useCallback(async (newStatus: InboxStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(item.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  }, [item.id, onStatusChange]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldSwipeRight = info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD;
    const shouldSwipeLeft = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;

    if (shouldSwipeRight && item.status !== "pending") {
      handleStatusChange("pending");
    } else if (shouldSwipeLeft && item.status !== "archived") {
      handleStatusChange("archived");
    }
  }, [item.status, handleStatusChange]);

  // Memoize card classes to prevent recalc during drag
  const cardClasses = useMemo(() => cn(
    "relative rounded-2xl border",
    // GPU acceleration hints for smooth dragging
    "will-change-transform transform-gpu",
    isUnread 
      ? "border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/90 shadow-sm"
      : "border-zinc-100/80 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50",
    item.priority === "urgent" && isUnread && "border-l-[3px] border-l-red-500",
    item.priority === "high" && isUnread && "border-l-[3px] border-l-orange-500",
    isSelected && "ring-2 ring-indigo-500/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900",
  ), [isUnread, item.priority, isSelected]);

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-lg">
      {/* Background actions (visible during swipe) - GPU accelerated */}
      <div className="absolute inset-0 flex will-change-transform transform-gpu">
        {/* Left action (swipe right = mark as pending) */}
        <motion.div 
          className="flex-1 flex items-center justify-start pl-4 bg-green-500 will-change-transform transform-gpu"
          style={{ opacity: leftActionOpacity }}
        >
          <motion.div style={{ scale: leftActionScale }} className="text-white will-change-transform transform-gpu">
            <Reply className="h-6 w-6" />
          </motion.div>
        </motion.div>
        
        {/* Right action (swipe left = archive) */}
        <motion.div 
          className="flex-1 flex items-center justify-end pr-4 bg-zinc-500 will-change-transform transform-gpu"
          style={{ opacity: rightActionOpacity }}
        >
          <motion.div style={{ scale: rightActionScale }} className="text-white will-change-transform transform-gpu">
            <Archive className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </div>

      {/* Main card - optimized drag with GPU acceleration */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cardClasses}
        onHoverStart={() => setShowQuickActions(true)}
        onHoverEnd={() => setShowQuickActions(false)}
      >
        <CardContent
          item={item}
          sourceConfig={sourceConfig}
          SourceIcon={SourceIcon}
          timeLabel={timeLabel}
          isUnread={isUnread}
          isExpanded={isExpanded}
          topRecommendation={topRecommendation}
          senderInitials={senderInitials}
          showQuickActions={showQuickActions}
          setShowQuickActions={setShowQuickActions}
          isUpdating={isUpdating}
          onToggleExpand={onToggleExpand}
          handleStatusChange={handleStatusChange}
          onExecuteRecommendation={onExecuteRecommendation}
          onSendCustomReply={onSendCustomReply ? handleSendCustomReply : undefined}
          showCustomReply={showCustomReply}
          setShowCustomReply={setShowCustomReply}
          customReplyText={customReplyText}
          setCustomReplyText={setCustomReplyText}
          isSendingReply={isSendingReply}
        />
      </motion.div>
    </div>
  );
});

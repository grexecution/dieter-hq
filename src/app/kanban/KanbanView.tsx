"use client";

import * as React from "react";
import { AppShell } from "../_ui/AppShell";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassButton,
  GlassInput,
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalFooter,
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Textarea,
  ScrollArea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Task,
  TaskStatus,
  TaskPriority,
  LifeArea,
  Department,
  Question,
  KANBAN_COLUMNS,
  LIFE_AREAS,
  TASK_PRIORITIES,
  DEPARTMENTS,
  getAreaInfo,
  getPriorityInfo,
  getDepartmentInfo,
  formatDueDate,
  formatEstimate,
  getCompletionPercentage,
  getPendingQuestions,
  hasBlockingQuestions,
} from "@/lib/kanban-data";
import { KanbanProvider, useKanban, useKanbanState } from "@/lib/use-kanban-state";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  X,
  GripVertical,
  ChevronRight,
  Inbox,
  Target,
  ListTodo,
  Sparkles,
  Trash2,
  ArrowRight,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

// ============================================
// Task Card Component
// ============================================

interface TaskCardProps {
  task: Task;
  onSelect: () => void;
  onComplete: () => void;
  isDragging?: boolean;
}

function TaskCard({ task, onSelect, onComplete, isDragging }: TaskCardProps) {
  const area = getAreaInfo(task.area);
  const priority = getPriorityInfo(task.priority);
  const department = task.department ? getDepartmentInfo(task.department) : null;
  const completion = getCompletionPercentage(task);
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done";
  const pendingQuestions = getPendingQuestions(task);
  const hasQuestions = pendingQuestions.length > 0;

  return (
    <div
      className={cn(
        "group relative rounded-xl p-3 cursor-pointer",
        "glass transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.98] active:shadow-sm",
        isDragging && "opacity-50 scale-105 shadow-lg rotate-2",
        task.status === "done" && "opacity-60"
      )}
      onClick={onSelect}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      {/* Priority indicator */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-1 rounded-full",
          task.priority === "urgent" && "bg-red-500",
          task.priority === "high" && "bg-orange-500",
          task.priority === "medium" && "bg-blue-500",
          task.priority === "low" && "bg-green-500"
        )}
      />

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className={cn(
              "flex-shrink-0 mt-0.5 transition-colors",
              task.status === "done"
                ? "text-green-500"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {task.status === "done" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
          
          <h4
            className={cn(
              "flex-1 text-sm font-medium leading-snug",
              task.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h4>
          
          {/* Question indicator */}
          {hasQuestions && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-700 dark:text-amber-300">
              <HelpCircle className="h-3 w-3" />
              {pendingQuestions.length}
            </span>
          )}
          
          <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 pl-7">
            {task.description}
          </p>
        )}

        {/* Subtasks progress */}
        {task.subtasks.length > 0 && (
          <div className="mt-2 pl-7 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7">
          {/* Area badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              area.color
            )}
          >
            <span>{area.emoji}</span>
            <span className="hidden sm:inline">{area.label}</span>
          </span>

          {/* Department badge */}
          {department && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                department.color
              )}
            >
              <span>{department.emoji}</span>
              <span className="hidden sm:inline">{department.label}</span>
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]",
                isOverdue
                  ? "bg-red-500/20 text-red-700 dark:text-red-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDueDate(task.dueDate)}
            </span>
          )}

          {/* Time estimate */}
          {task.estimatedMinutes && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatEstimate(task.estimatedMinutes)}
            </span>
          )}

          {/* Tags */}
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Kanban Column Component
// ============================================

interface KanbanColumnProps {
  column: (typeof KANBAN_COLUMNS)[0];
  tasks: Task[];
  onSelectTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onAddTask: (status: TaskStatus) => void;
  onDropTask: (taskId: string, status: TaskStatus) => void;
}

function KanbanColumn({
  column,
  tasks,
  onSelectTask,
  onCompleteTask,
  onAddTask,
  onDropTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const isOverLimit = column.limit && tasks.length > column.limit;

  return (
    <div
      className={cn(
        "flex flex-col min-w-[280px] sm:min-w-[300px] max-w-[320px]",
        "rounded-xl border-t-4 glass-medium",
        column.color,
        isDragOver && "ring-2 ring-primary ring-offset-2"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
          onDropTask(taskId, column.id);
        }
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">{column.icon}</span>
          <div>
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <p className="text-[10px] text-muted-foreground">{column.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className={cn("text-xs tabular-nums", isOverLimit && "bg-red-500/20 text-red-700 dark:text-red-300")}
          >
            {tasks.length}
            {column.limit && `/${column.limit}`}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddTask(column.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 pb-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={() => onSelectTask(task.id)}
              onComplete={() => onCompleteTask(task.id)}
            />
          ))}
          
          {tasks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <div className="text-2xl mb-2">{column.icon}</div>
              <p>No tasks here</p>
              <button
                onClick={() => onAddTask(column.id)}
                className="mt-2 text-primary hover:underline text-xs"
              >
                Add a task
              </button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// Quick Add Task Component
// ============================================

interface QuickAddProps {
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onAdd: (task: { title: string; status: TaskStatus; priority: TaskPriority; area: LifeArea; department?: Department }) => void;
}

function QuickAdd({ defaultStatus = "inbox", onClose, onAdd }: QuickAddProps) {
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [area, setArea] = React.useState<LifeArea>("personal");
  const [department, setDepartment] = React.useState<Department | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ 
      title: title.trim(), 
      status, 
      priority, 
      area,
      department: department || undefined,
    });
    setTitle("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="quick-title">Task title</Label>
        <Input
          id="quick-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border bg-background"
          >
            {KANBAN_COLUMNS.filter((c) => c.id !== "done").map((col) => (
              <option key={col.id} value={col.id}>
                {col.icon} {col.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Priority</Label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border bg-background"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Area</Label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as LifeArea)}
            className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border bg-background"
          >
            {LIFE_AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.emoji} {a.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Department</Label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department | "")}
            className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="">No department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.emoji} {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>
    </form>
  );
}

// ============================================
// Task Detail Panel Component
// ============================================

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
}

function TaskDetail({
  task,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAnswerQuestion,
}: TaskDetailProps) {
  const [newSubtask, setNewSubtask] = React.useState("");
  const area = getAreaInfo(task.area);
  const department = task.department ? getDepartmentInfo(task.department) : null;
  const pendingQuestions = getPendingQuestions(task);
  const answeredQuestions = task.questions.filter((q) => q.answeredAt);

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    onAddSubtask(newSubtask.trim());
    setNewSubtask("");
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] md:w-[450px] glass-strong shadow-xl z-50 animate-slide-in-right">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                area.color
              )}
            >
              {area.emoji} {area.label}
            </span>
            {department && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                  department.color
                )}
              >
                {department.emoji} {department.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Delete this task?")) onDelete();
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                value={task.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="mt-1 text-lg font-medium border-0 px-0 focus-visible:ring-0"
                placeholder="Task title"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={task.description ?? ""}
                onChange={(e) => onUpdate({ description: e.target.value })}
                className="mt-1 min-h-[100px] resize-none"
                placeholder="Add notes or details..."
              />
            </div>

            {/* Quick selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select
                  value={task.status}
                  onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background"
                >
                  {KANBAN_COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.icon} {col.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <select
                  value={task.priority}
                  onChange={(e) => onUpdate({ priority: e.target.value as TaskPriority })}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Area</Label>
                <select
                  value={task.area}
                  onChange={(e) => onUpdate({ area: e.target.value as LifeArea })}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background"
                >
                  {LIFE_AREAS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.emoji} {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Department</Label>
                <select
                  value={task.department ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      department: (e.target.value || undefined) as Department | undefined,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background"
                >
                  <option value="">No department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.emoji} {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Estimate</Label>
                <select
                  value={task.estimatedMinutes ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      estimatedMinutes: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background"
                >
                  <option value="">No estimate</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Subtasks ({task.subtasks.filter((s) => s.completed).length}/
                {task.subtasks.length})
              </Label>
              <div className="mt-2 space-y-1">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => onToggleSubtask(subtask.id)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        subtask.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => onDeleteSubtask(subtask.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask..."
                    className="flex-1 h-8 text-sm"
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={!newSubtask.trim()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Questions Section */}
            {(pendingQuestions.length > 0 || answeredQuestions.length > 0) && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Questions ({pendingQuestions.length} pending)
                </Label>
                <div className="mt-2 space-y-2">
                  {/* Pending Questions - need answers */}
                  {pendingQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {question.text}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-6">
                        Asked by {question.askedBy} • {new Date(question.askedAt).toLocaleString("de-AT")}
                      </p>
                      {question.options && question.options.length > 0 ? (
                        <div className="mt-2 ml-6 flex flex-wrap gap-1.5">
                          {question.options.map((option) => (
                            <Button
                              key={option}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => onAnswerQuestion(question.id, option)}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 ml-6 flex gap-2">
                          <Input
                            placeholder="Type your answer..."
                            className="flex-1 h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                onAnswerQuestion(question.id, e.currentTarget.value.trim());
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              if (input.value.trim()) {
                                onAnswerQuestion(question.id, input.value.trim());
                                input.value = "";
                              }
                            }}
                          >
                            Answer
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Answered Questions - collapsed */}
                  {answeredQuestions.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">{answeredQuestions.length} answered</p>
                      {answeredQuestions.map((question) => (
                        <div key={question.id} className="p-2 rounded bg-muted/50 mb-1">
                          <p className="line-through opacity-60">{question.text}</p>
                          <p className="text-green-600 dark:text-green-400">→ {question.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
              <p>Created: {new Date(task.createdAt).toLocaleString("de-AT")}</p>
              <p>Updated: {new Date(task.updatedAt).toLocaleString("de-AT")}</p>
              {task.completedAt && (
                <p>Completed: {new Date(task.completedAt).toLocaleString("de-AT")}</p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="p-4 border-t flex gap-2">
          {task.status !== "today" && task.status !== "done" && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onUpdate({ status: "today" })}
            >
              <Target className="h-4 w-4 mr-2" />
              Move to Today
            </Button>
          )}
          {task.status !== "done" && (
            <Button
              className="flex-1"
              onClick={() => onUpdate({ status: "done", completedAt: Date.now() })}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Stats Bar Component
// ============================================

function StatsBar() {
  const [state, actions] = useKanban();
  const stats = actions.getTaskStats();

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 glass rounded-xl">
      <div className="flex items-center gap-2 text-sm">
        <Inbox className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{stats.inbox}</span>
        <span className="text-muted-foreground">inbox</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2 text-sm">
        <Target className="h-4 w-4 text-blue-500" />
        <span className="font-medium">{stats.today}</span>
        <span className="text-muted-foreground">today</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="font-medium">{stats.completedToday}</span>
        <span className="text-muted-foreground">done today</span>
      </div>
      {stats.overdue > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-red-500">
            <span className="font-medium">{stats.overdue}</span>
            <span>overdue</span>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Filter Bar Component
// ============================================

function FilterBar() {
  const [state, actions] = useKanban();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={state.searchQuery}
          onChange={(e) => actions.setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          className="pl-9 h-9"
        />
      </div>

      {/* Area filter */}
      <select
        value={state.filterArea ?? ""}
        onChange={(e) =>
          actions.setFilterArea((e.target.value || null) as LifeArea | null)
        }
        className="h-9 px-3 text-sm rounded-lg border bg-background"
      >
        <option value="">All areas</option>
        {LIFE_AREAS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.emoji} {a.label}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={state.filterPriority ?? ""}
        onChange={(e) =>
          actions.setFilterPriority((e.target.value || null) as TaskPriority | null)
        }
        className="h-9 px-3 text-sm rounded-lg border bg-background"
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Department filter */}
      <select
        value={state.filterDepartment ?? ""}
        onChange={(e) =>
          actions.setFilterDepartment((e.target.value || null) as Department | null)
        }
        className="h-9 px-3 text-sm rounded-lg border bg-background"
      >
        <option value="">All departments</option>
        {DEPARTMENTS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.emoji} {d.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {(state.searchQuery || state.filterArea || state.filterPriority || state.filterDepartment) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            actions.setSearchQuery("");
            actions.setFilterArea(null);
            actions.setFilterPriority(null);
            actions.setFilterDepartment(null);
          }}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Kanban Board Component
// ============================================

function KanbanBoard() {
  const [state, actions] = useKanban();
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [quickAddStatus, setQuickAddStatus] = React.useState<TaskStatus>("inbox");
  const selectedTask = actions.getSelectedTask();
  const filteredTasks = actions.getFilteredTasks();

  const handleAddTask = (status: TaskStatus) => {
    setQuickAddStatus(status);
    setShowQuickAdd(true);
  };

  const getColumnTasks = (status: TaskStatus) => {
    return filteredTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Life Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Organize your tasks, focus on what matters
          </p>
        </div>
        <GlassButton
          variant="glass-primary"
          onClick={() => handleAddTask("inbox")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </GlassButton>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Filters */}
      <FilterBar />

      {/* Kanban Columns */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getColumnTasks(column.id)}
              onSelectTask={(id) => actions.selectTask(id)}
              onCompleteTask={(id) => actions.markComplete(id)}
              onAddTask={handleAddTask}
              onDropTask={(taskId, status) => actions.moveTask(taskId, status)}
            />
          ))}
        </div>
      </div>

      {/* Quick Add Modal */}
      <GlassModal open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <GlassModalContent>
          <GlassModalHeader>
            <GlassModalTitle>Add New Task</GlassModalTitle>
          </GlassModalHeader>
          <QuickAdd
            defaultStatus={quickAddStatus}
            onClose={() => setShowQuickAdd(false)}
            onAdd={(task) => actions.addTask(task)}
          />
        </GlassModalContent>
      </GlassModal>

      {/* Task Detail Panel */}
      {selectedTask && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => actions.selectTask(null)}
          />
          <TaskDetail
            task={selectedTask}
            onClose={() => actions.selectTask(null)}
            onUpdate={(updates) => actions.updateTask(selectedTask.id, updates)}
            onDelete={() => {
              actions.deleteTask(selectedTask.id);
              actions.selectTask(null);
            }}
            onAddSubtask={(title) => actions.addSubtask(selectedTask.id, title)}
            onToggleSubtask={(subtaskId) =>
              actions.toggleSubtask(selectedTask.id, subtaskId)
            }
            onDeleteSubtask={(subtaskId) =>
              actions.deleteSubtask(selectedTask.id, subtaskId)
            }
            onAnswerQuestion={(questionId, answer) =>
              actions.answerQuestion(selectedTask.id, questionId, answer)
            }
          />
        </>
      )}
    </div>
  );
}

// ============================================
// Main View Export
// ============================================

export function KanbanView() {
  return (
    <AppShell active="kanban">
      <KanbanProvider>
        <KanbanBoard />
      </KanbanProvider>
    </AppShell>
  );
}

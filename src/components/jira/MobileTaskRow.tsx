"use client";

import React, { useState, useRef } from "react";
import { Issue, IssueStatus, WorkflowStatus } from "@/types/jira";
import {
  Bookmark,
  CheckSquare,
  Bug,
  Lock,
  Check,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Calendar,
  ListTodo,
} from "lucide-react";
import { haptic } from "@/lib/haptic";

interface MobileTaskRowProps {
  issue: Issue;
  statuses: WorkflowStatus[];
  onClick: () => void;
  onOpenStatusPicker: (issue: Issue) => void;
  onQuickComplete?: (issueId: string) => void;
}

export const MobileTaskRow: React.FC<MobileTaskRowProps> = ({
  issue,
  statuses,
  onClick,
  onOpenStatusPicker,
  onQuickComplete,
}) => {
  const [touchOffsetX, setTouchOffsetX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const currentStatusObj = statuses.find((s) => s.id === issue.status);
  const isDone = issue.status === "DONE" || issue.status === "RELEASED";

  const isBlocked =
    (issue.sourceLinks || []).some(
      (l) => l.type === "IS_BLOCKED_BY" && l.targetIssue?.status !== "DONE"
    ) ||
    (issue.targetLinks || []).some(
      (l) => l.type === "BLOCKS" && l.sourceIssue?.status !== "DONE"
    );

  const completedSubtasks = (issue.subtasks || []).filter((s) => s.isCompleted).length;
  const totalSubtasks = (issue.subtasks || []).length;

  const isOverdue =
    issue.dueDate &&
    !isDone &&
    new Date(issue.dueDate).setHours(23, 59, 59, 999) < Date.now();

  const getTypeStyle = () => {
    switch (issue.type) {
      case "BUG":
        return {
          stripe: "bg-[#F43F5E]",
          icon: <Bug className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
          badgeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
        };
      case "STORY":
        return {
          stripe: "bg-[#10B981]",
          icon: <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />,
          badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
        };
      default:
        return {
          stripe: "bg-[#0EA5E9]",
          icon: <CheckSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
          badgeBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/60",
        };
    }
  };

  const typeStyle = getTypeStyle();

  const renderPriorityBadge = () => {
    switch (issue.priority) {
      case "HIGHEST":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60">
            <Sparkles className="w-2.5 h-2.5 text-rose-600" />
            <span>Khẩn cấp</span>
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/60">
            <ArrowUp className="w-2.5 h-2.5 text-orange-600" />
            <span>Cao</span>
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
            <ArrowDown className="w-2.5 h-2.5 text-slate-500" />
            <span>Thấp</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
            <Minus className="w-2.5 h-2.5 text-amber-600" />
            <span>Trung bình</span>
          </span>
        );
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDone) return;
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null || isDone) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    if (deltaX > 0 && deltaX < 120) {
      setTouchOffsetX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current || isDone) return;
    if (touchOffsetX > 75 && onQuickComplete) {
      haptic.medium();
      onQuickComplete(issue.id);
    }
    setTouchOffsetX(0);
    touchStartX.current = null;
    isSwiping.current = false;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-850 transition-all hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99]">
      {/* Background Swipe Action Indicator (Swipe right to complete) */}
      {!isDone && touchOffsetX > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500 text-white flex items-center px-4 font-bold text-xs gap-1.5 transition-opacity"
          style={{ width: `${Math.min(touchOffsetX + 20, 100)}%` }}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span className="whitespace-nowrap font-semibold">Hoàn thành</span>
        </div>
      )}

      {/* Main Card Body */}
      <div
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="p-3.5 bg-white dark:bg-zinc-900 active:bg-slate-50/80 dark:active:bg-zinc-800/80 transition-transform relative z-10 flex flex-col gap-2.5"
        style={{
          transform: touchOffsetX > 0 ? `translateX(${touchOffsetX}px)` : "none",
        }}
      >
        {/* Top Row: Type indicator + Key + Epic Tag + 1-Tap Status Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
            {/* Visual Type Pill with Left Stripe */}
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
              <span className={`w-1.5 h-3.5 rounded-full ${typeStyle.stripe}`} />
              {typeStyle.icon}
              <span className="text-[11.5px] font-bold font-mono text-slate-800 dark:text-zinc-200 tracking-tight">
                {issue.key}
              </span>
            </div>

            {/* Epic Badge */}
            {issue.epic && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border truncate max-w-[120px] shadow-2xs"
                style={{
                  color: issue.epic.color,
                  backgroundColor: `${issue.epic.color}15`,
                  borderColor: `${issue.epic.color}40`,
                }}
              >
                {issue.epic.name}
              </span>
            )}

            {/* Blocked Badge */}
            {isBlocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60 shadow-2xs">
                <Lock className="w-2.5 h-2.5 text-amber-600" />
                <span>Bị chặn</span>
              </span>
            )}
          </div>

          {/* Clickable 1-Tap Status Badge (min-h-[32px] touch target) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptic.selection();
              onOpenStatusPicker(issue);
            }}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-2xs border border-slate-200 dark:border-zinc-700/80 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: currentStatusObj ? `${currentStatusObj.color}18` : undefined,
              color: currentStatusObj?.color || "#6B778C",
            }}
            title="Chạm để chuyển nhanh trạng thái"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: currentStatusObj?.color || "#6B778C" }}
            />
            <span className="truncate max-w-[95px]">{currentStatusObj?.name || issue.status}</span>
          </button>
        </div>

        {/* Title: 14px font-semibold, high contrast dual-mode */}
        <h4
          className={`text-[14px] font-semibold text-slate-900 dark:text-zinc-100 leading-snug line-clamp-2 ${
            isDone ? "line-through text-slate-400 dark:text-zinc-500" : ""
          }`}
        >
          {issue.title}
        </h4>

        {/* Bottom Row: Metadata Indicators & Assignee */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/90 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {renderPriorityBadge()}

            {/* Story Points */}
            {typeof issue.storyPoints === "number" && issue.storyPoints > 0 && (
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-zinc-700">
                {issue.storyPoints} pts
              </span>
            )}

            {/* Subtasks Progress Indicator */}
            {totalSubtasks > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
                <ListTodo className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </span>
            )}

            {/* Due Date Indicator */}
            {issue.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isOverdue
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 font-bold"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{issue.dueDate}</span>
              </span>
            )}
          </div>

          {/* Right: Assignee Avatar with clean ring */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {issue.assignee ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <img
                  src={issue.assignee.avatar}
                  alt={issue.assignee.name}
                  className="w-5 h-5 min-w-[20px] max-w-[20px] min-h-[20px] max-h-[20px] rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-zinc-700 shadow-2xs"
                  title={issue.assignee.name}
                />
                <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-300 truncate max-w-[65px]">
                  {issue.assignee.name.split(" ").slice(-1)[0]}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-100/80 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full border border-dashed border-slate-300 dark:border-zinc-700 shrink-0">
                Chưa gán
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};


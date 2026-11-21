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

  const renderTypeIcon = () => {
    switch (issue.type) {
      case "STORY":
        return <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />;
      case "BUG":
        return <Bug className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
    }
  };

  const renderPriorityBadge = () => {
    switch (issue.priority) {
      case "HIGHEST":
        return (
          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
            <Sparkles className="w-2.5 h-2.5 text-rose-600" />
            <span>Khẩn cấp</span>
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900/60">
            <ArrowUp className="w-2.5 h-2.5 text-orange-600" />
            <span>Cao</span>
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
            <ArrowDown className="w-2.5 h-2.5 text-slate-500" />
            <span>Thấp</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
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
    if (deltaX > 0 && deltaX < 110) {
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
    <div className="relative overflow-hidden rounded-2xl select-none shadow-xs border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
      {/* Background Swipe Action Indicator (Swipe right to complete) */}
      {!isDone && touchOffsetX > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500 text-white flex items-center px-4 font-bold text-xs gap-1.5 transition-opacity"
          style={{ width: `${Math.min(touchOffsetX + 20, 100)}%` }}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span className="whitespace-nowrap">Hoàn thành</span>
        </div>
      )}

      {/* Main Card Body */}
      <div
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="p-3 sm:p-3.5 bg-white dark:bg-zinc-900 active:bg-slate-50 dark:active:bg-zinc-800/80 transition-transform relative z-10 flex flex-col gap-2"
        style={{
          transform: touchOffsetX > 0 ? `translateX(${touchOffsetX}px)` : "none",
        }}
      >
        {/* Top Row: Type icon + Key + Epic Tag + Status Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
            <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-zinc-700/80">
              {renderTypeIcon()}
              <span className="text-[11px] font-bold font-mono text-slate-700 dark:text-zinc-300">
                {issue.key}
              </span>
            </div>

            {issue.epic && (
              <span
                className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border truncate max-w-[110px]"
                style={{
                  color: issue.epic.color,
                  backgroundColor: `${issue.epic.color}15`,
                  borderColor: `${issue.epic.color}40`,
                }}
              >
                {issue.epic.name}
              </span>
            )}

            {isBlocked && (
              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                <Lock className="w-2.5 h-2.5 text-amber-600" />
                Bị chặn
              </span>
            )}
          </div>

          {/* Clickable Status Badge (Opens 1-tap Status Picker) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptic.selection();
              onOpenStatusPicker(issue);
            }}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-2xs border border-slate-200 dark:border-zinc-700/80 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: currentStatusObj ? `${currentStatusObj.color}18` : undefined,
              color: currentStatusObj?.color || "#6B778C",
            }}
            title="Chạm để chuyển nhanh trạng thái"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: currentStatusObj?.color || "#6B778C" }}
            />
            <span className="truncate max-w-[90px]">{currentStatusObj?.name || issue.status}</span>
          </button>
        </div>

        {/* Title */}
        <h4 className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100 leading-snug line-clamp-2">
          {issue.title}
        </h4>

        {/* Bottom Row: Priority + Story Points + Assignee */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            {renderPriorityBadge()}

            {typeof issue.storyPoints === "number" && issue.storyPoints > 0 && (
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-zinc-700">
                {issue.storyPoints} pts
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {issue.assignee ? (
              <div className="flex items-center gap-1.5">
                <img
                  src={issue.assignee.avatar}
                  alt={issue.assignee.name}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-zinc-700"
                />
                <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-300 truncate max-w-[90px]">
                  {issue.assignee.name}
                </span>
              </div>
            ) : (
              <span className="text-[10px] italic text-slate-400 dark:text-zinc-500">
                Chưa phân công
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0 ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

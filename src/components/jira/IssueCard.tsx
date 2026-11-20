"use client";

import React, { useState, useRef, useEffect } from "react";
import { Issue, IssuePriority, IssueType, IssueStatus, WorkflowStatus } from "@/types/jira";
import {
  Bookmark,
  CheckSquare,
  Bug,
  FolderGit2,
  ListTree,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Lock,
  Link2,
  MoreHorizontal,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  isDraggable?: boolean;
  onQuickStatusChange?: (issueId: string, status: IssueStatus) => void;
  statuses?: WorkflowStatus[];
  density?: "comfortable" | "compact";
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onDragStart,
  isDraggable = true,
  onQuickStatusChange,
  statuses = [],
  density = "comfortable",
}) => {
  const isCompact = density === "compact";
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close quick menu on outside click
  useEffect(() => {
    if (!showQuickMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowQuickMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showQuickMenu]);

  const handleCopyKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(issue.key);
    setCopiedKey(true);
    setTimeout(() => {
      setCopiedKey(false);
      setShowQuickMenu(false);
    }, 1200);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/?issue=${issue.key}` : "";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setShowQuickMenu(false);
    }, 1200);
  };

  const handleStatusChange = (e: React.MouseEvent, newStatus: IssueStatus) => {
    e.stopPropagation();
    if (onQuickStatusChange) {
      if (newStatus === "DONE") {
        triggerConfetti();
      }
      onQuickStatusChange(issue.id, newStatus);
    }
    setShowQuickMenu(false);
  };

  const renderTypeIcon = (type: IssueType) => {
    switch (type) {
      case "STORY":
        return <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />;
      case "BUG":
        return <Bug className="w-3.5 h-3.5 text-red-600 fill-red-100" />;
      case "TASK":
        return <CheckSquare className="w-3.5 h-3.5 text-blue-600" />;
      case "EPIC":
        return <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />;
      case "SUBTASK":
        return <ListTree className="w-3.5 h-3.5 text-cyan-600" />;
    }
  };

  const renderPriorityIcon = (priority: IssuePriority) => {
    switch (priority) {
      case "HIGHEST":
        return (
          <span title="Highest Priority">
            <ArrowUp className="w-3.5 h-3.5 text-red-600 font-black stroke-[3]" />
          </span>
        );
      case "HIGH":
        return (
          <span title="High Priority">
            <ArrowUp className="w-3.5 h-3.5 text-red-500 stroke-[2.5]" />
          </span>
        );
      case "MEDIUM":
        return (
          <span title="Medium Priority">
            <Minus className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
          </span>
        );
      case "LOW":
        return (
          <span title="Low Priority">
            <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
          </span>
        );
      case "LOWEST":
        return (
          <span title="Lowest Priority">
            <ArrowDown className="w-3.5 h-3.5 text-blue-300 stroke-[1.5]" />
          </span>
        );
    }
  };

  const completedSubtasks = issue.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = issue.subtasks.length;

  // Check if issue is blocked by any unfinished issue
  const isBlocked =
    (issue.sourceLinks || []).some(
      (l) => l.type === "IS_BLOCKED_BY" && l.targetIssue?.status !== "DONE"
    ) ||
    (issue.targetLinks || []).some(
      (l) => l.type === "BLOCKS" && l.sourceIssue?.status !== "DONE"
    );

  const totalLinks = (issue.sourceLinks?.length || 0) + (issue.targetLinks?.length || 0);

  // Helper to make dark epic colors bright & readable in dark mode
  const getLightenedColor = (hex: string, amount: number = 45) => {
    try {
      const cleanHex = hex.replace("#", "");
      const num = parseInt(cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex, 16);
      let r = (num >> 16) + Math.round(255 * (amount / 100));
      let g = ((num >> 8) & 0x00ff) + Math.round(255 * (amount / 100));
      let b = (num & 0x0000ff) + Math.round(255 * (amount / 100));
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch {
      return hex;
    }
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => {
        if (isDraggable && onDragStart) onDragStart(e);
      }}
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 ${isCompact ? "p-3 rounded-lg" : "p-4 rounded-xl"} border border-[#D7D7D7] dark:border-zinc-800 shadow-xs transition-all duration-200 select-none group relative ${
        isDraggable
          ? "cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#EE0033]/60 dark:hover:border-[#EE0033]/60 hover:ring-1 hover:ring-[#EE0033]/30 active:scale-[0.99]"
          : "cursor-pointer hover:border-[#EE0033]/60 hover:shadow-xs"
      }`}
    >
      {/* Top Header: Badges / Epic + Quick Action Menu */}
      <div className={`${isCompact ? "mb-1.5" : "mb-2"} flex items-start justify-between gap-1.5`}>
        <div className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
          {issue.epic && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-colors truncate max-w-[140px] [color:var(--epic-c)] [background-color:var(--epic-bg)] [border-color:var(--epic-border)] dark:[color:var(--epic-c-dark)] dark:[background-color:var(--epic-bg-dark)] dark:[border-color:var(--epic-border-dark)]"
              style={{
                ["--epic-c" as any]: issue.epic.color,
                ["--epic-bg" as any]: `${issue.epic.color}15`,
                ["--epic-border" as any]: `${issue.epic.color}40`,
                ["--epic-c-dark" as any]: getLightenedColor(issue.epic.color, 50),
                ["--epic-bg-dark" as any]: `${issue.epic.color}30`,
                ["--epic-border-dark" as any]: `${issue.epic.color}70`,
              }}
            >
              {issue.epic.name}
            </span>
          )}

          {isBlocked && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60"
              title="Đang bị chặn bởi công việc chưa hoàn thành"
            >
              <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
              Bị chặn
            </span>
          )}

          {totalLinks > 0 && !isBlocked && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700"
              title={`${totalLinks} liên kết`}
            >
              <Link2 className="w-2.5 h-2.5 text-slate-400" />
              {totalLinks}
            </span>
          )}
        </div>

        {/* Quick Action Button & Dropdown */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickMenu((prev) => !prev);
            }}
            className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Thao tác nhanh"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showQuickMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-6 z-40 w-52 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                Thao tác nhanh
              </div>

              {/* Status transitions */}
              {onQuickStatusChange && statuses.length > 0 && (
                <div className="py-1 border-b border-slate-100 dark:border-zinc-700/60">
                  <div className="px-3 py-0.5 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                    Chuyển trạng thái:
                  </div>
                  {statuses
                    .filter((s) => s.id !== issue.status)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={(e) => handleStatusChange(e, s.id)}
                        className="w-full px-3 py-1.5 text-left flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700/70 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="truncate">{s.name}</span>
                        </div>
                        {s.id === "DONE" && <Sparkles className="w-3 h-3 text-emerald-500" />}
                      </button>
                    ))}
                </div>
              )}

              {/* Copy actions */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700/70 transition"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Sao chép mã {issue.key}
                  </span>
                  {copiedKey && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700/70 transition"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    Sao chép liên kết
                  </span>
                  {copiedLink && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickMenu(false);
                    onClick();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#EE0033] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition font-medium"
                >
                  <span>Xem chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className={`text-xs font-semibold text-[#111827] dark:text-zinc-100 group-hover:text-[#EE0033] dark:group-hover:text-rose-400 transition ${isCompact ? "line-clamp-1" : "line-clamp-2"} leading-relaxed`}>
        {issue.title}
      </h4>

      {/* Subtasks Progress if any */}
      {totalSubtasks > 0 && (
        <div className={`${isCompact ? "mt-1.5" : "mt-2.5"} flex items-center space-x-2 text-[11px] text-slate-500 dark:text-zinc-400`}>
          <CheckCircle2 className={`w-3.5 h-3.5 ${completedSubtasks === totalSubtasks ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
          <span>
            {completedSubtasks}/{totalSubtasks} subtasks
          </span>
          <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 ml-1 overflow-hidden">
            <div
              className={`h-full rounded-full ${completedSubtasks === totalSubtasks ? "bg-emerald-500" : "bg-slate-400"}`}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className={`${isCompact ? "mt-2 pt-1.5" : "mt-3 pt-2.5"} border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between`}>
        <div className="flex items-center space-x-1.5">
          {renderTypeIcon(issue.type)}
          <span className="text-[11px] font-semibold font-mono text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200">
            {issue.key}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {issue.storyPoints !== undefined && (
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center border border-slate-200 dark:border-zinc-700">
              {issue.storyPoints}
            </span>
          )}

          {renderPriorityIcon(issue.priority)}

          {issue.assignee ? (
            <img
              src={issue.assignee.avatar}
              alt={issue.assignee.name}
              title={`Assigned to ${issue.assignee.name}`}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-white dark:ring-zinc-800"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800 border border-dashed border-gray-400 dark:border-zinc-700 flex items-center justify-center text-[9px] text-gray-500 dark:text-zinc-400"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

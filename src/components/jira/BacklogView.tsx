"use client";

import React, { useState } from "react";
import { Issue, Sprint, User, IssuePriority } from "@/types/jira";
import {
  Play,
  CheckCircle2,
  Plus,
  Calendar,
  Layers,
  Check,
  GripVertical,
  Trash2,
  History,
  CheckSquare,
  Square,
  X,
  Users,
  Pencil,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { CreateSprintModal } from "./CreateSprintModal";
import { EditSprintModal } from "./EditSprintModal";
import { CompleteSprintModal } from "./CompleteSprintModal";
import { ClosedSprintsModal } from "./ClosedSprintsModal";
import { MobileBacklogHub } from "./MobileBacklogHub";

export const getPriorityBadge = (priority?: string) => {
  switch (priority) {
    case "HIGHEST":
      return {
        label: "Cao nhất",
        colorClass: "bg-red-50 dark:bg-rose-950/40 text-[#EE0033] dark:text-rose-400 border-red-200 dark:border-rose-900/60 font-bold",
        icon: <ArrowUp className="w-3 h-3 text-[#EE0033] dark:text-rose-400 stroke-[3]" />,
      };
    case "HIGH":
      return {
        label: "Cao",
        colorClass: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/60 font-semibold",
        icon: <ArrowUp className="w-3 h-3 text-orange-600 dark:text-orange-400 stroke-[2.5]" />,
      };
    case "MEDIUM":
      return {
        label: "Trung bình",
        colorClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 font-semibold",
        icon: <Minus className="w-3 h-3 text-amber-600 dark:text-amber-400 stroke-[2.5]" />,
      };
    case "LOW":
      return {
        label: "Thấp",
        colorClass: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/60 font-semibold",
        icon: <ArrowDown className="w-3 h-3 text-sky-600 dark:text-sky-400 stroke-[2]" />,
      };
    case "LOWEST":
      return {
        label: "Rất thấp",
        colorClass: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 font-medium",
        icon: <ArrowDown className="w-3 h-3 text-slate-400 dark:text-zinc-500 stroke-[1.5]" />,
      };
    default:
      return {
        label: "Trung bình",
        colorClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 font-medium",
        icon: <Minus className="w-3 h-3 text-amber-600 dark:text-amber-400 stroke-[2.5]" />,
      };
  }
};

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

interface BacklogViewProps {
  issues: Issue[];
  sprints: Sprint[];
  users: User[];
  currentUser: User;
  isLoading?: boolean;
  onIssueClick: (issue: Issue) => void;
  onCreateIssueClick: () => void;
  onCreateSprint: (sprintData: {
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
  }) => void;
  onStartSprint: (sprintId: string) => void;
  onCompleteSprint: (sprintId: string) => void;
  onDeleteSprint?: (sprintId: string) => void;
  onMoveIssueToSprint: (issueId: string, sprintId: string | null) => void;
  onReorderOrMoveIssue?: (
    sourceIssueId: string,
    targetIssueId: string,
    targetSprintId: string | null,
    position: "before" | "after"
  ) => void;
  onRefresh?: () => void;
}

export const BacklogView: React.FC<BacklogViewProps> = ({
  issues,
  sprints,
  users,
  currentUser,
  isLoading = false,
  onIssueClick,
  onCreateIssueClick,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint,
  onDeleteSprint,
  onMoveIssueToSprint,
  onReorderOrMoveIssue,
  onRefresh,
}) => {
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);
  const [dragOverIssueId, setDragOverIssueId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<"before" | "after" | null>(null);

  // Smart Bulk Actions State
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);

  const toggleSelectIssue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIssueIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllInSprint = (sprintIssues: Issue[]) => {
    const ids = sprintIssues.map((i) => i.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIssueIds.includes(id));
    if (allSelected) {
      setSelectedIssueIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIssueIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleSelectAllInBacklog = () => {
    const ids = backlogIssues.map((i) => i.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIssueIds.includes(id));
    if (allSelected) {
      setSelectedIssueIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIssueIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleBulkAction = async (action: string, data: Record<string, unknown>) => {
    if (selectedIssueIds.length === 0 || isBulkExecuting) return;
    setIsBulkExecuting(true);
    try {
      const res = await fetch("/api/issues/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueIds: selectedIssueIds,
          action,
          data,
          actorId: currentUser.id,
        }),
      });
      if (res.ok) {
        setSelectedIssueIds([]);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Bulk action failed:", err);
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const isViewer = currentUser.role === "VIEWER";
  const canManageSprints = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD" || currentUser.role === "BA";

  // Filter Backlog Issues (Issues not attached to any registered Sprint)
  const sprintIds = new Set(sprints.map((s) => s.id));
  const backlogIssues = issues.filter((i) => !i.sprintId || !sprintIds.has(i.sprintId));
  const backlogTotalPoints = backlogIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  // Active and Planned Sprints (Hide COMPLETED sprints from main planning board)
  const activeAndPlannedSprints = sprints.filter((s) => s.status !== "COMPLETED");
  const completedSprints = sprints.filter((s) => s.status === "COMPLETED");

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    if (isViewer) return;
    setDraggedIssueId(issueId);
    e.dataTransfer.setData("text/plain", issueId);
  };

  const handleDragOver = (e: React.DragEvent, containerId: string) => {
    if (isViewer) return;
    e.preventDefault();
    setDragOverContainerId(containerId);
  };

  const handleIssueDragOver = (e: React.DragEvent, issueId: string) => {
    if (isViewer) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "before" : "after";
    setDragOverIssueId(issueId);
    setDragPosition(pos);
  };

  const handleIssueDragLeave = (e: React.DragEvent, issueId: string) => {
    e.stopPropagation();
    if (dragOverIssueId === issueId) {
      setDragOverIssueId(null);
      setDragPosition(null);
    }
  };

  const handleIssueDrop = (
    e: React.DragEvent,
    targetIssueId: string,
    targetSprintId: string | null
  ) => {
    if (isViewer) return;
    e.preventDefault();
    e.stopPropagation();
    const sourceIssueId = draggedIssueId || e.dataTransfer.getData("text/plain");
    const pos = dragPosition || "before";

    setDraggedIssueId(null);
    setDragOverIssueId(null);
    setDragPosition(null);
    setDragOverContainerId(null);

    if (!sourceIssueId || sourceIssueId === targetIssueId) return;

    if (onReorderOrMoveIssue) {
      onReorderOrMoveIssue(sourceIssueId, targetIssueId, targetSprintId, pos);
    } else {
      onMoveIssueToSprint(sourceIssueId, targetSprintId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSprintId: string | null) => {
    if (isViewer) return;
    e.preventDefault();
    setDragOverContainerId(null);
    const issueId = draggedIssueId || e.dataTransfer.getData("text/plain");
    if (!issueId) return;

    onMoveIssueToSprint(issueId, targetSprintId);
    setDraggedIssueId(null);
    setDragOverIssueId(null);
    setDragPosition(null);
  };

  const handleSaveSprint = async (
    sprintId: string,
    data: { name: string; goal?: string; startDate?: string; endDate?: string }
  ) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        onRefresh?.();
      }
    } catch (err) {
      console.error("Failed to update sprint:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6F8] dark:bg-[#09090B] transition-colors duration-200">
      {/* 1. Desktop Backlog View (Hidden on Mobile) — rendered first so Playwright selectors match desktop elements */}
      <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-4 space-y-4">
        {/* Unified Glass Island Header */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-zinc-900/80 sm:bg-white/75 sm:dark:bg-zinc-900/75 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 sm:border-white/80 sm:dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-wrap gap-y-1">
          <h1 className="text-sm sm:text-lg font-extrabold text-[#111827] dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
            <span>Kế Hoạch Chu Kỳ</span>
            <span className="text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">Backlog</span>
          </h1>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 sm:px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
            {activeAndPlannedSprints.length} chu kỳ • {backlogIssues.length} backlog tasks
          </span>
        </div>
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {completedSprints.length > 0 && (
            <button
              onClick={() => setShowClosedModal(true)}
              className="bg-white dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 transition shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Đã đóng ({completedSprints.length})</span>
            </button>
          )}

          {canManageSprints && (
            <button
              onClick={() => setIsCreateSprintOpen(true)}
              className="bg-white dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-[#111827] dark:text-zinc-200 text-xs font-semibold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#EE0033]" />
              <span>Tạo Sprint</span>
            </button>
          )}
          {!isViewer && (
            <button
              onClick={onCreateIssueClick}
              className="hidden sm:flex bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white text-xs font-semibold px-3.5 sm:px-4 py-1.5 rounded-full items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Thêm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="h-5 bg-slate-200 rounded w-48"></div>
              <div className="h-4 bg-slate-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-11 bg-slate-100 rounded-lg flex items-center px-4 justify-between">
                  <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-slate-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="h-5 bg-slate-200 rounded w-36"></div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-11 bg-slate-100 rounded-lg flex items-center px-4 justify-between">
                  <div className="h-3.5 bg-slate-200 rounded w-2/5"></div>
                  <div className="h-3.5 bg-slate-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Sprints Sections - Only ACTIVE & PLANNED are shown here */}
          {activeAndPlannedSprints.length === 0 && (
            <div className="p-6 bg-white border border-dashed border-gray-300 rounded-lg text-center text-xs text-gray-500">
              Chưa có Sprint nào đang mở. Nhấn &quot;Create Sprint&quot; để tạo chu kỳ làm việc mới.
            </div>
          )}

      {activeAndPlannedSprints.map((sprint) => {
        const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
        const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const isOver = dragOverContainerId === sprint.id;

        return (
          <div
            key={sprint.id}
            onDragOver={(e) => handleDragOver(e, sprint.id)}
            onDragLeave={() => setDragOverContainerId(null)}
            onDrop={(e) => handleDrop(e, sprint.id)}
            className={`bg-white dark:bg-zinc-900 rounded-2xl border shadow-xs overflow-hidden transition-all ${
              isOver
                ? "border-[#EE0033]/60 ring-2 ring-rose-200 dark:ring-rose-900/40 ring-dashed bg-rose-50/20 dark:bg-rose-950/20"
                : "border-slate-200 dark:border-zinc-800"
            }`}
          >
            {/* Sprint Header */}
            <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                {!isViewer && sprintIssues.length > 0 && (
                  <button
                    onClick={() => handleSelectAllInSprint(sprintIssues)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                    title="Chọn tất cả trong Sprint"
                  >
                    {sprintIssues.length > 0 && sprintIssues.every((i) => selectedIssueIds.includes(i.id)) ? (
                      <CheckSquare className="w-4 h-4 text-[#EE0033]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                )}
                <span className="font-semibold text-sm text-slate-800 dark:text-zinc-100">{sprint.name}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    sprint.status === "ACTIVE"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                  }`}
                >
                  {sprint.status === "ACTIVE" ? "Đang diễn ra" : "Kế hoạch"}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                  <span>
                    {sprint.startDate || "Chưa đặt"} ~ {sprint.endDate || "Chưa đặt"}
                  </span>
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 font-mono">
                  {sprintIssues.length} issues · {totalPoints} pts
                </span>
                {canManageSprints && (
                  sprint.status === "ACTIVE" ? (
                    <button
                      onClick={() => setCompletingSprint(sprint)}
                      className="text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 px-3 py-1.5 rounded-full transition flex items-center gap-1 border border-slate-200 dark:border-zinc-700 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Hoàn thành Sprint</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartSprint(sprint.id)}
                      className="text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white px-3.5 py-1.5 rounded-full transition flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Bắt đầu Sprint</span>
                    </button>
                  )
                )}

                {/* Edit Sprint Button (Admin / Project Lead) */}
                {canManageSprints && (
                  <button
                    onClick={() => setEditingSprint(sprint)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    title="Chỉnh sửa thông tin chu kỳ"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Safe Delete Sprint Button (Admin / Project Lead) */}
                {canManageSprints && onDeleteSprint && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Bạn có chắc chắn muốn xóa "${sprint.name}"?\nToàn bộ ${sprintIssues.length} task trong sprint này sẽ được tự động chuyển về Backlog an toàn.`
                        )
                      ) {
                        onDeleteSprint(sprint.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Xóa Sprint (chuyển task về Backlog)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sprint Issues List */}
            <div className="p-4 space-y-2">
              {sprintIssues.map((issue) => (
                <div
                  key={issue.id}
                  draggable={!isViewer}
                  onDragStart={(e) => handleDragStart(e, issue.id)}
                  onDragEnd={() => {
                    setDraggedIssueId(null);
                    setDragOverIssueId(null);
                    setDragPosition(null);
                  }}
                  onDragOver={(e) => handleIssueDragOver(e, issue.id)}
                  onDragLeave={(e) => handleIssueDragLeave(e, issue.id)}
                  onDrop={(e) => handleIssueDrop(e, issue.id, sprint.id)}
                  onClick={() => onIssueClick(issue)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-zinc-800/90 hover:bg-slate-50 dark:hover:bg-zinc-800 border rounded-xl transition shadow-xs group gap-2 relative ${
                    isViewer ? "cursor-pointer" : "cursor-grab active:cursor-grabbing hover:border-red-300 dark:hover:border-red-800"
                  } ${draggedIssueId === issue.id ? "opacity-40" : ""} ${
                    dragOverIssueId === issue.id && dragPosition === "before"
                      ? "border-t-2 border-t-[#EE0033] bg-rose-50/20 dark:bg-rose-950/20"
                      : dragOverIssueId === issue.id && dragPosition === "after"
                      ? "border-b-2 border-b-[#EE0033] bg-rose-50/20 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-zinc-700/80"
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={(e) => toggleSelectIssue(issue.id, e)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition shrink-0"
                      >
                        {selectedIssueIds.includes(issue.id) ? (
                          <CheckSquare className="w-4 h-4 text-[#EE0033]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {!isViewer && (
                      <span className="hidden sm:inline-flex text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 dark:group-hover:text-zinc-400 cursor-grab shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 font-mono group-hover:text-[#EE0033] transition shrink-0">{issue.key}</span>
                    <span className="text-xs text-gray-900 dark:text-zinc-100 font-medium truncate">{issue.title}</span>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 shrink-0 pl-7 sm:pl-0">
                    {/* Quick Move Dropdown */}
                    {!isViewer && (
                      <select
                        value={issue.sprintId || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onMoveIssueToSprint(issue.id, e.target.value || null)}
                        className="text-[11px] bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 text-slate-700 dark:text-zinc-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition focus:opacity-100"
                      >
                        <option value="" className="dark:bg-zinc-800">Chuyển về Backlog</option>
                        {activeAndPlannedSprints.map((s) => (
                          <option key={s.id} value={s.id} className="dark:bg-zinc-800">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {issue.epic && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded border transition-colors [color:var(--epic-c)] [background-color:var(--epic-bg)] [border-color:var(--epic-border)] dark:[color:var(--epic-c-dark)] dark:[background-color:var(--epic-bg-dark)] dark:[border-color:var(--epic-border-dark)]"
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

                    {/* Priority Badge with Viettel & Priority Colors */}
                    {(() => {
                      const p = getPriorityBadge(issue.priority);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors shadow-2xs ${p.colorClass}`}
                          title={`Mức độ ưu tiên: ${p.label}`}
                        >
                          {p.icon}
                          <span>{p.label}</span>
                        </span>
                      );
                    })()}

                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                      {issue.status}
                    </span>

                    {issue.storyPoints !== undefined && (
                      <span className="text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                        {issue.storyPoints}
                      </span>
                    )}

                    {issue.assignee ? (
                      <img
                        src={issue.assignee.avatar}
                        alt={issue.assignee.name}
                        className="w-5 h-5 rounded-full object-cover"
                        title={issue.assignee.name}
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                        ?
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {sprintIssues.length === 0 && (
                <div className="py-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded">
                  Kéo thả task từ Backlog vào đây để bắt đầu Sprint
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Backlog Section */}
      <div
        onDragOver={(e) => handleDragOver(e, "backlog")}
        onDragLeave={() => setDragOverContainerId(null)}
        onDrop={(e) => handleDrop(e, null)}
        className={`bg-white dark:bg-zinc-900 rounded-2xl border shadow-xs overflow-hidden transition-all ${
          dragOverContainerId === "backlog"
            ? "border-[#EE0033]/60 ring-2 ring-rose-200 dark:ring-rose-900/40 ring-dashed bg-rose-50/20 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-zinc-800"
        }`}
      >
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isViewer && backlogIssues.length > 0 && (
              <button
                onClick={handleSelectAllInBacklog}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                title="Chọn tất cả trong Backlog"
              >
                {backlogIssues.length > 0 && backlogIssues.every((i) => selectedIssueIds.includes(i.id)) ? (
                  <CheckSquare className="w-4 h-4 text-[#EE0033]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            <span className="font-semibold text-sm text-slate-800 dark:text-zinc-100">Backlog</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              {backlogIssues.length} issues · {backlogTotalPoints} story points
            </span>
          </div>
          {!isViewer && (
            <button
              onClick={onCreateIssueClick}
              className="text-xs font-semibold text-[#EE0033] hover:text-[#D6002E] flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo công việc</span>
            </button>
          )}
        </div>

        <div className="p-4 space-y-2">
          {backlogIssues.map((issue) => (
            <div
              key={issue.id}
              draggable={!isViewer}
              onDragStart={(e) => handleDragStart(e, issue.id)}
              onDragEnd={() => {
                setDraggedIssueId(null);
                setDragOverIssueId(null);
                setDragPosition(null);
              }}
              onDragOver={(e) => handleIssueDragOver(e, issue.id)}
              onDragLeave={(e) => handleIssueDragLeave(e, issue.id)}
              onDrop={(e) => handleIssueDrop(e, issue.id, null)}
              onClick={() => onIssueClick(issue)}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-zinc-800/90 hover:bg-slate-50 dark:hover:bg-zinc-800 border rounded-xl transition shadow-xs group gap-2 relative ${
                isViewer ? "cursor-pointer" : "cursor-grab active:cursor-grabbing hover:border-red-300 dark:hover:border-red-800"
              } ${draggedIssueId === issue.id ? "opacity-40" : ""} ${
                dragOverIssueId === issue.id && dragPosition === "before"
                  ? "border-t-2 border-t-[#EE0033] bg-rose-50/20 dark:bg-rose-950/20"
                  : dragOverIssueId === issue.id && dragPosition === "after"
                  ? "border-b-2 border-b-[#EE0033] bg-rose-50/20 dark:bg-rose-950/20"
                  : "border-slate-200 dark:border-zinc-700/80"
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {!isViewer && (
                  <button
                    type="button"
                    onClick={(e) => toggleSelectIssue(issue.id, e)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition shrink-0"
                  >
                    {selectedIssueIds.includes(issue.id) ? (
                      <CheckSquare className="w-4 h-4 text-[#EE0033]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                )}
                {!isViewer && (
                  <span className="hidden sm:inline-flex text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 dark:group-hover:text-zinc-400 cursor-grab shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 font-mono group-hover:text-[#EE0033] transition shrink-0">{issue.key}</span>
                <span className="text-xs text-gray-900 dark:text-zinc-100 font-medium truncate">{issue.title}</span>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 shrink-0 pl-7 sm:pl-0">
                {/* Quick Move Dropdown */}
                {!isViewer && (
                  <select
                    value=""
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onMoveIssueToSprint(issue.id, e.target.value)}
                    className="text-[11px] bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 text-slate-700 dark:text-zinc-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition focus:opacity-100"
                  >
                    <option value="" disabled className="dark:bg-zinc-800">
                      Gán vào Sprint...
                    </option>
                    {activeAndPlannedSprints.map((s) => (
                      <option key={s.id} value={s.id} className="dark:bg-zinc-800">
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}

                {issue.epic && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded border transition-colors [color:var(--epic-c)] [background-color:var(--epic-bg)] [border-color:var(--epic-border)] dark:[color:var(--epic-c-dark)] dark:[background-color:var(--epic-bg-dark)] dark:[border-color:var(--epic-border-dark)]"
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

                {/* Priority Badge with Viettel & Priority Colors */}
                {(() => {
                  const p = getPriorityBadge(issue.priority);
                  return (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors shadow-2xs ${p.colorClass}`}
                      title={`Mức độ ưu tiên: ${p.label}`}
                    >
                      {p.icon}
                      <span>{p.label}</span>
                    </span>
                  );
                })()}

                <span className="text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                  {issue.status}
                </span>

                {issue.storyPoints !== undefined && (
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                    {issue.storyPoints}
                  </span>
                )}

                {issue.assignee ? (
                  <img
                    src={issue.assignee.avatar}
                    alt={issue.assignee.name}
                    className="w-5 h-5 rounded-full object-cover"
                    title={issue.assignee.name}
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                    ?
                  </span>
                )}
              </div>
            </div>
          ))}

          {backlogIssues.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400">
              Không có task tồn đọng trong Backlog.
            </div>
          )}
        </div>
      </div>
      </>
      )}
      </div>{/* end hidden md:flex desktop wrapper */}

      {/* 2. Mobile Backlog Hub (Ergonomic Touch UX on Mobile) */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        <MobileBacklogHub
          issues={issues}
          sprints={sprints}
          currentUser={currentUser}
          onIssueClick={onIssueClick}
          onCreateIssueClick={onCreateIssueClick}
          onStartSprint={onStartSprint}
          onCompleteSprint={(sprint) => setCompletingSprint(sprint)}
          onMoveIssueToSprint={onMoveIssueToSprint}
        />
      </div>

      {/* Modals */}
      <CreateSprintModal
        isOpen={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
        onCreateSprint={onCreateSprint}
      />

      <EditSprintModal
        isOpen={!!editingSprint}
        sprint={editingSprint}
        onClose={() => setEditingSprint(null)}
        onSave={handleSaveSprint}
      />

      <CompleteSprintModal
        isOpen={!!completingSprint}
        sprint={completingSprint}
        issues={completingSprint ? issues.filter((i) => i.sprintId === completingSprint.id) : []}
        onClose={() => setCompletingSprint(null)}
        onComplete={(sprintId: string) => {
          onCompleteSprint(sprintId);
          setCompletingSprint(null);
        }}
      />

      <ClosedSprintsModal
        isOpen={showClosedModal}
        sprints={sprints}
        issues={issues}
        onClose={() => setShowClosedModal(false)}
        onIssueClick={onIssueClick}
      />

      {/* Floating Smart Bulk Action Bar */}
      {selectedIssueIds.length > 0 && !isViewer && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex flex-wrap items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2 border-r border-slate-700 pr-3">
            <span className="w-5 h-5 rounded bg-[#EE0033] text-white text-xs font-bold flex items-center justify-center">
              {selectedIssueIds.length}
            </span>
            <span className="text-xs font-medium text-slate-200">đã chọn</span>
          </div>

          {/* Move to Sprint */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Chuyển:</span>
            <select
              defaultValue=""
              disabled={isBulkExecuting}
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction("MOVE_SPRINT", { sprintId: e.target.value });
                  e.target.value = "";
                }
              }}
              className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
            >
              <option value="" disabled>
                Chọn Sprint...
              </option>
              <option value="backlog">Về Backlog</option>
              {activeAndPlannedSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Change Status */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Trạng thái:</span>
            <select
              defaultValue=""
              disabled={isBulkExecuting}
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction("CHANGE_STATUS", { status: e.target.value });
                  e.target.value = "";
                }
              }}
              className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
            >
              <option value="" disabled>
                Đổi trạng thái...
              </option>
              <option value="TODO">TO DO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="IN_REVIEW">IN REVIEW</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          {/* Assign User */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Gán:</span>
            <select
              defaultValue=""
              disabled={isBulkExecuting}
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction("ASSIGN", {
                    assigneeId: e.target.value === "none" ? null : e.target.value,
                  });
                  e.target.value = "";
                }
              }}
              className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
            >
              <option value="" disabled>
                Phân công...
              </option>
              <option value="none">Bỏ gán (Unassigned)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delete action */}
          {canManageSprints && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIssueIds.length} công việc đã chọn?`
                  )
                ) {
                  handleBulkAction("DELETE", {});
                }
              }}
              disabled={isBulkExecuting}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1 rounded transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          )}

          {/* Clear button */}
          <button
            onClick={() => setSelectedIssueIds([])}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            title="Bỏ chọn tất cả"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { Issue, Sprint, User } from "@/types/jira";
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
} from "lucide-react";
import { CreateSprintModal } from "./CreateSprintModal";
import { EditSprintModal } from "./EditSprintModal";
import { CompleteSprintModal } from "./CompleteSprintModal";
import { ClosedSprintsModal } from "./ClosedSprintsModal";

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
  onRefresh,
}) => {
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);

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
  const canManageSprints = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD";

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

  const handleDrop = (e: React.DragEvent, targetSprintId: string | null) => {
    if (isViewer) return;
    e.preventDefault();
    setDragOverContainerId(null);
    const issueId = draggedIssueId || e.dataTransfer.getData("text/plain");
    if (!issueId) return;

    onMoveIssueToSprint(issueId, targetSprintId);
    setDraggedIssueId(null);
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
    <div className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Kế Hoạch Chu Kỳ</span>
            <span className="text-xs bg-slate-900 text-white font-black px-2 py-0.5 rounded-md shadow-2xs">
              TamTask
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập kế hoạch và phân bổ công việc theo các chu kỳ phát hành sản phẩm
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {completedSprints.length > 0 && (
            <button
              onClick={() => setShowClosedModal(true)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5 transition shadow-xs"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Lịch sử Sprint đã đóng ({completedSprints.length})</span>
            </button>
          )}

          {canManageSprints && (
            <button
              onClick={() => setIsCreateSprintOpen(true)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Tạo Sprint</span>
            </button>
          )}
          {!isViewer && (
            <button
              onClick={onCreateIssueClick}
              className="bg-[#079455] hover:bg-[#06854D] text-white text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Issue</span>
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
            className={`bg-white rounded-lg border shadow-xs overflow-hidden transition-all ${
              isOver
                ? "border-[#079455]/60 ring-2 ring-rose-200 ring-dashed bg-rose-50/20"
                : "border-slate-200"
            }`}
          >
            {/* Sprint Header */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                {!isViewer && sprintIssues.length > 0 && (
                  <button
                    onClick={() => handleSelectAllInSprint(sprintIssues)}
                    className="p-1 text-slate-400 hover:text-slate-700 transition"
                    title="Chọn tất cả trong Sprint"
                  >
                    {sprintIssues.length > 0 && sprintIssues.every((i) => selectedIssueIds.includes(i.id)) ? (
                      <CheckSquare className="w-4 h-4 text-[#079455]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                )}
                <span className="font-semibold text-sm text-slate-800">{sprint.name}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    sprint.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {sprint.status === "ACTIVE" ? "Đang diễn ra" : "Kế hoạch"}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {sprint.startDate || "Chưa đặt"} ~ {sprint.endDate || "Chưa đặt"}
                  </span>
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200/80 font-mono">
                  {sprintIssues.length} issues · {totalPoints} pts
                </span>
                {canManageSprints && (
                  sprint.status === "ACTIVE" ? (
                    <button
                      onClick={() => setCompletingSprint(sprint)}
                      className="text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-3 py-1.5 rounded-md transition flex items-center gap-1 border border-slate-200"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hoàn thành Sprint</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartSprint(sprint.id)}
                      className="text-xs font-medium bg-[#079455] hover:bg-[#06854D] text-white px-3 py-1.5 rounded-md transition flex items-center gap-1 shadow-xs"
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
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition"
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
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Xóa Sprint rác (chuyển task về Backlog)"
                  >
                    <Trash2 className="w-4 h-4" />
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
                  onDragEnd={() => setDraggedIssueId(null)}
                  onClick={() => onIssueClick(issue)}
                  className={`flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-md transition shadow-xs group ${
                    isViewer ? "cursor-pointer" : "cursor-grab active:cursor-grabbing hover:border-red-300"
                  } ${draggedIssueId === issue.id ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center space-x-3">
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={(e) => toggleSelectIssue(issue.id, e)}
                        className="text-slate-400 hover:text-slate-700 transition"
                      >
                        {selectedIssueIds.includes(issue.id) ? (
                          <CheckSquare className="w-4 h-4 text-[#079455]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {!isViewer && (
                      <span className="text-gray-300 group-hover:text-gray-500 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-700 font-mono group-hover:text-[#079455] transition">{issue.key}</span>
                    <span className="text-xs text-gray-900 font-medium">{issue.title}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Quick Move Dropdown */}
                    {!isViewer && (
                      <select
                        value={issue.sprintId || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onMoveIssueToSprint(issue.id, e.target.value || null)}
                        className="text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-700 opacity-0 group-hover:opacity-100 transition focus:opacity-100"
                      >
                        <option value="">Chuyển về Backlog</option>
                        {activeAndPlannedSprints.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {issue.epic && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${issue.epic.color}15`,
                          color: issue.epic.color,
                        }}
                      >
                        {issue.epic.name}
                      </span>
                    )}

                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {issue.status}
                    </span>

                    {issue.storyPoints !== undefined && (
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
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
        className={`bg-white rounded-lg border shadow-xs overflow-hidden transition-all ${
          dragOverContainerId === "backlog"
            ? "border-[#079455]/60 ring-2 ring-rose-200 ring-dashed bg-rose-50/20"
            : "border-slate-200"
        }`}
      >
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isViewer && backlogIssues.length > 0 && (
              <button
                onClick={handleSelectAllInBacklog}
                className="p-1 text-slate-400 hover:text-slate-700 transition"
                title="Chọn tất cả trong Backlog"
              >
                {backlogIssues.length > 0 && backlogIssues.every((i) => selectedIssueIds.includes(i.id)) ? (
                  <CheckSquare className="w-4 h-4 text-[#079455]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            <span className="font-semibold text-sm text-slate-800">Backlog</span>
            <span className="text-xs text-slate-500 font-mono">
              {backlogIssues.length} issues · {backlogTotalPoints} story points
            </span>
          </div>
          {!isViewer && (
            <button
              onClick={onCreateIssueClick}
              className="text-xs font-medium text-[#079455] hover:text-[#06854D] flex items-center gap-1 transition"
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
              onDragEnd={() => setDraggedIssueId(null)}
              onClick={() => onIssueClick(issue)}
              className={`flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-md transition shadow-xs group ${
                isViewer ? "cursor-pointer" : "cursor-grab active:cursor-grabbing hover:border-red-300"
              } ${draggedIssueId === issue.id ? "opacity-40" : ""}`}
            >
              <div className="flex items-center space-x-3">
                {!isViewer && (
                  <button
                    type="button"
                    onClick={(e) => toggleSelectIssue(issue.id, e)}
                    className="text-slate-400 hover:text-slate-700 transition"
                  >
                    {selectedIssueIds.includes(issue.id) ? (
                      <CheckSquare className="w-4 h-4 text-[#079455]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                )}
                {!isViewer && (
                  <span className="text-gray-300 group-hover:text-gray-500 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-700 font-mono group-hover:text-[#079455] transition">{issue.key}</span>
                <span className="text-xs text-gray-900 font-medium">{issue.title}</span>
              </div>

              <div className="flex items-center space-x-3">
                {/* Quick Move Dropdown */}
                {!isViewer && (
                  <select
                    value=""
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onMoveIssueToSprint(issue.id, e.target.value)}
                    className="text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-700 opacity-0 group-hover:opacity-100 transition focus:opacity-100"
                  >
                    <option value="" disabled>
                      Gán vào Sprint...
                    </option>
                    {activeAndPlannedSprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}

                {issue.epic && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${issue.epic.color}15`,
                      color: issue.epic.color,
                    }}
                  >
                    {issue.epic.name}
                  </span>
                )}

                <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {issue.status}
                </span>

                {issue.storyPoints !== undefined && (
                  <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
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
            <span className="w-5 h-5 rounded bg-[#079455] text-white text-xs font-bold flex items-center justify-center">
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
              className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#079455]"
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
              className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#079455]"
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
              className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#079455]"
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

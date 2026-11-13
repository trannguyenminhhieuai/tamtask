"use client";

import React, { useState, useMemo } from "react";
import { Issue, IssueStatus, FilterState, User, Epic, Sprint, WorkflowStatus } from "@/types/jira";
import { IssueCard } from "./IssueCard";
import {
  Filter,
  X,
  ShieldAlert,
  Sparkles,
  Check,
  ChevronDown,
  Sliders,
  AlertTriangle,
  Layers,
  Bug,
  Clock,
  UserCheck,
  Zap,
  FolderGit2,
} from "lucide-react";
import { mouse1 } from "@/lib/mouse1";

interface KanbanBoardProps {
  issues: Issue[];
  users: User[];
  epics: Epic[];
  sprints: Sprint[];
  statuses: WorkflowStatus[];
  currentUser: User;
  isLoading?: boolean;
  onIssueClick: (issue: Issue) => void;
  onUpdateIssueStatus: (issueId: string, newStatus: IssueStatus) => void;
  onCreateInStatus: (status: IssueStatus) => void;
  onQuickCreateIssue?: (title: string, status: IssueStatus) => void;
  onOpenWorkflowSettings: () => void;
  onOpenEpicSettings?: () => void;
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  issues,
  users,
  epics,
  sprints,
  statuses,
  currentUser,
  isLoading = false,
  onIssueClick,
  onUpdateIssueStatus,
  onCreateInStatus,
  onQuickCreateIssue,
  onOpenWorkflowSettings,
  onOpenEpicSettings,
  filterState,
  onFilterChange,
}) => {
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<IssueStatus | null>(null);
  const [gateWarning, setGateWarning] = useState<string | null>(null);
  const [swimlaneMode, setSwimlaneMode] = useState<"NONE" | "EPIC" | "ASSIGNEE" | "EXPEDITE">("NONE");
  const [quickFilter, setQuickFilter] = useState<"ALL" | "BUGS" | "RECENT" | "UNASSIGNED">("ALL");
  const [quickAddStatus, setQuickAddStatus] = useState<IssueStatus | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [showAssigneeOverflow, setShowAssigneeOverflow] = useState(false);

  // Active sprint computation (Sprint with status === "ACTIVE")
  const activeSprint = useMemo(() => {
    return sprints.find((s) => s.status === "ACTIVE");
  }, [sprints]);

  // Selected Sprint ID: Default to activeSprint?.id, fallback to first sprint or "ALL"
  const effectiveSprintId = useMemo(() => {
    if (filterState.sprintId !== undefined && filterState.sprintId !== "") {
      return filterState.sprintId;
    }
    return activeSprint?.id || (sprints.length > 0 ? sprints[0].id : "ALL");
  }, [filterState.sprintId, activeSprint, sprints]);

  // Apply filters (including Quick Filter Pills & Sprint Selector)
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // 1. Quick Filters
      if (quickFilter === "BUGS" && issue.type !== "BUG" && issue.priority !== "HIGHEST") {
        return false;
      }
      if (quickFilter === "UNASSIGNED" && issue.assignee) {
        return false;
      }
      if (quickFilter === "RECENT") {
        const updatedTime = new Date(issue.updatedAt || issue.createdAt).getTime();
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (updatedTime < oneDayAgo) return false;
      }

      // 2. Search query
      if (filterState.searchQuery) {
        const q = filterState.searchQuery.toLowerCase();
        const match =
          issue.title.toLowerCase().includes(q) ||
          issue.key.toLowerCase().includes(q) ||
          (issue.description && issue.description.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 3. Only my issues
      if (filterState.onlyMyIssues && issue.assignee?.id !== currentUser.id) {
        return false;
      }

      // 4. Assignee filter
      if (
        filterState.assigneeIds.length > 0 &&
        (!issue.assignee || !filterState.assigneeIds.includes(issue.assignee.id))
      ) {
        return false;
      }

      // 5. Epic filter
      if (
        filterState.epicIds.length > 0 &&
        (!issue.epic || !filterState.epicIds.includes(issue.epic.id))
      ) {
        return false;
      }

      // 6. Sprint filter (Default to active sprint, or user-selected sprint)
      if (effectiveSprintId && effectiveSprintId !== "ALL") {
        if (effectiveSprintId === "BACKLOG") {
          if (issue.sprintId) return false;
        } else if (issue.sprintId !== effectiveSprintId) {
          return false;
        }
      }

      return true;
    });
  }, [issues, quickFilter, filterState, effectiveSprintId, currentUser.id]);

  // Swimlanes Grouping
  const swimlanes = useMemo(() => {
    if (swimlaneMode === "NONE") {
      return [{ id: "default", title: "", issues: filteredIssues }];
    }

    if (swimlaneMode === "EPIC") {
      const groups: Array<{ id: string; title: string; color?: string; issues: Issue[] }> = [];
      epics.forEach((epic) => {
        const epicIssues = filteredIssues.filter((i) => i.epic?.id === epic.id);
        groups.push({ id: epic.id, title: epic.name, color: epic.color, issues: epicIssues });
      });
      const noEpicIssues = filteredIssues.filter((i) => !i.epic);
      if (noEpicIssues.length > 0) {
        groups.push({ id: "no-epic", title: "Tasks without Epic", color: "#6B778C", issues: noEpicIssues });
      }
      return groups;
    }

    if (swimlaneMode === "ASSIGNEE") {
      const groups: Array<{ id: string; title: string; avatar?: string; role?: string; issues: Issue[] }> = [];
      users.forEach((user) => {
        const userIssues = filteredIssues.filter((i) => i.assignee?.id === user.id);
        groups.push({ id: user.id, title: user.name, avatar: user.avatar, role: user.role, issues: userIssues });
      });
      const unassignedIssues = filteredIssues.filter((i) => !i.assignee);
      if (unassignedIssues.length > 0) {
        groups.push({ id: "unassigned", title: "Unassigned Tasks", issues: unassignedIssues });
      }
      return groups;
    }

    if (swimlaneMode === "EXPEDITE") {
      const expediteIssues = filteredIssues.filter(
        (i) => i.priority === "HIGHEST" || i.type === "BUG"
      );
      const standardIssues = filteredIssues.filter(
        (i) => i.priority !== "HIGHEST" && i.type !== "BUG"
      );
      return [
        { id: "expedite", title: "⚡ Expedite / Khẩn Cấp (Highest Priority & Critical Bugs)", isExpedite: true, issues: expediteIssues },
        { id: "standard", title: "Công việc tiêu chuẩn (Standard Issues)", issues: standardIssues },
      ];
    }

    return [{ id: "default", title: "", issues: filteredIssues }];
  }, [swimlaneMode, filteredIssues, epics, users]);

  // Scoped project users for assignee filter
  const projectUsers = useMemo(() => {
    const assignedIds = new Set(issues.map((i) => i.assignee?.id).filter(Boolean) as string[]);
    assignedIds.add(currentUser.id);
    const matched = users.filter((u) => assignedIds.has(u.id));
    return matched.length > 0 ? matched : users;
  }, [users, issues, currentUser.id]);

  const visibleUsers = useMemo(() => projectUsers.slice(0, 4), [projectUsers]);
  const overflowUsers = useMemo(() => projectUsers.slice(4), [projectUsers]);

  const toggleAssigneeFilter = (userId: string) => {
    const exists = filterState.assigneeIds.includes(userId);
    const newIds = exists
      ? filterState.assigneeIds.filter((id) => id !== userId)
      : [...filterState.assigneeIds, userId];
    onFilterChange({ ...filterState, assigneeIds: newIds });
  };

  const isViewer = currentUser.role === "VIEWER";
  const canCustomizeWorkflow = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD";

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    if (isViewer) return;
    setDraggedIssueId(issueId);
    e.dataTransfer.setData("text/plain", issueId);
  };

  const handleDragOver = (e: React.DragEvent, colId: IssueStatus) => {
    if (isViewer) return;
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: IssueStatus) => {
    if (isViewer) return;
    e.preventDefault();
    setDragOverCol(null);
    const issueId = draggedIssueId || e.dataTransfer.getData("text/plain");
    if (!issueId) return;

    const issue = issues.find((i) => i.id === issueId);
    if (!issue || issue.status === targetStatus) return;

    // Call Mouse-1 Transition Gate verification
    const gateCheck = await mouse1.evaluateTransitionGate({
      issueKey: issue.key,
      fromStatus: issue.status,
      toStatus: targetStatus,
      hasSubtasks: issue.subtasks.length > 0,
      allSubtasksDone: issue.subtasks.every((s) => s.isCompleted),
      hasPrLink: !!issue.prLink,
      descriptionLength: issue.description?.length || 0,
    });

    if (!gateCheck.decision.allowed) {
      setGateWarning(gateCheck.decision.reason);
      setTimeout(() => setGateWarning(null), 5000);
      return;
    }

    // Check WIP limit warning
    const targetCol = statuses.find((s) => s.id === targetStatus);
    if (targetCol && typeof targetCol.maxWip === "number" && targetCol.maxWip > 0) {
      const currentCount = issues.filter((i) => i.status === targetStatus && i.id !== issueId).length;
      if (currentCount + 1 > targetCol.maxWip) {
        setGateWarning(
          `[Kanban WIP Alert]: Cột "${targetCol.name}" đã vượt quá giới hạn WIP (${currentCount + 1}/${targetCol.maxWip}). Đề xuất giải phóng task cũ trước!`
        );
        setTimeout(() => setGateWarning(null), 6000);
      }
    }

    onUpdateIssueStatus(issueId, targetStatus);
    setDraggedIssueId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Top Filter Bar */}
      <div className="px-6 py-2.5 border-b border-[#D7D7D7] bg-[#F8F8F8] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Only My Issues Button */}
          <button
            onClick={() => onFilterChange({ ...filterState, onlyMyIssues: !filterState.onlyMyIssues })}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              filterState.onlyMyIssues
                ? "bg-[#EE0033] text-white shadow-xs"
                : "bg-white text-[#111827] border border-[#D7D7D7] hover:bg-slate-50"
            }`}
          >
            {filterState.onlyMyIssues && <Check className="w-3.5 h-3.5" />}
            <span>Công việc của tôi</span>
          </button>

          {/* Quick Filter Pills */}
          <div className="flex items-center space-x-1 border-l border-[#D7D7D7] pl-2">
            <button
              onClick={() => setQuickFilter((prev) => (prev === "BUGS" ? "ALL" : "BUGS"))}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                quickFilter === "BUGS"
                  ? "bg-rose-50 text-rose-800 border border-rose-300 font-semibold"
                  : "bg-white text-[#111827] border border-[#D7D7D7] hover:bg-slate-50"
              }`}
            >
              <Bug className="w-3 h-3 text-rose-600" />
              <span>Lỗi / Bugs</span>
            </button>

            <button
              onClick={() => setQuickFilter((prev) => (prev === "RECENT" ? "ALL" : "RECENT"))}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                quickFilter === "RECENT"
                  ? "bg-emerald-50 text-[#EE0033] border border-emerald-300 font-semibold"
                  : "bg-white text-[#111827] border border-[#D7D7D7] hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3 h-3 text-[#EE0033]" />
              <span>Mới cập nhật</span>
            </button>

            <button
              onClick={() => setQuickFilter((prev) => (prev === "UNASSIGNED" ? "ALL" : "UNASSIGNED"))}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                quickFilter === "UNASSIGNED"
                  ? "bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                  : "bg-white text-[#111827] border border-[#D7D7D7] hover:bg-slate-50"
              }`}
            >
              <UserCheck className="w-3 h-3 text-amber-600" />
              <span>Chưa ai nhận</span>
            </button>
          </div>

          {/* Assignee Avatar Group with +N overflow */}
          <div className="flex items-center -space-x-1 pl-2">
            {visibleUsers.map((user) => {
              const isSelected = filterState.assigneeIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleAssigneeFilter(user.id)}
                  title={`Lọc theo ${user.name}`}
                  className={`w-7 h-7 rounded-full transition-transform relative ${
                    isSelected ? "ring-2 ring-[#EE0033] scale-110 z-10" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </button>
              );
            })}

            {overflowUsers.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAssigneeOverflow(!showAssigneeOverflow)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-[#D7D7D7] text-[11px] font-bold text-slate-700 flex items-center justify-center transition-transform hover:scale-105 ml-1"
                  title="Xem thêm nhân sự dự án"
                >
                  +{overflowUsers.length}
                </button>

                {showAssigneeOverflow && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Nhân sự dự án
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {overflowUsers.map((u) => {
                        const isSelected = filterState.assigneeIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => toggleAssigneeFilter(u.id)}
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition ${
                              isSelected ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                              <span className="truncate">{u.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sprint Filter Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 bg-white border border-[#D7D7D7] rounded-lg px-2.5 py-1.5 text-xs shadow-2xs hover:border-[#EE0033]/40 transition">
              <Layers className="w-3.5 h-3.5 text-[#EE0033] shrink-0" />
              <span className="font-bold text-slate-500 hidden sm:inline">Sprint:</span>
              <select
                value={effectiveSprintId}
                onChange={(e) =>
                  onFilterChange({
                    ...filterState,
                    sprintId: e.target.value,
                  })
                }
                className="bg-transparent text-xs font-semibold text-[#111827] focus:outline-none cursor-pointer pr-1"
              >
                {/* Active Sprint (Highlighted / First) */}
                {activeSprint && (
                  <option value={activeSprint.id} className="font-bold text-[#EE0033]">
                    🏃 {activeSprint.name} (Đang chạy)
                  </option>
                )}

                {/* Planned Sprints */}
                {sprints
                  .filter((s) => s.status === "PLANNED" && s.id !== activeSprint?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      📋 {s.name} (Kế hoạch)
                    </option>
                  ))}

                {/* Completed Sprints */}
                {sprints
                  .filter((s) => s.status === "COMPLETED" && s.id !== activeSprint?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      ✓ {s.name} (Đã hoàn thành)
                    </option>
                  ))}

                {/* Other Options */}
                <option value="ALL">🌐 Tất cả chu kỳ (Tất cả task)</option>
                <option value="BACKLOG">📦 Chỉ Backlog (Chưa gán chu kỳ)</option>
              </select>
            </div>
          </div>

          {/* Selected Sprint Status Badge */}
          {(() => {
            const selectedSprint = sprints.find((s) => s.id === effectiveSprintId);
            if (!selectedSprint) return null;
            return (
              <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-medium">
                {selectedSprint.status === "ACTIVE" ? (
                  <span className="bg-rose-50 text-[#EE0033] border border-rose-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EE0033] animate-pulse" />
                    Đang chạy
                  </span>
                ) : selectedSprint.status === "COMPLETED" ? (
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-semibold">
                    ✓ Đã đóng
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                    Kế hoạch
                  </span>
                )}
                {(selectedSprint.startDate || selectedSprint.endDate) && (
                  <span className="text-slate-400">
                    ({selectedSprint.startDate || "?"} ~ {selectedSprint.endDate || "?"})
                  </span>
                )}
              </div>
            );
          })()}

          {/* Epic Filter Dropdown */}
          <div className="relative">
            <select
              value={filterState.epicIds[0] || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  epicIds: e.target.value ? [e.target.value] : [],
                })
              }
              className="text-xs bg-white border border-[#D7D7D7] rounded-lg px-2.5 py-1.5 text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
            >
              <option value="">All Epics</option>
              {epics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filter Button */}
          {(filterState.searchQuery ||
            filterState.onlyMyIssues ||
            quickFilter !== "ALL" ||
            filterState.assigneeIds.length > 0 ||
            filterState.epicIds.length > 0 ||
            (filterState.sprintId && filterState.sprintId !== (activeSprint?.id || ""))) && (
            <button
              onClick={() => {
                setQuickFilter("ALL");
                onFilterChange({
                  searchQuery: "",
                  assigneeIds: [],
                  epicIds: [],
                  priorities: [],
                  sprintId: activeSprint?.id || "",
                  onlyMyIssues: false,
                });
              }}
              className="text-xs text-[#9B9B9B] hover:text-[#EE0033] flex items-center gap-1 transition px-2 py-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Right side: Swimlane Switcher, Sprint Info & Workflow Customizer */}
        <div className="flex items-center space-x-3">
          {/* Swimlane Mode Selector */}
          <div className="flex items-center space-x-1.5 text-xs text-gray-600">
            <span className="font-semibold text-gray-500">Phân làn:</span>
            <select
              value={swimlaneMode}
              onChange={(e) => setSwimlaneMode(e.target.value as any)}
              className="bg-white border border-[#D7D7D7] rounded-lg px-2.5 py-1.5 font-medium text-[#111827] text-xs focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
            >
              <option value="NONE">Mặc định (Cột chuẩn)</option>
              <option value="EPIC">Theo Epic</option>
              <option value="ASSIGNEE">Theo Thành viên</option>
              <option value="EXPEDITE">⚡ Khẩn cấp (Expedite)</option>
            </select>
          </div>

          {canCustomizeWorkflow && (
            <button
              onClick={onOpenWorkflowSettings}
              className="text-xs font-medium bg-white border border-[#D7D7D7] hover:bg-[#F8F8F8] text-[#111827] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs"
              title="Tùy biến các cột trạng thái Kanban"
            >
              <Sliders className="w-3.5 h-3.5 text-[#9B9B9B]" />
              <span>Quy trình (Workflow)</span>
            </button>
          )}

          {canCustomizeWorkflow && onOpenEpicSettings && (
            <button
              onClick={onOpenEpicSettings}
              className="text-xs font-medium bg-white border border-[#D7D7D7] hover:bg-[#F8F8F8] text-[#111827] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs"
              title="Quản lý và cấu hình màu sắc Epic"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Quản lý Epic</span>
            </button>
          )}
        </div>
      </div>

      {/* Rule Validation Warning Toast */}
      {gateWarning && (
        <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-md flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-medium">{gateWarning}</span>
          </div>
          <button onClick={() => setGateWarning(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Board Columns & Swimlanes Container */}
      <div className="flex-1 overflow-auto p-6 space-y-6 bg-white">
        {isLoading ? (
          <div className="grid grid-flow-col auto-cols-[300px] gap-4 min-h-[500px]">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#F8F8F8] rounded-lg p-3 flex flex-col space-y-3 animate-pulse border border-[#D7D7D7]">
                <div className="flex items-center justify-between pb-2 border-b border-[#D7D7D7]">
                  <div className="h-4 bg-slate-300 rounded w-28"></div>
                  <div className="h-4 bg-slate-300 rounded-full w-6"></div>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="h-24 bg-white rounded-lg shadow-xs p-3 space-y-2 border border-[#D7D7D7]">
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                    <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                  <div className="h-20 bg-white rounded-lg shadow-xs p-3 space-y-2 border border-[#D7D7D7]">
                    <div className="h-4 bg-slate-300 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-24 bg-white rounded-lg shadow-xs p-3 space-y-2 border border-[#D7D7D7]">
                    <div className="h-3 bg-slate-200 rounded w-12"></div>
                    <div className="h-4 bg-slate-300 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          swimlanes.map((lane) => {
          return (
            <div key={lane.id} className="space-y-3">
              {/* Swimlane Header (Hidden if swimlaneMode is NONE) */}
              {swimlaneMode !== "NONE" && (
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-bold ${
                    (lane as any).isExpedite
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-xs"
                      : "bg-[#F8F8F8] border-[#D7D7D7] text-[#111827] shadow-2xs"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {(lane as any).color && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: (lane as any).color }}
                      />
                    )}
                    {(lane as any).avatar && (
                      <img
                        src={(lane as any).avatar}
                        alt={lane.title}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    {(lane as any).isExpedite && (
                      <Zap className="w-4 h-4 text-[#EE0033] fill-red-100" />
                    )}
                    <span>{lane.title}</span>
                    <span className="text-[10px] bg-white border border-[#D7D7D7] text-[#111827] font-semibold px-2 py-0.5 rounded-full">
                      {lane.issues.length} issues
                    </span>
                  </div>

                  <span className="text-[11px] text-[#9B9B9B] font-normal">
                    {lane.issues.reduce((s, i) => s + (i.storyPoints || 0), 0)} pts
                  </span>
                </div>
              )}

              {/* Status Columns Grid */}
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {statuses.map((col) => {
                  const colIssues = lane.issues.filter((i) => i.status === col.id);
                  const totalPoints = colIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
                  const isOver = dragOverCol === col.id;
                  const hasWip = typeof col.maxWip === "number" && col.maxWip > 0;
                  const isWipExceeded = hasWip && colIssues.length > (col.maxWip || 0);
                  const isWipMax = hasWip && colIssues.length === (col.maxWip || 0);

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => handleDragOver(e, col.id)}
                      onDrop={(e) => handleDrop(e, col.id)}
                      className={`w-72 flex-shrink-0 flex flex-col rounded-lg transition-all border ${
                        isOver
                          ? "bg-rose-50/60 border-2 border-dashed border-[#EE0033]"
                          : isWipExceeded
                          ? "bg-rose-50/70 border-rose-300 shadow-sm"
                          : "bg-[#F8F8F8] border-[#D7D7D7]"
                      }`}
                    >
                      {/* Column Header */}
                      <div className="p-3 pb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: col.color }}
                          />
                          <span className="text-xs font-bold text-[#111827] tracking-wider uppercase truncate">
                            {col.name}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                              isWipExceeded
                                ? "bg-[#EE0033] text-white"
                                : isWipMax
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-white border border-[#D7D7D7] text-[#111827]"
                            }`}
                            title={hasWip ? `Giới hạn WIP: ${colIssues.length}/${col.maxWip}` : undefined}
                          >
                            <span>{hasWip ? `${colIssues.length}/${col.maxWip}` : colIssues.length}</span>
                            {isWipExceeded && (
                              <AlertTriangle className="w-3 h-3 text-white inline-block animate-pulse" />
                            )}
                          </span>
                        </div>
                        {totalPoints > 0 && (
                          <span className="text-[10px] font-semibold text-[#9B9B9B]" title="Total Story Points">
                            {totalPoints} pts
                          </span>
                        )}
                      </div>

                      {/* Column Cards List */}
                      <div className="flex-1 p-2 pt-0 space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)]">
                        {dragOverCol === col.id && (
                          <div className="h-16 border-2 border-dashed border-[#EE0033] bg-rose-50/80 rounded-lg flex items-center justify-center text-xs font-semibold text-[#EE0033] animate-pulse">
                            Thả thẻ vào cột {col.name}...
                          </div>
                        )}

                        {colIssues.map((issue) => (
                          <IssueCard
                            key={issue.id}
                            issue={issue}
                            isDraggable={!isViewer}
                            onClick={() => onIssueClick(issue)}
                            onDragStart={(e) => handleDragStart(e, issue.id)}
                          />
                        ))}

                        {colIssues.length === 0 && dragOverCol !== col.id && (
                          <div className="h-16 border-2 border-dashed border-gray-300/80 rounded-xl flex items-center justify-center text-xs text-gray-400">
                            Trống
                          </div>
                        )}
                      </div>

                      {/* Quick Add Button at bottom of column (Hidden for VIEWER) */}
                      {!isViewer && (
                        <div className="p-2 pt-0">
                          {quickAddStatus === col.id ? (
                            <div className="bg-white p-2.5 rounded-lg border border-[#EE0033]/50 shadow-xs space-y-2 animate-in fade-in duration-100">
                              <textarea
                                autoFocus
                                rows={2}
                                value={quickAddTitle}
                                onChange={(e) => setQuickAddTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (quickAddTitle.trim()) {
                                      if (onQuickCreateIssue) {
                                        onQuickCreateIssue(quickAddTitle.trim(), col.id);
                                      } else {
                                        onCreateInStatus(col.id);
                                      }
                                      setQuickAddTitle("");
                                      setQuickAddStatus(null);
                                    }
                                  } else if (e.key === "Escape") {
                                    setQuickAddStatus(null);
                                    setQuickAddTitle("");
                                  }
                                }}
                                placeholder="Nhập tiêu đề công việc... (Enter để tạo, Esc hủy)"
                                className="w-full text-xs p-2 border border-[#D7D7D7] rounded-lg outline-none focus:border-[#EE0033] focus:ring-2 focus:ring-[#EE0033]/20 resize-none font-medium text-[#111827]"
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (quickAddTitle.trim()) {
                                        if (onQuickCreateIssue) {
                                          onQuickCreateIssue(quickAddTitle.trim(), col.id);
                                        } else {
                                          onCreateInStatus(col.id);
                                        }
                                        setQuickAddTitle("");
                                        setQuickAddStatus(null);
                                      }
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white rounded-lg shadow-xs transition"
                                  >
                                    Thêm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickAddStatus(null);
                                      setQuickAddTitle("");
                                    }}
                                    className="px-2.5 py-1.5 text-xs text-[#9B9B9B] hover:text-[#111827] rounded-lg transition"
                                  >
                                    Hủy
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  title="Mở form chi tiết đầy đủ"
                                  onClick={() => {
                                    setQuickAddStatus(null);
                                    onCreateInStatus(col.id);
                                  }}
                                  className="text-[11px] text-[#9B9B9B] hover:text-[#EE0033] font-medium"
                                >
                                  Mở form...
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setQuickAddStatus(col.id);
                                setQuickAddTitle("");
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-[#111827] hover:bg-white rounded-lg border border-transparent hover:border-[#D7D7D7] transition font-medium flex items-center gap-1.5"
                            >
                              <span className="text-sm font-bold leading-none text-[#EE0033]">+</span> Tạo nhanh công việc
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};

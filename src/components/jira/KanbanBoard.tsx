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
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isScrolledHeader, setIsScrolledHeader] = useState(false);
  const moreFiltersRef = React.useRef<HTMLDivElement>(null);

  const handleBoardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (top > 40) {
      if (!isScrolledHeader) {
        setIsScrolledHeader(true);
        setShowMoreFilters(false);
        setShowAssigneeOverflow(false);
      }
    } else if (top <= 10) {
      if (isScrolledHeader) {
        setIsScrolledHeader(false);
      }
    }
  };

  // Close more filters on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target as Node)) {
        setShowMoreFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      assignedUsers.forEach((user) => {
        const userIssues = filteredIssues.filter((i) => i.assignee?.id === user.id);
        if (userIssues.length > 0) {
          groups.push({ id: user.id, title: user.name, avatar: user.avatar, role: user.role, issues: userIssues });
        }
      });
      const unassignedIssues = filteredIssues.filter((i) => !i.assignee);
      if (unassignedIssues.length > 0) {
        groups.push({ id: "unassigned", title: "Chưa phân công (Unassigned)", issues: unassignedIssues });
      }
      return groups.length > 0 ? groups : [{ id: "default", title: "", issues: filteredIssues }];
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

  // Only users who are actually assigned to at least one task in this project
  const assignedUsers = useMemo(() => {
    const userMap = new Map<string, User>();
    issues.forEach((issue) => {
      if (issue.assignee && issue.assignee.id) {
        if (!userMap.has(issue.assignee.id)) {
          const fullUser = users.find((u) => u.id === issue.assignee?.id) || issue.assignee;
          userMap.set(issue.assignee.id, fullUser);
        }
      }
    });
    return Array.from(userMap.values());
  }, [issues, users]);

  const visibleUsers = useMemo(() => assignedUsers.slice(0, 4), [assignedUsers]);
  const overflowUsers = useMemo(() => assignedUsers.slice(4), [assignedUsers]);

  const toggleAssigneeFilter = (userId: string) => {
    const exists = filterState.assigneeIds.includes(userId);
    const newIds = exists
      ? filterState.assigneeIds.filter((id) => id !== userId)
      : [...filterState.assigneeIds, userId];
    onFilterChange({ ...filterState, assigneeIds: newIds });
  };

  const isViewer = currentUser.role === "VIEWER";
  const canCustomizeWorkflow = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD" || currentUser.role === "BA";

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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6F8] dark:bg-[#09090B] transition-colors duration-200">
      {/* Unified Glass Island Header - Smoothly collapses up on scroll to optimize vertical workspace */}
      <div
        className={`relative z-20 transition-all duration-300 ease-in-out shrink-0 overflow-visible ${
          isScrolledHeader
            ? "max-h-0 opacity-0 -translate-y-4 mb-0 pointer-events-none"
            : "max-h-60 opacity-100 translate-y-0 m-4 mb-0"
        }`}
      >
        <div className="p-4 rounded-2xl bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Compact Title only (MICI: no duplicate sprint badge here) */}
        <div className="flex items-center space-x-3 shrink-0">
          <h1 className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-zinc-100 tracking-tight">
            Bảng Công Việc
          </h1>
        </div>

        {/* Center / Right: Streamlined Filters & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* My Issues Toggle */}
          <button
            onClick={() => onFilterChange({ ...filterState, onlyMyIssues: !filterState.onlyMyIssues })}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5 shadow-2xs ${
              filterState.onlyMyIssues
                ? "bg-[#EE0033] text-white shadow-xs"
                : "bg-white/80 dark:bg-zinc-800/80 text-[#111827] dark:text-zinc-200 border border-slate-200 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md"
            }`}
          >
            {filterState.onlyMyIssues && <Check className="w-3.5 h-3.5" />}
            <span>Của tôi</span>
          </button>

          {/* Quick Filter Pills */}
          <button
            onClick={() => setQuickFilter((prev) => (prev === "BUGS" ? "ALL" : "BUGS"))}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 shadow-2xs ${
              quickFilter === "BUGS"
                ? "bg-rose-50 text-rose-800 border border-rose-300 font-semibold"
                : "bg-white/80 dark:bg-zinc-800/80 text-[#111827] dark:text-zinc-200 border border-slate-200 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md"
            }`}
            title="Lọc các lỗi / Bugs và ưu tiên khẩn cấp"
          >
            <Bug className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Lỗi / Bugs</span>
          </button>

          <button
            onClick={() => setQuickFilter((prev) => (prev === "RECENT" ? "ALL" : "RECENT"))}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 shadow-2xs ${
              quickFilter === "RECENT"
                ? "bg-emerald-50 text-[#EE0033] border border-emerald-300 font-semibold"
                : "bg-white/80 dark:bg-zinc-800/80 text-[#111827] dark:text-zinc-200 border border-slate-200 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md"
            }`}
            title="Lọc các công việc vừa cập nhật 24h qua"
          >
            <Clock className="w-3.5 h-3.5 text-[#EE0033]" />
            <span className="hidden sm:inline">Mới cập nhật</span>
          </button>

          <button
            onClick={() => setQuickFilter((prev) => (prev === "UNASSIGNED" ? "ALL" : "UNASSIGNED"))}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 shadow-2xs ${
              quickFilter === "UNASSIGNED"
                ? "bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                : "bg-white/80 dark:bg-zinc-800/80 text-[#111827] dark:text-zinc-200 border border-slate-200 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md"
            }`}
            title="Lọc các task chưa phân công ai"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Chưa ai nhận</span>
          </button>

          {/* Assignee Avatar Group with +N overflow (strictly users assigned to tasks in this project) */}
          {assignedUsers.length > 0 && (
            <div className="flex items-center -space-x-1 pl-1 shrink-0">
              {visibleUsers.map((user) => {
                const isSelected = filterState.assigneeIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleAssigneeFilter(user.id)}
                    title={`Lọc theo người thực hiện: ${user.name}`}
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
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-[#D7D7D7] dark:border-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-200 flex items-center justify-center transition-transform hover:scale-105 ml-0.5"
                    title="Xem thêm người thực hiện trong dự án"
                  >
                    +{overflowUsers.length}
                  </button>

                  {showAssigneeOverflow && (
                    <div className="absolute left-0 mt-2 w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800">
                        Người được giao việc ({assignedUsers.length})
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        {overflowUsers.map((u) => {
                          const isSelected = filterState.assigneeIds.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              onClick={() => toggleAssigneeFilter(u.id)}
                              className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between text-xs transition ${
                                isSelected ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold" : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                <span className="truncate">{u.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#EE0033] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {assignedUsers.length > 0 && (
            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />
          )}

          {/* Sprint Selector (Clean, no redundant duplicate dates) */}
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-white/80 dark:border-zinc-700/80 rounded-full px-3 py-1.5 text-xs shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-[#EE0033] shrink-0" />
            <select
              value={effectiveSprintId}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  sprintId: e.target.value,
                })
              }
              className="bg-transparent text-xs font-semibold text-[#111827] dark:text-zinc-200 focus:outline-none cursor-pointer pr-1"
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-zinc-900">
                  {s.name}
                </option>
              ))}
              <option value="ALL" className="dark:bg-zinc-900">Tất cả chu kỳ</option>
              <option value="BACKLOG" className="dark:bg-zinc-900">Chỉ Backlog</option>
            </select>
          </div>

          {/* "Bộ lọc & Tuỳ chọn khác" Popover */}
          <div className="relative" ref={moreFiltersRef}>
            <button
              type="button"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition backdrop-blur-md shadow-2xs ${
                showMoreFilters || swimlaneMode !== "NONE" || filterState.epicIds.length > 0
                  ? "bg-rose-50 dark:bg-rose-950/40 text-[#EE0033] border-rose-300 dark:border-rose-800 shadow-xs"
                  : "bg-white/80 dark:bg-zinc-800/80 text-[#111827] dark:text-zinc-200 border-white/80 dark:border-zinc-700/80 hover:bg-white dark:hover:bg-zinc-700"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tuỳ chọn</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showMoreFilters && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/80 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-4">
                {/* Swimlane Options */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Phân làn hiển thị (Swimlanes)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "NONE", label: "Mặc định" },
                      { id: "EPIC", label: "Theo Epic" },
                      { id: "ASSIGNEE", label: "Thành viên" },
                      { id: "EXPEDITE", label: "⚡ Khẩn cấp" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSwimlaneMode(mode.id as any)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border text-center transition font-medium ${
                          swimlaneMode === mode.id
                            ? "bg-[#EE0033] text-white border-[#EE0033] shadow-xs"
                            : "bg-[#FAFAFA] dark:bg-zinc-800 text-[#111827] dark:text-zinc-200 border-[#D7D7D7] dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Epic Filter */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Lọc theo Epic
                  </div>
                  <select
                    value={filterState.epicIds[0] || ""}
                    onChange={(e) =>
                      onFilterChange({
                        ...filterState,
                        epicIds: e.target.value ? [e.target.value] : [],
                      })
                    }
                    className="w-full text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 rounded-xl px-3 py-2 text-[#111827] dark:text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20"
                  >
                    <option value="">Tất cả Epics</option>
                    {epics.map((epic) => (
                      <option key={epic.id} value={epic.id}>
                        {epic.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Settings Links */}
                {canCustomizeWorkflow && (
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                    <button
                      onClick={() => {
                        setShowMoreFilters(false);
                        onOpenWorkflowSettings();
                      }}
                      className="w-full text-left text-xs font-medium text-slate-700 dark:text-zinc-200 hover:text-[#EE0033] hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1.5 rounded-xl flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                        <span>Cài đặt Quy trình (Workflow)</span>
                      </span>
                    </button>

                    {onOpenEpicSettings && (
                      <button
                        onClick={() => {
                          setShowMoreFilters(false);
                          onOpenEpicSettings();
                        }}
                        className="w-full text-left text-xs font-medium text-slate-700 dark:text-zinc-200 hover:text-[#EE0033] hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1.5 rounded-xl flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-2">
                          <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Quản lý danh mục Epic</span>
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Clear Filter */}
                {(filterState.searchQuery ||
                  filterState.onlyMyIssues ||
                  quickFilter !== "ALL" ||
                  filterState.assigneeIds.length > 0 ||
                  filterState.epicIds.length > 0) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        setQuickFilter("ALL");
                        setSwimlaneMode("NONE");
                        onFilterChange({
                          searchQuery: "",
                          assigneeIds: [],
                          epicIds: [],
                          priorities: [],
                          sprintId: activeSprint?.id || "",
                          onlyMyIssues: false,
                        });
                        setShowMoreFilters(false);
                      }}
                      className="w-full text-center text-xs font-semibold text-[#EE0033] hover:underline py-1"
                    >
                      Xóa toàn bộ bộ lọc
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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

      {/* Board Columns & Swimlanes Container - Single unified vertical & bottom-pinned horizontal scroll */}
      <div
        onScroll={handleBoardScroll}
        className={`flex-1 relative z-0 overflow-x-auto overflow-y-auto px-4 pb-4 space-y-4 bg-[#F5F6F8] dark:bg-[#09090B] touch-pan-x transition-all duration-300 ${
          isScrolledHeader ? "pt-0" : "pt-4"
        }`}
      >
        {isLoading ? (
          <div className="grid grid-flow-col auto-cols-[300px] gap-4 min-h-[500px]">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#F8F8F8] dark:bg-zinc-900 rounded-xl p-3 flex flex-col space-y-3 animate-pulse border border-[#D7D7D7] dark:border-zinc-800">
                <div className="flex items-center justify-between pb-2 border-b border-[#D7D7D7] dark:border-zinc-800">
                  <div className="h-4 bg-slate-300 dark:bg-zinc-700 rounded w-28"></div>
                  <div className="h-4 bg-slate-300 dark:bg-zinc-700 rounded-full w-6"></div>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="h-24 bg-white dark:bg-zinc-800/80 rounded-lg shadow-xs p-3 space-y-2 border border-[#D7D7D7] dark:border-zinc-700/80">
                    <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-16"></div>
                    <div className="h-4 bg-slate-300 dark:bg-zinc-600 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 dark:bg-zinc-700/60 rounded w-1/2"></div>
                  </div>
                  <div className="h-20 bg-white dark:bg-zinc-800/80 rounded-lg shadow-xs p-3 space-y-2 border border-[#D7D7D7] dark:border-zinc-700/80">
                    <div className="h-4 bg-slate-300 dark:bg-zinc-600 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-1/3"></div>
                  </div>
                  <div className="h-24 bg-white dark:bg-zinc-800/80 rounded-lg shadow-xs p-3 space-y-2 border border-[#D7D7D7] dark:border-zinc-700/80">
                    <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-12"></div>
                    <div className="h-4 bg-slate-300 dark:bg-zinc-600 rounded w-4/5"></div>
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

              {/* Status Columns Grid - columns expand full height, pinned horizontal scroll at bottom */}
              <div className="flex gap-4 min-w-max pb-4 items-start">
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
                      className={`w-80 flex-shrink-0 transition-all border ${
                        isScrolledHeader ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"
                      } ${
                        isOver
                          ? "bg-rose-50/60 dark:bg-rose-950/20 border-2 border-dashed border-[#EE0033]"
                          : isWipExceeded
                          ? "bg-rose-50/70 dark:bg-rose-950/10 border-rose-300 dark:border-rose-800 shadow-sm"
                          : "bg-white dark:bg-zinc-900 border-[#E5E7EB] dark:border-zinc-800 shadow-xs"
                      }`}
                    >
                      {/* Column Header - Pinned at top when scrolling vertically */}
                      <div className={`p-4 pb-3 flex items-center justify-between sticky top-0 transition-all duration-200 z-10 border-b border-[#E5E7EB] dark:border-zinc-800 ${
                        isScrolledHeader
                          ? "rounded-t-none bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xs"
                          : "rounded-t-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md"
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: col.color }}
                          />
                          <span className="text-xs font-bold text-[#111827] dark:text-zinc-100 tracking-wider uppercase truncate">
                            {col.name}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                              isWipExceeded
                                ? "bg-[#EE0033] text-white"
                                : isWipMax
                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                : "bg-white dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 text-[#111827] dark:text-zinc-200"
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
                          <span className="text-[10px] font-semibold text-[#9B9B9B] dark:text-zinc-500" title="Total Story Points">
                            {totalPoints} pts
                          </span>
                        )}
                      </div>

                      {/* Column Cards List - 16px gap, 16px padding, full expand no internal scroll */}
                      <div className="p-4 pt-4 space-y-4 pb-4">
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
                            <div className="bg-white dark:bg-zinc-800/90 p-2.5 rounded-lg border border-[#EE0033]/50 dark:border-[#EE0033]/30 shadow-xs space-y-2 animate-in fade-in duration-100">
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
                                className="w-full text-xs p-2 border border-[#D7D7D7] dark:border-zinc-700 rounded-lg outline-none focus:border-[#EE0033] focus:ring-2 focus:ring-[#EE0033]/20 resize-none font-medium text-[#111827] dark:text-zinc-100 bg-white dark:bg-zinc-800 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
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
                                    className="px-2.5 py-1.5 text-xs text-[#9B9B9B] dark:text-zinc-500 hover:text-[#111827] dark:hover:text-zinc-100 rounded-lg transition"
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
                              className="w-full text-left px-2.5 py-1.5 text-xs text-[#111827] dark:text-zinc-400 hover:text-[#111827] dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700/60 rounded-lg border border-transparent hover:border-[#D7D7D7] dark:hover:border-zinc-600 transition font-medium flex items-center gap-1.5"
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

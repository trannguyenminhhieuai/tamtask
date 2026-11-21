"use client";

import React, { useState, useMemo } from "react";
import { Issue, IssueStatus, FilterState, User, WorkflowStatus, Sprint } from "@/types/jira";
import { MobileTaskRow } from "./MobileTaskRow";
import { MobileStatusPickerModal } from "./MobileStatusPickerModal";
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Play,
  ClipboardList,
  CheckCircle2,
  Layers,
  Inbox,
  Filter,
  Check,
} from "lucide-react";
import { haptic } from "@/lib/haptic";
import { triggerConfetti } from "@/lib/confetti";

export type MobileHubMode = "FOCUS" | "LIST" | "BOARD";

interface MobileTaskHubProps {
  issues: Issue[];
  statuses: WorkflowStatus[];
  sprints: Sprint[];
  currentUser: User;
  filterState: FilterState;
  effectiveSprintId: string;
  onFilterChange: (filters: FilterState) => void;
  onIssueClick: (issue: Issue) => void;
  onUpdateIssueStatus: (issueId: string, newStatus: IssueStatus) => void;
  onOpenMobileFilterSheet: () => void;
  activeFilterCount: number;
  renderBoardView: () => React.ReactNode;
}

export const MobileTaskHub: React.FC<MobileTaskHubProps> = ({
  issues,
  statuses,
  sprints,
  currentUser,
  filterState,
  effectiveSprintId,
  onFilterChange,
  onIssueClick,
  onUpdateIssueStatus,
  onOpenMobileFilterSheet,
  activeFilterCount,
  renderBoardView,
}) => {
  const [hubMode, setHubMode] = useState<MobileHubMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tamtask_mobile_hub_mode");
        if (saved === "FOCUS" || saved === "LIST" || saved === "BOARD") return saved;
      } catch {}
    }
    return "FOCUS";
  });

  const handleModeChange = (mode: MobileHubMode) => {
    haptic.selection();
    setHubMode(mode);
    try {
      localStorage.setItem("tamtask_mobile_hub_mode", mode);
    } catch {}
  };

  // State for 1-tap Status Picker Modal
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<Issue | null>(null);

  // Collapsed sections in FOCUS and LIST modes
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    DONE_SECTION: true, // Default collapsed
  });

  const toggleSection = (key: string) => {
    haptic.light();
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter issues based on sprint filter & current user (for FOCUS)
  const sprintFilteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (effectiveSprintId === "ALL") return true;
      if (effectiveSprintId === "BACKLOG") return !i.sprintId;
      return i.sprintId === effectiveSprintId;
    });
  }, [issues, effectiveSprintId]);

  // FOCUS Feed Grouping (Strictly user-centric)
  const focusFeed = useMemo(() => {
    const myIssues = sprintFilteredIssues.filter(
      (i) => i.assignee?.id === currentUser.id
    );

    const urgent = myIssues.filter((i) => {
      const isBlocked =
        (i.sourceLinks || []).some(
          (l) => l.type === "IS_BLOCKED_BY" && l.targetIssue?.status !== "DONE"
        ) ||
        (i.targetLinks || []).some(
          (l) => l.type === "BLOCKS" && l.sourceIssue?.status !== "DONE"
        );
      return (
        i.status !== "DONE" &&
        i.status !== "RELEASED" &&
        (isBlocked || i.priority === "HIGHEST" || i.priority === "HIGH")
      );
    });

    const inProgress = myIssues.filter(
      (i) =>
        (i.status === "IN_PROGRESS" || i.status === "IN_REVIEW" || i.status === "IN_QA") &&
        !urgent.some((u) => u.id === i.id)
    );

    const todo = myIssues.filter(
      (i) =>
        i.status === "TODO" &&
        !urgent.some((u) => u.id === i.id) &&
        !inProgress.some((p) => p.id === i.id)
    );

    const done = myIssues.filter((i) => i.status === "DONE" || i.status === "RELEASED");

    return { myIssues, urgent, inProgress, todo, done };
  }, [sprintFilteredIssues, currentUser.id]);

  const handleQuickComplete = (issueId: string) => {
    triggerConfetti();
    onUpdateIssueStatus(issueId, "DONE");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6F8] dark:bg-[#09090B]">
      {/* 1. Mobile Segmented View Mode Switcher + Sprint Pill */}
      <div className="px-3 pt-2 pb-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800 shrink-0 space-y-2 select-none z-20">
        {/* Switcher Bar: FOCUS vs LIST vs BOARD */}
        <div className="flex items-center p-1 bg-slate-200/70 dark:bg-zinc-800/80 rounded-2xl shadow-inner border border-slate-300/40 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => handleModeChange("FOCUS")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              hubMode === "FOCUS"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>🎯 Việc của tôi</span>
            {focusFeed.myIssues.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  hubMode === "FOCUS"
                    ? "bg-rose-50 dark:bg-rose-950/60 text-[#EE0033]"
                    : "bg-slate-300/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                }`}
              >
                {focusFeed.myIssues.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("LIST")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              hubMode === "LIST"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>📋 Danh sách</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                hubMode === "LIST"
                  ? "bg-rose-50 dark:bg-rose-950/60 text-[#EE0033]"
                  : "bg-slate-300/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              }`}
            >
              {sprintFilteredIssues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("BOARD")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              hubMode === "BOARD"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>📊 Bảng</span>
          </button>
        </div>

        {/* Quick Toolbar: Sprint Pill & Filter Sheet Trigger */}
        <div className="flex items-center justify-between gap-2">
          {/* Sprint Selector Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 rounded-full px-2.5 py-1 text-xs shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-[#EE0033] shrink-0" />
            <select
              value={effectiveSprintId}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  sprintId: e.target.value,
                })
              }
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none max-w-[150px] truncate cursor-pointer"
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-zinc-900">
                  {s.name}
                </option>
              ))}
              <option value="ALL" className="dark:bg-zinc-900">
                Tất cả chu kỳ
              </option>
              <option value="BACKLOG" className="dark:bg-zinc-900">
                Chỉ Backlog
              </option>
            </select>
          </div>

          {/* Filter Bottom Sheet Trigger */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenMobileFilterSheet}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition flex items-center gap-1 shadow-2xs ${
                activeFilterCount > 0
                  ? "bg-rose-50 dark:bg-rose-950/50 text-[#EE0033] border border-rose-300 dark:border-rose-800 font-bold"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/80"
              }`}
            >
              <Filter className="w-3 h-3 text-[#EE0033]" />
              <span>Lọc</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#EE0033] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area based on Selected Mode */}
      {hubMode === "BOARD" ? (
        // Delegate to Horizontal Kanban Board with Pager / Touch Gestures
        <div className="flex-1 flex flex-col overflow-hidden">{renderBoardView()}</div>
      ) : hubMode === "FOCUS" ? (
        // Mode 1: Focus Feed ("Việc của tôi")
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {focusFeed.myIssues.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                <Inbox className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  Bạn không có công việc nào cần xử lý!
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  Tất cả các task được giao cho bạn trong chu kỳ này đã hoàn tất hoặc chưa được phân
                  công.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Urgent & Blocked */}
              {focusFeed.urgent.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider px-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#EE0033]" />
                    <span>Khẩn cấp & Cần giải quyết ({focusFeed.urgent.length})</span>
                  </div>
                  <div className="space-y-2">
                    {focusFeed.urgent.map((issue) => (
                      <MobileTaskRow
                        key={issue.id}
                        issue={issue}
                        statuses={statuses}
                        onClick={() => onIssueClick(issue)}
                        onOpenStatusPicker={(i) => setSelectedTaskForStatus(i)}
                        onQuickComplete={handleQuickComplete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: In Progress */}
              {focusFeed.inProgress.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider px-1">
                    <Play className="w-3.5 h-3.5 text-sky-600 fill-sky-600" />
                    <span>Đang thực hiện ({focusFeed.inProgress.length})</span>
                  </div>
                  <div className="space-y-2">
                    {focusFeed.inProgress.map((issue) => (
                      <MobileTaskRow
                        key={issue.id}
                        issue={issue}
                        statuses={statuses}
                        onClick={() => onIssueClick(issue)}
                        onOpenStatusPicker={(i) => setSelectedTaskForStatus(i)}
                        onQuickComplete={handleQuickComplete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: To Do */}
              {focusFeed.todo.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider px-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Tiếp theo ({focusFeed.todo.length})</span>
                  </div>
                  <div className="space-y-2">
                    {focusFeed.todo.map((issue) => (
                      <MobileTaskRow
                        key={issue.id}
                        issue={issue}
                        statuses={statuses}
                        onClick={() => onIssueClick(issue)}
                        onOpenStatusPicker={(i) => setSelectedTaskForStatus(i)}
                        onQuickComplete={handleQuickComplete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Completed (Collapsible Accordion) */}
              {focusFeed.done.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => toggleSection("DONE_SECTION")}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-zinc-800/60 text-xs font-bold text-slate-600 dark:text-zinc-300"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã hoàn thành ({focusFeed.done.length})</span>
                    </div>
                    {collapsedSections["DONE_SECTION"] ? (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {!collapsedSections["DONE_SECTION"] && (
                    <div className="space-y-2 pl-1 animate-in fade-in duration-150">
                      {focusFeed.done.map((issue) => (
                        <MobileTaskRow
                          key={issue.id}
                          issue={issue}
                          statuses={statuses}
                          onClick={() => onIssueClick(issue)}
                          onOpenStatusPicker={(i) => setSelectedTaskForStatus(i)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Mode 2: Collapsible Status List
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {statuses.map((status) => {
            const statusIssues = sprintFilteredIssues.filter((i) => i.status === status.id);
            const isDoneGroup = status.category === "DONE" || status.id === "DONE" || status.id === "RELEASED";
            const isCollapsed =
              collapsedSections[status.id] !== undefined
                ? collapsedSections[status.id]
                : isDoneGroup; // Done default collapsed

            return (
              <div
                key={status.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs"
              >
                {/* Status Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(status.id)}
                  className="w-full p-3 bg-slate-50/80 dark:bg-zinc-800/60 flex items-center justify-between text-left transition select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {status.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                      {statusIssues.length}
                    </span>
                  </div>

                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Status Issues List */}
                {!isCollapsed && (
                  <div className="p-2 space-y-2 bg-slate-50/30 dark:bg-zinc-900/40 border-t border-slate-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                    {statusIssues.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                        Không có công việc nào trong trạng thái này
                      </div>
                    ) : (
                      statusIssues.map((issue) => (
                        <MobileTaskRow
                          key={issue.id}
                          issue={issue}
                          statuses={statuses}
                          onClick={() => onIssueClick(issue)}
                          onOpenStatusPicker={(i) => setSelectedTaskForStatus(i)}
                          onQuickComplete={handleQuickComplete}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. 1-Tap Mobile Status Picker Bottom Sheet */}
      {selectedTaskForStatus && (
        <MobileStatusPickerModal
          isOpen={!!selectedTaskForStatus}
          currentStatus={selectedTaskForStatus.status}
          statuses={statuses}
          taskKey={selectedTaskForStatus.key}
          taskTitle={selectedTaskForStatus.title}
          onClose={() => setSelectedTaskForStatus(null)}
          onSelectStatus={(newStatus) => {
            if (newStatus === "DONE") triggerConfetti();
            onUpdateIssueStatus(selectedTaskForStatus.id, newStatus);
            setSelectedTaskForStatus(null);
          }}
        />
      )}
    </div>
  );
};

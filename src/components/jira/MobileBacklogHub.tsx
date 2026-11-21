"use client";

import React, { useState, useMemo } from "react";
import { Issue, Sprint, User, IssuePriority } from "@/types/jira";
import { MobileSprintMoveModal } from "./MobileSprintMoveModal";
import {
  Layers,
  Inbox,
  Calendar,
  Check,
  Play,
  Plus,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Bookmark,
  Bug,
  CheckSquare,
} from "lucide-react";
import { haptic } from "@/lib/haptic";

export type MobileBacklogTab = "ACTIVE" | "BACKLOG" | "PLANNED";

interface MobileBacklogHubProps {
  issues: Issue[];
  sprints: Sprint[];
  currentUser: User;
  onIssueClick: (issue: Issue) => void;
  onCreateIssueClick: () => void;
  onStartSprint?: (sprintId: string) => void;
  onCompleteSprint?: (sprint: Sprint) => void;
  onMoveIssueToSprint: (issueId: string, sprintId: string | null) => void;
}

export const MobileBacklogHub: React.FC<MobileBacklogHubProps> = ({
  issues,
  sprints,
  currentUser,
  onIssueClick,
  onCreateIssueClick,
  onStartSprint,
  onCompleteSprint,
  onMoveIssueToSprint,
}) => {
  const [activeTab, setActiveTab] = useState<MobileBacklogTab>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tamtask_mobile_backlog_tab");
        if (saved === "ACTIVE" || saved === "BACKLOG" || saved === "PLANNED") return saved;
      } catch {}
    }
    return "ACTIVE";
  });

  const handleTabChange = (tab: MobileBacklogTab) => {
    haptic.selection();
    setActiveTab(tab);
    try {
      localStorage.setItem("tamtask_mobile_backlog_tab", tab);
    } catch {}
  };

  // Move Modal State
  const [movingIssue, setMovingIssue] = useState<Issue | null>(null);

  // Collapsed planned sprints
  const [collapsedPlannedIds, setCollapsedPlannedIds] = useState<string[]>([]);
  const togglePlannedCollapse = (sprintId: string) => {
    haptic.light();
    setCollapsedPlannedIds((prev) =>
      prev.includes(sprintId) ? prev.filter((id) => id !== sprintId) : [...prev, sprintId]
    );
  };

  const activeSprint = useMemo(() => sprints.find((s) => s.status === "ACTIVE"), [sprints]);
  const plannedSprints = useMemo(() => sprints.filter((s) => s.status === "PLANNED"), [sprints]);
  const backlogIssues = useMemo(() => issues.filter((i) => !i.sprintId), [issues]);

  const activeSprintIssues = useMemo(
    () => (activeSprint ? issues.filter((i) => i.sprintId === activeSprint.id) : []),
    [issues, activeSprint]
  );

  const activeTotalPoints = useMemo(
    () => activeSprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
    [activeSprintIssues]
  );

  const backlogTotalPoints = useMemo(
    () => backlogIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
    [backlogIssues]
  );

  const canManageSprints = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD";
  const isViewer = currentUser.role === "VIEWER";

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "STORY":
        return <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />;
      case "BUG":
        return <Bug className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
    }
  };

  const renderPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
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

  const renderIssueRow = (issue: Issue) => (
    <div
      key={issue.id}
      onClick={() => onIssueClick(issue)}
      className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-xs flex flex-col gap-2 active:bg-slate-50 dark:active:bg-zinc-800/80 transition select-none"
    >
      {/* Top: Type + Key + Title */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-zinc-700/80">
            {renderTypeIcon(issue.type)}
            <span className="text-[11px] font-bold font-mono text-slate-700 dark:text-zinc-300">
              {issue.key}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
            {issue.title}
          </span>
        </div>

        {/* Move Sprint Trigger Button */}
        {!isViewer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptic.selection();
              setMovingIssue(issue);
            }}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-[#EE0033] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-zinc-700"
            title="Chuyển chu kỳ"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom: Priority + Story Points + Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          {renderPriorityBadge(issue.priority)}

          {typeof issue.storyPoints === "number" && issue.storyPoints > 0 && (
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-zinc-700">
              {issue.storyPoints} pts
            </span>
          )}

          {issue.epic && (
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border truncate max-w-[100px]"
              style={{
                color: issue.epic.color,
                backgroundColor: `${issue.epic.color}15`,
                borderColor: `${issue.epic.color}40`,
              }}
            >
              {issue.epic.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {issue.assignee ? (
            <div className="flex items-center gap-1.5">
              <img
                src={issue.assignee.avatar}
                alt={issue.assignee.name}
                className="w-4 h-4 rounded-full object-cover border border-slate-200 dark:border-zinc-700"
              />
              <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 truncate max-w-[80px]">
                {issue.assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-[10px] italic text-slate-400 dark:text-zinc-500">Chưa nhận</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6F8] dark:bg-[#09090B]">
      {/* 1. Mobile Segmented Tab Switcher */}
      <div className="p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800 shrink-0 select-none z-20">
        <div className="flex items-center p-1 bg-slate-200/70 dark:bg-zinc-800/80 rounded-2xl shadow-inner border border-slate-300/40 dark:border-zinc-700/60">
          {/* Active Sprint Tab */}
          <button
            type="button"
            onClick={() => handleTabChange("ACTIVE")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${
              activeTab === "ACTIVE"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>⚡ Đang chạy</span>
            {activeSprintIssues.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "ACTIVE"
                    ? "bg-rose-50 dark:bg-rose-950/60 text-[#EE0033]"
                    : "bg-slate-300/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                }`}
              >
                {activeSprintIssues.length}
              </span>
            )}
          </button>

          {/* Backlog Queue Tab */}
          <button
            type="button"
            onClick={() => handleTabChange("BACKLOG")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${
              activeTab === "BACKLOG"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <p className="inline">📦 Backlog</p>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "BACKLOG"
                  ? "bg-rose-50 dark:bg-rose-950/60 text-[#EE0033]"
                  : "bg-slate-300/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              }`}
            >
              {backlogIssues.length}
            </span>
          </button>

          {/* Planned Sprints Tab */}
          <button
            type="button"
            onClick={() => handleTabChange("PLANNED")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${
              activeTab === "PLANNED"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>📅 Kế hoạch</span>
            {plannedSprints.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "PLANNED"
                    ? "bg-rose-50 dark:bg-rose-950/60 text-[#EE0033]"
                    : "bg-slate-300/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                }`}
              >
                {plannedSprints.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Content Body based on Selected Tab */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: ACTIVE SPRINT */}
        {activeTab === "ACTIVE" && (
          <>
            {activeSprint ? (
              <div className="space-y-3">
                {/* Active Sprint Summary Banner */}
                <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {activeSprint.name}
                        </h3>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span>{activeSprintIssues.length} tasks</span>
                        <span>•</span>
                        <span>{activeTotalPoints} story points</span>
                      </div>
                    </div>

                    {/* Complete Sprint Action Button */}
                    {canManageSprints && onCompleteSprint && (
                      <button
                        type="button"
                        onClick={() => onCompleteSprint(activeSprint)}
                        className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-2xs hover:scale-105 active:scale-95 transition"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Hoàn thành</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Sprint Issues */}
                {activeSprintIssues.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 italic">
                    Chưa có công việc nào trong chu kỳ này
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSprintIssues.map(renderIssueRow)}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                    Chưa có chu kỳ nào đang mở
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                    Hãy chuyển sang tab &quot;Kế hoạch&quot; để bấm &quot;Bắt đầu Sprint&quot; cho chu kỳ tiếp theo.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: BACKLOG QUEUE */}
        {activeTab === "BACKLOG" && (
          <div className="space-y-3">
            {/* Backlog Header Bar with "Tạo công việc" button */}
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  Hàng đợi công việc
                </span>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                  {backlogIssues.length} tasks • {backlogTotalPoints} pts
                </div>
              </div>

              {!isViewer && (
                <button
                  type="button"
                  onClick={onCreateIssueClick}
                  className="bg-[#EE0033] hover:bg-[#D6002E] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo công việc</span>
                </button>
              )}
            </div>

            {/* Backlog Issues List */}
            {backlogIssues.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                Hàng đợi Backlog đang trống
              </div>
            ) : (
              <div className="space-y-2">
                {backlogIssues.map(renderIssueRow)}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLANNED SPRINTS */}
        {activeTab === "PLANNED" && (
          <div className="space-y-3">
            {plannedSprints.length === 0 ? (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                    Chưa có chu kỳ kế hoạch nào
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                    Các sprint dự kiến sẽ hiển thị tại đây khi được tạo mới.
                  </p>
                </div>
              </div>
            ) : (
              plannedSprints.map((sprint) => {
                const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
                const sprintPts = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                const isCollapsed = collapsedPlannedIds.includes(sprint.id);

                return (
                  <div
                    key={sprint.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs"
                  >
                    {/* Header */}
                    <div
                      onClick={() => togglePlannedCollapse(sprint.id)}
                      className="p-3 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {sprint.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            Kế hoạch
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                          {sprintIssues.length} tasks • {sprintPts} pts
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canManageSprints && onStartSprint && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.medium();
                              onStartSprint(sprint.id);
                            }}
                            className="bg-[#EE0033] hover:bg-[#D6002E] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs"
                          >
                            <Play className="w-3 h-3" />
                            <span>Bắt đầu</span>
                          </button>
                        )}
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Issues List */}
                    {!isCollapsed && (
                      <div className="p-2 space-y-2 border-t border-slate-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                        {sprintIssues.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 italic">
                            Chưa có task trong sprint này
                          </div>
                        ) : (
                          sprintIssues.map(renderIssueRow)
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 3. Mobile Sprint Move Modal (Bottom Sheet z-[80]) */}
      {movingIssue && (
        <MobileSprintMoveModal
          isOpen={!!movingIssue}
          issueId={movingIssue.id}
          issueKey={movingIssue.key}
          issueTitle={movingIssue.title}
          currentSprintId={movingIssue.sprintId}
          sprints={sprints}
          onClose={() => setMovingIssue(null)}
          onSelectSprint={(id, targetSprintId) => {
            onMoveIssueToSprint(id, targetSprintId);
            setMovingIssue(null);
          }}
        />
      )}
    </div>
  );
};

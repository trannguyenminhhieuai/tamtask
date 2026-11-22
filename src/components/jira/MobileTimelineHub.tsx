"use client";

import React, { useState, useMemo } from "react";
import { Epic, Sprint, Issue, User } from "@/types/jira";
import {
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  Bookmark,
  Bug,
  CheckSquare,
  ArrowRight,
  Target,
} from "lucide-react";
import { haptic } from "@/lib/haptic";

interface MobileTimelineHubProps {
  epics: Epic[];
  sprints: Sprint[];
  issues: Issue[];
  currentUser: User;
  onIssueClick: (issue: Issue) => void;
}

type TimelineMobileTab = "EPICS" | "SPRINTS";

export const MobileTimelineHub: React.FC<MobileTimelineHubProps> = ({
  epics,
  sprints,
  issues,
  currentUser,
  onIssueClick,
}) => {
  const [activeTab, setActiveTab] = useState<TimelineMobileTab>("EPICS");
  const [expandedEpicIds, setExpandedEpicIds] = useState<string[]>(() =>
    epics.length > 0 ? [epics[0].id] : []
  );
  const [expandedSprintIds, setExpandedSprintIds] = useState<string[]>(() => {
    const active = sprints.find((s) => s.status === "ACTIVE");
    return active ? [active.id] : sprints.length > 0 ? [sprints[0].id] : [];
  });

  const handleTabChange = (tab: TimelineMobileTab) => {
    haptic.selection();
    setActiveTab(tab);
  };

  const toggleEpicExpand = (epicId: string) => {
    haptic.light();
    setExpandedEpicIds((prev) =>
      prev.includes(epicId) ? prev.filter((id) => id !== epicId) : [...prev, epicId]
    );
  };

  const toggleSprintExpand = (sprintId: string) => {
    haptic.light();
    setExpandedSprintIds((prev) =>
      prev.includes(sprintId) ? prev.filter((id) => id !== sprintId) : [...prev, sprintId]
    );
  };

  // Overall Project Stats
  const overallStats = useMemo(() => {
    const totalIssues = issues.length;
    const doneIssues = issues.filter((i) => i.status === "DONE").length;
    const inProgressIssues = issues.filter((i) => i.status === "IN_PROGRESS" || i.status === "IN_REVIEW").length;
    const todoIssues = issues.filter((i) => i.status === "TODO").length;

    const totalPts = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const donePts = issues
      .filter((i) => i.status === "DONE")
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    const percent = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

    return {
      totalIssues,
      doneIssues,
      inProgressIssues,
      todoIssues,
      totalPts,
      donePts,
      percent,
    };
  }, [issues]);

  // Epic statistics
  const epicStats = useMemo(() => {
    return epics.map((epic) => {
      const epicIssues = issues.filter((i) => i.epic?.id === epic.id);
      const totalPts = epicIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
      const donePts = epicIssues
        .filter((i) => i.status === "DONE")
        .reduce((s, i) => s + (i.storyPoints || 0), 0);
      const inProgressCount = epicIssues.filter((i) => i.status === "IN_PROGRESS" || i.status === "IN_REVIEW").length;
      const doneCount = epicIssues.filter((i) => i.status === "DONE").length;
      const todoCount = epicIssues.filter((i) => i.status === "TODO").length;

      const percent =
        totalPts > 0
          ? Math.round((donePts / totalPts) * 100)
          : epicIssues.length > 0
          ? Math.round((doneCount / epicIssues.length) * 100)
          : 0;

      return {
        epic,
        issues: epicIssues,
        totalPts,
        donePts,
        percent,
        inProgressCount,
        doneCount,
        todoCount,
      };
    });
  }, [epics, issues]);

  // Sprint statistics
  const sprintStats = useMemo(() => {
    return sprints.map((sprint) => {
      const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
      const totalPts = sprintIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
      const donePts = sprintIssues
        .filter((i) => i.status === "DONE")
        .reduce((s, i) => s + (i.storyPoints || 0), 0);
      const doneCount = sprintIssues.filter((i) => i.status === "DONE").length;
      const percent = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : sprintIssues.length > 0 ? Math.round((doneCount / sprintIssues.length) * 100) : 0;

      return {
        sprint,
        issues: sprintIssues,
        totalPts,
        donePts,
        percent,
        doneCount,
      };
    });
  }, [sprints, issues]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8] dark:bg-[#09090B] transition-colors select-none">
      {/* 1. Header Island: Project Roadmap Progress Banner */}
      <div className="p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center text-white shadow-xs">
              <Target className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                Lộ Trình Tiến Độ
              </h1>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                {epics.length} Epics • {sprints.length} Chu kỳ
              </span>
            </div>
          </div>

          {/* Overall % Badge */}
          <div className="text-right">
            <span className="text-xs font-black text-[#EE0033] dark:text-rose-400">
              {overallStats.percent}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block leading-none">
              hoàn thành
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${overallStats.percent}%` }}
              title={`Đã xong: ${overallStats.donePts} pts`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
            <span>
              {overallStats.donePts} / {overallStats.totalPts} pts
            </span>
            <span>
              {overallStats.doneIssues}/{overallStats.totalIssues} tasks
            </span>
          </div>
        </div>

        {/* 2. Mode Switcher (Pills) */}
        <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded-2xl shadow-inner border border-slate-300/40 dark:border-zinc-700/60 text-xs">
          <button
            type="button"
            onClick={() => handleTabChange("EPICS")}
            className={`flex-1 py-1 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "EPICS"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>🎯 Theo Epic</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              {epics.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("SPRINTS")}
            className={`flex-1 py-1 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "SPRINTS"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>📅 Theo Chu kỳ</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              {sprints.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
        {/* VIEW 1: THEO EPIC */}
        {activeTab === "EPICS" && (
          <>
            {epicStats.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Bookmark className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600" />
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Dự án chưa có Epic mục tiêu nào.
                </p>
              </div>
            ) : (
              epicStats.map(({ epic, issues: epicIssues, percent, totalPts, donePts, inProgressCount, doneCount, todoCount }) => {
                const isExpanded = expandedEpicIds.includes(epic.id);

                return (
                  <div
                    key={epic.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Epic Header Card */}
                    <div
                      onClick={() => toggleEpicExpand(epic.id)}
                      className="p-3.5 space-y-2.5 cursor-pointer active:bg-slate-50 dark:active:bg-zinc-800/60 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: epic.color }}
                          />
                          <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {epic.name}
                          </h3>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs"
                            style={{
                              backgroundColor: `${epic.color}15`,
                              color: epic.color,
                              borderColor: `${epic.color}40`,
                            }}
                          >
                            {percent}%
                          </span>
                          <span className="text-slate-400 dark:text-zinc-500">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: epic.color || "#EE0033",
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                          <span>
                            {donePts} / {totalPts} pts
                          </span>
                          <span>
                            {doneCount} xong • {inProgressCount} đang làm • {todoCount} cần làm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Child Issues List */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 p-2.5 space-y-1.5">
                        {epicIssues.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                            Chưa có công việc nào gắn với Epic này
                          </div>
                        ) : (
                          epicIssues.map((issue) => (
                            <div
                              key={issue.id}
                              onClick={() => onIssueClick(issue)}
                              className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-2xs active:scale-[0.99] transition cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-[#EE0033] font-mono">
                                    {issue.key}
                                  </span>
                                  <span className="text-xs text-slate-900 dark:text-zinc-100 truncate font-medium">
                                    {issue.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                      issue.status === "DONE"
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                        : issue.status === "IN_PROGRESS"
                                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                                    }`}
                                  >
                                    {issue.status}
                                  </span>
                                  {issue.storyPoints !== undefined && (
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                      {issue.storyPoints} pts
                                    </span>
                                  )}
                                </div>
                              </div>

                              {issue.assignee && (
                                <img
                                  src={issue.assignee.avatar}
                                  alt={issue.assignee.name}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-zinc-700 shrink-0"
                                  title={issue.assignee.name}
                                />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* VIEW 2: THEO CHU KỲ (SPRINTS) */}
        {activeTab === "SPRINTS" && (
          <>
            {sprintStats.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600" />
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Chưa có chu kỳ làm việc nào được thiết lập.
                </p>
              </div>
            ) : (
              sprintStats.map(({ sprint, issues: sprintIssues, percent, totalPts, donePts, doneCount }) => {
                const isExpanded = expandedSprintIds.includes(sprint.id);
                const isActive = sprint.status === "ACTIVE";

                return (
                  <div
                    key={sprint.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Sprint Header */}
                    <div
                      onClick={() => toggleSprintExpand(sprint.id)}
                      className="p-3.5 space-y-2.5 cursor-pointer active:bg-slate-50 dark:active:bg-zinc-800/60 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            )}
                            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {sprint.name}
                            </h3>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                isActive
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : sprint.status === "COMPLETED"
                                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                              }`}
                            >
                              {isActive ? "Đang chạy" : sprint.status === "COMPLETED" ? "Đã đóng" : "Kế hoạch"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 font-mono">
                            {sprint.startDate || "Chưa đặt"} ~ {sprint.endDate || "Chưa đặt"}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-xs font-black text-slate-900 dark:text-zinc-100 font-mono">
                            {percent}%
                          </span>
                          <span className="text-slate-400 dark:text-zinc-500">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isActive ? "bg-emerald-500" : "bg-[#EE0033]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                          <span>
                            {donePts} / {totalPts} pts
                          </span>
                          <span>
                            {doneCount} / {sprintIssues.length} tasks
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Issues in Sprint */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 p-2.5 space-y-1.5">
                        {sprintIssues.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                            Chưa có công việc nào trong chu kỳ này
                          </div>
                        ) : (
                          sprintIssues.map((issue) => (
                            <div
                              key={issue.id}
                              onClick={() => onIssueClick(issue)}
                              className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-2xs active:scale-[0.99] transition cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-[#EE0033] font-mono">
                                    {issue.key}
                                  </span>
                                  <span className="text-xs text-slate-900 dark:text-zinc-100 truncate font-medium">
                                    {issue.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                      issue.status === "DONE"
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                        : issue.status === "IN_PROGRESS"
                                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                                    }`}
                                  >
                                    {issue.status}
                                  </span>
                                  {issue.epic && (
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                                      style={{
                                        backgroundColor: `${issue.epic.color}15`,
                                        color: issue.epic.color,
                                        borderColor: `${issue.epic.color}30`,
                                      }}
                                    >
                                      {issue.epic.name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {issue.assignee && (
                                <img
                                  src={issue.assignee.avatar}
                                  alt={issue.assignee.name}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-zinc-700 shrink-0"
                                  title={issue.assignee.name}
                                />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

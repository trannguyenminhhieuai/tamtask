"use client";

import React, { useState, useMemo } from "react";
import { Epic, Sprint, Issue, User } from "@/types/jira";
import {
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Clock,
  Plus,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Bug,
  CheckSquare,
} from "lucide-react";

interface TimelineViewProps {
  epics: Epic[];
  sprints: Sprint[];
  issues: Issue[];
  currentUser: User;
  onIssueClick: (issue: Issue) => void;
}

type TimeScale = "WEEKS" | "MONTHS" | "QUARTERS";

export const TimelineView: React.FC<TimelineViewProps> = ({
  epics,
  sprints,
  issues,
  currentUser,
  onIssueClick,
}) => {
  const [scale, setScale] = useState<TimeScale>("MONTHS");
  const [expandedEpicIds, setExpandedEpicIds] = useState<string[]>([]);

  const toggleEpicExpand = (epicId: string) => {
    setExpandedEpicIds((prev) =>
      prev.includes(epicId) ? prev.filter((id) => id !== epicId) : [...prev, epicId]
    );
  };

  // Time periods header
  const timePeriods = useMemo(() => {
    if (scale === "WEEKS") {
      return [
        "Tuần 42 (T10)",
        "Tuần 43 (T10)",
        "Tuần 44 (T10)",
        "Tuần 45 (T11)",
        "Tuần 46 (T11)",
        "Tuần 47 (T11)",
        "Tuần 48 (T11)",
      ];
    }
    if (scale === "QUARTERS") {
      return ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"];
    }
    // Default MONTHS
    return [
      "Tháng 9, 2026",
      "Tháng 10, 2026",
      "Tháng 11, 2026 (Hiện tại)",
      "Tháng 12, 2026",
      "Tháng 1, 2027",
      "Tháng 2, 2027",
    ];
  }, [scale]);

  // Epic statistics and positions
  const epicStats = useMemo(() => {
    return epics.map((epic, idx) => {
      const epicIssues = issues.filter((i) => i.epic?.id === epic.id);
      const totalPoints = epicIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
      const donePoints = epicIssues
        .filter((i) => i.status === "DONE")
        .reduce((s, i) => s + (i.storyPoints || 0), 0);
      const percent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 40 + (idx * 20) % 55;

      // Simulated timeline bar positions: startOffset (%), barWidth (%)
      const startOffset = Math.min(65, 8 + idx * 14);
      const barWidth = Math.min(85 - startOffset, 28 + (idx * 10) % 30);

      return {
        epic,
        issues: epicIssues,
        totalPoints,
        donePoints,
        percent,
        startOffset,
        barWidth,
      };
    });
  }, [epics, issues]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8] dark:bg-[#09090B] transition-colors duration-200">
      {/* Unified Glass Island Header */}
      <div className="m-4 mb-3 p-4 rounded-2xl bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#EE0033]" />
            <span>Lộ Trình Tiến Độ (Timeline)</span>
          </h1>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
            {epics.length} Epics • {sprints.length} Sprints
          </span>
        </div>

        {/* Time Scale Switcher Pills */}
        <div className="flex items-center space-x-1 bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-full border border-slate-200 dark:border-zinc-700 text-xs">
          <button
            onClick={() => setScale("WEEKS")}
            className={`px-3 py-1 rounded-full font-semibold transition ${scale === "WEEKS"
              ? "bg-[#EE0033] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setScale("MONTHS")}
            className={`px-3 py-1 rounded-full font-semibold transition ${scale === "MONTHS"
              ? "bg-[#EE0033] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setScale("QUARTERS")}
            className={`px-3 py-1 rounded-full font-semibold transition ${scale === "QUARTERS"
              ? "bg-[#EE0033] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
          >
            Quý
          </button>
        </div>
      </div>

      {/* Main Roadmap Island Container - rounded-2xl, 16px padding to outer border */}
      <div className="m-4 mt-0 flex-1 overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex">
        {/* Left Hierarchy Panel */}
        <div className="w-80 border-r border-[#E5E7EB] dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-[#E5E7EB] dark:border-zinc-800 text-xs font-bold text-gray-700 dark:text-zinc-200 uppercase tracking-wider flex items-center justify-between">
            <span>Epics & Issues Hierarchy</span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">{epics.length} Epics</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {epicStats.map(({ epic, issues: epicIssues, percent, donePoints, totalPoints }) => {
              const isExpanded = expandedEpicIds.includes(epic.id);

              return (
                <div key={epic.id} className="bg-white dark:bg-zinc-900">
                  {/* Epic Row */}
                  <div
                    onClick={() => toggleEpicExpand(epic.id)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 flex items-center justify-between cursor-pointer transition select-none group"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <span className="text-gray-400 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-zinc-300">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: epic.color }}
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate" title={epic.name}>
                        {epic.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${epic.color}15`,
                          color: epic.color,
                        }}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Expanded Child Issues */}
                  {isExpanded && (
                    <div className="pl-8 pr-3 py-1 space-y-1 bg-gray-50/60 dark:bg-zinc-800/40 border-t border-gray-100 dark:border-zinc-800">
                      {epicIssues.length > 0 ? (
                        epicIssues.map((child) => (
                          <div
                            key={child.id}
                            onClick={() => onIssueClick(child)}
                            className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-blue-50/50 dark:hover:bg-zinc-700/60 rounded-xl border border-gray-200/60 dark:border-zinc-700/60 text-xs flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span className="text-[11px] font-bold text-[#EE0033]">
                                {child.key}
                              </span>
                              <span className="truncate text-gray-700 dark:text-zinc-300 text-[11px]">
                                {child.title}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${child.status === "DONE"
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                : "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400"
                                }`}
                            >
                              {child.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-gray-400 dark:text-zinc-500 py-1 italic">
                          Không có công việc nào trong Epic này
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Gantt Chart Panel */}
        <div className="flex-1 flex flex-col overflow-x-auto bg-[#F4F5F7] dark:bg-zinc-950">
          {/* Timeline Column Headers */}
          <div className="h-10 bg-slate-50 dark:bg-zinc-900 border-b border-[#E5E7EB] dark:border-zinc-800 flex shrink-0 sticky top-0 z-10 min-w-[700px]">
            {timePeriods.map((period, i) => (
              <div
                key={i}
                className="flex-1 border-r border-gray-200/80 dark:border-zinc-800 px-3 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-zinc-400"
              >
                {period}
              </div>
            ))}
          </div>

          {/* Gantt Rows Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200/60 dark:divide-zinc-800 min-w-[700px]">
            {epicStats.map(({ epic, percent, startOffset, barWidth }) => {
              const isExpanded = expandedEpicIds.includes(epic.id);
              const epicIssues = issues.filter((i) => i.epic?.id === epic.id);

              return (
                <div key={epic.id} className="relative">
                  {/* Epic Gantt Bar Row */}
                  <div className="h-12 relative flex items-center px-4 hover:bg-gray-100/40 dark:hover:bg-zinc-900/40 transition">
                    {/* Background Column Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timePeriods.map((_, i) => (
                        <div key={i} className="flex-1 border-r border-gray-200/40 dark:border-zinc-800/40" />
                      ))}
                    </div>

                    {/* Today indicator line (Center) */}
                    <div className="absolute left-[42%] top-0 bottom-0 w-0.5 bg-[#EE0033] z-10 pointer-events-none opacity-80" />

                    {/* Epic Gantt Bar */}
                    <div
                      className="absolute h-7 rounded-xl shadow-sm transition-all flex items-center justify-between px-2.5 text-white text-xs font-bold cursor-pointer group"
                      style={{
                        left: `${startOffset}%`,
                        width: `${barWidth}%`,
                        backgroundColor: epic.color,
                      }}
                      title={`${epic.name} (${percent}% hoàn thành)`}
                    >
                      {/* Inner Progress fill bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-xl transition-all"
                        style={{ width: `${percent}%` }}
                      />

                      <span className="relative z-10 truncate text-[11px] font-semibold drop-shadow-xs">
                        {epic.name}
                      </span>
                      <span className="relative z-10 text-[10px] bg-white/30 px-1.5 py-0.2 rounded font-bold shrink-0">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Expanded Subtask Timeline Bars */}
                  {isExpanded && (
                    <div className="bg-gray-50/50 dark:bg-zinc-900/50 divide-y divide-gray-100 dark:divide-zinc-800">
                      {epicIssues.map((child, cIdx) => {
                        const childOffset = startOffset + ((cIdx * 5) % 15);
                        const childWidth = Math.max(12, Math.min(35, barWidth * 0.7));

                        return (
                          <div
                            key={child.id}
                            className="h-8 relative flex items-center px-4 hover:bg-blue-50/30 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                            onClick={() => onIssueClick(child)}
                          >
                            <div className="absolute inset-0 flex pointer-events-none">
                              {timePeriods.map((_, i) => (
                                <div key={i} className="flex-1 border-r border-gray-200/30 dark:border-zinc-800/30" />
                              ))}
                            </div>

                            {/* Subtask Bar */}
                            <div
                              className={`absolute h-5 rounded-full px-2 text-[10px] font-semibold flex items-center justify-between shadow-2xs border ${child.status === "DONE"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                : "bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200"
                                }`}
                              style={{
                                left: `${childOffset}%`,
                                width: `${childWidth}%`,
                              }}
                            >
                              <span className="truncate">{child.key}: {child.title}</span>
                              {child.status === "DONE" && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

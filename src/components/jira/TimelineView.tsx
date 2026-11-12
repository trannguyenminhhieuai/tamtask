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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Timeline Header Bar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-[#FAFBFC] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0052CC]" />
            <span>Timeline & Product Roadmap</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lộ trình phát triển sản phẩm theo các cột mốc Epic và chu kỳ Sprint
          </p>
        </div>

        {/* Time Scale Switcher */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-md border border-gray-200 text-xs">
          <button
            onClick={() => setScale("WEEKS")}
            className={`px-3 py-1 rounded font-medium transition ${
              scale === "WEEKS"
                ? "bg-white text-[#0052CC] font-bold shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tuần (Weeks)
          </button>
          <button
            onClick={() => setScale("MONTHS")}
            className={`px-3 py-1 rounded font-medium transition ${
              scale === "MONTHS"
                ? "bg-white text-[#0052CC] font-bold shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tháng (Months)
          </button>
          <button
            onClick={() => setScale("QUARTERS")}
            className={`px-3 py-1 rounded font-medium transition ${
              scale === "QUARTERS"
                ? "bg-white text-[#0052CC] font-bold shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Quý (Quarters)
          </button>
        </div>
      </div>

      {/* Main Roadmap Grid (Split View: Hierarchy Left, Gantt Chart Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Hierarchy Panel */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 bg-[#FAFBFC] border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
            <span>Epics & Issues Hierarchy</span>
            <span className="text-[10px] text-gray-400">{epics.length} Epics</span>
          </div>

          <div className="divide-y divide-gray-100">
            {epicStats.map(({ epic, issues: epicIssues, percent, donePoints, totalPoints }) => {
              const isExpanded = expandedEpicIds.includes(epic.id);

              return (
                <div key={epic.id} className="bg-white">
                  {/* Epic Row */}
                  <div
                    onClick={() => toggleEpicExpand(epic.id)}
                    className="p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition select-none group"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <span className="text-gray-400 group-hover:text-gray-700">
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
                      <span className="text-xs font-bold text-gray-800 truncate" title={epic.name}>
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
                    <div className="pl-8 pr-3 py-1 space-y-1 bg-gray-50/60 border-t border-gray-100">
                      {epicIssues.length > 0 ? (
                        epicIssues.map((child) => (
                          <div
                            key={child.id}
                            onClick={() => onIssueClick(child)}
                            className="p-1.5 bg-white hover:bg-blue-50/50 rounded border border-gray-200/60 text-xs flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span className="text-[11px] font-bold text-[#0052CC]">
                                {child.key}
                              </span>
                              <span className="truncate text-gray-700 text-[11px]">
                                {child.title}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                child.status === "DONE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {child.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-gray-400 py-1 italic">
                          Chưa có task trực thuộc Epic này.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Gantt Chart Timeline Grid */}
        <div className="flex-1 flex flex-col overflow-x-auto bg-[#F4F5F7]">
          {/* Timeline Column Headers */}
          <div className="h-10 bg-[#FAFBFC] border-b border-gray-200 flex shrink-0 sticky top-0 z-10 min-w-[700px]">
            {timePeriods.map((period, i) => (
              <div
                key={i}
                className="flex-1 border-r border-gray-200/80 px-3 flex items-center justify-center text-xs font-semibold text-gray-600"
              >
                {period}
              </div>
            ))}
          </div>

          {/* Gantt Rows Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200/60 min-w-[700px]">
            {epicStats.map(({ epic, percent, startOffset, barWidth }) => {
              const isExpanded = expandedEpicIds.includes(epic.id);
              const epicIssues = issues.filter((i) => i.epic?.id === epic.id);

              return (
                <div key={epic.id} className="relative">
                  {/* Epic Gantt Bar Row */}
                  <div className="h-12 relative flex items-center px-4 hover:bg-gray-100/40 transition">
                    {/* Background Column Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timePeriods.map((_, i) => (
                        <div key={i} className="flex-1 border-r border-gray-200/40" />
                      ))}
                    </div>

                    {/* Today indicator line (Center) */}
                    <div className="absolute left-[42%] top-0 bottom-0 w-0.5 bg-[#0052CC] z-10 pointer-events-none opacity-80" />

                    {/* Epic Gantt Bar */}
                    <div
                      className="absolute h-7 rounded-md shadow-sm transition-all flex items-center justify-between px-2 text-white text-xs font-bold cursor-pointer group"
                      style={{
                        left: `${startOffset}%`,
                        width: `${barWidth}%`,
                        backgroundColor: epic.color,
                      }}
                      title={`${epic.name} (${percent}% hoàn thành)`}
                    >
                      {/* Inner Progress fill bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-md transition-all"
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
                    <div className="bg-gray-50/50 divide-y divide-gray-100">
                      {epicIssues.map((child, cIdx) => {
                        const childOffset = startOffset + ((cIdx * 5) % 15);
                        const childWidth = Math.max(12, Math.min(35, barWidth * 0.7));

                        return (
                          <div
                            key={child.id}
                            className="h-8 relative flex items-center px-4 hover:bg-blue-50/30 transition cursor-pointer"
                            onClick={() => onIssueClick(child)}
                          >
                            <div className="absolute inset-0 flex pointer-events-none">
                              {timePeriods.map((_, i) => (
                                <div key={i} className="flex-1 border-r border-gray-200/30" />
                              ))}
                            </div>

                            {/* Subtask Bar */}
                            <div
                              className={`absolute h-5 rounded px-2 text-[10px] font-semibold flex items-center justify-between shadow-2xs border ${
                                child.status === "DONE"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : "bg-white border-gray-300 text-gray-700"
                              }`}
                              style={{
                                left: `${childOffset}%`,
                                width: `${childWidth}%`,
                              }}
                            >
                              <span className="truncate">{child.key}: {child.title}</span>
                              {child.status === "DONE" && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
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


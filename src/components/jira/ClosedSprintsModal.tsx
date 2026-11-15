"use client";

import React, { useEffect } from "react";
import { Sprint, Issue } from "@/types/jira";
import { X, Calendar, CheckCircle2, Award, Check, ArrowUp, ArrowDown, Minus } from "lucide-react";

const getPriorityBadge = (priority?: string) => {
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

interface ClosedSprintsModalProps {
  isOpen: boolean;
  sprints: Sprint[];
  issues: Issue[];
  onClose: () => void;
  onIssueClick: (issue: Issue) => void;
}

export const ClosedSprintsModal: React.FC<ClosedSprintsModalProps> = ({
  isOpen,
  sprints,
  issues,
  onClose,
  onIssueClick,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const completedSprints = sprints.filter((s) => s.status === "COMPLETED");

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Lịch Sử Sprint Đã Hoàn Thành</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Xem lại các chu kỳ Sprint đã đóng và kết quả bàn giao</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {completedSprints.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
              Chưa có Sprint nào được hoàn thành trong dự án này.
            </div>
          ) : (
            <div className="space-y-4">
              {completedSprints.map((sprint) => {
                const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
                const doneIssues = sprintIssues.filter((i) => i.status === "DONE");
                const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                const completedPoints = doneIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                const percent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 100;

                return (
                  <div key={sprint.id} className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                    {/* Header */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{sprint.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            ✓ Hoàn thành
                          </span>
                        </div>
                        {sprint.goal && (
                          <p className="text-xs text-slate-600 dark:text-zinc-400 italic mt-0.5">Mục tiêu: {sprint.goal}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                            <span>{sprint.startDate || "N/A"} ~ {sprint.endDate || "N/A"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Velocity Stats */}
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                            {completedPoints} / {totalPoints} Points ({percent}%)
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {doneIssues.length}/{sprintIssues.length} issues hoàn thành
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                          {percent}%
                        </div>
                      </div>
                    </div>

                    {/* Issues List in this closed sprint */}
                    <div className="p-3 divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 max-h-60 overflow-y-auto">
                      {sprintIssues.length === 0 ? (
                        <div className="text-xs text-slate-400 dark:text-zinc-500 py-2 text-center">Không có task trong Sprint này</div>
                      ) : (
                        sprintIssues.map((issue) => (
                          <div
                            key={issue.id}
                            onClick={() => onIssueClick(issue)}
                            className="py-2.5 px-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-lg cursor-pointer transition text-xs"
                          >
                            <div className="flex items-center space-x-2.5 overflow-hidden pr-2">
                              <span className="font-mono font-bold text-slate-800 dark:text-zinc-200 hover:text-[#EE0033] dark:hover:text-rose-400 transition shrink-0">{issue.key}</span>
                              <span className="truncate font-medium text-slate-900 dark:text-zinc-100">
                                {issue.title}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Priority Badge */}
                              {(() => {
                                const p = getPriorityBadge(issue.priority);
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${p.colorClass}`}
                                    title={`Mức độ ưu tiên: ${p.label}`}
                                  >
                                    {p.icon}
                                    <span>{p.label}</span>
                                  </span>
                                );
                              })()}
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-slate-600 dark:text-zinc-300 font-semibold border border-slate-200 dark:border-zinc-700">
                                {issue.status}
                              </span>
                              {issue.storyPoints !== undefined && (
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                                  {issue.storyPoints} pts
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end bg-slate-50/70 dark:bg-zinc-800/60">
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-full transition shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};


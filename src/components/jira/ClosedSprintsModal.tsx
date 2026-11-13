"use client";

import React from "react";
import { Sprint, Issue } from "@/types/jira";
import { X, Calendar, CheckCircle2, Award, Check, ArrowUp, ArrowDown, Minus } from "lucide-react";

const getPriorityBadge = (priority?: string) => {
  switch (priority) {
    case "HIGHEST":
      return {
        label: "Cao nhất",
        colorClass: "bg-red-50 text-[#EE0033] border-red-200 font-bold",
        icon: <ArrowUp className="w-3 h-3 text-[#EE0033] stroke-[3]" />,
      };
    case "HIGH":
      return {
        label: "Cao",
        colorClass: "bg-orange-50 text-orange-700 border-orange-200 font-semibold",
        icon: <ArrowUp className="w-3 h-3 text-orange-600 stroke-[2.5]" />,
      };
    case "MEDIUM":
      return {
        label: "Trung bình",
        colorClass: "bg-amber-50 text-amber-700 border-amber-200 font-semibold",
        icon: <Minus className="w-3 h-3 text-amber-600 stroke-[2.5]" />,
      };
    case "LOW":
      return {
        label: "Thấp",
        colorClass: "bg-sky-50 text-sky-700 border-sky-200 font-semibold",
        icon: <ArrowDown className="w-3 h-3 text-sky-600 stroke-[2]" />,
      };
    case "LOWEST":
      return {
        label: "Rất thấp",
        colorClass: "bg-slate-100 text-slate-600 border-slate-200 font-medium",
        icon: <ArrowDown className="w-3 h-3 text-slate-400 stroke-[1.5]" />,
      };
    default:
      return {
        label: "Trung bình",
        colorClass: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
        icon: <Minus className="w-3 h-3 text-amber-600 stroke-[2.5]" />,
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
  if (!isOpen) return null;

  const completedSprints = sprints.filter((s) => s.status === "COMPLETED");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FAFBFC]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Lịch Sử Sprint Đã Hoàn Thành</h3>
              <p className="text-xs text-gray-500">Xem lại các chu kỳ Sprint đã đóng và kết quả bàn giao</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {completedSprints.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
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
                  <div key={sprint.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                    {/* Header */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-gray-900">{sprint.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Hoàn thành
                          </span>
                        </div>
                        {sprint.goal && (
                          <p className="text-xs text-gray-600 italic mt-0.5">Mục tiêu: {sprint.goal}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{sprint.startDate || "N/A"} ~ {sprint.endDate || "N/A"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Velocity Stats */}
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">
                            {completedPoints} / {totalPoints} Points ({percent}%)
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {doneIssues.length}/{sprintIssues.length} issues hoàn thành
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
                          {percent}%
                        </div>
                      </div>
                    </div>

                    {/* Issues List in this closed sprint */}
                    <div className="p-3 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      {sprintIssues.length === 0 ? (
                        <div className="text-xs text-gray-400 py-2 text-center">Không có task trong Sprint này</div>
                      ) : (
                        sprintIssues.map((issue) => (
                          <div
                            key={issue.id}
                            onClick={() => onIssueClick(issue)}
                            className="py-2 px-2 flex items-center justify-between hover:bg-gray-50 rounded cursor-pointer transition text-xs"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono font-medium text-slate-700 hover:text-[#EE0033] transition">{issue.key}</span>
                              <span className={`line-clamp-1 ${issue.status === "DONE" ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                                {issue.title}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Priority Badge */}
                              {(() => {
                                const p = getPriorityBadge(issue.priority);
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${p.colorClass}`}
                                    title={`Mức độ ưu tiên: ${p.label}`}
                                  >
                                    {p.icon}
                                    <span>{p.label}</span>
                                  </span>
                                );
                              })()}
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-semibold">
                                {issue.status}
                              </span>
                              {issue.storyPoints !== undefined && (
                                <span className="text-[10px] font-semibold text-gray-500">
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
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end bg-[#FAFBFC]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};


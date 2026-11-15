"use client";

import React, { useEffect } from "react";
import { Sprint, Issue } from "@/types/jira";
import { X, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface CompleteSprintModalProps {
  isOpen: boolean;
  sprint: Sprint | null;
  issues: Issue[];
  onClose: () => void;
  onComplete: (sprintId: string) => void;
}

export const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
  isOpen,
  sprint,
  issues,
  onClose,
  onComplete,
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

  if (!isOpen || !sprint) return null;

  const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
  const completedIssues = sprintIssues.filter((i) => i.status.toUpperCase() === "DONE");
  const openIssues = sprintIssues.filter((i) => i.status.toUpperCase() !== "DONE");

  const completedPoints = completedIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const openPoints = openIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/60">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Hoàn Thành {sprint.name}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Bạn sắp đóng chu kỳ Sprint này. Hãy kiểm tra tổng kết khối lượng công việc đã hoàn thành:
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Đã hoàn thành</span>
              </div>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                {completedIssues.length} issues ({completedPoints} pts)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Chưa hoàn thành</span>
              </div>
              <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                {openIssues.length} issues ({openPoints} pts)
              </span>
            </div>
          </div>

          {openIssues.length > 0 && (
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700">
              Các task chưa hoàn thành sẽ tự động được lưu và chuyển sang Sprint tiếp theo.
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onComplete(sprint.id);
                onClose();
              }}
              className="px-5 py-1.5 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-full transition shadow-xs"
            >
              Xác Nhận Đóng Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


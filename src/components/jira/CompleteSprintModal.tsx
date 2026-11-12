"use client";

import React from "react";
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
  if (!isOpen || !sprint) return null;

  const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
  const completedIssues = sprintIssues.filter((i) => i.status.toUpperCase() === "DONE");
  const openIssues = sprintIssues.filter((i) => i.status.toUpperCase() !== "DONE");

  const completedPoints = completedIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const openPoints = openIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FAFBFC]">
          <h3 className="text-base font-bold text-gray-900">Hoàn Thành {sprint.name}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Bạn sắp đóng chu kỳ Sprint này. Hãy kiểm tra tổng kết khối lượng công việc đã hoàn thành:
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 border border-emerald-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">Đã hoàn thành</span>
              </div>
              <span className="text-xs font-black text-emerald-700">
                {completedIssues.length} issues ({completedPoints} pts)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 border border-amber-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-900">Chưa hoàn thành</span>
              </div>
              <span className="text-xs font-black text-amber-700">
                {openIssues.length} issues ({openPoints} pts)
              </span>
            </div>
          </div>

          {openIssues.length > 0 && (
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200">
              Các task chưa hoàn thành sẽ tự động được lưu và chuyển sang Sprint tiếp theo.
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onComplete(sprint.id);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
            >
              Xác Nhận Đóng Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


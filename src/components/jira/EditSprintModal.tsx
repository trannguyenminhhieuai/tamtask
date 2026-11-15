"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Target, Flag } from "lucide-react";
import { Sprint } from "@/types/jira";

interface EditSprintModalProps {
  isOpen: boolean;
  sprint: Sprint | null;
  onClose: () => void;
  onSave: (
    sprintId: string,
    data: { name: string; goal?: string; startDate?: string; endDate?: string }
  ) => void;
}

export const EditSprintModal: React.FC<EditSprintModalProps> = ({
  isOpen,
  sprint,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sprint) {
      setName(sprint.name || "");
      setGoal(sprint.goal || "");
      setStartDate(sprint.startDate || "");
      setEndDate(sprint.endDate || "");
      setError(null);
    }
  }, [sprint, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên chu kỳ.");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("Ngày kết thúc không thể trước ngày bắt đầu.");
      return;
    }

    onSave(sprint.id, {
      name: name.trim(),
      goal: goal.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/60">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#EE0033] text-white shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">Chỉnh Sửa Chu Kỳ (Sprint)</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Cập nhật thông tin và kế hoạch thời gian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              <span>Tên Chu Kỳ <span className="text-[#EE0033]">*</span></span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Sprint 2 - Kế hoạch hoàn thiện"
              className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-[#EE0033] focus:ring-1 focus:ring-[#EE0033] transition text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              <span>Mục Tiêu Chu Kỳ (Goal)</span>
            </label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Mục tiêu cam kết bàn giao của đội ngũ..."
              className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-[#EE0033] focus:ring-1 focus:ring-[#EE0033] transition text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Ngày Bắt Đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-[#EE0033] transition text-slate-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Ngày Kết Thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-[#EE0033] transition text-slate-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-full shadow-xs transition"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


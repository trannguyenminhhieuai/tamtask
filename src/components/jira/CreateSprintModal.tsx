"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Flag, Plus } from "lucide-react";

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSprint: (sprint: {
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
  isOpen,
  onClose,
  onCreateSprint,
}) => {
  const [name, setName] = useState("Sprint 3");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("2026-11-20");
  const [endDate, setEndDate] = useState("2026-12-04");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateSprint({
      name: name.trim(),
      goal: goal.trim(),
      startDate,
      endDate,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/60">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#EE0033] text-white shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Tạo Chu Kỳ Sprint Mới</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Khởi tạo chu kỳ làm việc kế tiếp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Tên Sprint <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Sprint 3 - Ra mắt bản thử nghiệm"
              className="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#EE0033] focus:border-[#EE0033]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Mục Tiêu Sprint (Sprint Goal)
            </label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Mục tiêu cốt lõi cần đạt được trong sprint này..."
              className="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#EE0033] focus:border-[#EE0033] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Ngày Bắt Đầu
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#EE0033]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Ngày Kết Thúc
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#EE0033]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-full transition shadow-xs"
            >
              Tạo Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


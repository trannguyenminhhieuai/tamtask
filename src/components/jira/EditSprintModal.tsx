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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-slate-900 text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Chỉnh Sửa Chu Kỳ (Sprint)</h3>
              <p className="text-[11px] text-slate-500">Cập nhật thông tin và kế hoạch thời gian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              <span>Tên Chu Kỳ <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Sprint 2 - Tính năng Thanh toán"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-800 transition text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Mục Tiêu Chu Kỳ (Goal)</span>
            </label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Mục tiêu cam kết bàn giao của đội ngũ..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-800 transition text-slate-800 resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày Bắt Đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-800 transition text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày Kết Thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-800 transition text-slate-800"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


"use client";

import React, { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FAFBFC]">
          <h3 className="text-base font-bold text-gray-900">Tạo Chu Kỳ Sprint Mới</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Tên Sprint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 3"
              className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:ring-1 focus:ring-[#0052CC]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Mục Tiêu Sprint (Sprint Goal)
            </label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Mục tiêu cốt lõi cần đạt được trong sprint này..."
              className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:ring-1 focus:ring-[#0052CC]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Ngày Bắt Đầu
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Ngày Kết Thúc
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-[#C41230] hover:bg-[#A30F28] text-white rounded-md transition shadow-xs"
            >
              Tạo Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


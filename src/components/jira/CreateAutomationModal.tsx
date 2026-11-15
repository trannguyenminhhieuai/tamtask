"use client";

import React, { useState, useEffect } from "react";
import { X, Zap, Sparkles, Plus, ShieldCheck } from "lucide-react";

interface CreateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRule: (rule: {
    name: string;
    trigger: string;
    action: string;
    useMouse1: boolean;
  }) => void;
}

const PRESET_TRIGGERS = [
  "Khi một Task / Bug mới được tạo",
  "Khi trạng thái chuyển sang IN REVIEW",
  "Khi trạng thái chuyển sang DONE",
  "Khi tất cả Subtasks trực thuộc hoàn tất",
  "Khi hạn chót (Due date) còn dưới 24h",
];

const PRESET_CONDITIONS = [
  "Áp dụng cho mọi loại Issue",
  "Chỉ áp dụng nếu loại là BUG",
  "Chỉ áp dụng nếu độ ưu tiên là HIGHEST hoặc HIGH",
  "Chỉ áp dụng nếu chưa có Assignee",
];

const PRESET_ACTIONS = [
  "Tự động gán cho Tech Lead / QA",
  "Tự động chuyển Parent Issue sang trạng thái DONE",
  "Tự động phân bổ công việc & mức ưu tiên tối ưu",
  "Thêm comment tự động và thông báo cho Reporter",
  "Kiểm duyệt điều kiện nghiêm ngặt trước khi đóng task",
];

export const CreateAutomationModal: React.FC<CreateAutomationModalProps> = ({
  isOpen,
  onClose,
  onCreateRule,
}) => {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState(PRESET_TRIGGERS[0]);
  const [condition, setCondition] = useState(PRESET_CONDITIONS[0]);
  const [action, setAction] = useState(PRESET_ACTIONS[0]);
  const [useMouse1, setUseMouse1] = useState(true);

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

    const fullAction = condition === PRESET_CONDITIONS[0] ? action : `[${condition}] ${action}`;

    onCreateRule({
      name: name.trim(),
      trigger,
      action: fullAction,
      useMouse1,
    });

    setName("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(27,27,27,0.65)] backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#D7D7D7] dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-zinc-800 flex items-center justify-between bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[#EE0033]" />
            <h3 className="text-base font-bold text-[#111827] dark:text-zinc-100">Tạo Luật Tự Động Hóa Mới (Automation Rule)</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition" title="Đóng (Esc)">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-zinc-900">
          {/* Rule Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Tên Luật Tự Động Hóa <span className="text-[#EE0033]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tự động kiểm duyệt PR khi vào In QA"
              className="w-full text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              1. Sự Kiện Kích Hoạt (When / Trigger)
            </label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] transition"
            >
              {PRESET_TRIGGERS.map((t) => (
                <option key={t} value={t} className="dark:bg-zinc-800">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              2. Điều Kiện Kiểm Tra (If / Condition)
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] transition"
            >
              {PRESET_CONDITIONS.map((c) => (
                <option key={c} value={c} className="dark:bg-zinc-800">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              3. Hành Động Thực Thi (Then / Action)
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-[#D7D7D7] dark:border-zinc-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] transition"
            >
              {PRESET_ACTIONS.map((a) => (
                <option key={a} value={a} className="dark:bg-zinc-800">
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Smart Automation Toggle */}
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Kích hoạt Bộ Tự Động Thông Minh</div>
                <div className="text-[10px] text-slate-600 dark:text-zinc-400">Quy tắc phân tích tự động bảo mật cao, không lưu trữ dữ liệu ngoài</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={useMouse1}
              onChange={(e) => setUseMouse1(e.target.checked)}
              className="w-4 h-4 text-[#EE0033] rounded cursor-pointer accent-[#EE0033]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-zinc-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-full border border-[#D7D7D7] dark:border-zinc-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-full transition shadow-xs"
            >
              Lưu & Kích Hoạt Luật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


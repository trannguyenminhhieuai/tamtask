"use client";

import React, { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FAFBFC]">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[#0052CC]" />
            <h3 className="text-base font-bold text-gray-900">Tạo Luật Tự Động Hóa Mới (Automation Rule)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Rule Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Tên Luật Tự Động Hóa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tự động kiểm duyệt PR khi vào In QA"
              className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              1. Sự Kiện Kích Hoạt (When / Trigger)
            </label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 font-medium"
            >
              {PRESET_TRIGGERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              2. Điều Kiện Kiểm Tra (If / Condition)
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-800"
            >
              {PRESET_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              3. Hành Động Thực Thi (Then / Action)
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 font-semibold"
            >
              {PRESET_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Smart Automation Toggle */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <div>
                <div className="text-xs font-bold text-indigo-900">Kích hoạt Bộ Tự Động Thông Minh</div>
                <div className="text-[10px] text-gray-600">Quy tắc phân tích tự động bảo mật cao, không lưu trữ dữ liệu ngoài</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={useMouse1}
              onChange={(e) => setUseMouse1(e.target.checked)}
              className="w-4 h-4 text-[#0052CC] rounded cursor-pointer"
            />
          </div>

          {/* Buttons */}
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
              className="px-4 py-1.5 text-xs font-medium bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-md transition shadow-xs"
            >
              Lưu & Kích Hoạt Luật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


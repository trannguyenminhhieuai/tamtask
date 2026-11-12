"use client";

import React, { useState, useEffect } from "react";
import { WorkflowStatus, Project } from "@/types/jira";
import { X, Plus, Trash2, ArrowUp, ArrowDown, Settings2, Sliders, AlertTriangle, Check } from "lucide-react";

interface WorkflowSettingsModalProps {
  isOpen: boolean;
  statuses: WorkflowStatus[];
  currentProject?: Project | null;
  onClose: () => void;
  onSaveStatuses: (newStatuses: WorkflowStatus[]) => void;
}

const PRESET_COLORS = [
  "#64748B", // Slate
  "#EE0033", // Viettel Red
  "#830C20", // Viettel Deep Red
  "#0052CC", // Blue
  "#6554C0", // Purple
  "#D97706", // Amber / In Review
  "#E11D48", // Rose / Blocked
  "#16A34A", // Green / Done
];

export const WorkflowSettingsModal: React.FC<WorkflowSettingsModalProps> = ({
  isOpen,
  statuses,
  currentProject,
  onClose,
  onSaveStatuses,
}) => {
  const [currentStatuses, setCurrentStatuses] = useState<WorkflowStatus[]>(statuses);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<WorkflowStatus["category"]>("IN_PROGRESS");
  const [newColor, setNewColor] = useState("#EE0033");
  const [newMaxWip, setNewMaxWip] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStatuses(statuses);
    }
  }, [isOpen, statuses]);

  if (!isOpen) return null;

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const id = newTitle.trim().toUpperCase().replace(/\s+/g, "_");
    if (currentStatuses.some((s) => s.id === id || s.key === id)) {
      alert("Trạng thái này đã tồn tại trong quy trình!");
      return;
    }

    const created: WorkflowStatus = {
      id,
      key: id,
      name: newTitle.trim(),
      category: newCategory,
      color: newColor,
      order: currentStatuses.length,
      maxWip: newMaxWip ? parseInt(newMaxWip) : undefined,
    };

    setCurrentStatuses([...currentStatuses, created]);
    setNewTitle("");
    setNewMaxWip("");
  };

  const handleDelete = (id: string) => {
    if (currentStatuses.length <= 2) {
      alert("Cần tối thiểu 2 trạng thái trong quy trình!");
      return;
    }
    setCurrentStatuses(currentStatuses.filter((s) => s.id !== id && s.key !== id));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentStatuses.length) return;

    const updated = [...currentStatuses];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Reassign order
    const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
    setCurrentStatuses(reordered);
  };

  const handleWipChange = (idx: number, val: string) => {
    const num = val ? parseInt(val) : undefined;
    setCurrentStatuses((prev) =>
      prev.map((st, i) => (i === idx ? { ...st, maxWip: num && num > 0 ? num : undefined } : st))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentProject?.id) {
        const res = await fetch(`/api/projects/${currentProject.id}/statuses`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statuses: currentStatuses }),
        });

        if (res.ok) {
          const savedData = await res.json();
          onSaveStatuses(savedData);
          onClose();
          return;
        }
      }
    } catch (err) {
      console.error("Failed to save statuses to DB:", err);
    } finally {
      setIsSaving(false);
    }

    onSaveStatuses(currentStatuses);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-5 h-5 text-[#EE0033]" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">Tùy Biến Workflow & Cột Kanban</h3>
              {currentProject && (
                <p className="text-xs text-slate-500">
                  Lưu cấu hình cột riêng cho dự án <strong>{currentProject.name}</strong>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Status Form */}
          <form onSubmit={handleAddStatus} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#EE0033]" />
              <span>Thêm Cột Trạng Thái Mới Vào Dự Án</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Tên cột trạng thái *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm Thử QA, Chờ UAT..."
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nhóm tiến độ (Category)
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                >
                  <option value="TODO">To Do (Chưa bắt đầu)</option>
                  <option value="IN_PROGRESS">In Progress (Đang thực hiện)</option>
                  <option value="DONE">Done (Đã hoàn thành)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* WIP Limit Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-600" />
                  <span>Giới hạn WIP (Số task tối đa)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newMaxWip}
                  onChange={(e) => setNewMaxWip(e.target.value)}
                  placeholder="VD: 3 hoặc 4 (để trống nếu không giới hạn)"
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                />
              </div>

              {/* Color Preset Picker */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Màu sắc nhận diện
                </label>
                <div className="flex items-center space-x-1.5 pt-0.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full transition ${
                        newColor === c ? "ring-2 ring-offset-1 ring-slate-900 scale-110" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-[#EE0033] hover:bg-[#D6002E] text-white text-xs font-medium px-3 py-1.5 rounded-md transition shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Cột</span>
              </button>
            </div>
          </form>

          {/* Current Status List */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Các Cột Trong Quy Trình Hiện Tại ({currentStatuses.length})
            </h4>

            <div className="space-y-2">
              {currentStatuses.map((st, index) => (
                <div
                  key={st.id || st.key}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                        <span>{st.name}</span>
                        <span className="text-[10px] font-normal text-gray-400 font-mono">
                          ({st.id || st.key})
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Category: {st.category}
                      </span>
                    </div>
                  </div>

                  {/* WIP Input & Controls */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      <span className="text-[10px] text-gray-500 font-semibold">WIP:</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={st.maxWip || ""}
                        onChange={(e) => handleWipChange(index, e.target.value)}
                        placeholder="∞"
                        className="w-9 text-xs text-center bg-white border border-gray-200 rounded px-1 py-0.5 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                        title="Giới hạn số lượng task tối đa trong cột này (Work In Progress)"
                      />
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Di chuyển sang trái"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === currentStatuses.length - 1}
                        onClick={() => handleMove(index, "down")}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Di chuyển sang phải"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(st.id || st.key || "")}
                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition"
                        title="Xóa trạng thái này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-[#FAFBFC]">
          <span className="text-[11px] text-gray-500">
            Dữ liệu sẽ được tự động lưu vĩnh viễn vào cơ sở dữ liệu dự án.
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-medium bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-md transition shadow-xs flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? "Đang lưu vào DB..." : "Lưu Thay Đổi"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

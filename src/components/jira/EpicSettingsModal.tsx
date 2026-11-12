"use client";

import React, { useState } from "react";
import { X, FolderGit2, Plus, Trash2, Check, Edit2 } from "lucide-react";
import { Epic, Project } from "@/types/jira";

interface EpicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  epics: Epic[];
  currentProject: Project | null;
  onEpicsUpdated: () => void;
}

const PRESET_COLORS = [
  "#0052CC", // Blue
  "#6554C0", // Purple
  "#00875A", // Forest Green
  "#FF5630", // Red Coral
  "#FFAB00", // Amber
  "#36B37E", // Emerald
  "#00B8D9", // Teal
  "#6B778C", // Slate
  "#172B4D", // Deep Navy
  "#E56910", // Warm Orange
];

export const EpicSettingsModal: React.FC<EpicSettingsModalProps> = ({
  isOpen,
  onClose,
  epics,
  currentProject,
  onEpicsUpdated,
}) => {
  const [editingEpicId, setEditingEpicId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);
  const [editSummary, setEditSummary] = useState("");

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newSummary, setNewSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (epic: Epic) => {
    setEditingEpicId(epic.id);
    setEditName(epic.name);
    setEditColor(epic.color || PRESET_COLORS[0]);
    setEditSummary(epic.summary || "");
  };

  const handleSaveEdit = async () => {
    if (!editingEpicId || !editName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/epics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEpicId,
          name: editName.trim(),
          color: editColor,
          summary: editSummary.trim(),
        }),
      });
      if (res.ok) {
        setEditingEpicId(null);
        onEpicsUpdated();
      }
    } catch (err) {
      console.error("Failed to update epic:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEpic = async (epicId: string, epicName: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa Epic "${epicName}"?\nCác công việc trực thuộc sẽ được tự động chuyển về trạng thái không gắn Epic.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/epics?id=${epicId}`, { method: "DELETE" });
      if (res.ok) {
        onEpicsUpdated();
      }
    } catch (err) {
      console.error("Failed to delete epic:", err);
    }
  };

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Vui lòng nhập tên Epic.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/epics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          color: newColor,
          summary: newSummary.trim(),
          projectId: currentProject?.id || null,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewSummary("");
        onEpicsUpdated();
      }
    } catch (err) {
      console.error("Failed to create epic:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-slate-900 text-white">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Quản Lý & Cấu Hình Epic</h3>
              <p className="text-[11px] text-slate-500">
                Phân nhóm module lớn cho dự án {currentProject?.name ? `"${currentProject.name}"` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Create New Epic Form */}
          <form onSubmit={handleCreateEpic} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-slate-900" />
                Tạo Epic Mới
              </span>
              <div className="flex items-center gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      newColor === c ? "scale-125 ring-2 ring-slate-800 ring-offset-1" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {error && <div className="text-xs text-rose-600 font-medium">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Tên Epic (VD: Module Thanh Toán)..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-800 bg-white"
              />
              <input
                type="text"
                placeholder="Mô tả tóm tắt mục tiêu module..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-800 bg-white"
              />
            </div>

            <div className="text-right">
              <button
                type="submit"
                disabled={isSubmitting || !newName.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg shadow-2xs transition"
              >
                + Thêm Epic
              </button>
            </div>
          </form>

          {/* Epic List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Danh Sách Epic Hiện Có ({epics.length})
            </div>

            {epics.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Chưa có Epic nào. Hãy tạo Epic đầu tiên để phân nhóm công việc.
              </div>
            ) : (
              epics.map((epic) => {
                const isEditing = editingEpicId === epic.id;
                return (
                  <div
                    key={epic.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-2xs"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-semibold"
                          />
                          <div className="flex items-center gap-1">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditColor(c)}
                                className={`w-3.5 h-3.5 rounded-full ${
                                  editColor === c ? "scale-125 ring-2 ring-slate-800 ring-offset-1" : ""
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editSummary}
                          onChange={(e) => setEditSummary(e.target.value)}
                          placeholder="Mô tả tóm tắt..."
                          className="w-full text-xs px-2.5 py-1 border border-slate-200 rounded-lg outline-none text-slate-600"
                        />
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingEpicId(null)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: epic.color || "#0052CC" }}
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {epic.name}
                            </div>
                            {epic.summary && (
                              <div className="text-[11px] text-slate-500 truncate">
                                {epic.summary}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(epic)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Sửa Epic"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEpic(epic.id, epic.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa Epic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};


"use client";

import React, { useState } from "react";
import { X, FolderPlus, Sparkles, UserCheck, Check } from "lucide-react";
import { User } from "@/types/jira";

interface CreateProjectModalProps {
  isOpen: boolean;
  users: User[];
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    key: string;
    description: string;
    leadId?: string;
  }) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  users,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate key from words
    if (!key || key.length <= 4) {
      const generated = val
        .split(/\s+/)
        .map((w) => w[0] || "")
        .join("")
        .toUpperCase()
        .slice(0, 5);
      if (generated) setKey(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onCreateProject({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        leadId: leadId || undefined,
      });
      setName("");
      setKey("");
      setDescription("");
      setLeadId("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tạo dự án. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150">
        {/* Header - Viettel Red */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-[#079455] flex items-center justify-center text-white">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Tạo Dự Án Mới</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tên Dự Án (Project Name) <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. TamTask Core, Mobile App, CRM Platform..."
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#079455]/20 focus:border-[#079455] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mã Định Danh (Key) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="e.g. TT, PROJ"
                className="w-full text-xs font-bold uppercase tracking-wider bg-white border border-slate-300 rounded px-3 py-2 text-[#079455] focus:outline-none focus:ring-2 focus:ring-[#079455]/20 focus:border-[#079455] font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Trưởng Dự Án (Project Lead)
              </label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#079455]/20 focus:border-[#079455] transition"
              >
                <option value="">-- Chưa chỉ định --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mô Tả Dự Án (Description)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục tiêu và phạm vi của dự án này..."
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#079455]/20 focus:border-[#079455] transition"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 flex items-start space-x-2">
            <Check className="w-4 h-4 text-[#079455] flex-shrink-0 mt-0.5" />
            <span>
              Hệ thống sẽ tự động khởi tạo <strong>Sprint 1</strong>, các <strong>Epic cơ sở</strong> và bộ <strong>Workflow cột Kanban chuẩn</strong> cho dự án này.
            </span>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium bg-[#079455] hover:bg-[#06854D] text-white rounded-md transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Đang tạo..." : "Khởi Tạo Dự Án"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

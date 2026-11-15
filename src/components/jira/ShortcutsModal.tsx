"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Cmd + K / Ctrl + K", desc: "Mở Hộp Lệnh Toàn Năng (Command Palette) & Tìm kiếm" },
    { key: "c", desc: "Mở nhanh hộp thoại Tạo Công Việc Mới (Create Issue)" },
    { key: "?", desc: "Xem danh sách phím tắt hệ thống" },
    { key: "Esc", desc: "Đóng Modal hoặc Drawer chi tiết" },
    { key: "j / k", desc: "Duyệt lên / xuống các công việc trên Bảng hoặc Backlog" },
    { key: "Ctrl + Z", desc: "Hoàn tác hành động chuyển trạng thái hoặc xóa gần nhất (5s)" },
  ];

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-t-2xl">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-100 font-bold">
            <Keyboard className="w-5 h-5 text-[#EE0033]" />
            <span>Phím Tắt Hệ Thống</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 divide-y divide-slate-100 dark:divide-zinc-800 max-h-[60vh] overflow-y-auto bg-white dark:bg-zinc-900">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-slate-600 dark:text-zinc-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-right rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-full shadow-xs transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};


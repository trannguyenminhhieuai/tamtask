"use client";

import React from "react";
import { LayoutDashboard, ClipboardList, GitBranch, Plus, Menu } from "lucide-react";
import { NavView } from "./Sidebar";

interface MobileBottomNavProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  onCreateClick: () => void;
  onToggleSidebar: () => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  onCreateClick,
  onToggleSidebar,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-zinc-800/80 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg shadow-black/10 transition-colors">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Kanban Board */}
        <button
          type="button"
          onClick={() => onViewChange("BOARD")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentView === "BOARD"
              ? "text-[#EE0033] dark:text-[#EE0033] font-bold"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5 transition-transform active:scale-90" />
            {currentView === "BOARD" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#EE0033]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Bảng</span>
        </button>

        {/* 2. Backlog */}
        <button
          type="button"
          onClick={() => onViewChange("BACKLOG")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentView === "BACKLOG"
              ? "text-[#EE0033] dark:text-[#EE0033] font-bold"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5 transition-transform active:scale-90" />
            {currentView === "BACKLOG" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#EE0033]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Backlog</span>
        </button>

        {/* 3. Center Create Action Button (FAB) */}
        <div className="flex-1 flex justify-center -mt-4">
          <button
            type="button"
            onClick={onCreateClick}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EE0033] to-[#C7002B] text-white flex items-center justify-center shadow-md shadow-red-500/25 active:scale-95 transition-transform border-2 border-white dark:border-zinc-900"
            title="Tạo công việc mới"
            aria-label="Tạo công việc mới"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Timeline */}
        <button
          type="button"
          onClick={() => onViewChange("TIMELINE")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentView === "TIMELINE"
              ? "text-[#EE0033] dark:text-[#EE0033] font-bold"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <GitBranch className="w-5 h-5 transition-transform active:scale-90" />
            {currentView === "TIMELINE" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#EE0033]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Tiến độ</span>
        </button>

        {/* 5. Menu / More */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all"
        >
          <Menu className="w-5 h-5 transition-transform active:scale-90" />
          <span className="text-[10px] mt-1 tracking-tight">Thêm</span>
        </button>
      </div>
    </nav>
  );
};

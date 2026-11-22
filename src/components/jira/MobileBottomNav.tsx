"use client";

import React from "react";
import { LayoutDashboard, ClipboardList, GitBranch, Plus, Menu } from "lucide-react";
import { NavView } from "./Sidebar";
import { haptic } from "@/lib/haptic";

interface MobileBottomNavProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  onCreateClick: () => void;
  onToggleSidebar: () => void;
  onOpenMore?: () => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  onCreateClick,
  onToggleSidebar,
  onOpenMore,
}) => {
  const handleViewChange = (view: NavView) => {
    haptic.selection();
    onViewChange(view);
  };

  const handleCreate = () => {
    haptic.medium();
    onCreateClick();
  };

  const handleMenu = () => {
    haptic.light();
    if (onOpenMore) {
      onOpenMore();
    } else {
      onToggleSidebar();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800/80 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.625rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Kanban Board */}
        <button
          type="button"
          onClick={() => handleViewChange("BOARD")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-xl transition-all duration-150 active:scale-95 ${
            currentView === "BOARD"
              ? "text-[#EE0033] dark:text-[#EE0033] font-bold bg-rose-50/70 dark:bg-rose-950/40"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
          title="Bảng công việc"
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5 transition-transform" />
            {currentView === "BOARD" && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#EE0033]" />
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium">Bảng</span>
        </button>

        {/* 2. Backlog */}
        <button
          type="button"
          onClick={() => handleViewChange("BACKLOG")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-xl transition-all duration-150 active:scale-95 ${
            currentView === "BACKLOG"
              ? "text-[#EE0033] dark:text-[#EE0033] font-bold bg-rose-50/70 dark:bg-rose-950/40"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
          title="Kế hoạch Backlog"
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5 transition-transform" />
            {currentView === "BACKLOG" && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#EE0033]" />
            )}
          </div>
          <p className="text-[11px] mt-0.5 tracking-tight font-medium">Backlog</p>
        </button>

        {/* 3. Center Create Action Button (FAB) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={handleCreate}
            className="w-13 h-13 rounded-full bg-gradient-to-br from-[#EE0033] to-[#C7002B] text-white flex items-center justify-center shadow-lg shadow-red-500/35 active:scale-90 active:shadow-sm transition-all border-2 border-white dark:border-zinc-900 group"
            title="Tạo công việc mới (+)"
            aria-label="Tạo công việc mới"
          >
            <Plus className="w-6 h-6 stroke-[2.75] transition-transform group-hover:rotate-90 duration-200" />
          </button>
        </div>

        {/* 4. Timeline */}
        <button
          type="button"
          onClick={() => handleViewChange("TIMELINE")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-xl transition-all duration-150 active:scale-95 ${
            currentView === "TIMELINE"
              ? "text-[#EE0033] dark:text-[#EE0033] font-bold bg-rose-50/70 dark:bg-rose-950/40"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
          title="Lộ trình & Tiến độ"
        >
          <div className="relative">
            <GitBranch className="w-5 h-5 transition-transform" />
            {currentView === "TIMELINE" && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#EE0033]" />
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium">Tiến độ</span>
        </button>

        {/* 5. Menu / More */}
        <button
          type="button"
          onClick={handleMenu}
          className="flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all duration-150 active:scale-95"
          title="Thực đơn khác"
        >
          <Menu className="w-5 h-5 transition-transform" />
          <span className="text-[11px] mt-0.5 tracking-tight font-medium">Thêm</span>
        </button>
      </div>
    </nav>
  );
};

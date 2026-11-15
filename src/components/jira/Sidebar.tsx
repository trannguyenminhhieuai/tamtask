"use client";

import React, { useState, useEffect } from "react";
import {
  Kanban,
  ListTodo,
  TrendingUp,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  Sun,
  Moon,
  Pin,
  PinOff,
} from "lucide-react";
import { User, Project } from "@/types/jira";

export type NavView = "BOARD" | "BACKLOG" | "TIMELINE" | "DASHBOARD" | "ADMIN" | "AUTOMATION";

interface SidebarProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: User;
  currentProject?: Project | null;
  activeSprintName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  currentProject,
  activeSprintName,
}) => {
  const role = currentUser.role || "DEVELOPER";
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check initial dark mode from DOM or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof window !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  // Build navigation items based on strict RBAC
  const allNavItems = [
    { id: "BOARD" as NavView, label: "Bảng Công Việc", icon: Kanban, allowedRoles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER", "QA", "VIEWER"] },
    { id: "BACKLOG" as NavView, label: "Kế Hoạch Chu Kỳ", icon: ListTodo, allowedRoles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER", "QA", "VIEWER"] },
    { id: "TIMELINE" as NavView, label: "Lộ Trình Tiến Độ", icon: Calendar, allowedRoles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER", "QA", "VIEWER"] },
    { id: "DASHBOARD" as NavView, label: "Báo Cáo & Thống Kê", icon: TrendingUp, allowedRoles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER", "QA", "VIEWER"] },
    { id: "AUTOMATION" as NavView, label: "Quy Tắc Tự Động", icon: Zap, allowedRoles: ["ADMIN", "PROJECT_LEAD"] },
    { id: "ADMIN" as NavView, label: "Quản Trị Hệ Thống", icon: Users, allowedRoles: ["ADMIN"] },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.allowedRoles.includes(role));

  // If user is currently on an unauthorized view, redirect to BOARD
  useEffect(() => {
    const isAllowed = visibleNavItems.some((item) => item.id === currentView);
    if (!isAllowed) {
      onViewChange("BOARD");
    }
  }, [role, currentView, visibleNavItems, onViewChange]);

  // Sidebar is visually open if pinned, explicitly expanded, or currently hovered
  const isExpanded = isPinned || (!isCollapsed && !isHovered) || isHovered;

  return (
    <div className="h-full p-2 sm:p-2.5 flex flex-col shrink-0 select-none">
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-[#E5E7EB] dark:border-zinc-800 rounded-2xl sm:rounded-3xl transition-all duration-300 ease-in-out flex flex-col justify-between shadow-xs ${
          isExpanded ? "w-60 shadow-xl" : "w-16"
        }`}
      >
        <div className="flex flex-col">
          {/* Project & Workspace Header Info */}
          <div className="p-3.5 border-b border-[#F0F2F5] dark:border-zinc-800">
            {isExpanded ? (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#EE0033]">
                    <Layers className="w-4 h-4 text-[#EE0033] shrink-0" />
                    <span className="text-xs font-bold text-[#111827] dark:text-zinc-100 uppercase tracking-wider truncate max-w-[130px]">
                      {currentProject ? currentProject.name : "Không Gian Dự Án"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition"
                    title={isPinned ? "Bỏ ghim thanh bên (Tự động thu gọn)" : "Ghim thanh bên luôn mở"}
                  >
                    {isPinned ? <PinOff className="w-3.5 h-3.5 text-[#EE0033]" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[11px] text-[#6B7280] dark:text-zinc-400 font-medium mt-1.5 flex items-center justify-between">
                  <span className="truncate">{activeSprintName || "Sprint Hiện Tại"}</span>
                  <span className="text-[9px] bg-rose-50 dark:bg-rose-950/50 text-[#EE0033] dark:text-rose-400 border border-rose-200/80 dark:border-rose-800 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                    ĐANG CHẠY
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-0.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#EE0033] flex items-center justify-center font-bold text-xs shadow-2xs">
                  {currentProject ? currentProject.key.slice(0, 2) : "TT"}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links - Tammi OA Hierarchical Tree Style */}
          <div className="p-2 space-y-1">
            {isExpanded && (
              <div className="px-2.5 py-1.5 flex items-center text-[#EE0033] font-bold text-[11px] uppercase tracking-wider animate-in fade-in duration-150">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EE0033] mr-2 shrink-0" />
                <span className="truncate">Quản Lý Công Việc</span>
              </div>
            )}

            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        onToggleCollapse();
                      }
                    }}
                    className={`w-full flex items-center ${
                      !isExpanded ? "justify-center px-0 py-2.5 rounded-xl" : "px-3 py-2.5 rounded-xl"
                    } text-xs transition-all relative group ${
                      isActive
                        ? "text-[#EE0033] dark:text-rose-400 font-bold bg-rose-50/80 dark:bg-rose-950/40 border-l-3 border-[#EE0033]"
                        : "text-[#4B5563] dark:text-zinc-400 hover:text-[#111827] dark:hover:text-zinc-100 hover:bg-[#F8F9FA] dark:hover:bg-zinc-800/50 font-medium border-l-3 border-transparent"
                    }`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-[#EE0033] dark:text-rose-400"
                          : "text-[#9B9B9B] dark:text-zinc-400 group-hover:text-[#111827] dark:group-hover:text-zinc-100"
                      }`}
                    />
                    {isExpanded && (
                      <span className="ml-3 truncate animate-in fade-in duration-200">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: Theme Pill Toggle & Collapse Button */}
        <div className="p-3 border-t border-[#F0F2F5] dark:border-zinc-800 flex items-center justify-between">
          {/* Light / Dark Mode Toggle Pill */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`flex items-center rounded-full transition p-1 ${
              isExpanded
                ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 space-x-1.5"
                : "justify-center w-8 h-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title={isDarkMode ? "Chuyển sang giao diện Sáng (Light Mode)" : "Chuyển sang giao diện Tối (Dark Mode)"}
          >
            {isDarkMode ? (
              <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            {isExpanded && (
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                {isDarkMode ? "Tối" : "Sáng"}
              </span>
            )}
          </button>

          {isExpanded && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-[#9B9B9B] hover:text-[#111827] dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
              title="Thu gọn thanh bên"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

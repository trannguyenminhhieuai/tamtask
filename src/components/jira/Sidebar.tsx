"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  GitBranch,
  BarChart3,
  Zap,
  Users,
  ChevronLeft,
  Sun,
  Moon,
  Pin,
  PinOff,
  HelpCircle,
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
  onOpenShortcutsModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  currentProject,
  activeSprintName,
  onOpenShortcutsModal,
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
    { id: "BOARD" as NavView, label: "Bảng Công Việc", icon: LayoutDashboard, allowedRoles: ["ADMIN", "PROJECT_LEAD", "BA", "DEVELOPER", "QA", "VIEWER"] },
    { id: "BACKLOG" as NavView, label: "Kế Hoạch Chu Kỳ", icon: ClipboardList, allowedRoles: ["ADMIN", "PROJECT_LEAD", "BA", "DEVELOPER", "QA", "VIEWER"] },
    { id: "TIMELINE" as NavView, label: "Lộ Trình Tiến Độ", icon: GitBranch, allowedRoles: ["ADMIN", "PROJECT_LEAD", "BA", "DEVELOPER", "QA", "VIEWER"] },
    { id: "DASHBOARD" as NavView, label: "Báo Cáo & Thống Kê", icon: BarChart3, allowedRoles: ["ADMIN", "PROJECT_LEAD", "BA", "DEVELOPER", "QA", "VIEWER"] },
    { id: "AUTOMATION" as NavView, label: "Quy Tắc Tự Động", icon: Zap, allowedRoles: ["ADMIN", "PROJECT_LEAD", "BA"] },
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

  // Sidebar is visually open ONLY if pinned or currently hovered (Default is collapsed w-16)
  const isExpanded = isPinned || isHovered;

  return (
    <div className="h-full pt-4 pb-4 pl-4 pr-0 flex flex-col shrink-0 select-none">
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-full bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl transition-all duration-300 ease-in-out flex flex-col justify-between shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ${
          isExpanded ? "w-60 shadow-2xl" : "w-16"
        }`}
      >
        <div className="flex flex-col">
          {/* Project Header - Project name only, no project code */}
          <div className="p-3.5 border-b border-black/5 dark:border-white/10">
            {isExpanded ? (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center text-white font-black ${
                      (currentProject?.key?.slice(0, 3) || "TT").length >= 3 ? "text-[7.5px] tracking-tighter" : "text-[9px] tracking-tight"
                    } shrink-0 shadow-xs`}>
                      {currentProject ? currentProject.key.slice(0, 3) : "TT"}
                    </div>
                    <span className="text-xs font-bold text-[#111827] dark:text-zinc-100 uppercase tracking-wider truncate max-w-[120px]">
                      {currentProject ? currentProject.name : "TamTask"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg transition hover:bg-black/5 dark:hover:bg-white/5"
                    title={isPinned ? "Bỏ ghim (Tự động thu gọn khi rời chuột)" : "Ghim thanh bên luôn mở"}
                  >
                    {isPinned ? <PinOff className="w-3.5 h-3.5 text-[#EE0033]" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-0.5">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br from-[#EE0033] to-[#C7002B] text-white flex items-center justify-center font-extrabold ${
                  (currentProject?.key?.slice(0, 3) || "TT").length >= 3 ? "text-[8.5px] tracking-tighter" : "text-[9px] tracking-tight"
                } shadow-xs`}>
                  {currentProject ? currentProject.key.slice(0, 3) : "TT"}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links - Glass Specular Glow Style */}
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
                        ? "text-[#EE0033] dark:text-rose-400 font-bold bg-white/90 dark:bg-zinc-800/90 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] border-l-3 border-[#EE0033]"
                        : "text-[#4B5563] dark:text-zinc-400 hover:text-[#111827] dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50 hover:shadow-2xs font-medium border-l-3 border-transparent backdrop-blur-xs"
                    }`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-all ${
                        isActive
                          ? "text-[#EE0033] dark:text-rose-400 fill-current"
                          : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-200 fill-current"
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

        {/* Bottom: Shortcuts Button & Collapse Control */}
        <div className="p-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
          {/* Shortcuts Modal Button (?) */}
          <button
            type="button"
            onClick={() => onOpenShortcutsModal?.()}
            className={`flex items-center rounded-xl transition p-1 ${
              isExpanded
                ? "bg-white/80 dark:bg-zinc-800/80 border border-white/60 dark:border-white/10 px-2.5 py-1.5 space-x-2 shadow-2xs hover:bg-white dark:hover:bg-zinc-700/80"
                : "justify-center w-8 h-8 hover:bg-white/60 dark:hover:bg-zinc-800/60"
            }`}
            title="Phím tắt hệ thống (Nhấn ?)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
            {isExpanded && (
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                Phím tắt (?)
              </span>
            )}
          </button>

          {isExpanded && isPinned && (
            <button
              onClick={() => setIsPinned(false)}
              className="p-1 text-[#9B9B9B] hover:text-[#111827] dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-zinc-800 rounded-lg transition"
              title="Bỏ ghim thanh bên"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

"use client";

import React, { useEffect } from "react";
import {
  Kanban,
  ListTodo,
  TrendingUp,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
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

  // Build navigation items based on strict RBAC - Clean, without unnecessary badges
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

  return (
    <aside
      className={`bg-white border-r border-[#D7D7D7] transition-all duration-200 flex flex-col justify-between select-none relative ${
        isCollapsed ? "w-14" : "w-60"
      }`}
    >
      <div>
        {/* Project & Workspace Header Info */}
        {!isCollapsed ? (
          <div className="p-4 border-b border-[#F0F2F5]">
            <div className="flex items-center space-x-2 text-[#EE0033]">
              <Layers className="w-4 h-4 text-[#EE0033] shrink-0" />
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider truncate">
                {currentProject ? currentProject.name : "Không Gian Dự Án"}
              </span>
            </div>
            <div className="text-[11px] text-[#6B7280] font-medium mt-1 flex items-center justify-between">
              <span className="truncate">{activeSprintName || "Chu Kỳ Hiện Tại"}</span>
              <span className="text-[9px] bg-rose-50 text-[#EE0033] border border-rose-200/80 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                ĐANG CHẠY
              </span>
            </div>
          </div>
        ) : (
          <div className="h-4" />
        )}

        {/* Navigation Links - Tammi OA Hierarchical Tree Style */}
        <div className="p-3">
          {!isCollapsed && (
            <div className="px-2 py-1.5 flex items-center justify-between text-[#EE0033] font-bold text-xs uppercase tracking-wider mb-1">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EE0033]" />
                <span>Quản Lý Công Việc</span>
              </div>
            </div>
          )}

          <nav className="space-y-0.5">
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
                    isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                  } text-xs transition-all relative group rounded-r-lg ${
                    isActive
                      ? "text-[#EE0033] font-bold bg-rose-50/60 border-l-2 border-[#EE0033]"
                      : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FA] font-medium border-l-2 border-transparent"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-[#EE0033]" : "text-[#9B9B9B] group-hover:text-[#111827]"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="ml-3 truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom: Theme Pill Toggle & Collapse Button */}
      <div className="p-3 border-t border-[#F0F2F5] flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-4 bg-gray-200 rounded-full p-0.5 flex items-center cursor-pointer">
              <div className="w-3 h-3 bg-white rounded-full shadow-xs" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Sáng</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-[#9B9B9B] hover:text-[#111827] hover:bg-slate-100 rounded-lg transition"
          title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

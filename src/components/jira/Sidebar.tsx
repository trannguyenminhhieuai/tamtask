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
      className={`bg-[#F8F8F8] border-r border-[#D7D7D7] transition-all duration-200 flex flex-col justify-between select-none relative ${
        isCollapsed ? "w-14" : "w-60"
      }`}
    >
      <div>
        {/* Project Header Info */}
        {!isCollapsed ? (
          <div className="p-4 border-b border-[#D7D7D7]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9B9B9B]">
              {currentProject ? currentProject.name : "TamTask Space"}
            </div>
            <div className="text-sm font-semibold text-[#111827] mt-1 flex items-center justify-between">
              <span className="truncate">{activeSprintName || "Chu Kỳ Hiện Tại"}</span>
              <span className="text-[10px] bg-rose-50 text-[#EE0033] border border-rose-200/80 font-semibold px-1.5 py-0.5 rounded-md ml-1 shrink-0">
                ĐANG CHẠY
              </span>
            </div>
          </div>
        ) : (
          <div className="h-4" />
        )}

        {/* Navigation Links */}
        <nav className="p-2 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center px-0" : "px-3"
                } py-2 rounded-lg text-xs transition relative group ${
                  isActive
                    ? "bg-white text-[#EE0033] font-semibold border border-[#D7D7D7] shadow-xs"
                    : "text-[#111827] hover:bg-white hover:text-[#EE0033] font-medium"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#EE0033] rounded-r" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#EE0033]" : "text-[#9B9B9B] group-hover:text-[#EE0033]"}`} />
                {!isCollapsed && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Collapse Button */}
      <div className="p-3 border-t border-[#D7D7D7]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 text-[#9B9B9B] hover:text-[#111827] hover:bg-white rounded-lg border border-transparent hover:border-[#D7D7D7] transition"
          title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

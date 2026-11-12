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

  // Build navigation items based on strict RBAC
  const allNavItems = [
    { id: "BOARD" as NavView, label: "Bảng Công Việc", icon: Kanban, badge: "Trực quan", allowedRoles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER", "QA", "VIEWER"] },
    { id: "BACKLOG" as NavView, label: "Kế Hoạch Chu Kỳ", icon: ListTodo, allowedRoles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER", "QA", "VIEWER"] },
    { id: "TIMELINE" as NavView, label: "Lộ Trình Tiến Độ", icon: Calendar, badge: "Gantt", allowedRoles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER", "QA", "VIEWER"] },
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
      className={`bg-slate-50/70 border-r border-slate-200/80 transition-all duration-200 flex flex-col justify-between select-none relative ${
        isCollapsed ? "w-14" : "w-60"
      }`}
    >
      <div>
        {/* Project Header Info */}
        {!isCollapsed ? (
          <div className="p-4 border-b border-slate-200/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
              {currentProject ? currentProject.name : "TamTask Space"}
            </div>
            <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center justify-between">
              <span className="truncate">{activeSprintName || "Chu Kỳ Hiện Tại"}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold px-1.5 py-0.5 rounded ml-1 shrink-0">
                ĐANG CHẠY
              </span>
            </div>
          </div>
        ) : (
          <div className="h-4" />
        )}

        {/* Navigation Links */}
        <nav className="p-2 space-y-0.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center px-0" : "px-3"
                } py-2 rounded-md text-xs transition relative group ${
                  isActive
                    ? "bg-rose-50/80 text-[#C41230] font-semibold"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#C41230] rounded-r" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C41230]" : "text-slate-500 group-hover:text-slate-700"}`} />
                {!isCollapsed && (
                  <div className="ml-3 flex-1 flex items-center justify-between text-left">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        isActive ? "bg-rose-100 text-[#C41230]" : "bg-slate-200/70 text-slate-600"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: TamTask Status & Collapse Button */}
      <div className="p-3 border-t border-slate-200/70">
        {!isCollapsed && (
          <div className="mb-2 bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-slate-800 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>TamTask Space</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Không gian quản trị công việc thông minh.
            </p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
          title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

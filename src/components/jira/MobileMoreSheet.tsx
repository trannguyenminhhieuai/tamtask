"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, Project } from "@/types/jira";
import { NavView } from "./Sidebar";
import {
  X,
  LayoutDashboard,
  ClipboardList,
  GitBranch,
  BarChart3,
  Zap,
  Shield,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  FolderGit2,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { haptic } from "@/lib/haptic";

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentProject?: Project | null;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  onOpenShortcutsModal?: () => void;
  onLogout: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentProject,
  projects,
  onSelectProject,
  currentView,
  onViewChange,
  onOpenShortcutsModal,
  onLogout,
}) => {
  const touchStartY = useRef<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        haptic.light();
        onClose();
      }
      touchStartY.current = null;
    }
  };

  const toggleDarkMode = () => {
    haptic.medium();
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

  const handleNavigate = (view: NavView) => {
    haptic.selection();
    onViewChange(view);
    onClose();
  };

  const handleSelectProj = (projId: string) => {
    haptic.selection();
    onSelectProject(projId);
    setShowProjectList(false);
  };

  const isAdmin = currentUser.role === "ADMIN";
  const canSeeAutomation = ["ADMIN", "PROJECT_LEAD", "BA"].includes(currentUser.role);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none md:hidden"
      onClick={onClose}
    >
      <div
        className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-zinc-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grab Handle */}
        <div className="flex flex-col items-center gap-1.5 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* 1. User Profile Header Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/70 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#EE0033]/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#EE0033] border border-red-200 dark:border-red-900/60 shrink-0">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {currentUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 shrink-0 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Current Project & Switcher */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Dự án đang làm việc
            </span>
            {projects.length > 1 && (
              <button
                type="button"
                onClick={() => setShowProjectList(!showProjectList)}
                className="text-[11px] font-bold text-[#EE0033] hover:underline"
              >
                {showProjectList ? "Thu gọn" : `Đổi (${projects.length})`}
              </button>
            )}
          </div>

          {/* Current project card */}
          <div className="p-3 bg-white dark:bg-zinc-800/40 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EE0033] to-[#C7002B] text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                {currentProject ? currentProject.key.slice(0, 3) : "TT"}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate block">
                  {currentProject ? currentProject.name : "TamTask Hub"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  Mã: {currentProject?.key || "TT"}
                </span>
              </div>
            </div>
          </div>

          {/* Project List dropdown when expanded */}
          {showProjectList && (
            <div className="p-1.5 bg-slate-50 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1 animate-in fade-in duration-150">
              {projects.map((proj) => {
                const isSelected = proj.id === currentProject?.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleSelectProj(proj.id)}
                    className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition ${
                      isSelected
                        ? "bg-rose-50 dark:bg-rose-950/40 text-[#EE0033] font-bold"
                        : "hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-slate-200 dark:bg-zinc-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {proj.key.slice(0, 2)}
                      </span>
                      <span className="truncate">{proj.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#EE0033] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Extended Navigation Actions */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
            Điều hướng mở rộng
          </span>

          <div className="space-y-1">
            {/* Dashboard / Báo cáo */}
            <button
              type="button"
              onClick={() => handleNavigate("DASHBOARD")}
              className={`w-full p-3 rounded-2xl flex items-center justify-between border transition active:scale-[0.99] ${
                currentView === "DASHBOARD"
                  ? "bg-rose-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-900/60 text-[#EE0033] font-bold"
                  : "bg-white dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">Báo Cáo & Thống Kê</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Biểu đồ Burn-down, Velocity, phân bổ trạng thái
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Automation Rules */}
            {canSeeAutomation && (
              <button
                type="button"
                onClick={() => handleNavigate("AUTOMATION")}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border transition active:scale-[0.99] ${
                  currentView === "AUTOMATION"
                    ? "bg-rose-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-900/60 text-[#EE0033] font-bold"
                    : "bg-white dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">Quy Tắc Tự Động</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Tự động hóa luồng chuyển trạng thái và thông báo
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}

            {/* Admin Console */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavigate("ADMIN")}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border transition active:scale-[0.99] ${
                  currentView === "ADMIN"
                    ? "bg-rose-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-900/60 text-[#EE0033] font-bold"
                    : "bg-white dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">Quản Trị Hệ Thống</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Quản lý tài khoản, phân quyền vai trò người dùng
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}

            {/* Shortcuts Help */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenShortcutsModal?.();
                onClose();
              }}
              className="w-full p-3 rounded-2xl flex items-center justify-between bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">Phím Tắt Hệ Thống</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Xem danh sách phím tắt thao tác nhanh
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* 4. Settings & Actions */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80">
            <div className="flex items-center space-x-2.5">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {isDarkMode ? "Giao diện Tối (Dark Mode)" : "Giao diện Sáng (Light Mode)"}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                isDarkMode ? "bg-[#EE0033]" : "bg-slate-300 dark:bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  isDarkMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={() => {
              haptic.medium();
              onLogout();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-[#EE0033] dark:text-rose-400 border border-red-200 dark:border-red-900/40 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Khỏi Tài Khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};

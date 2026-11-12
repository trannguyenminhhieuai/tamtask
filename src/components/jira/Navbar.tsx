"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  ShieldCheck,
  HelpCircle,
  Layers,
  LogOut,
  ChevronDown,
  FolderPlus,
  Check,
  Users,
  Shield,
  Briefcase,
  Code2,
  CheckSquare,
  Eye,
  Clock,
} from "lucide-react";
import { User, Project, NotificationItem } from "@/types/jira";
import { useSession, signOut } from "next-auth/react";
import { LoginModal } from "./LoginModal";

interface NavbarProps {
  currentUser: User;
  projects?: Project[];
  currentProject?: Project | null;
  onSelectProject?: (project: Project) => void;
  onOpenCreateProject?: () => void;
  onOpenProjectMembers?: () => void;
  onCreateIssueClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsModal?: () => void;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  ADMIN: {
    label: "Quản trị viên",
    icon: Shield,
    color: "bg-emerald-50 text-[#079455] border-emerald-200/80",
  },
  PROJECT_LEAD: {
    label: "Trưởng dự án",
    icon: Briefcase,
    color: "bg-sky-50 text-sky-800 border-sky-200/80",
  },
  DEVELOPER: {
    label: "Kỹ sư phần mềm",
    icon: Code2,
    color: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  },
  QA: {
    label: "Kiểm thử QA",
    icon: CheckSquare,
    color: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
  VIEWER: {
    label: "Người theo dõi",
    icon: Eye,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  PENDING: {
    label: "Chờ phê duyệt",
    icon: Clock,
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  projects = [],
  currentProject = null,
  onSelectProject,
  onOpenCreateProject,
  onOpenProjectMembers,
  onCreateIssueClick,
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
  onOpenShortcutsModal,
}) => {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  }, []);

  const displayUser = session?.user
    ? {
        name: session.user.name || currentUser.name,
        email: session.user.email || currentUser.email,
        avatar: session.user.image || currentUser.avatar,
        role: (session.user as any).role || currentUser.role,
      }
    : currentUser;

  const currentRole = displayUser.role || "DEVELOPER";
  const roleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.DEVELOPER;
  const RoleIcon = roleConfig.icon;
  const canManageProjects = currentRole === "ADMIN" || currentRole === "PROJECT_LEAD";
  const canCreateIssue = currentRole !== "VIEWER" && currentRole !== "PENDING";
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter projects by user membership: Admins see all; others see projects they are member of
  const accessibleProjects = currentRole === "ADMIN"
    ? projects
    : projects.filter((p) => {
        if (p.members && Array.isArray(p.members)) {
          return p.members.some((m) => m.userId === currentUser.id);
        }
        return p.leadId === currentUser.id;
      });

  const displayedProjects = accessibleProjects.length > 0
    ? accessibleProjects
    : (currentProject ? [currentProject] : projects);

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
    } catch {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-[#D7D7D7] px-4 flex items-center justify-between sticky top-0 z-40 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left: TamTask Brand & Project Selector */}
      <div className="flex items-center space-x-2.5">
        {/* Project Selector Dropdown */}
        <div className="relative" ref={projectMenuRef}>
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-[#F8F8F8] border border-transparent hover:border-[#D7D7D7] transition text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#079455] flex items-center justify-center text-white shadow-xs font-black text-xs tracking-tight">
              {currentProject ? currentProject.key.slice(0, 3) : "TT"}
            </div>
            <div>
              <div className="font-bold text-[#111827] text-sm leading-none flex items-center gap-1.5">
                <span className="truncate max-w-[150px]">
                  {currentProject?.name || "TamTask Space"}
                </span>
                <span className="text-[10px] bg-[#F8F8F8] text-[#111827] font-mono font-medium px-1.5 py-0.5 rounded border border-[#D7D7D7]">
                  {currentProject?.key || "TAM"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9B9B9B] group-hover:text-[#111827] transition" />
              </div>
              <div className="text-[11px] text-[#9B9B9B] font-medium mt-0.5">TamTask Workspace</div>
            </div>
          </button>

          {/* Project Dropdown Menu */}
          {showProjectDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                <span>Dự Án Khả Dụng</span>
                <span className="text-[10px] text-slate-400 font-mono">{displayedProjects.length} dự án</span>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {displayedProjects.map((p) => {
                  const isSelected = currentProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (onSelectProject) onSelectProject(p);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition hover:bg-slate-50 ${
                        isSelected ? "bg-slate-100/70" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {p.key.slice(0, 3)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.key}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-slate-900 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Create Project Button (Admin & Project Lead only) */}
              {canManageProjects && onOpenCreateProject && (
                <div className="border-t border-slate-100 pt-1 mt-1 px-2">
                  <button
                    onClick={() => {
                      setShowProjectDropdown(false);
                      onOpenCreateProject();
                    }}
                    className="w-full flex items-center space-x-2 text-xs font-medium text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded transition"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-slate-700" />
                    <span>+ Tạo Dự Án Mới</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Members Button (Admin & Project Lead) */}
        {canManageProjects && onOpenProjectMembers && currentProject && (
          <button
            onClick={onOpenProjectMembers}
            className="flex items-center space-x-1.5 bg-[#F8F8F8] hover:bg-white text-[#111827] border border-[#D7D7D7] text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
            title="Quản lý nhân sự và thành viên tham gia dự án này"
          >
            <Users className="w-3.5 h-3.5 text-[#9B9B9B]" />
            <span className="hidden md:inline">Nhân sự dự án</span>
          </button>
        )}

        {/* Create Issue Button */}
        {canCreateIssue ? (
          <button
            onClick={onCreateIssueClick}
            className="flex items-center space-x-1.5 bg-[#079455] hover:bg-[#06854D] active:bg-[#057A44] focus:ring-3 focus:ring-[#079455]/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tạo Công Việc</span>
          </button>
        ) : (
          <div
            className="flex items-center space-x-1 text-[#9B9B9B] text-xs px-2.5 py-1 rounded-lg border border-[#D7D7D7] bg-[#F8F8F8] cursor-not-allowed"
            title="Quyền chỉ được xem, không thể tạo task"
          >
            <span>Chỉ xem</span>
          </div>
        )}
      </div>

      {/* Middle: Quick Search & Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-6 hidden sm:block">
        <button
          type="button"
          onClick={() => onOpenCommandPalette?.()}
          className="w-full relative flex items-center bg-[#F8F8F8] hover:bg-white border border-[#D7D7D7] hover:border-[#079455] rounded-lg pl-9 pr-3 py-1.5 text-xs text-left text-[#9B9B9B] hover:text-[#111827] transition shadow-2xs group focus:ring-3 focus:ring-[#079455]/20"
        >
          <Search className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#079455] absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
          <span className="truncate">
            {searchQuery ? `Lọc: "${searchQuery}"` : `Tìm nhanh task, dự án, lệnh... (Ctrl + K)`}
          </span>
          <kbd className="ml-auto text-[10px] bg-white border border-[#D7D7D7] text-[#111827] px-1.5 py-0.5 rounded font-mono font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Role Badge & User Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Role Badge Indicator - Non-AI, Icon-based */}
        <div
          className={`flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${roleConfig.color}`}
          title={`Quyền hạn hiện tại: ${roleConfig.label}`}
        >
          <RoleIcon className="w-3 h-3" />
          <span>{roleConfig.label}</span>
        </div>

        <button
          type="button"
          onClick={() => onOpenShortcutsModal?.()}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
          title="Phím tắt hệ thống (Nhấn ?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition relative"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-4 h-4 bg-[#EE0033] text-white rounded-full text-[9px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#D7D7D7] rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Thông báo</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-medium text-[#079455] hover:underline"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-slate-50 transition cursor-pointer flex items-start space-x-2.5 ${
                        !n.isRead ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.isRead ? "bg-[#079455]" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-800 flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {n.createdAt}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Không có thông báo mới
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {session ? (
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 text-left focus:outline-none"
            >
              <img
                src={displayUser.avatar}
                alt={displayUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
              />
              <div className="hidden lg:block">
                <div className="text-xs font-medium text-slate-800 leading-none">
                  {displayUser.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                  {displayUser.email}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-800">{displayUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{displayUser.email}</div>
                  <div className="mt-1">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-flex items-center gap-1 ${roleConfig.color}`}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleConfig.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất (Sign out)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="pl-2 border-l border-[#D7D7D7]">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center space-x-1.5 text-xs font-semibold bg-[#079455] hover:bg-[#06854D] active:bg-[#057A44] text-white px-3.5 py-1.5 rounded-lg transition shadow-xs focus:ring-3 focus:ring-[#079455]/20"
            >
              <span>Đăng Nhập</span>
            </button>
          </div>
        )}
      </div>

      {/* Login Options Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
};

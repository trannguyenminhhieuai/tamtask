"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  Menu,
  Sun,
  Moon,
  History,
  Trash2,
  Bookmark,
  Bug,
  FolderGit2,
  ListTree,
} from "lucide-react";
import { User, Project, NotificationItem } from "@/types/jira";
import { useSession, signOut } from "next-auth/react";
import { LoginModal } from "./LoginModal";
import { recentItems, RecentItem } from "@/lib/recentItems";

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
  onToggleSidebar?: () => void;
  currentView?: string;
  onViewChange?: (view: any) => void;
  onSelectRecentIssue?: (issueId: string) => void;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  ADMIN: {
    label: "Quản trị viên",
    icon: Shield,
    color: "bg-rose-50 text-[#EE0033] border-rose-200/80",
  },
  PROJECT_LEAD: {
    label: "Trưởng dự án",
    icon: Briefcase,
    color: "bg-sky-50 text-sky-800 border-sky-200/80",
  },
  BA: {
    label: "Phân tích nghiệp vụ (BA)",
    icon: Briefcase,
    color: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
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
  onToggleSidebar,
  currentView = "BOARD",
  onViewChange,
  onSelectRecentIssue,
}) => {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRecentMenu, setShowRecentMenu] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const recentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecents(recentItems.get());
    const handleStorageChange = () => {
      setRecents(recentItems.get());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const displayUser = session?.user
    ? {
        id: (session.user as any).id || currentUser.id,
        name: session.user.name || currentUser.name,
        email: session.user.email || currentUser.email,
        avatar: session.user.image || currentUser.avatar,
        role: (session.user as any).role || currentUser.role,
      }
    : currentUser;

  const targetUserId = displayUser?.id;
  const targetProjectId = currentProject?.id;

  const fetchNotifications = useCallback(() => {
    if (!targetUserId) return;
    const url = targetProjectId
      ? `/api/notifications?userId=${encodeURIComponent(targetUserId)}&projectId=${encodeURIComponent(targetProjectId)}`
      : `/api/notifications?userId=${encodeURIComponent(targetUserId)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  }, [targetUserId, targetProjectId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const currentRole = displayUser.role || "DEVELOPER";
  const roleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.DEVELOPER;
  const RoleIcon = roleConfig.icon;
  const canManageProjects = currentRole === "ADMIN" || currentRole === "PROJECT_LEAD" || currentRole === "BA";
  const canCreateIssue = currentRole !== "VIEWER" && currentRole !== "PENDING";
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter projects by user membership: Admins see all; others see projects they are member of
  const accessibleProjects = useMemo(() => {
    if (currentRole === "ADMIN") return projects;
    const uEmail = currentUser.email?.toLowerCase();
    return projects.filter((p) => {
      const isLead =
        p.leadId === currentUser.id ||
        p.lead?.id === currentUser.id ||
        Boolean(uEmail && p.lead?.email && p.lead.email.toLowerCase() === uEmail);
      const isMember =
        Array.isArray(p.members) &&
        p.members.some(
          (m) =>
            m.userId === currentUser.id ||
            m.user?.id === currentUser.id ||
            Boolean(uEmail && m.user?.email && m.user.email.toLowerCase() === uEmail)
        );
      return isLead || isMember;
    });
  }, [currentRole, projects, currentUser.id, currentUser.email]);

  const displayedProjects = accessibleProjects;

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true, userId: targetUserId }),
      });
    } catch {}
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id, userId: targetUserId }),
      }).catch(() => {});
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (recentMenuRef.current && !recentMenuRef.current.contains(e.target as Node)) {
        setShowRecentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderRecentTypeIcon = (type: string) => {
    switch (type) {
      case "STORY":
        return <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />;
      case "BUG":
        return <Bug className="w-3.5 h-3.5 text-red-600 fill-red-100" />;
      case "TASK":
        return <CheckSquare className="w-3.5 h-3.5 text-blue-600" />;
      case "EPIC":
        return <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />;
      case "SUBTASK":
        return <ListTree className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}p trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h trước`;
    return `${Math.floor(diffHour / 24)}d trước`;
  };

  return (
    <header className="h-14 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl border-b border-[#D7D7D7]/80 dark:border-zinc-800/80 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors duration-200">
      {/* Left: TamTask Brand & Project Selector */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Mobile Hamburger Menu Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg md:hidden transition"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* TamTask Brand Identity (Aligned vertically with collapsed sidebar icon) */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center text-white shadow-xs font-black text-xs tracking-tight shrink-0">
            TT
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#111827] dark:text-zinc-100 font-sans">
            TamTask
          </span>
        </div>

        <div className="h-4 w-px bg-[#D7D7D7] dark:bg-zinc-800 hidden sm:block" />

        {/* Project Selector Dropdown */}
        <div className="relative z-40" ref={projectMenuRef}>
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center space-x-2 p-1 sm:p-1.5 rounded-full hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-[#D7D7D7] dark:border-zinc-700/80 transition text-left group px-2 sm:px-2.5 shadow-2xs"
          >
            <div className={`w-5 h-5 rounded-full bg-[#EE0033] flex items-center justify-center text-white shadow-xs font-black ${
              (currentProject?.key?.slice(0, 3) || "TT").length >= 3 ? "text-[6.5px] tracking-tighter" : "text-[8px] tracking-tight"
            } shrink-0`}>
              {currentProject ? currentProject.key.slice(0, 3) : "TT"}
            </div>
            <div className="font-semibold text-[#111827] dark:text-zinc-200 text-xs leading-none flex items-center gap-1">
              <span className="truncate max-w-[80px] xs:max-w-[110px] sm:max-w-[140px]">
                {currentProject?.name || "TamTask"}
              </span>
              <ChevronDown className="w-3 h-3 text-[#9B9B9B] group-hover:text-[#111827] dark:group-hover:text-zinc-100 transition shrink-0" />
            </div>
          </button>

          {/* Project Dropdown Menu */}
          {showProjectDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#D7D7D7] dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span>Dự Án Khả Dụng</span>
                <span className="text-[10px] font-mono">{displayedProjects.length} dự án</span>
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
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition hover:bg-slate-50 dark:hover:bg-zinc-800/60 ${
                        isSelected ? "bg-rose-50/70 dark:bg-rose-950/30" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            p.key.slice(0, 3).length >= 3 ? "text-[7.5px] tracking-tighter" : "text-[9px] tracking-tight"
                          } font-bold ${
                            isSelected
                              ? "bg-[#EE0033] text-white shadow-xs"
                              : "bg-slate-100 dark:bg-zinc-800 text-[#111827] dark:text-zinc-200 border border-[#D7D7D7] dark:border-zinc-700"
                          }`}
                        >
                          {p.key.slice(0, 3)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{p.key}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#EE0033] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Create Project Button (Admin & Project Lead only) */}
              {canManageProjects && onOpenCreateProject && (
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-1 mt-1 px-2">
                  <button
                    onClick={() => {
                      setShowProjectDropdown(false);
                      onOpenCreateProject();
                    }}
                    className="w-full flex items-center space-x-2 text-xs font-medium text-slate-900 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-xl transition"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
                    <span>+ Tạo Dự Án Mới</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Auto-layout centered Frosted Glass Search Bar with thin border */}
      <div className="flex-1 min-w-0 flex justify-center px-2 sm:px-4">
        <button
          type="button"
          onClick={() => onOpenCommandPalette?.()}
          className="w-full flex items-center justify-between bg-white/70 dark:bg-zinc-800/70 hover:bg-white/95 dark:hover:bg-zinc-800/95 backdrop-blur-md border border-[#D7D7D7]/80 dark:border-zinc-700/80 hover:border-[#EE0033]/60 dark:hover:border-[#EE0033]/60 rounded-full px-4 py-1.5 text-xs text-left text-[#6B7280] dark:text-zinc-400 hover:text-[#111827] dark:hover:text-zinc-100 transition shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] group focus:ring-2 focus:ring-[#EE0033]/20"
          title="Tìm kiếm nhanh (Ctrl + K)"
        >
          <div className="flex items-center space-x-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-[#9B9B9B] group-hover:text-[#EE0033] transition-colors shrink-0" />
            <span className="truncate">
              {searchQuery ? `"${searchQuery}"` : "Tìm nhanh task, dự án, lệnh... (Ctrl + K)"}
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center text-[10px] bg-white/80 dark:bg-zinc-700/80 border border-[#D7D7D7]/60 dark:border-zinc-600/80 text-[#111827] dark:text-zinc-200 px-2 py-0.5 rounded-full font-mono font-semibold shadow-2xs shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Project Members Button (Admin & Project Lead) */}
        {canManageProjects && onOpenProjectMembers && currentProject && (
          <button
            onClick={onOpenProjectMembers}
            className="hidden sm:flex items-center space-x-1.5 bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-800 text-[#111827] dark:text-zinc-200 border border-[#D7D7D7] dark:border-zinc-700/80 text-xs font-semibold px-3 py-1.5 rounded-full transition shadow-2xs backdrop-blur-md"
            title="Quản lý nhân sự và thành viên tham gia dự án này"
          >
            <Users className="w-3.5 h-3.5 text-[#9B9B9B]" />
            <span className="hidden lg:inline">Nhân sự</span>
          </button>
        )}

        {/* Create Issue Button ("+ Thêm mới") */}
        {canCreateIssue ? (
          <button
            onClick={onCreateIssueClick}
            className="flex items-center space-x-1.5 bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] focus:ring-3 focus:ring-[#EE0033]/20 text-white text-xs font-semibold px-3.5 sm:px-4 py-1.5 rounded-full transition shadow-xs shrink-0"
            title="Tạo mới công việc / task"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            <span>Thêm mới</span>
          </button>
        ) : (
          <div
            className="flex items-center space-x-1 text-[#9B9B9B] text-xs px-2.5 sm:px-3 py-1 rounded-full border border-[#D7D7D7] bg-[#F8F8F8] cursor-not-allowed shrink-0"
            title="Quyền chỉ được xem, không thể tạo task"
          >
            <span>Chỉ xem</span>
          </div>
        )}

        {/* Light / Dark Mode Toggle Button on Header */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
          title={isDarkMode ? "Chuyển sang giao diện Sáng (Light Mode)" : "Chuyển sang giao diện Tối (Dark Mode)"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Recent Viewed Issues Popover */}
        <div className="relative" ref={recentMenuRef}>
          <button
            type="button"
            onClick={() => {
              setRecents(recentItems.get());
              setShowRecentMenu(!showRecentMenu);
            }}
            className={`p-1.5 rounded-lg transition relative ${
              showRecentMenu
                ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
            title="Công việc đã xem gần đây"
          >
            <Clock className="w-4 h-4" />
            {recents.length > 0 && (
              <span className="w-1.5 h-1.5 bg-[#EE0033] rounded-full absolute top-1 right-1" />
            )}
          </button>

          {showRecentMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#D7D7D7] dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Đã xem gần đây
                  </span>
                </div>
                {recents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      recentItems.clear();
                      setRecents([]);
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
                    title="Xóa lịch sử đã xem"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60">
                {recents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                    Chưa có công việc nào xem gần đây
                  </div>
                ) : (
                  recents.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setShowRecentMenu(false);
                        if (onSelectRecentIssue) onSelectRecentIssue(item.id);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/70 transition flex items-start gap-2.5 group"
                    >
                      <div className="mt-0.5 shrink-0">
                        {renderRecentTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-semibold text-[#EE0033] group-hover:underline">
                            {item.key}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {formatRelativeTime(item.viewedAt)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate mt-0.5">
                          {item.title}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition relative"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-4 h-4 bg-[#EE0033] text-white rounded-full text-[9px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white dark:ring-zinc-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#D7D7D7] dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Thông báo</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-medium text-[#EE0033] hover:underline"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition cursor-pointer flex items-start space-x-2.5 ${
                        !n.isRead ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.isRead ? "bg-[#EE0033]" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                            {n.createdAt}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-snug">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500">
                    Không có thông báo mới
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {session ? (
          <div className="relative pl-2 border-l border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 text-left focus:outline-none"
            >
              <img
                src={displayUser.avatar}
                alt={displayUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-zinc-700"
              />
              <div className="hidden lg:block">
                <div className="text-xs font-medium text-slate-800 dark:text-zinc-200 leading-none">
                  {displayUser.name}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 leading-none mt-0.5">
                  {displayUser.email}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#D7D7D7] dark:border-zinc-800 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-zinc-800">
                  <div className="text-xs font-bold text-[#111827] dark:text-zinc-100">{displayUser.name}</div>
                  <div className="text-[10px] text-[#9B9B9B] dark:text-zinc-500 truncate mt-0.5">{displayUser.email}</div>
                  <div className="mt-1.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${roleConfig.color}`}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleConfig.label}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-3 py-2 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 transition font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất (Sign out)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="pl-2 border-l border-[#D7D7D7] dark:border-zinc-800">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center space-x-1.5 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white px-4 py-1.5 rounded-full transition shadow-xs focus:ring-3 focus:ring-[#EE0033]/20"
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

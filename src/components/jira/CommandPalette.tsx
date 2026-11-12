"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  CheckSquare,
  Bookmark,
  Bug,
  FolderGit2,
  FolderKanban,
  ListTodo,
  GanttChartSquare,
  BarChart3,
  Bot,
  Shield,
  Plus,
  ArrowRight,
  Keyboard,
  X,
  Layers,
} from "lucide-react";
import { Issue, Project } from "@/types/jira";
import { NavView } from "./Sidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[];
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (p: Project) => void;
  onSelectIssue: (issue: Issue) => void;
  onSelectView: (view: NavView) => void;
  onOpenCreateIssue: () => void;
  onOpenShortcutsHelp: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  issues,
  projects,
  currentProject,
  onSelectProject,
  onSelectIssue,
  onSelectView,
  onOpenCreateIssue,
  onOpenShortcutsHelp,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();

    const actionList: Array<{
      id: string;
      category: "ACTION" | "VIEW" | "ISSUE" | "PROJECT";
      title: string;
      subtitle?: string;
      icon: React.ReactNode;
      onSelect: () => void;
    }> = [];

    // 1. Core Quick Actions
    actionList.push({
      id: "action-create",
      category: "ACTION",
      title: "Tạo công việc mới (Create Issue)",
      subtitle: "Phím tắt nhanh: bấm 'c'",
      icon: <Plus className="w-4 h-4 text-red-600" />,
      onSelect: () => {
        onOpenCreateIssue();
        onClose();
      },
    });

    actionList.push({
      id: "action-shortcuts",
      category: "ACTION",
      title: "Xem bảng phím tắt Jira (Keyboard Shortcuts)",
      subtitle: "Phím tắt nhanh: bấm '?'",
      icon: <Keyboard className="w-4 h-4 text-amber-500" />,
      onSelect: () => {
        onOpenShortcutsHelp();
        onClose();
      },
    });

    // 2. Navigation Views
    const views: Array<{ id: NavView; label: string; icon: React.ReactNode }> = [
      { id: "BOARD", label: "Kanban Board", icon: <FolderKanban className="w-4 h-4 text-blue-500" /> },
      { id: "BACKLOG", label: "Sprint Backlog", icon: <ListTodo className="w-4 h-4 text-emerald-500" /> },
      { id: "TIMELINE", label: "Timeline / Gantt Chart", icon: <GanttChartSquare className="w-4 h-4 text-purple-500" /> },
      { id: "DASHBOARD", label: "Báo cáo & Burndown Chart", icon: <BarChart3 className="w-4 h-4 text-amber-500" /> },
      { id: "AUTOMATION", label: "Quy tắc tự động hóa (Automation)", icon: <Bot className="w-4 h-4 text-indigo-500" /> },
      { id: "ADMIN", label: "Cài đặt & Quản trị hệ thống", icon: <Shield className="w-4 h-4 text-rose-500" /> },
    ];

    views.forEach((v) => {
      actionList.push({
        id: `view-${v.id}`,
        category: "VIEW",
        title: `Đi tới: ${v.label}`,
        subtitle: "Chuyển giao diện làm việc",
        icon: v.icon,
        onSelect: () => {
          onSelectView(v.id);
          onClose();
        },
      });
    });

    // 3. Projects
    projects.forEach((p) => {
      actionList.push({
        id: `proj-${p.id}`,
        category: "PROJECT",
        title: `Dự án: [${p.key}] ${p.name}`,
        subtitle: currentProject?.id === p.id ? "Dự án đang mở" : "Chuyển sang không gian dự án này",
        icon: <Layers className="w-4 h-4 text-slate-700" />,
        onSelect: () => {
          onSelectProject(p);
          onClose();
        },
      });
    });

    // 4. Issues
    issues.forEach((issue) => {
      let icon = <CheckSquare className="w-4 h-4 text-blue-500" />;
      if (issue.type === "BUG") icon = <Bug className="w-4 h-4 text-red-500" />;
      if (issue.type === "STORY") icon = <Bookmark className="w-4 h-4 text-emerald-500" />;
      if (issue.type === "EPIC") icon = <FolderGit2 className="w-4 h-4 text-purple-500" />;

      actionList.push({
        id: `issue-${issue.id}`,
        category: "ISSUE",
        title: `${issue.key}: ${issue.title}`,
        subtitle: `${issue.status} • ${issue.assignee?.name || "Chưa gán"}`,
        icon,
        onSelect: () => {
          onSelectIssue(issue);
          onClose();
        },
      });
    });

    if (!q) {
      return actionList.slice(0, 12);
    }

    return actionList.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [
    query,
    issues,
    projects,
    currentProject,
    onOpenCreateIssue,
    onOpenShortcutsHelp,
    onSelectView,
    onSelectProject,
    onSelectIssue,
    onClose,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-start justify-center pt-20 p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm công việc, dự án, view hoặc gõ lệnh... (Nhấn Esc để đóng)"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm font-medium"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Không tìm thấy kết quả phù hợp với "{query}".
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-red-50 text-slate-900 shadow-xs"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? "bg-white shadow-xs" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate leading-snug">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold mr-1">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold mr-1">↓</kbd>
              Di chuyển
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold mr-1">↵</kbd>
              Chọn
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Mẹo: Gõ</span>
            <kbd className="px-1 bg-white border border-slate-200 rounded font-bold">c</kbd>
            <span>để tạo task,</span>
            <kbd className="px-1 bg-white border border-slate-200 rounded font-bold">?</kbd>
            <span>để xem tất cả phím tắt</span>
          </div>
        </div>
      </div>
    </div>
  );
};


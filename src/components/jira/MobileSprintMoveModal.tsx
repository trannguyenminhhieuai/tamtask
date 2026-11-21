"use client";

import React, { useEffect, useRef } from "react";
import { Sprint } from "@/types/jira";
import { Layers, Check, X, Inbox } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface MobileSprintMoveModalProps {
  isOpen: boolean;
  issueId: string;
  issueKey: string;
  issueTitle: string;
  currentSprintId?: string | null;
  sprints: Sprint[];
  onClose: () => void;
  onSelectSprint: (issueId: string, sprintId: string | null) => void;
}

export const MobileSprintMoveModal: React.FC<MobileSprintMoveModalProps> = ({
  isOpen,
  issueId,
  issueKey,
  issueTitle,
  currentSprintId,
  sprints,
  onClose,
  onSelectSprint,
}) => {
  const touchStartY = useRef<number | null>(null);

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

  const handleSelect = (sprintId: string | null) => {
    haptic.selection();
    onSelectSprint(issueId, sprintId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none md:hidden"
      onClick={onClose}
    >
      <div
        className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-zinc-800 p-5 space-y-3.5 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grab Handle */}
        <div className="flex flex-col items-center gap-1.5 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
              Chuyển Chu Kỳ Phát Triển
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate">
              {issueKey} • {issueTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sprint Options */}
        <div className="space-y-1.5 pt-1">
          {/* 1. Option Backlog */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all duration-150 border text-left ${
              !currentSprintId
                ? "bg-rose-50 dark:bg-rose-950/40 border-[#EE0033]/60 text-[#EE0033] shadow-xs"
                : "bg-slate-50/70 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-zinc-700/80 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-snug">Hàng đợi công việc (Backlog)</div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Lưu trữ chưa xếp vào chu kỳ cụ thể
                </div>
              </div>
            </div>
            {!currentSprintId && <Check className="w-4 h-4 text-[#EE0033] stroke-[2.5] shrink-0" />}
          </button>

          {/* 2. Sprints list */}
          {sprints.map((s) => {
            const isCurrent = currentSprintId === s.id;
            const isActive = s.status === "ACTIVE";

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s.id)}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all duration-150 border text-left ${
                  isCurrent
                    ? "bg-rose-50 dark:bg-rose-950/40 border-[#EE0033]/60 text-[#EE0033] shadow-xs"
                    : "bg-slate-50/70 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold leading-snug">{s.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                        }`}
                      >
                        {isActive ? "Đang diễn ra" : "Kế hoạch"}
                      </span>
                    </div>
                    {(s.startDate || s.endDate) && (
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {s.startDate || "Chưa đặt"} ~ {s.endDate || "Chưa đặt"}
                      </div>
                    )}
                  </div>
                </div>

                {isCurrent && <Check className="w-4 h-4 text-[#EE0033] stroke-[2.5] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Bottom Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100/60 dark:bg-zinc-800/60 text-center"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

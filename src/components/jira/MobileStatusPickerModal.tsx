"use client";

import React, { useEffect, useRef } from "react";
import { WorkflowStatus, IssueStatus } from "@/types/jira";
import { Check, X } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface MobileStatusPickerModalProps {
  isOpen: boolean;
  currentStatus: IssueStatus;
  statuses: WorkflowStatus[];
  taskKey?: string;
  taskTitle?: string;
  onClose: () => void;
  onSelectStatus: (status: IssueStatus) => void;
}

export const MobileStatusPickerModal: React.FC<MobileStatusPickerModalProps> = ({
  isOpen,
  currentStatus,
  statuses,
  taskKey,
  taskTitle,
  onClose,
  onSelectStatus,
}) => {
  const touchStartY = useRef<number | null>(null);

  // Keyboard Escape dismissal (Rule B)
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

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none md:hidden"
      onClick={onClose}
    >
      <div
        className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-zinc-800 p-5 space-y-3.5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grab Handle */}
        <div className="flex flex-col items-center gap-1.5 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
              Chuyển Trạng Thái Công Việc
            </h3>
            {taskKey && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate">
                {taskKey} {taskTitle ? `• ${taskTitle}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Statuses List */}
        <div className="space-y-1.5 pt-1">
          {statuses.map((s) => {
            const isCurrent = currentStatus === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  haptic.medium();
                  onSelectStatus(s.id as IssueStatus);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all duration-150 border text-left ${
                  isCurrent
                    ? "bg-rose-50 dark:bg-rose-950/40 border-[#EE0033]/60 text-[#EE0033] shadow-xs"
                    : "bg-slate-50/70 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: s.color }}
                  />
                  <div>
                    <div className="text-xs font-bold leading-snug">{s.name}</div>
                    {typeof s.maxWip === "number" && s.maxWip > 0 && (
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                        Giới hạn WIP: tối đa {s.maxWip} tasks
                      </div>
                    )}
                  </div>
                </div>

                {isCurrent && <Check className="w-4 h-4 text-[#EE0033] stroke-[2.5] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Bottom Cancel Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100/60 dark:bg-zinc-800/60 text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

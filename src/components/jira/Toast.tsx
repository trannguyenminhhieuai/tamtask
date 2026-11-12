"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, RotateCcw, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  undoable: (title: string, onUndo: () => void, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToastHandler: ((item: Omit<ToastItem, "id">) => void) | null = null;

export const notify = {
  success: (title: string, message?: string) => {
    globalToastHandler?.({ type: "success", title, message });
  },
  error: (title: string, message?: string) => {
    globalToastHandler?.({ type: "error", title, message });
  },
  undoable: (title: string, onUndo: () => void, message?: string) => {
    globalToastHandler?.({
      type: "info",
      title,
      message,
      undoAction: onUndo,
      undoLabel: "Hoàn tác",
      duration: 5000,
    });
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = item.duration ?? 4500;
    const newToast: ToastItem = { ...item, id };

    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    globalToastHandler = addToast;
    return () => {
      globalToastHandler = null;
    };
  }, [addToast]);

  const value = {
    toast: addToast,
    success: (title: string, message?: string) => addToast({ type: "success", title, message }),
    error: (title: string, message?: string) => addToast({ type: "error", title, message }),
    undoable: (title: string, onUndo: () => void, message?: string) =>
      addToast({
        type: "info",
        title,
        message,
        undoAction: onUndo,
        undoLabel: "Hoàn tác",
        duration: 5000,
      }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Render Floating Container - Compact Mini-Pill Style */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-1.5 pointer-events-none">
        {toasts.map((t) => {
          const isError = t.type === "error";
          const isSuccess = t.type === "success";
          const isWarning = t.type === "warning";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in ${
                isError
                  ? "bg-rose-950/90 text-rose-50 border-rose-800 shadow-rose-950/20"
                  : isSuccess
                  ? "bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20"
                  : isWarning
                  ? "bg-amber-950/90 text-amber-50 border-amber-800 shadow-amber-950/20"
                  : "bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20"
              }`}
            >
              <div className="shrink-0">
                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isError && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                {t.type === "info" && <Info className="w-3.5 h-3.5 text-sky-400" />}
              </div>

              <span className="text-xs font-medium text-white truncate max-w-[220px]">
                {t.title}
              </span>

              {t.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    t.undoAction?.();
                    removeToast(t.id);
                  }}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-full transition-colors ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.undoLabel || "Hoàn tác"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-white p-0.5 rounded-full transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: notify.success,
      success: notify.success,
      error: notify.error,
      undoable: notify.undoable,
    };
  }
  return context;
};


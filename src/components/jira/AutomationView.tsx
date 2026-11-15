"use client";

import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, CheckCircle2, Clock, Play, ArrowRight, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { CreateAutomationModal } from "./CreateAutomationModal";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  useMouse1: boolean;
  executionsCount: number;
  lastExecuted: string | null;
}

const INITIAL_RULES: AutomationRule[] = [
  {
    id: "rule-1",
    name: "Tự động hoàn thành Task cha khi tất cả Subtasks đã Done",
    trigger: "Khi tất cả Subtasks chuyển sang DONE",
    action: "Tự động chuyển Parent Issue sang trạng thái DONE",
    isActive: true,
    useMouse1: false,
    executionsCount: 14,
    lastExecuted: "2026-11-08 14:15",
  },
  {
    id: "rule-2",
    name: "Tự động phân bổ công việc thông minh khi tạo mới",
    trigger: "Khi một Task / Bug mới được tạo",
    action: "Tự động phân tích và gán Người thực hiện & Mức ưu tiên tối ưu",
    isActive: true,
    useMouse1: true,
    executionsCount: 38,
    lastExecuted: "2026-11-08 19:30",
  },
  {
    id: "rule-3",
    name: "Kiểm duyệt điều kiện chuyển trạng thái nghiêm ngặt",
    trigger: "Khi kéo task sang IN QA hoặc DONE",
    action: "Kiểm duyệt điều kiện subtasks và PR link trước khi cho phép chuyển",
    isActive: true,
    useMouse1: true,
    executionsCount: 22,
    lastExecuted: "2026-11-08 21:05",
  },
];

export const AutomationView: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/automations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRules(data);
        }
      })
      .catch((err) => console.warn("Failed to load automations from API:", err));
  }, []);

  const toggleRule = async (ruleId: string) => {
    const target = rules.find((r) => r.id === ruleId);
    if (!target) return;
    const newActive = !target.isActive;
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: newActive } : r))
    );

    try {
      await fetch("/api/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ruleId, isActive: newActive }),
      });
    } catch (err) {
      console.error("Failed to toggle automation rule:", err);
    }
  };

  const handleCreateRule = async (newRuleData: {
    name: string;
    trigger: string;
    action: string;
    useMouse1: boolean;
  }) => {
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRuleData),
      });

      if (res.ok) {
        const created = await res.json();
        setRules((prev) => [created, ...prev]);
        return;
      }
    } catch (err) {
      console.error("Failed to save automation rule to DB:", err);
    }

    // Fallback local state
    const fallbackRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: newRuleData.name,
      trigger: newRuleData.trigger,
      action: newRuleData.action,
      isActive: true,
      useMouse1: newRuleData.useMouse1,
      executionsCount: 0,
      lastExecuted: "Vừa tạo xong",
    };
    setRules((prev) => [fallbackRule, ...prev]);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[#F5F6F8] dark:bg-[#09090B] space-y-4 transition-colors duration-200">
      {/* Unified Glass Island Header */}
      <div className="p-4 rounded-2xl bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#EE0033]" />
            <span>Quy Tắc Tự Động Hóa (Automation Rules)</span>
          </h1>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
            {rules.filter((r) => r.isActive).length}/{rules.length} quy tắc đang bật
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white text-xs font-semibold px-3.5 sm:px-4 py-1.5 rounded-full flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Thêm mới</span>
        </button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border bg-white dark:bg-zinc-900 shadow-xs transition ${
              rule.isActive ? "border-gray-200 dark:border-zinc-800" : "border-gray-200/50 dark:border-zinc-800/50 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-zinc-100">{rule.name}</span>
                  {rule.useMouse1 && (
                    <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Tự Động Thông Minh</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-zinc-300 pt-1">
                  <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-1 rounded-xl font-medium">
                    Trigger: {rule.trigger}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                  <span className="bg-rose-50 dark:bg-rose-950/40 text-[#EE0033] dark:text-rose-400 px-2.5 py-1 rounded-xl font-medium">
                    Action: {rule.action}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200 transition"
                  title={rule.isActive ? "Disable rule" : "Enable rule"}
                >
                  {rule.isActive ? (
                    <ToggleRight className="w-8 h-8 text-[#EE0033]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-gray-400 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Last executed: {rule.lastExecuted || "Chưa chạy"}</span>
              </span>
              <span className="font-semibold text-gray-600 dark:text-zinc-400">
                Executed {rule.executionsCount} times
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal create new automation rule */}
      <CreateAutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRule={handleCreateRule}
      />
    </div>
  );
};

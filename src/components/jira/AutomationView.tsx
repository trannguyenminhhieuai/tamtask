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
    <div className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quy Tắc Tự Động Hóa Quy Trình (Workflow Automations)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Thiết lập các quy tắc kích hoạt và hành động tự động nhằm tăng năng suất dự án
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#EE0033] hover:bg-[#D6002E] text-white text-xs font-medium px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Quy Tắc Mới</span>
        </button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-lg border bg-white shadow-sm transition ${
              rule.isActive ? "border-gray-200" : "border-gray-200/50 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-gray-900">{rule.name}</span>
                  {rule.useMouse1 && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                      <span>Tự Động Thông Minh</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-600 pt-1">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                    Trigger: {rule.trigger}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="bg-blue-50 text-[#0052CC] px-2 py-0.5 rounded font-medium">
                    Action: {rule.action}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="text-gray-500 hover:text-gray-800 transition"
                  title={rule.isActive ? "Disable rule" : "Enable rule"}
                >
                  {rule.isActive ? (
                    <ToggleRight className="w-8 h-8 text-[#0052CC]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Last executed: {rule.lastExecuted || "Chưa chạy"}</span>
              </span>
              <span className="font-semibold text-gray-600">
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

"use client";

import React, { useState, useEffect } from "react";
import { Issue, IssuePriority, IssueStatus, IssueType, User, Epic, Sprint, Project } from "@/types/jira";
import { X, Sparkles, Plus, AlertCircle, AlertTriangle, Layers, ExternalLink } from "lucide-react";
import { mouse1 } from "@/lib/mouse1";
import { TiptapEditor } from "./TiptapEditor";

interface CreateIssueModalProps {
  isOpen: boolean;
  users: User[];
  epics: Epic[];
  sprints: Sprint[];
  currentUser: User;
  currentProject?: Project | null;
  initialStatus?: IssueStatus;
  onClose: () => void;
  onCreate: (newIssue: Partial<Issue>) => void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  users,
  epics,
  sprints,
  currentUser,
  currentProject,
  initialStatus = "TODO",
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<IssueType>("TASK");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [epicId, setEpicId] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");
  const [storyPoints, setStoryPoints] = useState<string>("3");
  const [sprintId, setSprintId] = useState(sprints[0]?.id || "");
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Mouse-1 Duplicate Detection state
  const [duplicateMatches, setDuplicateMatches] = useState<Array<{
    id: string;
    key: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    similarity: number;
  }>>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Debounced duplicate detection
  useEffect(() => {
    if (!title || title.trim().length < 4) {
      setDuplicateMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingDuplicate(true);
        const res = await fetch("/api/mouse1/duplicate-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            projectId: currentProject?.id,
          }),
        });
        const data = await res.json();
        if (data.matches && data.matches.length > 0 && data.highestSimilarity >= 0.6) {
          setDuplicateMatches(data.matches);
        } else {
          setDuplicateMatches([]);
        }
      } catch (err) {
        console.error("Duplicate check error:", err);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, currentProject?.id]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedAssignee = users.find((u) => u.id === assigneeId);
    const selectedEpic = epics.find((e) => e.id === epicId);

    onCreate({
      type,
      projectId: currentProject?.id,
      title: title.trim(),
      description: description.trim(),
      status: initialStatus,
      priority,
      assignee: selectedAssignee,
      reporter: currentUser,
      epic: selectedEpic,
      sprintId,
      storyPoints: storyPoints ? parseInt(storyPoints) : 0,
      subtasks: [],
      attachments: [],
      comments: [],
    });

    onClose();
  };

  // Fast Mouse-1 Auto-Fill
  const handleMouse1AutoFill = async () => {
    if (!title.trim()) {
      setAiMessage("Vui lòng nhập tiêu đề tóm tắt trước khi kích hoạt Mouse-1!");
      return;
    }

    setIsAiSuggesting(true);
    setAiMessage(null);

    const result = await mouse1.predictTriage({
      title,
      description,
      issueType: type,
      availableAssignees: users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        currentLoad: u.activeTasksCount,
      })),
      availableEpics: epics.map((e) => ({
        id: e.id,
        name: e.name,
        color: e.color,
      })),
    });

    setIsAiSuggesting(false);

    if (result.decision.recommendedAssigneeId) {
      setAssigneeId(result.decision.recommendedAssigneeId);
    }
    if (result.decision.recommendedPriority) {
      setPriority(result.decision.recommendedPriority);
    }
    if (result.decision.recommendedEpicId) {
      setEpicId(result.decision.recommendedEpicId);
    }

    setAiMessage("Đã tự động chọn Người thực hiện & Mức ưu tiên tối ưu!");
  };

  // Generate BDD Acceptance Criteria
  const handleGenerateCriteria = async () => {
    if (!title.trim()) {
      setAiMessage("Vui lòng nhập tiêu đề trước khi sinh tiêu chí nghiệm thu!");
      return;
    }

    setIsGeneratingCriteria(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/mouse1/generate-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          description,
        }),
      });

      const data = await res.json();
      if (data.acceptanceCriteria) {
        const htmlCriteria = data.acceptanceCriteria
          .split("\n")
          .map((line: string) => {
            if (line.startsWith("### ")) return `<h3>${line.replace("### ", "")}</h3>`;
            if (line.startsWith("- **")) return `<p><strong>${line.replace("- **", "").replace("**: ", "</strong>: ")}</p>`;
            if (line.startsWith("  - **")) return `<p style="margin-left: 20px;"><strong>${line.replace("  - **", "").replace("**: ", "</strong>: ")}</p>`;
            return `<p>${line}</p>`;
          })
          .join("");

        const newDesc = description
          ? `${description}<br/><br/>${htmlCriteria}`
          : htmlCriteria;
        setDescription(newDesc);

        if (data.suggestedStoryPoints && (!storyPoints || storyPoints === "3")) {
          setStoryPoints(String(data.suggestedStoryPoints));
        }
        if (data.suggestedPriority) {
          setPriority(data.suggestedPriority);
        }
        setAiMessage(`Đã sinh bộ tiêu chí nghiệm thu BDD & gợi ý Story Points = ${data.suggestedStoryPoints}!`);
      }
    } catch (err) {
      console.error("Failed to generate criteria:", err);
    } finally {
      setIsGeneratingCriteria(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FAFBFC] flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Tạo Công Việc</h3>
            {currentProject && (
              <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded border border-gray-200">
                {currentProject.key}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Issue Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Loại Công Việc
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IssueType)}
              className="w-full text-xs bg-white border border-gray-300 rounded px-3 py-2 font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
            >
              <option value="STORY">📖 Story</option>
              <option value="TASK">☑️ Task</option>
              <option value="BUG">🐛 Bug</option>
              <option value="EPIC">⚡ Epic</option>
              <option value="SUBTASK">🔹 Subtask</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tiêu đề công việc <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={handleMouse1AutoFill}
                disabled={isAiSuggesting}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAiSuggesting ? "Đang gợi ý..." : "Gợi ý thông minh"}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Xây dựng giao diện đăng nhập Google SSO"
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] transition"
            />
            {aiMessage && (
              <p className="mt-1 text-[11px] text-emerald-700 font-medium">{aiMessage}</p>
            )}

            {/* Duplicate Warning Card */}
            {duplicateMatches.length > 0 && (
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-900">
                      Cảnh báo trùng lặp công việc
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Phát hiện {duplicateMatches.length} công việc có nội dung tương đồng trong dự án:
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {duplicateMatches.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-white/80 p-2 rounded border border-amber-200/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0052CC] text-[11px]">
                              {m.key}
                            </span>
                            <span className="text-gray-900 font-medium line-clamp-1">
                              {m.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-semibold">
                              {m.status}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                              {Math.round(m.similarity * 100)}% trùng
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description with Tiptap Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Description (Rich-Text Editor)
              </label>
              <button
                type="button"
                onClick={handleGenerateCriteria}
                disabled={isGeneratingCriteria}
                className="text-[11px] text-purple-700 hover:text-purple-800 font-medium flex items-center gap-1 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{isGeneratingCriteria ? "Đang sinh tiêu chí..." : "Sinh Tiêu Chí Nghiệm Thu BDD"}</span>
              </button>
            </div>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              placeholder="Nhập mô tả chi tiết, tiêu chí nghiệm thu hoặc bấm 'Sinh Tiêu Chí Nghiệm Thu BDD'..."
              minHeight="140px"
              onGenerateCriteria={handleGenerateCriteria}
              isGeneratingCriteria={isGeneratingCriteria}
            />
          </div>

          {/* 2-Column Selectors */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Người thực hiện
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full text-xs bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
              >
                <option value="">Chưa phân công</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Epic Link */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Thuộc Epic
              </label>
              <select
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                className="w-full text-xs bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
              >
                <option value="">Không có</option>
                {epics.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full text-xs bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
              >
                <option value="HIGHEST">Rất cao (Highest)</option>
                <option value="HIGH">Cao (High)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="LOW">Thấp (Low)</option>
                <option value="LOWEST">Rất thấp (Lowest)</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Điểm ước tính (Points)
              </label>
              <input
                type="number"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full text-xs bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                placeholder="Điểm ước tính (vd: 3, 5, 8)"
                min="0"
              />
            </div>
          </div>

          {/* Sprint */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Chu kỳ phát triển (Sprint)
            </label>
            <select
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
            >
              <option value="">Hàng đợi công việc (Backlog)</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-md transition shadow-xs"
            >
              Tạo Công Việc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { Issue, IssueStatus, IssuePriority, User, Epic, Subtask, WorkflowStatus, IssueLink, IssueLinkType, Worklog } from "@/types/jira";
import {
  X,
  Plus,
  Trash2,
  Paperclip,
  Sparkles,
  CheckCircle2,
  Send,
  ExternalLink,
  Calendar,
  AlertCircle,
  Download,
  FileText,
  MessageSquare,
  History,
  Link2,
  Clock,
  Lock,
  Tag,
  ChevronRight,
  ArrowRight,
  Layers,
} from "lucide-react";
import { mouse1 } from "@/lib/mouse1";
import { TiptapEditor } from "./TiptapEditor";

interface IssueDetailDrawerProps {
  issue: Issue | null;
  allIssues?: Issue[];
  users: User[];
  epics: Epic[];
  statuses?: WorkflowStatus[];
  currentUser: User;
  onClose: () => void;
  onUpdateIssue: (updated: Issue) => void;
  onDeleteIssue: (issueId: string) => void;
  onSelectIssue?: (issue: Issue) => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  allIssues = [],
  users,
  epics,
  statuses,
  currentUser,
  onClose,
  onUpdateIssue,
  onDeleteIssue,
  onSelectIssue,
}) => {
  if (!issue) return null;

  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"COMMENTS" | "HISTORY">("COMMENTS");
  const [isTriaging, setIsTriaging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);
  const [mouseFeedback, setMouseFeedback] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isViewer, setIsViewer] = useState(currentUser.role === "VIEWER");
  const canDelete = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD" || currentUser.id === issue.reporter?.id;

  // Sync state on issue prop change
  React.useEffect(() => {
    setTitle(issue.title);
    setDescription(issue.description);
    setNewSubtaskTitle("");
    setNewComment("");
    setIsLinkingOpen(false);
    setIsLoggingWork(false);
  }, [issue.id]);

  // Linking state
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkType, setLinkType] = useState<IssueLinkType>("RELATES_TO");
  const [isSavingLink, setIsSavingLink] = useState(false);

  // Worklog & Estimate state
  const [isLoggingWork, setIsLoggingWork] = useState(false);
  const [workSpentInput, setWorkSpentInput] = useState("");
  const [workCommentInput, setWorkCommentInput] = useState("");
  const [isSavingWorklog, setIsSavingWorklog] = useState(false);

  // Time formatting helpers
  const parseTimeToMinutes = (str: string): number => {
    const trimmed = str.trim().toLowerCase();
    if (!trimmed) return 0;
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    let total = 0;
    const dMatch = trimmed.match(/(\d+)\s*d/);
    if (dMatch) total += parseInt(dMatch[1], 10) * 480;
    const hMatch = trimmed.match(/(\d+)\s*h/);
    if (hMatch) total += parseInt(hMatch[1], 10) * 60;
    const mMatch = trimmed.match(/(\d+)\s*m/);
    if (mMatch) total += parseInt(mMatch[1], 10);
    return total || 0;
  };

  const formatMinutes = (min?: number | null): string => {
    if (!min || min <= 0) return "0m";
    const days = Math.floor(min / 480);
    const rem = min % 480;
    const hours = Math.floor(rem / 60);
    const minutes = rem % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ") || "0m";
  };

  // Link Handlers
  const handleAddLink = async () => {
    if (!linkTargetId || isSavingLink) return;
    setIsSavingLink(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: linkTargetId,
          type: linkType,
          actorId: currentUser.id,
        }),
      });
      if (res.ok) {
        const newLink = await res.json();
        const updatedSourceLinks = [...(issue.sourceLinks || []), newLink];
        onUpdateIssue({ ...issue, sourceLinks: updatedSourceLinks });
        setIsLinkingOpen(false);
        setLinkTargetId("");
      }
    } catch (err) {
      console.error("Failed to add link:", err);
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/issues/${issue.id}/links?linkId=${linkId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onUpdateIssue({
          ...issue,
          sourceLinks: (issue.sourceLinks || []).filter((l) => l.id !== linkId),
          targetLinks: (issue.targetLinks || []).filter((l) => l.id !== linkId),
        });
      }
    } catch (err) {
      console.error("Failed to delete link:", err);
    }
  };

  // Worklog Handler
  const handleSaveWorklog = async () => {
    const spentMin = parseTimeToMinutes(workSpentInput);
    if (spentMin <= 0 || isSavingWorklog) return;
    setIsSavingWorklog(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/worklogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          timeSpentMin: spentMin,
          comment: workCommentInput.trim() || undefined,
        }),
      });
      if (res.ok) {
        const savedWorklog = await res.json();
        const updatedWorklogs = [savedWorklog, ...(issue.worklogs || [])];
        const updatedTimeSpent = (issue.timeSpent || 0) + spentMin;
        onUpdateIssue({
          ...issue,
          timeSpent: updatedTimeSpent,
          worklogs: updatedWorklogs,
        });
        setIsLoggingWork(false);
        setWorkSpentInput("");
        setWorkCommentInput("");
      }
    } catch (err) {
      console.error("Failed to save worklog:", err);
    } finally {
      setIsSavingWorklog(false);
    }
  };

  const handleGenerateCriteria = async () => {
    if (!issue) return;
    setIsGeneratingCriteria(true);
    setMouseFeedback(null);
    try {
      const res = await fetch("/api/mouse1/generate-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: issue.title,
          type: issue.type,
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
        onUpdateIssue({ ...issue, description: newDesc });
        setMouseFeedback(`Đã tự động sinh tiêu chí nghiệm thu BDD chuẩn cho ${issue.key}!`);
      }
    } catch (err) {
      console.error("Failed to generate criteria:", err);
    } finally {
      setIsGeneratingCriteria(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("issueId", issue.id);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const uploadedAtt = await res.json();
        const updated = {
          ...issue,
          attachments: [...(issue.attachments || []), uploadedAtt],
        };
        onUpdateIssue(updated);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    const updated = {
      ...issue,
      attachments: issue.attachments.filter((a) => a.id !== attId),
    };
    onUpdateIssue(updated);
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== issue.title) {
      onUpdateIssue({ ...issue, title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== issue.description) {
      onUpdateIssue({ ...issue, description });
    }
  };

  const handleStatusChange = async (newStatus: IssueStatus) => {
    // Evaluate transition gate with Mouse-1
    const gateCheck = await mouse1.evaluateTransitionGate({
      issueKey: issue.key,
      fromStatus: issue.status,
      toStatus: newStatus,
      hasSubtasks: issue.subtasks.length > 0,
      allSubtasksDone: issue.subtasks.every((s) => s.isCompleted),
      hasPrLink: !!issue.prLink,
      descriptionLength: issue.description?.length || 0,
    });

    if (!gateCheck.decision.allowed) {
      setMouseFeedback(`[Quy tắc chuyển trạng thái]: ${gateCheck.decision.reason}`);
      return;
    }

    setMouseFeedback(null);
    onUpdateIssue({ ...issue, status: newStatus });
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = issue.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    onUpdateIssue({ ...issue, subtasks: updatedSubtasks });
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      isCompleted: false,
    };
    onUpdateIssue({ ...issue, subtasks: [...issue.subtasks, newSub] });
    setNewSubtaskTitle("");
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const commentText = newComment.trim();
    setNewComment("");

    // Optimistic UI update
    const tempComment = {
      id: `c-${Date.now()}`,
      author: currentUser,
      content: commentText,
      createdAt: new Date().toLocaleString(),
    };
    onUpdateIssue({ ...issue, comments: [...issue.comments, tempComment] });

    try {
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorEmail: currentUser.email,
          authorAvatar: currentUser.avatar,
        }),
      });

      if (res.ok) {
        const savedComment = await res.json();
        const updatedComments = issue.comments
          .filter((c) => c.id !== tempComment.id)
          .concat(savedComment);
        onUpdateIssue({ ...issue, comments: updatedComments });
      }
    } catch (err) {
      console.error("Failed to persist comment to DB:", err);
    }
  };

  // Mouse-1 Fast Auto-Triage Trigger
  const triggerMouse1Triage = async () => {
    setIsTriaging(true);
    setMouseFeedback(null);

    const triageResult = await mouse1.predictTriage({
      title: issue.title,
      description: issue.description,
      issueType: issue.type,
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

    setIsTriaging(false);

    const recommendedUser = users.find((u) => u.id === triageResult.decision.recommendedAssigneeId);
    const recommendedEpic = epics.find((e) => e.id === triageResult.decision.recommendedEpicId);

    const updated = {
      ...issue,
      assignee: recommendedUser || issue.assignee,
      priority: triageResult.decision.recommendedPriority,
      epic: recommendedEpic || issue.epic,
    };

    onUpdateIssue(updated);
    setMouseFeedback(triageResult.decision.reasoning);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px] animate-in fade-in">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-[#D7D7D7] rounded-l-xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="px-6 py-3 border-b border-[#D7D7D7] flex items-center justify-between bg-[#F8F8F8]">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {issue.key}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {issue.type}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {canDelete && !isViewer && (
              <button
                onClick={() => onDeleteIssue(issue.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                title="Xóa công việc"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body (2 Columns) */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left Column: Title, Description, Subtasks, Comments */}
          <div className="flex-1 p-6 md:border-r border-gray-200 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                readOnly={isViewer}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={isViewer ? undefined : handleTitleBlur}
                className={`w-full text-lg font-bold text-gray-900 border-none rounded px-2 py-1 -ml-2 transition ${
                  isViewer ? "bg-transparent cursor-default focus:ring-0" : "hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#079455]"
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Description {isViewer && <span className="text-[10px] text-gray-400 font-normal lowercase">(chỉ xem)</span>}
                </label>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={handleGenerateCriteria}
                    disabled={isGeneratingCriteria}
                    className="text-[11px] text-purple-700 hover:text-purple-800 font-medium flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isGeneratingCriteria ? "Đang sinh tiêu chí..." : "Sinh Tiêu Chí Nghiệm Thu BDD"}</span>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <TiptapEditor
                  content={description}
                  onChange={(newVal) => setDescription(newVal)}
                  readOnly={isViewer}
                  placeholder={isViewer ? "Không có mô tả chi tiết." : "Thêm mô tả chi tiết, liên kết, tiêu chí nghiệm thu..."}
                  minHeight="140px"
                  onGenerateCriteria={isViewer ? undefined : handleGenerateCriteria}
                  isGeneratingCriteria={isGeneratingCriteria}
                />
                {!isViewer && description !== issue.description && (
                  <div className="flex justify-end gap-2 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => setDescription(issue.description || "")}
                      className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded transition"
                    >
                      Hủy thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateIssue({ ...issue, description })}
                      className="px-3 py-1 text-xs font-medium bg-[#079455] hover:bg-[#06854D] text-white rounded transition shadow-xs"
                    >
                      Lưu mô tả
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PR Link if present */}
            {issue.prLink && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between text-xs">
                <span className="text-blue-900 font-medium">Pull Request Connected:</span>
                <a
                  href={issue.prLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#079455] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>{issue.prLink}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Subtasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Subtasks ({issue.subtasks.filter((s) => s.isCompleted).length}/{issue.subtasks.length})
                </label>
              </div>

              <div className="space-y-1.5 mb-3">
                {issue.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center space-x-2.5 p-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200/80 transition"
                  >
                    <input
                      type="checkbox"
                      checked={sub.isCompleted}
                      disabled={isViewer}
                      onChange={() => toggleSubtask(sub.id)}
                      className={`w-4 h-4 text-[#079455] rounded focus:ring-0 ${isViewer ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    />
                    <span
                      className={`text-xs flex-1 ${
                        sub.isCompleted ? "line-through text-gray-400" : "text-gray-800"
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add subtask input (Hidden for VIEWER) */}
              {!isViewer && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder="+ Add a subtask..."
                    className="flex-1 text-xs bg-white border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455]"
                  />
                  <button
                    onClick={addSubtask}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded font-semibold transition"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                  <span>Attachments ({(issue.attachments || []).length})</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs text-[#079455] hover:text-[#06854D] font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isUploading ? "Uploading..." : "Attach file"}</span>
                  </button>
                )}
              </div>

              {/* Attachments List */}
              {issue.attachments && issue.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {issue.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200/80 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-[#079455] flex-shrink-0" />
                        <div className="overflow-hidden">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-gray-800 hover:text-[#079455] truncate block"
                            title={att.name}
                          >
                            {att.name}
                          </a>
                          <div className="text-[10px] text-gray-400">{att.size}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => !isViewer && fileInputRef.current?.click()}
                  className={`p-4 border-2 border-dashed border-gray-200 rounded-md text-center transition bg-gray-50/50 ${
                    isViewer ? "cursor-default" : "hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer"
                  }`}
                >
                  <p className="text-xs text-gray-500 font-medium">
                    {isUploading ? "Đang tải tệp lên..." : isViewer ? "Chưa có tệp đính kèm nào" : "Kéo thả tệp hoặc bấm vào đây để đính kèm tệp"}
                  </p>
                  <span className="text-[10px] text-gray-400">Hỗ trợ PNG, JPG, PDF, DOCX...</span>
                </div>
              )}
            </div>

            {/* Linked Issues Section (Công việc liên kết) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Công việc liên kết ({((issue.sourceLinks?.length || 0) + (issue.targetLinks?.length || 0))})</span>
                </label>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => setIsLinkingOpen(!isLinkingOpen)}
                    className="text-xs text-[#079455] hover:text-[#06854D] font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Liên kết công việc</span>
                  </button>
                )}
              </div>

              {/* Add Link Form */}
              {isLinkingOpen && !isViewer && (
                <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="text-xs font-semibold text-slate-800">Thêm liên kết mới</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Mối quan hệ</label>
                      <select
                        value={linkType}
                        onChange={(e) => setLinkType(e.target.value as IssueLinkType)}
                        className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455]"
                      >
                        <option value="BLOCKS">Chặn (Blocks)</option>
                        <option value="IS_BLOCKED_BY">Bị chặn bởi (Is blocked by)</option>
                        <option value="RELATES_TO">Liên quan tới (Relates to)</option>
                        <option value="DUPLICATES">Trùng lặp với (Duplicates)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Chọn công việc mục tiêu</label>
                      <select
                        value={linkTargetId}
                        onChange={(e) => setLinkTargetId(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455]"
                      >
                        <option value="">-- Chọn công việc --</option>
                        {allIssues
                          .filter((i) => i.id !== issue.id)
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.key} - {i.title.slice(0, 45)}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLinkingOpen(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!linkTargetId || isSavingLink}
                      className="px-3 py-1 text-xs font-medium text-white bg-[#079455] hover:bg-[#06854D] rounded transition disabled:opacity-50"
                    >
                      {isSavingLink ? "Đang liên kết..." : "Tạo liên kết"}
                    </button>
                  </div>
                </div>
              )}

              {/* Links List */}
              {((issue.sourceLinks && issue.sourceLinks.length > 0) ||
                (issue.targetLinks && issue.targetLinks.length > 0)) ? (
                <div className="space-y-1.5">
                  {/* Source Links */}
                  {(issue.sourceLinks || []).map((link) => {
                    const target = link.targetIssue || allIssues.find((i) => i.id === link.targetId);
                    const typeLabel =
                      link.type === "BLOCKS"
                        ? "Chặn"
                        : link.type === "IS_BLOCKED_BY"
                        ? "Bị chặn bởi"
                        : link.type === "DUPLICATES"
                        ? "Trùng lặp với"
                        : "Liên quan";
                    const badgeClass =
                      link.type === "BLOCKS"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : link.type === "IS_BLOCKED_BY"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : link.type === "DUPLICATES"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-blue-50 text-blue-700 border-blue-200";

                    return (
                      <div
                        key={link.id}
                        className="px-3 py-2 bg-slate-50/80 hover:bg-slate-100/90 rounded-md border border-slate-200 flex items-center justify-between transition group text-xs"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${badgeClass}`}>
                            {typeLabel}
                          </span>
                          <span
                            onClick={() => {
                              const found = allIssues.find((i) => i.id === link.targetId);
                              if (found && onSelectIssue) onSelectIssue(found);
                            }}
                            className="font-mono font-semibold text-slate-700 hover:text-[#079455] cursor-pointer"
                          >
                            {target?.key || "ISSUE"}
                          </span>
                          <span className="text-slate-700 truncate max-w-xs">{target?.title}</span>
                          {target?.status && (
                            <span className="text-[10px] uppercase font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {target.status}
                            </span>
                          )}
                        </div>

                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                            title="Xóa liên kết"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Target Links (where this issue is targeted by another) */}
                  {(issue.targetLinks || []).map((link) => {
                    const source = link.sourceIssue || allIssues.find((i) => i.id === link.sourceId);
                    const typeLabel =
                      link.type === "BLOCKS"
                        ? "Bị chặn bởi"
                        : link.type === "IS_BLOCKED_BY"
                        ? "Chặn"
                        : link.type === "DUPLICATES"
                        ? "Bị trùng lặp bởi"
                        : "Liên quan";
                    const badgeClass =
                      link.type === "BLOCKS"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : link.type === "IS_BLOCKED_BY"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200";

                    return (
                      <div
                        key={link.id}
                        className="px-3 py-2 bg-slate-50/80 hover:bg-slate-100/90 rounded-md border border-slate-200 flex items-center justify-between transition group text-xs"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${badgeClass}`}>
                            {typeLabel}
                          </span>
                          <span
                            onClick={() => {
                              const found = allIssues.find((i) => i.id === link.sourceId);
                              if (found && onSelectIssue) onSelectIssue(found);
                            }}
                            className="font-mono font-semibold text-slate-700 hover:text-[#079455] cursor-pointer"
                          >
                            {source?.key || "ISSUE"}
                          </span>
                          <span className="text-slate-700 truncate max-w-xs">{source?.title}</span>
                          {source?.status && (
                            <span className="text-[10px] uppercase font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {source.status}
                            </span>
                          )}
                        </div>

                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                            title="Xóa liên kết"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 border border-dashed border-slate-200 rounded-md text-center bg-slate-50/50">
                  <p className="text-xs text-slate-400">Chưa có công việc liên kết nào</p>
                </div>
              )}
            </div>

            {/* Activity & Comments Tabs */}
            <div>
              <div className="flex items-center space-x-6 border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("COMMENTS")}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${
                    activeTab === "COMMENTS"
                      ? "border-[#079455] text-[#079455]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Bình luận</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-1.5 py-0.5 rounded-full">
                    {issue.comments?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("HISTORY")}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${
                    activeTab === "HISTORY"
                      ? "border-[#079455] text-[#079455]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Lịch sử thay đổi</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-1.5 py-0.5 rounded-full">
                    {issue.activities?.length || 0}
                  </span>
                </button>
              </div>

              {activeTab === "COMMENTS" ? (
                <div>
                  <div className="space-y-3 mb-4">
                    {issue.comments && issue.comments.length > 0 ? (
                      issue.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3 text-xs">
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                          />
                          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-2.5">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                              <span className="font-semibold text-gray-800">{comment.author.name}</span>
                              <span>{comment.createdAt}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded text-center">
                        Chưa có bình luận nào. Hãy là người đầu tiên trao đổi!
                      </p>
                    )}
                  </div>

                  {/* Add Comment Box */}
                  {!isViewer ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addComment()}
                        placeholder="Viết bình luận..."
                        className="flex-1 text-xs bg-white border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#079455]"
                      />
                      <button
                        onClick={addComment}
                        className="bg-[#079455] hover:bg-[#06854D] text-white px-3 py-2 rounded text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded border border-gray-200">
                      Tài khoản quyền VIEWER ở chế độ chỉ đọc, không thể gửi bình luận.
                    </p>
                  )}
                </div>
              ) : (
                /* History Tab */
                <div>
                  {issue.activities && issue.activities.length > 0 ? (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                      {issue.activities.map((act) => (
                        <div key={act.id} className="relative flex items-start space-x-3 text-xs">
                          <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#079455] ring-4 ring-white" />
                          <img
                            src={
                              act.actor?.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                            }
                            alt={act.actor?.name || "Actor"}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5 border border-gray-200"
                          />
                          <div className="flex-1 bg-gray-50 border border-gray-200/80 rounded-md p-2.5">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                              <span className="font-semibold text-gray-800">{act.actor?.name || "Thành viên"}</span>
                              <span className="text-[10px]">
                                {new Date(act.createdAt).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="text-gray-700 leading-relaxed text-xs">
                              {act.fieldChanged === "STATUS" ? (
                                <span>
                                  Đã đổi trạng thái từ{" "}
                                  <span className="font-semibold px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">
                                    {act.oldValue || "Chưa có"}
                                  </span>{" "}
                                  sang{" "}
                                  <span className="font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                    {act.newValue}
                                  </span>
                                </span>
                              ) : act.fieldChanged === "PRIORITY" ? (
                                <span>
                                  Đã đổi độ ưu tiên từ{" "}
                                  <span className="font-semibold text-gray-700">{act.oldValue}</span> sang{" "}
                                  <span className="font-semibold text-blue-700">{act.newValue}</span>
                                </span>
                              ) : act.fieldChanged === "STORY_POINTS" ? (
                                <span>
                                  Đã đổi Story Points từ{" "}
                                  <span className="font-semibold">{act.oldValue || 0}</span> sang{" "}
                                  <span className="font-semibold text-blue-700">{act.newValue}</span>
                                </span>
                              ) : act.fieldChanged === "ASSIGNEE" ? (
                                <span>
                                  Đã gán người thực hiện:{" "}
                                  <span className="font-semibold text-gray-700">{act.oldValue || "Chưa gán"}</span> &rarr;{" "}
                                  <span className="font-semibold text-blue-700">{act.newValue || "Chưa gán"}</span>
                                </span>
                              ) : act.fieldChanged === "TITLE" ? (
                                <span>
                                  Đã đổi tiêu đề thành <span className="font-semibold text-gray-800">"{act.newValue}"</span>
                                </span>
                              ) : act.fieldChanged === "DESCRIPTION" ? (
                                <span>Đã cập nhật mô tả task</span>
                              ) : act.fieldChanged === "EPIC" ? (
                                <span>Đã cập nhật Epic gắn liền</span>
                              ) : (
                                <span>Đã chỉnh sửa trường <strong>{act.fieldChanged}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
                      Chưa có hoạt động hay thay đổi nào được ghi nhận cho task này.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata & Fast Actions */}
          <div className="w-full md:w-80 p-6 bg-[#FAFBFC] space-y-5">
            {/* Auto Triage Action Button */}
            {!isViewer && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-[#079455]" />
                    <span>Gợi Ý Phân Phối Tự Động</span>
                  </div>
                  <button
                    onClick={triggerMouse1Triage}
                    disabled={isTriaging}
                    className="text-[11px] bg-[#079455] hover:bg-[#06854D] text-white font-semibold px-2.5 py-1 rounded transition disabled:opacity-50"
                  >
                    {isTriaging ? "Đang tính..." : "Phân phối ngay"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  Tự động tối ưu người thực hiện, mức ưu tiên và Epic phù hợp cho công việc.
                </p>
                {mouseFeedback && (
                  <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-1.5 rounded">
                    {mouseFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Status Selector */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={issue.status}
                disabled={isViewer}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                className={`w-full text-xs font-bold border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455] ${
                  isViewer ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                {statuses && statuses.length > 0 ? (
                  statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="BACKLOG">BACKLOG</option>
                    <option value="TODO">TO DO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="DONE">DONE</option>
                  </>
                )}
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={issue.assignee?.id || ""}
                disabled={isViewer}
                onChange={(e) => {
                  const user = users.find((u) => u.id === e.target.value);
                  onUpdateIssue({ ...issue, assignee: user });
                }}
                className={`w-full text-xs border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455] ${
                  isViewer ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Epic Selector with Highlight Color */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Epic Link
              </label>
              <select
                value={issue.epic?.id || ""}
                disabled={isViewer}
                onChange={(e) => {
                  const epic = epics.find((ep) => ep.id === e.target.value);
                  onUpdateIssue({ ...issue, epic });
                }}
                className={`w-full text-xs border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455] ${
                  isViewer ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <option value="">None</option>
                {epics.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              {issue.epic && (
                <div className="mt-1.5 flex items-center space-x-1.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: issue.epic.color }}
                  />
                  <span className="text-xs font-semibold" style={{ color: issue.epic.color }}>
                    {issue.epic.name}
                  </span>
                </div>
              )}
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={issue.priority}
                disabled={isViewer}
                onChange={(e) =>
                  onUpdateIssue({ ...issue, priority: e.target.value as IssuePriority })
                }
                className={`w-full text-xs border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455] ${
                  isViewer ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <option value="HIGHEST">Highest</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="LOWEST">Lowest</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Story Points (Estimate)
              </label>
              <input
                type="number"
                value={issue.storyPoints ?? ""}
                disabled={isViewer}
                onChange={(e) =>
                  onUpdateIssue({
                    ...issue,
                    storyPoints: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className={`w-full text-xs border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455] ${
                  isViewer ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "bg-white text-gray-900 border-gray-300"
                }`}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Time Tracking & Worklog: Tạm thời ẩn theo yêu cầu REQ-3 */}

            {/* Labels (Nhãn) */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Nhãn (Labels)
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {(issue.labels || "")
                  .split(",")
                  .map((lbl) => lbl.trim())
                  .filter(Boolean)
                  .map((lbl) => (
                    <span
                      key={lbl}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      {lbl}
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLabels = (issue.labels || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter((s) => s && s !== lbl)
                              .join(", ");
                            onUpdateIssue({ ...issue, labels: newLabels });
                          }}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
              </div>
              {!isViewer && (
                <input
                  type="text"
                  placeholder="Thêm nhãn và nhấn Enter..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const val = target.value.trim();
                      if (val) {
                        const existing = (issue.labels || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (!existing.includes(val)) {
                          const updated = [...existing, val].join(", ");
                          onUpdateIssue({ ...issue, labels: updated });
                        }
                        target.value = "";
                      }
                    }
                  }}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#079455] bg-white"
                />
              )}
            </div>

            {/* Dates */}
            <div className="pt-3 border-t border-gray-200 text-[11px] text-gray-500 space-y-1">
              <div>Created: {issue.createdAt}</div>
              <div>Updated: {issue.updatedAt}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


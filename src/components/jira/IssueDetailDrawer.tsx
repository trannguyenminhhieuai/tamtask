"use client";

import React, { useState, useRef, useMemo } from "react";
import { Issue, IssueStatus, IssuePriority, User, Epic, Sprint, Subtask, WorkflowStatus, IssueLink, IssueLinkType, Worklog } from "@/types/jira";
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
import { notify } from "./Toast";
import { haptic } from "@/lib/haptic";

interface IssueDetailDrawerProps {
  issue: Issue | null;
  allIssues?: Issue[];
  users: User[];
  epics: Epic[];
  sprints?: Sprint[];
  statuses?: WorkflowStatus[];
  currentUser: User;
  onClose: () => void;
  onUpdateIssue: (updated: Issue) => void;
  onUpdateIssueLocal?: (updated: Issue) => void;
  onDeleteIssue: (issueId: string) => void;
  onSelectIssue?: (issue: Issue) => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  allIssues = [],
  users,
  epics,
  sprints = [],
  statuses,
  currentUser,
  onClose,
  onUpdateIssue,
  onUpdateIssueLocal,
  onDeleteIssue,
  onSelectIssue,
}) => {
  if (!issue) return null;

  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [subtasks, setSubtasks] = useState<Subtask[]>(issue.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"COMMENTS" | "HISTORY">("COMMENTS");
  const [mobileDrawerTab, setMobileDrawerTab] = useState<"DETAILS" | "PROPERTIES" | "COMMENTS">("DETAILS");
  const [isTriaging, setIsTriaging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);
  const [mouseFeedback, setMouseFeedback] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isViewer, setIsViewer] = useState(currentUser.role === "VIEWER");
  const canDelete = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD" || currentUser.role === "BA" || currentUser.id === issue.reporter?.id;

  // Sync state on issue prop change
  React.useEffect(() => {
    let isMounted = true;
    setTitle(issue.title);
    setDescription(issue.description);
    setSubtasks(issue.subtasks || []);
    setNewSubtaskTitle("");
    setNewComment("");
    setMobileDrawerTab("DETAILS");
    setIsLinkingOpen(false);
    setIsLoggingWork(false);

    // Lazily fetch full issue relations (activities, worklogs, issue links) in background
    if (issue?.id && !issue.id.startsWith("temp-") && !issue.id.startsWith("iss-")) {
      fetch(`/api/issues/${issue.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((fullData) => {
          if (isMounted && fullData && onUpdateIssueLocal) {
            onUpdateIssueLocal(fullData);
          }
        })
        .catch((err) => console.warn("Failed to load issue deep details:", err));
    }

    return () => {
      isMounted = false;
    };
  }, [issue.id]);

  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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

    // Giới hạn kích thước tệp tối đa 15MB an toàn
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      notify.error("Tệp đính kèm quá lớn", "Dung lượng tệp tối đa cho phép là 15MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

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
        notify.success("Tải lên tệp thành công", file.name);
      } else {
        const errData = await res.json().catch(() => ({}));
        notify.error("Không thể đính kèm tệp", errData.error || "Lỗi máy chủ khi tải lên tệp");
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      notify.error("Lỗi mạng", err?.message || "Không thể tải lên tệp đính kèm");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = async (attId: string) => {
    try {
      await fetch(`/api/upload?id=${attId}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Delete attachment failed:", err);
    }
    const updated = {
      ...issue,
      attachments: (issue.attachments || []).filter((a) => a.id !== attId),
    };
    onUpdateIssue(updated);
    notify.success("Đã xóa tệp đính kèm", "Tệp đã được loại bỏ khỏi công việc thành công.");
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
      hasSubtasks: subtasks.length > 0,
      allSubtasksDone: subtasks.every((s) => s.isCompleted),
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

  // Subtask expanded detail state
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);
  const [subtaskTitleInput, setSubtaskTitleInput] = useState<string>("");
  const [subtaskDescInput, setSubtaskDescInput] = useState<string>("");

  const deleteSubtask = async (subId: string) => {
    if (isViewer) return;
    const nextList = subtasks.filter((s) => s.id !== subId);
    setSubtasks(nextList);
    if (onUpdateIssueLocal) {
      onUpdateIssueLocal({ ...issue, subtasks: nextList });
    }
    if (expandedSubtaskId === subId) {
      setExpandedSubtaskId(null);
    }
    // If it's a real subtask saved in DB, delete it atomically
    if (!subId.startsWith("sub-") && !subId.startsWith("temp-")) {
      try {
        await fetch(`/api/issues/${issue.id}/subtasks?subtaskId=${subId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete subtask:", err);
      }
    }
  };

  const saveSubtask = async (subId: string) => {
    if (isViewer) return;
    const newTitle = subtaskTitleInput.trim() || "";
    const newDesc = subtaskDescInput;
    const nextList = subtasks.map((s) =>
      s.id === subId
        ? {
            ...s,
            title: newTitle || s.title,
            description: newDesc,
          }
        : s
    );
    setSubtasks(nextList);
    if (onUpdateIssueLocal) {
      onUpdateIssueLocal({ ...issue, subtasks: nextList });
    }
    notify.success("Đã lưu công việc phụ", "Cập nhật thành công.");

    if (!subId.startsWith("sub-") && !subId.startsWith("temp-")) {
      try {
        await fetch(`/api/issues/${issue.id}/subtasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtaskId: subId,
            title: newTitle,
            description: newDesc,
          }),
        });
      } catch (err) {
        console.error("Failed to save subtask details:", err);
      }
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    if (isViewer) return;
    const target = subtasks.find((s) => s.id === subtaskId);
    if (!target) return;
    const nextCompleted = !target.isCompleted;

    const nextList = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: nextCompleted } : s
    );
    setSubtasks(nextList);
    if (onUpdateIssueLocal) {
      onUpdateIssueLocal({ ...issue, subtasks: nextList });
    }

    if (!subtaskId.startsWith("sub-") && !subtaskId.startsWith("temp-")) {
      try {
        await fetch(`/api/issues/${issue.id}/subtasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtaskId,
            isCompleted: nextCompleted,
          }),
        });
      } catch (err) {
        console.error("Failed to toggle subtask status:", err);
      }
    }
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim() || isViewer) return;
    const titleToAdd = newSubtaskTitle.trim();
    setNewSubtaskTitle("");

    const tempSubId = `sub-${Date.now()}`;
    const newSub: Subtask = {
      id: tempSubId,
      title: titleToAdd,
      description: "",
      isCompleted: false,
    };

    // 1. Optimistic UI: Add immediately so user sees it in 0ms!
    const nextList = [...subtasks, newSub];
    setSubtasks(nextList);
    if (onUpdateIssueLocal) {
      onUpdateIssueLocal({ ...issue, subtasks: nextList });
    }

    // 2. Persist atomically to database
    try {
      const res = await fetch(`/api/issues/${issue.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleToAdd,
          isCompleted: false,
        }),
      });

      if (res.ok) {
        const savedSub: Subtask = await res.json();
        // Replace temp subtask with the real DB subtask (persisting UUID)
        setSubtasks((prev) => {
          const replaced = prev.map((s) => (s.id === tempSubId ? savedSub : s));
          if (onUpdateIssueLocal) {
            onUpdateIssueLocal({ ...issue, subtasks: replaced });
          }
          return replaced;
        });
      } else {
        // Rollback on server failure
        setSubtasks((prev) => {
          const filtered = prev.filter((s) => s.id !== tempSubId);
          if (onUpdateIssueLocal) {
            onUpdateIssueLocal({ ...issue, subtasks: filtered });
          }
          return filtered;
        });
        notify.error("Không thể tạo công việc phụ", "Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Failed to create subtask in DB:", err);
      setSubtasks((prev) => {
        const filtered = prev.filter((s) => s.id !== tempSubId);
        if (onUpdateIssueLocal) {
          onUpdateIssueLocal({ ...issue, subtasks: filtered });
        }
        return filtered;
      });
      notify.error("Không thể tạo công việc phụ", "Vui lòng thử lại!");
    }
  };

  // @mention Autocomplete state & handlers
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewComment(val);
    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\u00C0-\u1EF9]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const mentionFilteredUsers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [mentionQuery, users]);

  const insertMention = (user: User) => {
    if (!commentInputRef.current) return;
    const input = commentInputRef.current;
    const val = newComment;
    const cursor = input.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const textAfterCursor = val.slice(cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    if (lastAtPos !== -1) {
      const updated = textBeforeCursor.slice(0, lastAtPos) + `@${user.name} ` + textAfterCursor;
      setNewComment(updated);
      setMentionQuery(null);
      setTimeout(() => {
        input.focus();
        const nextPos = lastAtPos + user.name.length + 2;
        input.setSelectionRange(nextPos, nextPos);
      }, 50);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && mentionFilteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionFilteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + mentionFilteredUsers.length) % mentionFilteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionFilteredUsers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  const renderCommentContentWithMentions = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_\u00C0-\u1EF9\s]+?(?=\s|$|[.,!?]))/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={index}
            className="inline-flex items-center font-semibold text-[#EE0033] bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const commentText = newComment.trim();
    setNewComment("");
    setMentionQuery(null);

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

  // Mobile swipe-down to dismiss
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 80) {
        onClose();
      }
      touchStartY.current = null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-stretch md:justify-end bg-[rgba(27,27,27,0.6)] backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-4xl bg-white dark:bg-zinc-900 h-[92vh] md:h-full shadow-2xl flex flex-col border-t md:border-t-0 md:border-l border-[#D7D7D7] dark:border-zinc-800 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="md:hidden flex flex-col items-center pt-3 pb-1.5 bg-white dark:bg-zinc-900 cursor-grab active:cursor-grabbing border-b border-slate-100 dark:border-zinc-800 select-none"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* Top Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="px-6 py-3.5 border-b border-[#E5E7EB] dark:border-zinc-800 flex items-center justify-between bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold font-mono text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
              {issue.key}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              {issue.type}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {canDelete && !isViewer && (
              <button
                onClick={() => onDeleteIssue(issue.id)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition"
                title="Xóa công việc"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Segmented Tab Navigation */}
        <div className="md:hidden px-4 py-2 bg-slate-100/90 dark:bg-zinc-800/90 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-around gap-1.5 shrink-0 select-none">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setMobileDrawerTab("DETAILS");
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mobileDrawerTab === "DETAILS"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Chi tiết</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setMobileDrawerTab("PROPERTIES");
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mobileDrawerTab === "PROPERTIES"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Thuộc tính</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setMobileDrawerTab("COMMENTS");
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mobileDrawerTab === "COMMENTS"
                ? "bg-white dark:bg-zinc-700 text-[#EE0033] shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Thảo luận ({issue.comments?.length || 0})</span>
          </button>
        </div>

        {/* Content Body (2 Columns) - Unified Single Scrollbar with 16px bottom padding */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col md:flex-row md:items-start min-h-full pb-4 w-full">
            {/* Left Column: Title, Description, Subtasks, Comments */}
            <div className={`flex-1 min-w-0 w-full p-4 sm:p-6 pb-6 md:border-r border-gray-200 dark:border-zinc-800 space-y-6 bg-white dark:bg-zinc-900 flex-col justify-start overflow-hidden ${
              mobileDrawerTab === "PROPERTIES" ? "hidden md:flex" : "flex"
            }`}>
              {/* Details & Specifications Group */}
              <div className={`space-y-6 ${mobileDrawerTab === "COMMENTS" ? "hidden md:block" : "block"}`}>
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                readOnly={isViewer}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={isViewer ? undefined : handleTitleBlur}
                className={`w-full text-lg font-bold text-slate-900 dark:text-zinc-100 rounded-xl px-2.5 py-1.5 -ml-2.5 transition border ${
                  isViewer
                    ? "bg-transparent border-transparent cursor-default focus:ring-0"
                    : "bg-transparent dark:bg-transparent border-transparent hover:border-slate-200 dark:hover:border-zinc-700/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-800 focus:border-[#EE0033] dark:focus:border-[#EE0033] focus:ring-2 focus:ring-[#EE0033]/20"
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                  Description {isViewer && <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-normal lowercase">(chỉ xem)</span>}
                </label>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={handleGenerateCriteria}
                    disabled={isGeneratingCriteria}
                    className="text-[11px] text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold flex items-center gap-1.5 transition disabled:opacity-50 px-2 py-0.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    title="Nhấn để AI gợi ý chuẩn hóa mô tả và cấu trúc hóa công việc thông minh"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{isGeneratingCriteria ? "Đang xử lý..." : "Gợi ý thông minh"}</span>
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
                      className="px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition"
                    >
                      Hủy thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateIssue({ ...issue, description })}
                      className="px-3 py-1 text-xs font-medium bg-[#EE0033] hover:bg-[#D6002E] text-white rounded transition shadow-xs"
                    >
                      Lưu mô tả
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PR Link if present */}
            {issue.prLink && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-blue-900 dark:text-blue-300 font-medium">Pull Request Connected:</span>
                <a
                  href={issue.prLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#EE0033] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>{issue.prLink}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Subtasks Section */}
            <div className="w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                  Subtasks ({subtasks.filter((s) => s.isCompleted).length}/{subtasks.length})
                </label>
              </div>

              <div className="space-y-2 mb-3 w-full max-w-full min-w-0 overflow-hidden">
                {subtasks.map((sub) => {
                  const isExpanded = expandedSubtaskId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className="bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200/80 dark:border-zinc-700/60 transition overflow-hidden w-full max-w-full min-w-0"
                    >
                      <div
                        className="flex items-center justify-between space-x-2.5 p-2.5 hover:bg-gray-100/80 dark:hover:bg-zinc-800 cursor-pointer overflow-hidden w-full max-w-full min-w-0"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedSubtaskId(null);
                          } else {
                            setExpandedSubtaskId(sub.id);
                            setSubtaskTitleInput(sub.title);
                            setSubtaskDescInput(sub.description || "");
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={sub.isCompleted}
                            disabled={isViewer}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSubtask(sub.id)}
                            className={`w-4 h-4 text-[#EE0033] rounded focus:ring-0 shrink-0 ${isViewer ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                          />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <span
                              className={`text-xs block truncate break-all max-w-full ${
                                sub.isCompleted
                                  ? "line-through text-gray-400 dark:text-zinc-500"
                                  : "text-gray-800 dark:text-zinc-200 font-medium"
                              }`}
                              title={sub.title}
                            >
                              {sub.title}
                            </span>
                            {sub.description && !isExpanded && (
                              <span
                                className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1 truncate max-w-full mt-0.5"
                                title={sub.description.replace(/<[^>]+>/g, "")}
                              >
                                {sub.description.replace(/<[^>]+>/g, "")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-zinc-700/50 font-mono">
                            {isExpanded ? "Đóng mô tả" : "Xem/Sửa"}
                          </span>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSubtask(sub.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
                              title="Xóa công việc phụ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subtask Details & Editor */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-2.5 border-t border-gray-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-900/40 space-y-3 animate-in fade-in duration-150" style={{boxSizing:'border-box', width:'100%', maxWidth:'100%', minWidth:0, overflow:'hidden'}}>
                          <div className="flex items-center justify-between gap-2">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider shrink-0">
                              Tên công việc phụ:
                            </label>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                              sub.isCompleted
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                            }`}>
                              {sub.isCompleted ? "ĐÃ HOÀN THÀNH" : "CHƯA HOÀN THÀNH"}
                            </span>
                          </div>

                          <div className="w-full max-w-full min-w-0">
                            <input
                              type="text"
                              disabled={isViewer}
                              value={subtaskTitleInput}
                              onChange={(e) => setSubtaskTitleInput(e.target.value)}
                              placeholder="Nhập tên công việc phụ..."
                              className="w-full max-w-full min-w-0 text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] transition font-semibold overflow-hidden text-ellipsis"
                            />
                          </div>

                          <div className="w-full max-w-full min-w-0">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                              Mô tả chi tiết:
                            </label>
                            <textarea
                              rows={3}
                              disabled={isViewer}
                              value={subtaskDescInput}
                              onChange={(e) => setSubtaskDescInput(e.target.value)}
                              placeholder="Nhập mô tả chi tiết, hướng dẫn hoặc tiêu chí..."
                              className="w-full max-w-full min-w-0 text-xs p-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] transition resize-y overflow-hidden"
                              style={{wordBreak:'break-word', overflowWrap:'anywhere'}}
                            />
                          </div>

                          {!isViewer && (
                            <div className="flex items-center justify-end space-x-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setExpandedSubtaskId(null)}
                                className="px-3 py-1 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
                              >
                                Thu gọn
                              </button>
                              <button
                                type="button"
                                onClick={() => saveSubtask(sub.id)}
                                className="px-3.5 py-1 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-lg shadow-xs transition"
                              >
                                Lưu thay đổi
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add subtask input (Hidden for VIEWER) */}
              {!isViewer && (
                <div className="flex items-center space-x-2 w-full max-w-full min-w-0">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder="+ Add a subtask..."
                    className="flex-1 min-w-0 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                  />
                  <button
                    onClick={addSubtask}
                    className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 border border-transparent dark:border-zinc-700 text-xs px-3 py-1.5 rounded font-semibold transition shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
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
                    className="text-xs text-[#EE0033] hover:text-[#D6002E] font-semibold flex items-center gap-1 transition"
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
                      className="p-2.5 bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md border border-gray-200/80 dark:border-zinc-700/80 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-[#EE0033] flex-shrink-0" />
                        <div className="overflow-hidden">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-gray-800 dark:text-zinc-200 hover:text-[#EE0033] dark:hover:text-rose-400 truncate block"
                            title={att.name}
                          >
                            {att.name}
                          </a>
                          <div className="text-[10px] text-gray-400 dark:text-zinc-500">{att.size}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded"
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
                  className={`p-4 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-md text-center transition bg-gray-50/50 dark:bg-zinc-800/30 ${isViewer ? "cursor-default" : "hover:border-[#EE0033]/60 dark:hover:border-[#EE0033]/60 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 cursor-pointer"
                    }`}
                >
                  <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                    {isUploading ? "Đang tải tệp lên..." : isViewer ? "Chưa có tệp đính kèm nào" : "Kéo thả tệp hoặc bấm vào đây để đính kèm tệp"}
                  </p>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">Hỗ trợ PNG, JPG, PDF, DOCX...</span>
                </div>
              )}
            </div>

            {/* Linked Issues Section (Công việc liên kết) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>Công việc liên kết ({((issue.sourceLinks?.length || 0) + (issue.targetLinks?.length || 0))})</span>
                </label>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => setIsLinkingOpen(!isLinkingOpen)}
                    className="text-xs text-[#EE0033] hover:text-[#D6002E] font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Liên kết công việc</span>
                  </button>
                )}
              </div>

              {/* Add Link Form */}
              {isLinkingOpen && !isViewer && (
                <div className="mb-3 p-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-lg space-y-2.5">
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100">Thêm liên kết mới</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">Mối quan hệ</label>
                      <select
                        value={linkType}
                        onChange={(e) => setLinkType(e.target.value as IssueLinkType)}
                        className="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                      >
                        <option value="BLOCKS" className="dark:bg-zinc-800">Chặn (Blocks)</option>
                        <option value="IS_BLOCKED_BY" className="dark:bg-zinc-800">Bị chặn bởi (Is blocked by)</option>
                        <option value="RELATES_TO" className="dark:bg-zinc-800">Liên quan tới (Relates to)</option>
                        <option value="DUPLICATES" className="dark:bg-zinc-800">Trùng lặp với (Duplicates)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">Chọn công việc mục tiêu</label>
                      <select
                        value={linkTargetId}
                        onChange={(e) => setLinkTargetId(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                      >
                        <option value="" className="dark:bg-zinc-800">-- Chọn công việc --</option>
                        {allIssues
                          .filter((i) => i.id !== issue.id)
                          .map((i) => (
                            <option key={i.id} value={i.id} className="dark:bg-zinc-800">
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
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!linkTargetId || isSavingLink}
                      className="px-3 py-1 text-xs font-medium text-white bg-[#EE0033] hover:bg-[#D6002E] rounded transition disabled:opacity-50"
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
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                        : link.type === "IS_BLOCKED_BY"
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                          : link.type === "DUPLICATES"
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60";

                    return (
                      <div
                        key={link.id}
                        className="px-3 py-2 bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-slate-100/90 dark:hover:bg-zinc-800 rounded-md border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between transition group text-xs"
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
                            className="font-mono font-semibold text-slate-700 dark:text-zinc-300 hover:text-[#EE0033] dark:hover:text-rose-400 cursor-pointer"
                          >
                            {target?.key || "ISSUE"}
                          </span>
                          <span className="text-slate-700 dark:text-zinc-200 truncate max-w-xs">{target?.title}</span>
                          {target?.status && (
                            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
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
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                        : link.type === "IS_BLOCKED_BY"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60";

                    return (
                      <div
                        key={link.id}
                        className="px-3 py-2 bg-slate-50/80 dark:bg-zinc-800/60 hover:bg-slate-100/90 dark:hover:bg-zinc-800 rounded-md border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between transition group text-xs"
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
                            className="font-mono font-semibold text-slate-700 dark:text-zinc-300 hover:text-[#EE0033] dark:hover:text-rose-400 cursor-pointer"
                          >
                            {source?.key || "ISSUE"}
                          </span>
                          <span className="text-slate-700 dark:text-zinc-200 truncate max-w-xs">{source?.title}</span>
                          {source?.status && (
                            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
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
                <div className="p-3 border border-dashed border-slate-200 dark:border-zinc-700 rounded-md text-center bg-slate-50/50 dark:bg-zinc-800/30">
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Chưa có công việc liên kết nào</p>
                </div>
              )}
            </div>
          </div>

            {/* Activity & Comments Tabs */}
            <div className={mobileDrawerTab === "DETAILS" ? "hidden md:block" : "block"}>
              <div className="flex items-center space-x-6 border-b border-gray-200 dark:border-zinc-800 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("COMMENTS")}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${activeTab === "COMMENTS"
                    ? "border-[#EE0033] text-[#EE0033]"
                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
                    }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Bình luận</span>
                  <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 font-semibold px-1.5 py-0.5 rounded-full">
                    {issue.comments?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("HISTORY")}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${activeTab === "HISTORY"
                    ? "border-[#EE0033] text-[#EE0033]"
                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
                    }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Lịch sử thay đổi</span>
                  <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 font-semibold px-1.5 py-0.5 rounded-full">
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
                          <div className="flex-1 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/80 rounded-md p-2.5">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 mb-1">
                              <span className="font-semibold text-gray-800 dark:text-zinc-200">{comment.author.name}</span>
                              <span>{comment.createdAt}</span>
                            </div>
                            <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
                              {renderCommentContentWithMentions(comment.content)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-zinc-500 italic bg-gray-50 dark:bg-zinc-800/40 p-3 rounded-lg text-center border border-dashed border-gray-200 dark:border-zinc-700/60">
                        Chưa có bình luận nào. Hãy là người đầu tiên trao đổi!
                      </p>
                    )}
                  </div>

                  {/* Add Comment Box */}
                  {!isViewer ? (
                    <div className="flex space-x-2 relative">
                      {/* @mention Autocomplete Popover */}
                      {mentionQuery !== null && mentionFilteredUsers.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-1.5 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 py-1.5 z-30 animate-in fade-in zoom-in-95">
                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            Nhắc đến thành viên (@)
                          </div>
                          {mentionFilteredUsers.map((u: User, i: number) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => insertMention(u)}
                              className={`w-full px-3 py-1.5 text-left flex items-center gap-2.5 transition text-xs ${
                                i === mentionIndex
                                  ? "bg-rose-50 dark:bg-rose-950/40 text-[#EE0033]"
                                  : "text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60"
                              }`}
                            >
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{u.name}</div>
                                <div className="text-[10px] text-slate-400 dark:text-zinc-400 truncate">
                                  {u.email}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <input
                        ref={commentInputRef}
                        type="text"
                        value={newComment}
                        onChange={handleCommentChange}
                        onKeyDown={handleCommentKeyDown}
                        placeholder="Viết bình luận... (Gõ @ để nhắc thành viên)"
                        className="flex-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                      />
                      <button
                        onClick={addComment}
                        className="bg-[#EE0033] hover:bg-[#D6002E] text-white px-3 py-2 rounded text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 italic bg-gray-50 dark:bg-zinc-800/40 p-2.5 rounded border border-gray-200 dark:border-zinc-700/60">
                      Tài khoản quyền VIEWER ở chế độ chỉ đọc, không thể gửi bình luận.
                    </p>
                  )}
                </div>
              ) : (
                /* History Tab */
                <div>
                  {issue.activities && issue.activities.length > 0 ? (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-zinc-800">
                      {issue.activities.map((act) => (
                        <div key={act.id} className="relative flex items-start space-x-3 text-xs">
                          <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#EE0033] ring-4 ring-white dark:ring-zinc-900" />
                          <img
                            src={
                              act.actor?.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                            }
                            alt={act.actor?.name || "Actor"}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5 border border-gray-200 dark:border-zinc-700"
                          />
                          <div className="flex-1 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/80 dark:border-zinc-700/80 rounded-md p-2.5">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 mb-1">
                              <span className="font-semibold text-gray-800 dark:text-zinc-200">{act.actor?.name || "Thành viên"}</span>
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
                            <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-xs">
                              {act.fieldChanged === "STATUS" ? (
                                <span>
                                  Đã đổi trạng thái từ{" "}
                                  <span className="font-semibold px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-gray-700 dark:text-zinc-300">
                                    {act.oldValue || "Chưa có"}
                                  </span>{" "}
                                  sang{" "}
                                  <span className="font-semibold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded">
                                    {act.newValue}
                                  </span>
                                </span>
                              ) : act.fieldChanged === "PRIORITY" ? (
                                <span>
                                  Đã đổi độ ưu tiên từ{" "}
                                  <span className="font-semibold text-gray-700 dark:text-zinc-300">{act.oldValue}</span> sang{" "}
                                  <span className="font-semibold text-blue-700 dark:text-blue-300">{act.newValue}</span>
                                </span>
                              ) : act.fieldChanged === "STORY_POINTS" ? (
                                <span>
                                  Đã đổi Story Points từ{" "}
                                  <span className="font-semibold">{act.oldValue || 0}</span> sang{" "}
                                  <span className="font-semibold text-blue-700 dark:text-blue-300">{act.newValue}</span>
                                </span>
                              ) : act.fieldChanged === "ASSIGNEE" ? (
                                <span>
                                  Đã gán người thực hiện:{" "}
                                  <span className="font-semibold text-gray-700 dark:text-zinc-300">{act.oldValue || "Chưa gán"}</span> &rarr;{" "}
                                  <span className="font-semibold text-blue-700 dark:text-blue-300">{act.newValue || "Chưa gán"}</span>
                                </span>
                              ) : act.fieldChanged === "TITLE" ? (
                                <span>
                                  Đã đổi tiêu đề thành <span className="font-semibold text-gray-800 dark:text-zinc-100">"{act.newValue}"</span>
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
                    <div className="p-6 text-center text-xs text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800/40 rounded border border-dashed border-gray-200 dark:border-zinc-700/60">
                      Chưa có hoạt động hay thay đổi nào được ghi nhận cho task này.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata & Fast Actions (Unified Single Scroll, Full Stretch) */}
          <div className={`w-full md:w-80 lg:w-88 p-4 sm:p-5 pb-16 bg-slate-50/70 dark:bg-zinc-900/60 md:border-l border-slate-200 dark:border-zinc-800 space-y-4 shrink-0 flex-col justify-start ${
            mobileDrawerTab === "PROPERTIES" ? "flex" : "hidden md:flex"
          }`}>
            {/* Auto Triage Action Button */}
            {!isViewer && (
              <div className="bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100">
                    <Sparkles className="w-3.5 h-3.5 text-[#EE0033] shrink-0" />
                    <span>Gợi Ý Phân Phối</span>
                  </div>
                  <button
                    onClick={triggerMouse1Triage}
                    disabled={isTriaging}
                    className="text-xs bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white font-semibold px-3.5 py-1.5 rounded-full transition shadow-xs disabled:opacity-50 shrink-0 focus:ring-2 focus:ring-[#EE0033]/20"
                  >
                    {isTriaging ? "Đang tính..." : "Phân phối ngay"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  Tối ưu người thực hiện, mức ưu tiên và Epic phù hợp.
                </p>
                {mouseFeedback && (
                  <div className="mt-2 text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl">
                    {mouseFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Status Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={issue.status}
                disabled={isViewer}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                className={`w-full text-xs font-bold border rounded-xl px-3.5 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] ${isViewer
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed border-slate-200 dark:border-zinc-700"
                  : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700 shadow-2xs"
                  }`}
              >
                {statuses && statuses.length > 0 ? (
                  statuses.map((s) => (
                    <option key={s.id} value={s.id} className="dark:bg-zinc-800">
                      {s.name.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="BACKLOG" className="dark:bg-zinc-800">BACKLOG</option>
                    <option value="TODO" className="dark:bg-zinc-800">TO DO</option>
                    <option value="IN_PROGRESS" className="dark:bg-zinc-800">IN PROGRESS</option>
                    <option value="IN_REVIEW" className="dark:bg-zinc-800">IN REVIEW</option>
                    <option value="DONE" className="dark:bg-zinc-800">DONE</option>
                  </>
                )}
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={issue.assignee?.id || ""}
                disabled={isViewer}
                onChange={(e) => {
                  const user = users.find((u) => u.id === e.target.value);
                  onUpdateIssue({ ...issue, assignee: user });
                }}
                className={`w-full text-xs font-medium border rounded-xl px-3.5 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] ${isViewer
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed border-slate-200 dark:border-zinc-700"
                  : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700 shadow-2xs"
                  }`}
              >
                <option value="" className="dark:bg-zinc-800">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="dark:bg-zinc-800">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Epic Selector with Highlight Color */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Epic Link
              </label>
              <select
                value={issue.epic?.id || ""}
                disabled={isViewer}
                onChange={(e) => {
                  const epic = epics.find((ep) => ep.id === e.target.value);
                  onUpdateIssue({ ...issue, epic });
                }}
                className={`w-full text-xs font-medium border rounded-xl px-3.5 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] ${isViewer
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed border-slate-200 dark:border-zinc-700"
                  : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700 shadow-2xs"
                  }`}
              >
                <option value="" className="dark:bg-zinc-800">None</option>
                {epics.map((e) => (
                  <option key={e.id} value={e.id} className="dark:bg-zinc-800">
                    {e.name}
                  </option>
                ))}
              </select>
              {issue.epic && (
                <div className="mt-1.5 flex items-center space-x-1.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: issue.epic.color }}
                  />
                  <span
                    className="text-xs font-semibold [color:var(--epic-c)] dark:[color:var(--epic-c-dark)]"
                    style={{
                      ["--epic-c" as any]: issue.epic.color,
                      ["--epic-c-dark" as any]: (() => {
                        try {
                          const clean = issue.epic.color.replace("#", "");
                          const n = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
                          const r = Math.min(255, (n >> 16) + 115);
                          const g = Math.min(255, ((n >> 8) & 0xff) + 115);
                          const b = Math.min(255, (n & 0xff) + 115);
                          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                        } catch {
                          return issue.epic.color;
                        }
                      })(),
                    }}
                  >
                    {issue.epic.name}
                  </span>
                </div>
              )}
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={issue.priority}
                disabled={isViewer}
                onChange={(e) =>
                  onUpdateIssue({ ...issue, priority: e.target.value as IssuePriority })
                }
                className={`w-full text-xs font-medium border rounded-xl px-3.5 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] ${isViewer
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed border-slate-200 dark:border-zinc-700"
                  : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700 shadow-2xs"
                  }`}
              >
                <option value="HIGHEST" className="dark:bg-zinc-800">Highest</option>
                <option value="HIGH" className="dark:bg-zinc-800">High</option>
                <option value="MEDIUM" className="dark:bg-zinc-800">Medium</option>
                <option value="LOW" className="dark:bg-zinc-800">Low</option>
                <option value="LOWEST" className="dark:bg-zinc-800">Lowest</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
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
                className={`w-full text-xs font-medium border rounded-xl px-3.5 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] ${isViewer
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed border-slate-200 dark:border-zinc-700"
                  : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700 shadow-2xs"
                  }`}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Sprint Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                Chu kỳ phát triển (Sprint)
              </label>
              <select
                value={issue.sprintId || ""}
                disabled={isViewer}
                onChange={(e) =>
                  onUpdateIssue({
                    ...issue,
                    sprintId: e.target.value || undefined,
                  })
                }
                className={`w-full text-xs font-medium border rounded-xl px-3.5 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033] ${isViewer
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed border-slate-200 dark:border-zinc-700"
                  : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700 shadow-2xs"
                  }`}
              >
                <option value="" className="dark:bg-zinc-800">Hàng đợi công việc (Backlog)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-zinc-800">
                    {s.name} ({s.status === "ACTIVE" ? "Đang chạy" : s.status === "PLANNED" ? "Kế hoạch" : s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Labels (Nhãn) */}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
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
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-400" />
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
                  className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EE0033] bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
              )}
            </div>

            {/* Dates */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 space-y-1">
              <div>Created: {issue.createdAt}</div>
              <div>Updated: {issue.updatedAt}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};


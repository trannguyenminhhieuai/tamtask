"use client";

import React from "react";
import { Issue, IssuePriority, IssueType } from "@/types/jira";
import {
  Bookmark,
  CheckSquare,
  Bug,
  FolderGit2,
  ListTree,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Lock,
  Link2,
} from "lucide-react";

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  isDraggable?: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onDragStart,
  isDraggable = true,
}) => {
  const renderTypeIcon = (type: IssueType) => {
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
    }
  };

  const renderPriorityIcon = (priority: IssuePriority) => {
    switch (priority) {
      case "HIGHEST":
        return (
          <span title="Highest Priority">
            <ArrowUp className="w-3.5 h-3.5 text-red-600 font-black stroke-[3]" />
          </span>
        );
      case "HIGH":
        return (
          <span title="High Priority">
            <ArrowUp className="w-3.5 h-3.5 text-red-500 stroke-[2.5]" />
          </span>
        );
      case "MEDIUM":
        return (
          <span title="Medium Priority">
            <Minus className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
          </span>
        );
      case "LOW":
        return (
          <span title="Low Priority">
            <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
          </span>
        );
      case "LOWEST":
        return (
          <span title="Lowest Priority">
            <ArrowDown className="w-3.5 h-3.5 text-blue-300 stroke-[1.5]" />
          </span>
        );
    }
  };

  const completedSubtasks = issue.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = issue.subtasks.length;

  // Check if issue is blocked by any unfinished issue
  const isBlocked =
    (issue.sourceLinks || []).some(
      (l) => l.type === "IS_BLOCKED_BY" && l.targetIssue?.status !== "DONE"
    ) ||
    (issue.targetLinks || []).some(
      (l) => l.type === "BLOCKS" && l.sourceIssue?.status !== "DONE"
    );

  const totalLinks = (issue.sourceLinks?.length || 0) + (issue.targetLinks?.length || 0);

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => {
        if (isDraggable && onDragStart) onDragStart(e);
      }}
      onClick={onClick}
      className={`bg-white p-3 rounded-lg border border-[#D7D7D7] shadow-xs transition-all duration-150 select-none group ${
        isDraggable
          ? "cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 hover:border-[#079455]/40 active:scale-[0.98]"
          : "cursor-pointer hover:border-[#079455]/40 hover:shadow-xs"
      }`}
    >
      {/* Badges / Epic */}
      <div className="mb-1.5 flex items-center flex-wrap gap-1.5">
        {issue.epic && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              backgroundColor: `${issue.epic.color}15`,
              color: issue.epic.color,
              border: `1px solid ${issue.epic.color}40`,
            }}
          >
            {issue.epic.name}
          </span>
        )}

        {isBlocked && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
            title="Đang bị chặn bởi công việc chưa hoàn thành"
          >
            <Lock className="w-2.5 h-2.5 text-amber-600" />
            Bị chặn
          </span>
        )}

        {totalLinks > 0 && !isBlocked && (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-[#F8F8F8] px-1.5 py-0.5 rounded border border-[#D7D7D7]"
            title={`${totalLinks} liên kết`}
          >
            <Link2 className="w-2.5 h-2.5 text-slate-400" />
            {totalLinks}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-medium text-[#111827] group-hover:text-[#079455] transition line-clamp-2 leading-relaxed">
        {issue.title}
      </h4>

      {/* Subtasks Progress if any */}
      {totalSubtasks > 0 && (
        <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-500">
          <CheckCircle2 className={`w-3.5 h-3.5 ${completedSubtasks === totalSubtasks ? "text-emerald-600" : "text-slate-400"}`} />
          <span>
            {completedSubtasks}/{totalSubtasks} subtasks
          </span>
          <div className="flex-1 bg-slate-100 rounded-full h-1 ml-1 overflow-hidden">
            <div
              className={`h-full rounded-full ${completedSubtasks === totalSubtasks ? "bg-emerald-500" : "bg-slate-400"}`}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          {renderTypeIcon(issue.type)}
          <span className="text-[11px] font-semibold font-mono text-slate-500 group-hover:text-slate-800">
            {issue.key}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {issue.storyPoints !== undefined && (
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center justify-center">
              {issue.storyPoints}
            </span>
          )}

          {renderPriorityIcon(issue.priority)}

          {issue.assignee ? (
            <img
              src={issue.assignee.avatar}
              alt={issue.assignee.name}
              title={`Assigned to ${issue.assignee.name}`}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-full bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-500"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


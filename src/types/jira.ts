export type IssueType = "EPIC" | "STORY" | "TASK" | "BUG" | "SUBTASK";

export type IssuePriority = "HIGHEST" | "HIGH" | "MEDIUM" | "LOW" | "LOWEST";

export type IssueStatus = string;

export interface WorkflowStatus {
  id: string;
  key?: string;
  name: string;
  category: "TODO" | "IN_PROGRESS" | "DONE";
  color: string;
  order: number;
  maxWip?: number; // Work In Progress limit
  projectId?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  role: "PROJECT_LEAD" | "DEVELOPER" | "QA" | "VIEWER";
  joinedAt: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  leadId?: string;
  lead?: User;
  members?: ProjectMember[];
  statuses?: WorkflowStatus[];
  _count?: {
    issues?: number;
    sprints?: number;
    members?: number;
  };
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "ADMIN" | "PROJECT_LEAD" | "DEVELOPER" | "QA" | "VIEWER" | "PENDING";
  status?: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  activeTasksCount: number;
  memberships?: ProjectMember[];
}

export interface Epic {
  id: string;
  name: string;
  color: string; // Hex color code
  summary: string;
  projectId?: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: "ACTIVE" | "PLANNED" | "COMPLETED";
  startDate: string;
  endDate: string;
  totalPoints: number;
  completedPoints: number;
  projectId?: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}

export type IssueLinkType = "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES";

export interface IssueLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: IssueLinkType;
  sourceIssue?: { id: string; key: string; title: string; status: string; priority: IssuePriority; type: IssueType };
  targetIssue?: { id: string; key: string; title: string; status: string; priority: IssuePriority; type: IssueType };
  createdAt: string;
}

export interface Worklog {
  id: string;
  issueId: string;
  authorId: string;
  author?: User;
  timeSpentMin: number;
  remainingMin?: number | null;
  comment?: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface IssueActivity {
  id: string;
  issueId: string;
  actor: User;
  fieldChanged: string; // "STATUS", "ASSIGNEE", "PRIORITY", "STORY_POINTS", "TITLE", "DESCRIPTION"
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface Issue {
  id: string;
  key: string; // e.g. "PROJ-101"
  projectId?: string;
  type: IssueType;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: User;
  reporter: User;
  epic?: Epic;
  sprintId?: string;
  storyPoints?: number;
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  activities?: IssueActivity[];
  labels?: string;
  originalEstimate?: number; // minutes
  timeSpent?: number; // minutes
  sourceLinks?: IssueLink[];
  targetLinks?: IssueLink[];
  worklogs?: Worklog[];
  prLink?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  searchQuery: string;
  assigneeIds: string[];
  epicIds: string[];
  priorities: IssuePriority[];
  sprintId: string;
  onlyMyIssues: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  issueKey?: string;
  link?: string;
  type: "ASSIGN" | "COMMENT" | "STATUS" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
}

import { Epic, Issue, Sprint, User, WorkflowStatus } from "@/types/jira";

export const DEFAULT_STATUSES: WorkflowStatus[] = [
  { id: "TODO", name: "To do", category: "TODO", color: "#6B778C", order: 0 },
  { id: "IN_PROGRESS", name: "In progress", category: "IN_PROGRESS", color: "#0052CC", order: 1, maxWip: 5 },
  { id: "IN_REVIEW", name: "In review", category: "IN_PROGRESS", color: "#8777D9", order: 2, maxWip: 4 },
  { id: "IN_QA", name: "In QA/QC", category: "IN_PROGRESS", color: "#FFAB00", order: 3, maxWip: 3 },
  { id: "DONE", name: "Done", category: "DONE", color: "#36B37E", order: 4 },
  { id: "RELEASED", name: "Released", category: "DONE", color: "#00875A", order: 5 },
];

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Trần Minh Hiếu",
    email: "hieu.tran@company.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    role: "ADMIN",
    activeTasksCount: 3,
  },
  {
    id: "u2",
    name: "Nguyễn Thu Hà",
    email: "ha.nguyen@company.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    role: "PROJECT_LEAD",
    activeTasksCount: 2,
  },
  {
    id: "u3",
    name: "Lê Hoàng Long",
    email: "long.le@company.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    role: "DEVELOPER",
    activeTasksCount: 4,
  },
  {
    id: "u4",
    name: "Phạm Thảo Vy",
    email: "vy.pham@company.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
    role: "QA",
    activeTasksCount: 1,
  },
];

export const CURRENT_USER = MOCK_USERS[0];

export const MOCK_EPICS: Epic[] = [
  {
    id: "epic-1",
    name: "Auth & SSO Integration",
    color: "#6554C0", // Purple
    summary: "Xây dựng hệ thống đăng nhập Google SSO và bảo mật phiên.",
  },
  {
    id: "epic-2",
    name: "Kanban Board & Sprints",
    color: "#0052CC", // Atlassian Blue
    summary: "Bảng kéo thả Kanban trực quan, quản lý chu kỳ Sprint.",
  },
  {
    id: "epic-3",
    name: "Mouse-1 Smart Automation",
    color: "#00875A", // Jira Green
    summary: "Tích hợp mô hình vi quyết định Mouse-1 cho Auto-triage và Transition Gates.",
  },
  {
    id: "epic-4",
    name: "Analytics & Reports",
    color: "#FF8B00", // Jira Orange
    summary: "Biểu đồ Burndown, Burnup và theo dõi tiến độ tổng thể.",
  },
];

export const MOCK_SPRINTS: Sprint[] = [
  {
    id: "sprint-1",
    name: "Sprint 1 (Active) - Core Foundations",
    goal: "Hoàn thiện Google OAuth, Kanban Board và tích hợp Mouse-1 AI Safeguard",
    status: "ACTIVE",
    startDate: "2026-11-01",
    endDate: "2026-11-14",
    totalPoints: 48,
    completedPoints: 26,
  },
  {
    id: "sprint-2",
    name: "Sprint 2 (Planned) - Advanced Automations",
    goal: "Tối ưu hóa báo cáo Burndown và phân quyền nhóm người dùng",
    status: "PLANNED",
    startDate: "2026-11-15",
    endDate: "2026-11-28",
    totalPoints: 34,
    completedPoints: 0,
  },
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: "iss-1",
    key: "JIRA-101",
    type: "STORY",
    title: "Đăng nhập hệ thống qua Google Mail / Workspace SSO",
    description: "Tích hợp Google OAuth 2.0 bằng NextAuth.js để người dùng đăng nhập 1 chạm bằng tài khoản công ty. Cần lưu JWT token trong HttpOnly cookie an toàn.",
    status: "DONE",
    priority: "HIGH",
    assignee: MOCK_USERS[0],
    reporter: MOCK_USERS[1],
    epic: MOCK_EPICS[0],
    sprintId: "sprint-1",
    storyPoints: 5,
    subtasks: [
      { id: "sub-1", title: "Cấu hình Google Cloud Console OAuth consent screen", isCompleted: true },
      { id: "sub-2", title: "Tích hợp API Route NextAuth trong Next.js", isCompleted: true },
      { id: "sub-3", title: "Kiểm tra phiên đăng nhập trên giao diện", isCompleted: true },
    ],
    attachments: [
      { id: "att-1", name: "oauth_flow_diagram.png", size: "340 KB", type: "image/png", url: "#", uploadedAt: "2026-11-02" },
    ],
    comments: [
      { id: "c-1", author: MOCK_USERS[1], content: "Đã verify đăng nhập thành công với tài khoản domain công ty!", createdAt: "2026-11-03 14:20" },
    ],
    prLink: "https://github.com/company/jira/pull/12",
    createdAt: "2026-11-01",
    updatedAt: "2026-11-03",
  },
  {
    id: "iss-2",
    key: "JIRA-102",
    type: "TASK",
    title: "Thiết kế Bảng Kanban tương tác kéo thả mượt mà với @dnd-kit",
    description: "Xây dựng các cột trạng thái Backlog, To Do, In Progress, In Review, Done. Hỗ trợ animation mượt và optimistic state update.",
    status: "IN_PROGRESS",
    priority: "HIGHEST",
    assignee: MOCK_USERS[2],
    reporter: MOCK_USERS[0],
    epic: MOCK_EPICS[1],
    sprintId: "sprint-1",
    storyPoints: 8,
    subtasks: [
      { id: "sub-4", title: "Cấu hình DndContext và SortableContext", isCompleted: true },
      { id: "sub-5", title: "Xử lý kéo thả giữa các cột trạng thái", isCompleted: true },
      { id: "sub-6", title: "Thêm drop placeholder và highlight khi di chuột", isCompleted: false },
    ],
    attachments: [],
    comments: [],
    dueDate: "2026-11-12",
    createdAt: "2026-11-04",
    updatedAt: "2026-11-06",
  },
  {
    id: "iss-3",
    key: "JIRA-103",
    type: "TASK",
    title: "Tích hợp Mouse-1 AI Decision Engine cho Auto-Triage",
    description: "Kết nối API mouse.dev để tự động đề xuất Assignee, Epic và mức độ ưu tiên chỉ trong ~100ms khi người dùng tạo issue mới.",
    status: "IN_REVIEW",
    priority: "HIGH",
    assignee: MOCK_USERS[0],
    reporter: MOCK_USERS[2],
    epic: MOCK_EPICS[2],
    sprintId: "sprint-1",
    storyPoints: 5,
    subtasks: [
      { id: "sub-7", title: "Tạo client SDK Mouse-1 trong src/lib/mouse1.ts", isCompleted: true },
      { id: "sub-8", title: "Tạo API route /api/mouse1/triage", isCompleted: true },
      { id: "sub-9", title: "Viết test heuristic fallback khi offline", isCompleted: true },
    ],
    attachments: [],
    comments: [
      { id: "c-2", author: MOCK_USERS[0], content: "Đã hoàn thành PR, nhờ Tech Lead review qua nhé!", createdAt: "2026-11-07 10:15" },
    ],
    prLink: "https://github.com/company/jira/pull/18",
    createdAt: "2026-11-05",
    updatedAt: "2026-11-07",
  },
  {
    id: "iss-4",
    key: "JIRA-104",
    type: "BUG",
    title: "Lỗi hiển thị thanh tiến độ khi Epic có nhiều hơn 10 task",
    description: "Thanh tiến độ (Progress bar) bị tràn khung (overflow) trên màn hình độ phân giải dưới 1440px khi số lượng task quá lớn.",
    status: "TODO",
    priority: "MEDIUM",
    assignee: MOCK_USERS[3],
    reporter: MOCK_USERS[1],
    epic: MOCK_EPICS[1],
    sprintId: "sprint-1",
    storyPoints: 3,
    subtasks: [],
    attachments: [],
    comments: [],
    createdAt: "2026-11-06",
    updatedAt: "2026-11-06",
  },
  {
    id: "iss-5",
    key: "JIRA-105",
    type: "STORY",
    title: "Báo cáo Burndown Chart & Burnup Chart cho Sprint",
    description: "Trực quan hóa tiến độ hoàn thành Story points của Sprint theo từng ngày, so sánh giữa đường lý tưởng (Ideal) và đường thực tế (Actual).",
    status: "TODO",
    priority: "MEDIUM",
    assignee: MOCK_USERS[1],
    reporter: MOCK_USERS[0],
    epic: MOCK_EPICS[3],
    sprintId: "sprint-1",
    storyPoints: 5,
    subtasks: [
      { id: "sub-10", title: "Tính toán snapshot dữ liệu theo ngày", isCompleted: false },
      { id: "sub-11", title: "Vẽ biểu đồ bằng Recharts", isCompleted: false },
    ],
    attachments: [],
    comments: [],
    createdAt: "2026-11-07",
    updatedAt: "2026-11-07",
  },
];


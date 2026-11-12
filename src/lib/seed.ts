import { prisma } from "./prisma";

export async function seedDatabaseIfEmpty() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log("Seeding initial Jira database...");

  // 1. Create Project
  const project = await prisma.project.create({
    data: {
      key: "TT",
      name: "TamTask Space",
      description: "Không gian quản lý công việc và dự án thông minh TamTask",
    },
  });

  // 2. Create Users
  const userHieu = await prisma.user.create({
    data: {
      id: "u1",
      name: "Trần Minh Hiếu",
      email: "hieu.tran@company.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      role: "ADMIN",
      activeTasksCount: 3,
    },
  });

  const userHa = await prisma.user.create({
    data: {
      id: "u2",
      name: "Nguyễn Thu Hà",
      email: "ha.nguyen@company.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      role: "PROJECT_LEAD",
      activeTasksCount: 2,
    },
  });

  const userLong = await prisma.user.create({
    data: {
      id: "u3",
      name: "Lê Hoàng Long",
      email: "long.le@company.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      role: "DEVELOPER",
      activeTasksCount: 4,
    },
  });

  const userVy = await prisma.user.create({
    data: {
      id: "u4",
      name: "Phạm Thảo Vy",
      email: "vy.pham@company.com",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
      role: "QA",
      activeTasksCount: 1,
    },
  });

  // 3. Create Epics
  const epicAuth = await prisma.epic.create({
    data: {
      id: "epic-1",
      name: "Auth & SSO Integration",
      color: "#6554C0",
      summary: "Xây dựng hệ thống đăng nhập Google SSO và bảo mật phiên.",
      projectId: project.id,
    },
  });

  const epicKanban = await prisma.epic.create({
    data: {
      id: "epic-2",
      name: "Kanban Board & Sprints",
      color: "#0052CC",
      summary: "Bảng kéo thả Kanban trực quan, quản lý chu kỳ Sprint.",
      projectId: project.id,
    },
  });

  const epicMouse1 = await prisma.epic.create({
    data: {
      id: "epic-3",
      name: "Quy Trình Tự Động Hóa",
      color: "#00875A",
      summary: "Hệ thống quy tắc tự động hóa luồng công việc thông minh.",
      projectId: project.id,
    },
  });

  const epicAnalytics = await prisma.epic.create({
    data: {
      id: "epic-4",
      name: "Báo Cáo & Thống Kê Tiến Độ",
      color: "#FF8B00",
      summary: "Biểu đồ Burndown, Burnup và theo dõi tiến độ tổng thể.",
      projectId: project.id,
    },
  });

  // 4. Create Default 6 Workflow Statuses for Project
  await prisma.projectWorkflowStatus.createMany({
    data: [
      { projectId: project.id, key: "TODO", name: "To do", category: "TODO", color: "#6B778C", order: 0 },
      { projectId: project.id, key: "IN_PROGRESS", name: "In progress", category: "IN_PROGRESS", color: "#0052CC", order: 1, maxWip: 5 },
      { projectId: project.id, key: "IN_REVIEW", name: "In review", category: "IN_PROGRESS", color: "#8777D9", order: 2, maxWip: 4 },
      { projectId: project.id, key: "IN_QA", name: "In QA/QC", category: "IN_PROGRESS", color: "#FFAB00", order: 3, maxWip: 3 },
      { projectId: project.id, key: "DONE", name: "Done", category: "DONE", color: "#36B37E", order: 4 },
      { projectId: project.id, key: "RELEASED", name: "Released", category: "DONE", color: "#00875A", order: 5 },
    ],
  });

  // 5. Create Sprints
  const sprint1 = await prisma.sprint.create({
    data: {
      id: "sprint-1",
      name: "Sprint 1 (Active) - Nền Tảng Cốt Lõi",
      goal: "Hoàn thiện hệ thống xác thực, Bảng công việc và quy trình tự động",
      status: "ACTIVE",
      startDate: "2026-11-01",
      endDate: "2026-11-14",
      totalPoints: 48,
      completedPoints: 26,
      projectId: project.id,
    },
  });

  await prisma.sprint.create({
    data: {
      id: "sprint-2",
      name: "Sprint 2 (Planned) - Advanced Automations",
      goal: "Tối ưu hóa báo cáo Burndown và phân quyền nhóm người dùng",
      status: "PLANNED",
      startDate: "2026-11-15",
      endDate: "2026-11-28",
      totalPoints: 34,
      completedPoints: 0,
      projectId: project.id,
    },
  });

  // 5. Create Issues
  await prisma.issue.create({
    data: {
      key: "JIRA-101",
      type: "STORY",
      title: "Đăng nhập hệ thống qua Google Mail / Workspace SSO",
      description: "Tích hợp Google OAuth 2.0 bằng NextAuth.js để người dùng đăng nhập 1 chạm bằng tài khoản công ty. Cần lưu JWT token trong HttpOnly cookie an toàn.",
      status: "DONE",
      priority: "HIGH",
      storyPoints: 5,
      prLink: "https://github.com/company/jira/pull/12",
      projectId: project.id,
      assigneeId: userHieu.id,
      reporterId: userHa.id,
      epicId: epicAuth.id,
      sprintId: sprint1.id,
      subtasks: {
        create: [
          { title: "Cấu hình Google Cloud Console OAuth consent screen", isCompleted: true },
          { title: "Tích hợp API Route NextAuth trong Next.js", isCompleted: true },
          { title: "Kiểm tra phiên đăng nhập trên giao diện", isCompleted: true },
        ],
      },
      comments: {
        create: [
          {
            content: "Đã verify đăng nhập thành công với tài khoản domain công ty!",
            authorId: userHa.id,
          },
        ],
      },
    },
  });

  await prisma.issue.create({
    data: {
      key: "JIRA-102",
      type: "TASK",
      title: "Thiết kế Bảng Kanban tương tác kéo thả mượt mà với @dnd-kit",
      description: "Xây dựng các cột trạng thái Backlog, To Do, In Progress, In Review, Done. Hỗ trợ animation mượt và optimistic state update.",
      status: "IN_PROGRESS",
      priority: "HIGHEST",
      storyPoints: 8,
      dueDate: "2026-11-12",
      projectId: project.id,
      assigneeId: userLong.id,
      reporterId: userHieu.id,
      epicId: epicKanban.id,
      sprintId: sprint1.id,
      subtasks: {
        create: [
          { title: "Cấu hình DndContext và SortableContext", isCompleted: true },
          { title: "Xử lý kéo thả giữa các cột trạng thái", isCompleted: true },
          { title: "Thêm drop placeholder và highlight khi di chuột", isCompleted: false },
        ],
      },
    },
  });

  await prisma.issue.create({
    data: {
      key: "JIRA-103",
      type: "TASK",
      title: "Tích hợp Mouse-1 AI Decision Engine cho Auto-Triage",
      description: "Kết nối API mouse.dev để tự động đề xuất Assignee, Epic và mức độ ưu tiên chỉ trong ~100ms khi người dùng tạo issue mới.",
      status: "IN_REVIEW",
      priority: "HIGH",
      storyPoints: 5,
      prLink: "https://github.com/company/jira/pull/18",
      projectId: project.id,
      assigneeId: userHieu.id,
      reporterId: userLong.id,
      epicId: epicMouse1.id,
      sprintId: sprint1.id,
      subtasks: {
        create: [
          { title: "Tạo client SDK Mouse-1 trong src/lib/mouse1.ts", isCompleted: true },
          { title: "Tạo API route /api/mouse1/triage", isCompleted: true },
          { title: "Viết test heuristic fallback khi offline", isCompleted: true },
        ],
      },
      comments: {
        create: [
          {
            content: "Đã hoàn thành PR, nhờ Tech Lead review qua nhé!",
            authorId: userHieu.id,
          },
        ],
      },
    },
  });

  await prisma.issue.create({
    data: {
      key: "JIRA-104",
      type: "BUG",
      title: "Lỗi hiển thị thanh tiến độ khi Epic có nhiều hơn 10 task",
      description: "Thanh tiến độ (Progress bar) bị tràn khung (overflow) trên màn hình độ phân giải dưới 1440px khi số lượng task quá lớn.",
      status: "TODO",
      priority: "MEDIUM",
      storyPoints: 3,
      projectId: project.id,
      assigneeId: userVy.id,
      reporterId: userHa.id,
      epicId: epicKanban.id,
      sprintId: sprint1.id,
    },
  });

  await prisma.issue.create({
    data: {
      key: "JIRA-105",
      type: "STORY",
      title: "Báo cáo Burndown Chart & Burnup Chart cho Sprint",
      description: "Trực quan hóa tiến độ hoàn thành Story points của Sprint theo từng ngày, so sánh giữa đường lý tưởng (Ideal) và đường thực tế (Actual).",
      status: "TODO",
      priority: "MEDIUM",
      storyPoints: 5,
      projectId: project.id,
      assigneeId: userHa.id,
      reporterId: userHieu.id,
      epicId: epicAnalytics.id,
      sprintId: sprint1.id,
      subtasks: {
        create: [
          { title: "Tính toán snapshot dữ liệu theo ngày", isCompleted: false },
          { title: "Vẽ biểu đồ bằng Recharts", isCompleted: false },
        ],
      },
    },
  });

  // 6. Create Automation Rules
  await prisma.automationRule.createMany({
    data: [
      {
        name: "Tự động hoàn thành Task cha khi tất cả Subtasks đã Done",
        trigger: "Khi tất cả Subtasks chuyển sang DONE",
        action: "Tự động chuyển Parent Issue sang trạng thái DONE",
        isActive: true,
        useMouse1: false,
        executionsCount: 14,
        lastExecuted: "2026-11-08 14:15",
      },
      {
        name: "Phân loại thông minh khi tạo công việc mới",
        trigger: "Khi một Task / Bug mới được tạo",
        action: "Tự động gợi ý người thực hiện và mức độ ưu tiên tối ưu",
        isActive: true,
        useMouse1: true,
        executionsCount: 38,
        lastExecuted: "2026-11-08 19:30",
      },
      {
        name: "Kiểm duyệt điều kiện chuyển trạng thái (Smart Transition Gate)",
        trigger: "Khi kéo task sang IN QA hoặc DONE",
        action: "Kiểm duyệt điều kiện subtasks và PR link trước khi cho phép chuyển",
        isActive: true,
        useMouse1: true,
        executionsCount: 22,
        lastExecuted: "2026-11-08 21:05",
      },
    ],
  });

  console.log("Database seeded successfully!");
}


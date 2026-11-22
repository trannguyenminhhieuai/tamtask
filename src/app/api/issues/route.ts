import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabaseIfEmpty } from "@/lib/seed";
import { dispatchAutomationEvent } from "@/lib/automation-dispatcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await seedDatabaseIfEmpty();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const sprintId = searchParams.get("sprintId");
    const assigneeId = searchParams.get("assigneeId");
    const epicId = searchParams.get("epicId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (sprintId) where.sprintId = sprintId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (epicId) where.epicId = epicId;
    if (status) where.status = status;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        assignee: true,
        reporter: true,
        epic: true,
        subtasks: true,
        attachments: {
          select: {
            id: true,
            name: true,
            size: true,
            type: true,
            createdAt: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("GET /api/issues error:", error);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role === "VIEWER") {
      return NextResponse.json(
        { error: "Tài khoản Khách (VIEWER) không có quyền tạo công việc." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Tiêu đề công việc không được để trống." }, { status: 400 });
    }

    // 1. Resolve and validate Project
    let projectKey = "JIRA";
    let projectId: string | null = null;
    if (body.projectId) {
      const proj = await prisma.project.findUnique({ where: { id: body.projectId } });
      if (proj) {
        projectId = proj.id;
        projectKey = proj.key;
      }
    }

    // 2. Generate unique key safely (guaranteeing no unique key collision)
    let count = await prisma.issue.count({
      where: projectId ? { projectId } : undefined,
    });
    let key = `${projectKey}-${101 + count}`;
    while (await prisma.issue.findUnique({ where: { key } })) {
      count++;
      key = `${projectKey}-${101 + count}`;
    }

    // 3. Resolve valid Reporter (prioritize logged-in session user to prevent foreign-key failure)
    let reporterId: string | null = null;
    if (session?.user?.email) {
      const dbSessionUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
      if (dbSessionUser) reporterId = dbSessionUser.id;
    }
    if (!reporterId && body.reporterId) {
      const checkReporter = await prisma.user.findUnique({ where: { id: body.reporterId } });
      if (checkReporter) reporterId = checkReporter.id;
    }
    if (!reporterId) {
      const fallbackUser = await prisma.user.findFirst();
      if (fallbackUser) reporterId = fallbackUser.id;
    }

    // 4. Validate Assignee against DB to prevent foreign-key violation
    let assigneeId: string | null = null;
    if (body.assigneeId) {
      const checkAssignee = await prisma.user.findUnique({ where: { id: body.assigneeId } });
      if (checkAssignee) assigneeId = checkAssignee.id;
    }

    // 5. Validate Epic against DB (or auto-create Epic record if issue type is EPIC)
    let epicId: string | null = null;
    if (body.type === "EPIC") {
      const epicColors = [
        "#0052CC", // Blue
        "#6554C0", // Purple
        "#00875A", // Forest Green
        "#FF5630", // Red Coral
        "#FFAB00", // Amber
        "#36B37E", // Emerald
        "#00B8D9", // Teal
        "#E56910", // Warm Orange
      ];
      const randomColor = epicColors[Math.floor(Math.random() * epicColors.length)];
      const createdEpic = await prisma.epic.create({
        data: {
          name: body.title.trim(),
          summary: body.description || "",
          color: randomColor,
          projectId: projectId || null,
        },
      });
      epicId = createdEpic.id;
    } else if (body.epicId) {
      const checkEpic = await prisma.epic.findUnique({ where: { id: body.epicId } });
      if (checkEpic) epicId = checkEpic.id;
    }

    // 6. Validate Sprint against DB
    let sprintId: string | null = null;
    if (body.sprintId) {
      const checkSprint = await prisma.sprint.findUnique({ where: { id: body.sprintId } });
      if (checkSprint) sprintId = checkSprint.id;
    }

    // Safe story points parsing
    let storyPoints: number | null = null;
    if (body.storyPoints !== undefined && body.storyPoints !== null && body.storyPoints !== "") {
      const parsed = parseInt(String(body.storyPoints), 10);
      if (!isNaN(parsed)) storyPoints = parsed;
    }

    const newIssue = await prisma.issue.create({
      data: {
        key,
        projectId,
        type: body.type || "TASK",
        title: body.title.trim(),
        description: body.description || "",
        status: body.status || "TODO",
        priority: body.priority || "MEDIUM",
        storyPoints,
        dueDate: body.dueDate || null,
        prLink: body.prLink || null,
        assigneeId,
        reporterId,
        epicId,
        sprintId,
        labels: body.labels || "",
        originalEstimate: body.originalEstimate ? parseInt(String(body.originalEstimate), 10) : null,
      },
      include: {
        assignee: true,
        reporter: true,
        epic: true,
        subtasks: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });

    // If assigned to another user, create a notification
    if (newIssue.assigneeId && newIssue.assigneeId !== reporterId) {
      await prisma.notification.create({
        data: {
          userId: newIssue.assigneeId,
          title: "Gán công việc mới",
          message: `Bạn đã được gán vào issue ${key}: ${body.title}`,
          link: key,
          type: "ASSIGN",
        },
      }).catch(() => {});
    }

    // Trigger Live Automation Dispatcher for newly created issue
    await dispatchAutomationEvent("ISSUE_CREATED", {
      issueId: newIssue.id,
      actorId: reporterId || "u1",
    }).catch(() => {});

    const finalCreated = await prisma.issue.findUnique({
      where: { id: newIssue.id },
      include: {
        assignee: true,
        reporter: true,
        epic: true,
        subtasks: true,
        comments: { include: { author: true } },
        activities: { include: { actor: true } },
        attachments: true,
        sourceLinks: {
          include: {
            targetIssue: {
              select: { id: true, key: true, title: true, status: true, priority: true, type: true },
            },
          },
        },
        targetLinks: {
          include: {
            sourceIssue: {
              select: { id: true, key: true, title: true, status: true, priority: true, type: true },
            },
          },
        },
        worklogs: {
          include: {
            author: true,
          },
          orderBy: {
            loggedAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(finalCreated || newIssue, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/issues error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create issue" },
      { status: 500 }
    );
  }
}


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
        comments: {
          include: {
            author: true,
          },
        },
        activities: {
          include: {
            actor: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
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

    // Auto-generate next key e.g. JIRA-106 or PROJ-101
    let projectKey = "JIRA";
    if (body.projectId) {
      const proj = await prisma.project.findUnique({ where: { id: body.projectId } });
      if (proj) projectKey = proj.key;
    }
    const count = await prisma.issue.count({
      where: body.projectId ? { projectId: body.projectId } : undefined,
    });
    const key = `${projectKey}-${101 + count}`;

    const newIssue = await prisma.issue.create({
      data: {
        key,
        projectId: body.projectId || null,
        type: body.type || "TASK",
        title: body.title,
        description: body.description || "",
        status: body.status || "TODO",
        priority: body.priority || "MEDIUM",
        storyPoints: body.storyPoints ? parseInt(body.storyPoints) : null,
        dueDate: body.dueDate,
        prLink: body.prLink,
        assigneeId: body.assigneeId || null,
        reporterId: body.reporterId || null,
        epicId: body.epicId || null,
        sprintId: body.sprintId || null,
        labels: body.labels || null,
        originalEstimate: body.originalEstimate ? parseInt(body.originalEstimate) : null,
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

    // If assigned, create a notification
    if (newIssue.assigneeId) {
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
      actorId: body.reporterId || "u1",
    });

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
  } catch (error) {
    console.error("POST /api/issues error:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}


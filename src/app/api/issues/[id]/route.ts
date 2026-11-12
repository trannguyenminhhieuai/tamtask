import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchAutomationEvent } from "@/lib/automation-dispatcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        assignee: true,
        reporter: true,
        epic: true,
        subtasks: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
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
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("GET /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch issue" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role === "VIEWER") {
      return NextResponse.json(
        { error: "Tài khoản Khách (VIEWER) không có quyền chỉnh sửa công việc." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 1. Fetch current issue state to track changelog
    const existing = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { assignee: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const actorId =
      (session?.user as any)?.id ||
      body.actorId ||
      existing.reporterId ||
      existing.assigneeId ||
      "u1";

    // 2. Prepare updates
    const data: Record<string, unknown> = {};
    const activitiesToCreate: Array<{
      fieldChanged: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    if (body.title !== undefined && body.title !== existing.title) {
      data.title = body.title;
      activitiesToCreate.push({
        fieldChanged: "TITLE",
        oldValue: existing.title,
        newValue: body.title,
      });
    }

    if (body.description !== undefined && body.description !== existing.description) {
      data.description = body.description;
      activitiesToCreate.push({
        fieldChanged: "DESCRIPTION",
        oldValue: (existing.description || "").slice(0, 100),
        newValue: (body.description || "").slice(0, 100),
      });
    }

    if (body.status !== undefined && body.status !== existing.status) {
      data.status = body.status;
      activitiesToCreate.push({
        fieldChanged: "STATUS",
        oldValue: existing.status,
        newValue: body.status,
      });
    }

    if (body.priority !== undefined && body.priority !== existing.priority) {
      data.priority = body.priority;
      activitiesToCreate.push({
        fieldChanged: "PRIORITY",
        oldValue: existing.priority,
        newValue: body.priority,
      });
    }

    if (body.storyPoints !== undefined && body.storyPoints !== existing.storyPoints) {
      data.storyPoints = body.storyPoints;
      activitiesToCreate.push({
        fieldChanged: "STORY_POINTS",
        oldValue: existing.storyPoints ? String(existing.storyPoints) : "None",
        newValue: body.storyPoints ? String(body.storyPoints) : "None",
      });
    }

    if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) {
      data.assigneeId = body.assigneeId || null;
      activitiesToCreate.push({
        fieldChanged: "ASSIGNEE",
        oldValue: existing.assignee?.name || "Unassigned",
        newValue: body.assigneeName || (body.assigneeId ? "Assigned" : "Unassigned"),
      });
    }

    if (body.epicId !== undefined && body.epicId !== existing.epicId) {
      data.epicId = body.epicId || null;
      activitiesToCreate.push({
        fieldChanged: "EPIC",
        oldValue: existing.epicId || "None",
        newValue: body.epicId || "None",
      });
    }

    if (body.sprintId !== undefined) data.sprintId = body.sprintId || null;
    if (body.prLink !== undefined) data.prLink = body.prLink;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate;
    if (body.labels !== undefined) data.labels = body.labels;
    if (body.originalEstimate !== undefined) {
      data.originalEstimate = body.originalEstimate ? parseInt(body.originalEstimate) : null;
    }
    if (body.timeSpent !== undefined) {
      data.timeSpent = body.timeSpent ? parseInt(body.timeSpent) : 0;
    }

    // Trigger notification if assigned to someone new
    if (body.assigneeId && body.assigneeId !== existing.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: body.assigneeId,
          title: "Bạn có công việc mới",
          message: `Bạn được phân công vào issue ${existing.key}: ${body.title || existing.title}`,
          link: existing.key,
          type: "ASSIGN",
        },
      }).catch(() => {});
    }

    // Trigger notification if status changed to DONE
    if (body.status === "DONE" && existing.status !== "DONE" && existing.reporterId) {
      await prisma.notification.create({
        data: {
          userId: existing.reporterId,
          title: "Công việc đã hoàn tất",
          message: `Issue ${existing.key} đã được chuyển sang trạng thái HOÀN THÀNH (DONE)`,
          link: existing.key,
          type: "STATUS",
        },
      }).catch(() => {});
    }

    // 3. Update subtasks if provided
    if (body.subtasks && Array.isArray(body.subtasks)) {
      for (const st of body.subtasks) {
        if (st.id && !st.id.startsWith("sub-")) {
          await prisma.subtask
            .update({
              where: { id: st.id },
              data: {
                title: st.title,
                isCompleted: Boolean(st.isCompleted),
              },
            })
            .catch(() => {});
        } else if (st.title) {
          await prisma.subtask
            .create({
              data: {
                title: st.title,
                isCompleted: Boolean(st.isCompleted),
                issueId: params.id,
              },
            })
            .catch(() => {});
        }
      }
    }

    // 4. Update issue in Database
    const updated = await prisma.issue.update({
      where: { id: params.id },
      data,
      include: {
        assignee: true,
        reporter: true,
        epic: true,
        subtasks: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
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
    });

    // 5. Record Activity Changelog
    if (activitiesToCreate.length > 0 && actorId) {
      for (const act of activitiesToCreate) {
        await prisma.issueActivity.create({
          data: {
            issueId: params.id,
            actorId,
            fieldChanged: act.fieldChanged,
            oldValue: act.oldValue,
            newValue: act.newValue,
          },
        });
      }
    }

    // 6. Trigger Live Automation Dispatcher
    await dispatchAutomationEvent("ISSUE_UPDATED", {
      issueId: params.id,
      actorId,
      newValue: body.status,
    });

    // 7. Fetch final updated issue with all relations and fresh activities
    const finalIssue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        assignee: true,
        reporter: true,
        epic: true,
        subtasks: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
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
    });

    return NextResponse.json(finalIssue || updated);
  } catch (error) {
    console.error("PATCH /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role === "VIEWER") {
      return NextResponse.json(
        { error: "Tài khoản Khách (VIEWER) không có quyền xóa công việc." },
        { status: 403 }
      );
    }

    await prisma.issue.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete issue" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { issueIds, action, data = {}, actorId = "u1" } = body;

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json({ error: "Chưa chọn công việc nào để thao tác" }, { status: 400 });
    }

    if (action === "DELETE") {
      await prisma.issue.deleteMany({
        where: { id: { in: issueIds } },
      });
      return NextResponse.json({ success: true, count: issueIds.length });
    }

    const updateData: Record<string, unknown> = {};

    if (action === "MOVE_SPRINT") {
      updateData.sprintId = data.sprintId === "backlog" || !data.sprintId ? null : data.sprintId;
    } else if (action === "CHANGE_STATUS") {
      if (!data.status) {
        return NextResponse.json({ error: "Trạng thái mới không hợp lệ" }, { status: 400 });
      }
      updateData.status = data.status;
    } else if (action === "ASSIGN") {
      updateData.assigneeId = data.assigneeId || null;
    } else if (action === "SET_PRIORITY") {
      if (!data.priority) {
        return NextResponse.json({ error: "Độ ưu tiên không hợp lệ" }, { status: 400 });
      }
      updateData.priority = data.priority;
    } else {
      return NextResponse.json({ error: `Thao tác không hỗ trợ: ${action}` }, { status: 400 });
    }

    await prisma.issue.updateMany({
      where: { id: { in: issueIds } },
      data: updateData,
    });

    // Create activity logs for each affected issue
    const activities = issueIds.map((id: string) => ({
      issueId: id,
      actorId,
      fieldChanged: `BULK_${action}`,
      oldValue: null,
      newValue: JSON.stringify(data),
    }));

    await prisma.issueActivity.createMany({
      data: activities,
    }).catch(() => {});

    // Fetch updated issues to return
    const updatedIssues = await prisma.issue.findMany({
      where: { id: { in: issueIds } },
      include: {
        assignee: true,
        reporter: true,
        epic: true,
        subtasks: true,
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
      },
    });

    return NextResponse.json({
      success: true,
      count: issueIds.length,
      issues: updatedIssues,
    });
  } catch (error) {
    console.error("POST /api/issues/bulk error:", error);
    return NextResponse.json({ error: "Lỗi thực thi thao tác hàng loạt" }, { status: 500 });
  }
}


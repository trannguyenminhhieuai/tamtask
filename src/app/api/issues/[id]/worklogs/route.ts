import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const worklogs = await prisma.worklog.findMany({
      where: { issueId: params.id },
      include: {
        author: true,
      },
      orderBy: { loggedAt: "desc" },
    });

    return NextResponse.json(worklogs);
  } catch (error) {
    console.error("GET /api/issues/[id]/worklogs error:", error);
    return NextResponse.json({ error: "Failed to fetch worklogs" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { authorId, timeSpentMin, remainingMin, comment, loggedAt } = body;

    if (!timeSpentMin || timeSpentMin <= 0) {
      return NextResponse.json({ error: "Thời gian ghi nhận phải lớn hơn 0" }, { status: 400 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const effectiveAuthorId = authorId || issue.assigneeId || issue.reporterId || "u1";

    const worklog = await prisma.worklog.create({
      data: {
        issueId: params.id,
        authorId: effectiveAuthorId,
        timeSpentMin: Number(timeSpentMin),
        remainingMin: remainingMin !== undefined && remainingMin !== null ? Number(remainingMin) : null,
        comment: comment || null,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
      },
      include: {
        author: true,
      },
    });

    // Update aggregate timeSpent on Issue
    const newTotalSpent = (issue.timeSpent || 0) + Number(timeSpentMin);
    await prisma.issue.update({
      where: { id: params.id },
      data: { timeSpent: newTotalSpent },
    });

    // Log Activity
    await prisma.issueActivity.create({
      data: {
        issueId: params.id,
        actorId: effectiveAuthorId,
        fieldChanged: "WORKLOG",
        oldValue: `${issue.timeSpent || 0}m`,
        newValue: `+${timeSpentMin}m (${comment || "Log work"})`,
      },
    }).catch(() => {});

    return NextResponse.json(worklog, { status: 201 });
  } catch (error) {
    console.error("POST /api/issues/[id]/worklogs error:", error);
    return NextResponse.json({ error: "Failed to create worklog" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const worklogId = searchParams.get("worklogId");

    if (!worklogId) {
      return NextResponse.json({ error: "worklogId is required" }, { status: 400 });
    }

    const log = await prisma.worklog.findUnique({
      where: { id: worklogId },
    });

    if (!log) {
      return NextResponse.json({ error: "Worklog not found" }, { status: 404 });
    }

    await prisma.worklog.delete({
      where: { id: worklogId },
    });

    // Decrement timeSpent on issue
    const issue = await prisma.issue.findUnique({ where: { id: params.id } });
    if (issue) {
      const updatedSpent = Math.max(0, (issue.timeSpent || 0) - log.timeSpentMin);
      await prisma.issue.update({
        where: { id: params.id },
        data: { timeSpent: updatedSpent },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/issues/[id]/worklogs error:", error);
    return NextResponse.json({ error: "Failed to delete worklog" }, { status: 500 });
  }
}


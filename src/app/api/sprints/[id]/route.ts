import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && ((session.user as any).role === "VIEWER" || (session.user as any).role === "PENDING")) {
      return NextResponse.json(
        { error: "Tài khoản của bạn không có quyền cập nhật Sprint." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updated = await prisma.sprint.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.goal !== undefined && { goal: body.goal }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.startDate !== undefined && { startDate: body.startDate }),
        ...(body.endDate !== undefined && { endDate: body.endDate }),
        ...(body.completedPoints !== undefined && { completedPoints: body.completedPoints }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/sprints/[id] error:", error);
    return NextResponse.json({ error: "Failed to update sprint" }, { status: 500 });
  }
}

// DELETE /api/sprints/[id] - Delete a sprint safely (auto-moves child issues to Backlog)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && ((session.user as any).role === "VIEWER" || (session.user as any).role === "PENDING")) {
      return NextResponse.json(
        { error: "Tài khoản của bạn không có quyền xóa Sprint." },
        { status: 403 }
      );
    }

    const sprintId = params.id;

    // 1. Move all issues belonging to this sprint back to Backlog (sprintId = null)
    const moveResult = await prisma.issue.updateMany({
      where: { sprintId },
      data: { sprintId: null },
    });

    // 2. Delete the sprint
    await prisma.sprint.delete({
      where: { id: sprintId },
    });

    return NextResponse.json({
      success: true,
      deletedSprintId: sprintId,
      movedIssuesCount: moveResult.count,
    });
  } catch (error: any) {
    console.error("DELETE /api/sprints/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete sprint" }, { status: 500 });
  }
}

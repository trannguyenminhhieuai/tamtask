import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { assignedIssues: true, reportedIssues: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      activeTasksCount: user._count.assignedIssues,
    });
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { role, status, name, avatar } = body;

    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    if (name !== undefined) data.name = name;
    if (avatar !== undefined) data.avatar = avatar;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data,
      include: {
        _count: {
          select: { assignedIssues: true },
        },
      },
    });

    return NextResponse.json({
      ...updatedUser,
      activeTasksCount: updatedUser._count.assignedIssues,
    });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update user role/status in database" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}


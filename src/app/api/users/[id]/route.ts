import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Chỉ Quản trị viên hệ thống (ADMIN) mới có quyền xóa nhân sự." },
        { status: 403 }
      );
    }

    if (session?.user && (session.user as any).id === params.id) {
      return NextResponse.json(
        { error: "Bạn không thể tự xóa tài khoản của chính mình." },
        { status: 400 }
      );
    }

    // 1. Unassign issues
    await prisma.issue.updateMany({
      where: { assigneeId: params.id },
      data: { assigneeId: null },
    });

    // 2. Remove project memberships
    await prisma.projectMember.deleteMany({
      where: { userId: params.id },
    });

    // 3. Remove notifications & activities
    await prisma.notification.deleteMany({
      where: { userId: params.id },
    }).catch(() => {});

    await prisma.issueActivity.deleteMany({
      where: { actorId: params.id },
    }).catch(() => {});

    // 4. Finally delete user
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa nhân sự khỏi hệ thống thành công." });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Không thể xóa nhân sự khỏi cơ sở dữ liệu." },
      { status: 500 }
    );
  }
}


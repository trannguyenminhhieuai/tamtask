import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ATTT SEC-1: Chuẩn hóa Projection không để lộ Password Hash hoặc OTP
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  status: true,
  isTwoFactorEnabled: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { assignedIssues: true, reportedIssues: true },
  },
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: safeUserSelect,
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Yêu cầu đăng nhập để cập nhật thông tin người dùng." },
        { status: 401 }
      );
    }

    const callerRole = (session.user as any).role;
    const callerId = (session.user as any).id;
    const callerEmail = session.user.email?.toLowerCase();

    const body = await request.json();
    const { role, status, name, avatar } = body;

    // ATTT SEC-2: Kiểm soát chặt chẽ quyền leo thang (Privilege Escalation Protection)
    // Chỉ Quản trị viên (ADMIN) mới được thay đổi vai trò (role) hoặc trạng thái phê duyệt (status)
    if (role !== undefined || status !== undefined) {
      if (callerRole !== "ADMIN") {
        return NextResponse.json(
          { error: "Chỉ Quản trị viên (ADMIN) mới có quyền thay đổi vai trò hoặc trạng thái tài khoản." },
          { status: 403 }
        );
      }
    }

    // Người dùng thông thường chỉ được phép đổi name/avatar của chính họ
    if (callerRole !== "ADMIN" && callerId !== params.id) {
      const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: { email: true },
      });
      if (targetUser?.email?.toLowerCase() !== callerEmail) {
        return NextResponse.json(
          { error: "Bạn không có quyền sửa đổi thông tin của người dùng khác." },
          { status: 403 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (role !== undefined && callerRole === "ADMIN") data.role = role;
    if (status !== undefined && callerRole === "ADMIN") data.status = status;
    if (name !== undefined) data.name = name;
    if (avatar !== undefined) data.avatar = avatar;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data,
      select: safeUserSelect,
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

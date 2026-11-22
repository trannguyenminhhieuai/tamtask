import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  status: true,
  activeTasksCount: true,
};

// GET /api/projects/[id]/members - List project members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error: any) {
    console.error("GET /api/projects/[id]/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/projects/[id]/members - Assign user to project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    const callerRole = (session.user as any).role;
    const callerId = (session.user as any).id;
    const projectId = params.id;

    // Check project lead or admin
    if (callerRole !== "ADMIN") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { leadId: true },
      });
      if (!project || (project.leadId !== callerId && callerRole !== "PROJECT_LEAD")) {
        return NextResponse.json(
          { error: "Chỉ Quản trị viên hoặc Trưởng dự án mới có quyền thêm thành viên." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { userId, role = "DEVELOPER" } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Upsert member into project
    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      update: {
        role,
      },
      create: {
        projectId,
        userId,
        role,
      },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error("POST /api/projects/[id]/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members - Remove user from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    const callerRole = (session.user as any).role;
    const callerId = (session.user as any).id;
    const projectId = params.id;

    if (callerRole !== "ADMIN") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { leadId: true },
      });
      if (!project || (project.leadId !== callerId && callerRole !== "PROJECT_LEAD")) {
        return NextResponse.json(
          { error: "Chỉ Quản trị viên hoặc Trưởng dự án mới có quyền xóa thành viên." },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true, removedUserId: userId });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id]/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

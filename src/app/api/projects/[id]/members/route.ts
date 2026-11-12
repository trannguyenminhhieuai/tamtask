import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            status: true,
            activeTasksCount: true,
          },
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
    const projectId = params.id;
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
        user: true,
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
    const projectId = params.id;
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

// PATCH /api/projects/[id]/members - Update member role in project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    const updated = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: {
        role,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/projects/[id]/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


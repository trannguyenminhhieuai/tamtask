import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const sprints = await prisma.sprint.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { issues: true },
        },
      },
    });
    return NextResponse.json(sprints);
  } catch (error) {
    console.error("GET /api/sprints error:", error);
    return NextResponse.json({ error: "Failed to fetch sprints" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && ((session.user as any).role === "VIEWER" || (session.user as any).role === "PENDING")) {
      return NextResponse.json(
        { error: "Tài khoản của bạn không có quyền tạo Sprint mới." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Tên Sprint không được để trống." }, { status: 400 });
    }

    const sprint = await prisma.sprint.create({
      data: {
        name: body.name.trim(),
        goal: body.goal || "",
        status: body.status || "PLANNED",
        startDate: body.startDate,
        endDate: body.endDate,
        totalPoints: body.totalPoints || 0,
        projectId: body.projectId || null,
      },
    });
    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    console.error("POST /api/sprints error:", error);
    return NextResponse.json({ error: "Failed to create sprint" }, { status: 500 });
  }
}

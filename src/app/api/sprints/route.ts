import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();
    const sprint = await prisma.sprint.create({
      data: {
        name: body.name,
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


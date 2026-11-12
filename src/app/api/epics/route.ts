import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const epics = await prisma.epic.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { issues: true },
        },
      },
    });
    return NextResponse.json(epics);
  } catch (error) {
    console.error("GET /api/epics error:", error);
    return NextResponse.json({ error: "Failed to fetch epics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const epic = await prisma.epic.create({
      data: {
        name: body.name,
        color: body.color || "#0052CC",
        summary: body.summary || "",
        projectId: body.projectId || null,
      },
    });
    return NextResponse.json(epic, { status: 201 });
  } catch (error) {
    console.error("POST /api/epics error:", error);
    return NextResponse.json({ error: "Failed to create epic" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Thiếu Epic ID" }, { status: 400 });
    }

    const updated = await prisma.epic.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.summary !== undefined && { summary: body.summary }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/epics error:", error);
    return NextResponse.json({ error: "Failed to update epic" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Thiếu Epic ID" }, { status: 400 });
    }

    // 1. Unlink issues from this epic safely (epicId = null)
    await prisma.issue.updateMany({
      where: { epicId: id },
      data: { epicId: null },
    });

    // 2. Delete the epic
    await prisma.epic.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedEpicId: id });
  } catch (error) {
    console.error("DELETE /api/epics error:", error);
    return NextResponse.json({ error: "Failed to delete epic" }, { status: 500 });
  }
}


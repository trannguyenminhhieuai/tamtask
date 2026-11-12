import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_PROJECT_STATUSES = [
  { key: "TODO", name: "Cần làm (To Do)", category: "TODO", color: "#6B778C", order: 0, maxWip: null },
  { key: "IN_PROGRESS", name: "Đang thực hiện (In Progress)", category: "IN_PROGRESS", color: "#EE0033", order: 1, maxWip: 4 },
  { key: "IN_REVIEW", name: "Kiểm thử QA / Review", category: "IN_PROGRESS", color: "#FFAB00", order: 2, maxWip: 3 },
  { key: "DONE", name: "Hoàn thành (Done)", category: "DONE", color: "#36B37E", order: 3, maxWip: null },
];

// GET /api/projects/[id]/statuses - Fetch project workflow statuses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    let statuses = await prisma.projectWorkflowStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    // If no statuses configured yet for this project, seed defaults
    if (statuses.length === 0) {
      await prisma.$transaction(
        DEFAULT_PROJECT_STATUSES.map((st) =>
          prisma.projectWorkflowStatus.create({
            data: {
              projectId,
              key: st.key,
              name: st.name,
              category: st.category,
              color: st.color,
              order: st.order,
              maxWip: st.maxWip,
            },
          })
        )
      );

      statuses = await prisma.projectWorkflowStatus.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
      });
    }

    // Map to client WorkflowStatus format
    const formatted = statuses.map((s) => ({
      id: s.key,
      key: s.key,
      name: s.name,
      category: s.category as any,
      color: s.color,
      order: s.order,
      maxWip: s.maxWip || undefined,
      projectId: s.projectId,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/projects/[id]/statuses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/projects/[id]/statuses - Save and persist entire workflow status set
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { statuses } = body;

    if (!Array.isArray(statuses) || statuses.length === 0) {
      return NextResponse.json({ error: "Statuses array is required" }, { status: 400 });
    }

    // Use transaction to replace / sync statuses cleanly
    await prisma.$transaction(async (tx) => {
      // 1. Delete old statuses
      await tx.projectWorkflowStatus.deleteMany({
        where: { projectId },
      });

      // 2. Insert new statuses in order
      for (let i = 0; i < statuses.length; i++) {
        const s = statuses[i];
        const statusKey = (s.key || s.id || `STATUS_${i}`).toUpperCase().trim().replace(/\s+/g, "_");
        await tx.projectWorkflowStatus.create({
          data: {
            projectId,
            key: statusKey,
            name: s.name || statusKey,
            category: s.category || "IN_PROGRESS",
            color: s.color || "#EE0033",
            order: i,
            maxWip: s.maxWip ? Number(s.maxWip) : null,
          },
        });
      }
    });

    const updated = await prisma.projectWorkflowStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    const formatted = updated.map((s) => ({
      id: s.key,
      key: s.key,
      name: s.name,
      category: s.category as any,
      color: s.color,
      order: s.order,
      maxWip: s.maxWip || undefined,
      projectId: s.projectId,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("PUT /api/projects/[id]/statuses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


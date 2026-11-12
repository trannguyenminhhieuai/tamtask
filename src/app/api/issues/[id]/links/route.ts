import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const links = await prisma.issueLink.findMany({
      where: {
        OR: [{ sourceId: params.id }, { targetId: params.id }],
      },
      include: {
        sourceIssue: {
          select: {
            id: true,
            key: true,
            title: true,
            status: true,
            priority: true,
            type: true,
          },
        },
        targetIssue: {
          select: {
            id: true,
            key: true,
            title: true,
            status: true,
            priority: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("GET /api/issues/[id]/links error:", error);
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { targetId, type = "RELATES_TO" } = body;

    if (!targetId) {
      return NextResponse.json({ error: "Target issue is required" }, { status: 400 });
    }

    if (params.id === targetId) {
      return NextResponse.json({ error: "Cannot link an issue to itself" }, { status: 400 });
    }

    // Verify both issues exist
    const [source, target] = await Promise.all([
      prisma.issue.findUnique({ where: { id: params.id } }),
      prisma.issue.findUnique({ where: { id: targetId } }),
    ]);

    if (!source || !target) {
      return NextResponse.json({ error: "One or both issues not found" }, { status: 404 });
    }

    // Upsert link
    const link = await prisma.issueLink.upsert({
      where: {
        sourceId_targetId_type: {
          sourceId: params.id,
          targetId,
          type,
        },
      },
      update: {},
      create: {
        sourceId: params.id,
        targetId,
        type,
      },
      include: {
        sourceIssue: {
          select: {
            id: true,
            key: true,
            title: true,
            status: true,
            priority: true,
            type: true,
          },
        },
        targetIssue: {
          select: {
            id: true,
            key: true,
            title: true,
            status: true,
            priority: true,
            type: true,
          },
        },
      },
    });

    // Record activity in changelog
    await prisma.issueActivity.create({
      data: {
        issueId: params.id,
        actorId: body.actorId || source.assigneeId || source.reporterId || "u1",
        fieldChanged: "ISSUE_LINK",
        oldValue: null,
        newValue: `${type}: ${target.key} - ${target.title}`,
      },
    }).catch(() => {});

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("POST /api/issues/[id]/links error:", error);
    return NextResponse.json({ error: "Failed to create issue link" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ error: "linkId parameter is required" }, { status: 400 });
    }

    await prisma.issueLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/issues/[id]/links error:", error);
    return NextResponse.json({ error: "Failed to delete issue link" }, { status: 500 });
  }
}


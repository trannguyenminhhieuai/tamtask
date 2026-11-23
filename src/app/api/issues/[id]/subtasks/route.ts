import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dispatchAutomationEvent } from "@/lib/automation-dispatcher";
import { invalidateBootstrapCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

// POST /api/issues/[id]/subtasks: Atomically create a new subtask
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role === "VIEWER") {
      return NextResponse.json(
        { error: "Tài khoản Khách (VIEWER) không có quyền tạo công việc phụ." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "Tiêu đề công việc phụ không được để trống." },
        { status: 400 }
      );
    }

    // Verify parent issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      select: { id: true, reporterId: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Không tìm thấy công việc cha." }, { status: 404 });
    }

    const newSubtask = await prisma.subtask.create({
      data: {
        title: body.title.trim(),
        description: body.description || "",
        isCompleted: Boolean(body.isCompleted),
        issueId: params.id,
      },
    });

    // Dispatch automation event for subtask creation
    await dispatchAutomationEvent("SUBTASK_TOGGLED", {
      issueId: params.id,
      actorId: (session?.user as any)?.id || issue.reporterId || "u1",
    }).catch(() => {});

    invalidateBootstrapCache();

    return NextResponse.json(newSubtask, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/issues/[id]/subtasks error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create subtask" },
      { status: 500 }
    );
  }
}

// PATCH /api/issues/[id]/subtasks: Atomically update title, description, or isCompleted
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role === "VIEWER") {
      return NextResponse.json(
        { error: "Tài khoản Khách (VIEWER) không có quyền chỉnh sửa công việc phụ." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description;
    if (body.isCompleted !== undefined) data.isCompleted = Boolean(body.isCompleted);

    const updated = await prisma.subtask.update({
      where: { id: body.subtaskId },
      data,
    });

    // If isCompleted changed, dispatch live automation check (e.g., auto-complete parent issue)
    if (body.isCompleted !== undefined) {
      await dispatchAutomationEvent("SUBTASK_TOGGLED", {
        issueId: params.id,
        actorId: (session?.user as any)?.id || "u1",
        newValue: String(body.isCompleted),
      }).catch(() => {});
    }

    invalidateBootstrapCache();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/issues/[id]/subtasks error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update subtask" },
      { status: 500 }
    );
  }
}

// DELETE /api/issues/[id]/subtasks?subtaskId=...: Atomically delete a subtask
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role === "VIEWER") {
      return NextResponse.json(
        { error: "Tài khoản Khách (VIEWER) không có quyền xóa công việc phụ." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subtaskId = searchParams.get("subtaskId");

    if (!subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    await prisma.subtask.delete({
      where: { id: subtaskId },
    });

    invalidateBootstrapCache();

    return NextResponse.json({ success: true, subtaskId });
  } catch (error: any) {
    console.error("DELETE /api/issues/[id]/subtasks error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete subtask" },
      { status: 500 }
    );
  }
}

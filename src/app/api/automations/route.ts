import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let rules = await prisma.automationRule.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Seed default rules if table is empty
    if (rules.length === 0) {
      const defaults = [
        {
          name: "Tự động hoàn thành Task cha khi tất cả Subtasks đã Done",
          trigger: "Khi tất cả Subtasks chuyển sang DONE",
          action: "Tự động chuyển Parent Issue sang trạng thái DONE",
          isActive: true,
          useMouse1: false,
          executionsCount: 14,
          lastExecuted: "2026-11-08 14:15",
        },
        {
          name: "Mouse-1 Smart Auto-Triage khi tạo Issue mới",
          trigger: "Khi một Task / Bug mới được tạo",
          action: "Gọi Mouse-1 Decision API (~100ms) để gán Assignee & Priority tối ưu",
          isActive: true,
          useMouse1: true,
          executionsCount: 38,
          lastExecuted: "2026-11-08 19:30",
        },
        {
          name: "Mouse-1 Smart Transition Gate",
          trigger: "Khi kéo task sang IN QA hoặc DONE",
          action: "Kiểm duyệt điều kiện subtasks và PR link trước khi cho phép chuyển",
          isActive: true,
          useMouse1: true,
          executionsCount: 22,
          lastExecuted: "2026-11-08 21:05",
        },
      ];

      for (const d of defaults) {
        await prisma.automationRule.create({ data: d });
      }

      rules = await prisma.automationRule.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(rules);
  } catch (error) {
    console.error("GET /api/automations error:", error);
    return NextResponse.json({ error: "Failed to fetch automation rules" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.trigger || !body.action) {
      return NextResponse.json({ error: "Name, trigger, and action are required" }, { status: 400 });
    }

    const created = await prisma.automationRule.create({
      data: {
        name: body.name,
        trigger: body.trigger,
        action: body.action,
        isActive: body.isActive !== undefined ? body.isActive : true,
        useMouse1: body.useMouse1 || false,
        executionsCount: 0,
        lastExecuted: new Date().toISOString().replace("T", " ").slice(0, 16),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/automations error:", error);
    return NextResponse.json({ error: "Failed to create automation rule" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    const updated = await prisma.automationRule.update({
      where: { id: body.id },
      data: {
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.name ? { name: body.name } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/automations error:", error);
    return NextResponse.json({ error: "Failed to update automation rule" }, { status: 500 });
  }
}

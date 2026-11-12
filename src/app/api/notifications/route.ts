import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Check count and seed realistic notifications if empty
    const count = await prisma.notification.count();
    if (count === 0) {
      const users = await prisma.user.findMany({ take: 2 });
      const targetUserId = users[0]?.id || "u1";

      await prisma.notification.createMany({
        data: [
          {
            userId: targetUserId,
            title: "Gán công việc mới",
            message: "Bạn đã được phân công thực hiện nhiệm vụ JIRA-102: Xây dựng Kanban Board kéo thả",
            link: "JIRA-102",
            type: "ASSIGN",
            isRead: false,
          },
          {
            userId: targetUserId,
            title: "Bình luận mới trong task",
            message: "Trần Minh Hiếu đã bình luận trong JIRA-101: 'Đã hoàn tất review API auth & permission'",
            link: "JIRA-101",
            type: "COMMENT",
            isRead: false,
          },
          {
            userId: targetUserId,
            title: "Cảnh báo tiến độ Sprint",
            message: "Sprint 1 dự kiến kết thúc trong 3 ngày tới. Vui lòng rà soát các task IN PROGRESS",
            type: "SYSTEM",
            isRead: true,
          },
          {
            userId: targetUserId,
            title: "Tự động hóa hoàn tất",
            message: "Hệ thống vừa tự động chuyển JIRA-108 sang DONE do toàn bộ subtasks đã hoàn thành",
            link: "JIRA-108",
            type: "STATUS",
            isRead: true,
          },
        ],
      });
    }

    const where: Record<string, unknown> = {};
    if (userId) {
      where.userId = userId;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // Map to include issueKey if stored in link
    const formatted = notifications.map((n) => ({
      ...n,
      issueKey: n.link?.startsWith("JIRA") ? n.link : undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, message, link, type } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link: link || null,
        type: type || "SYSTEM",
        isRead: false,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body.markAllAsRead) {
      const where: Record<string, unknown> = {};
      if (body.userId) where.userId = body.userId;

      await prisma.notification.updateMany({
        where,
        data: { isRead: true },
      });

      const updated = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      return NextResponse.json({ success: true, notifications: updated });
    }

    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });

      const updated = await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      return NextResponse.json({ success: true, notifications: updated });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

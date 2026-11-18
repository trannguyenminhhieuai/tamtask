import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");
    const queryProjectId = searchParams.get("projectId");

    // 1. Resolve requesting user identity
    let targetUserId = queryUserId || (session?.user as any)?.id;
    if (!targetUserId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        select: { id: true },
      });
      if (dbUser) targetUserId = dbUser.id;
    }

    // Security: Unauthenticated or unspecified user gets zero notifications (never leak global data)
    if (!targetUserId) {
      return NextResponse.json([]);
    }

    // 2. Fetch user's role and project memberships
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    // Fetch project memberships from ProjectMember table separately
    const memberRecords = await prisma.projectMember.findMany({
      where: { userId: targetUserId },
      select: { projectId: true },
    });
    const isGlobalAdmin = user.role === "ADMIN";
    let accessibleProjectIds: string[] = [];

    if (!isGlobalAdmin) {
      // Find all projects where this user is Lead or Member
      const leadProjects = await prisma.project.findMany({
        where: { leadId: targetUserId },
        select: { id: true },
      });
      const memberProjectIds = memberRecords.map((pm) => pm.projectId);
      const leadProjectIds = leadProjects.map((p) => p.id);
      accessibleProjectIds = Array.from(new Set([...memberProjectIds, ...leadProjectIds]));

      // If user does not belong to any project, they have zero project notifications
      if (accessibleProjectIds.length === 0) {
        return NextResponse.json([]);
      }
    }

    // 3. Query user-specific notifications strictly
    const notifications = await prisma.notification.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    if (notifications.length === 0) {
      return NextResponse.json([]);
    }

    // 4. Resolve issue projects to filter out notifications from projects the user is not in
    const issueKeys = notifications
      .map((n) => n.link)
      .filter((l): l is string => Boolean(l && l.includes("-")));

    const issues = issueKeys.length > 0
      ? await prisma.issue.findMany({
          where: { key: { in: issueKeys } },
          select: { key: true, projectId: true },
        })
      : [];

    const issueProjectMap = new Map<string, string | null>();
    issues.forEach((i) => issueProjectMap.set(i.key, i.projectId));

    const targetProjectSet = queryProjectId
      ? new Set([queryProjectId])
      : isGlobalAdmin
      ? null
      : new Set(accessibleProjectIds);

    const filtered = notifications.filter((n) => {
      // Non-issue notifications (system-wide) belong to this user
      if (!n.link || !n.link.includes("-")) {
        return true;
      }

      const projId = issueProjectMap.get(n.link);
      // If issue not found or has no project, keep only if no project filter is applied
      if (!projId) {
        return !queryProjectId;
      }

      // If project filter or membership set exists, verify membership
      if (targetProjectSet && !targetProjectSet.has(projId)) {
        return false;
      }

      return true;
    });

    const formatted = filtered.map((n) => ({
      ...n,
      issueKey: n.link || undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const sessionUserId = (session?.user as any)?.id;
    const actorUserId = body.userId || sessionUserId;

    if (body.markAllAsRead) {
      if (!actorUserId) {
        return NextResponse.json({ error: "userId is required to mark all as read" }, { status: 400 });
      }

      await prisma.notification.updateMany({
        where: { userId: actorUserId },
        data: { isRead: true },
      });

      const updated = await prisma.notification.findMany({
        where: { userId: actorUserId },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      return NextResponse.json({ success: true, notifications: updated });
    }

    if (body.id) {
      const whereClause: { id: string; userId?: string } = { id: body.id };
      if (actorUserId) whereClause.userId = actorUserId;

      await prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true },
      });

      const updated = await prisma.notification.findMany({
        where: actorUserId ? { userId: actorUserId } : undefined,
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

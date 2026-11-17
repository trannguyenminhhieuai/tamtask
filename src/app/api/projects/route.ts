import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabaseIfEmpty } from "@/lib/seed";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedDatabaseIfEmpty();
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
        },
        _count: {
          select: { issues: true, sprints: true, members: true },
        },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    if (!body.name || !body.key) {
      return NextResponse.json({ error: "Name and Key are required" }, { status: 400 });
    }

    const cleanKey = body.key.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Check if key already exists
    const existing = await prisma.project.findUnique({
      where: { key: cleanKey },
    });

    if (existing) {
      return NextResponse.json({ error: `Project key '${cleanKey}' đã tồn tại!` }, { status: 409 });
    }

    // Resolve creator from session if available
    let sessionUser = null;
    if (session?.user?.email) {
      sessionUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
    }

    // Resolve effective lead: priority to explicitly selected body.leadId, fallback to logged-in session user
    let effectiveLeadId: string | null = null;
    if (body.leadId) {
      const checkLead = await prisma.user.findUnique({ where: { id: body.leadId } });
      if (checkLead) effectiveLeadId = checkLead.id;
    }
    if (!effectiveLeadId && sessionUser) {
      effectiveLeadId = sessionUser.id;
    }

    // 1. Create Project
    const project = await prisma.project.create({
      data: {
        key: cleanKey,
        name: body.name.trim(),
        description: body.description || "",
        leadId: effectiveLeadId,
      },
    });

    // 2. Assign lead as PROJECT_LEAD member
    if (effectiveLeadId) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: effectiveLeadId,
          role: "PROJECT_LEAD",
        },
      }).catch(() => {});
    }

    // Also ensure creator is a member if different from lead
    if (sessionUser && sessionUser.id !== effectiveLeadId) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: sessionUser.id,
          role: "PROJECT_LEAD",
        },
      }).catch(() => {});
    }

    // 3. Auto-initialize default Epics with Viettel colors
    await prisma.epic.createMany({
      data: [
        {
          name: "Frontend & UI Experience",
          color: "#EE0033",
          summary: "Giao diện và trải nghiệm người dùng",
          projectId: project.id,
        },
        {
          name: "Backend Architecture & APIs",
          color: "#6554C0",
          summary: "Kiến trúc máy chủ và cơ sở dữ liệu",
          projectId: project.id,
        },
        {
          name: "Quality Assurance & Security",
          color: "#00875A",
          summary: "Kiểm thử tự động và bảo mật hệ thống",
          projectId: project.id,
        },
      ],
    });

    // 4. Auto-initialize default ProjectWorkflowStatus (6 chuẩn mặc định)
    await prisma.projectWorkflowStatus.createMany({
      data: [
        { projectId: project.id, key: "TODO", name: "To do", category: "TODO", color: "#6B778C", order: 0 },
        { projectId: project.id, key: "IN_PROGRESS", name: "In progress", category: "IN_PROGRESS", color: "#0052CC", order: 1, maxWip: 5 },
        { projectId: project.id, key: "IN_REVIEW", name: "In review", category: "IN_PROGRESS", color: "#8777D9", order: 2, maxWip: 4 },
        { projectId: project.id, key: "IN_QA", name: "In QA/QC", category: "IN_PROGRESS", color: "#FFAB00", order: 3, maxWip: 3 },
        { projectId: project.id, key: "DONE", name: "Done", category: "DONE", color: "#36B37E", order: 4 },
        { projectId: project.id, key: "RELEASED", name: "Released", category: "DONE", color: "#00875A", order: 5 },
      ],
    });

    // 5. Auto-initialize Sprint 1 for the new project
    await prisma.sprint.create({
      data: {
        name: `${cleanKey} Sprint 1`,
        goal: `Khởi động dự án ${project.name}`,
        status: "ACTIVE",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        totalPoints: 0,
        completedPoints: 0,
        projectId: project.id,
      },
    });

    // 6. Fetch complete created project with relations so frontend immediately receives full state
    const finalProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
        },
        _count: {
          select: { issues: true, sprints: true, members: true },
        },
      },
    });

    return NextResponse.json(finalProject || project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

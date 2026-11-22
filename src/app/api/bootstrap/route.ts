import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

// In-memory cache for static users and statuses to achieve sub-10ms response
let cachedUsers: any[] | null = null;
let lastUsersCacheTime = 0;
const USERS_CACHE_TTL_MS = 60 * 1000; // 60s

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  status: true,
  createdAt: true,
};

async function getBootstrapUsers() {
  const now = Date.now();
  if (cachedUsers && now - lastUsersCacheTime < USERS_CACHE_TTL_MS) {
    return cachedUsers;
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      ...safeUserSelect,
      _count: {
        select: { assignedIssues: true },
      },
    },
  });
  const mapped = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    activeTasksCount: u._count.assignedIssues,
  }));
  cachedUsers = mapped;
  lastUsersCacheTime = now;
  return mapped;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    await seedDatabaseIfEmpty();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Execute all queries concurrently on server
    const [projects, issues, users, epics, sprints, statuses] = await Promise.all([
      // 1. Projects
      prisma.project.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          lead: {
            select: safeUserSelect,
          },
          members: {
            include: {
              user: {
                select: safeUserSelect,
              },
            },
          },
          _count: {
            select: { issues: true, sprints: true, members: true },
          },
        },
      }),

      // 2. Issues (with lean relations and safe user select)
      prisma.issue.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: safeUserSelect },
          reporter: { select: safeUserSelect },
          epic: true,
          subtasks: true,
          attachments: {
            select: {
              id: true,
              name: true,
              size: true,
              type: true,
              createdAt: true,
            },
          },
          comments: {
            include: {
              author: { select: safeUserSelect },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      }),

      // 3. Users (cached in-memory)
      getBootstrapUsers(),

      // 4. Epics
      prisma.epic.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: { issues: true },
          },
        },
      }),

      // 5. Sprints
      prisma.sprint.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: { issues: true },
          },
        },
      }),

      // 6. Workflow statuses (if projectId provided)
      projectId
        ? prisma.projectWorkflowStatus.findMany({
            where: { projectId },
            orderBy: { order: "asc" },
          })
        : Promise.resolve([]),
    ]);

    const executionDuration = Date.now() - startTime;

    return NextResponse.json(
      {
        projects,
        issues,
        users,
        epics,
        sprints,
        statuses,
        meta: {
          serverDurationMs: executionDuration,
          timestamp: Date.now(),
        },
      },
      {
        headers: {
          "Server-Timing": `total;dur=${executionDuration}`,
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to bootstrap workspace data" },
      { status: 500 }
    );
  }
}

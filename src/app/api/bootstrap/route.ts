import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabaseIfEmpty } from "@/lib/seed";
import { getFromCache, setInCache, CacheKeys } from "@/lib/cache";

export const dynamic = "force-dynamic";

// In-memory cache for static users and statuses
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
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const cacheKey = projectId
      ? CacheKeys.bootstrapProject(projectId)
      : CacheKeys.BOOTSTRAP_GLOBAL;

    // 1. Check in-memory server cache for sub-5ms instant response
    const cachedResult = getFromCache<any>(cacheKey, 20000); // 20s TTL
    if (cachedResult) {
      const duration = Date.now() - startTime;
      return NextResponse.json(
        {
          ...cachedResult,
          meta: {
            serverDurationMs: duration,
            cached: true,
            timestamp: Date.now(),
          },
        },
        {
          headers: {
            "X-Cache": "HIT",
            "Server-Timing": `total;dur=${duration}`,
            "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
          },
        }
      );
    }

    await seedDatabaseIfEmpty();

    // 2. Execute queries concurrently with optimized lean projections
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

      // 2. Issues (Optimized: include subtasks for counters, assignee, reporter, epic. Exclude heavy comments & attachments which are lazy-loaded in drawer)
      prisma.issue.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          key: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          type: true,
          storyPoints: true,
          projectId: true,
          sprintId: true,
          createdAt: true,
          updatedAt: true,
          assignee: { select: safeUserSelect },
          reporter: { select: safeUserSelect },
          epic: { select: { id: true, name: true, color: true } },
          subtasks: {
            select: {
              id: true,
              title: true,
              isCompleted: true,
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

      // 6. Workflow statuses (if projectId provided, map id to status key so issues correctly align)
      projectId
        ? prisma.projectWorkflowStatus
            .findMany({
              where: { projectId },
              orderBy: { order: "asc" },
            })
            .then((stList) =>
              stList.map((s) => ({
                id: s.key,
                key: s.key,
                name: s.name,
                category: s.category as any,
                color: s.color,
                order: s.order,
                maxWip: s.maxWip || undefined,
                projectId: s.projectId,
              }))
            )
        : Promise.resolve([]),
    ]);

    const result = {
      projects,
      issues,
      users,
      epics,
      sprints,
      statuses,
    };

    // Cache the assembled payload
    setInCache(cacheKey, result);

    const executionDuration = Date.now() - startTime;

    return NextResponse.json(
      {
        ...result,
        meta: {
          serverDurationMs: executionDuration,
          cached: false,
          timestamp: Date.now(),
        },
      },
      {
        headers: {
          "X-Cache": "MISS",
          "Server-Timing": `total;dur=${executionDuration}`,
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
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

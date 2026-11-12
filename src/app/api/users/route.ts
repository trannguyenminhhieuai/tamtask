import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { assignedIssues: true },
        },
      },
    });

    const mapped = users.map((u) => ({
      ...u,
      activeTasksCount: u._count.assignedIssues,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPassword = body.password || "TamTask@2026!";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase().trim(),
        role: body.role || "DEVELOPER",
        password: hashedPassword,
        isTwoFactorEnabled: body.isTwoFactorEnabled !== undefined ? body.isTwoFactorEnabled : true,
        avatar:
          body.avatar ||
          `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create/invite user" }, { status: 500 });
  }
}


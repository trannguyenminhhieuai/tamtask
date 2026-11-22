import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// In-memory cache for high-throughput zero-latency reads
let cachedUsers: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

function invalidateUsersCache() {
  cachedUsers = null;
  lastCacheTime = 0;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedUsers && now - lastCacheTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedUsers, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
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
    lastCacheTime = now;

    return NextResponse.json(mapped, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Họ và tên nhân sự không được để trống." },
        { status: 400 }
      );
    }

    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { error: "Địa chỉ email không được để trống." },
        { status: 400 }
      );
    }

    const email = body.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Địa chỉ email "${email}" đã được đăng ký trong hệ thống. Vui lòng nhập email khác.` },
        { status: 409 }
      );
    }

    const rawPassword = body.password || "TamTask@2026!";
    if (rawPassword.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu khởi tạo phải chứa ít nhất 6 ký tự." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email,
        role: body.role || "DEVELOPER",
        password: hashedPassword,
        isTwoFactorEnabled: body.isTwoFactorEnabled !== undefined ? body.isTwoFactorEnabled : true,
        avatar:
          body.avatar ||
          `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
      },
    });
    invalidateUsersCache();
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: error?.message || "Không thể khởi tạo nhân sự mới do lỗi hệ thống. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Quick DB ping check
    const userCount = await prisma.user.count();

    return NextResponse.json(
      {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: "connected",
        totalUsers: userCount,
        version: "1.0.0",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err.message || "Database connection error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}


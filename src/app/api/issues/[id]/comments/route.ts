import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: { issueId: params.id },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, authorId, authorName, authorEmail, authorAvatar } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Ensure user exists in database to satisfy foreign key constraint
    let user = null;
    if (authorId) {
      user = await prisma.user.findUnique({ where: { id: authorId } });
    }
    if (!user && authorEmail) {
      user = await prisma.user.findUnique({ where: { email: authorEmail } });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: authorId || `u-${Date.now()}`,
          name: authorName || "Thành viên",
          email: authorEmail || `user_${Date.now()}@company.com`,
          avatar:
            authorAvatar ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          role: "DEVELOPER",
        },
      });
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        issueId: params.id,
      },
      include: { author: true },
    });

    return NextResponse.json({
      id: newComment.id,
      content: newComment.content,
      author: newComment.author,
      createdAt: newComment.createdAt.toLocaleString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

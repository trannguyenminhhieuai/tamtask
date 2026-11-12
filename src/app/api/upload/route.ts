import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ATTT SEC-3: Danh sách các đuôi file nguy hiểm bị cấm tuyệt đối
const FORBIDDEN_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".php", ".py", ".pl", ".cgi",
  ".js", ".mjs", ".jsx", ".ts", ".tsx", ".vbs", ".jar", ".html",
  ".htm", ".xhtml", ".svg", ".dll", ".so", ".dylib", ".asp", ".aspx"
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Yêu cầu đăng nhập để thực hiện tải lên tệp đính kèm." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const issueId = formData.get("issueId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy tệp đính kèm." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Kích thước tệp vượt quá giới hạn an toàn cho phép (tối đa 25MB)." },
        { status: 400 }
      );
    }

    const ext = (path.extname(file.name) || "").toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Định dạng tệp ${ext} bị chặn vì lý do an toàn thông tin (chống mã độc thực thi).` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate safe unique filename
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${cleanBase}_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/${uniqueName}`;

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    let savedAttachmentId = `att-${Date.now()}`;

    // If an issueId was passed, persist in database
    if (issueId) {
      try {
        const record = await prisma.attachment.create({
          data: {
            name: file.name,
            size: formatSize(file.size),
            type: file.type || "application/octet-stream",
            url: fileUrl,
            issueId,
          },
        });
        savedAttachmentId = record.id;
      } catch (err) {
        console.warn("Could not attach to issue in DB:", err);
      }
    }

    return NextResponse.json({
      id: savedAttachmentId,
      name: file.name,
      size: formatSize(file.size),
      type: file.type || "application/octet-stream",
      url: fileUrl,
      uploadedAt: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}


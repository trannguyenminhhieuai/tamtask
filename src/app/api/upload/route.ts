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

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB an toàn cho database & serverless

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const issueId = formData.get("issueId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy tệp đính kèm." }, { status: 400 });
    }

    if (!session?.user && !issueId) {
      return NextResponse.json(
        { error: "Yêu cầu đăng nhập để thực hiện tải lên tệp đính kèm." },
        { status: 401 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Kích thước tệp vượt quá giới hạn an toàn cho phép (tối đa 15MB)." },
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
    const mimeType = file.type || "application/octet-stream";

    let fileUrl = "";

    // 1. Thử lưu vào local public/uploads (Môi trường local development)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const uniqueName = `${cleanBase}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${uniqueName}`;
    } catch (fsError) {
      // 2. Fallback cho môi trường Serverless Vercel (Read-only filesystem)
      // Lưu trữ trực tiếp dưới dạng Base64 Data URI vào database Supabase PostgreSQL
      console.log("[Upload] Vercel serverless environment detected. Storing as Data URI.");
      fileUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    let savedAttachmentId = `att-${Date.now()}`;

    // 3. Lưu bản ghi Attachment vào Database nếu có issueId
    if (issueId) {
      try {
        const record = await prisma.attachment.create({
          data: {
            name: file.name,
            size: formatSize(file.size),
            type: mimeType,
            url: fileUrl,
            issueId,
          },
        });
        savedAttachmentId = record.id;
      } catch (err: any) {
        console.error("Could not attach to issue in DB:", err);
      }
    }

    return NextResponse.json({
      id: savedAttachmentId,
      name: file.name,
      size: formatSize(file.size),
      type: mimeType,
      url: fileUrl,
      uploadedAt: new Date().toISOString().split("T")[0],
    });
  } catch (error: any) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: error?.message || "Lỗi xử lý tệp tải lên" }, { status: 500 });
  }
}

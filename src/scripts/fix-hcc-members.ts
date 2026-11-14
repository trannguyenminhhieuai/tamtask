import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== BẮT ĐẦU CHUẨN HÓA THÀNH VIÊN VÀ TASK DỰ ÁN HÀNH CHÍNH CÔNG (HCC) ===");

  const hcc = await prisma.project.findFirst({
    where: { key: "HCC" },
  });

  if (!hcc) {
    console.error("Không tìm thấy dự án HCC!");
    return;
  }

  const validMemberIds = [
    "1db2cf1e-1224-4c21-a1fb-d89c6f0e2349", // Hieu Tran (Lead)
    "9df7c5b8-17a5-4f7b-b9cf-e7fc3fa2a084", // Hiếu Trần (Dev)
    "e65572ff-689d-4082-8c2b-9e74f2012219", // Annabelle Dam (Lead)
  ];

  // 1. Cập nhật leadId của HCC về Hieu Tran
  await prisma.project.update({
    where: { id: hcc.id },
    data: { leadId: "1db2cf1e-1224-4c21-a1fb-d89c6f0e2349" },
  });
  console.log("-> Đã cập nhật leadId của HCC thành: Hieu Tran");

  // 2. Xóa các thành viên không thuộc danh sách 3 người này
  const deleted = await prisma.projectMember.deleteMany({
    where: {
      projectId: hcc.id,
      userId: { notIn: validMemberIds },
    },
  });
  console.log(`-> Đã gỡ bỏ ${deleted.count} thành viên dư thừa khỏi dự án HCC.`);

  // 3. Đảm bảo 3 thành viên này có trong ProjectMember
  const membersToEnsure = [
    { userId: "1db2cf1e-1224-4c21-a1fb-d89c6f0e2349", role: "PROJECT_LEAD" as const },
    { userId: "9df7c5b8-17a5-4f7b-b9cf-e7fc3fa2a084", role: "DEVELOPER" as const },
    { userId: "e65572ff-689d-4082-8c2b-9e74f2012219", role: "PROJECT_LEAD" as const },
  ];

  for (const m of membersToEnsure) {
    const existing = await prisma.projectMember.findFirst({
      where: { projectId: hcc.id, userId: m.userId },
    });
    if (!existing) {
      await prisma.projectMember.create({
        data: {
          projectId: hcc.id,
          userId: m.userId,
          role: m.role,
        },
      });
      console.log(`-> Đã bổ sung thành viên: ${m.userId} (${m.role})`);
    } else if (existing.role !== m.role) {
      await prisma.projectMember.update({
        where: { id: existing.id },
        data: { role: m.role },
      });
    }
  }

  // 4. Cập nhật các task của HCC có assignee không thuộc 3 người này về null (Chưa ai nhận)
  const updatedTasks = await prisma.issue.updateMany({
    where: {
      projectId: hcc.id,
      assigneeId: { notIn: validMemberIds },
    },
    data: {
      assigneeId: null,
    },
  });
  console.log(`-> Đã gỡ phân công của ${updatedTasks.count} task có người nhận ngoài 3 thành viên.`);

  // 5. Kiểm tra lại kết quả
  const verifyProject = await prisma.project.findUnique({
    where: { id: hcc.id },
    include: {
      lead: true,
      members: { include: { user: true } },
    },
  });

  console.log("\n=== KẾT QUẢ SAU CHUẨN HÓA ===");
  console.log(`Dự án: [${verifyProject?.key}] ${verifyProject?.name}`);
  console.log(`Trưởng dự án (Lead): ${verifyProject?.lead?.name} (${verifyProject?.lead?.email})`);
  console.log(`Danh sách thành viên (${verifyProject?.members.length}):`);
  verifyProject?.members.forEach((m) =>
    console.log(` - [${m.role}] ${m.user.name} (${m.user.email})`)
  );
}

main()
  .catch((e) => {
    console.error("Lỗi khi chuẩn hóa:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });


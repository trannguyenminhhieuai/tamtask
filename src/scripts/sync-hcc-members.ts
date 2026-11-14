import { prisma } from "../lib/prisma";

async function main() {
  const project = await prisma.project.findFirst({
    where: { key: "HCC" },
  });
  if (!project) return;

  const memberEmails = [
    { email: "trannguyenminhhieu.ind@gmail.com", role: "PROJECT_LEAD" },
    { email: "hieu.tran@company.com", role: "PROJECT_LEAD" },
    { email: "an.nguyen@company.com", role: "DEVELOPER" },
    { email: "nam.le@company.com", role: "DEVELOPER" },
    { email: "mai.pham@company.com", role: "QA" },
    { email: "ha.nguyen@company.com", role: "PROJECT_LEAD" },
    { email: "hieutnm3@gmail.com", role: "DEVELOPER" },
  ];

  for (const item of memberEmails) {
    const user = await prisma.user.findUnique({ where: { email: item.email } });
    if (user) {
      const exists = await prisma.projectMember.findFirst({
        where: { projectId: project.id, userId: user.id },
      });
      if (!exists) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
            role: item.role as any,
          },
        });
        console.log(`+ Đã thêm thành viên ${user.name} (${user.email}) vào dự án HCC`);
      } else {
        console.log(`= Đã là thành viên: ${user.name} (${user.email})`);
      }
    }
  }

  const updated = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      lead: true,
      members: { include: { user: true } },
    },
  });
  console.log(`Tổng số thành viên dự án HCC hiện tại: ${updated?.members?.length}`);
  console.table(
    updated?.members?.map((m) => ({
      userId: m.userId,
      name: m.user?.name,
      email: m.user?.email,
      role: m.role,
    }))
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });


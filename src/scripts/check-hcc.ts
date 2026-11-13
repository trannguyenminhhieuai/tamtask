import { prisma } from "../lib/prisma";

async function main() {
  const p = await prisma.project.findFirst({
    where: { key: "HCC" },
    include: { statuses: true },
  });
  console.log("HCC Project statuses count:", p?.statuses?.length);
  console.log("HCC Project statuses:", p?.statuses);

  const issues = await prisma.issue.findMany({
    where: { projectId: p?.id },
    select: { id: true, key: true, status: true },
  });
  const statusCounts: Record<string, number> = {};
  issues.forEach((i) => {
    statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
  });
  console.log("HCC Issue status distribution:", statusCounts);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });


import { prisma } from "../lib/prisma";

async function main() {
  const p = await prisma.project.findFirst({ where: { key: "HCC" } });
  if (!p) return;
  const issues = await prisma.issue.findMany({
    where: { projectId: p.id },
    include: { assignee: true },
  });
  const validIds = [
    "1db2cf1e-1224-4c21-a1fb-d89c6f0e2349", // Hieu Tran
    "9df7c5b8-17a5-4f7b-b9cf-e7fc3fa2a084", // Hiếu Trần
    "e65572ff-689d-4082-8c2b-9e74f2012219", // Annabelle Dam
  ];
  const invalid = issues.filter(
    (i) => i.assigneeId && !validIds.includes(i.assigneeId)
  );
  console.log("Total HCC issues:", issues.length);
  console.log("Issues with assignees not in the 3 members:", invalid.length);
  invalid.forEach((i) =>
    console.log(" -", i.key, i.title.slice(0, 30), "Assignee:", i.assignee?.name)
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

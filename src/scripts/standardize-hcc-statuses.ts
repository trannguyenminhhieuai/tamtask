import { prisma } from "../lib/prisma";

async function main() {
  const project = await prisma.project.findFirst({
    where: { key: "HCC" },
    include: { statuses: true },
  });

  if (!project) {
    console.error("Project HCC not found!");
    return;
  }

  console.log(`Found Project ${project.name} (ID: ${project.id}) with ${project.statuses.length} existing statuses.`);

  // Default 6 statuses from POST /api/projects
  const defaultStatuses = [
    { key: "TODO", name: "To do", category: "TODO", color: "#6B778C", order: 0, maxWip: null },
    { key: "IN_PROGRESS", name: "In progress", category: "IN_PROGRESS", color: "#0052CC", order: 1, maxWip: 5 },
    { key: "IN_REVIEW", name: "In review", category: "IN_PROGRESS", color: "#8777D9", order: 2, maxWip: 4 },
    { key: "IN_QA", name: "In QA/QC", category: "IN_PROGRESS", color: "#FFAB00", order: 3, maxWip: 3 },
    { key: "DONE", name: "Done", category: "DONE", color: "#36B37E", order: 4, maxWip: null },
    { key: "RELEASED", name: "Released", category: "DONE", color: "#00875A", order: 5, maxWip: null },
  ];

  // Delete existing project statuses
  await prisma.projectWorkflowStatus.deleteMany({
    where: { projectId: project.id },
  });

  // Create the standard 6 statuses
  for (const st of defaultStatuses) {
    await prisma.projectWorkflowStatus.create({
      data: {
        projectId: project.id,
        key: st.key,
        name: st.name,
        category: st.category as "TODO" | "IN_PROGRESS" | "DONE",
        color: st.color,
        order: st.order,
        maxWip: st.maxWip,
      },
    });
  }

  // Verify
  const updatedStatuses = await prisma.projectWorkflowStatus.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
  });
  console.log("Successfully standardized HCC statuses to 6 default workflow rules:");
  console.table(
    updatedStatuses.map((s) => ({
      key: s.key,
      name: s.name,
      category: s.category,
      color: s.color,
      order: s.order,
      maxWip: s.maxWip,
    }))
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });


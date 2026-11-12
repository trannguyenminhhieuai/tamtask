import { prisma } from "@/lib/prisma";
import { mouse1 } from "@/lib/mouse1";

export type AutomationEventType =
  | "ISSUE_CREATED"
  | "ISSUE_UPDATED"
  | "SUBTASK_TOGGLED";

export interface AutomationEventPayload {
  issueId: string;
  actorId?: string;
  fieldChanged?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export interface AutomationExecutionResult {
  ruleId: string;
  ruleName: string;
  executed: boolean;
  actionTaken: string;
}

/**
 * Live Automation Dispatcher:
 * Executes active automation rules when issues or subtasks change.
 */
export async function dispatchAutomationEvent(
  eventType: AutomationEventType,
  payload: AutomationEventPayload
): Promise<AutomationExecutionResult[]> {
  const results: AutomationExecutionResult[] = [];

  try {
    // 1. Fetch all active automation rules
    const activeRules = await prisma.automationRule.findMany({
      where: { isActive: true },
    });

    if (activeRules.length === 0) return results;

    // 2. Fetch the current issue with relations
    const issue = await prisma.issue.findUnique({
      where: { id: payload.issueId },
      include: {
        subtasks: true,
        sprint: true,
        assignee: true,
        epic: true,
      },
    });

    if (!issue) return results;

    const actorId = payload.actorId || issue.reporterId || "u1";
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);

    // Rule 1: Auto-complete Parent Issue when all Subtasks are Done
    const autoCompleteRule = activeRules.find(
      (r) =>
        r.name.toLowerCase().includes("hoàn thành task cha") ||
        r.action.toLowerCase().includes("parent issue sang trạng thái done") ||
        r.trigger.toLowerCase().includes("subtasks")
    );

    if (
      autoCompleteRule &&
      issue.subtasks.length > 0 &&
      issue.subtasks.every((s) => s.isCompleted) &&
      issue.status !== "DONE"
    ) {
      const oldStatus = issue.status;
      // Update issue status to DONE
      await prisma.issue.update({
        where: { id: issue.id },
        data: { status: "DONE" },
      });

      // Record activity changelog
      await prisma.issueActivity.create({
        data: {
          issueId: issue.id,
          actorId,
          fieldChanged: "STATUS",
          oldValue: oldStatus,
          newValue: "DONE (Tự động hoàn thành bởi Automation Rule)",
        },
      });

      // Update rule execution counters
      await prisma.automationRule.update({
        where: { id: autoCompleteRule.id },
        data: {
          executionsCount: { increment: 1 },
          lastExecuted: nowStr,
        },
      });

      results.push({
        ruleId: autoCompleteRule.id,
        ruleName: autoCompleteRule.name,
        executed: true,
        actionTaken: `Tự động chuyển Issue ${issue.key} từ ${oldStatus} sang DONE vì tất cả subtasks đã hoàn tất.`,
      });
    }

    // Rule 2: Auto-recalculate Sprint Completed Story Points when Issue status is DONE
    if (payload.newValue === "DONE" || issue.status === "DONE") {
      if (issue.sprintId) {
        // Calculate sum of completed points in sprint
        const sprintIssues = await prisma.issue.findMany({
          where: { sprintId: issue.sprintId, status: "DONE" },
          select: { storyPoints: true },
        });

        const completedPoints = sprintIssues.reduce(
          (sum, i) => sum + (i.storyPoints || 0),
          0
        );

        await prisma.sprint.update({
          where: { id: issue.sprintId },
          data: { completedPoints },
        });

        results.push({
          ruleId: "sprint-sync",
          ruleName: "Đồng bộ điểm hoàn thành của Sprint",
          executed: true,
          actionTaken: `Đã cập nhật completedPoints của Sprint thành ${completedPoints} pts.`,
        });
      }
    }

    // Rule 3: Mouse-1 Smart Auto-Triage on Issue Created
    const autoTriageRule = activeRules.find(
      (r) =>
        r.useMouse1 &&
        (r.name.toLowerCase().includes("triage") ||
          r.trigger.toLowerCase().includes("issue mới"))
    );

    if (eventType === "ISSUE_CREATED" && autoTriageRule) {
      if (!issue.assigneeId || issue.priority === "MEDIUM") {
        const users = await prisma.user.findMany({
          where: { status: "ACTIVE" },
        });
        const epics = issue.projectId
          ? await prisma.epic.findMany({ where: { projectId: issue.projectId } })
          : [];

        const triageResult = await mouse1.predictTriage({
          title: issue.title,
          description: issue.description,
          issueType: (issue.type as any) || "TASK",
          availableAssignees: users.map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            currentLoad: u.activeTasksCount,
          })),
          availableEpics: epics.map((e) => ({
            id: e.id,
            name: e.name,
            color: e.color,
          })),
        });

        const updates: Record<string, unknown> = {};
        if (!issue.assigneeId && triageResult.decision.recommendedAssigneeId) {
          updates.assigneeId = triageResult.decision.recommendedAssigneeId;
        }
        if (issue.priority === "MEDIUM" && triageResult.decision.recommendedPriority) {
          updates.priority = triageResult.decision.recommendedPriority;
        }
        if (!issue.epicId && triageResult.decision.recommendedEpicId) {
          updates.epicId = triageResult.decision.recommendedEpicId;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.issue.update({
            where: { id: issue.id },
            data: updates,
          });

          await prisma.automationRule.update({
            where: { id: autoTriageRule.id },
            data: {
              executionsCount: { increment: 1 },
              lastExecuted: nowStr,
            },
          });

          results.push({
            ruleId: autoTriageRule.id,
            ruleName: autoTriageRule.name,
            executed: true,
            actionTaken: `Mouse-1 Auto-triage: ${triageResult.decision.reasoning}`,
          });
        }
      }
    }
  } catch (err) {
    console.error("[Automation Dispatcher] Error executing automation rules:", err);
  }

  return results;
}


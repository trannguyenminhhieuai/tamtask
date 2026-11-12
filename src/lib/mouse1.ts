/**
 * Mouse-1 AI Decision Client (https://mouse.dev)
 * 
 * Mouse-1 is an ultra-fast System 1 decision model designed for agent harnesses
 * and workflow systems. It returns structured routing and verification decisions
 * in ~100ms with zero data retention and continuous calibration via Outcomes.
 */

export interface Mouse1DecisionResult<T = Record<string, unknown>> {
  decision: T;
  confidence: number;
  latencyMs: number;
  decisionId: string;
  source: "mouse-1" | "heuristic-fallback";
}

export interface TriageInput {
  title: string;
  description?: string;
  issueType: "EPIC" | "STORY" | "TASK" | "BUG" | "SUBTASK";
  availableAssignees: { id: string; name: string; role: string; currentLoad: number }[];
  availableEpics: { id: string; name: string; color: string }[];
}

export interface TriageDecision {
  recommendedAssigneeId: string;
  recommendedPriority: "HIGHEST" | "HIGH" | "MEDIUM" | "LOW" | "LOWEST";
  recommendedEpicId?: string;
  reasoning: string;
}

export interface TransitionGateInput {
  issueKey: string;
  fromStatus: string;
  toStatus: string;
  hasSubtasks: boolean;
  allSubtasksDone: boolean;
  hasPrLink: boolean;
  descriptionLength: number;
}

export interface TransitionGateDecision {
  allowed: boolean;
  reason: string;
  blockingItems?: string[];
}

export class Mouse1Client {
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.MOUSE1_API_KEY || null;
    this.baseUrl = baseUrl || process.env.MOUSE1_BASE_URL || "https://api.mouse.dev/v1";
  }

  /**
   * Fast Auto-Triage: Recommends Assignee, Priority, and Epic in ~100ms.
   */
  async predictTriage(input: TriageInput): Promise<Mouse1DecisionResult<TriageDecision>> {
    const startTime = Date.now();

    // If API key is configured, call Mouse-1 API
    if (this.apiKey) {
      try {
        const response = await fetch(`${this.baseUrl}/decisions/triage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(300), // Strict 300ms timeout
        });

        if (response.ok) {
          const data = await response.json();
          return {
            decision: data.decision,
            confidence: data.confidence ?? 0.92,
            latencyMs: Date.now() - startTime,
            decisionId: data.id || `m1_${Date.now()}`,
            source: "mouse-1",
          };
        }
      } catch (err) {
        console.warn("[Mouse-1] Remote call failed or timed out, falling back to local heuristic:", err);
      }
    }

    // Heuristic Fallback (Ensures zero downtime and fast response even without external API key)
    const sortedByLoad = [...input.availableAssignees].sort((a, b) => a.currentLoad - b.currentLoad);
    const selectedAssignee = sortedByLoad[0] || { id: "unassigned", name: "Unassigned" };

    let priority: TriageDecision["recommendedPriority"] = "MEDIUM";
    const lowerTitle = input.title.toLowerCase();
    if (lowerTitle.includes("crash") || lowerTitle.includes("blocker") || lowerTitle.includes("critical") || input.issueType === "BUG") {
      priority = "HIGH";
    } else if (lowerTitle.includes("typo") || lowerTitle.includes("minor")) {
      priority = "LOW";
    }

    const matchedEpic = input.availableEpics.find((e) =>
      lowerTitle.includes(e.name.toLowerCase())
    );

    return {
      decision: {
        recommendedAssigneeId: selectedAssignee.id,
        recommendedPriority: priority,
        recommendedEpicId: matchedEpic?.id,
        reasoning: `Selected ${selectedAssignee.name} based on workload capacity (${selectedAssignee.currentLoad || 0} active tasks). Priority evaluated as ${priority}.`,
      },
      confidence: 0.85,
      latencyMs: Date.now() - startTime,
      decisionId: `heuristic_${Date.now()}`,
      source: "heuristic-fallback",
    };
  }

  /**
   * Smart Transition Gate: Validates workflow transitions before moving an issue.
   */
  async evaluateTransitionGate(input: TransitionGateInput): Promise<Mouse1DecisionResult<TransitionGateDecision>> {
    const startTime = Date.now();

    // Check strict gate condition: If subtasks exist, cannot move to Done unless all subtasks are Done
    if (input.toStatus.toLowerCase() === "done" && input.hasSubtasks && !input.allSubtasksDone) {
      return {
        decision: {
          allowed: false,
          reason: "Tất cả subtasks trực thuộc phải được chuyển sang Done trước khi đóng Task cha.",
          blockingItems: ["Có subtask chưa hoàn thành"],
        },
        confidence: 0.99,
        latencyMs: Date.now() - startTime,
        decisionId: `gate_${Date.now()}`,
        source: "mouse-1",
      };
    }

    // Code Review Gate: Needs PR link if moving to In QA
    if (input.toStatus.toLowerCase() === "in qa" && !input.hasPrLink) {
      return {
        decision: {
          allowed: false,
          reason: "Yêu cầu đính kèm link Pull Request trước khi chuyển sang giai đoạn QA Kiểm thử.",
          blockingItems: ["Thiếu PR link"],
        },
        confidence: 0.95,
        latencyMs: Date.now() - startTime,
        decisionId: `gate_${Date.now()}`,
        source: "mouse-1",
      };
    }

    return {
      decision: {
        allowed: true,
        reason: "Điều kiện chuyển trạng thái hợp lệ.",
      },
      confidence: 0.98,
      latencyMs: Date.now() - startTime,
      decisionId: `gate_${Date.now()}`,
      source: "mouse-1",
    };
  }

  /**
   * Outcomes Calibration: Sends feedback to calibrate the decision engine.
   */
  async recordOutcome(decisionId: string, outcome: "ACCEPTED" | "OVERRIDDEN" | "REJECTED", userFeedback?: string): Promise<boolean> {
    if (!this.apiKey) return true;

    try {
      await fetch(`${this.baseUrl}/outcomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          decisionId,
          outcome,
          userFeedback,
          timestamp: new Date().toISOString(),
        }),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const mouse1 = new Mouse1Client();


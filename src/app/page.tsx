"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/jira/Navbar";
import { Sidebar, NavView } from "@/components/jira/Sidebar";
import { KanbanBoard } from "@/components/jira/KanbanBoard";
import { BacklogView } from "@/components/jira/BacklogView";
import { DashboardView } from "@/components/jira/DashboardView";
import { TimelineView } from "@/components/jira/TimelineView";
import { AutomationView } from "@/components/jira/AutomationView";
import { AdminView } from "@/components/jira/AdminView";
import { IssueDetailDrawer } from "@/components/jira/IssueDetailDrawer";
import { CreateIssueModal } from "@/components/jira/CreateIssueModal";
import { CreateProjectModal } from "@/components/jira/CreateProjectModal";
import { WorkflowSettingsModal } from "@/components/jira/WorkflowSettingsModal";
import { AuthLandingScreen } from "@/components/jira/AuthLandingScreen";
import { PendingApprovalScreen } from "@/components/jira/PendingApprovalScreen";
import { ProjectMembersModal } from "@/components/jira/ProjectMembersModal";
import { EpicSettingsModal } from "@/components/jira/EpicSettingsModal";
import { ToastProvider, notify } from "@/components/jira/Toast";
import { CommandPalette } from "@/components/jira/CommandPalette";
import { ShortcutsModal } from "@/components/jira/ShortcutsModal";
import {
  MOCK_USERS,
  CURRENT_USER,
  MOCK_EPICS,
  MOCK_SPRINTS,
  MOCK_ISSUES,
  DEFAULT_STATUSES,
} from "@/lib/mock-data";
import {
  Issue,
  IssueStatus,
  FilterState,
  User,
  Epic,
  Sprint,
  WorkflowStatus,
  Project,
} from "@/types/jira";
import { Layers } from "lucide-react";

export default function JiraApp() {
  const { data: session, status: authStatus } = useSession();

  const [currentView, setCurrentView] = useState<NavView>("BOARD");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [epics, setEpics] = useState<Epic[]>(MOCK_EPICS);
  const [sprints, setSprints] = useState<Sprint[]>(MOCK_SPRINTS);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>(DEFAULT_STATUSES);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modals & Drawers State
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isProjectMembersModalOpen, setIsProjectMembersModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isEpicSettingsOpen, setIsEpicSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<IssueStatus>("TODO");

  // Filtering State
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: "",
    assigneeIds: [],
    epicIds: [],
    priorities: [],
    sprintId: "",
    onlyMyIssues: false,
  });

  // Current User with active role and status derived from session
  const currentUser: User = useMemo(() => {
    if (session?.user) {
      return {
        id: (session.user as any).id || "u-active",
        name: session.user.name || "Member",
        email: session.user.email || "user@company.com",
        avatar:
          session.user.image ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        role: (session.user as any).role || "DEVELOPER",
        status: (session.user as any).status || "ACTIVE",
        activeTasksCount: 0,
      };
    }
    return CURRENT_USER;
  }, [session]);

  // Load project workflow statuses from DB whenever currentProject changes
  useEffect(() => {
    if (currentProject?.id) {
      fetch(`/api/projects/${currentProject.id}/statuses`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setStatuses(data);
          }
        })
        .catch((err) => console.warn("Failed to load project statuses from DB:", err));
    }
  }, [currentProject?.id]);

  // Fetch live persistent data from backend API
  const loadData = useCallback(async () => {
    try {
      const [projectsRes, issuesRes, usersRes, epicsRes, sprintsRes] =
        await Promise.all([
          fetch("/api/projects"),
          fetch("/api/issues"),
          fetch("/api/users"),
          fetch("/api/epics"),
          fetch("/api/sprints"),
        ]);

      if (projectsRes.ok) {
        const projectsData: Project[] = await projectsRes.json();
        if (Array.isArray(projectsData) && projectsData.length > 0) {
          setProjects(projectsData);
          setCurrentProject((prev) => {
            const accessible =
              currentUser.role === "ADMIN"
                ? projectsData
                : projectsData.filter((p) => {
                    const isLead =
                      p.leadId === currentUser.id ||
                      p.lead?.id === currentUser.id;
                    const isMember =
                      Array.isArray(p.members) &&
                      p.members.some(
                        (m) =>
                          m.userId === currentUser.id ||
                          m.user?.id === currentUser.id
                      );
                    return isLead || isMember;
                  });

            const candidateList =
              accessible.length > 0 ? accessible : projectsData;

            if (prev) {
              const matched = candidateList.find((p) => p.id === prev.id);
              if (matched) return matched;
            }
            // Load last accessed project from localStorage
            if (typeof window !== "undefined") {
              try {
                const lastId = localStorage.getItem("tamtask_last_project_id");
                if (lastId) {
                  const matchedLast = candidateList.find(
                    (p) => p.id === lastId || p.key === lastId
                  );
                  if (matchedLast) return matchedLast;
                }
              } catch {}
            }
            return candidateList[0];
          });
        }
      }

      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        if (Array.isArray(issuesData) && issuesData.length > 0) {
          setIssues(issuesData);
        }
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData) && usersData.length > 0) {
          setUsers(usersData);
        }
      }

      if (epicsRes.ok) {
        const epicsData = await epicsRes.json();
        if (Array.isArray(epicsData) && epicsData.length > 0) {
          setEpics(epicsData);
        }
      }

      if (sprintsRes.ok) {
        const sprintsData: Sprint[] = await sprintsRes.json();
        if (Array.isArray(sprintsData) && sprintsData.length > 0) {
          setSprints(sprintsData);
          // Check last project to align active sprint
          let targetProjectId = "";
          if (typeof window !== "undefined") {
            try {
              targetProjectId = localStorage.getItem("tamtask_last_project_id") || "";
            } catch {}
          }
          const relevantSprints = targetProjectId
            ? sprintsData.filter((s) => s.projectId === targetProjectId)
            : sprintsData;
          const active = (relevantSprints.length > 0 ? relevantSprints : sprintsData).find(
            (s) => s.status === "ACTIVE"
          ) || relevantSprints[0] || sprintsData[0];

          setFilterState((f) => ({
            ...f,
            sprintId: f.sprintId || active?.id || "",
          }));
        }
      }
    } catch (err) {
      console.warn("Could not fetch data from database API:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadData();
    }
  }, [authStatus, loadData]);

  // Auto-collapse sidebar on mobile screens on initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Save current project to localStorage whenever it changes
  useEffect(() => {
    if (currentProject?.id && typeof window !== "undefined") {
      try {
        localStorage.setItem("tamtask_last_project_id", currentProject.id);
      } catch {}
    }
  }, [currentProject?.id]);

  // Guard project access: Ensure non-admin users cannot stay on an inaccessible project
  useEffect(() => {
    if (currentUser.role !== "ADMIN" && currentProject && projects.length > 0) {
      const isLead =
        currentProject.leadId === currentUser.id ||
        currentProject.lead?.id === currentUser.id;
      const isMember =
        Array.isArray(currentProject.members) &&
        currentProject.members.some(
          (m) =>
            m.userId === currentUser.id || m.user?.id === currentUser.id
        );
      if (!isLead && !isMember) {
        const accessible = projects.filter((p) => {
          const l =
            p.leadId === currentUser.id || p.lead?.id === currentUser.id;
          const m =
            Array.isArray(p.members) &&
            p.members.some(
              (mem) =>
                mem.userId === currentUser.id || mem.user?.id === currentUser.id
            );
          return l || m;
        });
        if (accessible.length > 0) {
          setCurrentProject(accessible[0]);
        }
      }
    }
  }, [currentUser, currentProject, projects]);

  // Global Jira Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // 1. Command Palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // If user is typing inside an input/textarea, do not trigger single-key shortcuts
      if (isInput) return;

      // 2. Quick Create: 'c'
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }

      // 3. Shortcuts Help: '?'
      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter scoped data by current selected project
  const projectIssues = useMemo(() => {
    if (!currentProject) return issues;
    return issues.filter(
      (i) => !i.projectId || i.projectId === currentProject.id
    );
  }, [issues, currentProject]);

  const projectSprints = useMemo(() => {
    if (!currentProject) return sprints;
    return sprints.filter(
      (s) => !s.projectId || s.projectId === currentProject.id
    );
  }, [sprints, currentProject]);

  const projectEpics = useMemo(() => {
    if (!currentProject) return epics;
    return epics.filter(
      (e) => !e.projectId || e.projectId === currentProject.id
    );
  }, [epics, currentProject]);

  // Scoped project users (strictly members and lead of the current project)
  const projectUsers = useMemo(() => {
    if (!currentProject) return users;
    const memberMap = new Map<string, User>();

    // 1. Add all members from currentProject.members
    if (Array.isArray(currentProject.members)) {
      currentProject.members.forEach((m) => {
        if (m.user) {
          const fullUser =
            users.find((u) => u.id === m.user?.id) || (m.user as User);
          if (fullUser) memberMap.set(fullUser.id, fullUser);
        } else if (m.userId) {
          const u = users.find((user) => user.id === m.userId);
          if (u) memberMap.set(u.id, u);
        }
      });
    }

    // 2. Add Project Lead if not already added
    if (currentProject.lead) {
      const fullUser =
        users.find((u) => u.id === currentProject.lead?.id) ||
        (currentProject.lead as User);
      if (fullUser && !memberMap.has(fullUser.id)) {
        memberMap.set(fullUser.id, fullUser);
      }
    } else if (currentProject.leadId && !memberMap.has(currentProject.leadId)) {
      const leadUser = users.find((u) => u.id === currentProject.leadId);
      if (leadUser) memberMap.set(leadUser.id, leadUser);
    }

    return memberMap.size > 0 ? Array.from(memberMap.values()) : users;
  }, [currentProject, users]);

  // Active sprint for sidebar display
  const activeSprint = useMemo(() => {
    return (
      projectSprints.find((s) => s.status === "ACTIVE") ||
      projectSprints[0]
    );
  }, [projectSprints]);

  // Update Status in Database & Local State
  const handleUpdateIssueStatus = async (
    issueId: string,
    newStatus: IssueStatus
  ) => {
    const existing = issues.find((i) => i.id === issueId);
    const oldStatus = existing?.status;

    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? {
              ...i,
              status: newStatus,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : i
      )
    );
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    if (existing && oldStatus && oldStatus !== newStatus) {
      notify.undoable(
        `Đã chuyển [${existing.key}] sang ${newStatus}`,
        () => {
          handleUpdateIssueStatus(issueId, oldStatus);
        }
      );
    }

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, actorId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activities) {
          setIssues((prev) =>
            prev.map((i) => (i.id === issueId ? { ...i, activities: data.activities } : i))
          );
          if (selectedIssue && selectedIssue.id === issueId) {
            setSelectedIssue((prev) => (prev ? { ...prev, activities: data.activities } : null));
          }
        }
      }
    } catch (err) {
      console.error("Failed to persist status change:", err);
      notify.error("Không thể cập nhật trạng thái", "Vui lòng kiểm tra lại kết nối.");
    }
  };

  // Update Issue Details
  const handleUpdateIssue = async (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedIssue(updated);

    try {
      const res = await fetch(`/api/issues/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updated.title,
          description: updated.description,
          status: updated.status,
          priority: updated.priority,
          storyPoints: updated.storyPoints,
          assigneeId: updated.assignee?.id,
          assigneeName: updated.assignee?.name,
          epicId: updated.epic?.id,
          sprintId: updated.sprintId,
          prLink: updated.prLink,
          subtasks: updated.subtasks,
          labels: updated.labels,
          originalEstimate: updated.originalEstimate,
          timeSpent: updated.timeSpent,
          actorId: currentUser.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIssues((prev) =>
          prev.map((i) => (i.id === updated.id ? { ...i, ...data } : i))
        );
        if (selectedIssue && selectedIssue.id === updated.id) {
          setSelectedIssue((prev) => (prev ? { ...prev, ...data } : null));
        }
        notify.success("Đã cập nhật công việc", `${updated.key} đã được lưu thành công.`);
      }
    } catch (err) {
      console.error("Failed to persist issue updates:", err);
      notify.error("Không thể lưu công việc", "Có lỗi xảy ra trong quá trình lưu.");
    }
  };

  // Delete Issue
  const handleDeleteIssue = async (issueId: string) => {
    const issueToDelete = issues.find((i) => i.id === issueId);
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(null);
    }

    if (issueToDelete) {
      notify.undoable(
        `Đã xóa công việc [${issueToDelete.key}]`,
        () => {
          handleCreateIssue(issueToDelete);
        }
      );
    }

    try {
      await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete issue from DB:", err);
    }
  };

  // Create Issue
  const handleCreateIssue = async (newIssueData: Partial<Issue>) => {
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newIssueData.type || "TASK",
          projectId: currentProject?.id || null,
          title: newIssueData.title,
          description: newIssueData.description,
          status: newIssueData.status || "TODO",
          priority: newIssueData.priority || "MEDIUM",
          storyPoints: newIssueData.storyPoints,
          assigneeId: newIssueData.assignee?.id,
          reporterId: currentUser.id,
          epicId: newIssueData.epic?.id,
          sprintId: newIssueData.sprintId || activeSprint?.id || null,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIssues((prev) => [created, ...prev]);
        return;
      }
    } catch (err) {
      console.error("Failed to create issue in DB:", err);
    }

    // Fallback local create
    const projectPrefix = currentProject?.key || "JIRA";
    const nextIndex = issues.length + 101;
    const fallbackIssue: Issue = {
      id: `iss-${Date.now()}`,
      key: `${projectPrefix}-${nextIndex}`,
      projectId: currentProject?.id,
      type: newIssueData.type || "TASK",
      title: newIssueData.title || "Untitled Issue",
      description: newIssueData.description || "",
      status: newIssueData.status || "TODO",
      priority: newIssueData.priority || "MEDIUM",
      assignee: newIssueData.assignee,
      reporter: currentUser,
      epic: newIssueData.epic,
      sprintId: newIssueData.sprintId || activeSprint?.id,
      storyPoints: newIssueData.storyPoints || 0,
      subtasks: [],
      attachments: [],
      comments: [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setIssues((prev) => [fallbackIssue, ...prev]);
  };

  // Create Project
  const handleCreateProject = async (data: {
    name: string;
    key: string;
    description: string;
  }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Không thể tạo dự án");
    }

    const createdProject: Project = await res.json();
    setProjects((prev) => [...prev, createdProject]);
    setCurrentProject(createdProject);
    await loadData();
  };

  const handleOpenCreateInStatus = (status: IssueStatus) => {
    setCreateInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleCompleteSprint = async (sprintId: string) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, status: "COMPLETED" } : s))
    );
    try {
      await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
    } catch (err) {
      console.error("Failed to complete sprint:", err);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, status: "ACTIVE" } : s))
    );
    try {
      await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
    } catch (err) {
      console.error("Failed to start sprint:", err);
    }
  };

  const handleCreateSprint = async (sprintData: {
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
  }) => {
    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sprintData,
          projectId: currentProject?.id || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSprints((prev) => [...prev, created]);
        return;
      }
    } catch (err) {
      console.error("Failed to create sprint:", err);
    }

    const fallbackSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: sprintData.name,
      goal: sprintData.goal,
      status: "PLANNED",
      startDate: sprintData.startDate,
      endDate: sprintData.endDate,
      totalPoints: 0,
      completedPoints: 0,
      projectId: currentProject?.id,
    };
    setSprints((prev) => [...prev, fallbackSprint]);
  };

  // Move Issue Between Sprints & Backlog
  const handleMoveIssueToSprint = async (
    issueId: string,
    sprintId: string | null
  ) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? {
              ...i,
              sprintId: sprintId || undefined,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : i
      )
    );
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue((prev) =>
        prev ? { ...prev, sprintId: sprintId || undefined } : null
      );
    }

    try {
      await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintId,
          actorId: currentUser.id,
        }),
      });
    } catch (err) {
      console.error("Failed to move issue to sprint:", err);
    }
  };

  // Reorder or Move Issue within Same Board or Across Boards
  const handleReorderOrMoveIssue = async (
    sourceIssueId: string,
    targetIssueId: string,
    targetSprintId: string | null,
    position: "before" | "after"
  ) => {
    // 1. Optimistic list reorder in client state
    setIssues((prev) => {
      const source = prev.find((i) => i.id === sourceIssueId);
      if (!source) return prev;
      const updatedSource: Issue = {
        ...source,
        sprintId: targetSprintId || undefined,
        updatedAt: new Date().toISOString().split("T")[0],
      };
      const withoutSource = prev.filter((i) => i.id !== sourceIssueId);
      const targetIndex = withoutSource.findIndex((i) => i.id === targetIssueId);
      if (targetIndex === -1) {
        return [updatedSource, ...withoutSource];
      }
      const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      const nextList = [...withoutSource];
      nextList.splice(insertIndex, 0, updatedSource);
      return nextList;
    });

    if (selectedIssue && selectedIssue.id === sourceIssueId) {
      setSelectedIssue((prev) =>
        prev ? { ...prev, sprintId: targetSprintId || undefined } : null
      );
    }

    // 2. If sprintId changed, persist to DB API
    const currentSource = issues.find((i) => i.id === sourceIssueId);
    if (currentSource && (currentSource.sprintId || null) !== (targetSprintId || null)) {
      try {
        await fetch(`/api/issues/${sourceIssueId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprintId: targetSprintId,
            actorId: currentUser.id,
          }),
        });
      } catch (err) {
        console.error("Failed to update issue sprint on reorder:", err);
      }
    }
  };

  // User Administration Actions (Persisted directly to SQLite DB)
  const handleUpdateUserRole = async (userId: string, newRole: User["role"]) => {
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        throw new Error("Không thể cập nhật quyền người dùng trong Database");
      }
    } catch (err) {
      console.error("Failed to persist user role change:", err);
      // Revert if error
      await loadData();
      throw err;
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    newStatus: "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL"
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error("Không thể thay đổi trạng thái tài khoản");
      }
    } catch (err) {
      console.error("Failed to persist user status change:", err);
      await loadData();
      throw err;
    }
  };

  const handleInviteUser = async (
    email: string,
    name: string,
    role: User["role"],
    password?: string,
    isTwoFactorEnabled?: boolean
  ) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, password, isTwoFactorEnabled }),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [...prev, newUser]);
        return;
      }
    } catch (err) {
      console.error("Failed to create user in DB:", err);
    }

    const fallbackUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      activeTasksCount: 0,
    };
    setUsers((prev) => [...prev, fallbackUser]);
  };

  const handleApproveUser = async (userId: string, role: User["role"], projectId?: string) => {
    try {
      // 1. Update user role and status to ACTIVE
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, status: "ACTIVE" }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role, status: "ACTIVE" } : u))
        );
      }
      // 2. If projectId chosen, assign user to project members
      if (projectId) {
        await fetch(`/api/projects/${projectId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role }),
        });
        await loadData();
      }
    } catch (err) {
      console.error("Failed to approve user:", err);
      throw err;
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSprints((prev) => prev.filter((s) => s.id !== sprintId));
        setIssues((prev) =>
          prev.map((i) => (i.sprintId === sprintId ? { ...i, sprintId: undefined } : i))
        );
      }
    } catch (err) {
      console.error("Failed to delete sprint:", err);
    }
  };

  // 1. Loading Authentication State - Viettel Red Signature
  if (authStatus === "loading") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F8F8]">
        <div className="w-14 h-14 rounded-2xl bg-[#EE0033] flex items-center justify-center text-white shadow-xl shadow-[#EE0033]/25 animate-pulse mb-4 font-black text-lg tracking-tight">
          TT
        </div>
        <div className="text-sm font-bold text-[#111827]">Đang khởi động TamTask...</div>
        <div className="text-xs text-[#9B9B9B] mt-1">Đang đồng bộ dữ liệu dự án</div>
      </div>
    );
  }

  // 2. Unauthenticated Gate: Show Mandatory Auth Landing Gate
  if (authStatus === "unauthenticated" || !session) {
    return <AuthLandingScreen />;
  }

  // 2.1 Pending Approval Gate: Show Pending Approval Screen if user has not been approved
  if (currentUser.status === "PENDING_APPROVAL") {
    return <PendingApprovalScreen currentUser={currentUser} />;
  }

  // 3. Authenticated App Workspace
  return (
    <ToastProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          projects={projects}
          currentProject={currentProject}
          onSelectProject={(p) => {
            setCurrentProject(p);
            // Default filter sprint to the active sprint of the selected project
            const projectSprints = sprints.filter((s) => s.projectId === p.id);
            const active = projectSprints.find((s) => s.status === "ACTIVE") || projectSprints[0];
            setFilterState((f) => ({ ...f, sprintId: active ? active.id : "" }));
          }}
          onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
          onOpenProjectMembers={() => setIsProjectMembersModalOpen(true)}
          onCreateIssueClick={() => setIsCreateModalOpen(true)}
          searchQuery={filterState.searchQuery}
          onSearchChange={(query) =>
            setFilterState({ ...filterState, searchQuery: query })
          }
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

      {/* Main Workspace: Sidebar + Dynamic View */}
      <div className="flex-1 flex overflow-hidden relative z-0">
        {/* Mobile Backdrop Overlay when Sidebar is open */}
        {!isSidebarCollapsed && (
          <div
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 md:hidden"
          />
        )}

        {/* Left Jira Sidebar (Responsive slide-in drawer on mobile, static on desktop) */}
        <div
          className={`md:static fixed inset-y-0 left-0 md:z-auto z-40 transition-transform duration-200 md:translate-x-0 ${
            isSidebarCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
          }`}
        >
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            currentUser={currentUser}
            currentProject={currentProject}
            activeSprintName={activeSprint?.name}
          />
        </div>

        {/* Central View Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentView === "BOARD" && (
            <KanbanBoard
              issues={projectIssues}
              users={projectUsers}
              epics={projectEpics}
              sprints={projectSprints}
              statuses={statuses}
              currentUser={currentUser}
              isLoading={isLoadingData}
              onIssueClick={setSelectedIssue}
              onUpdateIssueStatus={handleUpdateIssueStatus}
              onCreateInStatus={handleOpenCreateInStatus}
              onQuickCreateIssue={(title, status) => handleCreateIssue({ title, status })}
              onOpenWorkflowSettings={() => setIsWorkflowModalOpen(true)}
              onOpenEpicSettings={() => setIsEpicSettingsOpen(true)}
              filterState={filterState}
              onFilterChange={setFilterState}
            />
          )}

          {currentView === "BACKLOG" && (
            <BacklogView
              issues={projectIssues}
              sprints={projectSprints}
              users={projectUsers}
              currentUser={currentUser}
              isLoading={isLoadingData}
              onIssueClick={setSelectedIssue}
              onCreateIssueClick={() => setIsCreateModalOpen(true)}
              onCreateSprint={handleCreateSprint}
              onStartSprint={handleStartSprint}
              onCompleteSprint={handleCompleteSprint}
              onDeleteSprint={handleDeleteSprint}
              onMoveIssueToSprint={handleMoveIssueToSprint}
              onReorderOrMoveIssue={handleReorderOrMoveIssue}
              onRefresh={loadData}
            />
          )}

          {currentView === "TIMELINE" && (
            <TimelineView
              epics={projectEpics}
              sprints={projectSprints}
              issues={projectIssues}
              currentUser={currentUser}
              onIssueClick={setSelectedIssue}
            />
          )}

          {currentView === "DASHBOARD" && (
            <DashboardView
              issues={projectIssues}
              sprints={projectSprints}
              users={projectUsers}
            />
          )}

          {currentView === "AUTOMATION" && <AutomationView />}

          {currentView === "ADMIN" && (
            <AdminView
              users={users}
              projects={projects}
              onUpdateUserRole={handleUpdateUserRole}
              onToggleUserStatus={handleToggleUserStatus}
              onInviteUser={handleInviteUser}
              onApproveUser={handleApproveUser}
            />
          )}
        </main>
      </div>

      {/* Slide-over Issue Detail Drawer */}
      <IssueDetailDrawer
        issue={selectedIssue}
        allIssues={issues}
        users={projectUsers}
        epics={projectEpics}
        statuses={statuses}
        currentUser={currentUser}
        onClose={() => setSelectedIssue(null)}
        onUpdateIssue={handleUpdateIssue}
        onDeleteIssue={handleDeleteIssue}
        onSelectIssue={(iss) => setSelectedIssue(iss)}
      />

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        users={projectUsers}
        epics={projectEpics}
        sprints={projectSprints}
        currentUser={currentUser}
        currentProject={currentProject}
        initialStatus={createInitialStatus}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateIssue}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        users={users}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Project Members Modal */}
      <ProjectMembersModal
        isOpen={isProjectMembersModalOpen}
        project={currentProject}
        currentUser={currentUser}
        allUsers={users}
        onClose={() => setIsProjectMembersModalOpen(false)}
        onMembersUpdated={loadData}
      />

      {/* Workflow Settings Modal */}
      <WorkflowSettingsModal
        isOpen={isWorkflowModalOpen}
        statuses={statuses}
        currentProject={currentProject}
        onClose={() => setIsWorkflowModalOpen(false)}
        onSaveStatuses={(newStatuses) => setStatuses(newStatuses)}
      />

      {/* Epic Settings Modal */}
      <EpicSettingsModal
        isOpen={isEpicSettingsOpen}
        onClose={() => setIsEpicSettingsOpen(false)}
        epics={projectEpics}
        currentProject={currentProject}
        onEpicsUpdated={loadData}
      />

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        issues={issues}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(p) => {
          setCurrentProject(p);
          const projectSprints = sprints.filter((s) => s.projectId === p.id);
          const active = projectSprints.find((s) => s.status === "ACTIVE") || projectSprints[0];
          setFilterState((f) => ({ ...f, sprintId: active ? active.id : "" }));
        }}
        onSelectIssue={(iss) => setSelectedIssue(iss)}
        onSelectView={(v) => setCurrentView(v)}
        onOpenCreateIssue={() => setIsCreateModalOpen(true)}
        onOpenShortcutsHelp={() => setIsShortcutsModalOpen(true)}
      />

      {/* Keyboard Shortcuts Help Modal (?) */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  </ToastProvider>
  );
}

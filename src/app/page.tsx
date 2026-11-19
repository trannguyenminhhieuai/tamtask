"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  IssueType,
  FilterState,
  User,
  Epic,
  Sprint,
  WorkflowStatus,
  Project,
} from "@/types/jira";
import { Layers } from "lucide-react";

// Helper to determine if a user is actively assigned to a project (as Lead or Member)
const isUserAssignedToProject = (p: Project, uId: string, uEmail?: string): boolean => {
  if (!uId && !uEmail) return false;
  const isLead =
    p.leadId === uId ||
    p.lead?.id === uId ||
    Boolean(uEmail && p.lead?.email && p.lead.email.toLowerCase() === uEmail.toLowerCase());
  const isMember =
    Array.isArray(p.members) &&
    p.members.some(
      (m) =>
        m.userId === uId ||
        m.user?.id === uId ||
        Boolean(uEmail && m.user?.email && m.user.email.toLowerCase() === uEmail.toLowerCase())
    );
  return isLead || isMember;
};

export default function JiraApp() {
  const { data: session, status: authStatus } = useSession();

  const [currentView, setCurrentView] = useState<NavView>("BOARD");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [epics, setEpics] = useState<Epic[]>(MOCK_EPICS);
  const [sprints, setSprints] = useState<Sprint[]>(MOCK_SPRINTS);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>(DEFAULT_STATUSES);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Ref to prevent auto-switching to default project after user has logged in once
  // Prevents loadData() re-runs (triggered by issue/project updates) from resetting currentProject
  const hasAutoSwitchedOnLoginRef = useRef(false);

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
  const [createInitialType, setCreateInitialType] = useState<IssueType>("TASK");
  const [createInitialSprintId, setCreateInitialSprintId] = useState<string>("");

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

  // Helper: Persist issues list to localStorage SWR cache immediately (called after every write op)
  const updateIssuesCache = useCallback((updatedIssues: Issue[]) => {
    if (typeof window === "undefined") return;
    try {
      const uId = (session?.user as any)?.id || currentUser.id;
      const userCacheKey = `tamtask_swr_cache_${uId}`;
      // Read existing cache to preserve other keys (projects, users, epics, sprints)
      const existing = localStorage.getItem(userCacheKey) || localStorage.getItem("tamtask_swr_cache");
      const base = existing ? JSON.parse(existing) : {};
      const updated = JSON.stringify({ ...base, issues: updatedIssues });
      localStorage.setItem(userCacheKey, updated);
      localStorage.setItem("tamtask_swr_cache", updated);
    } catch {}
  }, [session, currentUser.id]);

  // Helper: Persist epics list to localStorage SWR cache immediately
  const updateEpicsCache = useCallback((updatedEpics: Epic[]) => {
    if (typeof window === "undefined") return;
    try {
      const uId = (session?.user as any)?.id || currentUser.id;
      const userCacheKey = `tamtask_swr_cache_${uId}`;
      const existing = localStorage.getItem(userCacheKey) || localStorage.getItem("tamtask_swr_cache");
      const base = existing ? JSON.parse(existing) : {};
      const updated = JSON.stringify({ ...base, epics: updatedEpics });
      localStorage.setItem(userCacheKey, updated);
      localStorage.setItem("tamtask_swr_cache", updated);
    } catch {}
  }, [session, currentUser.id]);

  // Instant SWR Hydration: Render cached state instantly on mount (0ms latency feel) scoped to user
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const uId = (session?.user as any)?.id || currentUser.id;
      const userCacheKey = `tamtask_swr_cache_${uId}`;
      const cached = localStorage.getItem(userCacheKey) || localStorage.getItem("tamtask_swr_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) setProjects(parsed.projects);
        if (Array.isArray(parsed.issues) && parsed.issues.length > 0) setIssues(parsed.issues);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) setUsers(parsed.users);
        if (Array.isArray(parsed.epics) && parsed.epics.length > 0) setEpics(parsed.epics);
        if (Array.isArray(parsed.sprints) && parsed.sprints.length > 0) setSprints(parsed.sprints);
        setIsLoadingData(false);
      }
    } catch {}
  }, [session, currentUser.id]);

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
      let freshProjects: Project[] | undefined;
      let freshIssues: Issue[] | undefined;
      let freshUsers: User[] | undefined;
      let freshEpics: Epic[] | undefined;
      let freshSprints: Sprint[] | undefined;

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
          freshProjects = projectsData;
          setProjects(projectsData);
          setCurrentProject((prev) => {
            const uId = (session?.user as any)?.id || currentUser.id;
            const uEmail = session?.user?.email || currentUser.email;

            // Prioritize projects actively assigned to this logged-in user
            const assigned = projectsData.filter((p) => isUserAssignedToProject(p, uId, uEmail));

            // === CRITICAL FIX: If user already has a valid project selected, just refresh its reference ===
            // This prevents every loadData() call from switching projects back to the default.
            if (prev) {
              const refreshedPrev = projectsData.find((p) => p.id === prev.id);
              if (refreshedPrev) {
                // Only keep this project if user is still assigned (or is ADMIN)
                const stillAssigned =
                  currentUser.role === "ADMIN" || isUserAssignedToProject(refreshedPrev, uId, uEmail);
                if (stillAssigned) return refreshedPrev;
              }
            }

            // Load user-specific last accessed project from localStorage
            let userLastId: string | null = null;
            if (typeof window !== "undefined") {
              try {
                userLastId =
                  localStorage.getItem(`tamtask_last_project_id_${uId}`) ||
                  localStorage.getItem(`tamtask_last_project_id_${uEmail}`);
              } catch {}
            }

            if (assigned.length > 0) {
              if (userLastId) {
                const matchedLast = assigned.find((p) => p.id === userLastId || p.key === userLastId);
                if (matchedLast) return matchedLast;
              }
              return assigned[0];
            }

            // Fallback for users with no assigned project yet (e.g. brand-new user or global Admin)
            const accessible =
              currentUser.role === "ADMIN"
                ? projectsData
                : projectsData.filter((p) => isUserAssignedToProject(p, uId, uEmail));

            const candidateList = accessible.length > 0 ? accessible : projectsData;

            if (typeof window !== "undefined") {
              try {
                const lastId = localStorage.getItem("tamtask_last_project_id");
                if (lastId) {
                  const matchedLast = candidateList.find((p) => p.id === lastId || p.key === lastId);
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
          freshIssues = issuesData;
          setIssues(issuesData);
        }
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData) && usersData.length > 0) {
          freshUsers = usersData;
          setUsers(usersData);
        }
      }

      if (epicsRes.ok) {
        const epicsData = await epicsRes.json();
        if (Array.isArray(epicsData) && epicsData.length > 0) {
          freshEpics = epicsData;
          setEpics(epicsData);
        }
      }

      if (sprintsRes.ok) {
        const sprintsData: Sprint[] = await sprintsRes.json();
        if (Array.isArray(sprintsData) && sprintsData.length > 0) {
          freshSprints = sprintsData;
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

      // Persist to user-scoped SWR cache for instant 0ms subsequent renders
      // Always write valid arrays — never undefined — to prevent stale cache on F5
      if (typeof window !== "undefined") {
        try {
          const uId = (session?.user as any)?.id || currentUser.id;
          const userCacheKey = `tamtask_swr_cache_${uId}`;
          const cacheData = JSON.stringify({
            projects: freshProjects ?? projects,
            issues: freshIssues ?? issues,
            users: freshUsers ?? users,
            epics: freshEpics ?? epics,
            sprints: freshSprints ?? sprints,
          });
          localStorage.setItem(userCacheKey, cacheData);
          localStorage.setItem("tamtask_swr_cache", cacheData);
        } catch {}
      }
    } catch (err) {
      console.warn("Could not fetch data from database API:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [session, currentUser]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadData();
    }
  }, [authStatus, session?.user?.email, loadData]);

  // Auto-collapse sidebar on mobile screens on initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Save current project to localStorage and reset project-scoped filters whenever currentProject changes
  useEffect(() => {
    if (currentProject?.id && typeof window !== "undefined") {
      try {
        localStorage.setItem("tamtask_last_project_id", currentProject.id);
        const uId = (session?.user as any)?.id || currentUser.id;
        const uEmail = session?.user?.email || currentUser.email;
        if (uId) {
          localStorage.setItem(`tamtask_last_project_id_${uId}`, currentProject.id);
        }
        if (uEmail) {
          localStorage.setItem(`tamtask_last_project_id_${uEmail}`, currentProject.id);
        }
      } catch {}

      // Clear project-scoped sprint/epic/assignee filters to avoid hiding tasks in the new project
      setFilterState((prev) => ({
        ...prev,
        sprintId: "",
        epicIds: [],
        assigneeIds: [],
      }));
    }
  }, [currentProject?.id, session?.user, currentUser.id, currentUser.email]);

  // Automatically switch to user's assigned project ONCE upon login (not on every data refresh)
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user && projects.length > 0) {
      // === CRITICAL FIX: Only run this logic once per login session ===
      // After the first successful auto-switch, never re-run to avoid overriding user's project choice
      if (hasAutoSwitchedOnLoginRef.current) return;

      const uId = (session.user as any).id || currentUser.id;
      const uEmail = session.user.email || currentUser.email;

      const myAssigned = projects.filter((p) => isUserAssignedToProject(p, uId, uEmail));

      if (myAssigned.length > 0) {
        // If current project is already one of the user's assigned projects, mark done and stop
        if (currentProject && myAssigned.some((p) => p.id === currentProject.id)) {
          hasAutoSwitchedOnLoginRef.current = true;
          return;
        }

        // Check user's last chosen project
        let userLastId: string | null = null;
        try {
          userLastId =
            localStorage.getItem(`tamtask_last_project_id_${uId}`) ||
            localStorage.getItem(`tamtask_last_project_id_${uEmail}`);
        } catch {}

        if (userLastId) {
          const match = myAssigned.find((p) => p.id === userLastId || p.key === userLastId);
          if (match) {
            setCurrentProject(match);
            hasAutoSwitchedOnLoginRef.current = true;
            return;
          }
        }

        // Otherwise switch directly to their first assigned project
        setCurrentProject(myAssigned[0]);
        hasAutoSwitchedOnLoginRef.current = true;
      }
    }
  }, [authStatus, session, projects]);

  // Guard project access: Ensure non-admin users cannot stay on an inaccessible project
  // === CRITICAL FIX: Check by ID in the REFRESHED projects list, not stale currentProject reference ===
  useEffect(() => {
    if (currentUser.role !== "ADMIN" && currentProject && projects.length > 0) {
      // Find the refreshed version of the current project by ID in the new projects list
      const refreshedCurrentProject = projects.find((p) => p.id === currentProject.id);

      if (refreshedCurrentProject) {
        // Project still exists — check if user is still assigned to it
        const isAssigned = isUserAssignedToProject(refreshedCurrentProject, currentUser.id, currentUser.email);
        if (isAssigned) {
          // User is still assigned — update reference to fresh data WITHOUT switching project
          if (refreshedCurrentProject !== currentProject) {
            setCurrentProject(refreshedCurrentProject);
          }
          return;
        }
      }

      // User is truly no longer assigned to current project (or project was deleted) — switch to fallback
      const accessible = projects.filter((p) =>
        isUserAssignedToProject(p, currentUser.id, currentUser.email)
      );
      if (accessible.length > 0) {
        setCurrentProject(accessible[0]);
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
        setCreateInitialType(currentView === "BACKLOG" ? "STORY" : "TASK");
        setCreateInitialSprintId(currentView === "BACKLOG" ? "" : (activeSprint?.id || ""));
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

    // Optimistic update — apply immediately to UI
    const updatedIssues = issues.map((i) =>
      i.id === issueId
        ? {
            ...i,
            status: newStatus,
            updatedAt: new Date().toISOString().split("T")[0],
          }
        : i
    );
    setIssues(updatedIssues);
    // ✅ FIX Bug 2: Sync cache immediately so F5 shows new status, not old one
    updateIssuesCache(updatedIssues);

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

  // Update Local Issue State without network PATCH (used for atomic subtasks & 0ms client UI)
  const handleUpdateIssueLocal = (updated: Issue) => {
    setIssues((prev) => {
      const next = prev.map((i) => (i.id === updated.id ? updated : i));
      updateIssuesCache(next);
      return next;
    });
    setSelectedIssue(updated);
  };

  // Update Issue Details
  const handleUpdateIssue = async (updated: Issue) => {
    setIssues((prev) => {
      const next = prev.map((i) => (i.id === updated.id ? updated : i));
      updateIssuesCache(next);
      return next;
    });
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
          sprintId: updated.sprintId ? updated.sprintId : null,
          prLink: updated.prLink,
          labels: updated.labels,
          attachments: updated.attachments,
          originalEstimate: updated.originalEstimate,
          timeSpent: updated.timeSpent,
          actorId: currentUser.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIssues((prev) => {
          const next = prev.map((i) => (i.id === updated.id ? { ...i, ...data } : i));
          updateIssuesCache(next);
          return next;
        });
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
    // ✅ FIX: Update cache immediately on delete so F5 doesn't show deleted item
    setIssues((prev) => {
      const updated = prev.filter((i) => i.id !== issueId);
      updateIssuesCache(updated);
      return updated;
    });

    // If an Epic issue was deleted, also clean up the epics list and cache
    if (issueToDelete?.type === "EPIC") {
      setEpics((prev) => {
        const next = prev.filter(
          (e) =>
            e.id !== issueToDelete.epic?.id &&
            e.name.toLowerCase() !== issueToDelete.title.toLowerCase()
        );
        updateEpicsCache(next);
        return next;
      });
    }

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
    const targetProjectId = newIssueData.projectId || currentProject?.id || null;
    const projectPrefix = currentProject?.key || "TASK";
    const tempId = `temp-${Date.now()}`;
    const nextIndex = issues.length + 101;
    const tempKey = `${projectPrefix}-${nextIndex}`;

    // Optimistic epic creation if creating an EPIC
    let createdTempEpic: Epic | null = null;
    if (newIssueData.type === "EPIC") {
      createdTempEpic = {
        id: `epic-${Date.now()}`,
        name: newIssueData.title || "Untitled Epic",
        summary: newIssueData.description || "",
        color: "#6554C0",
        projectId: targetProjectId || undefined,
      };
      setEpics((prev) => {
        const next = [createdTempEpic!, ...prev];
        updateEpicsCache(next);
        return next;
      });
    }

    // Explicit sprint handling: if sprintId was set (even to "" or null for Backlog), respect it;
    // only fallback to activeSprint when sprintId is undefined AND on Kanban BOARD view
    const targetSprintId =
      newIssueData.sprintId !== undefined
        ? (newIssueData.sprintId || null)
        : (currentView === "BOARD" ? activeSprint?.id || null : null);

    // 1. Optimistic task insertion for 0ms instant UI feedback
    const optimisticIssue: Issue = {
      id: tempId,
      key: tempKey,
      projectId: targetProjectId || undefined,
      type: newIssueData.type || "TASK",
      title: newIssueData.title || "Untitled Issue",
      description: newIssueData.description || "",
      status: newIssueData.status || "TODO",
      priority: newIssueData.priority || "MEDIUM",
      storyPoints: newIssueData.storyPoints || 0,
      assignee: newIssueData.assignee || undefined,
      reporter: currentUser,
      epic: createdTempEpic || newIssueData.epic || undefined,
      sprintId: targetSprintId || undefined,
      subtasks: [],
      attachments: [],
      comments: [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setIssues((prev) => {
      const updated = [optimisticIssue, ...prev];
      updateIssuesCache(updated);
      return updated;
    });

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newIssueData.type || "TASK",
          projectId: targetProjectId,
          title: newIssueData.title,
          description: newIssueData.description,
          status: newIssueData.status || "TODO",
          priority: newIssueData.priority || "MEDIUM",
          storyPoints: newIssueData.storyPoints,
          assigneeId: newIssueData.assignee?.id,
          reporterId: currentUser.id,
          epicId: newIssueData.epic?.id,
          sprintId: targetSprintId,
        }),
      });

      if (res.ok) {
        const created: Issue = await res.json();
        // Replace optimistic task with the real DB task
        setIssues((prev) => {
          const updated = prev.map((i) => (i.id === tempId ? created : i));
          updateIssuesCache(updated);
          return updated;
        });

        // If an Epic was created, synchronize epics list with real DB record
        if (created.type === "EPIC" && created.epic) {
          setEpics((prev) => {
            const next = [
              created.epic!,
              ...prev.filter(
                (e) =>
                  e.id !== created.epic!.id &&
                  (!createdTempEpic || e.id !== createdTempEpic.id)
              ),
            ];
            updateEpicsCache(next);
            return next;
          });
        }

        notify.success("Đã tạo công việc", `[${created.key}] ${created.title} đã được lưu thành công.`);
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        // Rollback optimistic task on server error
        setIssues((prev) => {
          const updated = prev.filter((i) => i.id !== tempId);
          updateIssuesCache(updated);
          return updated;
        });
        if (createdTempEpic) {
          setEpics((prev) => {
            const next = prev.filter((e) => e.id !== createdTempEpic!.id);
            updateEpicsCache(next);
            return next;
          });
        }
        console.error("Failed to create issue in DB:", res.status, errJson);
        notify.error("Không thể tạo công việc", errJson.error || `Lỗi máy chủ (${res.status})`);
        return;
      }
    } catch (err) {
      // Rollback optimistic task on network error
      setIssues((prev) => {
        const updated = prev.filter((i) => i.id !== tempId);
        updateIssuesCache(updated);
        return updated;
      });
      if (createdTempEpic) {
        setEpics((prev) => {
          const next = prev.filter((e) => e.id !== createdTempEpic!.id);
          updateEpicsCache(next);
          return next;
        });
      }
      console.error("Failed to create issue in DB:", err);
      notify.error("Không thể tạo công việc", "Vui lòng kiểm tra lại kết nối mạng.");
      return;
    }
  };

  // Create Project
  const handleCreateProject = async (data: {
    name: string;
    key: string;
    description: string;
    leadId?: string;
  }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        leadId: data.leadId || currentUser.id,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Không thể tạo dự án");
    }

    const createdProject: Project = await res.json();

    // 1. Immediately persist user's last project to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tamtask_last_project_id", createdProject.id);
        const uId = (session?.user as any)?.id || currentUser.id;
        const uEmail = session?.user?.email || currentUser.email;
        if (uId) localStorage.setItem(`tamtask_last_project_id_${uId}`, createdProject.id);
        if (uEmail) localStorage.setItem(`tamtask_last_project_id_${uEmail}`, createdProject.id);
      } catch {}
    }

    // 2. Clear filters so the new project starts clean
    setFilterState({
      searchQuery: "",
      assigneeIds: [],
      epicIds: [],
      priorities: [],
      sprintId: "",
      onlyMyIssues: false,
    });

    // 3. Set newly created project and reload data
    setProjects((prev) => [...prev, createdProject]);
    setCurrentProject(createdProject);
    notify.success("Đã tạo dự án mới", `Dự án [${createdProject.name}] (${createdProject.key}) đã được khởi tạo.`);
    await loadData();
  };

  const handleOpenCreateInStatus = (status: IssueStatus) => {
    setCreateInitialStatus(status);
    setCreateInitialType("TASK");
    setCreateInitialSprintId(activeSprint?.id || "");
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
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role, password, isTwoFactorEnabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Không thể khởi tạo nhân sự. Vui lòng kiểm tra lại thông tin.");
    }
    setUsers((prev) => [...prev, data]);
    notify.success("Khởi tạo nhân sự", `Đã tạo tài khoản cho ${name} thành công.`);
  };

  const handleDeleteUser = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Không thể xóa nhân sự khỏi hệ thống.");
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    notify.success("Đã xóa nhân sự", "Tài khoản nhân sự đã được xóa khỏi hệ thống.");
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

  // 1. Loading Authentication State - Viettel Red Signature (Full Dark Mode Sync)
  if (authStatus === "loading") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F9FA] dark:bg-[#09090B] transition-colors duration-200">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center text-white shadow-xl shadow-[#EE0033]/25 animate-pulse mb-4 font-black text-lg tracking-tight">
          TT
        </div>
        <div className="text-sm font-bold text-[#111827] dark:text-zinc-100">Đang khởi động TamTask...</div>
        <div className="text-xs text-[#9B9B9B] dark:text-zinc-500 mt-1">Đang đồng bộ dữ liệu dự án</div>
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
          onCreateIssueClick={() => {
            setCreateInitialType(currentView === "BACKLOG" ? "STORY" : "TASK");
            setCreateInitialSprintId(currentView === "BACKLOG" ? "" : (activeSprint?.id || ""));
            setIsCreateModalOpen(true);
          }}
          searchQuery={filterState.searchQuery}
          onSearchChange={(query) =>
            setFilterState({ ...filterState, searchQuery: query })
          }
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          currentView={currentView}
          onViewChange={setCurrentView}
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
            onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
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
              onCreateIssueClick={() => {
                setCreateInitialType("STORY");
                setCreateInitialSprintId("");
                setIsCreateModalOpen(true);
              }}
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
              currentUserId={currentUser.id}
              onUpdateUserRole={handleUpdateUserRole}
              onToggleUserStatus={handleToggleUserStatus}
              onInviteUser={handleInviteUser}
              onDeleteUser={handleDeleteUser}
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
        sprints={projectSprints}
        statuses={statuses}
        currentUser={currentUser}
        onClose={() => setSelectedIssue(null)}
        onUpdateIssue={handleUpdateIssue}
        onUpdateIssueLocal={handleUpdateIssueLocal}
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
        initialType={createInitialType}
        initialSprintId={createInitialSprintId}
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

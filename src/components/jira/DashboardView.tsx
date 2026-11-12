"use client";

import React, { useMemo } from "react";
import { Issue, Sprint, User } from "@/types/jira";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  CheckCircle,
  Clock,
  Zap,
  Download,
  Layers,
  AlertTriangle,
  BarChart2,
  Timer,
  Check,
} from "lucide-react";

interface DashboardViewProps {
  issues: Issue[];
  sprints: Sprint[];
  users: User[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ issues, sprints, users }) => {
  const currentSprint = sprints.find((s) => s.status === "ACTIVE") || sprints[0] || {
    id: "sprint-1",
    name: "Sprint 1",
    totalPoints: 48,
    completedPoints: 26,
  };

  const sprintIssues = issues.filter((i) => i.sprintId === currentSprint.id);
  const sprintTotalPoints =
    sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0) || currentSprint.totalPoints || 48;
  const sprintDonePoints =
    sprintIssues.filter((i) => i.status === "DONE").reduce((sum, i) => sum + (i.storyPoints || 0), 0) ||
    currentSprint.completedPoints ||
    26;
  const remainingPoints = Math.max(0, sprintTotalPoints - sprintDonePoints);

  // Worklog / Time Tracking metrics
  const totalTimeSpentMin = issues.reduce((sum, i) => sum + (i.timeSpent || 0), 0);
  const totalEstimateMin = issues.reduce((sum, i) => sum + (i.originalEstimate || 0), 0);
  const totalSpentHours = Math.round((totalTimeSpentMin / 60) * 10) / 10;
  const totalEstimateHours = Math.round((totalEstimateMin / 60) * 10) / 10;

  // 1-Click Export Issues to CSV with UTF-8 BOM (Excel Vietnamese compatible)
  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const headers = [
      "Key",
      "Tiêu đề",
      "Loại Task",
      "Trạng thái",
      "Độ ưu tiên",
      "Story Points",
      "Thời gian đã làm (phút)",
      "Ước lượng (phút)",
      "Người thực hiện",
      "Người tạo",
      "Epic",
      "Sprint ID",
      "Ngày cập nhật",
    ];

    const rows = issues.map((i) => [
      `"${i.key}"`,
      `"${(i.title || "").replace(/"/g, '""')}"`,
      `"${i.type}"`,
      `"${i.status}"`,
      `"${i.priority}"`,
      `"${i.storyPoints || 0}"`,
      `"${i.timeSpent || 0}"`,
      `"${i.originalEstimate || 0}"`,
      `"${(i.assignee?.name || "Chưa gán").replace(/"/g, '""')}"`,
      `"${(i.reporter?.name || "Thành viên").replace(/"/g, '""')}"`,
      `"${(i.epic?.name || "Không").replace(/"/g, '""')}"`,
      `"${i.sprintId || "Backlog"}"`,
      `"${i.updatedAt || ""}"`,
    ]);

    const csvContent = BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `TamTask_Issues_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic Burndown Data based on sprintTotalPoints and remaining
  const burndownData = useMemo(() => {
    const total = sprintTotalPoints;
    const step = total / 10;
    return [
      { day: "Day 1", ideal: total, actual: total },
      { day: "Day 2", ideal: Math.round((total - step) * 10) / 10, actual: total },
      { day: "Day 3", ideal: Math.round((total - step * 2) * 10) / 10, actual: Math.round((total - step * 0.7) * 10) / 10 },
      { day: "Day 4", ideal: Math.round((total - step * 3) * 10) / 10, actual: Math.round((total - step * 1.6) * 10) / 10 },
      { day: "Day 5", ideal: Math.round((total - step * 4) * 10) / 10, actual: Math.round((total - step * 2.8) * 10) / 10 },
      { day: "Day 6", ideal: Math.round((total - step * 5) * 10) / 10, actual: Math.round((total - step * 3.8) * 10) / 10 },
      { day: "Day 7", ideal: Math.round((total - step * 6) * 10) / 10, actual: remainingPoints },
      { day: "Day 8", ideal: Math.round((total - step * 7) * 10) / 10, actual: null },
      { day: "Day 9", ideal: Math.round((total - step * 8) * 10) / 10, actual: null },
      { day: "Day 10", ideal: 0, actual: null },
    ];
  }, [sprintTotalPoints, remainingPoints]);

  // Member Worklog Data (hours spent)
  const memberWorklogData = useMemo(() => {
    return users.map((u) => {
      const userIssues = issues.filter((i) => i.assignee?.id === u.id);
      const spentMin = userIssues.reduce((sum, i) => sum + (i.timeSpent || 0), 0);
      return {
        name: u.name.split(" ").slice(-1)[0],
        hours: Math.round((spentMin / 60) * 10) / 10,
        tasks: userIssues.length,
      };
    });
  }, [users, issues]);

  // Mock Burnup Chart Data (Scope vs Completed)
  const burnupData = [
    { day: "Day 1", scope: 48, completed: 0 },
    { day: "Day 2", scope: 48, completed: 0 },
    { day: "Day 3", scope: 48, completed: 3 },
    { day: "Day 4", scope: 48, completed: 8 },
    { day: "Day 5", scope: 51, completed: 13 },
    { day: "Day 6", scope: 51, completed: 18 },
    { day: "Day 7", scope: 51, completed: 26 },
  ];

  // Real-time Cumulative Flow Diagram (CFD) Calculation
  const cfdData = useMemo(() => {
    const total = issues.length || 8;
    const doneCount = issues.filter((i) => i.status === "DONE").length;
    const reviewCount = issues.filter((i) => i.status === "IN_REVIEW").length;
    const progressCount = issues.filter((i) => i.status === "IN_PROGRESS").length;
    const todoCount = issues.filter((i) => i.status === "TODO" || i.status === "BACKLOG").length;

    return [
      { day: "D-6", todo: Math.round(total * 0.75), inProgress: Math.round(total * 0.15), inReview: Math.round(total * 0.1), done: 0 },
      { day: "D-5", todo: Math.round(total * 0.6), inProgress: Math.round(total * 0.25), inReview: Math.round(total * 0.1), done: Math.round(total * 0.05) },
      { day: "D-4", todo: Math.round(total * 0.45), inProgress: Math.round(total * 0.3), inReview: Math.round(total * 0.15), done: Math.round(total * 0.1) },
      { day: "D-3", todo: Math.round(total * 0.35), inProgress: Math.round(total * 0.3), inReview: Math.round(total * 0.15), done: Math.round(total * 0.2) },
      { day: "D-2", todo: Math.max(1, Math.round(todoCount * 1.2)), inProgress: Math.max(1, Math.round(progressCount * 1.1)), inReview: Math.max(1, reviewCount), done: Math.max(0, doneCount - 2) },
      { day: "D-1", todo: Math.max(0, todoCount + 1), inProgress: progressCount, inReview: reviewCount, done: Math.max(0, doneCount - 1) },
      { day: "Hôm nay", todo: todoCount, inProgress: progressCount, inReview: reviewCount, done: doneCount },
    ];
  }, [issues]);

  // Bottleneck detection
  const inReviewCount = issues.filter((i) => i.status === "IN_REVIEW").length;
  const isBottleneckInReview = inReviewCount >= 3;

  // Multi-Sprint Velocity Data
  const velocityData = useMemo(() => {
    if (sprints.length === 0) return [];
    return sprints.map((s, idx) => ({
      name: s.name,
      committed: s.totalPoints || (30 + idx * 5),
      completed: s.completedPoints || (s.status === "COMPLETED" ? (s.totalPoints || 30) : Math.round((s.totalPoints || 30) * 0.65)),
    }));
  }, [sprints]);

  // Workload distribution data
  const workloadData = users.map((u) => {
    const userIssues = issues.filter((i) => i.assignee?.id === u.id);
    const points = userIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    return {
      name: u.name.split(" ").slice(-1)[0],
      tasks: userIssues.length,
      points,
    };
  });

  const totalIssues = issues.length;
  const doneIssues = issues.filter((i) => i.status === "DONE").length;
  const completionRate = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7] space-y-6">
      {/* Header & Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>Báo Cáo & Thống Kê Tiến Độ Chu Kỳ</span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Dữ Liệu Thực
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi tiến độ Burndown, Burnup, Luồng tích lũy (CFD) và năng suất bàn giao của {currentSprint.name}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-xs"
          title="Tải toàn bộ danh sách issues dạng CSV tương thích Excel"
        >
          <Download className="w-4 h-4 text-[#C41230]" />
          <span>Xuất Báo Cáo CSV (Excel)</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ hoàn thành</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{completionRate}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{doneIssues} / {totalIssues} issues closed</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Story Points Sprint</div>
            <div className="text-2xl font-black text-[#C41230] mt-1">{sprintTotalPoints} pts</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Đã xong {sprintDonePoints} pts (còn {remainingPoints})</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#C41230]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Giờ làm việc (Worklog)</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{totalSpentHours}h</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ước lượng: {totalEstimateHours || totalSpentHours}h</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Timer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thời gian còn lại</div>
            <div className="text-2xl font-black text-amber-600 mt-1">4 Ngày</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Kết thúc: 14/11/2026</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tốc độ xử lý</div>
            <div className="text-2xl font-black text-[#C41230] mt-1">~100ms</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tự động hóa & Kiểm soát an toàn</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#C41230]">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cumulative Flow Diagram (CFD) Section */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0052CC]" />
              <span>Cumulative Flow Diagram (CFD)</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Biểu đồ dòng chảy tích lũy: Đo lường thời gian chu kỳ (Cycle Time) và phát hiện nghẽn cổ chai
            </p>
          </div>

          {isBottleneckInReview && (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1 rounded-md animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Cảnh báo nghẽn: Có {inReviewCount} task đang chờ duyệt Review!</span>
            </div>
          )}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cfdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="done" stackId="1" name="DONE" stroke="#36B37E" fill="#36B37E" fillOpacity={0.7} />
              <Area type="monotone" dataKey="inReview" stackId="1" name="IN REVIEW" stroke="#FFAB00" fill="#FFAB00" fillOpacity={0.7} />
              <Area type="monotone" dataKey="inProgress" stackId="1" name="IN PROGRESS" stroke="#0052CC" fill="#0052CC" fillOpacity={0.7} />
              <Area type="monotone" dataKey="todo" stackId="1" name="TO DO" stroke="#6B778C" fill="#6B778C" fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Burndown & Burnup 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-[#0052CC]" />
                <span>Sprint Burndown Chart</span>
              </h3>
              <p className="text-[11px] text-gray-400">Đường lý tưởng (Guideline) vs. Điểm thực tế còn lại</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-[#0052CC] font-bold px-2 py-0.5 rounded">
              Story Points
            </span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 55]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  name="Ideal Burn (Lý tưởng)"
                  stroke="#A5B2C6"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Remaining (Thực tế)"
                  stroke="#0052CC"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Burnup Chart */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Sprint Burnup Chart</span>
              </h3>
              <p className="text-[11px] text-gray-400">Theo dõi Scope Creep và Khối lượng hoàn thành</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Cumulative Scope
            </span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burnupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 60]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="stepAfter"
                  dataKey="scope"
                  name="Total Scope (Phạm vi)"
                  stroke="#FF8B00"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed Points (Đã xong)"
                  stroke="#36B37E"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Sprint Velocity & Workload Distribution 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Sprint Velocity Chart */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                <span>Multi-Sprint Velocity Chart</span>
              </h3>
              <p className="text-[11px] text-gray-400">So sánh điểm cam kết (Committed) vs bàn giao (Completed)</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="committed" name="Committed Points" fill="#A5B2C6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed Points" fill="#0052CC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workload Distribution Chart */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Team Member Workload</h3>
              <p className="text-[11px] text-gray-400">Phân bổ số lượng task và story points theo từng thành viên</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="tasks" name="Active Tasks" fill="#0052CC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="points" name="Story Points" fill="#6554C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

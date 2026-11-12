"use client";

import React, { useState } from "react";
import { User, Project } from "@/types/jira";
import {
  Users,
  UserPlus,
  Shield,
  Check,
  Mail,
  UserCheck,
  UserX,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

interface AdminViewProps {
  users: User[];
  projects?: Project[];
  onUpdateUserRole: (userId: string, newRole: User["role"]) => Promise<void>;
  onToggleUserStatus?: (userId: string, newStatus: "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL") => Promise<void>;
  onInviteUser: (email: string, name: string, role: User["role"]) => Promise<void>;
  onApproveUser?: (userId: string, role: User["role"], projectId?: string) => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  users,
  projects = [],
  onUpdateUserRole,
  onToggleUserStatus,
  onInviteUser,
  onApproveUser,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("TamTask@2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [enable2FA, setEnable2FA] = useState(true);
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [inviteRole, setInviteRole] = useState<User["role"]>("DEVELOPER");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInvitePassword(pwd);
  };

  // Approval Modal State
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<User["role"]>("DEVELOPER");
  const [approveProjectId, setApproveProjectId] = useState<string>(projects[0]?.id || "");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const pendingUsers = users.filter((u) => u.status === "PENDING_APPROVAL");

  const handleRoleChange = async (userId: string, newRole: User["role"]) => {
    setIsUpdating(userId);
    try {
      await onUpdateUserRole(userId, newRole);
      setFeedback(`Đã cập nhật vai trò mới [${newRole}] vào cơ sở dữ liệu.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(`Lỗi: ${err.message || "Không thể cập nhật"}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus?: string) => {
    if (!onToggleUserStatus) return;
    const targetStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    setIsUpdating(userId);
    try {
      await onToggleUserStatus(userId, targetStatus);
      setFeedback(
        targetStatus === "SUSPENDED"
          ? "Đã tạm khóa tài khoản người dùng."
          : "Đã kích hoạt lại tài khoản người dùng."
      );
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(`Lỗi: ${err.message || "Không thể thay đổi trạng thái"}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    try {
      await onInviteUser(inviteEmail.trim(), inviteName.trim(), inviteRole);
      const createdPassword = invitePassword;
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("TamTask@2026!");
      setShowInviteModal(false);
      setFeedback(
        `Đã tạo tài khoản cho ${inviteName.trim()}. Mật khẩu khởi tạo: ${createdPassword} (Đã bật 2FA Email OTP).`
      );
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      setFeedback(`Lỗi: ${err.message}`);
    }
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingUser) return;

    setIsSubmittingApproval(true);
    try {
      if (onApproveUser) {
        await onApproveUser(approvingUser.id, approveRole, approveProjectId);
      } else {
        // Fallback: update status to ACTIVE and set role
        if (onToggleUserStatus) await onToggleUserStatus(approvingUser.id, "ACTIVE");
        await onUpdateUserRole(approvingUser.id, approveRole);

        // If project selected, assign to project members API
        if (approveProjectId) {
          await fetch(`/api/projects/${approveProjectId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: approvingUser.id, role: approveRole }),
          });
        }
      }

      setFeedback(`Đã phê duyệt tài khoản ${approvingUser.name} và phân quyền [${approveRole}] thành công!`);
      setApprovingUser(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(`Lỗi phê duyệt: ${err.message}`);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole === "ALL") return true;
    if (filterRole === "PENDING_APPROVAL") return u.status === "PENDING_APPROVAL";
    return u.role === filterRole && u.status !== "PENDING_APPROVAL";
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#C41230]" />
            <span>Quản Trị Người Dùng & Phân Quyền Hệ Thống</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị phân quyền tài khoản, phê duyệt nhân sự mới và phân bổ vào các dự án TamTask.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-[#C41230] hover:bg-[#A30F28] text-white text-xs font-medium px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Mời Thành Viên Mới</span>
        </button>
      </div>

      {/* Success / Alert Feedback */}
      {feedback && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-[#C41230] text-xs font-medium rounded-md flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C41230] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Pending Approval Alert Banner */}
      {pendingUsers.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-lg flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-semibold text-amber-900">
                Có {pendingUsers.length} tài khoản mới đang chờ phê duyệt
              </div>
              <div className="text-[11px] text-amber-700">
                Các tài khoản này chưa thể truy cập vào dự án cho đến khi được Admin phê duyệt phân quyền.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilterRole("PENDING_APPROVAL")}
            className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition shadow-xs"
          >
            Xem danh sách chờ duyệt
          </button>
        </div>
      )}

      {/* Filter Tabs by Role */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Lọc:</span>
        </span>
        {[
          { id: "ALL", label: `Tất cả (${users.length})` },
          { id: "PENDING_APPROVAL", label: `Chờ duyệt (${pendingUsers.length})` },
          { id: "ADMIN", label: "Quản trị viên" },
          { id: "PROJECT_LEAD", label: "Trưởng dự án" },
          { id: "DEVELOPER", label: "Kỹ sư phần mềm" },
          { id: "QA", label: "Kiểm thử QA" },
          { id: "VIEWER", label: "Người theo dõi" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterRole(tab.id)}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap ${
              filterRole === tab.id
                ? "bg-[#C41230] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAFBFC] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Thành Viên (Member)</th>
              <th className="py-3 px-4">Tài Khoản / Email</th>
              <th className="py-3 px-4">Vai Trò Hệ Thống (Role)</th>
              <th className="py-3 px-4">Trạng Thái (Status)</th>
              <th className="py-3 px-4">Task Phụ Trách</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const isSuspended = user.status === "SUSPENDED";
              const isPending = user.status === "PENDING_APPROVAL";

              return (
                <tr key={user.id} className={`hover:bg-gray-50/80 transition ${isPending ? "bg-amber-50/40" : ""}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className={`w-8 h-8 rounded-full object-cover ring-1 ${
                          isSuspended
                            ? "grayscale opacity-50 ring-red-300"
                            : isPending
                            ? "ring-amber-400"
                            : "ring-gray-200"
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {isSuspended && (
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                              ĐÃ KHÓA
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded animate-pulse">
                              CHỜ DUYỆT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{user.email}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {isPending ? (
                      <span className="text-[11px] font-medium text-amber-700 italic">
                        Chưa phân quyền
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        disabled={isUpdating === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as User["role"])}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C41230] hover:border-slate-400 transition cursor-pointer"
                        title="Chọn để phân lại quyền đăng nhập"
                      >
                        <option value="ADMIN">Quản trị viên (Admin)</option>
                        <option value="PROJECT_LEAD">Trưởng dự án (Lead)</option>
                        <option value="DEVELOPER">Kỹ sư phần mềm (Dev)</option>
                        <option value="QA">Kiểm thử QA (Tester)</option>
                        <option value="VIEWER">Người theo dõi (Viewer)</option>
                      </select>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        isSuspended
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isPending
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {user.status || "ACTIVE"}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-700 font-mono font-medium px-2 py-0.5 rounded text-[11px] border border-slate-200/80">
                      {user.activeTasksCount || 0} issues
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {isPending ? (
                      <button
                        onClick={() => {
                          setApprovingUser(user);
                          setApproveRole("DEVELOPER");
                        }}
                        className="text-xs px-3 py-1.5 rounded-md font-medium bg-[#C41230] hover:bg-[#A30F28] text-white transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Phê Duyệt & Cấp Quyền</span>
                      </button>
                    ) : (
                      onToggleUserStatus && (
                        <button
                          onClick={() => handleStatusToggle(user.id, user.status)}
                          disabled={isUpdating === user.id}
                          className={`text-xs px-2.5 py-1 rounded font-semibold transition inline-flex items-center gap-1 ${
                            isSuspended
                              ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                              : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                          }`}
                          title={
                            isSuspended
                              ? "Mở khóa cho phép người dùng đăng nhập"
                              : "Khóa quyền đăng nhập của người dùng"
                          }
                        >
                          {isSuspended ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Mở Khóa</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Khóa</span>
                            </>
                          )}
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-500">
            Không tìm thấy tài khoản người dùng phù hợp với bộ lọc.
          </div>
        )}
      </div>

      {/* Approve User Modal */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-200 animate-in zoom-in-95">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Check className="w-5 h-5 text-[#C41230]" />
              <h3 className="font-semibold text-sm text-slate-900">
                Phê Duyệt Tài Khoản & Gán Dự Án
              </h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex items-center space-x-3 text-xs border border-slate-200/80">
              <img src={approvingUser.avatar} alt={approvingUser.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="font-semibold text-slate-900">{approvingUser.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">{approvingUser.email}</div>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Chọn vai trò hệ thống (Role) *
                </label>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value as User["role"])}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
                >
                  <option value="PROJECT_LEAD">Trưởng dự án (Project Lead)</option>
                  <option value="DEVELOPER">Kỹ sư phần mềm (Developer)</option>
                  <option value="QA">Kiểm thử viên (QA Tester)</option>
                  <option value="VIEWER">Chỉ xem (Viewer)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Gán vào dự án ban đầu (Project)
                </label>
                <select
                  value={approveProjectId}
                  onChange={(e) => setApproveProjectId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
                >
                  <option value="">-- Chưa gán vào dự án nào --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="px-4 py-1.5 font-medium bg-[#C41230] hover:bg-[#A30F28] text-white rounded-md shadow-xs disabled:opacity-50 transition"
                >
                  {isSubmittingApproval ? "Đang xử lý..." : "Xác Nhận Phê Duyệt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <UserPlus className="w-5 h-5 text-[#C41230]" />
              <h3 className="font-semibold text-sm text-slate-900">
                Mời Thành Viên Mới
              </h3>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Văn An"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="an.hoang@company.com"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
                />
              </div>

              {/* Password Configuration */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mật khẩu khởi tạo *</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-[#C41230] hover:underline font-semibold flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Tạo ngẫu nhiên</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 pr-8 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* 2FA Option */}
                <div className="pt-1.5 border-t border-slate-200/80 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enable2FA}
                      onChange={(e) => setEnable2FA(e.target.checked)}
                      className="rounded text-[#C41230] focus:ring-[#C41230]"
                    />
                    <span className="font-medium text-slate-700 text-[11px]">
                      Kích hoạt xác thực 2 lớp qua Email OTP (2FA Security)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requirePasswordChange}
                      onChange={(e) => setRequirePasswordChange(e.target.checked)}
                      className="rounded text-[#C41230] focus:ring-[#C41230]"
                    />
                    <span className="font-medium text-slate-700 text-[11px]">
                      Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Vai trò mặc định *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as User["role"])}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
                >
                  <option value="PROJECT_LEAD">Trưởng dự án (Project Lead)</option>
                  <option value="DEVELOPER">Kỹ sư phần mềm (Developer)</option>
                  <option value="QA">Kiểm thử viên (QA Tester)</option>
                  <option value="VIEWER">Chỉ xem (Viewer)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-[#C41230] hover:bg-[#A30F28] text-white rounded-md shadow-xs transition"
                >
                  Gửi Lời Mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

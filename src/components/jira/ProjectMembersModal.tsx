"use client";

import React, { useState, useEffect } from "react";
import { User, Project, ProjectMember } from "@/types/jira";
import {
  X,
  UserPlus,
  Trash2,
  Shield,
  UserCheck,
  AlertCircle,
  Check,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

interface ProjectMembersModalProps {
  isOpen: boolean;
  project: Project | null;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onMembersUpdated?: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  project,
  currentUser,
  allUsers,
  onClose,
  onMembersUpdated,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<"existing" | "new">("existing");

  // Mode 1: Existing user assign
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"PROJECT_LEAD" | "DEVELOPER" | "QA" | "VIEWER">("DEVELOPER");

  // Mode 2: Provision new user with password & 2FA
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("TamTask@2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [enable2FA, setEnable2FA] = useState(true);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = currentUser.role === "ADMIN" || currentUser.role === "PROJECT_LEAD";

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(pwd);
  };

  const fetchMembers = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to fetch project members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchMembers();
      setSelectedUserId("");
    }
  }, [isOpen, project]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  // Filter users not yet members of this project
  const memberUserIds = new Set(members.map((m) => m.userId));
  const availableUsers = allUsers.filter(
    (u) => !memberUserIds.has(u.id) && u.status !== "PENDING_APPROVAL"
  );

  const handleAddExistingMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      if (res.ok) {
        setFeedback("Đã thêm nhân sự vào dự án thành công!");
        setSelectedUserId("");
        fetchMembers();
        onMembersUpdated?.();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const err = await res.json();
        setFeedback(`Lỗi: ${err.error || "Không thể thêm nhân sự"}`);
      }
    } catch (err: any) {
      setFeedback(`Lỗi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword) return;

    setIsSubmitting(true);
    try {
      // 1. Create user in database
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          name: newUserName.trim(),
          role: selectedRole,
          password: newUserPassword,
          isTwoFactorEnabled: enable2FA,
        }),
      });

      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.error || "Không thể tạo tài khoản người dùng");
      }

      const createdUser = await userRes.json();

      // 2. Assign to current project
      const assignRes = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createdUser.id,
          role: selectedRole,
        }),
      });

      if (assignRes.ok) {
        setFeedback(
          `Đã tạo nhân sự ${newUserName.trim()} & gán vào dự án! Mật khẩu: ${newUserPassword} (2FA: ${
            enable2FA ? "Bật" : "Tắt"
          })`
        );
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("TamTask@2026!");
        fetchMembers();
        onMembersUpdated?.();
        setTimeout(() => setFeedback(null), 6000);
      } else {
        const err = await assignRes.json();
        setFeedback(`Lỗi gán dự án: ${err.error || "Không thể gán vào dự án"}`);
      }
    } catch (err: any) {
      setFeedback(`Lỗi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setFeedback("Đã cập nhật vai trò nhân sự trong dự án.");
        fetchMembers();
        onMembersUpdated?.();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err: any) {
      setFeedback(`Lỗi: ${err.message}`);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn rút nhân sự này khỏi dự án?")) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/members?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedback("Đã rút nhân sự khỏi dự án.");
        fetchMembers();
        onMembersUpdated?.();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err: any) {
      setFeedback(`Lỗi: ${err.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(27,27,27,0.6)] backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#D7D7D7] dark:border-zinc-800 animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D7D7D7] dark:border-zinc-800 flex items-center justify-between bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EE0033] flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {project.key.slice(0, 3)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Quản Lý Nhân Sự Dự Án</span>
                <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-[#111827] dark:text-zinc-200 font-mono font-medium px-2.5 py-0.5 rounded-full border border-[#D7D7D7] dark:border-zinc-700">
                  {project.name} ({project.key})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Phân bổ nhân sự, cấu hình quyền và bảo mật 2FA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-zinc-900">
          {feedback && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-[#EE0033] text-xs font-medium rounded-lg flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-[#EE0033] shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Form Assign / Create Member */}
          {canManage && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-700/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("existing")}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition ${
                      mode === "existing"
                        ? "bg-[#EE0033] text-white shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
                    }`}
                  >
                    Gán Nhân Sự Có Sẵn
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition flex items-center gap-1 ${
                      mode === "new"
                        ? "bg-[#EE0033] text-white shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
                    }`}
                  >
                    <span>+ Thêm & Cấp Mật Khẩu (2FA)</span>
                  </button>
                </div>
              </div>

              {mode === "existing" ? (
                <form onSubmit={handleAddExistingMember} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                        className="w-full text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      >
                        <option value="">-- Chọn nhân sự từ hệ thống ({availableUsers.length} khả dụng) --</option>
                        {availableUsers.map((u) => (
                          <option key={u.id} value={u.id} className="dark:bg-zinc-800">
                            {u.name} ({u.email}) - {u.role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as any)}
                        className="w-full text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      >
                        <option value="PROJECT_LEAD" className="dark:bg-zinc-800">Trưởng dự án (Lead)</option>
                        <option value="DEVELOPER" className="dark:bg-zinc-800">Kỹ sư phần mềm (Dev)</option>
                        <option value="QA" className="dark:bg-zinc-800">Kiểm thử QA (Tester)</option>
                        <option value="VIEWER" className="dark:bg-zinc-800">Chỉ xem (Viewer)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!selectedUserId || isSubmitting}
                      className="px-5 py-2 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 focus:ring-3 focus:ring-[#EE0033]/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? "Đang gán..." : "Gán Vào Dự Án"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateAndAssignMember} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Ví dụ: Hoàng Tuấn Anh"
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="tuananh@company.com"
                        className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      />
                    </div>
                  </div>

                  {/* Password & 2FA Configuration */}
                  <div className="p-3.5 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                        <span>Mật khẩu khởi tạo *</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-[#EE0033] hover:underline font-semibold flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Tạo ngẫu nhiên</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 pr-9 text-slate-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-700/60 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enable2FA}
                          onChange={(e) => setEnable2FA(e.target.checked)}
                          className="rounded text-[#EE0033] focus:ring-[#EE0033]"
                        />
                        <span className="font-medium text-slate-700 dark:text-zinc-300 text-[11px]">
                          Kích hoạt xác thực 2 lớp qua Email OTP (2FA)
                        </span>
                      </label>
                      <div className="flex items-center gap-1 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Bảo mật 2FA</span>
                      </div>
                    </div>
                  </div>

                  {/* Role in Project */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Vai trò trong dự án *</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                    >
                      <option value="PROJECT_LEAD" className="dark:bg-zinc-800">Trưởng dự án (Lead)</option>
                      <option value="DEVELOPER" className="dark:bg-zinc-800">Kỹ sư phần mềm (Dev)</option>
                      <option value="QA" className="dark:bg-zinc-800">Kiểm thử QA (Tester)</option>
                      <option value="VIEWER" className="dark:bg-zinc-800">Chỉ xem (Viewer)</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 text-xs font-semibold bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 focus:ring-3 focus:ring-[#EE0033]/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? "Đang tạo..." : "Tạo & Cấp Quyền Vào Dự Án"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Members Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Danh Sách Thành Viên Dự Án ({members.length})
              </h4>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">Đang tải danh sách nhân sự...</div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700">
                Chưa có nhân sự nào được gán vào dự án này.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                {members.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition">
                    <div className="flex items-center space-x-3">
                      <img
                        src={m.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"}
                        alt={m.user?.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-zinc-700"
                      />
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{m.user?.name}</span>
                          {m.user?.id === project.leadId && (
                            <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-[#EE0033] font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                              LEAD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{m.user?.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Role Selector */}
                      {canManage ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                          className="text-xs bg-[#FAFAFA] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full px-3 py-1 font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                        >
                          <option value="PROJECT_LEAD" className="dark:bg-zinc-800">Trưởng dự án</option>
                          <option value="DEVELOPER" className="dark:bg-zinc-800">Kỹ sư Dev</option>
                          <option value="QA" className="dark:bg-zinc-800">Kiểm thử QA</option>
                          <option value="VIEWER" className="dark:bg-zinc-800">Chỉ xem</option>
                        </select>
                      ) : (
                        <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium px-3 py-1 rounded-full">
                          {m.role}
                        </span>
                      )}

                      {/* Remove Button */}
                      {canManage && (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          title="Rút khỏi dự án"
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Quyền sửa đổi dự án giới hạn cho Admin & Trưởng dự án</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-full transition text-slate-700 dark:text-zinc-200 shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

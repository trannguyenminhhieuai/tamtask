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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {project.key.slice(0, 3)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>Quản Lý Nhân Sự Dự Án</span>
                <span className="text-xs bg-slate-100 text-slate-700 font-mono font-medium px-2 py-0.5 rounded border border-slate-200">
                  {project.name} ({project.key})
                </span>
              </h3>
              <p className="text-xs text-slate-500">Phân bổ nhân sự, cấu hình quyền và bảo mật 2FA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {feedback && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-[#EE0033] text-xs font-medium rounded-lg flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-[#EE0033] shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Form Assign / Create Member */}
          {canManage && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("existing")}
                    className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
                      mode === "existing"
                        ? "bg-[#EE0033] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    Gán Nhân Sự Có Sẵn
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className={`text-xs font-semibold px-3 py-1 rounded-md transition flex items-center gap-1 ${
                      mode === "new"
                        ? "bg-[#EE0033] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
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
                        className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      >
                        <option value="">-- Chọn nhân sự từ hệ thống ({availableUsers.length} khả dụng) --</option>
                        {availableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) - {u.role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      >
                        <option value="PROJECT_LEAD">Trưởng dự án (Lead)</option>
                        <option value="DEVELOPER">Kỹ sư phần mềm (Dev)</option>
                        <option value="QA">Kiểm thử QA (Tester)</option>
                        <option value="VIEWER">Chỉ xem (Viewer)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!selectedUserId || isSubmitting}
                      className="px-4 py-2 text-xs font-medium bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-md transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
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
                      <label className="block font-medium text-slate-700 mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Ví dụ: Hoàng Tuấn Anh"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="tuananh@company.com"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      />
                    </div>
                  </div>

                  {/* Password & 2FA Configuration */}
                  <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 pr-8 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enable2FA}
                          onChange={(e) => setEnable2FA(e.target.checked)}
                          className="rounded text-[#EE0033] focus:ring-[#EE0033]"
                        />
                        <span className="font-medium text-slate-700 text-[11px]">
                          Kích hoạt xác thực 2 lớp qua Email OTP (2FA)
                        </span>
                      </label>
                      <div className="flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Bảo mật 2FA</span>
                      </div>
                    </div>
                  </div>

                  {/* Role in Project */}
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Vai trò trong dự án *</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE0033]/20 focus:border-[#EE0033]"
                    >
                      <option value="PROJECT_LEAD">Trưởng dự án (Lead)</option>
                      <option value="DEVELOPER">Kỹ sư phần mềm (Dev)</option>
                      <option value="QA">Kiểm thử QA (Tester)</option>
                      <option value="VIEWER">Chỉ xem (Viewer)</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-medium bg-[#EE0033] hover:bg-[#D6002E] text-white rounded-md transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
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
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Danh Sách Thành Viên Dự Án ({members.length})
              </h4>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-gray-400">Đang tải danh sách nhân sự...</div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Chưa có nhân sự nào được gán vào dự án này.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                {members.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <img
                        src={m.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"}
                        alt={m.user?.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                      />
                      <div>
                        <div className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
                          <span>{m.user?.name}</span>
                          {m.user?.id === project.leadId && (
                            <span className="text-[10px] bg-rose-50 text-[#EE0033] font-bold px-1.5 py-0.2 rounded border border-rose-200">
                              LEAD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">{m.user?.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Role Selector */}
                      {canManage ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                          className="text-xs bg-white border border-gray-200 rounded px-2.5 py-1 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#EE0033]"
                        >
                          <option value="PROJECT_LEAD">Trưởng dự án</option>
                          <option value="DEVELOPER">Kỹ sư Dev</option>
                          <option value="QA">Kiểm thử QA</option>
                          <option value="VIEWER">Chỉ xem</option>
                        </select>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded">
                          {m.role}
                        </span>
                      )}

                      {/* Remove Button */}
                      {canManage && (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          title="Rút khỏi dự án"
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
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
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Quyền sửa đổi dự án giới hạn cho Admin & Trưởng dự án</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition text-slate-700 shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

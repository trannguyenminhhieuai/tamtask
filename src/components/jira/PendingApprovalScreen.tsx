"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { User } from "@/types/jira";
import { Clock, ShieldAlert, LogOut, RefreshCw, CheckCircle2, Sun, Moon } from "lucide-react";
import { AuthBackgroundIllustration } from "./AuthBackgroundIllustration";

interface PendingApprovalScreenProps {
  currentUser: User;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ currentUser }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (typeof window !== "undefined") {
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  const handleRefresh = () => {
    setIsChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090B] flex flex-col justify-between select-none font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Isometric Illustration (Jira-Style in TamTask Viettel Red / Rose Pink with Motion Graphics) */}
      <AuthBackgroundIllustration />

      {/* Header */}
      <header className="h-16 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-6 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center text-white shadow-md shadow-[#EE0033]/25 font-black text-xs tracking-wider">
            TT
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#111827] dark:text-zinc-100 leading-none">
              TamTask
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              Hệ thống quản lý công việc và dự án
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 shadow-2xs hover:scale-105 transition"
            title={isDarkMode ? "Giao diện Sáng" : "Giao diện Tối"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300 hover:text-[#EE0033] font-semibold px-3.5 py-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-zinc-700 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        <div className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(238,0,51,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-200/90 dark:border-zinc-800 p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-full flex items-center justify-center mx-auto text-[#EE0033] shadow-xs">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold px-3.5 py-1 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Trạng thái: Chờ Quản Trị Viên Phê Duyệt</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              Tài Khoản Đang Chờ Phân Quyền
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
              Chào mừng bạn đến với hệ thống <strong>TamTask</strong>. Thông tin tài khoản của bạn đã được ghi nhận an toàn trên cơ sở dữ liệu.
            </p>
          </div>

          {/* User Info Box */}
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 rounded-2xl flex items-center space-x-3.5 text-left">
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full border border-slate-300 dark:border-zinc-600 object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{currentUser.name}</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate">{currentUser.email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full">
                Vai trò tạm thời: Chưa phân quyền (Pending)
              </span>
            </div>
          </div>

          {/* Notice Policy */}
          <div className="text-xs text-rose-900 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 text-left space-y-1.5">
            <p className="font-bold text-[#EE0033] dark:text-rose-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#EE0033] shrink-0" />
              <span>Chính sách bảo mật dữ liệu TamTask:</span>
            </p>
            <p className="text-slate-700 dark:text-zinc-300 text-[11px] leading-relaxed">
              Để bảo mật tài nguyên dự án, mọi tài khoản mới đăng ký phải được <strong>Quản trị viên</strong> phê duyệt vai trò và gán vào các dự án cụ thể trước khi truy cập không gian làm việc.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isChecking}
              className="px-5 py-2.5 text-xs font-bold bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white rounded-full transition shadow-md shadow-[#EE0033]/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Đang kiểm tra..." : "Kiểm tra lại trạng thái"}</span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full transition border border-slate-200 dark:border-zinc-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

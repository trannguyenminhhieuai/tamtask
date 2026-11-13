"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { User } from "@/types/jira";
import { Clock, ShieldAlert, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";

interface PendingApprovalScreenProps {
  currentUser: User;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ currentUser }) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleRefresh = () => {
    setIsChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-between select-none font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#EE0033] flex items-center justify-center text-white shadow-xs font-black text-sm tracking-wider">
            TT
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">TamTask Work Hub</h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Quản Trị Công Việc & Dự Án</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 font-medium px-3 py-1.5 rounded-md hover:bg-rose-50 border border-slate-200 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center">
        <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-xs">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Trạng thái: Chờ Quản Trị Viên Phê Duyệt</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tài Khoản Đang Chờ Phân Quyền
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Chào mừng bạn đến với hệ thống <strong>TamTask</strong>. Thông tin tài khoản của bạn đã được ghi nhận an toàn trên cơ sở dữ liệu.
            </p>
          </div>

          {/* User Info Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-3 text-left">
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full border border-slate-300 object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</h4>
              <p className="text-xs text-slate-500 font-mono truncate">{currentUser.email}</p>
              <span className="inline-block mt-1 text-[10px] font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                Vai trò tạm thời: Chưa phân quyền (Pending)
              </span>
            </div>
          </div>

          {/* Notice Policy */}
          <div className="text-xs text-slate-600 bg-sky-50/60 border border-sky-200/80 rounded-lg p-3 text-left space-y-1">
            <p className="font-semibold text-sky-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Chính sách bảo mật dữ liệu TamTask:</span>
            </p>
            <p className="text-sky-800 text-[11px] leading-relaxed">
              Để bảo mật tài nguyên dự án, mọi tài khoản mới đăng ký phải được <strong>Quản trị viên</strong> phê duyệt vai trò và gán vào các dự án cụ thể trước khi truy cập không gian làm việc.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isChecking}
              className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Đang kiểm tra..." : "Kiểm tra lại trạng thái"}</span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition border border-slate-200"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 bg-white border-t border-gray-200 px-8 flex items-center justify-between text-xs text-gray-400">
        <span>TamTask Platform © 2026. All rights reserved.</span>
        <span>Hệ thống phân quyền bảo mật nhiều lớp</span>
      </footer>
    </div>
  );
};

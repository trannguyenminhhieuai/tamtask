"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  CheckSquare,
  TrendingUp,
} from "lucide-react";

export const AuthLandingScreen: React.FC = () => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage("Vui lòng nhập Email công việc!");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("demo-login", {
        redirect: false,
        email: emailInput.toLowerCase().trim(),
        role: "DEVELOPER",
        callbackUrl: "/",
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Đăng nhập thất bại. Vui lòng thử lại!");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between select-none font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between backdrop-blur-md bg-slate-900/60 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-600 flex items-center justify-center text-white shadow-md font-black text-sm tracking-tight border border-indigo-400/30">
            TT
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>TamTask</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Studio
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Smart Tasks for Bold Creators</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mã hóa AES-256 an toàn</span>
          </div>
        </div>
      </header>

      {/* Main Interactive Split Layout */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Login Form (5 Cols) */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Đăng nhập không gian làm việc
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Truy cập bảng công việc, kế hoạch chu kỳ và các tính năng quản trị dự án thông minh.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-2xl shadow-2xl border border-slate-800 p-7 space-y-5 backdrop-blur-xl">
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 py-2.5 rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập với Google Workspace</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Hoặc tài khoản Email
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ten.nguyen@company.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-9 pr-9 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <span>{isLoading ? "Đang xử lý..." : "Đăng Nhập"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Product & Project Showcase (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 hidden lg:block">
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-8 relative overflow-hidden backdrop-blur-xl">
            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Không Gian Dự Án Thông Minh
                  </span>
                </div>
                <div className="text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
                  Sprint Hiện Tại: 48 pts
                </div>
              </div>

              {/* Animated Micro-Kanban Preview */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {/* Column 1 */}
                <div className="bg-slate-800/70 rounded-2xl p-3 border border-slate-700/60 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Ý Tưởng (To do)</span>
                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full text-slate-300">2</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow-xs space-y-1">
                    <span className="text-[9px] font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">
                      #Feature
                    </span>
                    <p className="text-xs font-semibold text-white">Kiến trúc đa dự án độc lập</p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow-xs space-y-1">
                    <span className="text-[9px] font-bold text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800">
                      #UI/UX
                    </span>
                    <p className="text-xs font-semibold text-white">Bảng kéo thả 60fps mượt mà</p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="bg-slate-800/70 rounded-2xl p-3 border border-slate-700/60 space-y-2">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Đang Xử Lý</span>
                    <span className="text-[10px] bg-indigo-950 px-1.5 py-0.2 rounded-full text-indigo-300">1</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-indigo-500/40 shadow-xs space-y-1.5 ring-1 ring-indigo-500/20">
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                      #High Priority
                    </span>
                    <p className="text-xs font-semibold text-white">Xác thực 2 lớp qua Email OTP</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full w-4/5"></div>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="bg-slate-800/70 rounded-2xl p-3 border border-slate-700/60 space-y-2">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Đã Phát Hành</span>
                    <span className="text-[10px] bg-emerald-950 px-1.5 py-0.2 rounded-full text-emerald-300">3</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow-xs space-y-1">
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                      #Done
                    </span>
                    <p className="text-xs font-semibold text-white">Command Palette (⌘K)</p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow-xs space-y-1">
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                      #Done
                    </span>
                    <p className="text-xs font-semibold text-white">Hoàn tác tức thời (Ctrl+Z)</p>
                  </div>
                </div>
              </div>

              {/* Inspiration Quote */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="italic">
                    &ldquo;From Concept to Reality — Shape your vision with speed and elegance.&rdquo;
                  </span>
                </div>
                <div className="font-semibold text-slate-300">TamTask Studio</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-800/80 px-8 flex items-center justify-between text-xs text-slate-500">
        <div>TamTask © 2026. Nền tảng quản trị công việc cá nhân hóa.</div>
        <div className="flex items-center space-x-4">
          <span>Bảo mật dữ liệu chuẩn quốc tế</span>
          <span>•</span>
          <span>Zero Data Retention</span>
        </div>
      </footer>
    </div>
  );
};

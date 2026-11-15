"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { AuthBackgroundIllustration } from "./AuthBackgroundIllustration";

export const AuthLandingScreen: React.FC = () => {
  // Empty inputs - Do not prefill or reveal any accounts
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "2fa" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" }, { prompt: "select_account" });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setOtpNotice(null);
    if (!emailInput.trim() || !passwordInput) {
      setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-otp",
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Mật khẩu không chính xác. Vui lòng kiểm tra lại!");
      }

      if (data.requires2FA) {
        setStep("2fa");
        setTimeLeft(data.expiresInSeconds || 300);
        setOtpNotice(data.message || `Mã xác thực đã được gửi tới email ${emailInput.trim()}`);
      } else {
        await completeLogin(emailInput.trim());
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Đăng nhập thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage("Vui lòng nhập đầy đủ mã OTP 6 chữ số nhận từ email!");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: emailInput.trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Mã OTP không đúng hoặc đã hết hạn!");
      }

      await completeLogin(emailInput.trim());
    } catch (err: any) {
      setErrorMessage(err?.message || "Mã OTP không hợp lệ!");
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = async (email: string) => {
    const res = await signIn("demo-login", {
      redirect: false,
      email: email.toLowerCase().trim(),
      otpVerified: "true",
      callbackUrl: "/",
    });

    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090B] text-[#111827] dark:text-zinc-100 flex flex-col justify-between select-none font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Isometric Illustration (Jira-Style in TamTask Viettel Red / Rose Pink with Motion Graphics) */}
      <AuthBackgroundIllustration />

      {/* Top Right Controls: Theme Mode Switch (Dark / Light) */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-30">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/85 dark:bg-zinc-800/85 backdrop-blur-md border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 shadow-sm hover:scale-105 active:scale-95 transition-all"
          title={isDarkMode ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Centered Login Section - Clean Jira Style with TamTask Red */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        <div className="w-full max-w-[420px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(238,0,51,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-200/90 dark:border-zinc-800 p-7 sm:p-9 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Card Top Brand - Logo & System Wording */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center text-white text-base font-black shadow-lg shadow-[#EE0033]/25 mx-auto mb-2.5">
              TT
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-zinc-100 tracking-tight">
              TamTask
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Hệ thống quản lý công việc và dự án
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[#EE0033] dark:text-rose-300 text-xs rounded-xl font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {step === "credentials" ? (
            <>
              {/* Google Workspace Login (Prompt Account Chooser) - PRIMARY */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2.5 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 py-2.5 rounded-xl text-xs font-semibold transition shadow-2xs disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Đăng nhập với Google</span>
              </button>

              {/* Or Email Login Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Hoặc tiếp tục với email
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Nhập email của bạn..."
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/15 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/15 transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded text-[#EE0033] focus:ring-[#EE0033] accent-[#EE0033]"
                    />
                    <span className="text-[11px] font-medium">Nhớ thông tin đăng nhập của tôi</span>
                  </label>
                </div>

                {/* Main Submit Button - Viettel Red */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-[#EE0033]/25 disabled:opacity-50 mt-1 focus:ring-3 focus:ring-[#EE0033]/25"
                >
                  <span>{isLoading ? "Đang xác thực..." : "Tiếp tục"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#EE0033]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#EE0033]" />
                    <span>Xác Thực 2 Lớp (2FA)</span>
                  </div>
                  <span className="font-mono bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    {formatTimer(timeLeft)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  Mã OTP đã gửi trực tiếp tới email: <strong>{emailInput}</strong>.
                </p>
                {otpNotice && (
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 italic mt-0.5">
                    {otpNotice}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-zinc-100 mb-1.5 text-center">
                  Nhập mã OTP 6 chữ số
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full text-center text-lg tracking-[0.35em] font-mono font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2.5 text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="w-1/3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-2/3 bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? "Đang xác minh..." : "Xác nhận"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer Card Links (Like Jira) */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              Bạn không đăng nhập được? Liên hệ Quản trị viên
            </span>
          </div>
        </div>
      </main>

    </div>
  );
};

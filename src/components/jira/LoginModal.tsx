"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { X, Mail, Lock, ShieldCheck, KeyRound, ArrowRight, Eye, EyeOff, RefreshCw, CheckCircle2 } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  // Empty inputs by default - Never prefill or expose credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Countdown timer for 2FA
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "2fa" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setOtpCode("");
      setStep("credentials");
      setError(null);
      setOtpNotice(null);
      setShowPassword(false);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpNotice(null);

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify password & trigger 2FA email delivery from server
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-otp",
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mật khẩu không chính xác. Vui lòng kiểm tra lại!");
      }

      if (data.requires2FA) {
        setStep("2fa");
        setTimeLeft(data.expiresInSeconds || 300);
        setOtpNotice(data.message || `Mã xác thực 6 chữ số đã được gửi đến email ${email.trim()}.`);
      } else {
        // Direct sign in if 2FA is disabled
        await performSignIn(email.trim());
      }
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP 6 chữ số nhận được trong email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 2. Verify OTP with server (single-use)
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: email.trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Mã OTP không đúng hoặc đã hết hạn!");
      }

      // 3. Establish official authenticated session
      await performSignIn(email.trim());
    } catch (err: any) {
      setError(err?.message || "Mã OTP không hợp lệ.");
    } finally {
      setIsLoading(false);
    }
  };

  const performSignIn = async (userEmail: string) => {
    const signInRes = await signIn("demo-login", {
      email: userEmail.toLowerCase(),
      otpVerified: "true",
      redirect: false,
      callbackUrl: "/",
    });

    if (signInRes?.error) {
      setError(signInRes.error);
    } else {
      onClose();
      window.location.reload();
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-otp",
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimeLeft(300);
        setOtpNotice(`Đã gửi lại mã OTP mới tới email ${email.trim()}!`);
      } else {
        setError(data.error || "Không thể gửi lại mã OTP.");
      }
    } catch (err: any) {
      setError("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" }, { prompt: "select_account" });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-full max-w-sm overflow-hidden border border-white/60 dark:border-white/10 p-7 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition absolute right-4 top-4"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center pt-2 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-[#EE0033]/25 mx-auto mb-3">
            TT
          </div>
          <h2 className="text-xl font-extrabold text-[#111827] dark:text-zinc-100 tracking-tight">
            TamTask
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Đăng nhập để điều hành công việc dự án
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-medium text-[#EE0033] animate-in fade-in">
              {error}
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email tài khoản *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full text-xs bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/15 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Mật khẩu xác thực *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full text-xs bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-10 py-2.5 text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white text-xs font-bold py-3 rounded-full transition shadow-md shadow-[#EE0033]/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 focus:ring-3 focus:ring-[#EE0033]/25"
              >
                <span>{isLoading ? "Đang kiểm tra mật khẩu..." : "Tiếp Tục"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#EE0033]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#EE0033]" />
                    <span>Xác Thực 2 Lớp (2FA)</span>
                  </div>
                  <span className="text-[11px] font-mono text-rose-900 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full font-bold">
                    {formatTimer(timeLeft)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  Mã OTP đã gửi tới email <strong>{email}</strong>:
                </p>
                {otpNotice && (
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 italic mt-0.5">
                    {otpNotice}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-zinc-200 mb-1.5 text-center">
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
                    className="w-full text-center text-lg tracking-[0.35em] font-mono font-bold bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl py-2.5 text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || timeLeft > 270}
                  className="text-[11px] text-[#EE0033] hover:underline font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Gửi lại mã</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                >
                  Đổi tài khoản
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="w-1/3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold py-2.5 rounded-full border border-slate-200 dark:border-zinc-700 transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-2/3 bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white text-xs font-bold py-2.5 rounded-full transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? "Đang xác minh..." : "Xác Nhận"}</span>
                </button>
              </div>
            </form>
          )}

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 absolute">
              HOẶC
            </span>
          </div>

          {/* Real Google OAuth */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/80 text-[#111827] dark:text-zinc-200 py-2.5 rounded-full text-xs font-semibold transition shadow-2xs"
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
              <span>Đăng nhập nhanh với Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

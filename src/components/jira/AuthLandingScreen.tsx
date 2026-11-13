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
} from "lucide-react";

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
    signIn("google", { callbackUrl: "/" });
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
    <div className="min-h-screen bg-[#F8F8F8] text-[#111827] flex flex-col justify-between select-none font-sans">
      {/* Top Header - Clean, Minimal */}
      <header className="h-16 border-b border-[#D7D7D7] px-8 flex items-center justify-between bg-[#FFFFFF] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#EE0033] flex items-center justify-center text-white shadow-xs font-black text-sm tracking-wider">
            TT
          </div>
          <div>
            <h1 className="text-base font-bold text-[#111827] tracking-tight">
              TamTask
            </h1>
            <p className="text-[11px] text-[#9B9B9B] font-medium">Hệ thống quản lý công việc và dự án</p>
          </div>
        </div>
      </header>

      {/* Main Centered Login Section - Clean & Focused */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] rounded-xl shadow-md border border-[#D7D7D7] p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
              Đăng nhập tài khoản
            </h2>
            <p className="text-xs text-[#9B9B9B]">
              Nhập thông tin xác thực để truy cập không gian làm việc
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-[#EE0033] text-xs rounded-lg font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {step === "credentials" ? (
            <>
              {/* Google Workspace Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2.5 bg-[#FFFFFF] hover:bg-slate-50 text-[#111827] border border-[#D7D7D7] py-2.5 rounded-lg text-xs font-semibold transition shadow-2xs disabled:opacity-50"
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
                <span>Đăng nhập với Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#D7D7D7]"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider">
                  Hoặc Email & Mật Khẩu
                </span>
                <div className="flex-grow border-t border-[#D7D7D7]"></div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Email tài khoản *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#F8F8F8] border border-[#D7D7D7] rounded-lg text-[#111827] placeholder-[#9B9B9B] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full text-xs pl-9 pr-9 py-2.5 bg-[#F8F8F8] border border-[#D7D7D7] rounded-lg text-[#111827] placeholder-[#9B9B9B] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#111827]"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white py-2.5 rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  <span>{isLoading ? "Đang xác thực..." : "Tiếp Tục"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#EE0033]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#EE0033]" />
                    <span>Xác Thực 2 Lớp (2FA)</span>
                  </div>
                  <span className="font-mono bg-rose-100 text-rose-900 px-2 py-0.5 rounded text-[11px] font-bold">
                    {formatTimer(timeLeft)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Mã OTP 6 số đã được gửi trực tiếp đến hộp thư: <strong>{emailInput}</strong>. Vui lòng mở email để lấy mã:
                </p>
                {otpNotice && (
                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                    {otpNotice}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5 text-center">
                  Nhập mã OTP 6 số từ email
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full text-center text-lg tracking-[0.35em] font-mono font-bold bg-[#F8F8F8] border border-[#D7D7D7] rounded-lg py-2.5 text-[#111827] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="w-1/3 bg-[#F8F8F8] hover:bg-slate-100 text-[#111827] text-xs font-semibold py-2.5 rounded-lg border border-[#D7D7D7] transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-2/3 bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white text-xs font-bold py-2.5 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? "Đang xác nhận..." : "Xác Nhận & Đăng Nhập"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="h-12 border-t border-[#D7D7D7] px-8 flex items-center justify-between text-xs text-[#9B9B9B] bg-[#FFFFFF]">
        <span>TamTask Platform © 2026. All rights reserved.</span>
        <span>Hệ thống bảo mật đa tầng</span>
      </footer>
    </div>
  );
};

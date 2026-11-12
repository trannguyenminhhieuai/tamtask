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
  Layers,
  KeyRound,
  TrendingUp,
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
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827] flex flex-col justify-between select-none font-sans overflow-hidden">
      {/* Top Header - Viettel Red Brand Theme */}
      <header className="h-16 border-b border-[#D7D7D7] px-8 flex items-center justify-between bg-[#FFFFFF] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#EE0033] flex items-center justify-center text-white shadow-xs font-black text-sm tracking-wider">
            TT
          </div>
          <div>
            <h1 className="text-base font-bold text-[#111827] tracking-tight flex items-center gap-2">
              <span>TamTask</span>
              <span className="text-[10px] bg-rose-50 text-[#EE0033] font-semibold px-2 py-0.5 rounded-full border border-rose-200">
                Viettel Edition
              </span>
            </h1>
            <p className="text-[11px] text-[#9B9B9B] font-medium">Smart Tasks & Product Mastery</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#F8F8F8] border border-[#D7D7D7] text-[#111827] text-xs font-medium px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-[#EE0033]" />
            <span>Bảo mật 2 lớp qua Email</span>
          </div>
        </div>
      </header>

      {/* Main Interactive Split Layout */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Login Form (5 Cols) */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Đăng nhập không gian làm việc
            </h2>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Quản trị dự án thông minh với chu kỳ phát triển mượt mà và bảo mật đa tầng chuẩn Viettel.
            </p>
          </div>

          <div className="bg-[#F8F8F8] rounded-xl shadow-sm border border-[#D7D7D7] p-7 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-[#EE0033] text-xs rounded-lg font-medium animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {step === "credentials" ? (
              <>
                {/* Google Login Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2.5 bg-[#FFFFFF] hover:bg-slate-50 text-[#111827] border border-[#D7D7D7] py-2.5 rounded-lg text-xs font-semibold transition shadow-xs disabled:opacity-50"
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
                  <div className="flex-grow border-t border-[#D7D7D7]"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider">
                    Hoặc Email & Mật Khẩu
                  </span>
                  <div className="flex-grow border-t border-[#D7D7D7]"></div>
                </div>

                {/* Email & Real Password Form */}
                <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#111827] uppercase tracking-wider mb-1">
                      Email Tài Khoản
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#9B9B9B] absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#D7D7D7] rounded-lg text-[#111827] placeholder-[#9B9B9B] focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-[#111827] uppercase tracking-wider">
                        Mật Khẩu *
                      </label>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#9B9B9B] absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full text-xs pl-9 pr-9 py-2.5 bg-[#FFFFFF] border border-[#D7D7D7] rounded-lg text-[#111827] placeholder-[#9B9B9B] focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#9B9B9B] hover:text-[#111827]"
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
                    Mã xác thực 6 chữ số đã được gửi trực tiếp đến hộp thư: <strong>{emailInput}</strong>. Vui lòng mở email để lấy mã OTP:
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
                      className="w-full text-center text-lg tracking-[0.35em] font-mono font-bold bg-[#FFFFFF] border border-[#D7D7D7] rounded-lg py-2.5 text-[#111827] focus:outline-none focus:border-[#EE0033] focus:ring-3 focus:ring-[#EE0033]/20 transition"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="w-1/3 bg-[#FFFFFF] hover:bg-slate-100 text-[#111827] text-xs font-semibold py-2.5 rounded-lg border border-[#D7D7D7] transition"
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
        </div>

        {/* Right Column: Interactive Product & Project Showcase (7 Cols) - Viettel Red */}
        <div className="lg:col-span-7 space-y-6 hidden lg:block">
          <div className="bg-[#F8F8F8] rounded-2xl border border-[#D7D7D7] p-8 relative overflow-hidden shadow-xs">
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EE0033] animate-pulse"></span>
                  <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Không Gian Quản Trị Viettel
                  </span>
                </div>
                <div className="text-xs font-bold text-[#EE0033] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  Sprint Hiện Tại: 48 pts
                </div>
              </div>

              {/* Animated Micro-Kanban Preview */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {/* Column 1 */}
                <div className="bg-[#FFFFFF] rounded-lg p-3 border border-[#D7D7D7] space-y-2 shadow-2xs">
                  <div className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider flex items-center justify-between">
                    <span>Ý Tưởng (To do)</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full text-slate-700">2</span>
                  </div>
                  <div className="bg-[#F8F8F8] p-2.5 rounded-md border border-[#D7D7D7] space-y-1">
                    <span className="text-[9px] font-bold text-[#EE0033] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      #Feature
                    </span>
                    <p className="text-xs font-semibold text-[#111827]">Kiến trúc đa dự án độc lập</p>
                  </div>
                  <div className="bg-[#F8F8F8] p-2.5 rounded-md border border-[#D7D7D7] space-y-1">
                    <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      #UI/UX
                    </span>
                    <p className="text-xs font-semibold text-[#111827]">Bảng kéo thả 60fps mượt mà</p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="bg-[#FFFFFF] rounded-lg p-3 border border-[#D7D7D7] space-y-2 shadow-2xs">
                  <div className="text-[11px] font-bold text-[#EE0033] uppercase tracking-wider flex items-center justify-between">
                    <span>Đang Xử Lý</span>
                    <span className="text-[10px] bg-rose-100 px-1.5 py-0.2 rounded-full text-[#EE0033]">1</span>
                  </div>
                  <div className="bg-[#F8F8F8] p-2.5 rounded-md border border-rose-300 space-y-1.5 ring-1 ring-[#EE0033]/20">
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      #High Priority
                    </span>
                    <p className="text-xs font-semibold text-[#111827]">Xác thực 2 lớp qua Email OTP</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#EE0033] h-full rounded-full w-3/4"></div>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="bg-[#FFFFFF] rounded-lg p-3 border border-[#D7D7D7] space-y-2 shadow-2xs">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Đã Phát Hành</span>
                    <span className="text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded-full text-emerald-800">1</span>
                  </div>
                  <div className="bg-[#F8F8F8] p-2.5 rounded-md border border-[#D7D7D7] space-y-1">
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Released</span>
                    </span>
                    <p className="text-xs font-semibold text-[#111827]">Chuẩn hóa 6 trạng thái chuẩn</p>
                  </div>
                </div>
              </div>

              {/* Delivery Metric Spotlight */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#D7D7D7] flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-[#EE0033]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider">Hiệu suất bàn giao</div>
                    <div className="text-base font-black text-[#EE0033]">100% On-time</div>
                  </div>
                </div>

                <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#D7D7D7] flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider">Hạ Tầng Cloud 0đ</div>
                    <div className="text-base font-black text-[#111827]">Vercel + Supabase</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Viettel Red */}
      <footer className="h-12 bg-[#FFFFFF] border-t border-[#D7D7D7] px-8 flex items-center justify-between text-xs text-[#9B9B9B]">
        <span>TamTask Platform © 2026. Viettel Red Signature Corporate Edition.</span>
        <span>Bảo mật dữ liệu chuẩn SOC2 & ISO/IEC 27001</span>
      </footer>
    </div>
  );
};

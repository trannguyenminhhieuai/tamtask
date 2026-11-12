"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { X, Mail, Lock, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu");
      return;
    }

    // Step 1: Prompt for 2FA OTP simulation
    setStep("2fa");
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("demo-login", {
        email: email.trim().toLowerCase(),
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) {
        setError(res.error);
      } else {
        onClose();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md tracking-wider">
              TT
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Đăng Nhập TamTask</h3>
              <p className="text-[11px] text-slate-300">Không gian quản trị công việc thông minh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email tài khoản
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten.ban@congty.com"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                  <span className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer">
                    Quên mật khẩu?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Tiếp Tục Đăng Nhập</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Xác thực 2 lớp bảo mật (2FA)</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Hệ thống yêu cầu mã OTP bảo mật. Nhập mã OTP gồm 6 chữ số gửi đến email <strong>{email}</strong> (Nhập 6 số bất kỳ để hoàn tất):
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mã OTP 6 số
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center text-sm tracking-widest font-mono bg-slate-50 border border-slate-300 rounded-lg py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-lg transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
                >
                  {isLoading ? "Đang xác thực..." : "Xác Nhận & Đăng Nhập"}
                </button>
              </div>
            </form>
          )}

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">
              HOẶC
            </span>
          </div>

          {/* Real Google OAuth */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-xs font-semibold transition shadow-xs"
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

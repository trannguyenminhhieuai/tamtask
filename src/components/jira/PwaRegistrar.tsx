"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";

export const PwaRegistrar: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already installed in standalone mode
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) {
        return; // Already installed, do not show prompt
      }

      // Check if user dismissed recently
      const dismissed = localStorage.getItem("tamtask_pwa_dismissed");
      if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
        return; // Dismissed within last 7 days
      }

      // 3. Listen for Android/Desktop Chromium beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Only show prompt on mobile screens or after slight delay
        if (window.innerWidth < 1024) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // 4. Detect iOS Safari
      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

      if (isIosDevice && isSafari) {
        setIsIos(true);
        // On iOS, show banner on mobile
        if (window.innerWidth < 768) {
          setShowInstallBanner(true);
        }
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setShowIosGuide(false);
    try {
      localStorage.setItem("tamtask_pwa_dismissed", Date.now().toString());
    } catch {}
  };

  if (!showInstallBanner) return null;

  return (
    <>
      {/* Bottom PWA Install Banner (Mobile Ergonomic) */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9995] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl shadow-black/10 flex items-start gap-3.5 backdrop-blur-md">
          {/* App Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#EE0033] to-[#C7002B] flex items-center justify-center shrink-0 shadow-sm text-white font-black text-sm">
            TT
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Cài đặt TamTask App</span>
              <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-[#EE0033] dark:text-red-400 font-semibold px-2 py-0.5 rounded-full">
                PWA
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Trải nghiệm nhanh mượt hơn, mở toàn màn hình và nhận thông báo ngay trên điện thoại.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-[#EE0033] hover:bg-[#D6002E] active:bg-[#BD0029] text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cài đặt ngay</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-medium px-2.5 py-1.5 rounded-full transition"
              >
                Để sau
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-lg transition"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EE0033] text-white font-black text-xs flex items-center justify-center">
                  TT
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  Cài đặt trên iPhone/iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p>
                  Nhấn vào nút <span className="font-semibold text-slate-900 dark:text-zinc-100">Chia sẻ (Share)</span> <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> ở thanh công cụ dưới đáy trình duyệt Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p>
                  Cuộn xuống và chọn <span className="font-semibold text-slate-900 dark:text-zinc-100">&quot;Thêm vào MH chính&quot;</span> (<span className="italic">Add to Home Screen</span> <Smartphone className="w-3.5 h-3.5 inline mx-0.5 text-slate-500" />).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p>
                  Nhấn <span className="font-semibold text-[#EE0033]">&quot;Thêm&quot; (Add)</span> ở góc trên bên phải để hoàn tất. Biểu tượng TamTask sẽ xuất hiện trên màn hình chính!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full bg-[#EE0033] hover:bg-[#D6002E] text-white text-xs font-bold py-2.5 rounded-full shadow-xs transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};

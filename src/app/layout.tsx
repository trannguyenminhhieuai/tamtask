import type { Metadata } from "next";
import "./globals.css";
import { SessionWrapper } from "@/components/jira/SessionWrapper";

export const metadata: Metadata = {
  title: "TamTask - Quản Trị Công Việc & Dự Án Thông Minh",
  description: "Nền tảng quản lý dự án hiện đại, mượt mà và bảo mật cao - Kiến tạo bởi Tammi",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');var h=new Date().getHours();var isNight=h>=18||h<6;var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&(prefersDark||isNight))){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased overflow-hidden h-screen bg-[#F5F6F8] dark:bg-[#09090B] text-[#111827] dark:text-zinc-100 transition-colors duration-200">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}

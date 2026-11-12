import type { Metadata } from "next";
import "./globals.css";
import { SessionWrapper } from "@/components/jira/SessionWrapper";

export const metadata: Metadata = {
  title: "TamTask - Quản Trị Công Việc & Dự Án Thông Minh",
  description: "Nền tảng quản lý dự án hiện đại, mượt mà và bảo mật cao - Kiến tạo bởi Tammi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased overflow-hidden h-screen bg-[#F4F5F7]">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}

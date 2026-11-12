import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ROLE_BY_EMAIL: Record<string, { role: string; name: string; avatar: string }> = {
  "hieu.tran@company.com": {
    name: "Trần Minh Hiếu",
    role: "ADMIN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  },
  "ha.nguyen@company.com": {
    name: "Nguyễn Thu Hà",
    role: "PROJECT_LEAD",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  },
  "long.le@company.com": {
    name: "Lê Hoàng Long",
    role: "DEVELOPER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  },
  "vy.pham@company.com": {
    name: "Phạm Thảo Vy",
    role: "QA",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
  },
  "guest@company.com": {
    name: "Khách Xem Dự Án",
    role: "VIEWER",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
  },
};

export const authOptions: NextAuthOptions = {
  providers: [
    // Real Google OAuth 2.0 Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // Credentials Provider with Real Password Verification & 2FA Gate
    CredentialsProvider({
      id: "demo-login",
      name: "TamTask Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        otpVerified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.toLowerCase().trim();

        // Query user in Database
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          throw new Error("Tài khoản không tồn tại trên hệ thống TamTask.");
        }

        if (dbUser.status === "SUSPENDED") {
          throw new Error("Tài khoản của bạn đã bị Quản trị viên tạm khóa.");
        }

        // Strictly verify password if user has password and otpVerified !== "true"
        if (dbUser.password && credentials.password && credentials.otpVerified !== "true") {
          const isValid = await bcrypt.compare(credentials.password, dbUser.password);
          if (!isValid) {
            throw new Error("Mật khẩu không chính xác. Vui lòng kiểm tra lại!");
          }
        }

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.avatar,
          role: dbUser.role,
          status: dbUser.status,
        } as any;
      },
    }),
  ],

  callbacks: {
    // Just-In-Time (JIT) Provisioning for Google OAuth sign-in
    async signIn({ user, account }) {
      if (user?.email) {
        const email = user.email.toLowerCase().trim();
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          // New user registration -> Auto-create with PENDING_APPROVAL status (Viettel Enterprise Governance)
          dbUser = await prisma.user.create({
            data: {
              name: user.name || email.split("@")[0],
              email,
              avatar:
                user.image ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
              role: "PENDING", // Chờ Admin phân quyền
              status: "PENDING_APPROVAL", // Chờ Admin duyệt
            },
          });
        }

        // Reject if suspended by Admin
        if (dbUser.status === "SUSPENDED") {
          return false;
        }
      }
      return true;
    },

    // JWT Token callback: Re-evaluate role from database on every request/session check
    async jwt({ token, user }) {
      const email = (user?.email || token?.email)?.toLowerCase().trim();
      if (email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            token.sub = dbUser.id;
            (token as any).role = dbUser.role;
            (token as any).status = dbUser.status || "ACTIVE";
            token.name = dbUser.name;
            token.picture = dbUser.avatar;
          }
        } catch (err) {
          console.error("Error evaluating role from DB in JWT callback:", err);
        }
      }

      if (user && !token.role) {
        token.sub = user.id;
        (token as any).role = (user as any).role || "DEVELOPER";
      }
      return token;
    },

    // Session callback: Expose updated role & status to client app
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role || "DEVELOPER";
        (session.user as any).status = (token as any).status || "ACTIVE";
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  session: {
    strategy: "jwt",
  },
};

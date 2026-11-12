import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, otp } = body;

    if (!email) {
      return NextResponse.json({ error: "Email không được để trống" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json(
        { error: "Tài khoản không tồn tại trên hệ thống TamTask" },
        { status: 404 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị Quản trị viên tạm khóa" },
        { status: 403 }
      );
    }

    // Action 1: Verify Password & Request OTP via Email
    if (action === "request-otp") {
      if (!password) {
        return NextResponse.json({ error: "Vui lòng nhập mật khẩu" }, { status: 400 });
      }

      // If user has a password in DB, strictly verify with bcrypt
      if (user.password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Mật khẩu không chính xác. Vui lòng kiểm tra lại!" },
            { status: 401 }
          );
        }
      }

      // If 2FA is not enabled for this user, allow direct login
      if (!user.isTwoFactorEnabled) {
        return NextResponse.json({
          requires2FA: false,
          message: "Mật khẩu chính xác. Tiến hành đăng nhập.",
        });
      }

      // Generate random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorOtp: generatedOtp,
          twoFactorExpiry: expiry,
        },
      });

      // Send OTP code strictly to user's real email address
      await sendOtpEmail({
        to: normalizedEmail,
        otp: generatedOtp,
        userName: user.name || undefined,
      });

      // Strict security: Never expose OTP code in response payload
      return NextResponse.json({
        requires2FA: true,
        message: `Mã xác thực 2 lớp (OTP) gồm 6 chữ số đã được gửi tới email ${normalizedEmail}. Vui lòng kiểm tra hộp thư.`,
        expiresInSeconds: 300,
      });
    }

    // Action 2: Verify OTP code
    if (action === "verify-otp") {
      if (!otp) {
        return NextResponse.json({ error: "Vui lòng nhập mã OTP" }, { status: 400 });
      }

      if (!user.twoFactorOtp) {
        return NextResponse.json(
          { error: "Chưa có mã OTP nào được yêu cầu. Vui lòng bấm 'Gửi lại mã'." },
          { status: 400 }
        );
      }

      const now = new Date();
      if (user.twoFactorExpiry && new Date(user.twoFactorExpiry) < now) {
        return NextResponse.json(
          { error: "Mã OTP đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu mã mới!" },
          { status: 400 }
        );
      }

      if (user.twoFactorOtp.trim() !== otp.trim()) {
        return NextResponse.json(
          { error: "Mã OTP không chính xác. Vui lòng kiểm tra kỹ 6 chữ số!" },
          { status: 400 }
        );
      }

      // OTP is valid! Clear it to prevent replay attacks
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorOtp: null,
          twoFactorExpiry: null,
        },
      });

      return NextResponse.json({
        verified: true,
        message: "Xác thực 2 lớp thành công!",
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/auth/2fa error:", error);
    return NextResponse.json(
      { error: error?.message || "Lỗi xử lý xác thực 2 lớp" },
      { status: 500 }
    );
  }
}


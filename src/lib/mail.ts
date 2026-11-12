import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  otp: string;
  userName?: string;
}

/**
 * Configure Nodemailer transport.
 * Supports SMTP configuration via environment variables:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to Gmail transport if GMAIL_USER & GMAIL_APP_PASSWORD are provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Development fallback transporter (logs email securely to console without failing)
  return null;
}

/**
 * Send 2FA OTP verification code to user email.
 * Styled with Viettel signature red branding (#EE0033).
 */
export async function sendOtpEmail({ to, otp, userName }: SendOtpOptions): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.SMTP_FROM || `"TamTask Security - Viettel" <no-reply@viettel.com.vn>`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mã xác thực đăng nhập 2 lớp (2FA)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F8F8; margin: 0; padding: 24px; color: #111827; }
    .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #D7D7D7; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.03); }
    .header { background: #EE0033; padding: 20px 24px; text-align: center; }
    .header h1 { color: #FFFFFF; font-size: 18px; margin: 0; font-weight: 800; letter-spacing: 0.5px; }
    .header p { color: #FFE5EB; font-size: 12px; margin: 4px 0 0 0; }
    .body { padding: 32px 28px; }
    .greeting { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
    .intro { font-size: 13px; color: #4B5563; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background: #FFF5F7; border: 2px dashed #EE0033; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #EE0033; margin: 0; }
    .otp-label { font-size: 11px; color: #9B9B9B; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
    .expiry { font-size: 12px; color: #EE0033; font-weight: 600; text-align: center; margin-top: 8px; }
    .security-notice { background: #F8F8F8; border-left: 3px solid #EE0033; padding: 12px 14px; border-radius: 4px; font-size: 12px; color: #6B7280; line-height: 1.5; margin-top: 24px; }
    .footer { border-top: 1px solid #E5E7EB; padding: 16px 24px; text-align: center; font-size: 11px; color: #9B9B9B; background: #FAFAFA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TamTask Workspace</h1>
      <p>Hệ thống Quản trị Dự án - Viettel Brand Theme</p>
    </div>
    <div class="body">
      <div class="greeting">Xin chào ${userName || to},</div>
      <p class="intro">
        Bạn vừa thực hiện yêu cầu đăng nhập vào hệ thống <strong>TamTask</strong>. Để hoàn tất đăng nhập an toàn, vui lòng sử dụng mã xác thực 2 lớp (2FA) dưới đây:
      </p>

      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-label">Mã Xác Thực 2 Lớp (OTP)</div>
      </div>

      <div class="expiry">Mã có hiệu lực trong vòng 5 phút (300 giây).</div>

      <div class="security-notice">
        <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Đội ngũ quản trị TamTask không bao giờ yêu cầu cung cấp mã OTP của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng đổi mật khẩu ngay lập tức.
      </div>
    </div>
    <div class="footer">
      © 2026 TamTask System. Viettel Red Corporate Standard. Bảo mật đa tầng.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `Xin chào ${userName || to},\n\nMã xác thực 2 lớp (2FA) của bạn trên TamTask là: ${otp}\nMã này có hiệu lực trong vòng 5 phút.\n\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email hoặc đổi mật khẩu.`;

  const transporter = createTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to,
        subject: `[TamTask - Viettel] Mã xác thực đăng nhập 2 lớp (2FA): ${otp}`,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[Email Sent] Đã gửi mã OTP 2FA thành công tới: ${to}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[Email Failed] Lỗi gửi email tới ${to}:`, err);
      return { success: false, error: err?.message };
    }
  } else {
    // Development mode fallback when SMTP is not configured in local environment
    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] ĐANG GỬI EMAIL XÁC THỰC 2FA (Viettel Brand)`);
    console.log(`Từ: ${fromAddress}`);
    console.log(`Tới: ${to}`);
    console.log(`Tiêu đề: [TamTask - Viettel] Mã xác thực đăng nhập 2 lớp (2FA): ${otp}`);
    console.log(`MÃ OTP 6 CHỮ SỐ: >>> [ ${otp} ] <<<`);
    console.log(`Hiệu lực: 5 phút`);
    console.log(`======================================================\n`);
    return { success: true };
  }
}

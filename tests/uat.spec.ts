import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const getTestDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("pooler.supabase.com")) {
      parsed.port = "6543";
      parsed.searchParams.set("pgbouncer", "true");
      parsed.searchParams.set("connection_limit", "2");
      return parsed.toString();
    }
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "2");
      return parsed.toString();
    }
  } catch {
    // Fallback
  }
  return url;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getTestDatabaseUrl(),
    },
  },
});
const SCREENSHOT_DIR = path.resolve(process.cwd(), "uat-reports/screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe.configure({ mode: "serial" });

test.describe("TamTask Agile Hub - UAT Automation Test Suite (Plan.md)", () => {
  let page: Page;

  test.beforeEach(async () => {
    test.setTimeout(90000);
  });

  test.beforeAll(async ({ browser }) => {
    // Đảm bảo tài khoản admin có password và bật 2FA
    try {
      await prisma.user.updateMany({
        where: { email: "hieu.tran@company.com" },
        data: { isTwoFactorEnabled: true },
      });
    } catch (e) {
      console.log("Admin 2FA verification init:", e);
    }

    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    if (page) await page.close();
    await prisma.$disconnect();
  });

  // TC01: Auth Gate & Form Validation
  test("TC01 - Cổng kiểm soát đăng nhập & Validation biểu mẫu (Auth Gate)", async () => {
    await page.goto("http://localhost:3000", { timeout: 45000 });
    await page.waitForLoadState("networkidle");

    // Đợi màn hình loading ban đầu biến mất
    await page.locator("text=Đang khởi động TamTask").waitFor({ state: "hidden", timeout: 30000 }).catch(() => { });

    // 1. Chụp ảnh màn hình Welcome / Auth Landing
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC01_AuthGate_LandingPage_PASS.png"),
      fullPage: true,
    });

    await expect(page.locator("text=TamTask").first()).toBeVisible({ timeout: 25000 });
    await expect(page.locator("button:has-text('Đăng nhập với Google')")).toBeVisible({ timeout: 25000 });

    // 2. Negative case: Nhập sai mật khẩu
    await page.fill("input[type='email']", "hieu.tran@company.com");
    await page.fill("input[type='password']", "SaiMatKhau123!");
    await page.click("button[type='submit']");

    // Đợi thông báo lỗi hiển thị
    await page.waitForSelector("text=Mật khẩu không chính xác", { timeout: 10000 });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC01_FormValidation_WrongPassword_PASS.png"),
    });

    await expect(page.locator("text=Mật khẩu không chính xác")).toBeVisible();
  });

  // TC02: Đăng nhập hoàn chỉnh với xác thực 2 lớp (2FA Flow)
  test("TC02 - Quy trình đăng nhập xác thực 2 lớp (2FA) tài khoản ADMIN", async () => {
    // Nhập mật khẩu chính xác
    await page.fill("input[type='password']", "TamTask@2026!");
    await page.click("button[type='submit']");

    // Chờ màn hình 2FA xuất hiện
    await page.waitForSelector("text=Xác Thực 2 Lớp (2FA)", { timeout: 15000 });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC02_2FA_OtpPrompt_PASS.png"),
    });

    // Lấy mã OTP thực tế được sinh ra trong DB
    await page.waitForTimeout(1000);
    let otp: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: "hieu.tran@company.com" },
          select: { twoFactorOtp: true },
        });
        if (user?.twoFactorOtp) {
          otp = user.twoFactorOtp;
          break;
        }
      } catch (err) {
        console.log(`Prisma read attempt ${attempt + 1} retry:`, err);
      }
      await page.waitForTimeout(1000);
    }

    expect(otp).toBeTruthy();

    // Điền mã OTP
    await page.fill("input[placeholder='••••••']", otp!);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC02_2FA_OtpFilled_PASS.png"),
    });

    // Bấm Xác nhận OTP
    await page.click("button:has-text('Xác nhận')");

    // Đợi vào Workspace chính & bảng Kanban tải xong
    await page.waitForSelector("h1:has-text('Bảng Công Việc')", { timeout: 30000 });
    // Chờ Kanban columns tải xong từ remote database
    await page.locator("text='To do' >> visible=true").or(page.locator("text='In progress' >> visible=true")).first().waitFor({ state: "visible", timeout: 35000 });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC02_Admin_WorkspaceLoaded_PASS.png"),
      fullPage: true,
    });

    await expect(page.locator("h1:has-text('Bảng Công Việc')")).toBeVisible();
  });

  // TC03: Kiểm tra hiển thị Bảng Kanban & Bộ chọn Dự Án
  test("TC03 - Kiểm tra Bảng Kanban & Bộ chọn Dự Án (Project Switcher)", async () => {
    await expect(page.locator("h1:has-text('Bảng Công Việc')")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC03_KanbanBoard_Columns_PASS.png"),
      fullPage: true,
    });

    // Kiểm tra có Project Switcher trên Header (Mã TT, BP hoặc tên dự án)
    const projectSwitcher = page.locator("[data-testid='project-switcher'], header button:has-text('TT'), header button:has-text('TamTask'), header button:has-text('BP'), header button:has-text('BA project')").first();
    await expect(projectSwitcher).toBeVisible();

    // Kiểm tra có các cột trạng thái chuẩn Agile
    const columnHeader = page.locator("text='To do' >> visible=true").or(page.locator("text='In progress' >> visible=true")).first();
    await expect(columnHeader).toBeVisible({ timeout: 25000 });
  });

  // TC04: Tạo công việc mới qua CreateIssueModal
  test("TC04 - Tạo công việc mới và xác nhận xuất hiện trên bảng", async () => {
    // Bấm nút "+ Thêm mới" ở Header
    const createBtn = page.locator("header button:has-text('Thêm mới')").first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Chờ Modal xuất hiện với tiêu đề "Tạo Công Việc"
    await page.waitForSelector("h3:has-text('Tạo Công Việc')", { timeout: 10000 });

    const testTitle = `UAT Task Test ${Date.now()}`;
    await page.fill("input[placeholder*='Ví dụ:']", testTitle);

    // Chụp form tạo task
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC04_CreateIssue_ModalFilled_PASS.png"),
    });

    // Bấm Tạo Công Việc
    await page.click("button[type='submit']:has-text('Tạo Công Việc')");
    await page.waitForTimeout(2500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC04_CreateIssue_Submitted_PASS.png"),
      fullPage: true,
    });

    // Xác nhận task xuất hiện trên màn hình
    await expect(page.locator(`text=${testTitle}`).first()).toBeVisible();
  });

  // TC05: Kế hoạch Chu kỳ & Hàng đợi Backlog
  test("TC05 - Truy cập Backlog và tạo Story cho Backlog", async () => {
    // Bấm chuyển sang View Backlog từ Sidebar
    await page.waitForTimeout(1000);
    const backlogNav = page.locator("[data-testid='nav-backlog']").first();
    await backlogNav.click();
    await page.waitForTimeout(500);
    if (!(await page.locator("span:has-text('Backlog')").isVisible())) {
      await backlogNav.click({ force: true });
    }

    // Đợi bảng Backlog hiển thị
    await page.waitForSelector("span:has-text('Backlog')", { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC05_Backlog_ViewLoaded_PASS.png"),
      fullPage: true,
    });

    // Bấm "Tạo công việc" trong mục Backlog
    const createBacklogIssueBtn = page.locator("button:has-text('Tạo công việc')").first();
    await expect(createBacklogIssueBtn).toBeVisible();
    await createBacklogIssueBtn.click();

    await page.waitForSelector("h3:has-text('Tạo Công Việc')", { timeout: 10000 });

    // Nhập tiêu đề Story
    const storyTitle = `UAT Backlog Story ${Date.now()}`;
    await page.fill("input[placeholder*='Ví dụ:']", storyTitle);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC05_CreateBacklogStory_Modal_PASS.png"),
    });

    await page.click("button[type='submit']:has-text('Tạo Công Việc')");

    // Đợi modal đóng hoàn toàn (h3 biến mất)
    await page.waitForSelector("h3:has-text('Tạo Công Việc')", { state: "hidden", timeout: 10000 });
    // Thêm buffer để optimistic UI render
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC05_StoryCreatedInBacklog_PASS.png"),
      fullPage: true,
    });

    // Kiểm tra story mới xuất hiện trong BacklogView
    // Dùng getByText với substring (truncate CSS không ảnh hưởng DOM text)
    const storyPrefix = storyTitle.slice(0, 20); // "UAT Backlog Story 17"
    const storyEl = page.getByText(storyPrefix, { exact: false }).first();
    await expect(storyEl).toBeVisible({ timeout: 10000 });
  });

  // TC06: Chi tiết công việc (IssueDetailDrawer) & Trường chọn Sprint
  test("TC06 - Mở IssueDetailDrawer và kiểm tra trường chọn Sprint", async () => {
    // Quay lại bảng Kanban
    const boardNav = page.locator("button[title='Bảng Công Việc'], button:has-text('Bảng Công Việc')").first();
    await boardNav.click();
    await page.waitForTimeout(2000);

    // Click vào thẻ task đầu tiên trên bảng
    const card = page.locator("[draggable='true']").first();
    await card.waitFor({ timeout: 10000 });
    await card.click();

    // Đợi Drawer chi tiết mở ra
    await page.waitForSelector("text=Chu kỳ phát triển (Sprint)", { timeout: 10000 });
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC06_IssueDetail_DrawerWithSprint_PASS.png"),
    });

    // Xác nhận trường chọn Sprint tồn tại
    const sprintSelect = page.locator("select:has(option:has-text('Hàng đợi công việc (Backlog)'))");
    await expect(sprintSelect).toBeVisible();

    // Thêm một subtask mới
    const subtaskInput = page.locator("input[placeholder*='Nhập tên công việc phụ']").first();
    if (await subtaskInput.isVisible()) {
      await subtaskInput.fill("UAT Subtask Verification");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "TC06_Subtask_Added_PASS.png"),
      });
    }

    // Đóng drawer bằng phím Escape hoặc nút đóng (theo Rule B)
    // Click backdrop overlay directly to ensure drawer closes
    const drawerBackdrop = page.locator("div.fixed.inset-0.z-\\[70\\]");
    if (await drawerBackdrop.isVisible().catch(() => false)) {
      // Click the backdrop area (far left corner, outside content panel)
      await drawerBackdrop.click({ position: { x: 5, y: 5 }, force: true });
      await page.waitForTimeout(500);
    }
    // Fallback: press Escape  
    if (await drawerBackdrop.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    // Fallback: click X button
    const closeDrawerBtn = page.locator("button[title='Đóng (Esc)']").first();
    if (await closeDrawerBtn.isVisible().catch(() => false)) {
      await closeDrawerBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
    // Wait for drawer to fully disappear
    await drawerBackdrop.waitFor({ state: "hidden", timeout: 5000 }).catch(() => { });
    await page.waitForTimeout(500);
  });

  // TC07: Giao diện Di động & Thanh điều hướng dưới đáy (PWA Mobile Navigation)
  test("TC07 - Kiểm tra PWA Viewport và Mobile Bottom Navigation", async () => {
    // === Aggressive drawer/modal cleanup from TC06 ===
    // 1) Try Escape key
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // 2) If z-[70] drawer overlay still present, click its backdrop
    const drawerOverlay = page.locator("div.fixed.inset-0.z-\\[70\\]");
    if (await drawerOverlay.isVisible().catch(() => false)) {
      await drawerOverlay.click({ position: { x: 5, y: 5 }, force: true });
      await page.waitForTimeout(500);
    }

    // 3) If still visible, try clicking the X close button directly
    if (await drawerOverlay.isVisible().catch(() => false)) {
      const closeBtn = page.locator("button[title='Đóng (Esc)']").first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true });
        await page.waitForTimeout(500);
      }
    }

    // 4) Final fallback: press Escape again
    if (await drawerOverlay.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // 5) Wait for overlay to fully disappear
    await drawerOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => { });
    await page.locator("div.fixed.inset-0.z-\\[80\\]").waitFor({ state: "hidden", timeout: 3000 }).catch(() => { });

    // Giả lập màn hình điện thoại iPhone 13 (390 x 844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(2000);

    // Chụp ảnh giao diện di động
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC07_Mobile_BottomNav_PWA_PASS.png"),
      fullPage: true,
    });

    // Xác nhận thanh Bottom Navigation hiển thị
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();

    // Xác nhận có các nút Bảng, Backlog, Tạo (+), Tiến độ
    await expect(bottomNav.locator("text=Bảng")).toBeVisible();
    await expect(bottomNav.locator("text=Backlog")).toBeVisible();

    // Xác nhận Mobile Task Hub hiển thị với các chế độ chuyển đổi thông minh
    const focusModeBtn = page.locator("button:has-text('Việc của tôi')").first();
    const listModeBtn = page.locator("button:has-text('Danh sách')").first();
    await expect(focusModeBtn).toBeVisible();
    await expect(listModeBtn).toBeVisible();

    // Chuyển sang chế độ Danh sách dọc (Collapsible Status List)
    await listModeBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "TC07_Mobile_TaskHub_ListView_PASS.png"),
      fullPage: true,
    });
  });
});

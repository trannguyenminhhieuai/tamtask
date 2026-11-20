import { test, expect } from "@playwright/test";

test.describe("TamTask PWA & Web Application", () => {
  test("Trang chủ tải thành công và có thẻ title hợp lệ", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TamTask/);
  });

  test("PWA Manifest và Apple Touch Icon được cấu hình đầy đủ", async ({ page }) => {
    await page.goto("/");

    // Kiểm tra manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");

    // Kiểm tra apple-touch-icon
    const appleIcon = page.locator('link[rel="apple-touch-icon"]').first();
    await expect(appleIcon).toHaveAttribute("href", "/apple-touch-icon.png");
  });
});

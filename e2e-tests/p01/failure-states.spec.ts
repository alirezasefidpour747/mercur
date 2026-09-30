import { test, expect } from "@playwright/test";
const languages = ["fa", "en", "ar", "fr"] as const;
// Actual stopped-backend states; this suite supplies no data or HTTP mocks.
// This covers failure UI only, not the authenticated P01 journey or T10's complete screen matrix.
for (const lang of languages)
  for (const width of [375, 768, 1280, 1920]) {
    test(`retailer login ${lang} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const r = await page.goto(`http://127.0.0.1:3011/${lang}/login`);
      expect(r?.status()).toBe(200);
      await expect(page.locator("input[name=email]")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        ["fa", "ar"].includes(lang) ? "rtl" : "ltr",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
    for (const [host, path] of [
      ["7011", "ops/product-reviews"],
      ["7012", "supplier/products"],
    ] as const) {
      test(`workspace backend-down ${host} ${lang} ${width}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`http://127.0.0.1:${host}/${lang}/${path}`);
        await expect(
          page.locator(".didar-message[role=alert]").first(),
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          ["fa", "ar"].includes(lang) ? "rtl" : "ltr",
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.reload();
        await expect(
          page.locator(".didar-message[role=alert]").first(),
        ).toBeVisible();
      });
    }
  }
for (const lang of languages)
  test(`retailer stopped backend and direct refresh ${lang}`, async ({
    page,
  }) => {
    await page.goto(`http://127.0.0.1:3011/${lang}/login`);
    await page.locator("input[name=email]").fill("p01.retailer1@example.test");
    await page.locator("input[name=password]").fill("runtime-unavailable-test");
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/b2b/session") && r.request().method() === "POST",
    );
    await page.locator("form button[type=submit]").click();
    expect((await response).status()).toBe(503);
    await expect(page.locator("form [role=alert]")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${lang}/login$`));
    await page.reload();
    await expect(page.locator("input[name=email]")).toBeVisible();
    await page.goto(`http://127.0.0.1:3011/${lang}/products`);
    await expect(
      page.locator(".didar-message[role=alert]").first(),
    ).toBeVisible();
    await expect(page.getByTestId("b2b-product-card")).toHaveCount(0);
  });

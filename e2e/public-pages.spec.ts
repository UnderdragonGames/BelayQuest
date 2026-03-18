import { test, expect } from "@playwright/test";

// Public (unauthenticated) page tests.
// These pages require no auth fixture and are accessible without logging in.
// The Expo web bundle needs ~2–5s to compile on first load; assertions use
// Playwright's built-in retry (default 30s timeout) to handle that safely.

test.describe("Landing page (/)", () => {
  test("loads and shows coming-soon content", async ({ page }) => {
    await page.goto("/");

    // The animated splash runs for ~2s; after it clears, the LandingPage
    // renders its parallax scene with store badge copy and legal links.
    await expect(page.getByText("Coming soon to")).toBeVisible();
  });

  test("legal links are visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Privacy Policy")).toBeVisible();
    await expect(page.getByText("Terms of Service")).toBeVisible();
  });
});

test.describe("Privacy Policy (/legal/privacy)", () => {
  test("loads and shows policy heading", async ({ page }) => {
    await page.goto("/legal/privacy");

    await expect(page.getByText("Privacy Policy")).toBeVisible();
  });

  test("renders core sections", async ({ page }) => {
    await page.goto("/legal/privacy");

    await expect(page.getByText("What We Collect")).toBeVisible();
    await expect(page.getByText("How We Use Your Data")).toBeVisible();
  });
});

test.describe("Terms of Service (/legal/tos)", () => {
  test("loads and shows terms heading", async ({ page }) => {
    await page.goto("/legal/tos");

    await expect(page.getByText("Terms of Service")).toBeVisible();
  });

  test("renders core sections", async ({ page }) => {
    await page.goto("/legal/tos");

    await expect(page.getByText("Acceptance of Terms")).toBeVisible();
    await expect(page.getByText("Climbing Safety")).toBeVisible();
  });
});

test.describe("Storybook (/storybook)", () => {
  test("loads and renders at least one story", async ({ page }) => {
    await page.goto("/storybook");

    // RN Storybook renders story titles in its sidebar / story picker.
    // "LevelUp Modal" is from components/LevelUpModal.stories.tsx.
    await expect(page.getByText("LevelUp Modal")).toBeVisible();
  });

  test("shows no uncaught console errors on load", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/storybook");
    await expect(page.getByText("LevelUp Modal")).toBeVisible();

    // Filter out known benign noise (network errors for missing assets, etc.)
    const fatalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("Failed to load resource") &&
        !e.includes("net::ERR_") &&
        !e.includes("favicon")
    );
    expect(fatalErrors).toHaveLength(0);
  });
});

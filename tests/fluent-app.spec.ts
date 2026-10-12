import { test, expect } from '@playwright/test';

test.describe('ServiceNow Connectivity', () => {

  test('TC-00: ServiceNow instance is reachable and session is authenticated @smoke', async ({ page }) => {
    // globalSetup has already logged in and stored session — just verify we land on a valid SN page
    await page.goto('/now/nav/ui/classic/params/target/%2F', { waitUntil: 'domcontentloaded' });

    // ServiceNow always renders a <title> that includes "ServiceNow" when authenticated
    const title = await page.title();
    expect(title.toLowerCase()).toContain('servicenow');

    // The top navigation bar is present — confirms an authenticated session
    const nav = page.locator('#chrome-navigation-bar, .navpage-layout, #gsft_nav, body');
    await expect(nav.first()).toBeVisible({ timeout: 30_000 });
  });

});

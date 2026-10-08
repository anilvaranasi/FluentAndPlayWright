import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../NowConfig.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

test.describe.skip('Requirement 1: Incident Resolved Auto Additional Comments Validation (SOW)', () => {
  test('E2E Validation: Incident creation & resolution in SOW adds greeting comment', async ({ page }) => {
    test.setTimeout(120_000);

    const timestamp = Date.now();
    const shortDescription = `Playwright E2E Test ${timestamp}`;
    const baseURL = process.env.SN_DEV_INSTANCE || process.env.SN_INSTANCE || 'https://dev224768.service-now.com';
    const username = process.env.SN_DEV_USER || process.env.SN_USERNAME || 'admin';
    const password = process.env.SN_DEV_PASS || process.env.SN_PASSWORD || 'jD@2F/bRiS5x';

    // ─── 1. Login to ServiceNow ────────────────────────────────────────────────
    await page.goto(`${baseURL}/login.do`, { waitUntil: 'domcontentloaded' });
    if (page.url().includes('login.do')) {
      const usernameInput = page.getByRole('textbox', { name: 'User name' });
      if (await usernameInput.isVisible()) {
        await usernameInput.fill(username);
        await page.getByRole('textbox', { name: 'Password' }).fill(password);
        await page.locator('#sysverb_login').or(page.getByRole('button', { name: 'Log in' })).click();
        await page.waitForLoadState('networkidle').catch(() => {});
      }
    }

    // ─── 2. Direct Navigation to SOW Incident List ────────────────────────────
    console.log('Navigating directly to SOW Incident list (/now/sow/list/params/list-id/7ae4da1ec3013010965e070e9140dd66)...');
    await page.goto(`${baseURL}/now/sow/list/params/list-id/7ae4da1ec3013010965e070e9140dd66`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    // ─── 3. Click New Incident Button ──────────────────────────────────────────
    console.log('Clicking New button in SOW list...');
    const newBtn = page.getByRole('button', { name: 'New' }).first();
    await newBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await newBtn.click();
    await page.waitForTimeout(3000);

    // ─── 4. Fill Short Description & Caller ────────────────────────────────────
    console.log(`Filling Short Description: "${shortDescription}"...`);
    const shortDescInput = page.getByRole('textbox', { name: /Short description/i }).first();
    await shortDescInput.waitFor({ state: 'visible', timeout: 20_000 });
    await shortDescInput.click();
    await shortDescInput.fill(shortDescription);

    console.log('Selecting Caller in SOW...');
    const callerCombo = page.getByRole('combobox', { name: 'Caller' }).first();
    await callerCombo.click();
    await callerCombo.fill('a');
    await page.waitForTimeout(600);
    await callerCombo.press('ArrowDown');
    await callerCombo.press('ArrowDown');
    await callerCombo.press('Enter');
    await page.waitForTimeout(1000);

    // ─── 5. Save the New Incident ──────────────────────────────────────────────
    console.log('Saving the initial incident record...');
    const saveButton = page.getByRole('button', { name: 'Save', exact: true }).first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle').catch(() => {});

    // ─── 6. Fill Resolution Information & Resolve ──────────────────────────────
    console.log('Switching to Details tab & selecting Resolution Code...');
    const detailsTab = page.getByRole('tab', { name: 'Details' }).first();
    if (await detailsTab.isVisible()) {
      await detailsTab.click();
      await page.waitForTimeout(1000);
    }

    const resCodeCombo = page.getByRole('combobox', { name: 'Resolution code' }).first();
    await resCodeCombo.click();
    await page.waitForTimeout(500);

    const solutionProvidedOption = page.locator('[id="Solution provided"]').getByText('Solution provided')
      .or(page.getByRole('option', { name: 'Solution provided' }))
      .or(page.getByText('Solution provided'))
      .first();
    await solutionProvidedOption.click();

    console.log('Entering Resolution notes...');
    const resNotesInput = page.getByRole('textbox', { name: /Resolution notes/i }).first();
    await resNotesInput.click();
    await resNotesInput.fill('Resolved through automated test.');

    console.log('Clicking Resolve button in SOW...');
    await page.getByRole('button', { name: 'Resolve', exact: true }).first().click();
    await page.waitForTimeout(1000);

    // Confirmation resolve button in dialog/modal if present
    const modalResolveBtn = page.locator('#item-save_button').getByRole('button', { name: 'Resolve' })
      .or(page.getByRole('dialog').getByRole('button', { name: 'Resolve' }))
      .first();
    if (await modalResolveBtn.count() > 0 && await modalResolveBtn.isVisible()) {
      await modalResolveBtn.click();
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    // ─── 7. Verify Resolution Greeting Comment in Activity Stream ──────────────
    console.log('Verifying greeting comment in Activity stream...');
    const expectedCommentSnippet = `regarding "${shortDescription}" has been marked as Resolved.`;

    const pageText = (await page.locator('body').textContent()) || '';
    const isCommentPresent = pageText.includes(expectedCommentSnippet);

    console.log(`Checking for comment: "${expectedCommentSnippet}" -> Result: ${isCommentPresent}`);
    expect(isCommentPresent).toBe(true);
  });
});

import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env or NowConfig.env if present
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, 'NowConfig.env') });

const STORAGE_STATE_PATH = path.resolve(__dirname, process.env.STORAGE_STATE_PATH || '.auth/storageState.json');

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const baseURL  = process.env.SN_DEV_INSTANCE || process.env.SN_INSTANCE_URL || process.env.SN_INSTANCE;
  const username = process.env.SN_DEV_USER || process.env.SN_USERNAME;
  const password = process.env.SN_DEV_PASS || process.env.SN_PASSWORD;

  if (!baseURL || !username || !password) {
    console.warn(
      '⚠️ Missing SN_INSTANCE_URL, SN_USERNAME, or SN_PASSWORD. Global authentication setup will be skipped or simulated.'
    );
    return;
  }

  const authDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: process.env.CI ? undefined : 'chrome',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.setDefaultNavigationTimeout(90_000);
  page.setDefaultTimeout(90_000);

  try {
    console.log(`🔑 Logging into ServiceNow instance: ${baseURL}...`);
    await page.goto(`${baseURL}/login.do`, { waitUntil: 'domcontentloaded' });

    await page.locator('#user_name').fill(username);
    await page.locator('#user_password').fill(password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 60_000 }).catch(() => {}),
      page.locator('#sysverb_login').click(),
    ]);

    const currentURL = page.url();
    if (currentURL.includes('login.do') && !currentURL.includes('navpage.do')) {
      throw new Error(`Login failed — still on login page: ${currentURL}`);
    }

    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log(`✅ Authentication session stored at ${STORAGE_STATE_PATH}`);
  } catch (err) {
    console.error(`❌ Global authentication error: ${err}`);
    // In CI without live instances, we allow gracefully or fail depending on env
    if (process.env.CI_STRICT_AUTH === 'true') {
      throw err;
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

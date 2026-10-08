import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { IncidentPage } from '../utils/incident-page';

dotenv.config({ path: path.resolve(__dirname, '../NowConfig.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

setDefaultTimeout(90000);

let browser: Browser;
let context: BrowserContext;
let page: Page;
let incidentPage: IncidentPage;
let currentIncidentNumber: string = '';
let currentShortDescription: string = '';

Before(async function () {
  const isHeadless = process.env.HEADLESS !== 'false';
  browser = await chromium.launch({
    headless: isHeadless,
    channel: process.env.CI ? undefined : 'chrome'
  });

  const storageStatePath = path.resolve(__dirname, '../.auth/storageState.json');
  if (fs.existsSync(storageStatePath)) {
    context = await browser.newContext({
      baseURL: process.env.SN_DEV_INSTANCE || process.env.SN_INSTANCE,
      storageState: storageStatePath
    });
  } else {
    context = await browser.newContext({
      baseURL: process.env.SN_DEV_INSTANCE || process.env.SN_INSTANCE
    });
  }

  page = await context.newPage();
  incidentPage = new IncidentPage(page);
});

After(async function () {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
});

Given('user is authenticated on the ServiceNow instance', async function () {
  const baseURL = process.env.SN_DEV_INSTANCE || process.env.SN_INSTANCE || 'https://dev224768.service-now.com';
  const username = process.env.SN_DEV_USER || process.env.SN_USERNAME || 'admin';
  const password = process.env.SN_DEV_PASS || process.env.SN_PASSWORD || 'jD@2F/bRiS5x';

  await page.goto(`${baseURL}/login.do`, { waitUntil: 'domcontentloaded' });

  // If already logged in via storageState, skip login form
  if (!page.url().includes('login.do')) {
    return;
  }

  const usernameInput = page.locator('#user_name');
  if (await usernameInput.isVisible()) {
    await usernameInput.fill(username);
    await page.locator('#user_password').fill(password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }).catch(() => {}),
      page.locator('#sysverb_login').click()
    ]);
  }
});

When('user creates an incident with short description {string}', async function (shortDesc: string) {
  const timestamp = Date.now();
  currentShortDescription = `${shortDesc} ${timestamp}`;
  currentIncidentNumber = await incidentPage.createIncident({
    shortDescription: currentShortDescription,
    description: `Created via Cucumber Gherkin BDD test at ${timestamp}`
  });
});

When('user transitions the incident state to {string}', async function (stateLabel: string) {
  if (stateLabel.toLowerCase() === 'resolved') {
    await incidentPage.selectOption('incident.state', '6');
    const codeLoc = incidentPage.inClassicFrame('#incident.close_code');
    if (await codeLoc.count() > 0 && await codeLoc.isVisible()) {
      await incidentPage.selectOption('incident.close_code', 'Solved (Permanently)');
    }
    const notesLoc = incidentPage.inClassicFrame('#incident.close_notes');
    if (await notesLoc.count() > 0 && await notesLoc.isVisible()) {
      await notesLoc.fill('Automated resolution verification via Cucumber BDD.');
    }
  }
});

When('user saves the resolved incident record', async function () {
  const updateBtn = incidentPage.inClassicFrame('#sysverb_update, #sysverb_update_bottom');
  if (await updateBtn.count() > 0) {
    await updateBtn.first().click();
  } else {
    await incidentPage.submitForm();
  }
  await incidentPage.waitForClientScripts();
});

Then('an activity comment should be added containing {string}', async function (expectedCommentPattern: string) {
  if (currentIncidentNumber) {
    await incidentPage.navigateToIncident(currentIncidentNumber);
  }

  const searchSnippet = `regarding "${currentShortDescription}" has been marked as Resolved.`;
  const isPresent = await incidentPage.hasActivityComment(searchSnippet);
  expect(isPresent).toBe(true);
});

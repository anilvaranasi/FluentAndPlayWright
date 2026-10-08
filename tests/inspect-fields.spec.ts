import { test, expect } from '@playwright/test';

test('Inspect Incident Mandatory and Resolution Fields', async ({ page }) => {
  const baseURL = process.env.SN_DEV_INSTANCE || 'https://dev224768.service-now.com';
  const username = process.env.SN_DEV_USER || 'admin';
  const password = process.env.SN_DEV_PASS || 'jD@2F/bRiS5x';

  // 1. Login
  await page.goto(`${baseURL}/login.do`, { waitUntil: 'domcontentloaded' });
  if (page.url().includes('login.do')) {
    await page.locator('#user_name').fill(username);
    await page.locator('#user_password').fill(password);
    await page.locator('#sysverb_login').click();
    await page.waitForLoadState('networkidle');
  }

  // 2. Open new Incident form
  await page.goto(`${baseURL}/incident.do`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const getScopeLocator = async (selector: string) => {
    const hasIframe = (await page.locator('#gsft_main').count()) > 0;
    return hasIframe ? page.frameLocator('#gsft_main').locator(selector) : page.locator(selector);
  };

  // 3. Click Resolution tab
  const resTab = (await getScopeLocator('tab:has-text("Resolution"), [role="tab"]:has-text("Resolution"), [tab_caption="Resolution Information"]')).first();
  if (await resTab.count() > 0) {
    await resTab.click();
    await page.waitForTimeout(1000);
  }

  // 4. Dump all available options in close_code (Resolution code)
  const closeCodeSelect = (await getScopeLocator('#incident\\.close_code, select[name="incident.close_code"], select#close_code')).first();
  if (await closeCodeSelect.count() > 0) {
    const options = await closeCodeSelect.locator('option').allInnerTexts();
    console.log('=== RESOLUTION CODE (close_code) OPTIONS ===');
    console.log(JSON.stringify(options, null, 2));
  } else {
    console.log('close_code select not found directly');
  }

  // 5. Inspect all mandatory fields on the form
  const mandatoryFields = await (await getScopeLocator('.mandatory, [mandatory="true"], [aria-required="true"]')).allInnerTexts();
  console.log('=== MANDATORY FIELDS ON INCIDENT FORM ===');
  console.log(JSON.stringify(mandatoryFields, null, 2));

  // 6. Inspect Resolution Information inputs
  const allInputs = await (await getScopeLocator('input, select, textarea')).evaluateAll(elements => {
    return elements
      .filter(el => el.id.includes('close') || (el as HTMLInputElement).name?.includes('close') || el.id.includes('resolution'))
      .map(el => ({
        id: el.id,
        name: (el as HTMLInputElement).name,
        tagName: el.tagName,
        options: el.tagName === 'SELECT' ? Array.from(el.querySelectorAll('option')).map(o => ({ value: o.value, text: o.textContent?.trim() })) : undefined
      }));
  });
  console.log('=== RESOLUTION FIELD DETAILS ===');
  console.log(JSON.stringify(allInputs, null, 2));
});

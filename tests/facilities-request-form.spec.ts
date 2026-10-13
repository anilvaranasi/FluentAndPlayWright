import { test, expect, Page, APIRequestContext } from '@playwright/test';

// Story: "Build the Request Form" (monday.com item 13273009466)
// Table x_146833_fluentp_0_facilities_request with 5 fields, in this order:
//   Requester Name, Location, Request Type, Description, Priority
// The form is checked on the platform's standard form (/<table>.do), not a Service Portal page.

const TABLE = 'x_146833_fluentp_0_facilities_request';
const FIELDS = ['requester', 'location', 'request_type', 'description', 'priority'];
const LABELS = ['Requester Name', 'Location', 'Request Type', 'Description', 'Priority'];

type Session = { api: APIRequestContext; headers: Record<string, string> };

async function session(page: Page): Promise<Session> {
  await page.goto('/incident_list.do', { waitUntil: 'domcontentloaded' });
  const token = await page.evaluate(() => (window as unknown as { g_ck?: string }).g_ck || '');
  expect(token, 'g_ck session token should be available').not.toBe('');
  return {
    api: page.request,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-UserToken': token },
  };
}

async function openNewForm(page: Page): Promise<void> {
  await page.goto(`/${TABLE}.do?sys_id=-1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(window as unknown as { g_form?: unknown }).g_form, undefined, { timeout: 45_000 });
}

// Most fields render a container with id element.<table>.<field>; multi-line text only exposes the control itself.
const fieldBox = (page: Page, field: string) =>
  page.locator(`[id="element.${TABLE}.${field}"], textarea[id="${TABLE}.${field}"]`).first();

test.describe('Story: Build the Request Form', () => {

  test('TC-RF-01 (AC1): Location field exists on the table and on the form', async ({ page }) => {
    const { api, headers } = await session(page);

    const dict = await api.get(
      `/api/now/table/sys_dictionary?sysparm_query=name=${TABLE}^element=location&sysparm_fields=element,column_label`,
      { headers },
    );
    expect(dict.ok(), `dictionary lookup: ${dict.status()}`).toBeTruthy();
    const rows = (await dict.json()).result;
    expect(rows, 'Location column should exist on the table').toHaveLength(1);
    expect(rows[0].column_label).toBe('Location');

    const el = await api.get(
      `/api/now/table/sys_ui_element?sysparm_query=sys_ui_section.name=${TABLE}^element=location&sysparm_fields=element`,
      { headers },
    );
    expect((await el.json()).result.length, 'Location should be placed on the form').toBeGreaterThan(0);
  });

  test('TC-RF-02 (AC2): all 5 fields are visible, labelled correctly and in the correct order', async ({ page }) => {
    const { api, headers } = await session(page);

    // Verify labels via sys_documentation (authoritative source for column labels)
    const docResp = await api.get(
      `/api/now/table/sys_documentation?sysparm_query=name=${TABLE}^language=en^elementIN${FIELDS.join(',')}&sysparm_fields=element,label`,
      { headers },
    );
    expect(docResp.ok(), `sys_documentation lookup: ${docResp.status()}`).toBeTruthy();
    const docs: { element: string; label: string }[] = (await docResp.json()).result;
    const labelMap = Object.fromEntries(docs.map((d) => [d.element, d.label]));
    for (let i = 0; i < FIELDS.length; i++) {
      expect(labelMap[FIELDS[i]], `${FIELDS[i]} label should be "${LABELS[i]}"`).toBe(LABELS[i]);
    }

    // Verify all 5 fields are visible on the form
    await openNewForm(page);
    for (const f of FIELDS) {
      await expect(fieldBox(page, f), `${f} should be visible`).toBeVisible();
    }

    // Verify top-to-bottom ordering matches the intended order
    const tops: number[] = [];
    for (const f of FIELDS) {
      const box = await fieldBox(page, f).boundingBox();
      expect(box, `${f} should have a layout box`).not.toBeNull();
      tops.push(box!.y);
    }
    expect(tops, 'fields should be stacked top to bottom in the given order').toEqual([...tops].sort((a, b) => a - b));
  });

  test('TC-RF-03 (AC3): Priority offers Low, Medium, High and Critical', async ({ page }) => {
    await openNewForm(page);
    const options = await page.evaluate(
      (id) => Array.from(document.querySelectorAll(`[id="${id}"] option`)).map((o) => (o.textContent || '').trim()),
      `${TABLE}.priority`,
    );
    expect(options.filter((o) => o && !o.startsWith('--'))).toEqual(['Low', 'Medium', 'High', 'Critical']);
  });

  test('TC-RF-04 (AC4): Description is a multi-line field that stores long text without truncating', async ({ page }) => {
    await openNewForm(page);
    const tag = await page.evaluate((id) => document.getElementById(id)?.tagName, `${TABLE}.description`);
    expect(tag, 'Description should render as a textarea').toBe('TEXTAREA');

    const { api, headers } = await session(page);
    const longText = Array.from({ length: 60 }, (_, i) => `Line ${i + 1}: the sink in room ${i + 100} is leaking.`).join('\n');
    const created = await api.post(`/api/now/table/${TABLE}`, {
      headers,
      data: { description: longText, location: 'Playwright', request_type: 'repair', priority: 'low' },
    });
    expect(created.ok(), `create: ${created.status()} ${await created.text()}`).toBeTruthy();
    const sysId: string = (await created.json()).result.sys_id;
    try {
      const read = await api.get(`/api/now/table/${TABLE}/${sysId}?sysparm_fields=description`, { headers });
      expect((await read.json()).result.description.length).toBe(longText.length);
    } finally {
      await api.delete(`/api/now/table/${TABLE}/${sysId}`, { headers });
    }
  });

  for (const vp of [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`TC-RF-05 (AC5): form lays out correctly on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openNewForm(page);
      for (const f of FIELDS) {
        const box = fieldBox(page, f);
        await expect(box, `${f} should be visible on ${vp.name}`).toBeVisible();
        const b = await box.boundingBox();
        expect(b!.x + b!.width, `${f} should not overflow the ${vp.name} viewport`).toBeLessThanOrEqual(vp.width + 2);
      }
    });
  }

  test('TC-RF-06: Requester Name is auto-filled with the logged-in user', async ({ page }) => {
    await openNewForm(page);
    const { value, user } = await page.evaluate(() => {
      const w = window as unknown as { g_form: { getValue(n: string): string }; g_user: { userID: string } };
      return { value: w.g_form.getValue('requester'), user: w.g_user.userID };
    });
    expect(value).not.toBe('');
    expect(value).toBe(user);
  });
});

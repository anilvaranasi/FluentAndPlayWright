import { test, expect, Page, APIRequestContext } from '@playwright/test';

// Story: "Create Request Type Dropdown" (monday.com item 13273008339)
// Choices: Repair, Cleaning, Safety Hazard, Room Booking, Move Request

const TABLE = 'x_146833_fluentp_0_facilities_request';
const CHOICES: [string, string][] = [
  ['repair', 'Repair'],
  ['cleaning', 'Cleaning'],
  ['safety_hazard', 'Safety Hazard'],
  ['room_booking', 'Room Booking'],
  ['move_request', 'Move Request'],
];
const DESC = 'Request created by the automated test suite.';

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

const dropdownOptions = (page: Page) =>
  page.evaluate(
    (id) =>
      Array.from(document.querySelectorAll(`select[id="${id}"] option`)).map((o) => ({
        value: (o as HTMLOptionElement).value,
        label: (o.textContent || '').trim(),
      })),
    `${TABLE}.request_type`,
  );

async function createRequest(s: Session, requestType: string): Promise<string> {
  const r = await s.api.post(`/api/now/table/${TABLE}`, {
    headers: s.headers,
    data: { location: 'Building 1', request_type: requestType, description: DESC, priority: 'low' },
  });
  expect(r.ok(), `create ${requestType}: ${r.status()} ${await r.text()}`).toBeTruthy();
  return (await r.json()).result.sys_id;
}

test.describe('Story: Create Request Type Dropdown', () => {

  test('TC-RT-01 (AC1, AC2): Request Type is a dropdown with the 5 predefined choices', async ({ page }) => {
    await openNewForm(page);
    const tag = await page.evaluate((id) => document.getElementById(id)?.tagName, `${TABLE}.request_type`);
    expect(tag, 'Request Type should render as a select').toBe('SELECT');

    const options = (await dropdownOptions(page)).filter((o) => o.value !== '');
    expect(options.map((o) => o.label)).toEqual(CHOICES.map((c) => c[1]));
    expect(options.map((o) => o.value)).toEqual(CHOICES.map((c) => c[0]));

    // Each choice can be selected
    for (const [value] of CHOICES) {
      await page.selectOption(`select[id="${TABLE}.request_type"]`, value);
      expect(
        await page.evaluate(() => (window as unknown as { g_form: { getValue(n: string): string } }).g_form.getValue('request_type')),
      ).toBe(value);
    }
  });

  test('TC-RT-02 (AC3): selecting Safety Hazard stores safety_hazard on the record', async ({ page }) => {
    const s = await session(page);
    const id = await createRequest(s, 'safety_hazard');
    try {
      const r = await s.api.get(`/api/now/table/${TABLE}/${id}?sysparm_fields=request_type&sysparm_display_value=all`, {
        headers: s.headers,
      });
      const rt = (await r.json()).result.request_type;
      expect(rt.value).toBe('safety_hazard');
    } finally {
      await s.api.delete(`/api/now/table/${TABLE}/${id}`, { headers: s.headers });
    }
  });

  test('TC-RT-03 (AC4): a new choice appears in the dropdown without any code change', async ({ page }) => {
    const s = await session(page);
    const added = await s.api.post('/api/now/table/sys_choice', {
      headers: s.headers,
      data: { name: TABLE, element: 'request_type', label: 'Pest Control', value: 'pest_control', sequence: 60, inactive: 'false' },
    });
    expect(added.ok(), `add choice: ${added.status()} ${await added.text()}`).toBeTruthy();
    const choiceId: string = (await added.json()).result.sys_id;
    try {
      await openNewForm(page);
      const labels = (await dropdownOptions(page)).map((o) => o.label);
      expect(labels).toContain('Pest Control');
    } finally {
      await s.api.delete(`/api/now/table/sys_choice/${choiceId}`, { headers: s.headers });
    }
    await openNewForm(page);
    expect((await dropdownOptions(page)).map((o) => o.label), 'removed again').not.toContain('Pest Control');
  });

  test('TC-RT-04 (AC5): requests can be reported grouped by Request Type', async ({ page }) => {
    const s = await session(page);
    const ids = [await createRequest(s, 'repair'), await createRequest(s, 'cleaning'), await createRequest(s, 'cleaning')];
    try {
      const r = await s.api.get(
        `/api/now/stats/${TABLE}?sysparm_count=true&sysparm_group_by=request_type`,
        { headers: s.headers },
      );
      expect(r.ok(), `aggregate: ${r.status()}`).toBeTruthy();
      const groups: { groupby_fields: { field: string; value: string }[]; stats: { count: string } }[] = (await r.json()).result;
      const byType = Object.fromEntries(groups.map((g) => [g.groupby_fields[0].value, Number(g.stats.count)]));
      expect(byType['repair']).toBeGreaterThanOrEqual(1);
      expect(byType['cleaning']).toBeGreaterThanOrEqual(2);
      expect(Object.keys(byType).length, 'each choice is its own category').toBeGreaterThanOrEqual(2);
    } finally {
      for (const id of ids) await s.api.delete(`/api/now/table/${TABLE}/${id}`, { headers: s.headers });
    }
  });
});

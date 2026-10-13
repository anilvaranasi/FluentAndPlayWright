import { test, expect, Page, APIRequestContext } from '@playwright/test';

// Story: "Add Required Field Validations" (monday.com item 13273006512)
//   - Location and Request Type are mandatory
//   - Description needs at least 20 characters, with an inline error message
// Rules must hold regardless of how the record is submitted (form or API) and regardless of role.

const TABLE = 'x_146833_fluentp_0_facilities_request';
const MIN_MSG = 'Please provide at least 20 characters in the description.';
const GOOD_DESC = 'The sink in room 204 is leaking badly.'; // > 20 chars
const SHORT_DESC = 'too short'; // < 20 chars

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

async function setField(page: Page, field: string, value: string): Promise<void> {
  await page.evaluate(
    ([f, v]) => (window as unknown as { g_form: { setValue(n: string, v: string): void } }).g_form.setValue(f, v),
    [field, value],
  );
}

async function submit(page: Page): Promise<void> {
  await page.locator('#sysverb_insert, #sysverb_insert_bottom').first().click();
}

async function countRecords(s: Session): Promise<number> {
  const r = await s.api.get(`/api/now/stats/${TABLE}?sysparm_count=true`, { headers: s.headers });
  return Number((await r.json()).result.stats.count);
}

async function deleteAll(s: Session, ids: string[]): Promise<void> {
  for (const id of ids) await s.api.delete(`/api/now/table/${TABLE}/${id}`, { headers: s.headers });
}

test.describe('Story: Add Required Field Validations', () => {

  test('TC-VAL-01 (AC1): submitting without a Location is blocked', async ({ page }) => {
    const s = await session(page);
    const before = await countRecords(s);

    await openNewForm(page);
    expect(
      await page.evaluate(() => (window as unknown as { g_form: { isMandatory(n: string): boolean } }).g_form.isMandatory('location')),
      'Location should be mandatory on the form',
    ).toBe(true);

    await setField(page, 'request_type', 'repair');
    await setField(page, 'description', GOOD_DESC);
    await submit(page);
    await expect(page.locator('body')).toContainText(/mandatory fields are not filled in/i);
    await expect(page.locator('body')).toContainText(/Location/);

    // Server side: the same payload through the API is refused too
    const api = await s.api.post(`/api/now/table/${TABLE}`, {
      headers: s.headers,
      data: { request_type: 'repair', description: GOOD_DESC, priority: 'low' },
    });
    expect(api.ok(), 'API insert without Location should be rejected').toBeFalsy();
    expect(await countRecords(s), 'no record should have been created').toBe(before);
  });

  test('TC-VAL-02 (AC2): submitting without a Request Type is blocked', async ({ page }) => {
    const s = await session(page);
    const before = await countRecords(s);

    await openNewForm(page);
    expect(
      await page.evaluate(() => (window as unknown as { g_form: { isMandatory(n: string): boolean } }).g_form.isMandatory('request_type')),
      'Request Type should be mandatory on the form',
    ).toBe(true);

    await setField(page, 'location', 'Building 1');
    await setField(page, 'description', GOOD_DESC);
    await submit(page);
    await expect(page.locator('body')).toContainText(/mandatory fields are not filled in/i);
    await expect(page.locator('body')).toContainText(/Request Type/);

    const api = await s.api.post(`/api/now/table/${TABLE}`, {
      headers: s.headers,
      data: { location: 'Building 1', description: GOOD_DESC, priority: 'low' },
    });
    expect(api.ok(), 'API insert without Request Type should be rejected').toBeFalsy();
    expect(await countRecords(s), 'no record should have been created').toBe(before);
  });

  test('TC-VAL-03 (AC3): Description shorter than 20 characters shows the error and is not saved', async ({ page }) => {
    const s = await session(page);
    const before = await countRecords(s);

    await openNewForm(page);
    await setField(page, 'location', 'Building 1');
    await setField(page, 'request_type', 'repair');
    await setField(page, 'description', SHORT_DESC);
    await submit(page);
    await expect(page.getByText(MIN_MSG).first(), 'inline error message').toBeVisible();

    const api = await s.api.post(`/api/now/table/${TABLE}`, {
      headers: s.headers,
      data: { location: 'Building 1', request_type: 'repair', description: SHORT_DESC, priority: 'low' },
    });
    expect(api.ok(), 'API insert with a short Description should be rejected').toBeFalsy();
    expect(await countRecords(s), 'no record should have been created').toBe(before);
  });

  test('TC-VAL-04 (AC4): a complete request with a long enough Description submits successfully', async ({ page }) => {
    const s = await session(page);
    const created: string[] = [];
    try {
      // Exactly 20 characters is accepted (boundary)
      const exact = await s.api.post(`/api/now/table/${TABLE}`, {
        headers: s.headers,
        data: { location: 'Building 1', request_type: 'cleaning', description: '12345678901234567890', priority: 'low' },
      });
      expect(exact.ok(), `20-character description: ${exact.status()} ${await exact.text()}`).toBeTruthy();
      created.push((await exact.json()).result.sys_id);

      // Through the form
      const before = await countRecords(s);
      await openNewForm(page);
      await setField(page, 'location', 'Building 2');
      await setField(page, 'request_type', 'repair');
      await setField(page, 'description', GOOD_DESC);
      await setField(page, 'priority', 'high');
      await submit(page);
      await expect.poll(() => countRecords(s), { message: 'record should be created from the form', timeout: 30_000 }).toBe(before + 1);
      const list = await s.api.get(
        `/api/now/table/${TABLE}?sysparm_query=location=Building 2^description=${GOOD_DESC}&sysparm_fields=sys_id`,
        { headers: s.headers },
      );
      for (const r of (await list.json()).result) created.push(r.sys_id);
    } finally {
      await deleteAll(s, created);
    }
  });

  test('TC-VAL-05 (AC5): the validations do not depend on the user role', async ({ page }) => {
    const s = await session(page);

    // Data-level mandatory flags are role independent
    const dict = await s.api.get(
      `/api/now/table/sys_dictionary?sysparm_query=name=${TABLE}^elementINlocation,request_type&sysparm_fields=element,mandatory`,
      { headers: s.headers },
    );
    const rows: { element: string; mandatory: string }[] = (await dict.json()).result;
    expect(rows).toHaveLength(2);
    for (const r of rows) expect(r.mandatory, `${r.element} mandatory`).toBe('true');

    // The length rule is a server-side business rule with no role or user condition
    const br = await s.api.get(
      `/api/now/table/sys_script?sysparm_query=collection=${TABLE}^nameLIKEDescription&sysparm_fields=name,active,when,abort_action,filter_condition,role_conditions`,
      { headers: s.headers },
    );
    const rules: Record<string, string>[] = (await br.json()).result;
    expect(rules.length, 'description length business rule should exist').toBeGreaterThan(0);
    for (const r of rules) {
      expect(r.active).toBe('true');
      expect(r.when).toBe('before');
      expect(r.role_conditions || '', 'rule must not be limited to certain roles').toBe('');
    }

    // The form-side check applies to every UI type
    const cs = await s.api.get(
      `/api/now/table/sys_script_client?sysparm_query=table=${TABLE}^type=onSubmit&sysparm_fields=active,ui_type`,
      { headers: s.headers },
    );
    const scripts: { active: string; ui_type: string }[] = (await cs.json()).result;
    expect(scripts.length, 'onSubmit client script should exist').toBeGreaterThan(0);
    expect(scripts[0].active).toBe('true');
    expect(scripts[0].ui_type, 'ui type "All" is value 10').toBe('10');
  });
});

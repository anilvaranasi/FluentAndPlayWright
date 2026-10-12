import { test, expect, Page, APIRequestContext } from '@playwright/test';

// Validates BR "x_146833_fluentp_0 - Require Short Description for In Progress":
// an incident cannot move to In Progress (state 2) while Short description is empty.
// Uses the authenticated UI session (storageState from globalSetup) + X-UserToken for REST calls.

const STATE_IN_PROGRESS = '2';

async function sessionApi(page: Page): Promise<{ api: APIRequestContext; headers: Record<string, string> }> {
  await page.goto('/incident_list.do', { waitUntil: 'domcontentloaded' });
  const token = await page.evaluate(() => (window as unknown as { g_ck?: string }).g_ck || '');
  expect(token, 'g_ck session token should be available').not.toBe('');
  return {
    api: page.request,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-UserToken': token },
  };
}

async function createIncident(api: APIRequestContext, headers: Record<string, string>, shortDescription: string): Promise<string> {
  const res = await api.post('/api/now/table/incident', {
    headers,
    data: { short_description: shortDescription, description: 'Created by Playwright test' },
  });
  expect(res.ok(), `create incident: ${res.status()} ${await res.text()}`).toBeTruthy();
  return (await res.json()).result.sys_id;
}

async function getState(api: APIRequestContext, headers: Record<string, string>, sysId: string): Promise<string> {
  const res = await api.get(`/api/now/table/incident/${sysId}?sysparm_fields=state`, { headers });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).result.state;
}

test.describe('Requirement 2: Short description required before In Progress', () => {

  test('TC-SD-01: blocks move to In Progress when Short description is empty @smoke', async ({ page }) => {
    const { api, headers } = await sessionApi(page);
    const sysId = await createIncident(api, headers, '');
    try {
      const res = await api.patch(`/api/now/table/incident/${sysId}`, {
        headers,
        data: { state: STATE_IN_PROGRESS },
      });

      expect(res.ok(), 'update should be aborted by the business rule').toBeFalsy();
      expect(await getState(api, headers, sysId)).not.toBe(STATE_IN_PROGRESS);
    } finally {
      await api.delete(`/api/now/table/incident/${sysId}`, { headers });
    }
  });

  test('TC-SD-02: allows move to In Progress when Short description is populated @smoke', async ({ page }) => {
    const { api, headers } = await sessionApi(page);
    const sysId = await createIncident(api, headers, `Playwright short desc check ${Date.now()}`);
    try {
      const res = await api.patch(`/api/now/table/incident/${sysId}`, {
        headers,
        data: { state: STATE_IN_PROGRESS },
      });

      expect(res.ok(), `update: ${res.status()} ${await res.text()}`).toBeTruthy();
      expect(await getState(api, headers, sysId)).toBe(STATE_IN_PROGRESS);
    } finally {
      await api.delete(`/api/now/table/incident/${sysId}`, { headers });
    }
  });
});

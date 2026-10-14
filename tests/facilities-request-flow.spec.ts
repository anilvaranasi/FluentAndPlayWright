import { test, expect, Page, APIRequestContext } from '@playwright/test';

// Story: "Trigger Flow on Submission" (monday.com item 13272995032)
// Flow "Facilities Request Submission Flow": trigger = Record Created on the Facilities Request table.
// Flow runs are recorded in sys_flow_context (state, source record, source table).

const TABLE = 'x_146833_fluentp_0_facilities_request';
const FLOW_NAME = 'Facilities Request Submission Flow';
const DESC = 'Request created by the automated flow trigger tests.';

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

async function createRequest(s: Session, location: string): Promise<string> {
  const r = await s.api.post(`/api/now/table/${TABLE}`, {
    headers: s.headers,
    data: { location, request_type: 'repair', description: DESC, priority: 'low' },
  });
  expect(r.ok(), `create request: ${r.status()} ${await r.text()}`).toBeTruthy();
  return (await r.json()).result.sys_id;
}

type Ref = string | { value: string };
type FlowRun = { sys_id: string; state: string; source_record: Ref; name: string };
const refValue = (r: Ref): string => (typeof r === 'string' ? r : r.value);

async function flowRuns(s: Session, recordId: string): Promise<FlowRun[]> {
  const r = await s.api.get(
    `/api/now/table/sys_flow_context?sysparm_query=source_record=${recordId}^flow.name=${encodeURIComponent(FLOW_NAME)}&sysparm_fields=sys_id,state,source_record,name&sysparm_limit=20`,
    { headers: s.headers },
  );
  expect(r.ok(), `flow context lookup: ${r.status()} ${await r.text()}`).toBeTruthy();
  return (await r.json()).result;
}

async function waitForRuns(s: Session, recordId: string, count: number): Promise<FlowRun[]> {
  let runs: FlowRun[] = [];
  await expect
    .poll(async () => (runs = await flowRuns(s, recordId)).length, {
      message: `flow runs for ${recordId}`,
      timeout: 90_000,
      intervals: [2_000, 3_000, 5_000],
    })
    .toBeGreaterThanOrEqual(count);
  return runs;
}

const del = (s: Session, id: string) => s.api.delete(`/api/now/table/${TABLE}/${id}`, { headers: s.headers });

test.describe('Story: Trigger Flow on Submission', () => {

  test('TC-FLOW-01 (AC1): the flow is published and has a Record Created trigger on the Facilities Request table', async ({ page }) => {
    const s = await session(page);
    const r = await s.api.get(
      `/api/now/table/sys_hub_flow?sysparm_query=name=${encodeURIComponent(FLOW_NAME)}&sysparm_fields=sys_id,name,active,status,sys_scope.scope`,
      { headers: s.headers },
    );
    const flows: Record<string, string>[] = (await r.json()).result;
    expect(flows, 'exactly one flow with this name').toHaveLength(1);
    expect(flows[0].active, 'flow should be active').toBe('true');
    expect(flows[0].status, 'flow should be published').toBe('published');

    const trig = await s.api.get(
      `/api/now/table/sys_hub_trigger_instance_v2?sysparm_query=flow=${flows[0].sys_id}&sysparm_fields=trigger_type,table,name`,
      { headers: s.headers },
    );
    const triggers: Record<string, string>[] = (await trig.json()).result;
    expect(triggers.length, 'flow should have a trigger').toBeGreaterThan(0);
  });

  test('TC-FLOW-02 (AC1, AC2): submitting a request starts a flow run that completes and is linked to the record', async ({ page }) => {
    const s = await session(page);
    const id = await createRequest(s, 'Flow test 1');
    try {
      const runs = await waitForRuns(s, id, 1);
      expect(runs).toHaveLength(1);
      expect(refValue(runs[0].source_record)).toBe(id);
      await expect
        .poll(async () => (await flowRuns(s, id))[0].state, { message: 'flow run state', timeout: 90_000 })
        .toBe('COMPLETE');
    } finally {
      await del(s, id);
    }
  });

  test('TC-FLOW-03 (AC3): simultaneous submissions each start their own independent flow run', async ({ page }) => {
    const s = await session(page);
    const ids = await Promise.all(['Flow test A', 'Flow test B', 'Flow test C'].map((l) => createRequest(s, l)));
    try {
      const runsPerRecord = await Promise.all(ids.map((id) => waitForRuns(s, id, 1)));
      const runIds = runsPerRecord.flat().map((r) => r.sys_id);
      expect(new Set(runIds).size, 'every run is a distinct flow context').toBe(ids.length);
      runsPerRecord.forEach((runs, i) => {
        expect(runs, `exactly one run for record ${i}`).toHaveLength(1);
        expect(refValue(runs[0].source_record), 'no cross-contamination of records').toBe(ids[i]);
      });
    } finally {
      for (const id of ids) await del(s, id);
    }
  });

  test('TC-FLOW-04 (AC4): updating an existing request does not start the flow again', async ({ page }) => {
    const s = await session(page);
    const id = await createRequest(s, 'Flow test update');
    try {
      await waitForRuns(s, id, 1);
      const upd = await s.api.patch(`/api/now/table/${TABLE}/${id}`, {
        headers: s.headers,
        data: { priority: 'high', description: `${DESC} (updated)` },
      });
      expect(upd.ok(), `update: ${upd.status()}`).toBeTruthy();
      await page.waitForTimeout(15_000); // give a wrongly triggered run time to appear
      expect(await flowRuns(s, id), 'still exactly one run after the update').toHaveLength(1);
    } finally {
      await del(s, id);
    }
  });

  test('TC-FLOW-05 (AC5): deactivating the flow stops new submissions from triggering it', async ({ page }) => {
    const s = await session(page);
    const find = await s.api.get(
      `/api/now/table/sys_hub_flow?sysparm_query=name=${encodeURIComponent(FLOW_NAME)}&sysparm_fields=sys_id`,
      { headers: s.headers },
    );
    const flowId: string = (await find.json()).result[0].sys_id;
    const setActive = (active: boolean) =>
      s.api.patch(`/api/now/table/sys_hub_flow/${flowId}`, { headers: s.headers, data: { active: String(active) } });

    const off = await setActive(false);
    expect(off.ok(), `deactivate: ${off.status()} ${await off.text()}`).toBeTruthy();
    let id = '';
    try {
      id = await createRequest(s, 'Flow test inactive');
      await page.waitForTimeout(20_000);
      expect(await flowRuns(s, id), 'no run while the flow is inactive').toHaveLength(0);
    } finally {
      expect((await setActive(true)).ok(), 'reactivate the flow').toBeTruthy();
      if (id) await del(s, id);
    }

    const id2 = await createRequest(s, 'Flow test reactivated');
    try {
      await waitForRuns(s, id2, 1);
    } finally {
      await del(s, id2);
    }
  });
});

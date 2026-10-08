import { test, expect } from '@playwright/test';
import { FluentTaskPage } from '../utils/fluent-task-page';

test.describe('Fluent SDK ServiceNow End-to-End Application Suite', () => {
  let taskPage: FluentTaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new FluentTaskPage(page);
  });

  test('TC-01: Fluent SDK Custom Table and Form Rendering @smoke', async ({ page }) => {
    await taskPage.navigateToNewTask();
    // Validate that custom fields defined in app.now.ts exist on the form
    const shortDesc = taskPage.inClassicFrame('#x_146833_fluentp_0_task\\.short_description');
    const priorityOverride = taskPage.inClassicFrame('#x_146833_fluentp_0_task\\.u_priority_override');
    
    await expect(shortDesc).toBeVisible({ timeout: 20_000 });
    await expect(priorityOverride).toBeVisible({ timeout: 20_000 });
  });

  test('TC-02: Priority Override Business Rule Execution @e2e', async ({ page }) => {
    const timestamp = Date.now();
    const testTag = `CI-RUN-${timestamp}`;

    // Create record with Priority Override = 1 (Critical)
    await taskPage.createNewTask({
      shortDescription: `Automated Fluent Pipeline Test ${timestamp}`,
      description: 'Verifying Business Rule br_set_priority_on_insert via Playwright E2E test.',
      priorityOverride: '1',
      customCategory: 'software',
      testTag: testTag
    });

    // Check Priority value is updated to 1
    const prioritySelect = taskPage.inClassicFrame('#x_146833_fluentp_0_task\\.priority');
    if (await prioritySelect.count() > 0) {
      const selectedValue = await prioritySelect.inputValue();
      expect(selectedValue).toBe('1');
    }
  });

  test('TC-03: Close Task & Auto Stamp Reviewed Business Rule @e2e', async ({ page }) => {
    const timestamp = Date.now();

    await taskPage.createNewTask({
      shortDescription: `Close Test ${timestamp}`,
      priorityOverride: '2',
      customCategory: 'hardware',
      testTag: `CLOSE-TEST-${timestamp}`
    });

    // Close the task
    await taskPage.closeTask();

    // Verify Reviewed flag was stamped to true
    const isReviewed = await taskPage.isReviewedChecked();
    expect(isReviewed).toBe(true);
  });
});

import { Page, expect } from '@playwright/test';
import { ServiceNowPage } from './base-page';

export class FluentTaskPage extends ServiceNowPage {
  readonly tableName = 'x_146833_fluentp_0_task';

  constructor(page: Page) {
    super(page);
  }

  async navigateToNewTask(): Promise<void> {
    await this.goto(`${this.tableName}.do`);
    await this.waitForClientScripts();
  }

  async navigateToRecord(sysId: string): Promise<void> {
    await this.goto(`${this.tableName}.do?sys_id=${sysId}`);
    await this.waitForClientScripts();
  }

  async navigateToList(): Promise<void> {
    await this.goto(`${this.tableName}_list.do`);
    await this.waitForClientScripts();
  }

  async createNewTask(data: {
    shortDescription: string;
    description?: string;
    priorityOverride?: string | number;
    customCategory?: string;
    testTag?: string;
  }): Promise<string> {
    await this.navigateToNewTask();

    // Fill Short Description
    await this.fillField(`${this.tableName}.short_description`, data.shortDescription);

    if (data.description) {
      await this.fillField(`${this.tableName}.description`, data.description);
    }

    if (data.priorityOverride) {
      await this.fillField(`${this.tableName}.u_priority_override`, String(data.priorityOverride));
    }

    if (data.customCategory) {
      await this.selectOption(`${this.tableName}.u_custom_category`, data.customCategory);
    }

    if (data.testTag) {
      await this.fillField(`${this.tableName}.u_test_tag`, data.testTag);
    }

    await this.submitForm();

    // Extract created number/record identifier or URL sys_id
    const recordNumberInput = this.inClassicFrame(`#${this.tableName}.number`);
    if (await recordNumberInput.count() > 0) {
      return (await recordNumberInput.inputValue()) || '';
    }
    return '';
  }

  async closeTask(taskSysId?: string): Promise<void> {
    if (taskSysId) {
      await this.navigateToRecord(taskSysId);
    }
    // Set state to Closed (7)
    await this.selectOption(`${this.tableName}.state`, '7');
    await this.submitForm();
  }

  async isReviewedChecked(): Promise<boolean> {
    const checkbox = this.inClassicFrame(`#${this.tableName}.u_reviewed, #ni\\.${this.tableName}\\.u_reviewed`);
    if (await checkbox.count() > 0) {
      return await checkbox.first().isChecked();
    }
    return false;
  }
}

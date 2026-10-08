import { Page, Locator } from '@playwright/test';

export class IncidentSOWPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToSOW(): Promise<void> {
    await this.page.goto('now/sow/home', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async openIncidentList(): Promise<void> {
    await this.page.getByRole('tab', { name: 'List' }).click();
    await this.page.waitForTimeout(1000);
    const assignedToYou = this.page.getByText('Assigned to you', { exact: true });
    if (await assignedToYou.count() > 0) {
      await assignedToYou.first().click();
    }
  }

  async clickNew(): Promise<void> {
    await this.page.getByRole('button', { name: 'New' }).click();
    await this.page.waitForTimeout(2000);
  }

  async fillShortDescription(text: string): Promise<void> {
    const shortDesc = this.page.getByRole('textbox', { name: /Short description/i }).first();
    await shortDesc.click();
    await shortDesc.fill(text);
  }

  async selectFirstCaller(): Promise<void> {
    const callerCombo = this.page.getByRole('combobox', { name: 'Caller' }).first();
    await callerCombo.click();
    await callerCombo.fill('a');
    await this.page.waitForTimeout(500);
    await callerCombo.press('ArrowDown');
    await callerCombo.press('ArrowDown');
    await callerCombo.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async save(): Promise<void> {
    const saveBtn = this.page.getByRole('button', { name: 'Save', exact: true }).first();
    await saveBtn.click();
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async resolveIncident(notes: string = 'Resolved'): Promise<void> {
    const detailsTab = this.page.getByRole('tab', { name: 'Details' }).first();
    if (await detailsTab.isVisible()) {
      await detailsTab.click();
      await this.page.waitForTimeout(1000);
    }

    const resCodeCombo = this.page.getByRole('combobox', { name: 'Resolution code' }).first();
    await resCodeCombo.click();
    await this.page.waitForTimeout(500);

    const solutionProvidedOption = this.page.locator('[id="Solution provided"]').getByText('Solution provided')
      .or(this.page.getByRole('option', { name: 'Solution provided' }))
      .or(this.page.getByText('Solution provided'))
      .first();
    await solutionProvidedOption.click();

    const resNotesInput = this.page.getByRole('textbox', { name: /Resolution notes/i }).first();
    await resNotesInput.click();
    await resNotesInput.fill(notes);

    await this.page.getByRole('button', { name: 'Resolve', exact: true }).first().click();
    await this.page.waitForTimeout(1000);

    const modalResolveBtn = this.page.locator('#item-save_button').getByRole('button', { name: 'Resolve' })
      .or(this.page.getByRole('button', { name: 'Resolve', exact: true }))
      .first();
    if (await modalResolveBtn.count() > 0 && await modalResolveBtn.isVisible()) {
      await modalResolveBtn.click();
    }

    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(3000);
  }
}

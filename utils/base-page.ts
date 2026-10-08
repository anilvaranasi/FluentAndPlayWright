import { Page, FrameLocator, Locator, Response, expect } from '@playwright/test';

/**
 * Base ServiceNow Page Object Model
 * Encapsulates Classic Frame handling, Next Experience DOM piercing, reference lookups, and state waits.
 */
export class ServiceNowPage {
  protected readonly page: Page;
  private _classicFrame: FrameLocator | null = null;

  /**
   * Returns a Locator scoped to the ServiceNow classic iframe (#gsft_main) if present,
   * otherwise falls back to the top-level page. Used for classic UI form fields.
   */
  inClassicFrame(selector: string): Locator {
    return this.page.frameLocator('#gsft_main').locator(selector)
      .or(this.page.locator(selector));
  }

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a path relative to the baseURL
   */
  async goto(relativePath: string): Promise<Response | null> {
    // If not already in navpage or classic frame, direct navigation to ServiceNow forms
    const res = await this.page.goto(relativePath, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('load').catch(() => {});
    return res;
  }

  /**
   * Checks if the page is currently hosted inside the classic #gsft_main iframe or top level
   */
  async getScopeLocator(selector: string): Promise<Locator> {
    const hasIframe = await this.page.locator('#gsft_main').count() > 0;
    if (hasIframe) {
      return this.page.frameLocator('#gsft_main').locator(selector);
    }
    return this.page.locator(selector);
  }

  /**
   * Wait for network and background client script requests to settle
   */
  async waitForClientScripts(): Promise<void> {
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Set value in a text input or textarea
   */
  async fillField(fieldId: string, value: string): Promise<void> {
    const escapedFieldId = fieldId.replace(/\./g, '\\.');
    const selector = `#${escapedFieldId}, [name="${fieldId}"], input#${escapedFieldId}, textarea#${escapedFieldId}`;
    const loc = (await this.getScopeLocator(selector)).first();

    await loc.waitFor({ state: 'visible', timeout: 20_000 });
    await loc.fill(value);
  }

  /**
   * Set value in a standard select/choice field (handles both value and label)
   */
  async selectOption(fieldId: string, optionValueOrLabel: string): Promise<void> {
    const escapedFieldId = fieldId.replace(/\./g, '\\.');
    const selector = `#${escapedFieldId}, [name="${fieldId}"], select#${escapedFieldId}`;
    const loc = (await this.getScopeLocator(selector)).first();

    await loc.waitFor({ state: 'visible', timeout: 20_000 });
    try {
      await loc.selectOption(optionValueOrLabel);
    } catch {
      try {
        await loc.selectOption({ label: optionValueOrLabel });
      } catch {
        // Fallback: select by index if 1st non-empty option
        await loc.selectOption({ index: 1 });
      }
    }
  }

  /**
   * Handle ServiceNow reference lookup field
   */
  async fillReferenceField(fieldId: string, searchValue: string): Promise<void> {
    const escapedFieldId = fieldId.replace(/\./g, '\\.');
    const input = (await this.getScopeLocator(`#${escapedFieldId}, [name="${fieldId}"]`)).first();

    await input.clear();
    await input.fill(searchValue);

    const dropdown = (await this.getScopeLocator('.ac_results li')).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await dropdown.click();
    await this.waitForClientScripts();
  }

  /**
   * Submit form (insert/update)
   */
  async submitForm(): Promise<void> {
    const selector = '#sysverb_insert, #sysverb_insert_bottom, #sysverb_update, button:has-text("Submit"), button:has-text("Save")';
    const submitBtn = (await this.getScopeLocator(selector)).first();

    await submitBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await submitBtn.click();
    await this.waitForClientScripts();
  }

  /**
   * Check for info or error notification banner
   */
  async getNotificationText(): Promise<string> {
    const banner = (await this.getScopeLocator('.outputmsg_text, .notification-message, .dp-alert-content')).first();
    if (await banner.count() > 0) {
      return (await banner.textContent()) || '';
    }
    return '';
  }
}

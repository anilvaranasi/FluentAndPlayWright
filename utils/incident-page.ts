import { Page, expect } from '@playwright/test';
import { ServiceNowPage } from './base-page';

export class IncidentPage extends ServiceNowPage {
  readonly tableName = 'incident';

  constructor(page: Page) {
    super(page);
  }

  async navigateToNewIncident(): Promise<void> {
    await this.goto('incident.do');
    await this.waitForClientScripts();
  }

  /**
   * Navigates to the Incident list with number parameter URL and opens the matching record
   */
  async openIncidentFromList(incNumber: string): Promise<void> {
    // 1. Open incident list directly filtered by the incident number parameter
    const listUrl = `incident_list.do?sysparm_query=number%3D${encodeURIComponent(incNumber)}&sysparm_first_row=1&sysparm_view=`;
    await this.goto(listUrl);
    await this.waitForClientScripts();
    await this.page.waitForTimeout(1000);

    // 2. Click the matching incident link from the filtered list row
    const recordLink = (await this.getScopeLocator(`a:has-text("${incNumber}"), a.linked.formlink, a[aria-label*="${incNumber}"]`)).first();
    await recordLink.waitFor({ state: 'visible', timeout: 20_000 });
    await recordLink.click();
    await this.waitForClientScripts();
    await this.page.waitForTimeout(1000);
  }

  async navigateToIncident(sysIdOrNumber: string): Promise<void> {
    if (sysIdOrNumber.startsWith('INC')) {
      await this.openIncidentFromList(sysIdOrNumber);
    } else {
      await this.goto(`incident.do?sys_id=${sysIdOrNumber}`);
      await this.waitForClientScripts();
    }
  }

  /**
   * Creates a new standard incident record and returns the assigned INC number
   */
  /**
   * Selects the first caller from reference lookup popup or auto-completer
   */
  async selectFirstCaller(): Promise<void> {
    // Target the visible display input for Caller reference lookup
    const callerInput = (await this.getScopeLocator('input[id="sys_display.incident.caller_id"], input[name="sys_display.incident.caller_id"], input[aria-label="Caller"]')).first();
    if (await callerInput.count() > 0) {
      await callerInput.waitFor({ state: 'visible', timeout: 15_000 });
      await callerInput.click();
      await callerInput.fill('System Administrator');
      await this.page.waitForTimeout(1000);
      
      const acOption = (await this.getScopeLocator('.ac_results li, .autocomplete-item, [role="option"]')).first();
      if (await acOption.count() > 0 && await acOption.isVisible()) {
        await acOption.click();
      } else {
        await callerInput.press('Enter');
      }
      await this.waitForClientScripts();
    } else {
      // Fallback: lookup button or direct field setter
      const lookupBtn = (await this.getScopeLocator('button[id="lookup.incident.caller_id"], button[aria-label*="Caller"]')).first();
      if (await lookupBtn.count() > 0) {
        await lookupBtn.click();
      }
    }
  }

  /**
   * Save the current form record without leaving the page (using context menu Save or form action)
   */
  async saveForm(): Promise<void> {
    // 1. Check for visible top header Save button
    const saveBtn = (await this.getScopeLocator('button:has-text("Save"), #sysverb_insert_and_stay, #sysverb_update_and_stay')).first();
    if (await saveBtn.count() > 0 && await saveBtn.isVisible()) {
      await saveBtn.click();
      await this.waitForClientScripts();
      return;
    }

    // 2. Or trigger ServiceNow form context menu (right click header / burger menu -> Save)
    const contextMenuBtn = (await this.getScopeLocator('button[aria-label="additional actions"], button[data-original-title="Additional actions"]')).first();
    if (await contextMenuBtn.count() > 0 && await contextMenuBtn.isVisible()) {
      await contextMenuBtn.click();
      await this.page.waitForTimeout(500);
      const saveMenuOption = (await this.getScopeLocator('div.context_item:has-text("Save"), [item-id="save"]')).first();
      if (await saveMenuOption.count() > 0 && await saveMenuOption.isVisible()) {
        await saveMenuOption.click();
        await this.waitForClientScripts();
        return;
      }
    }

    // 3. Fallback: Submit form
    await this.submitForm();
  }

  /**
   * Creates a new standard incident record, populates mandatory caller and short description,
   * saves the record (stays on the same form), and returns the assigned INC number.
   */
  async createIncident(data: {
    caller?: string;
    shortDescription: string;
    description?: string;
  }): Promise<string> {
    await this.navigateToNewIncident();

    // 1. Mandatory Caller Selection
    if (data.caller) {
      await this.fillReferenceField('incident.caller_id', data.caller);
    } else {
      await this.selectFirstCaller();
    }

    // 2. Short description
    await this.fillField('incident.short_description', data.shortDescription);

    if (data.description) {
      await this.fillField('incident.description', data.description);
    }

    // 3. Capture the generated incident number
    const numberInput = (await this.getScopeLocator('input[id="incident.number"], input[name="incident.number"]')).first();
    let incNumber = '';
    if (await numberInput.count() > 0) {
      incNumber = (await numberInput.inputValue()) || '';
    }

    // 4. Save to create and STAY on the same record
    await this.saveForm();

    // Re-verify captured number after save
    if (!incNumber && (await numberInput.count()) > 0) {
      incNumber = (await numberInput.inputValue()) || '';
    }

    return incNumber;
  }

  /**
   * Sets Incident state to Resolved (6), fills required resolution fields, and saves/updates
   */
  async resolveIncident(data: {
    resolutionCode?: string;
    resolutionNotes?: string;
  } = {}): Promise<void> {
    // 1. Activate Resolution Information tab first so fields are interactable
    const resTab = (await this.getScopeLocator('tab:has-text("Resolution"), [role="tab"]:has-text("Resolution"), [tab_caption="Resolution Information"]')).first();
    if (await resTab.count() > 0 && await resTab.isVisible()) {
      await resTab.click();
      await this.page.waitForTimeout(500);
    }

    // 2. Select Resolution Code -> "Solution provided" / "Solved (Permanently)" / "Solution proposed"
    const codeLoc = (await this.getScopeLocator('#incident\\.close_code, select[name="incident.close_code"], select#close_code')).first();
    if (await codeLoc.count() > 0 && await codeLoc.isVisible()) {
      const targetCode = data.resolutionCode || 'Solution provided';
      try {
        await codeLoc.selectOption({ label: targetCode });
      } catch {
        try {
          await codeLoc.selectOption({ label: 'Solved (Permanently)' });
        } catch {
          try {
            await codeLoc.selectOption(targetCode);
          } catch {
            await codeLoc.selectOption({ index: 1 });
          }
        }
      }
    }

    // 3. Enter Resolution Notes
    const notesLoc = (await this.getScopeLocator('#incident\\.close_notes, textarea[name="incident.close_notes"], textarea#close_notes')).first();
    if (await notesLoc.count() > 0 && await notesLoc.isVisible()) {
      await notesLoc.fill(data.resolutionNotes || 'Resolved through automated verification test.');
    }

    // 4. Click the "Resolve" button / UI action
    const resolveBtn = (await this.getScopeLocator('button#resolve_incident, #resolve_incident_bottom, button:has-text("Resolve")')).first();
    if (await resolveBtn.count() > 0 && await resolveBtn.isVisible()) {
      await resolveBtn.click();
    } else {
      // Fallback: set State to 6 and save
      await this.selectOption('incident.state', '6');
      await this.saveForm();
    }
    await this.waitForClientScripts();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if Activity stream contains the greeting comment with the short description
   */
  async hasActivityComment(expectedText: string): Promise<boolean> {
    // 1. Check direct page / frame body content first
    const topPageContent = (await this.page.locator('body').textContent()) || '';
    if (topPageContent.includes(expectedText)) return true;

    if (await this.page.locator('#gsft_main').count() > 0) {
      const frameContent = (await this.page.frameLocator('#gsft_main').locator('body').textContent()) || '';
      if (frameContent.includes(expectedText)) return true;
    }

    // 2. Check Activity stream entries or Notes journal section
    const journalEntries = await (await this.getScopeLocator('.activity_stream, .activity-stream-item, .journal-entry, .sn-widget-stream-entry, [role="listitem"]')).allInnerTexts();
    for (const entry of journalEntries) {
      if (entry.includes(expectedText)) return true;
    }

    // 3. Check Notes tab comments if present
    const notesTab = (await this.getScopeLocator('tab:has-text("Notes"), [role="tab"]:has-text("Notes"), [tab_caption="Notes"]')).first();
    if (await notesTab.count() > 0 && await notesTab.isVisible()) {
      await notesTab.click();
      await this.page.waitForTimeout(500);
      const notesContent = (await (await this.getScopeLocator('body')).first().textContent()) || '';
      if (notesContent.includes(expectedText)) return true;
    }

    return false;
  }
}

# GitOps for ServiceNow: CI/CD with the Fluent SDK and Playwright

**Author:** Srinivas Anil Kumar Varanasi  
**Practice:** IBM Consulting — ServiceNow Platform Engineering  
**Audience:** ServiceNow Architects, Platform Engineers, DevOps Practitioners  
**Type:** Technical Deep Dive  

---

## Abstract

ServiceNow customisation has traditionally been a point-and-click, instance-bound activity. Changes are made directly in a browser, transported between environments via Update Sets, and verified manually. This model creates drift, makes peer review difficult, and has no native path to automated testing.

This article presents a production-grade GitOps framework for ServiceNow. Using the **ServiceNow Fluent SDK** (now-sdk) to define platform artifacts in TypeScript, **Playwright** to run automated browser-based end-to-end tests, and **GitHub Actions** to orchestrate a multi-stage CI/CD pipeline, we demonstrate a workflow where every change is version-controlled, automatically deployed, and test-verified before reaching production.

The complete framework is open source at: **https://github.com/anilvaranasi/FluentAndPlayWright**

---

## 1. The Problem with Traditional ServiceNow Development

ServiceNow development has long suffered from a structural impedance mismatch with modern software engineering practices.

**Update Sets are not code.** They are XML snapshots of instance state. They cannot be meaningfully reviewed in a pull request, cannot be linted, cannot be type-checked, and carry no history of intent — only a record of what changed in the database.

**Testing is manual.** The standard practice for validating a Business Rule or Client Script is to open a form in a browser and perform actions by hand. This does not scale, is not repeatable, and produces no artefact that can be attached to a change record or audit trail.

**Environments drift.** Without automated deployment, DEV and PROD instances gradually diverge. A hotfix applied directly to PROD is never back-ported. A script tested on DEV behaves differently on PROD because a dependent configuration element was never transported.

**Collaboration is hard.** When multiple developers work on the same instance, there is no merge conflict detection, no code ownership, and no way to run `git blame` on a Business Rule.

The ServiceNow Fluent SDK — introduced as part of the now-sdk toolchain — is ServiceNow's answer to the first of these problems. This framework is the answer to all of them together.

---

## 2. Architecture Overview

The framework combines four components into a single cohesive pipeline:

```
Developer Local Machine
│
├── src/fluent/app.now.ts          ← ServiceNow artifacts as TypeScript
├── src/server/*.js                ← Server-side script logic
├── tests/*.spec.ts                ← Playwright E2E test specifications
└── utils/                         ← Page Object Model helpers
         │
         ▼
    git push origin mydev:nowdev
         │
         ▼
    GitHub Actions (nowdev-pipeline.yml)
    ┌─────────────────────────────────────────┐
    │  Stage 1: Typecheck + now-sdk build      │
    │  Stage 2: Deploy → ServiceNow DEV        │  ← environment: development
    │  Stage 3: Playwright E2E tests vs DEV    │  ← environment: development
    └─────────────────────────────────────────┘
         │ on success → merge to prod branch
         ▼
    GitHub Actions (prod-pipeline.yml)
    ┌─────────────────────────────────────────┐
    │  Stage 1: Playwright gate vs DEV         │  ← environment: development
    │  Stage 2: Build for PROD                 │  ← environment: production
    │  Stage 3: Manual approval gate           │  ← reviewer approval required
    │  Stage 4: Deploy → ServiceNow PROD       │
    │  Stage 5: Tag release                    │
    └─────────────────────────────────────────┘
```

A fifth workflow handles the reverse direction — pulling the current state of the ServiceNow application back into the `mydev` branch so developers can stay in sync with instance-side changes:

```
    GitHub Actions (sn-pull-sync.yml)      ← manual trigger
    │
    └─ now-sdk transform → commit → push origin mydev
                                       │
                                       └─ git pull origin mydev  (local)
```

---

## 3. Branch Strategy

Four branches serve distinct roles:

| Branch | Purpose | Who writes to it |
|--------|----------|-----------------|
| `mydev` | Local development sync + SN pull target | Developer locally; GitHub Actions (sn-pull-sync) |
| `nowdev` | DEV pipeline trigger | Developer via `git push origin mydev:nowdev` |
| `prod` | PROD pipeline trigger | PR merge from `nowdev` |
| `master` | Source of truth; pipeline definitions | Maintained in sync with all branches |

The key discipline: **you never push directly to `nowdev` or `prod` from a feature context.** You work on `mydev` locally, push to `nowdev` when ready for DEV validation, and create a PR to `prod` when tests pass.

---

## 4. Metadata as Code — The Fluent SDK

The ServiceNow Fluent SDK allows platform artifacts to be expressed as TypeScript function calls. The compiler and `now-sdk build` validate the structure before any code touches an instance.

### 4.1 Project Configuration

**`now.config.json`** identifies the scoped application:

```json
{
  "scope": "x_146833_fluentp_0",
  "scopeId": "80ea27a9833f4350b96f6ed0deaad348",
  "name": "FluentPlaywrightApp"
}
```

The `scopeId` is the `sys_id` of the `sys_scope` record on the ServiceNow instance. The SDK uses this to target the correct application during install.

### 4.2 Table Definition

A custom table extending the `task` table, with five application-specific columns:

```typescript
export const x_146833_fluentp_0_task = Table({
    name: 'x_146833_fluentp_0_task',
    label: 'Fluent Playwright Task',
    extends: 'task',
    autoNumber: { prefix: 'FPT', number: 1000, numberOfDigits: 7 },
    schema: {
        u_priority_override: IntegerColumn({ label: 'Priority Override' }),
        u_custom_category: ChoiceColumn({
            label: 'Custom Category',
            choices: {
                hardware: { label: 'Hardware', sequence: 10 },
                software: { label: 'Software', sequence: 20 },
                network:  { label: 'Network',  sequence: 30 },
                security: { label: 'Security', sequence: 40 },
            },
        }),
        u_channel_source: StringColumn({ label: 'Channel Source', maxLength: 100 }),
        u_reviewed:       BooleanColumn({ label: 'Reviewed', default: 'false' }),
        u_test_tag:       StringColumn({ label: 'Automated Test Tag', maxLength: 100 }),
    },
})
```

Contrast this with the Update Set equivalent: an XML blob describing `sys_dictionary` rows, `sys_choice` rows, and `sys_db_object` rows — none of which is human-readable or reviewable.

### 4.3 Business Rules

Two Business Rules are defined in TypeScript. Their script bodies live in a separate `businessRuleScripts.js` file, keeping logic testable in isolation:

```typescript
// Business Rule 1: Copy priority override to priority on insert
BusinessRule({
    $id: Now.ID['br_set_priority_on_insert'],
    name: 'x_146833_fluentp_0 - Set Priority on Insert',
    table: 'x_146833_fluentp_0_task',
    active: true,
    when: 'before',
    action: ['insert'],
    order: 100,
    script: setPriorityOnInsert,   // imported function reference
})

// Business Rule 2: Auto-stamp u_reviewed = true when task closes
BusinessRule({
    $id: Now.ID['br_stamp_reviewed_on_close'],
    name: 'x_146833_fluentp_0 - Stamp Reviewed on Close',
    table: 'x_146833_fluentp_0_task',
    when: 'before',
    action: ['update'],
    order: 200,
    script: stampReviewedOnClose,
})
```

A third Business Rule operates on the out-of-box `incident` table, automatically adding a personalised resolution comment when an incident transitions to state 6 (Resolved):

```typescript
BusinessRule({
    $id: Now.ID['br_incident_resolved_comment'],
    name: 'x_146833_fluentp_0 - Incident Resolved Auto Comment',
    table: 'incident',
    when: 'before',
    action: ['insert', 'update'],
    condition: script`current.state == 6 || current.incident_state == 6`,
    order: 100,
    script: script`function executeRule(current, previous) {
        var callerName = current.caller_id
            ? (current.caller_id.getDisplayValue() || 'Valued Customer')
            : 'Valued Customer';
        current.comments = 'Hello ' + callerName + ',\n\n' +
            'Your incident "' + current.short_description +
            '" has been marked as Resolved.\n' +
            'Thank you for contacting ServiceNow Support.';
        gs.info('[FluentPlay] Resolution comment added: ' + current.number);
    }`,
})
```

### 4.4 Client Script and Script Include

A Client Script provides form-load messaging, and a Script Include (`FluentPlayUtils`) exposes server-side utilities callable from both server and client contexts. Both are defined in the same `app.now.ts` file, providing a single source of truth for the entire application's configuration surface.

### 4.5 Why This Matters

Every artifact above is:

- **Version-controlled** — every change has a commit hash, author, and message
- **Type-checked** — the TypeScript compiler and `now-sdk` validate structure before deployment
- **Reviewable** — diffs in GitHub PRs show exactly what changed and why
- **Auditable** — the git log is the deployment history
- **Repeatable** — `npm run deploy` produces the same result every time against any target instance

---

## 5. Automated Testing with Playwright

### 5.1 The Testing Challenge in ServiceNow

ServiceNow's UI presents two unique automation challenges:

1. **Classic UI forms are rendered inside a `#gsft_main` iframe.** Standard Playwright selectors do not cross iframe boundaries without explicit `frameLocator()` calls.
2. **Next Experience (Workspace) uses Shadow DOM.** Standard CSS selectors cannot pierce Shadow DOM without explicit configuration.

The framework addresses both through a base Page Object class.

### 5.2 Page Object Model

`ServiceNowPage` is the base class that all page-specific objects inherit from. It abstracts the iframe boundary:

```typescript
export class ServiceNowPage {

  // Returns a Locator that works regardless of whether the form
  // is inside #gsft_main or rendered at the top level
  inClassicFrame(selector: string): Locator {
    return this.page.frameLocator('#gsft_main').locator(selector)
      .or(this.page.locator(selector));
  }

  // Dynamically detects iframe presence before each interaction
  async getScopeLocator(selector: string): Promise<Locator> {
    const hasIframe = await this.page.locator('#gsft_main').count() > 0;
    if (hasIframe) {
      return this.page.frameLocator('#gsft_main').locator(selector);
    }
    return this.page.locator(selector);
  }

  // Waits for network and background client scripts to settle
  async waitForClientScripts(): Promise<void> {
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // Handles ServiceNow's reference lookup / autocomplete fields
  async fillReferenceField(fieldId: string, searchValue: string): Promise<void> {
    const input = (await this.getScopeLocator(`[name="${fieldId}"]`)).first();
    await input.fill(searchValue);
    const dropdown = (await this.getScopeLocator('.ac_results li')).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await dropdown.click();
  }
}
```

`FluentTaskPage` extends this base with application-specific navigation:

```typescript
export class FluentTaskPage extends ServiceNowPage {
  readonly tableName = 'x_146833_fluentp_0_task';

  async navigateToNewTask(): Promise<void> {
    await this.goto(`${this.tableName}.do`);
    await this.waitForClientScripts();
  }

  async createNewTask(data: { shortDescription: string; ... }): Promise<string> {
    await this.navigateToNewTask();
    await this.fillField(`${this.tableName}.short_description`, data.shortDescription);
    // ... field interactions
    await this.submitForm();
    return recordNumber;
  }
}
```

### 5.3 Global Setup — Session Persistence

`global-setup.ts` runs once before the test suite. It logs into ServiceNow using the Chromium browser, then serialises the authenticated session to `.auth/storageState.json`. Every subsequent test loads this state, bypassing the login page entirely and saving 15–30 seconds per test file.

```typescript
export default async function globalSetup(_config: FullConfig): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login.do`);
  await page.locator('#user_name').fill(username);
  await page.locator('#user_password').fill(password);
  await page.locator('#sysverb_login').click();

  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
```

### 5.4 Playwright Configuration for ServiceNow

Key configuration decisions in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  workers: 1,          // Sequential — ServiceNow handles one active session cleanly
  fullyParallel: false,
  timeout: 90_000,     // ServiceNow pages can take 20–40s to fully load
  expect: { timeout: 15_000 },
  retries: isCI ? 1 : 0,

  use: {
    headless: true,
    baseURL: process.env.SN_DEV_INSTANCE,
    storageState: STORAGE_STATE,   // Pre-authenticated session
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  },
});
```

---

## 6. The CI/CD Pipeline

### 6.1 nowdev Pipeline — Development Validation

Triggered by any push to the `nowdev` branch. This is where the majority of the development feedback loop lives.

```yaml
jobs:
  build:
    name: Typecheck & Build
    steps:
      - run: npm run typecheck   # tsc --noEmit
      - run: npm run build       # now-sdk build

  deploy-dev:
    needs: build
    environment: development     # pulls SN_DEV_* secrets from GitHub Environment
    steps:
      - run: now-sdk auth --add $SN_DEV_INSTANCE ...
      - run: npm run deploy -- --auth dev

  playwright-dev:
    needs: deploy-dev
    environment: development
    steps:
      - run: npx playwright install --with-deps chromium
      - run: npm run test
      - uses: actions/upload-artifact@v4   # HTML report always uploaded
        if: always()
```

**Total pipeline time:** approximately 3–4 minutes from push to green.

### 6.2 prod Pipeline — Production Promotion

Triggered by push or PR merge to `prod`. Adds a re-validation gate and a mandatory human approval step before any code reaches production.

```yaml
jobs:
  playwright-gate:
    environment: development     # re-run tests against DEV as final check
    steps:
      - run: npm run test

  build-prod:
    needs: playwright-gate
    environment: production

  deploy-prod:
    needs: build-prod
    environment: production      # requires manual reviewer approval in GitHub
    steps:
      - run: npm run deploy -- --auth prod
      - name: Tag release
        run: |
          git tag -a "release-$(date +'%Y%m%d-%H%M%S')" \
            -m "Production deployment — Playwright verified"
          git push origin --tags
```

### 6.3 ServiceNow Pull Sync — Reverse Direction

When platform administrators make changes directly on the ServiceNow instance (configuration items, system properties, etc.), those changes can be pulled back into the `mydev` branch:

```yaml
# Triggered manually from GitHub Actions UI
on:
  workflow_dispatch:
    inputs:
      instance:
        type: choice
        options: [ dev, prod ]

steps:
  - run: npx now-sdk transform --auth ${{ inputs.instance }}
  - run: git commit -m "sync: pull from ServiceNow ${{ inputs.instance }}"
  - run: git push origin mydev
```

Developers then run `git pull origin mydev` locally to receive the changes.

### 6.4 GitHub Environments and Secret Scoping

GitHub Environments (`development` and `production`) provide secret isolation and deployment tracking:

| Environment | Secrets | Protection |
|-------------|---------|------------|
| `development` | `SN_DEV_INSTANCE`, `SN_DEV_USER`, `SN_DEV_PASS` | None — fast feedback |
| `production` | `SN_PROD_INSTANCE`, `SN_PROD_USER`, `SN_PROD_PASS` | Required reviewer approval |

This means PROD credentials are never available to the `nowdev` pipeline — they cannot be accidentally used or exposed.

---

## 7. TypeScript Configuration for now-sdk

The `tsconfig.json` required careful tuning to work with both the ServiceNow SDK and Playwright's DOM types:

```json
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    "target": "ES2022",
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": [
    "tests/**/*.ts",
    "utils/**/*.ts",
    "playwright.config.ts",
    "global-setup.ts"
  ],
  "exclude": ["src"]
}
```

The `src/` directory (containing `app.now.ts`) is **excluded from `tsc`**. The Fluent SDK uses global identifiers (`Now`, `script`) that are injected by the `now-sdk build` compiler — not by TypeScript. Trying to typecheck these files with `tsc` produces errors. The solution is to let each tool own its domain: `tsc` typechecks test and utility code; `now-sdk build` compiles the Fluent metadata.

---

## 8. Challenges and Solutions

### Challenge 1: ServiceNow iframe boundary

**Problem:** Classic ServiceNow forms are embedded in `#gsft_main`. `page.locator('#field_id')` fails because the element is inside the iframe, not the top-level document.

**Solution:** The `inClassicFrame()` helper uses `frameLocator('#gsft_main').locator(selector).or(page.locator(selector))` — attempting the iframe scope first and falling back to top-level for newer UI variants.

### Challenge 2: now-sdk Node.js version requirement

**Problem:** `now-sdk@4.13.0` requires Node.js `>=20.18.0`. The original workflow used Node 18, causing a build failure with the message `now-sdk requires node version to be >=20.18.0`.

**Solution:** Set `NODE_VERSION: '20'` in the GitHub Actions workflow environment variable. Node 20 is the LTS version and satisfies the SDK constraint.

### Challenge 3: `moduleResolution` incompatibility

**Problem:** `@servicenow/sdk/core` uses subpath exports that are only resolvable with `moduleResolution: Node16` or higher. The original `Node` setting caused `TS2307: Cannot find module '@servicenow/sdk/core'`.

**Solution:** Set both `module` and `moduleResolution` to `Node16`. These settings must be consistent — `moduleResolution: Node16` requires `module: Node16`.

### Challenge 4: Fluent SDK global identifiers in tsc

**Problem:** `app.now.ts` uses `Now.ID[...]` and the `script` tagged template literal, both of which are injected by the SDK build process. TypeScript does not know about these globals and reports `TS2304: Cannot find name 'Now'`.

**Solution:** Exclude `src/` from the `tsconfig.json` `include` list. The `now-sdk build` command compiles these files independently with its own type context.

### Challenge 5: scopeId requirement

**Problem:** `now-sdk install` requires `scopeId` in `now.config.json` — the `sys_id` of the `sys_scope` record on the target instance. The initial placeholder value caused a deployment error.

**Solution:** Retrieve the `sys_id` from the instance (`sys_scope` table, query on `scope = x_146833_fluentp_0`) and populate `now.config.json` accordingly.

---

## 9. Repository Structure

```
FluentAndPlayWright/
├── .github/
│   └── workflows/
│       ├── nowdev-pipeline.yml          # mydev → nowdev: build → deploy DEV → Playwright
│       ├── prod-pipeline.yml            # nowdev → prod: Playwright gate → deploy PROD → tag
│       ├── sn-pull-sync.yml             # manual: pull from SN → mydev branch
│       └── fluent-playwright-pipeline.yml  # PR quality gate (typecheck + build)
├── src/
│   ├── fluent/
│   │   └── app.now.ts                   # All ServiceNow artifacts as TypeScript
│   └── server/
│       ├── businessRuleScripts.js       # Business Rule script bodies
│       └── FluentPlayUtils.server.js    # Script Include logic
├── tests/
│   ├── fluent-app.spec.ts               # Connectivity smoke test
│   ├── incident-resolved-comment.spec.ts  # Incident BR validation (skip until deployed)
│   └── inspect-fields.spec.ts          # Field inspection utility (skip until deployed)
├── utils/
│   ├── base-page.ts                     # ServiceNowPage base POM
│   ├── fluent-task-page.ts              # FluentTaskPage POM
│   ├── incident-page.ts                 # Incident form POM
│   └── incident-sow-page.ts            # Incident SOW scenario POM
├── features/
│   └── incident-resolved-comment.feature  # Gherkin BDD feature spec
├── step-definitions/
│   └── incident-resolved-comment.steps.ts # Cucumber step implementations
├── global-setup.ts                      # Session authentication bootstrap
├── playwright.config.ts                 # Playwright runner configuration
├── now.config.json                      # ServiceNow app scope and identity
├── tsconfig.json                        # TypeScript compiler settings
└── package.json                         # Dependencies and npm scripts
```

---

## 10. npm Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `now-sdk build` | Compile Fluent SDK metadata to deployment package |
| `deploy` | `now-sdk install` | Push compiled package to target SN instance |
| `typecheck` | `tsc --noEmit` | Validate TypeScript without emitting files |
| `test` | `playwright test` | Run all Playwright tests |
| `test:headed` | `playwright test --headed` | Run tests with visible browser |
| `test:smoke` | `playwright test --grep @smoke` | Run smoke-tagged tests only |
| `test:bdd` | `cucumber-js` | Run Gherkin/Cucumber BDD tests |
| `pipeline:dev` | `build && deploy && test` | Full local pipeline simulation |

---

## 11. Key Takeaways for IBM Clients

1. **ServiceNow is ready for GitOps.** The Fluent SDK provides the missing link between ServiceNow configuration and source control. The tooling is mature enough for production use.

2. **Playwright is the right tool for ServiceNow UI testing.** Its first-class `frameLocator()` support handles the `#gsft_main` iframe cleanly. Competing tools (Selenium, Cypress) require more workarounds.

3. **GitHub Environments provide secret isolation that mirrors environment governance.** DEV credentials cannot reach PROD pipelines by design — this is not policy, it is architecture.

4. **The reverse-sync workflow is often overlooked.** Most frameworks only push code to the instance. The `sn-pull-sync` workflow, which pulls changes from the instance back into Git, closes the loop and prevents configuration drift caused by emergency fixes or admin changes on the instance.

5. **Start with a smoke test, not the full suite.** The connectivity test (`TC-00: ServiceNow instance is reachable`) validates the entire pipeline — login, session, browser, network — before any application-level tests are written. It is the minimum viable pipeline gate.

6. **TypeScript strict mode catches errors before deployment.** Several classes of ServiceNow scripting errors — wrong field references, type mismatches in schema definitions, missing required properties — surface at compile time rather than at runtime on the instance.

---

## 12. Next Steps

With the pipeline foundation in place, the following capabilities are natural extensions:

- **Re-enable application tests** once the scoped app (`x_146833_fluentp_0`) is verified as installed on the DEV instance. Remove the `.skip` annotations from `incident-resolved-comment.spec.ts` and `inspect-fields.spec.ts`.
- **Add ATF integration** — the now-sdk supports ServiceNow's Automated Test Framework. ATF tests can be triggered as a deployment validation step alongside Playwright tests.
- **Extend Cucumber BDD coverage** — the Gherkin feature files and Cucumber step definitions are scaffolded. Business analysts can write feature files; engineers implement the step bindings.
- **Add Allure or custom HTML reporting** — Playwright's built-in HTML reporter is already configured. Allure integration provides richer trend analysis across pipeline runs.
- **Implement branch protection rules** on `nowdev` and `prod` — require the `nowdev-pipeline` status check to pass before any PR can be merged to `prod`.

---

## References

- ServiceNow Developer Docs: Fluent SDK — https://developer.servicenow.com
- Playwright Documentation — https://playwright.dev
- GitHub Actions Environments — https://docs.github.com/en/actions/deployment/targeting-different-environments
- Repository — https://github.com/anilvaranasi/FluentAndPlayWright

---

*This document was produced as part of IBM Consulting's ServiceNow Platform Engineering practice. All code examples are drawn from the live reference implementation.*

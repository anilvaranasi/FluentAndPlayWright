# GitOps for ServiceNow: CI/CD with the Fluent SDK and Playwright — Executive Summary

**Author:** Srinivas Anil Kumar Varanasi  
**Practice:** IBM Consulting — ServiceNow Platform Engineering  
**Repository:** https://github.com/anilvaranasi/FluentAndPlayWright  

---

## What Was Built

A production-grade DevOps framework that replaces the traditional ServiceNow Update Set model with a fully automated, code-first pipeline. ServiceNow platform artifacts — tables, business rules, client scripts, and script includes — are authored in TypeScript, version-controlled in Git, and automatically deployed and test-verified through GitHub Actions.

---

## The Core Problem It Solves

| Traditional Approach | This Framework |
|---|---|
| Changes made by hand in a browser | Changes authored in TypeScript, reviewed in pull requests |
| Update Sets transport XML blobs | `now-sdk deploy` pushes compiled artifacts |
| Manual testing on forms | Playwright runs automated browser tests in CI |
| Environments drift over time | Every deployment is identical and reproducible |
| No audit trail of intent | Full git history: who changed what, why, and when |

---

## Technology Stack

- **ServiceNow Fluent SDK (`now-sdk`)** — compiles TypeScript to deployable ServiceNow artifacts
- **Playwright** — headless browser automation for ServiceNow UI end-to-end testing
- **GitHub Actions** — multi-stage CI/CD pipeline with environment-gated deployments
- **TypeScript** — type-safe authoring of platform configuration and test code
- **Cucumber / Gherkin** — BDD-style test specifications bridging business requirements and automation

---

## Pipeline Flow

```
Local (mydev branch)
       │
       └──► git push origin mydev:nowdev
                    │
                    ▼
            GitHub Actions — nowdev pipeline
            ┌────────────────────────────────┐
            │  1. TypeScript typecheck        │
            │  2. now-sdk build               │  ~26 seconds
            │  3. Deploy → ServiceNow DEV     │  ~34 seconds
            │  4. Playwright E2E tests        │  ~3 minutes
            └────────────────────────────────┘
                    │ Passing ✓
                    └──► PR merge to prod
                                │
                                ▼
                    GitHub Actions — prod pipeline
                    ┌────────────────────────────────┐
                    │  1. Playwright gate vs DEV      │
                    │  2. Build for PROD              │
                    │  3. Explicit OK to promote      │  given before the push to prod
                    │  4. Deploy → ServiceNow PROD    │
                    │  5. Tag release                 │
                    └────────────────────────────────┘
```

**Total time DEV → deployed + tested:** approximately 4 minutes.

**Approval:** no required reviewers are configured on the `production` GitHub environment today. The approval step is a person giving an explicit OK before the commit is pushed to `prod`. Adding Required reviewers makes it a hard gate.

---

## What Is Deployed to ServiceNow

The reference application (`x_146833_fluentp_0`) includes:

- **2 Custom Tables**: `x_146833_fluentp_0_task` (extends `task`, 5 application-specific columns) and `x_146833_fluentp_0_facilities_request` (5 fields: Requester Name, Location, Request Type, Description, Priority)
- **1 Form layout** for the Facilities Request table, with the fields in the required order
- **2 Business Rules** on the task table (priority on insert, auto-stamp reviewed on close)
- **2 Business Rules** on the Facilities Request table (Location and Request Type required; Description of at least 20 characters)
- **2 Business Rules** on the out-of-box `incident` table (auto-comment on resolution; short description required before In Progress)
- **2 Client Scripts** (task form-load banner; Facilities Request onSubmit length check)
- **1 Script Include** (`FluentPlayUtils` — server-side utility, client-callable)

All defined in one TypeScript file: `src/fluent/app.now.ts`.

---

## Story-Driven Delivery

Stories are read from a monday.com board (read-only). For each story: write the Playwright tests first, add the Fluent code, push to `nowdev` and let the pipeline deploy and test on DEV, then promote to `prod` after an explicit OK and run the same tests against PROD.

Delivered and verified on DEV and PROD: Build the Request Form, Add Required Field Validations, Create Request Type Dropdown, and the incident short-description rule.

Limits: the request form is tested on the platform form, not a Service Portal page, and the mobile check is a viewport overflow check only.

---

## Branch Strategy

| Branch | Role |
|---|---|
| `mydev` | Local working branch; also receives pulls from ServiceNow via Actions |
| `nowdev` | DEV pipeline trigger — push here to deploy and test |
| `prod` | PROD pipeline trigger — merge here to promote to production |
| `master` | Source of truth for pipeline definitions |

---

## Key Engineering Decisions

**ServiceNow `#gsft_main` iframe handling** — Classic UI forms are embedded in an iframe. The `ServiceNowPage` base class uses `frameLocator('#gsft_main').locator(selector).or(page.locator(selector))` to transparently handle both Classic and Next Experience UI.

**Session persistence** — A global Playwright setup logs in once and serialises the browser session to disk. All tests reuse this session, saving login time on every test file.

**Exclude `src/` from TypeScript** — `app.now.ts` uses `Now` and `script` globals injected by `now-sdk build`. These are unknown to `tsc`. The solution is to exclude `src/` from `tsconfig.json` and let each tool own its domain.

**GitHub Environments for secret isolation** — `development` and `production` environments scope credentials. PROD secrets are structurally inaccessible to the DEV pipeline — not by policy, by architecture.

**Start with a smoke test** — The first CI-passing test (`TC-00`) simply verifies that the Playwright session can reach the ServiceNow instance and land on an authenticated page. This validates the entire pipeline infrastructure before any application logic is tested.

---

## Current Pipeline Status

| Stage | Status |
|---|---|
| TypeScript typecheck | ✅ Passing |
| `now-sdk build` | ✅ Passing |
| Deploy → ServiceNow DEV | ✅ Passing |
| Playwright connectivity smoke test | ✅ Passing |
| Story tests (request form, validations, dropdown, incident short description) | ✅ Passing on DEV and PROD |
| Incident resolved-comment and field-inspection specs | ⏭️ Skipped on the `nowdev` branch |
| Deploy → ServiceNow PROD | ✅ Passing, promoted after an explicit OK |
| Flow started on request submission | ⚠️ Passing on DEV (5/5). On PROD the flow deploys inactive because the SDK's flow-activation endpoint is missing there; it needs a one-time manual activation |

---

## Applicable IBM Client Scenarios

This pattern applies directly to IBM clients who:

- Are modernising their ServiceNow delivery practice from Update Sets to source-controlled pipelines
- Need to demonstrate compliance and auditability of ServiceNow configuration changes
- Are running multiple ServiceNow instances (DEV / TEST / PROD) and experiencing environment drift
- Want to integrate ServiceNow development into an existing GitHub-based engineering workflow
- Are adopting agile/DevOps practices and need ServiceNow to participate in sprint-based delivery

---

*Full technical details, code samples, and architectural discussion: see `docs/technical-deep-dive.md`*  
*Repository: https://github.com/anilvaranasi/FluentAndPlayWright*

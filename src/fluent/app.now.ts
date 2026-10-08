import '@servicenow/sdk/global'
import {
    Table,
    BusinessRule,
    ClientScript,
    ScriptInclude,
    StringColumn,
    IntegerColumn,
    BooleanColumn,
    ChoiceColumn
} from '@servicenow/sdk/core'

import { setPriorityOnInsert, stampReviewedOnClose } from '../server/businessRuleScripts'

// ─── 1. CUSTOM TABLE DEFINITION ──────────────────────────────────────────────
// Table variable name matches the table name property
export const x_ibm_fluentplay_task = Table({
    name: 'x_ibm_fluentplay_task',
    label: 'Fluent Playwright Task',
    extends: 'task',
    autoNumber: {
        prefix: 'FPT',
        number: 1000,
        numberOfDigits: 7,
    },
    schema: {
        u_priority_override: IntegerColumn({
            label: 'Priority Override',
            mandatory: false,
        }),
        u_custom_category: ChoiceColumn({
            label: 'Custom Category',
            choices: {
                hardware: { label: 'Hardware', sequence: 10 },
                software: { label: 'Software', sequence: 20 },
                network: { label: 'Network', sequence: 30 },
                security: { label: 'Security', sequence: 40 },
            },
            mandatory: false,
        }),
        u_channel_source: StringColumn({
            label: 'Channel Source',
            maxLength: 100,
            mandatory: false,
        }),
        u_reviewed: BooleanColumn({
            label: 'Reviewed',
            default: 'false',
        }),
        u_test_tag: StringColumn({
            label: 'Automated Test Tag',
            maxLength: 100,
            mandatory: false,
        }),
    },
})

// ─── 2. BUSINESS RULE: Set Priority on Insert ────────────────────────────────
// Copies u_priority_override into priority when populated on insert
BusinessRule({
    $id: Now.ID['br_set_priority_on_insert'],
    name: 'x_ibm_fluentplay - Set Priority on Insert',
    table: 'x_ibm_fluentplay_task',
    active: true,
    when: 'before',
    action: ['insert'],
    order: 100,
    script: setPriorityOnInsert,
})

// ─── 3. BUSINESS RULE: Stamp Reviewed on Close ───────────────────────────────
// Automatically stamps u_reviewed = true when state transitions to Closed (7)
BusinessRule({
    $id: Now.ID['br_stamp_reviewed_on_close'],
    name: 'x_ibm_fluentplay - Stamp Reviewed on Close',
    table: 'x_ibm_fluentplay_task',
    active: true,
    when: 'before',
    action: ['update'],
    order: 200,
    script: stampReviewedOnClose,
})

// ─── 4. CLIENT SCRIPT: Form Info on Load ────────────────────────────────────
// Displays informational message banner when task is loaded
ClientScript({
    $id: Now.ID['cs_task_onload_helper'],
    name: 'x_ibm_fluentplay - Task OnLoad Banner',
    table: 'x_ibm_fluentplay_task',
    active: true,
    applies_extended: false,
    global: false,
    ui_type: 'all',
    type: 'onLoad',
    isolate_script: false,
    messages: '',
    script: script`function onLoad() {
        var isNew = g_form.isNewRecord();
        if (isNew) {
            g_form.addInfoMessage('Creating a new Fluent Playwright Task record.');
        } else {
            var reviewed = g_form.getValue('u_reviewed');
            if (reviewed === 'true') {
                g_form.addInfoMessage('This record has been verified and reviewed.');
            }
        }
    }`,
})

// ─── 5. SCRIPT INCLUDE: FluentPlayUtils ──────────────────────────────────────
// Server-side callable utility class
ScriptInclude({
    $id: Now.ID['si_fluentplay_utils'],
    name: 'FluentPlayUtils',
    apiName: 'x_ibm_fluentplay.FluentPlayUtils',
    active: true,
    clientCallable: true,
    description: 'Server utility for Fluent Playwright framework operations and validations.',
    script: Now.include('../server/FluentPlayUtils.server.js'),
})

// ─── 6. BUSINESS RULE: Incident Resolved Auto-Comment ────────────────────────
// Requirement: When incident state transitions to Resolved (6), add greeting comment
BusinessRule({
    $id: Now.ID['br_incident_resolved_comment'],
    name: 'x_ibm_fluentplay - Incident Resolved Auto Comment',
    table: 'incident',
    active: true,
    when: 'before',
    action: ['insert', 'update'],
    condition: script`current.state == 6 || current.incident_state == 6`,
    order: 100,
    script: script`function executeRule(current, previous /*null when async*/) {
        var callerName = 'Valued Customer';
        try {
            if (current.caller_id) {
                callerName = current.caller_id.getDisplayValue() || 'Valued Customer';
            }
        } catch (e) {
            callerName = 'Valued Customer';
        }

        var greetingMsg = 'Hello ' + callerName + ',\\n\\n' +
            'Your incident regarding "' + current.short_description + '" has been marked as Resolved.\\n' +
            'Thank you for contacting ServiceNow Support.';

        current.comments = greetingMsg;
        gs.info('[FluentPlay] Added resolution comment for Incident: ' + current.number);
    }`,
})

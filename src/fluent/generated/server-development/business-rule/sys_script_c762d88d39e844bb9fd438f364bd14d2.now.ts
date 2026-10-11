import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['c762d88d39e844bb9fd438f364bd14d2'],
    name: 'x_146833_fluentp_0 - Incident Resolved A',
    table: 'incident',
    when: 'before',
    action: ['update', 'insert'],
    condition: 'current.state == 6 || current.incident_state == 6',
    script: Now.include('./sys_script_c762d88d39e844bb9fd438f364bd14d2.server.js'),
})

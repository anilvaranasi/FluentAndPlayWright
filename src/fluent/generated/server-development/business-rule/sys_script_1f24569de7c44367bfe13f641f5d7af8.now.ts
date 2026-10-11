import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['1f24569de7c44367bfe13f641f5d7af8'],
    name: 'x_146833_fluentp_0 - Incident Resolved A',
    table: 'incident',
    when: 'before',
    action: ['update', 'insert'],
    condition: 'current.state == 6 || current.incident_state == 6',
    script: Now.include('./sys_script_1f24569de7c44367bfe13f641f5d7af8.server.js'),
})

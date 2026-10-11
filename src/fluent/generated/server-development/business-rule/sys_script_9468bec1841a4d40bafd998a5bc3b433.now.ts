import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['9468bec1841a4d40bafd998a5bc3b433'],
    name: 'x_146833_fluentp_0 - Incident Resolved A',
    table: 'incident',
    when: 'before',
    action: ['update', 'insert'],
    condition: 'current.state == 6 || current.incident_state == 6',
    script: Now.include('./sys_script_9468bec1841a4d40bafd998a5bc3b433.server.js'),
})

import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['6aff8d6ec3624052817ef0bd38ff18ef'],
    name: 'x_146833_fluentp_0 - Incident Resolved A',
    table: 'incident',
    when: 'before',
    action: ['update', 'insert'],
    condition: 'current.state == 6 || current.incident_state == 6',
    script: Now.include('./sys_script_6aff8d6ec3624052817ef0bd38ff18ef.server.js'),
})

import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['3a0ab13939bf4878b5554ccbe6fd8190'],
    name: 'x_146833_fluentp_0 - Incident Resolved A',
    table: 'incident',
    when: 'before',
    action: ['update', 'insert'],
    condition: 'current.state == 6 || current.incident_state == 6',
    script: Now.include('./sys_script_3a0ab13939bf4878b5554ccbe6fd8190.server.js'),
})

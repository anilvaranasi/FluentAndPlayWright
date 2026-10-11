import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['d0966284f12d408eb5fd5e0f894cfd61'],
    name: 'x_146833_fluentp_0 - Set Priority on Ins',
    table: 'x_146833_fluentp_0_task',
    when: 'before',
    action: ['insert'],
    script: Now.include('./sys_script_d0966284f12d408eb5fd5e0f894cfd61.server.js'),
})

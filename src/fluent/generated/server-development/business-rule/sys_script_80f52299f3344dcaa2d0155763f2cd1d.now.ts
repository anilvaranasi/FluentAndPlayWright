import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['80f52299f3344dcaa2d0155763f2cd1d'],
    name: 'x_146833_fluentp_0 - Stamp Reviewed on C',
    table: 'x_146833_fluentp_0_task',
    order: 200,
    when: 'before',
    action: ['update'],
    script: Now.include('./sys_script_80f52299f3344dcaa2d0155763f2cd1d.server.js'),
})

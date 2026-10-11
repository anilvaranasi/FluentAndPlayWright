import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['b7e8737cfe174b8c93d025087124e217'],
    name: 'x_146833_fluentp_0 - Stamp Reviewed on C',
    table: 'x_146833_fluentp_0_task',
    order: 200,
    when: 'before',
    action: ['update'],
    script: Now.include('./sys_script_b7e8737cfe174b8c93d025087124e217.server.js'),
})

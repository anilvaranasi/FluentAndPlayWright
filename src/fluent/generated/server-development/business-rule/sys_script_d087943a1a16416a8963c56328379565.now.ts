import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['d087943a1a16416a8963c56328379565'],
    name: 'x_146833_fluentp_0 - Stamp Reviewed on C',
    table: 'x_146833_fluentp_0_task',
    order: 200,
    when: 'before',
    action: ['update'],
    script: Now.include('./sys_script_d087943a1a16416a8963c56328379565.server.js'),
})

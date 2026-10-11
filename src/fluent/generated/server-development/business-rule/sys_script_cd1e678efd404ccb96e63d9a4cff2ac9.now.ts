import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['cd1e678efd404ccb96e63d9a4cff2ac9'],
    name: 'x_146833_fluentp_0 - Stamp Reviewed on C',
    table: 'x_146833_fluentp_0_task',
    order: 200,
    when: 'before',
    action: ['update'],
    script: Now.include('./sys_script_cd1e678efd404ccb96e63d9a4cff2ac9.server.js'),
})

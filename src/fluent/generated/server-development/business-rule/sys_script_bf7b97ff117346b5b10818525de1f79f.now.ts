import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['bf7b97ff117346b5b10818525de1f79f'],
    name: 'x_146833_fluentp_0 - Stamp Reviewed on C',
    table: 'x_146833_fluentp_0_task',
    order: 200,
    when: 'before',
    action: ['update'],
    script: Now.include('./sys_script_bf7b97ff117346b5b10818525de1f79f.server.js'),
})

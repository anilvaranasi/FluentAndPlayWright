import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['51024487b3d24e37abe1695518cd9e54'],
    name: 'x_146833_fluentp_0 - Set Priority on Ins',
    table: 'x_146833_fluentp_0_task',
    when: 'before',
    action: ['insert'],
    script: Now.include('./sys_script_51024487b3d24e37abe1695518cd9e54.server.js'),
})

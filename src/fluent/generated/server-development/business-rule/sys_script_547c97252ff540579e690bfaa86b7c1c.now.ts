import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['547c97252ff540579e690bfaa86b7c1c'],
    name: 'x_146833_fluentp_0 - Set Priority on Ins',
    table: 'x_146833_fluentp_0_task',
    when: 'before',
    action: ['insert'],
    script: Now.include('./sys_script_547c97252ff540579e690bfaa86b7c1c.server.js'),
})

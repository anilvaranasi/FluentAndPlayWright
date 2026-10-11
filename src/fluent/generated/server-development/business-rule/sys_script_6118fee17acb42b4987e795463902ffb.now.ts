import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['6118fee17acb42b4987e795463902ffb'],
    name: 'x_146833_fluentp_0 - Set Priority on Ins',
    table: 'x_146833_fluentp_0_task',
    when: 'before',
    action: ['insert'],
    script: Now.include('./sys_script_6118fee17acb42b4987e795463902ffb.server.js'),
})

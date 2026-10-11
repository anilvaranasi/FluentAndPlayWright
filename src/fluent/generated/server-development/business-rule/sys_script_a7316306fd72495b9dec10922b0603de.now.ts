import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['a7316306fd72495b9dec10922b0603de'],
    name: 'x_146833_fluentp_0 - Set Priority on Ins',
    table: 'x_146833_fluentp_0_task',
    when: 'before',
    action: ['insert'],
    script: Now.include('./sys_script_a7316306fd72495b9dec10922b0603de.server.js'),
})

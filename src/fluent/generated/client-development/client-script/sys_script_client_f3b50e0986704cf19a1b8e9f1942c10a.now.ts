import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['f3b50e0986704cf19a1b8e9f1942c10a'],
    type: 'onLoad',
    table: 'x_146833_fluentp_0_task',
    script: Now.include('./sys_script_client_f3b50e0986704cf19a1b8e9f1942c10a.client.js'),
    name: 'x_146833_fluentp_0 - Task OnLoad Banner',
    global: false,
    uiType: 'all',
})

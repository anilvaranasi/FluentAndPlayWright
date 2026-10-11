import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['e0dff51a616b41e3b2c2ef383b2b3c2f'],
    type: 'onLoad',
    table: 'x_146833_fluentp_0_task',
    script: Now.include('./sys_script_client_e0dff51a616b41e3b2c2ef383b2b3c2f.client.js'),
    name: 'x_146833_fluentp_0 - Task OnLoad Banner',
    global: false,
    uiType: 'all',
})

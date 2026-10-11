import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['c8a97e517e2a43c1a74933a77bdae799'],
    type: 'onLoad',
    table: 'x_146833_fluentp_0_task',
    script: Now.include('./sys_script_client_c8a97e517e2a43c1a74933a77bdae799.client.js'),
    name: 'x_146833_fluentp_0 - Task OnLoad Banner',
    global: false,
    uiType: 'all',
})

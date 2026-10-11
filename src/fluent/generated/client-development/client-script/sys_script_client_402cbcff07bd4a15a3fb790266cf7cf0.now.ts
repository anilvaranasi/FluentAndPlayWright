import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['402cbcff07bd4a15a3fb790266cf7cf0'],
    type: 'onLoad',
    table: 'x_146833_fluentp_0_task',
    script: Now.include('./sys_script_client_402cbcff07bd4a15a3fb790266cf7cf0.client.js'),
    name: 'x_146833_fluentp_0 - Task OnLoad Banner',
    global: false,
    uiType: 'all',
})

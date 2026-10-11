import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['5373c22bd3314af589a8188a8d9be2ae'],
    type: 'onLoad',
    table: 'x_146833_fluentp_0_task',
    script: Now.include('./sys_script_client_5373c22bd3314af589a8188a8d9be2ae.client.js'),
    name: 'x_146833_fluentp_0 - Task OnLoad Banner',
    global: false,
    uiType: 'all',
})

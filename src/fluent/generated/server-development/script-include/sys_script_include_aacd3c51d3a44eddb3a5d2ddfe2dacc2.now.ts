import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['aacd3c51d3a44eddb3a5d2ddfe2dacc2'],
    name: 'FluentPlayUtils',
    script: Now.include('./sys_script_include_aacd3c51d3a44eddb3a5d2ddfe2dacc2.server.js'),
    description: 'Server utility for Fluent Playwright framework operations and validations.',
    apiName: 'x_146833_fluentp_0.FluentPlayUtils',
    clientCallable: true,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})

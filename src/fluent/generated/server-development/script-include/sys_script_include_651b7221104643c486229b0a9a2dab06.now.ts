import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['651b7221104643c486229b0a9a2dab06'],
    name: 'FluentPlayUtils',
    script: Now.include('./sys_script_include_651b7221104643c486229b0a9a2dab06.server.js'),
    description: 'Server utility for Fluent Playwright framework operations and validations.',
    apiName: 'x_146833_fluentp_0.FluentPlayUtils',
    clientCallable: true,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})

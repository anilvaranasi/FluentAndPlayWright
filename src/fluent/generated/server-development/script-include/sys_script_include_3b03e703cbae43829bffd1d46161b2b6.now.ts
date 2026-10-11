import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['3b03e703cbae43829bffd1d46161b2b6'],
    name: 'FluentPlayUtils',
    script: Now.include('./sys_script_include_3b03e703cbae43829bffd1d46161b2b6.server.js'),
    description: 'Server utility for Fluent Playwright framework operations and validations.',
    apiName: 'x_146833_fluentp_0.FluentPlayUtils',
    clientCallable: true,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})

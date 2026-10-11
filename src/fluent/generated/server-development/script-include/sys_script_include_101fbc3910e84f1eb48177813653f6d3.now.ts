import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['101fbc3910e84f1eb48177813653f6d3'],
    name: 'FluentPlayUtils',
    script: Now.include('./sys_script_include_101fbc3910e84f1eb48177813653f6d3.server.js'),
    description: 'Server utility for Fluent Playwright framework operations and validations.',
    apiName: 'x_146833_fluentp_0.FluentPlayUtils',
    clientCallable: true,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})

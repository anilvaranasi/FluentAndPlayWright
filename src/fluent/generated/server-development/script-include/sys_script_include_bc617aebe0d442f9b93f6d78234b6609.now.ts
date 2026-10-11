import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['bc617aebe0d442f9b93f6d78234b6609'],
    name: 'FluentPlayUtils',
    script: Now.include('./sys_script_include_bc617aebe0d442f9b93f6d78234b6609.server.js'),
    description: 'Server utility for Fluent Playwright framework operations and validations.',
    apiName: 'x_146833_fluentp_0.FluentPlayUtils',
    clientCallable: true,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})

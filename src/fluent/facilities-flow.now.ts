import '@servicenow/sdk/global'
import { Flow, wfa, trigger, action } from '@servicenow/sdk/automation'

// Story "Trigger Flow on Submission" (monday.com item 13272995032)
// Runs once for every NEW Facilities Request. Record Created does not fire on updates.
export const facilitiesRequestSubmissionFlow = Flow(
    {
        $id: Now.ID['flow_facilities_request_submission'],
        name: 'Facilities Request Submission Flow',
        description: 'Starts when a new Facilities Request is submitted. Downstream actions (email, approval) are added by later stories.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.created,
        { $id: Now.ID['trigger_facilities_request_created'] },
        {
            table: 'x_146833_fluentp_0_facilities_request',
            run_on_extended: 'false',
            run_when_setting: 'both',
            run_flow_in: 'background',
        },
    ),
    () => {
        wfa.action(
            action.core.log,
            { $id: Now.ID['log_facilities_request_received'] },
            {
                log_level: 'info',
                log_message: 'Facilities Request received',
            },
        )
    },
)

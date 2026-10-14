import '@servicenow/sdk/global'
import { Flow, wfa, trigger, action } from '@servicenow/sdk/automation'

// Story "Trigger Flow on Submission" (monday.com item 13272995032)
// Runs once for every NEW Facilities Request. Record Created does not fire on updates.
export const facilitiesRequestSubmissionFlow = Flow(
    {
        $id: Now.ID['flow_facilities_request_submission'],
        name: 'Facilities Request Submission Flow',
        description:
            'Starts when a new Facilities Request is submitted. Downstream actions (email, approval) are added by later stories.',
        runAs: 'system',
        internalName: 'facilities_request_submission_flow',
        masterSnapshot: '270a022f833bc390b96f6ed0deaad3e9',
    },
    wfa.trigger(
        trigger.record.created,
        { $id: Now.ID['c43a03e383b30790b96f6ed0deaad3a1'] },
        {
            table: 'x_146833_fluentp_0_facilities_request',
            run_on_extended: 'false',
            run_when_setting: 'both',
            run_flow_in: 'any',
            condition: '^EQ',
            run_when_user_list: [],
            run_when_user_setting: 'any',
        }
    ),
    (_params) => {
        wfa.action(
            action.core.log,
            {
                $id: Now.ID['log_facilities_request_received'],
            },
            {
                log_level: 'info',
                log_message: `Facilities Request received with sys id ${wfa.dataPill(_params.trigger.current.sys_id, 'GUID')}`,
            }
        )
    }
)

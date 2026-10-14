import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_146833_fluentp_0_facilities_request',
    view: default_view,
    columns: ['description', 'location', 'priority', 'request_type', 'requester'],
})

import { gs } from '@servicenow/glide'

/**
 * Sets the standard priority field from u_priority_override if provided.
 */
export function setPriorityOnInsert(current, previous) {
    if (current.u_priority_override && current.u_priority_override > 0) {
        current.priority = current.u_priority_override
        gs.info('[FluentPlay] Set priority to ' + current.priority + ' from override.')
    }
}

/**
 * Stamps reviewed = true when state transitions to Closed (state = 7 or 3 depending on dict).
 */
export function stampReviewedOnClose(current, previous) {
    var closedStates = ['3', '4', '7'] // Closed Complete / Incomplete / Skipped / Closed
    var isClosedState = closedStates.indexOf(String(current.state)) !== -1
    var wasClosedState = closedStates.indexOf(String(previous.state)) !== -1

    if (isClosedState && !wasClosedState) {
        current.u_reviewed = true
        gs.info('[FluentPlay] Marked task as reviewed on close: ' + current.number)
    }
}

/**
 * Requirement: When incident state is set to Resolved (6),
 * upon save add additional comments that add the short description and
 * a greeting message to the caller saying that the incident is resolved.
 */
export function onIncidentResolvedComment(current, previous) {
    var callerName = 'Valued Customer'
    try {
        if (current.caller_id) {
            callerName = current.caller_id.getDisplayValue() || current.caller_id.name || 'Valued Customer'
        }
    } catch (e) {
        callerName = 'Valued Customer'
    }

    var greetingMsg = 'Hello ' + callerName + ',\n\n' +
        'Your incident regarding "' + current.short_description + '" has been marked as Resolved.\n' +
        'Thank you for contacting ServiceNow Support.'

    // Set additional comments journal field
    current.comments.setJournalEntry(greetingMsg)
    gs.info('[FluentPlay] Added resolution comment for Incident: ' + current.number)
}

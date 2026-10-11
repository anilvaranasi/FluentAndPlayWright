function executeRule(current, previous /*null when async*/) {
        var callerName = 'Valued Customer';
        try {
            if (current.caller_id) {
                callerName = current.caller_id.getDisplayValue() || 'Valued Customer';
            }
        } catch (e) {
            callerName = 'Valued Customer';
        }

        var greetingMsg = 'Hello ' + callerName + ',\n\n' +
            'Your incident regarding "' + current.short_description + '" has been marked as Resolved.\n' +
            'Thank you for contacting ServiceNow Support.';

        current.comments = greetingMsg;
        gs.info('[FluentPlay] Added resolution comment for Incident: ' + current.number);
    }
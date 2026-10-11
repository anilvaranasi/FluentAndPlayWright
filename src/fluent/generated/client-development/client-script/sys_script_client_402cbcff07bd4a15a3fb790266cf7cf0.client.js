function onLoad() {
        var isNew = g_form.isNewRecord();
        if (isNew) {
            g_form.addInfoMessage('Creating a new Fluent Playwright Task record.');
        } else {
            var reviewed = g_form.getValue('u_reviewed');
            if (reviewed === 'true') {
                g_form.addInfoMessage('This record has been verified and reviewed.');
            }
        }
    }
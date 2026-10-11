import { Class } from '@servicenow/glide'

/**
 * Script Include: FluentPlayUtils
 * Scoped helper methods for Fluent Playwright test validations
 */
export const FluentPlayUtils = Class.create()

FluentPlayUtils.prototype = {
    initialize: function() {
    },

    /**
     * Retrieves open task count for automated verification
     * @param {string} filterTag - Tag or category identifier
     * @returns {number} count of matching active tasks
     */
    getOpenTaskCount: function(filterTag) {
        var gr = new GlideRecord('x_ibm_fluentplay_task')
        gr.addActiveQuery()
        if (filterTag) {
            gr.addQuery('u_test_tag', filterTag)
        }
        gr.query()
        return gr.getRowCount()
    },

    /**
     * GlideAjax callable entry point
     */
    getOpenTaskCountAjax: function() {
        var tag = this.getParameter('sysparm_tag')
        return this.getOpenTaskCount(tag).toString()
    },

    type: 'FluentPlayUtils'
}

const { pick } = require('ramda');
const JiraApi = require('jira-client');
const { 
    showError, 
    terminate, 
    writeFile,
    wrapObjProperties,
    getJiraConfig
} = require('../utils');

class JiraApiExtended extends JiraApi {
    constructor(options) {
        super(options);
    }

    /** Get worklogs of issue
     * @name worklogs
     * @function
     * @param {string} issueId - Issue with worklogs
     */
    worklogs(issueId) {
        return this.doRequest(
            this.makeRequestHeader(
                this.makeUri({
                    pathname: `/issue/${issueId}/worklog`
                })
            )
        );
    }

    /** Add a worklog to a project
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id291617)
     * @name addWorklog
     * @function
     * @param {string} issueId - Issue to add a worklog to
     * @param {object} worklog - worklog object from the rest API
     */
    addWorklog(issueId, worklog) {
        const header = {
            uri: this.makeUri({
                pathname: `/issue/${issueId}/worklog`
            }),
            body: worklog,
            method: 'POST',
            'Content-Type': 'application/json',
            json: true,
        };

        return this.doRequest(header);
    }
}

let jira;

const jiraWrapper = fn => (...args) => {
    if (!jira) {
        showError('Needs init jira');
        terminate(1);
    }

    return fn(...args);
}

const init = config => {
    jira = new JiraApiExtended(pick([
        'apiVersion',
        'host',
        'password',
        'protocol',
        'strictSSL',
        'username'
    ], getJiraConfig(config)));
};

const findIssue = issueId => jira.findIssue(issueId);
const getWorklogs = issueId => jira.worklogs(issueId);
const addWorklog = (issueId, worklog) => jira.addWorklog(issueId, worklog); 
const getCurrentUser = () => jira.getCurrentUser(); 

const exportObj = {
    findIssue,
    getWorklogs,
    addWorklog,
    getCurrentUser 
};
 
module.exports = {
    init,
    ...wrapObjProperties(jiraWrapper, exportObj)
};

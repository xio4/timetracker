const chalk = require('chalk');

const promptSchemas = {
    cmd: {
        name: chalk.yellow('cmd:'),
        type: 'string',
        required: true
    },
    custom: {
        name: chalk.yellow('custom:'),
        type: 'string',
        required: true
    }
};

const defaultProjectConfig = {
    toggl: {
        apiToken: '',
        billable: true,
        tags: [],
        workspace: '',
        project: '',
        descriptionTemplate: '{{issue.key}} - {{issue.fields.summary}}'
    },
    jira: {
        defaultIssue: '',
        protocol: 'https',
        host: '',
        username: '',
        apiVersion: '2',
        strictSSL: true,
        password: '',
        linkPath: 'browse'
    },
    import: {
        deviation: 120, // in seconds
        trackingTime: '19:00'
    },
    phrases: [

    ]
};
 

module.exports = {
    promptSchemas,
    defaultProjectConfig
};

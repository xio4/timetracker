const proxyquire = require('proxyquire');
const { assert, expect, should } = require('chai');  

should();

const moment = require('moment');
const {
    TIME_ENTRY_DATE_FORMAT
} = require('../src/constants');
 
const { 
    getDurationFromJiraWorklogs, 
    getDurationsFromTogglTimeEntries
} = proxyquire('../src/import', {
    './api/jira': {
        findIssue: issueId => Promise.resolve({ key: issueId }),
        worklogs: issueId => Promise.resolve([])
    },
    './api/toggl': {
        getTimeEntries: () => Promise.resolve([])
    }
});

const defaultConfig = {
    toggl: {
        apiToken: '',
        billable: true,
        tags: [],
        workspace: '',
        project: '',
        descriptionTemplate: '{{issue.key}} - {{issue.fields.summary}}'
    },
    jira: {
        defaultIssue: 'XY-1111',
        protocol: 'https',
        host: '',
        username: 'user',
        apiVersion: '2',
        strictSSL: true,
        password: ''
    },
    import: {
        deviation: 120, // in seconds
        trackingTime: '19:00'
    },
    phrases: [

    ]
}; 

describe('import', () => {
    let actual;

    it('should work getDurationsFromTogglTimeEntries' , async () => {
        const timeEntries = [
            {
                "id":436694100,
                "wid":777,
                "pid":193791,
                "tid":13350500,
                "billable":true,
                "start":"2013-02-27T01:24:00+00:00",
                "stop":"2013-02-27T07:24:00+00:00",
                "description": "XY-1212 - first timework",
                "duration":21600,
            },
            {
                "id":436694101,
                "wid":777,
                "pid":193791,
                "tid":13350500,
                "billable":true,
                "start":"2014-02-27T01:24:00+00:00",
                "stop":"2014-02-27T06:24:00+00:00",
                "description": "XY-1212 - first timework",
                "duration":18000, 
            },
            {
                "id":436694102,
                "wid":777,
                "pid":193791,
                "tid":13350500,
                "billable":true,
                "start":"2014-02-27T01:24:00+00:00",
                "stop":"2014-02-27T03:24:00+00:00",
                "description": "XY-2212 - second timework",
                "duration":7200, 
            }, 
            {
                "id":436694103,
                "wid":777,
                "pid":193791,
                "tid":13350500,
                "billable":false,
                "start":"2014-02-27T01:24:00+00:00",
                "stop":"2014-02-27T05:24:00+00:00",
                "description": "XY-1212 - first timework",
                "duration":14400, 
            } 
        ];

        actual = await getDurationsFromTogglTimeEntries(defaultConfig, timeEntries);

        expect(actual).to.deep.equal({ 
            'XY-1212': {
                description: 'XY-1212 - first timework',
                duration: 39600,
                issueId: 'XY-1212',
                shortDescription: 'XY-1212'
            },
            'XY-2212': {
                description: 'XY-2212 - second timework',
                duration: 7200,
                issueId: 'XY-2212',
                shortDescription: 'XY-2212' 
            }
        });
    });

    it('should work getDurationFromJiraWorklogs', async () => {
        const date = moment('11.12.2018', TIME_ENTRY_DATE_FORMAT);
        const worklogs = [
            {
                author: {
                    key: 'user'
                },
                comment: 'one',
                timeSpentSeconds: 5460,
                started: '2018-12-11T18:34:15.155+0300',
                id: '1232323'
            },
            {
                author: {
                    key: 'user'
                },
                comment: 'two',
                timeSpentSeconds: 1200,
                started: '2018-12-11T19:34:15.155+0300',
                id: '1232324' 
            },
            {
                author: {
                    key: 'notuser'
                },
                comment: 'one',
                timeSpentSeconds: 1000,
                started: '2018-12-11T11:14:15.155+0300',
                id: '1232325' 
            }
        ];

        actual = await getDurationFromJiraWorklogs(defaultConfig, date, '', worklogs);

        expect(actual).to.equal(6660);

        actual = await getDurationFromJiraWorklogs(defaultConfig, date, 'two', worklogs);

        expect(actual).to.equal(1200); 
    });
});

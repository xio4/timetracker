const moment = require('moment');
const { 
    compose,
    curryN, 
    filter, 
    identity,
    pathOr,
    pathEq,
    reduce,
} = require('ramda');
const {
    startedP,
    getDurationInSeconds,
    getIssueIdFromDescription,
    getJiraConfig,
    timeSpentSecondsP,
    dateToRange,
    reducePromise,
    worklogsP,
    commentP,
} = require('./utils');
const {
    getTimeEntries
} = require('./api/toggl');
const {
    findIssue,
    getWorklogs
} = require('./api/jira');

const authorKeyPath = ['author', 'key'];
const issuesCache = {};

const getDurationFromJiraWorklogs = curryN(4, (config, date, comment, worklogs) => {
    const startDate = date.clone().startOf('day');
    const { username } = getJiraConfig(config);

    return compose(
        reduce(
            (acc, worklog) => acc + timeSpentSecondsP(worklog),
            0
        ),
        filter(worklog => !comment || commentP(worklog) === comment),
        filter(worklog => moment(startedP(worklog)).startOf('day').diff(startDate, 'days') === 0),
        filter(pathEq(authorKeyPath, username))
    )(worklogs);
});

const getDurationsFromTogglTimeEntries = curryN(2, (config, timeEntries) => 
    reducePromise(
        async (acc, { billable, description, start, stop }) => {
            let issueId = getIssueIdFromDescription(description);
            const cachedIssue = issuesCache[issueId];

            if (!cachedIssue && cachedIssue !== false) {
                await findIssue(issueId)
                    .then(issue => issuesCache[issueId] = issue)
                    .catch(() => issuesCache[issueId] = false);
            }

            if (issuesCache[issueId] === false) {
                issueId = description;
            }

            acc[issueId] = {
                duration: pathOr(0, [issueId, 'duration'], acc) + (billable ? getDurationInSeconds(start, stop) : 0),
                issueId: issueId === description ? getJiraConfig(config).defaultIssue : issueId,
                shortDescription: issueId,
                description
            };

            return acc;
        }, 
        {}, 
        timeEntries
    )
);

const createTimeEntriesMap = curryN(2, async (config,  date) => {
    const startDate = date.clone().startOf('day');
    const endDate = date.clone().endOf('day');

    const timeEntries = await getTimeEntries(startDate.toISOString(), endDate.toISOString());

    return getDurationsFromTogglTimeEntries(config, timeEntries);
});

const createAllWorklogsMap = curryN(2, (config, issueIds) => reducePromise(async (acc, issueId) => {
    acc[issueId] = worklogsP(await getWorklogs(issueId)
        .catch(() => [])
    );

    return acc;
}, {}, issueIds));

module.exports = {
    getDurationsFromTogglTimeEntries,
    getDurationFromJiraWorklogs,
    createTimeEntriesMap,
    createAllWorklogsMap
};

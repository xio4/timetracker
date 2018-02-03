const fs = require('fs');
const chalk = require('chalk');
const { promisify } = require('util'); 
const { 
    always, 
    compose, 
    curryN, 
    filter,
    identity,
    keys, 
    path, 
    pathEq, 
    pathOr, 
    reduce,
    replace,
    head,
    last,
    split,
} = require('ramda');
const prompt = require('prompt');
const moment = require('moment');
const { 
    CONFIG_PATH,
    COLON_DELIM,
    DASH_DELIM,
    DURATION_FORMAT,
    MILLISECONDS_IN_SECONDS,
    MINUTES_IN_HOUR,
    SPACE_DELIM,
    TIME_ENTRY_DATE_FORMAT,
    TIME_ENTRY_FORMAT,
    TIME_HOUR_FORMAT,
    TIME_MINUTE_FORMAT,
    TIME_SECOND_FORMAT,
} = require('./constants'); 
const {
    promptSchemas,
    defaultProjectConfig
} = require('./configs');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile); 
const messageP = path(['message']);
const issueSummaryP = pathOr('', ['fields', 'summary']);
const worklogsP = pathOr([], ['worklogs']);
const timeSpentSecondsP = pathOr(0, ['timeSpentSeconds']);
const idP = path(['id']);
const keyP = pathOr('', ['key']);
const authorP = pathOr('', ['author']);
const createdP = path(['created']);
const issueIdP = path(['issueId']);
const startedP = path(['started']);
const commentP = pathOr('', ['comment']);
const findItemByName = (name, items = []) => items.find(pathEq(['name'], name));
const terminate = (status = 0) => process.exit(status);
const getIssueIdFromDescription = (description = '') => description.split(SPACE_DELIM)[0];
const showError = data => console.log(chalk.red(`Error: ${data}`));
const showWarning = data => console.log(chalk.magenta(`Warning: ${data}`)); 
const showInfo = (msg, color = 'green') => console.log(chalk[color](msg));
const removeSpaces = replace(/\s/g, '');
const splitByDash = split(DASH_DELIM);
const getBeginEndDate = compose(splitByDash, removeSpaces); 
const dateToRange = rawDate => {
    const beginEnd = getBeginEndDate(rawDate);
    const end = moment(last(beginEnd), TIME_ENTRY_DATE_FORMAT);
    let begin = moment(head(beginEnd), TIME_ENTRY_DATE_FORMAT);
    const range = [];

    while (end.diff(begin, 'days') >= 0) {
        range.push(begin);

        begin = begin.clone().add(1, 'day');
    }

    return range;
};
const showPrompt = (schema = promptSchemas.cmd, additional) => new Promise((resolve, reject) => { 
    const customSchema = { ...schema, ...additional };

    prompt.get(customSchema, (err, result) => {
        if (err) {
            reject(err);
        }

        resolve(result[customSchema.name]);
    });
});
const showPhrases = (config = defaultProjectConfig) => {
    if (config.phrases.length) {
        showInfo('phrases:', 'green');
        console.log(chalk.green('0) cancel'));
    }

    config.phrases.map(
        (phrase, idx) => console.log(chalk.green(`${idx + 1}) '${phrase}'`))
    );
}; 
const showTimeEntry = (config = defaultProjectConfig, timeEntry) => {
    if (!timeEntry) {
        showInfo('toggl is inactive', 'green');

        return;
    }

    const start = moment(timeEntry.start);
    const end = moment(timeEntry.stop);
    const duration = end.diff(start);

    showInfo(`${timeEntry.description} | ${moment(timeEntry.start).format(TIME_ENTRY_DATE_FORMAT)} | ${start.format(TIME_ENTRY_FORMAT)}-${end.format(TIME_ENTRY_FORMAT)} | ${moment.utc(duration).format(DURATION_FORMAT)}`, 'green');
};

const loadConfig = (fn = CONFIG_PATH) => readFile(fn)
    .catch(({ message }) => {
        showError(message);
        showWarning(`Can't open config file, attempt to create it in ${CONFIG_PATH}`);
        const rawConfig = JSON.stringify(defaultProjectConfig, null, SPACE_DELIM);

        return writeFile(fn, rawConfig)
            .then(always(rawConfig));
    })
    .catch(({ message }) => {
        showError(message);
        showError('Can\'t create new config file, exit');

        terminate(1);
    })
    .then(rawFileData => {
        let fileData;

        try {
            fileData = JSON.parse(rawFileData);
        }
        catch({ message }) {
            showError(message);
            showError('Can\'t parse config file, exit');

            terminate(1); 
        }

        return fileData;
    });

const createPromiseCb = (resolve, reject) => (err, result) => {
    if (err) {
        showError(err.message);
    }

    result ? resolve(result) : reject(err); 
}; 

const formatJiraTimeSpent = duration => {
    const seconds = +duration.format(TIME_SECOND_FORMAT); 
    let hours = +duration.format(TIME_HOUR_FORMAT);
    let minutes = +duration.format(TIME_MINUTE_FORMAT) + Math.round(seconds / MINUTES_IN_HOUR);

    if (minutes >= MINUTES_IN_HOUR) {
        hours += 1;
        minutes -= MINUTES_IN_HOUR;
    }

    if (hours + minutes === 0) {
        minutes = 1; // Jira can't save worklog with zero timeSpent
    }

    return `${hours}h ${minutes}m`;
};

const toInt = val => parseInt(val, 10);
const wrapObjProperties = curryN(2, (wrapper, obj) => 
    compose(
        reduce(
            (acc, key) => ({ ...acc, [key]: wrapper(obj[key]) }), 
            {}
        ), 
        keys
    )(obj)
);
const getTogglConfig = pathOr({}, ['toggl']);
const getJiraConfig = pathOr({}, ['jira']);
const getImportConfig = pathOr({}, ['import']);
const getPhrase = curryN(2, (config, rawPhrase) => {
    let phrase = rawPhrase;
    const num = toInt(phrase);

    if (!isNaN(num) && num !== 0) {
        phrase = pathOr(phrase, [num - 1], config.phrases);
    }

    return phrase;
});
const getDuration = (start, stop) => moment.utc(moment(stop).diff(moment(start)));
const getDurationInSeconds = compose(milliseconds => milliseconds / MILLISECONDS_IN_SECONDS, getDuration);
const compact = filter(identity);
const reducePromise = curryN(3, async (fn, acc, items) => {
    let newAcc = acc;

    for (let idx = 0; idx < items.length; ++idx) {
        newAcc = await fn(newAcc, items[idx], idx);
    }

    return newAcc;
});
const createJiraLink = curryN(2, (config, issueId) => {
    const { protocol, host, linkPath } = getJiraConfig(config);

    return `${protocol}://${host}/${linkPath}/${issueId}`;
});
const setTimeInDate = (date, time) => {
    const [hours, minutes = 0] = time.split(COLON_DELIM);

    return date.clone().startOf('days').add({ hours, minutes });
};

prompt.message = '';
prompt.delimiter = '';
prompt.start();

module.exports = {
    authorP,
    commentP,
    createJiraLink,
    createPromiseCb,
    createdP,
    dateToRange,
    findItemByName,
    formatJiraTimeSpent,
    getDuration,
    getDurationInSeconds,
    getImportConfig,
    getIssueIdFromDescription,
    getJiraConfig,
    getPhrase,
    getTogglConfig,
    idP,
    issueIdP,
    issueSummaryP,
    keyP,
    loadConfig,
    messageP,
    promptSchemas,
    readFile,
    reducePromise,
    removeSpaces,
    setTimeInDate,
    showError,
    showInfo,
    showPhrases,
    showPrompt,
    showTimeEntry,
    showWarning,
    startedP,
    terminate,
    timeSpentSecondsP,
    toInt,
    worklogsP,
    wrapObjProperties,
    writeFile,
};

const TogglClient = require('toggl-api');
const { compose, pick } = require('ramda');
const { 
    createPromiseCb, 
    findItemByName,
    idP,
    showError, 
    terminate,
    wrapObjProperties,
    getTogglConfig
} = require('../utils');

let toggl;

const init = config => {
   toggl = new TogglClient({ apiToken: getTogglConfig(config).apiToken });
};

const togglWrapper = fn => (...args) => {
    if (!toggl) {
        showError('Needs init toggl');
        terminate(1);
    }

    return fn(...args);
}

const getCurrentTimeEntry = () => {
    return new Promise((resolve, reject) => {
        toggl.getCurrentTimeEntry(createPromiseCb(resolve, reject));
    })
        .catch(err => err ? Promise.reject(err) : undefined);
};

const start = taskEntry => {
    return new Promise((resolve, reject) => {
        toggl.startTimeEntry(taskEntry, createPromiseCb(resolve, reject));
    });
};

const stop = timeEntry => {
    const promise = timeEntry ? Promise.resolve(timeEntry) : getCurrentTimeEntry();

    return promise.then(timeEntry => new Promise((resolve, reject) => {
        const id = idP(timeEntry);

        if (!id) {
            resolve();

            return ;
        }

        toggl.stopTimeEntry(id, err => {
            if (err) {
                showError(err.message);
                reject(err);

                return;
            }

            resolve();
        });
    }));
};

const getTimeEntryFromConfig = compose(pick(['billable', 'tags', 'pid']), getTogglConfig);

const getWorkspaces = () => {
    return new Promise((resolve, reject) => {
        toggl.getWorkspaces(createPromiseCb(resolve, reject));
    }); 
};

const getTimeEntries = (startDate, endDate) => {
    return new Promise((resolve, reject) => {
        toggl.getTimeEntries(startDate, endDate, createPromiseCb(resolve, reject));
    }); 
};
 
const getTimeEntryData = tId => {
    return new Promise((resolve, reject) => {
        toggl.getTimeEntryData(tId, createPromiseCb(resolve, reject));
    }); 
};

const findProject = config => {
    const togglConfig = getTogglConfig(config);

    return getWorkspaces().then(workspaces => new Promise((resolve, reject) => {
        toggl.getWorkspaceProjects(
            idP(findItemByName(togglConfig.workspace, workspaces)), 
            {},
            createPromiseCb(resolve, reject)
        )
    }))
        .then(projects => findItemByName(togglConfig.project, projects));
};

const exportObj = {
    start,
    getCurrentTimeEntry,
    getTimeEntryFromConfig,
    findProject,
    getWorkspaces,
    getTimeEntries,
    stop,
    getTimeEntryData 
};
 
module.exports = {
    init,
    ...wrapObjProperties(togglWrapper, exportObj)
};

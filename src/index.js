#!/usr/bin/env node

const prompt = require('prompt');
const chalk = require('chalk');
const { loadConfig, terminate } = require('./utils');
const { program } = require('./env');
const { invoke } = require('./commands');
const { CMD, CMD_ARGS } = require('./constants');
const { init: initToggl, findProject } = require('./api/toggl');
const { init: initJira, getCurrentUser } = require('./api/jira');

const main = async () => {
    let config = await loadConfig();

    initToggl(config);
    initJira(config);

    const togglProject = await findProject(config);
    const jiraUser = await getCurrentUser();

    config = {
        ...config,
        toggl: {
            ...config.toggl,
            pid: togglProject.id,
        },
        jira: {
            ...config.jira,
            user: jiraUser
        }
    };

    await invoke(config, program[CMD], program[CMD_ARGS]);
};

if (!program.cmd) {
    program.help();
    terminate();
}

main();

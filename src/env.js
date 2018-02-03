const program = require('commander');
const { values } = require('ramda');
const { VERSION, cmds, CMD, CMD_ARGS } = require('./constants');

program
    .version(process.env.npm_package_version || VERSION)
    .option(`-c, --${CMD} [type]`, `Command <${values(cmds).join(', ')}>`)
    .option(`-a, --${CMD_ARGS} [type]`, 'Command arguments in quotes')
    .parse(process.argv);
 
module.exports = {
    program
};

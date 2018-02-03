const filePath = require('path');
const os = require('os');

const CANCEL_CODE = '0';
const TIME_ENTRY_FORMAT = 'HH:mm:ss';
const TIME_HOUR_FORMAT = 'HH';
const TIME_MINUTE_FORMAT = 'mm';
const TIME_SECOND_FORMAT = 'ss';
const MINUTES_IN_HOUR = 60;
const ISO8601_FORMAT = 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ';
const TIME_ENTRY_DATE_FORMAT = 'DD.MM.YYYY';
const DURATION_FORMAT = 'HH:mm:ss'; 
const HOME_DIR_PATH = os.homedir();
const SPACE_DELIM = ' ';
const DASH_DELIM = '-';
const COLON_DELIM = ':';
const MILLISECONDS_IN_SECONDS = 1000;
const CONFIG_FILE_NAME = '.timetracker_config.json';
const CONFIG_PATH = filePath.format({
    dir: HOME_DIR_PATH,
    base: CONFIG_FILE_NAME
});  

const cmds = {
    START: 'start',
    STOP: 'stop',
    IMPORT: 'import',
    STATUS: 'status'
};

const VERSION = '0.1.0';
const CMD = 'cmd';
const CMD_ARGS = 'cmdargs';

module.exports = {
    CANCEL_CODE,
    CMD,
    CMD_ARGS,
    CONFIG_FILE_NAME,
    CONFIG_PATH,
    DASH_DELIM,
    DURATION_FORMAT,
    HOME_DIR_PATH,
    SPACE_DELIM,
    TIME_ENTRY_DATE_FORMAT,
    TIME_ENTRY_FORMAT,
    TIME_HOUR_FORMAT,
    TIME_MINUTE_FORMAT,
    ISO8601_FORMAT,
    MINUTES_IN_HOUR,
    MILLISECONDS_IN_SECONDS,
    TIME_SECOND_FORMAT,
    VERSION,
    COLON_DELIM,
    cmds
};
 

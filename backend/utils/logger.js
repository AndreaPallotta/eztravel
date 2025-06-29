const winston = require('winston');
const morgan = require('morgan');
const { isDev, getLogLevel, log_dir_name } = require('./env.config');

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
);

const transports = [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
        filename: `${log_dir_name}/error.log`,
        level: 'error',
        format: fileFormat,
        options: { flags: 'w' },
    }),
    new winston.transports.File({
        filename: `${log_dir_name}/http.log`,
        level: 'http',
        format: fileFormat,
        options: { flags: 'w' },
    }),
    new winston.transports.File({
        filename: `${log_dir_name}/all.log`,
        format: fileFormat,
        options: { flags: 'w' },
    }),
];

const Logger = winston.createLogger({
    level: getLogLevel(),
    levels,
    transports,
});

// Morgan integration
const stream = {
    write: message => Logger.http(message.trim()),
};

const skip = (_, res) => {
    return isDev ? false : res.statusCode < 400;
};

const logMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    { stream, skip }
);

module.exports = {
    Logger,
    logMiddleware,
};

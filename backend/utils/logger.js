const winston = require('winston')
const morgan = require('morgan');
const { isDev, getLogLevel } = require('./env.config');

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

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} - ${info.level}: ${info.message}`
    )
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        options: { flags: 'w' },
    }),
    new winston.transports.File({
        filename: 'logs/http.log',
        level: 'http',
        options: { flags: 'w' },
    }),
    new winston.transports.File({
        filename: 'logs/all.log',
        options: { flags: 'w' },
    }),
];

winston.addColors(colors);

const Logger = winston.createLogger({
    level: getLogLevel(),
    levels,
    format,
    transports,
});

const stream = {
    write: (message) => Logger.http(message),
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
}
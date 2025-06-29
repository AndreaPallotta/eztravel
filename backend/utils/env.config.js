require('dotenv').config({ path: '.env' });

const { NODE_ENV, PORT, HOST, LOG_LEVEL, CACHE_TIME} =
    process.env;
const env = NODE_ENV || 'development';

const isDev = env === 'development';
const isTest = env === 'test';
const isProd = env === 'production';

const logLevels = ['error', 'warn', 'info', 'http', 'debug'];

const expressConfig = {
    PORT: PORT ?? 3000,
    HOSTNAME: HOST ?? 'localhost',
};

const getLogLevel = () => {
    if (!LOG_LEVEL || !logLevels.includes(LOG_LEVEL)) {
        return isDev ? 'debug' : 'warn';
    }
    return LOG_LEVEL;
};

exports.isDev = isDev;
exports.isTest = isTest;
exports.isProd = isProd;
exports.expressConfig = expressConfig;
exports.getLogLevel = getLogLevel;
exports.CACHE_TIME = Number(CACHE_TIME ?? 3600);
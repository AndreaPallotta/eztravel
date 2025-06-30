require('dotenv').config({ path: '.env' });
const { execSync } = require('child_process');
const os = require('os');
const pkg = require('../package.json');
const { Logger } = require('./logger');

const { NODE_ENV, PORT, HOST, LLM_PORT, LLM_HOST, LOG_LEVEL, CACHE_TIME, LOG_DIR_NAME } = process.env;
const env = NODE_ENV || 'development';

const isDev = env === 'development';
const isTest = env === 'test';
const isProd = env === 'production';
const logLevels = ['error', 'warn', 'info', 'http', 'debug'];

const expressConfig = {
    PORT: PORT ?? 3000,
    HOSTNAME: HOST ?? 'localhost',
};

const llmConfig = {
    PORT: LLM_PORT ?? 11434,
    HOSTNAME: LLM_HOST ?? 'localhost',
    get url() { return `http://${this.host}:${this.port}`; }
}

const getLogLevel = () => {
    if (!LOG_LEVEL || !logLevels.includes(LOG_LEVEL)) {
        return isDev ? 'debug' : 'warn';
    }
    return LOG_LEVEL;
};

let commit = 'Unknown'
try {
    commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
    Logger.warn('Could not get git commit: ', e.message);
}

const repo = (pkg.repository?.url ?? 'N/A').replace(`${pkg.repository?.type ?? 'git'}+`, '');

module.exports = {
    isDev,
    isTest,
    isProd,
    expressConfig,
    llmConfig,
    getLogLevel,
    cache_time: Number(CACHE_TIME ?? 3600),
    log_dir_name: LOG_DIR_NAME ?? 'logs',
    versionInfo: {
        name: pkg.name ?? 'Unknown App',
        version: pkg.version ?? '0.0.1',
        author: pkg.author ?? 'N/A',
        commit,
        repo,
        nodeVersion: process.version,
        platform: `${os.platform()} (${os.arch()})`
    },
    serverUptime: new Date(),
}

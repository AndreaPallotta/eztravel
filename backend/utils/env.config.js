require('dotenv').config({ path: '.env' });
const { execSync } = require('child_process');
const os = require('os');
const pkg = require('../package.json');

const { NODE_ENV, PORT, HOSTNAME, LLM_PORT, LLM_HOSTNAME, LOG_LEVEL, CACHE_TIME, LOG_DIR_NAME } = process.env;
const env = NODE_ENV || 'development';

const isDev = env === 'development';
const isTest = env === 'test';
const isProd = env === 'production';
const logLevels = ['error', 'warn', 'info', 'http', 'debug'];

const expressConfig = {
    PORT: PORT ?? 3000,
    HOSTNAME: HOSTNAME ?? 'localhost',
    get url() { return `http://${this.HOSTNAME}:${this.PORT}`; }
};

const llmConfig = {
    PORT: LLM_PORT ?? 11434,
    HOSTNAME: LLM_HOSTNAME ?? 'localhost',
    get url() { return `http://${this.HOSTNAME}:${this.PORT}`; }
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
} catch {}
const repo = (pkg.repository?.url ?? 'N/A').replace(`${pkg.repository?.type ?? 'git'}+`, '');

const swaggerOpts = {
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'EzTravel API Docs',
            version: pkg.version ?? '0.0.1',
            description: 'CRUD Express API for EzTravel'
        },
        servers: [{ url: expressConfig.url }],
    },
    apis: ['./routes/v1/*.js']
}

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
    swaggerOpts
}

const fs = require('fs');
const path = require('path');
const router = require('express').Router()
const { versionInfo, log_dir_name, serverUptime } = require('../../utils/env.config');
const { Logger } = require('../../utils/logger');
const { select } = require('../../utils/db');
const { getLlmInfo, getLlmTags, getLlmUptime } = require('../../utils/llm');


const getVersion = async (_, res) => {
    const llm = await getLlmInfo();
    return res.status(200).send({
        ...versionInfo,
        llm
    });
};

const getHealth = async (_, res) => {
    const errors = {};
    const { llmStatus, llmErrors } = await getLlmTags();
    if (llmErrors) {
        errors.llm = llmErrors;
    }

    let dbStatus = true;
    try {
        const dbRes = await select.getDbHealth();
        dbStatus = dbRes.healthy;
        if (!dbStatus) {
            throw new Error(dbRes.error);
        }
    } catch (err) {
        Logger.error(`Failed to retrieve sqlite3 health status: ${err.message}`);
        errors.db = err.message;
    }

    const components = {
        api: true,
        llm: llmStatus,
        db: dbStatus
    }
    const isStatusOk = Object.values(components).every(Boolean);

    const result = {
        overall_status: isStatusOk ? 'ok' : 'degraded',
        components,
        ...(Object.keys(errors).length && { errors }),
        timestamp: new Date().toISOString(),
    };
    res.status(isStatusOk ? 200 : 503).json(result);
};

const getLogs = async (_, res) => {
    const logs = {};
    const logDir = path.join(__dirname, '..', log_dir_name);

    let files;
    try {
        files = await fs.readdir(logDir);
        Logger.debug(`Found ${files.length} log files: ${files.join(', ')}`);
    } catch (err) {
        Logger.error(`Failed to read log directory: ${err.message}`);
        return res.status(500).json({ error: 'Could not read log directory' });
    }

    await Promise.all(files.map(async (file) => {
        const filePath = path.join(logDir, file);
        try {
            logs[file] = await fs.readFile(filePath, 'utf-8');
        } catch (err) {
            Logger.error(`Failed to read file "${file}": ${err.message}`);
            logs[file] = `Error reading file: ${err.message}`;
        }
    }));

    res.status(200).json(logs);
};

const getUptime = async (_, res) => {
    const now = new Date();

    const uptimeSecs = Math.floor((now - serverUptime) / 1000);
    const serverUptimeStr = `${Math.floor(uptimeSecs / 3600)}h ${Math.floor((uptimeSecs % 3600) / 60)}m ${uptimeSecs % 60}s`;
    let statusCode = 200;

    const { llmUptime, llmUptimeErrors } = await getLlmUptime();
    if (llmUptimeErrors) {
        statusCode = 500;
    }

    return res.status(statusCode).json({
        server_uptime: serverUptimeStr,
        llm_uptime: llmUptime,
        llm_errors: llmUptimeErrors || undefined,
        timestamp: now.toISOString()
    });
};

router.get('/version', getVersion);
router.get('/health', getHealth);
router.get('/logs', getLogs);
router.get('/uptime', getUptime);

module.exports = router;
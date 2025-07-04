const fs = require('fs');
const path = require('path');
const router = require('express').Router()
const axios = require('axios');
const { versionInfo, log_dir_name, llmConfig, serverUptime } = require('../../utils/env.config');
const { Logger } = require('../../utils/logger');
const { select } = require('../../utils/db');


const getVersion = async (_, res) => {
    let llm;
    try {
        const response = await axios.get(`${llmConfig.url}/api/show?name=mistral`, { timeout: 1000 });
        llm = {
            model: response.data?.name ?? 'Unknown',
            status: 'loaded',
            details: response.data?.details ?? {}
        };
    } catch (err) {
        llm = {
            model: 'mistral',
            status: 'unavailable',
            error: err.message
        }
    }
    return res.status(200).send({
        ...versionInfo,
        llm
    });
};

const getHealth = async (_, res) => {
    let llmStatus = true;
    const errors = {};
    try {
        const llmRes = await axios.get(`http://${llmConfig.url}/api/tags`, { timeout: 1000 });
        llmStatus = llmRes.status === 200;
    } catch (err) {
        Logger.error(`Failed to retrieve llm health status: ${err.message}`);
        llmStatus = false;
        errors.llm = err.message;
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

    let llmUptimeStr = 'unknown';
    let llmErrors = '';
    let statusCode = 200;

    try {
        const llmRes = await axios.get(`${llmConfig.url}/api/ps`, { timeout: 1000 });
        const mistral = llmRes.data.models?.find((m) => m.name.includes('mistral'));
        if (!mistral || !mistral.created_at) {
            throw new Error('Model not running');
        }
        const start = new Date(mistral.created_at);
        const llmUptimeSecs = Math.floor((now - start) / 1000);
        llmUptimeStr = `${Math.floor(llmUptimeSecs / 3600)}h ${Math.floor((llmUptimeSecs % 3600) / 60)}m ${llmUptimeSecs % 60}s`;
    } catch (e) {
        llmErrors = `Failed to retrieve LLM uptime: ${e.message}`;
        Logger.error(llmErrors);
        statusCode = 503;
    }

    return res.status(statusCode).json({
        server_uptime: serverUptimeStr,
        llm_uptime: llmUptimeStr,
        llm_errors: llmErrors || undefined,
        timestamp: now.toISOString()
    });
};

router.get('/version', getVersion);
router.get('/health', getHealth);
router.get('/logs', getLogs);
router.get('/uptime', getUptime);

module.exports = router;
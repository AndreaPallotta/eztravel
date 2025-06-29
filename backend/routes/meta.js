const fs = require('fs');
const path = require('path');
const router = require('express').Router()
const axios = require('axios');
const { versionInfo, log_dir_name, llmConfig } = require('../utils/env.config');
const { Logger } = require('../utils/logger');


const getVersion = async (_, res) => {
    let llm;
    try {
        const response = await axios.get(`http://${llmConfig.COMBINED}/api/show?name=mistral`, { timeout: 1000 });
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
        const llm_res = await axios.get(`http://${llmConfig.COMBINED}/api/tags`, { timeout: 1000 });
        llmStatus = llm_res.status === 200;
    } catch (err) {
        llmStatus = false;
        errors.llm = err.message;
    }

    const components = {
        api: true,
        llm: llmStatus
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

router.get('/version', getVersion);
router.get('/health', getHealth);
router.get('/logs', getLogs);

module.exports = router;
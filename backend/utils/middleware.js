const { Logger } = require('./logger');
const rateLimit = require('express-rate-limit');
const { expressConfig } = require('./env.config');
const { validationResult } = require('express-validator');

const printResMid = (req, res, next) => {
    const { method, url, body, query, ip } = req;
    const safeBody = JSON.stringify(body).slice(0, 300);
    Logger.debug(
        `📥 ${method} ${url} - IP: ${ip} - Query: ${JSON.stringify(query)} - Body: ${safeBody}`
    );
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        Logger.debug(`📤 ${method} ${url} - Status: ${res.statusCode} (${duration}ms)`);
    });

    next();
};

const apiLimiterMid = rateLimit({
    windowMs: expressConfig.RATE_LIMIT_WINDOW_MS,
    max: expressConfig.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

const validateMid = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    printResMid,
    apiLimiterMid,
    validateMid,
};

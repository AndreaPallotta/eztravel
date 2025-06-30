const { Logger } = require('./logger');
const rateLimit = require('express-rate-limit');

const printResMid = (req, res, next) => {
    const { method, url, body, query } = req;
    Logger.debug(`📥 ${method} ${url} - Query: ${JSON.stringify(query)} Body: ${JSON.stringify(body)}`);
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        Logger.debug(`📤 ${method} ${url} - Status: ${res.statusCode} (${duration}ms)`);
    });

    next();
};

const apiLimiterMid = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

module.exports = {
    printResMid,
    apiLimiterMid,
};
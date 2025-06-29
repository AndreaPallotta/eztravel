const { Logger } = require('./logger');

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

module.exports = {
    printResMid
};
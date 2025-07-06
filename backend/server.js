const app = require('./app');
const { Logger } = require('./utils/logger');
const { expressConfig } = require('./utils/env.config');

const server = app.listen(expressConfig.PORT, expressConfig.HOSTNAME, () => {
    Logger.debug(`Server started on ${expressConfig.url}`);
});

process.on('uncaughtException', (err) => {
    Logger.error(`Uncaught Exception: ${err.message}`, err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    Logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('SIGINT', () => {
    Logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        Logger.info('Server closed');
        process.exit(0);
    });
});

const app = require('./app');
const { Logger } = require('./utils/logger');
const { expressConfig } = require('./utils/env.config');

const { PORT, HOSTNAME } = expressConfig;

app.listen(PORT, HOSTNAME, () => {
    Logger.debug(`Server started on ${HOSTNAME ?? 'localhost'}:${PORT}`);
});
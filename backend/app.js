const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const { logMiddleware, Logger } = require('./utils/logger');
const { printResMid, apiLimiterMid } = require('./utils/middleware');

const v1Routes = require('./routes/v1');
const { swaggerOpts } = require('./utils/env.config');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable('x-powered-by');
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(logMiddleware);
app.use(printResMid);
app.use(apiLimiterMid);

app.use('/v1', v1Routes);
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOpts)));
app.use((req, res, _) => {
    Logger.warn(`"${req.originalUrl}" is not a valid endpoint`);
    return res.status(404).send({ error: `"${req.originalUrl}" is not a valid endpoint` });
});

module.exports = app;

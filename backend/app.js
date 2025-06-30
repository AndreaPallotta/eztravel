const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const { logMiddleware } = require('./utils/logger');
const { printResMid, apiLimiterMid } = require('./utils/middleware');

const v1Routes = require('./routes/v1');

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

module.exports = app;
const router = require('express').Router();
const { select } = require('../../utils/db');
const { Logger } = require('../../utils/logger');

router.get('/', async (_, res) => {
    try {
        const pairs = await select.getCacheEntries();
        res.status(200).json(pairs);
    } catch (err) {
        Logger.error(`Failed to retrieve cache: ${err.message}`);
        res.status(500).json({ error: 'Failed to retrieve cache' });
    }
});

module.exports = router;

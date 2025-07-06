const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/itineraries', require('./itineraries'));
router.use('/meta', require('./meta'));
router.use('/cache', require('./cache'));

module.exports = router;

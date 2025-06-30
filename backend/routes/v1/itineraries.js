const router = require('express').Router();
const { select, insert, dbDelete } = require('../../utils/db');
const { Logger } = require('../../utils/logger');

router.get('/', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const itineraries = await select.getItinerariesByUserId(userId);
        res.status(200).json(itineraries);
    } catch (err) {
        Logger.error(`Failed to get itineraries for user ${userId}: ${err.message}`);
        res.status(500).json({ error: 'Failed to get itineraries' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const itinerary = await select.getItineraryById(id);
        if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' });
        res.status(200).json(itinerary);
    } catch (err) {
        Logger.error(`Failed to get itinerary ${id}: ${err.message}`);
        res.status(500).json({ error: 'Failed to get itinerary' });
    }
});

router.post('/', async (req, res) => {
    const { userId, title, location, days, data } = req.body;
    if (!userId || !title || !location || !days || !data)
        return res.status(400).json({ error: 'Missing fields in request body' });

    try {
        const result = await insert.insertItineraryByUserId(userId, title, location, days, data);
        res.status(201).json({ inserted: result });
    } catch (err) {
        Logger.error(`Failed to insert itinerary for user ${userId}: ${err.message}`);
        res.status(500).json({ error: 'Failed to insert itinerary' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await dbDelete.deleteItinerary(id);
        if (!result) return res.status(404).json({ error: 'Itinerary not found' });
        res.status(200).json({ deleted: true });
    } catch (err) {
        Logger.error(`Failed to delete itinerary ${id}: ${err.message}`);
        res.status(500).json({ error: 'Failed to delete itinerary' });
    }
});

module.exports = router;

const router = require('express').Router();
const { select, insert, dbDelete } = require('../../utils/db');
const { getItineraryPromptResponse } = require('../../utils/llm');
const { Logger } = require('../../utils/logger');
const { validateMid } = require('../../utils/middleware');

const getItineraries = async (req, res) => {
    const userId = req.query.userId;
    try {
        const itineraries = await select.getItinerariesByUserId(userId);
        res.status(200).json(itineraries);
    } catch (err) {
        Logger.error(`Failed to get itineraries for user ${userId}: ${err.message}`);
        res.status(500).json({ error: 'Failed to get itineraries' });
    }
};

const getItineraryById = async (req, res) => {
    const { id } = req.params;
    try {
        const itinerary = await select.getItineraryById(id);
        if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' });
        res.status(200).json(itinerary);
    } catch (err) {
        Logger.error(`Failed to get itinerary ${id}: ${err.message}`);
        res.status(500).json({ error: 'Failed to get itinerary' });
    }
};

const createItinerary = async (req, res) => {
    const { userId, hasDest, destination, days, weather, activities, costRange, currLocation } =
        req.body;

    try {
        let finalDestination = destination;
        let itineraryTitle = '';
        let itineraryData = null;
        let prompt = '';

        if (!hasDest || !destination) {
            prompt = `Plan a ${days}-day trip for a solo traveler starting from "${currLocation}". They enjoy ${activities.join(', ')}, prefer ${weather || 'any'} weather, and have a budget between $${costRange?.[0] || 500} and $${costRange?.[1] || 1500}. Suggest a good destination and build a full itinerary.`;
            const llmResponse = await getItineraryPromptResponse(prompt);

            finalDestination = llmResponse.promptRes?.destination || 'Unknown';
            itineraryTitle = `${finalDestination} Trip`;
            itineraryData = llmResponse.promptRes?.itinerary || {};
        } else {
            itineraryTitle = `${destination} Trip`;
            prompt = `Build a ${days}-day itinerary for a solo traveler to ${destination}. Interests: ${activities.join(', ')}. Budget: $${costRange?.[0]}–${costRange?.[1]}. Weather preference: ${weather || 'any'}.`;
            const llmResponse = await getItineraryPromptResponse(prompt);

            itineraryData = llmResponse.promptRes?.itinerary || {};
        }

        const insertedId = await insert.insertItinerary(
            userId,
            itineraryTitle,
            finalDestination,
            days,
            itineraryData
        );

        res.status(201).json({
            id: insertedId,
            title: itineraryTitle,
            destination: finalDestination,
            result: itineraryData,
        });
    } catch (err) {
        Logger.error(`Failed to create itinerary: ${err.message}`);
        res.status(500).json({ error: `Failed to create itinerary: ${err.message}` });
    }
};

const deleteItineraryById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbDelete.deleteItinerary(id);
        if (!result) return res.status(404).json({ error: 'Itinerary not found' });
        res.status(200).json({ deleted: true });
    } catch (err) {
        Logger.error(`Failed to delete itinerary ${id}: ${err.message}`);
        res.status(500).json({ error: 'Failed to delete itinerary' });
    }
};

const validateGetItineraries = [
    query('userId').notEmpty().withMessage('userId is required'),
    validateMid,
];

const validateGetItineraryById = [
    param('id').isInt().withMessage('Valid itinerary id is required'),
    validateMid,
];

const validateCreateItinerary = [
    body('userId').isInt(),
    body('hasDest').isBoolean(),
    body('destination').isString(),
    body('days').isInt({ min: 1 }),
    body('weather').optional().isString(),
    body('activities').isArray(),
    body('costRange').isArray({ min: 2, max: 2 }),
    body('currLocation').isString(),
    validateMid,
];

const validateDeleteItinerary = [param('id').isInt(), validateMid];

router.get('/', validateGetItineraries, getItineraries);
router.get('/:id', validateGetItineraryById, getItineraryById);
router.post('/', validateCreateItinerary, createItinerary);
router.delete('/:id', validateDeleteItinerary, deleteItineraryById);

module.exports = router;

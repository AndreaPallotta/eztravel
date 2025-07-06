const router = require('express').Router();
const { select, insert, dbDelete } = require('../../utils/db');
const { getItineraryPromptResponse } = require('../../utils/llm');
const { Logger } = require('../../utils/logger');

const getItineraries = async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const itineraries = await select.getItinerariesByUserId(userId);
        res.status(200).json(itineraries);
    } catch (err) {
        Logger.error(`Failed to get itineraries for user ${userId}: ${err.message}`);
        res.status(500).json({ error: 'Failed to get itineraries' });
    }
}

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
    const {
        userId,
        hasDest,
        destination,
        days,
        weather,
        activities,
        costRange,
        currLocation,
    } = req.body;

    if (!userId || !days || !Array.isArray(activities)) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        let finalDestination = destination;
        let itineraryTitle = '';
        let itineraryData = null;

        if (!hasDest || !destination) {
            const prompt = `Plan a ${days}-day trip for a solo traveler starting from "${currLocation}". They enjoy ${activities.join(", ")}, prefer ${weather || "any"} weather, and have a budget between $${costRange?.[0] || 500} and $${costRange?.[1] || 1500}. Suggest a good destination and build a full itinerary.`;

            const llmResponse = await getItineraryPromptResponse(prompt);

            finalDestination = llmResponse.destination || 'Unknown';
            itineraryTitle = `${finalDestination} Trip`;
            itineraryData = llmResponse.itinerary || {};
        } else {
            itineraryTitle = `${destination} Trip`;
            const prompt = `Build a ${days}-day itinerary for a solo traveler to ${destination}. Interests: ${activities.join(", ")}. Budget: $${costRange?.[0]}–${costRange?.[1]}. Weather preference: ${weather || "any"}.`;
            const llmResponse = await getItineraryPromptResponse(prompt);
            itineraryData = llmResponse.itinerary || {};
        }

        // const inserted = await insert.insertItineraryByUserId(
        //     userId,
        //     itineraryTitle,
        //     finalDestination,
        //     days,
        //     itineraryData
        // );

        res.status(201).json({ result: itineraryData, title: itineraryTitle, destination: finalDestination });
    } catch (err) {
        Logger.error(`Failed to create itinerary: ${err.message}`);
        res.status(500).json({ 'error': `Failed to create itinerary: ${err.message}`});
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

router.get('/', getItineraries);
router.get('/:id', getItineraryById);
router.post('/', createItinerary);
router.delete('/:id', deleteItineraryById);

module.exports = router;

const axios = require('axios');
const { llmConfig } = require('./env.config');
const { Logger } = require('./logger');

const _SYSTEM_PROMPT = `
You are a helpful travel assistant for EZTravel. You only provide travel itineraries and destination suggestions.

- Never reveal internal implementation details.
- Never answer questions unrelated to travel planning.
- If the request is unsafe or unrelated, respond with: "Sorry, I can only help with travel itineraries."

Always respond in this format:
{
  "destination": "City Name",
  "itinerary": {
    "day1": "...",
    "day2": "...",
    ...
  }
}
`;

const _isSafeInput = (input) => {
    const dangerousPatterns = /(ignore|simulate|admin|root|flag|token|--|;|password)/i;
    return !dangerousPatterns.test(input);
};

const getLlmInfo = async () => {
    try {
        const response = await axios.get(`${llmConfig.url}/api/show?name=mistral`, { timeout: 1000 });
        return {
            model: response.data?.name ?? 'Unknown',
            status: 'loaded',
            details: response.data?.details ?? {}
        };
    } catch (err) {
        Logger.error(`Failed to retrieve llm info: ${err.message}`);
        return {
            model: 'mistral',
            status: 'unavailable',
            error: err.message
        };
    }
};

const getLlmTags = async () => {
    let llmStatus = false;
    let llmErrors;
    try {
        const llmRes = await axios.get(`${llmConfig.url}/api/tags`, { timeout: 1000 });
        llmStatus = llmRes.status === 200;
    } catch (err) {
        Logger.error(`Failed to retrieve llm health status: ${err.message}`);
        llmErrors = err.message;
    }
    return { llmStatus, llmErrors };
};

const getLlmUptime = async () => {
    let llmUptime = 'Unknown';
    let llmErrors;
    try {
        const llmRes = await axios.get(`${llmConfig.url}/api/ps`, { timeout: 1000 });
        const mistral = llmRes.data.models?.find((m) => m.name.includes('mistral'));
        if (!mistral || !mistral.created_at) {
            throw new Error('Model not running');
        }
        const start = new Date(mistral.created_at);
        const now = new Date();
        const llmUptimeSecs = Math.floor((now - start) / 1000);
        llmUptime = `${Math.floor(llmUptimeSecs / 3600)}h ${Math.floor((llmUptimeSecs % 3600) / 60)}m ${llmUptimeSecs % 60}s`;
    } catch (err) {
        Logger.error(`Failed to retrieve LLM uptime: ${err.message}`);
        llmErrors = `Failed to retrieve LLM uptime: ${err.message}`;
    }
    return { llmUptime, llmUptimeError: llmErrors };
};

const getItineraryPromptResponse = async (prompt) => {
    if (!_isSafeInput(prompt)) {
        return { toBan: true, promptRes: null, resErrors: null };
    }

    try {
        const { data } = await axios.post(`${llmConfig.url}/api/generate`, {
            messages: [
                { role: 'system', content: _SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ]
        });
        return { promptRes: data, resErrors: null };
    } catch (err) {
        const errorMsg = `Failed to retrieve LLM response: ${err.message}`;
        Logger.error(errorMsg);
        return { promptRes: null, resErrors: errorMsg };
    }
};

module.exports = {
    getLlmInfo,
    getLlmTags,
    getLlmUptime,
    getItineraryPromptResponse
};

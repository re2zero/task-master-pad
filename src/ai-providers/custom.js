/**
 * src/ai-providers/custom.js
 *
 * Flexible custom provider for OpenAI-compatible endpoints.
 * - Reads baseUrl and apiKey from .env (CUSTOM_BASE, CUSTOM_API_KEY) or .taskmasterconfig override.
 * - Compatible with unified service layer.
 */

import { log } from '../../scripts/modules/utils.js';

// Helper to get config from environment or .taskmasterconfig
function getCustomConfig({ config } = {}) {
	let baseUrl = process.env.CUSTOM_BASE;
	let apiKey = process.env.CUSTOM_API_KEY;
	// Allow override from config object (from .taskmasterconfig)
	if (config && typeof config === 'object') {
		if (config.baseUrl) baseUrl = config.baseUrl;
		if (config.apiKey) apiKey = config.apiKey;
	}
	if (!baseUrl) throw new Error('CUSTOM_BASE is not set in .env or .taskmasterconfig.');
	if (!apiKey) throw new Error('CUSTOM_API_KEY is not set in .env or .taskmasterconfig.');
	return { baseUrl, apiKey };
}

/**
 * Generates text using the custom provider (OpenAI-compatible endpoint).
 * @param {object} params
 * @param {string} params.modelId
 * @param {Array<object>} params.messages
 * @param {string} [params.systemPrompt]
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @param {object} [params.config] - Optional .taskmasterconfig model config
 * @returns {Promise<string>}
 */
export async function generateCustomText({
	modelId,
	messages,
	systemPrompt,
	maxTokens,
	temperature,
	config
}) {
	const { baseUrl, apiKey } = getCustomConfig({ config });
	const url = baseUrl.replace(/\/+$/, '') + '/openai';
	const payload = {
		model: modelId,
		messages: messages,
		max_tokens: maxTokens,
		temperature: temperature,
		stream: false
	};
	if (systemPrompt && messages && messages.length > 0) {
		payload.messages = [
			{ role: 'system', content: systemPrompt },
			...messages
		];
	}
	log('info', `[Custom] POST ${url} model=${modelId}`);
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error(`Custom provider error: ${res.statusText}`);
	const data = await res.json();
	const text = data?.choices?.[0]?.message?.content ?? data?.text ?? '';
	return text.trim();
}

/**
 * Streams text using the custom provider (SSE, OpenAI-compatible).
 * @param {object} params
 * @param {string} params.modelId
 * @param {Array<object>} params.messages
 * @param {string} [params.systemPrompt]
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @param {object} [params.config]
 * @returns {Promise<ReadableStream>}
 */
export async function streamCustomText({
	modelId,
	messages,
	systemPrompt,
	maxTokens,
	temperature,
	config
}) {
	const { baseUrl, apiKey } = getCustomConfig({ config });
	const url = baseUrl.replace(/\/+$/, '') + '/openai';
	const payload = {
		model: modelId,
		messages: messages,
		max_tokens: maxTokens,
		temperature: temperature,
		stream: true
	};
	if (systemPrompt && messages && messages.length > 0) {
		payload.messages = [
			{ role: 'system', content: systemPrompt },
			...messages
		];
	}
	log('info', `[Custom] Streaming POST ${url} model=${modelId}`);
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`,
			'Accept': 'text/event-stream'
		},
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error(`Custom provider stream error: ${res.statusText}`);
	return res.body; // Raw stream (SSE)
}

/**
 * Generates a structured object using the custom provider (function-calling or best-effort).
 * @param {object} params
 * @param {string} params.modelId
 * @param {Array<object>} params.messages
 * @param {import('zod').ZodSchema} params.schema
 * @param {string} params.objectName
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @param {number} [params.maxRetries]
 * @param {object} [params.config]
 * @returns {Promise<object>}
 */
export async function generateCustomObject({
	modelId,
	messages,
	schema,
	objectName = 'generated_object',
	maxTokens,
	temperature,
	maxRetries = 2,
	config
}) {
	const { baseUrl, apiKey } = getCustomConfig({ config });
	const url = baseUrl.replace(/\/+$/, '') + '/openai';
	let lastError;
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const payload = {
				model: modelId,
				messages,
				max_tokens: maxTokens,
				temperature,
				stream: false,
				tools: [
					{
						type: 'function',
						function: {
							name: objectName,
							description: `Generate a ${objectName} as a JSON object.`,
							parameters: schema ? schema : {}
						}
					}
				],
				tool_choice: { type: 'function', function: { name: objectName } }
			};
			log('info', `[Custom] Object POST ${url} model=${modelId} attempt=${attempt + 1}`);
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error(`Custom provider object error: ${res.statusText}`);
			const data = await res.json();
			// Try OpenAI function-calling response format
			const fc = data?.choices?.[0]?.message?.tool_calls?.[0]?.function;
			let obj;
			if (fc?.arguments) {
				obj = JSON.parse(fc.arguments);
			} else if (data?.object) {
				obj = data.object;
			} else if (typeof data === 'object') {
				obj = data;
			} else {
				throw new Error('No function-calling object found in response');
			}
			if (schema) schema.parse(obj);
			return obj;
		} catch (error) {
			lastError = error;
			log('warn', `[Custom] generateCustomObject attempt ${attempt + 1} failed: ${error.message}`);
		}
	}
	log('error', `[Custom] generateCustomObject failed after ${maxRetries} attempts: ${lastError?.message}`);
	throw lastError;
}

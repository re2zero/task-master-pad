/**
 * src/ai-providers/pollinations.js
 *
 * Implementation for interacting with Pollinations.AI models.
 * - No API key required.
 * - Supports all model IDs for 'main'.
 * - For 'research', always uses 'searchgpt' model.
 * - Compatible with Task Master unified service layer.
 */

import { log } from '../../scripts/modules/utils.js';

/**
 * Helper: Build Pollinations API URL for GET requests.
 * @param {string} prompt
 * @param {string} modelId
 * @param {object} [opts]
 * @returns {string}
 */
function buildPollinationsUrl(prompt, modelId, opts = {}) {
	const params = new URLSearchParams();
	if (modelId) params.append('model', modelId);
	if (opts.stream) params.append('stream', 'true');
	if (opts.json) params.append('json', 'true');
	if (opts.system) params.append('system', opts.system);
	if (opts.private) params.append('private', 'true');
	const encodedPrompt = encodeURIComponent(prompt);
	return `https://text.pollinations.ai/${encodedPrompt}?${params.toString()}`;
}

/**
 * Generates text using Pollinations API.
 * @param {object} params
 * @param {string} params.modelId - Model to use (e.g. 'openai', 'searchgpt', etc.)
 * @param {Array<object>} params.messages - Array of {role, content}
 * @param {string} [params.systemPrompt]
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @param {boolean} [params.isResearch]
 * @returns {Promise<string>}
 */
export async function generatePollinationsText({
	modelId,
	messages,
	systemPrompt,
	maxTokens,
	temperature,
	isResearch
}) {
	try {
		// Always use 'searchgpt' for research, else user-supplied modelId
		const model = isResearch ? 'searchgpt' : (modelId || 'openai');
		const userPrompt = (messages || []).map(m => m.content).join('\n');
		const url = buildPollinationsUrl(userPrompt, model, {
			json: false,
			system: systemPrompt
		});
		log('info', `[Pollinations] Fetching: ${url}`);
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Pollinations API error: ${res.statusText}`);
		const text = await res.text();
		return text.trim();
	} catch (error) {
		log('error', `[Pollinations] generatePollinationsText failed: ${error.message}`);
		throw error;
	}
}

/**
 * Streams text from Pollinations API using Server-Sent Events (SSE).
 * @param {object} params
 * @param {string} params.modelId
 * @param {Array<object>} params.messages
 * @param {string} [params.systemPrompt]
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @param {boolean} [params.isResearch]
 * @returns {Promise<ReadableStream>} (raw Response.body stream, caller must handle SSE parsing)
 */
export async function streamPollinationsText({
	modelId,
	messages,
	systemPrompt,
	maxTokens,
	temperature,
	isResearch
}) {
	try {
		const model = isResearch ? 'searchgpt' : (modelId || 'openai');
		const userPrompt = (messages || []).map(m => m.content).join('\n');
		const url = buildPollinationsUrl(userPrompt, model, {
			stream: true,
			system: systemPrompt
		});
		log('info', `[Pollinations] Streaming: ${url}`);
		const res = await fetch(url, { headers: { Accept: 'text/event-stream' } });
		if (!res.ok) throw new Error(`Pollinations API error: ${res.statusText}`);
		// Return the raw stream; unified layer should parse SSE
		return res.body;
	} catch (error) {
		log('error', `[Pollinations] streamPollinationsText failed: ${error.message}`);
		throw error;
	}
}

/**
 * Generates a structured object using Pollinations API (best-effort).
 * Note: Pollinations does not guarantee strict JSON output, so this attempts to parse.
 * @param {object} params
 * @param {string} params.modelId
 * @param {Array<object>} params.messages
 * @param {import('zod').ZodSchema} params.schema
 * @param {string} params.objectName
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @param {number} [params.maxRetries]
 * @param {boolean} [params.isResearch]
 * @returns {Promise<object>}
 */
export async function generatePollinationsObject({
	modelId,
	messages,
	schema,
	objectName = 'generated_object',
	maxTokens,
	temperature,
	maxRetries = 2,
	isResearch
}) {
	let lastError;
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const text = await generatePollinationsText({
				modelId,
				messages,
				maxTokens,
				temperature,
				isResearch
			});
			// Try to extract JSON from the text
			const match = text.match(/\{[\s\S]*\}/);
			const jsonStr = match ? match[0] : text;
			const obj = JSON.parse(jsonStr);
			// If schema is provided, validate
			if (schema) schema.parse(obj);
			return obj;
		} catch (error) {
			lastError = error;
			log('warn', `[Pollinations] generatePollinationsObject attempt ${attempt + 1} failed: ${error.message}`);
		}
	}
	log('error', `[Pollinations] generatePollinationsObject failed after ${maxRetries} attempts: ${lastError?.message}`);
	throw lastError;
}

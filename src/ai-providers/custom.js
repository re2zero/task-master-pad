/**
 * src/ai-providers/custom.js
 *
 * Flexible custom provider for OpenAI-compatible endpoints.
 * - Reads baseUrl and apiKey from .env (CUSTOM_BASE, CUSTOM_API_KEY) or .taskmasterconfig override.
 * - Compatible with unified service layer.
 */

import { log } from '../../scripts/modules/utils.js';
import { BaseAIProvider } from './base-provider.js';

export class CustomAIProvider extends BaseAIProvider {
	constructor() {
		super();
		this.name = 'Custom';
	}

	/**
	 * Helper to get config from environment or .taskmasterconfig
	 * @param {object} params - Parameters including config object
	 * @returns {object} - Configuration with baseUrl and apiKey
	 */
	getCustomConfig({ config } = {}) {
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
	 * Creates and returns a client instance for the provider
	 * Implementation required by BaseAIProvider abstract method
	 * @param {object} params - Parameters for client initialization
	 * @param {string} params.modelId - Model identifier
	 * @param {object} [params.config] - Optional configuration from .taskmasterconfig
	 * @returns {Function} Client function
	 * @throws {Error} If initialization fails
	 */
	getClient(params) {
		try {
			// For custom provider, we'll create a function that returns the modelId
			// since we handle the actual API calls in our method implementations
			// The actual connection details are handled in each method
			const { config } = params;
			// Validate config availability - will throw if not available
			this.getCustomConfig({ config });
			
			// Return a function that simply returns the model ID
			// This matches the expected signature in BaseAIProvider
			return (modelId) => modelId;
		} catch (error) {
			this.handleError('client initialization', error);
		}
	}

	/**
	 * Validates authentication parameters - override from base class
	 * @param {object} params - Parameters to validate
	 */
	validateAuth(params) {
		try {
			this.getCustomConfig({ config: params.config });
		} catch (error) {
			throw error;
		}
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
	async generateText({
		modelId,
		messages,
		systemPrompt,
		maxTokens,
		temperature,
		config
	}) {
		try {
			const { baseUrl, apiKey } = this.getCustomConfig({ config });
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
		} catch (error) {
			this.handleError('generateText', error);
		}
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
	async streamText({
		modelId,
		messages,
		systemPrompt,
		maxTokens,
		temperature,
		config
	}) {
		try {
			const { baseUrl, apiKey } = this.getCustomConfig({ config });
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
		} catch (error) {
			this.handleError('streamText', error);
		}
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
	async generateObject({
		modelId,
		messages,
		schema,
		objectName = 'generated_object',
		maxTokens,
		temperature,
		maxRetries = 2,
		config
	}) {
		let lastError;
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const { baseUrl, apiKey } = this.getCustomConfig({ config });
				const url = baseUrl.replace(/\/+$/, '') + '/openai';
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
				log('warn', `[Custom] generateObject attempt ${attempt + 1} failed: ${error.message}`);
			}
		}
		this.handleError('generateObject', lastError || new Error('Failed to generate object after maximum retries'));
	}
}

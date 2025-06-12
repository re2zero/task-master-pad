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
import { BaseAIProvider } from './base-provider.js';

export class PollinationsAIProvider extends BaseAIProvider {
	constructor() {
		super();
		this.name = 'Pollinations';
	}
	
	/**
	 * Validates authentication parameters - override from base class
	 * Pollinations doesn't require API key, so we override to skip that validation
	 * @param {object} params - Parameters to validate
	 */
	validateAuth(params) {
		// No authentication required for Pollinations
		return true;
	}
	
	/**
	 * Creates and returns a client function for Pollinations.
	 * Unlike other providers, Pollinations doesn't use a client library,
	 * so we return a function that processes the model ID.
	 * 
	 * @param {object} params - Parameters for client initialization
	 * @param {boolean} [params.isResearch] - Whether this is for research purposes
	 * @returns {Function} A function that returns processed model ID
	 */
	getClient(params = {}) {
		try {
			const { isResearch } = params;
			
			// Return a function that processes the model ID according to Pollinations rules
			return (modelId) => {
				// For research queries, always use 'searchgpt' model
				if (isResearch) return 'searchgpt';
				// Otherwise return the provided model or default to 'openai'
				return modelId || 'openai';
			};
		} catch (error) {
			this.handleError('client initialization', error);
		}
	}

	/**
	 * Helper: Build Pollinations API URL for GET requests.
	 * @param {string} prompt
	 * @param {string} modelId
	 * @param {object} [opts]
	 * @returns {string}
	 */
	buildPollinationsUrl(prompt, modelId, opts = {}) {
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
	 * This implementation overrides the base class method to use direct API calls
	 * instead of the Vercel AI SDK, which doesn't support Pollinations.
	 * 
	 * @param {object} params
	 * @param {string} params.modelId - Model to use (e.g. 'openai', 'searchgpt', etc.)
	 * @param {Array<object>} params.messages - Array of {role, content}
	 * @param {string} [params.systemPrompt]
	 * @param {number} [params.maxTokens]
	 * @param {number} [params.temperature]
	 * @param {boolean} [params.isResearch]
	 * @returns {Promise<object>} Object containing text and usage info
	 */
	async generateText({
		modelId,
		messages,
		systemPrompt,
		maxTokens,
		temperature,
		isResearch
	}) {
		try {
			this.validateMessages(messages);
			
			// Process the model ID using our client function
			const clientFn = this.getClient({ isResearch });
			const model = clientFn(modelId);
			
			const userPrompt = (messages || []).map(m => m.content).join('\n');
			const url = this.buildPollinationsUrl(userPrompt, model, {
				json: false,
				system: systemPrompt
			});
			
			log('info', `[Pollinations] Fetching: ${url}`);
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Pollinations API error: ${res.statusText}`);
			const text = await res.text();
			
			// Return formatted response to match BaseAIProvider's expected structure
			return {
				text: text.trim(),
				usage: {
					// Pollinations doesn't provide token usage info
					inputTokens: null,
					outputTokens: null,
					totalTokens: null
				}
			};
		} catch (error) {
			this.handleError('generateText', error);
		}
	}

	/**
	 * Streams text from Pollinations API using Server-Sent Events (SSE).
	 * This implementation overrides the base class method to use direct API calls.
	 * 
	 * @param {object} params
	 * @param {string} params.modelId
	 * @param {Array<object>} params.messages
	 * @param {string} [params.systemPrompt]
	 * @param {number} [params.maxTokens]
	 * @param {number} [params.temperature]
	 * @param {boolean} [params.isResearch]
	 * @returns {Promise<ReadableStream>} (raw Response.body stream, caller must handle SSE parsing)
	 */
	async streamText({
		modelId,
		messages,
		systemPrompt,
		maxTokens,
		temperature,
		isResearch
	}) {
		try {
			this.validateMessages(messages);
			
			// Process the model ID using our client function
			const clientFn = this.getClient({ isResearch });
			const model = clientFn(modelId);
			
			const userPrompt = (messages || []).map(m => m.content).join('\n');
			const url = this.buildPollinationsUrl(userPrompt, model, {
				stream: true,
				system: systemPrompt
			});
			
			log('info', `[Pollinations] Streaming: ${url}`);
			const res = await fetch(url, { headers: { Accept: 'text/event-stream' } });
			if (!res.ok) throw new Error(`Pollinations API error: ${res.statusText}`);
			
			// Return the raw stream; unified layer should parse SSE
			return res.body;
		} catch (error) {
			this.handleError('streamText', error);
		}
	}

	/**
	 * Generates a structured object using Pollinations API (best-effort).
	 * Note: Pollinations does not guarantee strict JSON output, so this attempts to parse.
	 * This implementation overrides the base class method to use direct API calls.
	 * 
	 * @param {object} params
	 * @param {string} params.modelId
	 * @param {Array<object>} params.messages
	 * @param {import('zod').ZodSchema} params.schema
	 * @param {string} params.objectName
	 * @param {number} [params.maxTokens]
	 * @param {number} [params.temperature]
	 * @param {number} [params.maxRetries]
	 * @param {boolean} [params.isResearch]
	 * @returns {Promise<object>} Object containing the generated object and usage info
	 */
	async generateObject({
		modelId,
		messages,
		schema,
		objectName = 'generated_object',
		maxTokens,
		temperature,
		maxRetries = 2,
		isResearch
	}) {
		try {
			this.validateMessages(messages);
			
			if (!schema) {
				throw new Error('Schema is required for object generation');
			}
			
			let lastError;
			for (let attempt = 0; attempt < maxRetries; attempt++) {
				try {
					// Get text response first
					const textResponse = await this.generateText({
						modelId,
						messages,
						maxTokens,
						temperature,
						isResearch
					});
					
					// Try to extract JSON from the text
					const text = textResponse.text;
					const match = text.match(/\{[\s\S]*\}/);
					const jsonStr = match ? match[0] : text;
					const obj = JSON.parse(jsonStr);
					
					// If schema is provided, validate
					if (schema) schema.parse(obj);
					
					// Return formatted response to match BaseAIProvider's expected structure
					return {
						object: obj,
						usage: textResponse.usage
					};
				} catch (error) {
					lastError = error;
					log('warn', `[Pollinations] generateObject attempt ${attempt + 1} failed: ${error.message}`);
				}
			}
			throw lastError || new Error('Failed to generate object after maximum retries');
		} catch (error) {
			this.handleError('generateObject', error);
		}
	}
}

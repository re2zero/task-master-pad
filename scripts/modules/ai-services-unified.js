/**
 * ai-services-unified.js
 * Centralized AI service layer using provider modules and config-manager.
 */

// Vercel AI SDK functions are NOT called directly anymore.
// import { generateText, streamText, generateObject } from 'ai';

// --- Core Dependencies ---
import {
	getMainProvider,
	getMainModelId,
	getResearchProvider,
	getResearchModelId,
	getFallbackProvider,
	getFallbackModelId,
	getParametersForRole
} from './config-manager.js';
import { log, resolveEnvVariable, findProjectRoot } from './utils.js';

import * as anthropic from '../../src/ai-providers/anthropic.js';
import * as perplexity from '../../src/ai-providers/perplexity.js';
import * as google from '../../src/ai-providers/google.js';
import * as openai from '../../src/ai-providers/openai.js';
import * as xai from '../../src/ai-providers/xai.js';
import * as openrouter from '../../src/ai-providers/openrouter.js';
import * as pollinations from '../../src/ai-providers/pollinations.js';
import * as custom from '../../src/ai-providers/custom.js';
// TODO: Import other provider modules when implemented (ollama, etc.)

// --- Provider Function Map ---
// Maps provider names (lowercase) to their respective service functions
const PROVIDER_FUNCTIONS = {
	anthropic: {
		generateText: anthropic.generateAnthropicText,
		streamText: anthropic.streamAnthropicText,
		generateObject: anthropic.generateAnthropicObject
	},
	perplexity: {
		generateText: perplexity.generatePerplexityText,
		streamText: perplexity.streamPerplexityText,
		generateObject: perplexity.generatePerplexityObject
	},
	google: {
		// Add Google entry
		generateText: google.generateGoogleText,
		streamText: google.streamGoogleText,
		generateObject: google.generateGoogleObject
	},
	openai: {
		// ADD: OpenAI entry
		generateText: openai.generateOpenAIText,
		streamText: openai.streamOpenAIText,
		generateObject: openai.generateOpenAIObject
	},
	xai: {
		// ADD: xAI entry
		generateText: xai.generateXaiText,
		streamText: xai.streamXaiText,
		generateObject: xai.generateXaiObject // Note: Object generation might be unsupported
	},
	openrouter: {
		// ADD: OpenRouter entry
		generateText: openrouter.generateOpenRouterText,
		streamText: openrouter.streamOpenRouterText,
		generateObject: openrouter.generateOpenRouterObject
	},
	pollinations: {
		// Pollinations provider support
		generateText: pollinations.generatePollinationsText,
		streamText: pollinations.streamPollinationsText,
		generateObject: pollinations.generatePollinationsObject
	},
	custom: {
		// Custom provider support
		generateText: custom.generateCustomText,
		streamText: custom.streamCustomText,
		generateObject: custom.generateCustomObject
	}
	// TODO: Add entries for ollama, etc. when implemented
};

// --- Configuration for Retries ---
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;

// ... [helper functions as before] ...

function isRetryableError(error) {
	const errorMessage = error.message?.toLowerCase() || '';
	return (
		errorMessage.includes('rate limit') ||
		errorMessage.includes('overloaded') ||
		errorMessage.includes('service temporarily unavailable') ||
		errorMessage.includes('timeout') ||
		errorMessage.includes('network error') ||
		error.status === 429 ||
		error.status >= 500
	);
}

function _extractErrorMessage(error) {
	try {
		if (error?.data?.error?.message) return error.data.error.message;
		if (error?.error?.message) return error.error.message;
		if (typeof error?.responseBody === 'string') {
			try {
				const body = JSON.parse(error.responseBody);
				if (body?.error?.message) return body.error.message;
			} catch {}
		}
		if (typeof error?.message === 'string' && error.message) return error.message;
		if (typeof error === 'string') return error;
		return 'An unknown AI service error occurred.';
	} catch (e) {
		return 'Failed to extract error message.';
	}
}

function _resolveApiKey(providerName, session, projectRoot = null) {
	const keyMap = {
		openai: 'OPENAI_API_KEY',
		anthropic: 'ANTHROPIC_API_KEY',
		google: 'GOOGLE_API_KEY',
		perplexity: 'PERPLEXITY_API_KEY',
		mistral: 'MISTRAL_API_KEY',
		azure: 'AZURE_OPENAI_API_KEY',
		openrouter: 'OPENROUTER_API_KEY',
		xai: 'XAI_API_KEY'
	};
	if (providerName === 'pollinations' || providerName === 'custom') {
		return null;
	}
	const envVarName = keyMap[providerName];
	if (!envVarName) throw new Error(`Unknown provider '${providerName}' for API key resolution.`);
	const apiKey = resolveEnvVariable(envVarName, session, projectRoot);
	if (!apiKey) {
		throw new Error(
			`Required API key ${envVarName} for provider '${providerName}' is not set in environment, session, or .env file.`
		);
	}
	return apiKey;
}

// --- RESTORED: Unified Service Runner ---
async function _unifiedServiceRunner(serviceType, params) {
	const {
		role: initialRole,
		session,
		projectRoot,
		systemPrompt,
		prompt,
		schema,
		objectName,
		...restApiParams
	} = params;
	log('info', `${serviceType}Service called`, {
		role: initialRole,
		projectRoot
	});

	const effectiveProjectRoot = projectRoot || findProjectRoot();

	let sequence;
	if (initialRole === 'main') {
		sequence = ['main', 'fallback', 'research'];
	} else if (initialRole === 'research') {
		sequence = ['research', 'fallback', 'main'];
	} else if (initialRole === 'fallback') {
		sequence = ['fallback', 'main', 'research'];
	} else {
		log(
			'warn',
			`Unknown initial role: ${initialRole}. Defaulting to main -> fallback -> research sequence.`
		);
		sequence = ['main', 'fallback', 'research'];
	}

	let lastError = null;
	let lastCleanErrorMessage =
		'AI service call failed for all configured roles.';

	for (const currentRole of sequence) {
		let providerName, modelId, apiKey, roleParams, providerFnSet, providerApiFn;

		try {
			log('info', `New AI service call with role: ${currentRole}`);

			if (currentRole === 'main') {
				providerName = getMainProvider(effectiveProjectRoot);
				modelId = getMainModelId(effectiveProjectRoot);
			} else if (currentRole === 'research') {
				providerName = getResearchProvider(effectiveProjectRoot);
				modelId = getResearchModelId(effectiveProjectRoot);
			} else if (currentRole === 'fallback') {
				providerName = getFallbackProvider(effectiveProjectRoot);
				modelId = getFallbackModelId(effectiveProjectRoot);
			} else {
				log(
					'error',
					`Unknown role encountered in _unifiedServiceRunner: ${currentRole}`
				);
				lastError =
					lastError || new Error(`Unknown AI role specified: ${currentRole}`);
				continue;
			}

			if (!providerName || !modelId) {
				log(
					'warn',
					`Skipping role '${currentRole}': Provider or Model ID not configured.`
				);
				lastError =
					lastError ||
					new Error(
						`Configuration missing for role '${currentRole}'. Provider: ${providerName}, Model: ${modelId}`
					);
				continue;
			}

			roleParams = getParametersForRole(currentRole, effectiveProjectRoot);

			providerFnSet = PROVIDER_FUNCTIONS[providerName?.toLowerCase()];
			if (!providerFnSet) {
				log(
					'warn',
					`Skipping role '${currentRole}': Provider '${providerName}' not supported or map entry missing.`
				);
				lastError =
					lastError ||
					new Error(`Unsupported provider configured: ${providerName}`);
				continue;
			}

			providerApiFn = providerFnSet[serviceType];
			if (typeof providerApiFn !== 'function') {
				log(
					'warn',
					`Skipping role '${currentRole}': Service type '${serviceType}' not implemented for provider '${providerName}'.`
				);
				lastError =
					lastError ||
					new Error(
						`Service '${serviceType}' not implemented for provider ${providerName}`
					);
				continue;
			}

			apiKey = _resolveApiKey(
				providerName?.toLowerCase(),
				session,
				effectiveProjectRoot
			);

			const messages = [];
			if (systemPrompt) {
				messages.push({ role: 'system', content: systemPrompt });
			}
			if (prompt) {
				messages.push({ role: 'user', content: prompt });
			} else {
				throw new Error('User prompt content is missing.');
			}

			const callParams = {
				apiKey,
				modelId,
				maxTokens: roleParams.maxTokens,
				temperature: roleParams.temperature,
				messages,
				...(serviceType === 'generateObject' && { schema, objectName }),
				...restApiParams
			};

			const result = await (async function attempt(retries = 0) {
				try {
					return await providerApiFn(callParams);
				} catch (error) {
					if (isRetryableError(error) && retries < MAX_RETRIES) {
						const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries);
						log('info', `Retryable error detected. Retrying in ${delay / 1000}s...`);
						await new Promise((resolve) => setTimeout(resolve, delay));
						return attempt(retries + 1);
					}
					throw error;
				}
			})();

			log('info', `${serviceType}Service succeeded using role: ${currentRole}`);
			return result;
		} catch (error) {
			const cleanMessage = _extractErrorMessage(error);
			log(
				'error',
				`Service call failed for role ${currentRole} (Provider: ${providerName || 'unknown'}, Model: ${modelId || 'unknown'}): ${cleanMessage}`
			);
			lastError = error;
			lastCleanErrorMessage = cleanMessage;
		}
	}

	log('error', `All roles in the sequence [${sequence.join(', ')}] failed.`);
	throw new Error(lastCleanErrorMessage);
}

// --- Service Exports ---

async function generateTextService(params) {
	return _unifiedServiceRunner('generateText', params);
}

async function streamTextService(params) {
	return _unifiedServiceRunner('streamText', params);
}

async function generateObjectService(params) {
	const defaults = {
		objectName: 'generated_object',
		maxRetries: 3
	};
	const combinedParams = { ...defaults, ...params };
	return _unifiedServiceRunner('generateObject', combinedParams);
}

export { generateTextService, streamTextService, generateObjectService };

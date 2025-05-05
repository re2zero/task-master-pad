# Configuration

Taskmaster uses two primary methods for configuration:

1.  **`.taskmasterconfig` File (Project Root - Recommended for most settings)**

    - This JSON file stores most configuration settings, including AI model selections, parameters, logging levels, and project defaults.
    - **Location:** This file is created in the root directory of your project when you run the `task-master models --setup` interactive setup. You typically do this during the initialization sequence. Do not manually edit this file beyond adjusting Temperature and Max Tokens depending on your model.
    - **Management:** Use the `task-master models --setup` command (or `models` MCP tool) to interactively create and manage this file. You can also set specific models directly using `task-master models --set-<role>=<model_id>`, adding `--ollama` or `--openrouter` flags for custom models. Manual editing is possible but not recommended unless you understand the structure.
    - **Example Structure:**
      ```json
      {
        "models": {
          "main": {
            "provider": "pollinations",
            "modelId": "openai" // Or any available Pollinations model
          },
          "research": {
            "provider": "pollinations",
            "modelId": "searchgpt"
          },
          "custom": {
            "provider": "custom",
            "modelId": "gpt-4o",
            "baseUrl": "https://your-custom-endpoint.com/openai", // optional, else uses .env
            "apiKey": "sk-your-custom-key" // optional, else uses .env
          }
        },
        "global": {
          "logLevel": "info",
          "debug": false,
          "defaultSubtasks": 5,
          "defaultPriority": "medium",
          "projectName": "Your Project Name",
          "ollamaBaseUrl": "http://localhost:11434/api",
          "azureOpenaiBaseUrl": "https://your-endpoint.openai.azure.com/"
        }
      }
      ```

2.  **Environment Variables (`.env` file or MCP `env` block - For API Keys Only)**
    - Used **exclusively** for sensitive API keys and specific endpoint URLs.
    - **Location:**
      - For CLI usage: Create a `.env` file in your project root.
      - For MCP/Cursor usage: Configure keys in the `env` section of your `.cursor/mcp.json` file.
    - **Required API Keys (Depending on configured providers):**
      - `ANTHROPIC_API_KEY`: Your Anthropic API key.
      - `PERPLEXITY_API_KEY`: Your Perplexity API key.
      - `OPENAI_API_KEY`: Your OpenAI API key.
      - `GOOGLE_API_KEY`: Your Google API key.
      - `MISTRAL_API_KEY`: Your Mistral API key.
      - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key (also requires `AZURE_OPENAI_ENDPOINT`).
      - `OPENROUTER_API_KEY`: Your OpenRouter API key.
      - `XAI_API_KEY`: Your X-AI API key.
    - **Optional Endpoint Overrides (in .taskmasterconfig):**
      - `AZURE_OPENAI_ENDPOINT`: Required if using Azure OpenAI key.
      - `OLLAMA_BASE_URL`: Override the default Ollama API URL (Default: `http://localhost:11434/api`).

**Important:** Settings like model ID selections (`main`, `research`, `fallback`), `maxTokens`, `temperature`, `logLevel`, `defaultSubtasks`, `defaultPriority`, and `projectName` are **managed in `.taskmasterconfig`**, not environment variables.

## Example `.env` File (for API Keys and Custom Provider)

```
# Required API keys for providers configured in .taskmasterconfig
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
# OPENAI_API_KEY=sk-your-key-here
# GOOGLE_API_KEY=AIzaSy...
# etc.

# For Pollinations provider: NO API key is needed!

# For Custom provider (OpenAI-compatible endpoints)
CUSTOM_BASE=https://your-custom-endpoint.com/openai
CUSTOM_API_KEY=sk-your-custom-key

# Optional Endpoint Overrides
# AZURE_OPENAI_ENDPOINT=https://your-azure-endpoint.openai.azure.com/
# OLLAMA_BASE_URL=http://custom-ollama-host:11434/api
```

## Troubleshooting

### Configuration Errors

- If Task Master reports errors about missing configuration or cannot find `.taskmasterconfig`, run `task-master models --setup` in your project root to create or repair the file.
- Ensure API keys are correctly placed in your `.env` file (for CLI) or `.cursor/mcp.json` (for MCP) and are valid for the providers selected in `.taskmasterconfig`.
- For Pollinations, you do not need any API key at all!
- For Custom, you must set `CUSTOM_BASE` and `CUSTOM_API_KEY` in `.env` or override via `.taskmasterconfig`.

### If `task-master init` doesn't respond:

Try running it with Node directly:

```bash
node node_modules/claude-task-master/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/LousyBook94/pollinations-task-master.git
cd claude-task-master
node scripts/init.js
```

<div align="center">

# 🌟 **HUGE CREDITS to the OG Creator [@eyaltoledano](https://github.com/eyaltoledano) 🌟**

[![CI](https://github.com/eyaltoledano/claude-task-master/actions/workflows/ci.yml/badge.svg)](https://github.com/eyaltoledano/claude-task-master/actions/workflows/ci.yml) [![npm version](https://badge.fury.io/js/task-master-ai.svg)](https://badge.fury.io/js/task-master-ai) [![Discord](https://dcbadge.limes.pink/api/server/https://discord.gg/taskmasterai?style=flat)](https://discord.gg/taskmasterai) [![License: MIT with Commons Clause](https://img.shields.io/badge/license-MIT%20with%20Commons%20Clause-blue.svg)](LICENSE)

This project ("pollinations-taskmaster-ai") is a respectful fork, overhaul, and vivid remix of Eyal Toledano's legendary ["Task Master"](https://github.com/eyaltoledano/claude-task-master). Every part of the architecture, original documentation, deep LLM workflow, and smart agent CLI leadership comes from the OG.

> If you find this project useful, please ⭐ **star the original repo** as thanks to Eyal and show the LLM world some respect!
>
> [Original Task Master](https://github.com/eyaltoledano/claude-task-master) • [X (Twitter): @eyaltoledano](https://x.com/eyaltoledano)

---

# Pollinations TaskMaster AI [![GitHub stars](https://img.shields.io/github/stars/LousyBook94/pollinations-task-master?style=social)](https://github.com/LousyBook94/pollinations-task-master/stargazers)

[![CI](https://github.com/LousyBook94/pollinations-task-master/actions/workflows/ci.yml/badge.svg)](https://github.com/LousyBook94/pollinations-task-master/actions/workflows/ci.yml) [![npm version](https://badge.fury.io/js/pollinations-taskmaster.svg)](https://badge.fury.io/js/pollinations-taskmaster) [![Discord Follow](https://dcbadge.limes.pink/api/server/https://discord.gg/RNTh5tQP6b?style=flat)](https://discord.gg/RNTh5tQP6b) [![License: MIT with Commons Clause](https://img.shields.io/badge/license-MIT%20with%20Commons%20Clause-blue.svg)](LICENSE)

### By [@LousyBook94](https://github.com/LousyBook94) (maintenance/fork) • OG: [@eyaltoledano](https://github.com/eyaltoledano) • [@RalphEcom](https://github.com/RalphEcom)

[![Youtube Follow](https://img.shields.io/youtube/channel/subscribers/UCBNE8MNvq1XppUmpAs20m4w)](https://youtube.com/@LousyBook01)
[![Twitter Follow](https://img.shields.io/twitter/follow/eyaltoledano?style=flat)](https://x.com/eyaltoledano)
[![Twitter Follow](https://img.shields.io/twitter/follow/RalphEcom?style=flat)](https://x.com/RalphEcom)
A task management system for AI-driven development using Pollinations.ai, designed to work seamlessly with Cursor AI.

</div align="center">

## Requirements

- Internet connection (for Pollinations.ai API access)

## Quick Start

### Option 1 | MCP (Recommended):

MCP (Model Control Protocol) provides the easiest way to get started with Pollinations TaskMaster AI directly in your editor.

1. **Add the MCP config to your editor** (Cursor recommended, but it works with other text editors):

```json
{
	"mcpServers": {
		"taskmaster-ai": {
			"command": "npx",
			"args": ["-y", "--package=pollinations-taskmaster", "pollinations-taskmaster"],
			"env": {
				"ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_API_KEY_HERE",
				"PERPLEXITY_API_KEY": "YOUR_PERPLEXITY_API_KEY_HERE",
				"OPENAI_API_KEY": "YOUR_OPENAI_KEY_HERE",
				"GOOGLE_API_KEY": "YOUR_GOOGLE_KEY_HERE",
				"MISTRAL_API_KEY": "YOUR_MISTRAL_KEY_HERE",
				"OPENROUTER_API_KEY": "YOUR_OPENROUTER_KEY_HERE",
				"XAI_API_KEY": "YOUR_XAI_KEY_HERE",
				"AZURE_OPENAI_API_KEY": "YOUR_AZURE_KEY_HERE"
			}
		}
	}
}
```

2. **Enable the MCP** in your editor

3. **Prompt the AI** to initialize Pollinations TaskMaster AI:

```
Can you please initialize taskmaster-ai into my project?
```

4. **Use common commands** directly through your AI assistant:

```txt
Can you parse my PRD at scripts/prd.txt?
What's the next task I should work on?
Can you help me implement task 3?
Can you help me expand task 4?
```

### Option 2: Using Command Line

#### Installation

```bash
# Install globally
npm install -g pollinations-taskmaster

# OR install locally within your project
npm install pollinations-taskmaster
```

#### Initialize a new project

```bash
# If installed globally
task-master init

# If installed locally
npx task-master init
```

This will prompt you for project details and set up a new project with the necessary files and structure.

#### Common Commands

```bash
# Initialize a new project
task-master init

# Parse a PRD and generate tasks
task-master parse-prd your-prd.txt

# List all tasks
task-master list

# Show the next task to work on
task-master next

# Generate task files
task-master generate
```

## Documentation

For more detailed information, check out the documentation in the `docs` directory:

- [Configuration Guide](docs/configuration.md) — Environment variables & model selection (Pollinations requires NO API key; Custom lets you use any OpenAI-compatible endpoint via `CUSTOM_BASE`/`CUSTOM_API_KEY` in `.env` or `.taskmasterconfig`)
- [Tutorial](docs/tutorial.md) — Step-by-step guide to getting started with Pollinations TaskMaster AI, including using Pollinations and Custom providers
- [Command Reference](docs/command-reference.md) — Complete list of all available commands and provider/model selection
- [Task Structure](docs/task-structure.md) — Understanding the task format and features
- [Example Interactions](docs/examples.md) — Common Cursor AI interaction examples

## Provider Support & Configuration

### 🌱 Pollinations Provider (No API Key Needed)
- Use `provider: "pollinations"` in `.taskmasterconfig` for any role.
- Select from a wide range of free, open models (see `task-master models --setup` or `supported-models.json`).
- No API key or signup needed!

### 🛠️ Custom Provider (Bring Your Own OpenAI-Compatible Endpoint)
- Use `provider: "custom"` in `.taskmasterconfig` for any role.
- Set `CUSTOM_BASE` and `CUSTOM_API_KEY` in your `.env` file, or override with `baseUrl` and `apiKey` directly in `.taskmasterconfig`.
- Great for self-hosted, enterprise, or experimental endpoints.

**Example `.env`:**
```
CUSTOM_BASE=https://your-custom-endpoint.com/openai
CUSTOM_API_KEY=sk-your-custom-key
```

**Example `.taskmasterconfig`:**
```json
"models": {
  "main": {
    "provider": "pollinations",
    "modelId": "openai" // or any available model
  },
  "research": {
    "provider": "pollinations",
    "modelId": "searchgpt"
  },
  "custom": {
    "provider": "custom",
    "modelId": "gpt-4o",
    "baseUrl": "https://your-custom-endpoint.com/openai", // optional override
    "apiKey": "sk-your-custom-key" // optional override
  }
}
```

## Troubleshooting

### If `task-master init` doesn't respond:

Try running it with Node directly:

```bash
node node_modules/pollinations-task-master/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/LousyBook94/pollinations-task-master.git
cd pollinations-task-master
node scripts/init.js
```

## Contributors

<a href="https://github.com/LousyBook94/pollinations-task-master/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LousyBook94/pollinations-task-master" alt="Pollinations TaskMaster AI project contributors" />
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LousyBook94/pollinations-task-master&type=Timeline)](https://www.star-history.com/#LousyBook94/pollinations-task-master&Timeline)

## Licensing

Pollinations TaskMaster AI is licensed under the MIT License with Commons Clause.
AI Backed by [Pollinations.ai](https://pollinations.ai) 🌱 – 100% free, open LLM/GenAI APIs.
No private keys, no Anthropic or OpenAI lock-in, just hassle-free LLM automation!

**You can now use the Pollinations provider for free, or bring your own API with the Custom provider!**

See the [LICENSE](LICENSE) file for the complete license text and [licensing details](docs/licensing.md) for more information.

# Package Manager & Tech Stack Rules

- **Preferred Package Manager: Bun + bunx**
  - All JS/TS tasks and Node projects in this repo use [Bun](https://bun.sh/) (`bun` & `bunx`) for all scripting, module execution, and dev workflows.
  - Use `bun install` for dependency installation (never `npm i` or `yarn`).
  - Use `bunx` for running CLIs/tools (never `npx`).

- **Module Runner: FastMCP**
  - Task Master MCP tooling is built with [FastMCP](https://github.com/modelcontextprotocol/fastmcp).
  - When creating MCP servers, always use FastMCP as the base.
  - All server scripts are started via `bunx fastmcp ...` (or `bunx mcp-inspector` for inspection tools).

- **AI & Generation: Pollinations.AI**
  - All AI (task generation, expansion, complexity analysis) uses [Pollinations.AI](https://pollinations.ai/) at `https://text.pollinations.ai/openai`, with:
    - **Default model**: `deepseek`
    - Configuration: See `POLLINATIONS_API_URL`, `POLLINATIONS_MODEL`, etc. in `.env` and README.
  - No code in the main repo should reference Anthropic/Claude/Perplexity/OpenAI SDK keys or dependencies.

- **Scripts & Automation**
  - All CLI scripts for tooling, init, dev, etc., use Bun shebang (`#!/usr/bin/env bun`).
  - When in doubt, prefer Bun over Node.

- **General Guidelines**
  - Document any new dependencies in the relevant `bun.lockb` and `package.json`.
  - For devops/dev tooling in CI, always prefer fast, cross-platform solutions that work with Bun.
  - If a dependency is not Bun-compatible, document required workaround or migration.

- **Deployment**
  - All deployment/build scripts should assume Bun as the runtime.
  - Any future MCP extension servers or automations are to be written for Bun + FastMCP.
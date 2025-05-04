# Task Master CLI Architecture (Shortened)

Task Master CLI uses a modular structure for separation of concerns, maintainability, and testability.

## Main Modules

- **commands.js:** Registers CLI commands (Commander.js), delegates to core modules, handles validation.
- **task-manager.js:** Manages task data (CRUD, status, PRD parsing, expansion, complexity analysis).
- **dependency-manager.js:** Manages dependencies, validation, fixes, cycle prevention.
- **ui.js:** Handles all CLI/user output, formatting, colored output, spinners, tables, suggestions.
- **ai-services.js:** (Conceptual) Handles AI calls for PRD parsing, subtask expansion, complexity analysis.
- **utils.js:** Provides config, logging, file IO, utilities, silent mode control.
- **mcp-server/**: Bridges CLI logic to external clients (e.g. Roo) via FastMCP. Implements silent mode and cache as needed.
- **init.js:** Sets up new Task Master projects.

## Execution/Data Flow

- CLI commands → core modules (`task-manager.js`, `dependency-manager.js`, `init.js`) → UI for output
- MCP server exposes core functions as tools/direct functions

## Conventions

- Kebab-case filenames, camelCase direct functions, snake_case MCP tool names
- Direct functions wrap core logic with silent mode and logging wrappers
- Standardized error handling and file path composition

## Testing

- Modules support unit, integration, E2E tests via dependency injection & logical separation
- Mocking and test structure follow clear division per component
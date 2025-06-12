---
description: Guidelines for implementing utility functions
globs: scripts/modules/utils.js, mcp-server/src/**/*
alwaysApply: false
---

# Utility Function Guidelines

## General Principles

- **Function Scope**:
  - ✅ DO: Create utility functions that serve multiple modules
  - ✅ DO: Keep functions single-purpose and focused
  - ❌ DON'T: Include business logic in utility functions
  - ❌ DON'T: Create utilities with side effects

  ```javascript
  // ✅ DO: Create focused, reusable utilities
  /**
   * Truncates text to a specified length
   * @param {string} text - The text to truncate
   * @param {number} maxLength - The maximum length
   * @returns {string} The truncated text
   */
  function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + '...';
  }
  ```

  ```javascript
  // ❌ DON'T: Add side effects to utilities
  function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    // Side effect - modifying global state or logging
    console.log(`Truncating text from ${text.length} to ${maxLength} chars`);
    
    return text.slice(0, maxLength - 3) + '...';
  }
  ```

- **Location**:
    - **Core CLI Utilities**: Place utilities used primarily by the core `task-master` CLI logic and command modules (`scripts/modules/*`) into [`scripts/modules/utils.js`](:scripts/modules/utils.js).
    - **MCP Server Utilities**: Place utilities specifically designed to support the MCP server implementation into the appropriate subdirectories within `mcp-server/src/`.
        - Path/Core Logic Helpers: [`mcp-server/src/core/utils/`](:mcp-server/src/core/utils/) (e.g., `path-utils.js`).
        - Tool Execution/Response Helpers: [`mcp-server/src/tools/utils.js`](:mcp-server/src/tools/utils.js).

## Documentation Standards

- **JSDoc Format**:
  - ✅ DO: Document all parameters and return values
  - ✅ DO: Include descriptions for complex logic
  - ✅ DO: Add examples for non-obvious usage
  - ❌ DON'T: Skip documentation for "simple" functions

  ```javascript
  // ✅ DO: Provide complete JSDoc documentation
  /**
   * Reads and parses a JSON file
   * @param {string} filepath - Path to the JSON file
   * @returns {Object|null} Parsed JSON data or null if error occurs
   */
  function readJSON(filepath) {
    try {
      const rawData = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      log('error', `Error reading JSON file ${filepath}:`, error.message);
      if (CONFIG.debug) {
        console.error(error);
      }
      return null;
    }
  }
  ```

## Configuration Management (in `scripts/modules/utils.js`)

- **Environment Variables**:
  - ✅ DO: Provide default values for all configuration
  - ✅ DO: Use environment variables for customization
  - ✅ DO: Document available configuration options
  - ❌ DON'T: Hardcode values that should be configurable

  ```javascript
  // ✅ DO: Set up configuration with defaults and environment overrides
  const CONFIG = {
    model: process.env.MODEL || 'claude-3-opus-20240229', // Updated default model
    maxTokens: parseInt(process.env.MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
    debug: process.env.DEBUG === "true",
    logLevel: process.env.LOG_LEVEL || "info",
    defaultSubtasks: parseInt(process.env.DEFAULT_SUBTASKS || "3"),
    defaultPriority: process.env.DEFAULT_PRIORITY || "medium",
    projectName: process.env.PROJECT_NAME || "Task Master Project", // Generic project name
    projectVersion: "1.5.0" // Version should be updated via release process
  };
  ```

## Logging Utilities (in `scripts/modules/utils.js`)

- **Log Levels**:
  - ✅ DO: Support multiple log levels (debug, info, warn, error)
  - ✅ DO: Use appropriate icons for different log levels
  - ✅ DO: Respect the configured log level
  - ❌ DON'T: Add direct console.log calls outside the logging utility
  - **Note on Passed Loggers**: When a logger object (like the FastMCP `log` object) is passed *as a parameter* (e.g., as `mcpLog`) into core Task Master functions, the receiving function often expects specific methods (`.info`, `.warn`, `.error`, etc.) to be directly callable on that object (e.g., `mcpLog[level](...)`). If the passed logger doesn't have this exact structure, a wrapper object may be needed. See the **Handling Logging Context (`mcpLog`)** section in [`mcp.md`](:.roo/rules/mcp.md) for the standard pattern used in direct functions.

- **Logger Wrapper Pattern**: 
  - ✅ DO: Use the logger wrapper pattern when passing loggers to prevent `mcpLog[level] is not a function` errors:
  ```javascript
  // Standard logWrapper pattern to wrap FastMCP's log object
  const logWrapper = {
    info: (message, ...args) => log.info(message, ...args),
    warn: (message, ...args) => log.warn(message, ...args),
    error: (message, ...args) => log.error(message, ...args),
    debug: (message, ...args) => log.debug && log.debug(message, ...args),
    success: (message, ...args) => log.info(message, ...args) // Map success to info
  };
  
  // Pass this wrapper as mcpLog to ensure consistent method availability
  // This also ensures output format is set to 'json' in many core functions
  const options = { mcpLog: logWrapper, session };
  ```
  - ✅ DO: Implement this pattern in any direct function that calls core functions expecting `mcpLog`
  - ✅ DO: Use this solution in conjunction with silent mode for complete output control
  - ❌ DON'T: Pass the FastMCP `log` object directly as `mcpLog` to core functions
  - **Important**: This pattern has successfully fixed multiple issues in MCP tools (e.g., `update-task`, `update-subtask`) where using or omitting `mcpLog` incorrectly led to runtime errors or JSON parsing failures.
  - For complete implementation details, see the **Handling Logging Context (`mcpLog`)** section in [`mcp.md`](:.roo/rules/mcp.md).

  ```javascript
  // ✅ DO: Implement a proper logging utility
  const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  function log(level, ...args) {
    const icons = {
      debug: chalk.gray('🔍'),
      info: chalk.blue('ℹ️'),
      warn: chalk.yellow('⚠️'),
      error: chalk.red('❌'),
      success: chalk.green('✅')
    };
    
    if (LOG_LEVELS[level] >= LOG_LEVELS[CONFIG.logLevel]) {
      const icon = icons[level] || '';
      console.log(`${icon} ${args.join(' ')}`);
    }
  }
  ```

## Silent Mode Utilities (in `scripts/modules/utils.js`)

- **Silent Mode Control**:
  - ✅ DO: Use the exported silent mode functions rather than accessing global variables
  - ✅ DO: Always use `isSilentMode()` to check the current silent mode state
  - ✅ DO: Ensure silent mode is disabled in a `finally` block to prevent it from staying enabled
  - ❌ DON'T: Access the global `silentMode` variable directly
  - ❌ DON'T: Forget to disable silent mode after enabling it

  ```javascript
  // ✅ DO: Use the silent mode control functions properly
  
  // Example of proper implementation in utils.js:
  
  // Global silent mode flag (private to the module)
  let silentMode = false;
  
  // Enable silent mode
  function enableSilentMode() {
    silentMode = true;
  }
  
  // Disable silent mode
  function disableSilentMode() {
    silentMode = false;
  }
  
  // Check if silent mode is enabled
  function isSilentMode() {
    return silentMode;
  }
  
  // Example of proper usage in another module:
  import { enableSilentMode, disableSilentMode, isSilentMode } from './utils.js';
  
  // Check current status
  if (!isSilentMode()) {
    console.log('Silent mode is not enabled');
  }
  
  // Use try/finally pattern to ensure silent mode is disabled
  try {
    enableSilentMode();
    // Do something that should suppress console output
    performOperation();
  } finally {
    disableSilentMode();
  }
  ```

- **Integration with Logging**:
  - ✅ DO: Make the `log` function respect silent mode
  ```javascript
  function log(level, ...args) {
    // Skip logging if silent mode is enabled
    if (isSilentMode()) {
      return;
    }
    
    // Rest of logging logic...
  }
  ```

- **Common Patterns for Silent Mode**:
  - ✅ DO: In **direct functions** (`mcp-server/src/core/direct-functions/*`) that call **core functions** (`scripts/modules/*`), ensure console output from the core function is suppressed to avoid breaking MCP JSON responses.
    - **Preferred Method**: Update the core function to accept an `outputFormat` parameter (e.g., `outputFormat = 'text'`) and make it check `outputFormat === 'text'` before displaying any UI elements (banners, spinners, boxes, direct `console.log`s). Pass `'json'` from the direct function.
    - **Necessary Fallback/Guarantee**: If the core function *cannot* be modified or its output suppression via `outputFormat` is unreliable, **wrap the core function call within the direct function** using `enableSilentMode()` and `disableSilentMode()` in a `try/finally` block. This acts as a safety net.
  ```javascript
  // Example in a direct function
  export async function someOperationDirect(args, log) {
    let result;
    const tasksPath = findTasksJsonPath(args, log); // Get path first
    
    // Option 1: Core function handles 'json' format (Preferred)
    try {
      result = await coreFunction(tasksPath, ...otherArgs, 'json'); // Pass 'json'
      return { success: true, data: result, fromCache: false };
    } catch (error) {
      // Handle error...
    }

    // Option 2: Core function output unreliable (Fallback/Guarantee)
    try {
      enableSilentMode(); // Enable before call
      result = await coreFunction(tasksPath, ...otherArgs); // Call without format param
    } catch (error) {
      // Handle error...
      log.error(`Failed: ${error.message}`);
      return { success: false, error: { /* ... */ } };
    } finally {
      disableSilentMode(); // ALWAYS disable in finally
    }
    return { success: true, data: result, fromCache: false }; // Assuming success if no error caught
  }
  ```
  - ✅ DO: For functions that accept a silent mode parameter but also need to check global state (less common):
  ```javascript
  // Check both the passed parameter and global silent mode
  const isSilent = options.silentMode || (typeof options.silentMode === 'undefined' && isSilentMode());
  ```

## File Operations (in `scripts/modules/utils.js`)

- **Error Handling**:
  - ✅ DO: Use try/catch blocks for all file operations
  - ✅ DO: Return null or a default value on failure
  - ✅ DO: Log detailed error information using the `log` utility
  - ❌ DON'T: Allow exceptions to propagate unhandled from simple file reads/writes

  ```javascript
  // ✅ DO: Handle file operation errors properly in core utils
  function writeJSON(filepath, data) {
    try {
      // Ensure directory exists (example)
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    } catch (error) {
      log('error', `Error writing JSON file ${filepath}:`, error.message);
      if (CONFIG.debug) {
        console.error(error);
      }
    }
  }
  ```

## Task-Specific Utilities (in `scripts/modules/utils.js`)

- **Task ID Formatting**:
  - ✅ DO: Create utilities for consistent ID handling
  - ✅ DO: Support different ID formats (numeric, string, dot notation)
  - ❌ DON'T: Duplicate formatting logic across modules

  ```javascript
  // ✅ DO: Create utilities for common operations
  /**
   * Formats a task ID as a string
   * @param {string|number} id - The task ID to format
   * @returns {string} The formatted task ID
   */
  function formatTaskId(id) {
    if (typeof id === 'string' && id.includes('.')) {
      return id; // Already formatted as a string with a dot (e.g., "1.2")
    }
    
    if (typeof id === 'number') {
      return id.toString();
    }
    
    return id;
  }
  ```

- **Task Search**:
  - ✅ DO: Implement reusable task finding utilities
  - ✅ DO: Support both task and subtask lookups
  - ✅ DO: Add context to subtask results

  ```javascript
  // ✅ DO: Create comprehensive search utilities
  /**
   * Finds a task by ID in the tasks array
   * @param {Array} tasks - The tasks array
   * @param {string|number} taskId - The task ID to find
   * @returns {Object|null} The task object or null if not found
   */
  function findTaskById(tasks, taskId) {
    if (!taskId || !tasks || !Array.isArray(tasks)) {
      return null;
    }
    
    // Check if it's a subtask ID (e.g., "1.2")
    if (typeof taskId === 'string' && taskId.includes('.')) {
      const [parentId, subtaskId] = taskId.split('.').map(id => parseInt(id, 10));
      const parentTask = tasks.find(t => t.id === parentId);
      
      if (!parentTask || !parentTask.subtasks) {
        return null;
      }
      
      const subtask = parentTask.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        // Add reference to parent task for context
        subtask.parentTask = { 
          id: parentTask.id, 
          title: parentTask.title,
          status: parentTask.status
        };
        subtask.isSubtask = true;
      }
      
      return subtask || null;
    }
    
    const id = parseInt(taskId, 10);
    return tasks.find(t => t.id === id) || null;
  }
  ```

## Cycle Detection (in `scripts/modules/utils.js`)

- **Graph Algorithms**:
  - ✅ DO: Implement cycle detection using graph traversal
  - ✅ DO: Track visited nodes and recursion stack
  - ✅ DO: Return specific information about cycles

  ```javascript
  // ✅ DO: Implement proper cycle detection
  /**
   * Find cycles in a dependency graph using DFS
   * @param {string} subtaskId - Current subtask ID
   * @param {Map} dependencyMap - Map of subtask IDs to their dependencies
   * @param {Set} visited - Set of visited nodes
   * @param {Set} recursionStack - Set of nodes in current recursion stack
   * @returns {Array} - List of dependency edges that need to be removed to break cycles
   */
  function findCycles(subtaskId, dependencyMap, visited = new Set(), recursionStack = new Set(), path = []) {
    // Mark the current node as visited and part of recursion stack
    visited.add(subtaskId);
    recursionStack.add(subtaskId);
    path.push(subtaskId);
    
    const cyclesToBreak = [];
    
    // Get all dependencies of the current subtask
    const dependencies = dependencyMap.get(subtaskId) || [];
    
    // For each dependency
    for (const depId of dependencies) {
      // If not visited, recursively check for cycles
      if (!visited.has(depId)) {
        const cycles = findCycles(depId, dependencyMap, visited, recursionStack, [...path]);
        cyclesToBreak.push(...cycles);
      } 
      // If the dependency is in the recursion stack, we found a cycle
      else if (recursionStack.has(depId)) {
        // The last edge in the cycle is what we want to remove
        cyclesToBreak.push(depId);
      }
    }
    
    // Remove the node from recursion stack before returning
    recursionStack.delete(subtaskId);
    
    return cyclesToBreak;
  }
  ```

## MCP Server Core Utilities (`mcp-server/src/core/utils/`)

### Project Root and Task File Path Detection (`path-utils.js`)

- **Purpose**: This module ([`mcp-server/src/core/utils/path-utils.js`](:mcp-server/src/core/utils/path-utils.js)) provides the mechanism for locating the user's `tasks.json` file, used by direct functions.
- **`findTasksJsonPath(args, log)`**:
    - ✅ **DO**: Call this function from within **direct function wrappers** (e.g., `listTasksDirect` in `mcp-server/src/core/direct-functions/`) to get the absolute path to the relevant `tasks.json`.
    - Pass the *entire `args` object* received by the MCP tool (which should include `projectRoot` derived from the session) and the `log` object.
    - Implements a **simplified precedence system** for finding the `tasks.json` path:
        1.  Explicit `projectRoot` passed in `args` (Expected from MCP tools).
        2.  Cached `lastFoundProjectRoot` (CLI fallback).
        3.  Search upwards from `process.cwd()` (CLI fallback).
    - Throws a specific error if the `tasks.json` file cannot be located.
    - Updates the `lastFoundProjectRoot` cache on success.
- **`PROJECT_MARKERS`**: An exported array of common file/directory names used to identify a likely project root during the CLI fallback search.
- **`getPackagePath()`**: Utility to find the installation path of the `task-master-ai` package itself (potentially removable).

## MCP Server Tool Utilities (`mcp-server/src/tools/utils.js`)

- **Purpose**: These utilities specifically support the MCP server tools ([`mcp-server/src/tools/*.js`](:mcp-server/src/tools/*.js)), handling MCP communication patterns, response formatting, caching integration, and the CLI fallback mechanism.
- **Refer to [`mcp.md`](:.roo/rules/mcp.md)** for detailed usage patterns within the MCP tool `execute` methods and direct function wrappers.

- **`getProjectRootFromSession(session, log)`**: 
    - ✅ **DO**: Call this utility **within the MCP tool's `execute` method** to extract the project root path from the `session` object.
    - Decodes the `file://` URI and handles potential errors.
    - Returns the project path string or `null`.
    - The returned path should then be passed in the `args` object when calling the corresponding `*Direct` function (e.g., `yourDirectFunction({ ...args, projectRoot: rootFolder }, log)`).

- **`handleApiResult(result, log, errorPrefix, processFunction)`**:
    - ✅ **DO**: Call this from the MCP tool's `execute` method after receiving the result from the `*Direct` function wrapper.
    - Takes the standard `{ success, data/error, fromCache }` object.
    - Formats the standard MCP success or error response, including the `fromCache` flag.
    - Uses `processMCPResponseData` by default to filter response data.

- **`executeTaskMasterCommand(command, log, args, projectRootRaw)`**:
    - Executes a Task Master CLI command as a child process.
    - Handles fallback between global `task-master` and local `node scripts/dev.js`.
    - ❌ **DON'T**: Use this as the primary method for MCP tools. Prefer direct function calls via `*Direct` wrappers.

- **`processMCPResponseData(taskOrData, fieldsToRemove)`**:
    - Filters task data (e.g., removing `details`, `testStrategy`) before sending to the MCP client. Called by `handleApiResult`.

- **`createContentResponse(content)` / `createErrorResponse(errorMessage)`**:
    - Formatters for standard MCP success/error responses.

- **`getCachedOrExecute({ cacheKey, actionFn, log })`**:
    - ✅ **DO**: Use this utility *inside direct function wrappers* to implement caching.
    - Checks cache, executes `actionFn` on miss, stores result.
    - Returns standard `{ success, data/error, fromCache: boolean }`.

## Export Organization

- **Grouping Related Functions**:
  - ✅ DO: Keep utilities relevant to their location (e.g., core CLI utils in `scripts/modules/utils.js`, MCP path utils in `mcp-server/src/core/utils/path-utils.js`, MCP tool utils in `mcp-server/src/tools/utils.js`).
  - ✅ DO: Export all utility functions in a single statement per file.
  - ✅ DO: Group related exports together.
  - ✅ DO: Export configuration constants (from `scripts/modules/utils.js`).
  - ❌ DON'T: Use default exports.
  - ❌ DON'T: Create circular dependencies (See [`architecture.md`](:.roo/rules/architecture.md)).

```javascript
// Example export from scripts/modules/utils.js
export {
  // Configuration
  CONFIG,
  LOG_LEVELS,
  
  // Logging
  log,
  
  // File operations
  readJSON,
  writeJSON,
  
  // String manipulation
  sanitizePrompt,
  truncate,
  
  // Task utilities
  // ... (taskExists, formatTaskId, findTaskById, etc.)
  
  // Graph algorithms
  findCycles,
};

// Example export from mcp-server/src/core/utils/path-utils.js
export {
  findTasksJsonPath,
  getPackagePath,
  PROJECT_MARKERS,
  lastFoundProjectRoot // Exporting for potential direct use/reset if needed
};

// Example export from mcp-server/src/tools/utils.js
export {
  getProjectRoot,
  getProjectRootFromSession,
  handleApiResult,
  executeTaskMasterCommand,
  processMCPResponseData,
  createContentResponse,
  createErrorResponse,
  getCachedOrExecute
};
```

Refer to [`mcp.md`](:.roo/rules/mcp.md) and [`architecture.md`](:.roo/rules/architecture.md) for more context on MCP server architecture and integration. 
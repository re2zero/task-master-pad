# Command-Line Interface Implementation Guidelines

**General CLI Rules:**
- Keep action handlers concise; core logic lives in modules, not in CLI wiring.
- Validate required parameters before running.
- Descriptions and option names: use kebab-case (`--file`, `--output`, etc).
- Use confirmation by default on destructive commands; `--yes` skips for scripts.
- Clean up dependencies and references after destructive commands.
- Regenerate files after removal unless `--skip-generate` is set.
- Prefer non-destructive alternatives, e.g., status changes for cancel/defer.
- Use path.join, standard naming for task files.

**Testing and Error Handling:**
- Handle errors with clear feedback and color.
- Use boxen for key messages and next-step hints.
- Group related commands together.

**Command Patterns:**
```js
program
  .command('example')
  .description('...')
  .option('--flag', '...')
  .action(async (opts) => { /* Call implementation */ });
```
- Removal commands: always prompt unless `--yes` specified.
- Edit/removal always cleans up references and regenerates files if not skipped.

**Subtask Patterns:**
- Add subtask requires parent (`--parent <id>`) and title/description if not converting.
- Remove subtask: can convert to parent, or delete (clean up, regenerate).

**Flags:**
- Use positive enable/skip styles: `--skip-generate`
- Do not use negated flags like `--no-generate`

**Version Checking:**
- Asynchronously check version and notify for upgrades after execution.

**Input Checks:**
- Validate all required params early; exit nonzero on fatal missing input.

**Error Display:**
- Use colors: info (blue), error (red), warnings (yellow)
- Show available options and help when unknown or missing options used.

**Import patterns:**
- Only import what's needed, group by module.
- Never create circular dependencies.

**See also:** add-subtask, remove-subtask, and version check examples for complete patterns.

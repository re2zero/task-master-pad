import fs from 'fs';
import path from 'path';

const stateFilePath = (projectRoot) => path.join(projectRoot, '.taskmaster', 'riper5-state.json');

/**
 * Loads the current RIPER-5 state from the project's .taskmaster directory.
 * @param {string} projectRoot - The root directory of the project.
 * @returns {object} The current state or a default state object if not found.
 */
export function loadState(projectRoot) {
  const filePath = stateFilePath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return {
      currentTaskId: null,
      activeMode: null,
      history: {}
    };
  }
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading or parsing RIPER-5 state file:', error);
    // Return default state on error to prevent crashing
    return {
      currentTaskId: null,
      activeMode: null,
      history: {}
    };
  }
}

/**
 * Saves the given state to the RIPER-5 state file.
 * @param {string} projectRoot - The root directory of the project.
 * @param {object} state - The state object to save.
 */
export function saveState(projectRoot, state) {
  const filePath = stateFilePath(projectRoot);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving RIPER-5 state file:', error);
    throw error; // Re-throw to indicate failure
  }
} 
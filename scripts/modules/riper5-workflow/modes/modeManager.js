import { loadState, saveState } from './modeState.js';

export const MODES = {
  RESEARCH: 'research',
  IMPLEMENTATION: 'implementation',
  POLISH: 'polish',
  EXECUTION: 'execution',
  REVIEW: 'review'
};

/**
 * Initializes the RIPER-5 workflow for a specific task.
 * @param {string} projectRoot - The root directory of the project.
 * @param {string} taskId - The ID of the task to initialize.
 * @returns {object} The new state.
 */
export function initializeWorkflow(projectRoot, taskId) {
  const state = loadState(projectRoot);
  
  if (state.history[taskId]) {
    throw new Error(`Workflow for task ${taskId} is already initialized.`);
  }

  state.currentTaskId = taskId;
  state.activeMode = MODES.RESEARCH; // Start with research mode
  state.history[taskId] = [{
    mode: MODES.RESEARCH,
    timestamp: new Date().toISOString(),
    comment: 'Workflow initialized.'
  }];
  
  saveState(projectRoot, state);
  return state;
}

/**
 * Switches the active mode for the current task.
 * @param {string} projectRoot - The root directory of the project.
 * @param {string} taskId - The ID of the task.
 * @param {string} newMode - The new mode to switch to.
 * @returns {object} The updated state.
 */
export function switchMode(projectRoot, taskId, newMode) {
  if (!Object.values(MODES).includes(newMode)) {
    throw new Error(`Invalid mode: ${newMode}`);
  }

  const state = loadState(projectRoot);

  if (state.currentTaskId !== taskId || !state.history[taskId]) {
    throw new Error(`Workflow for task ${taskId} is not active or initialized.`);
  }

  state.activeMode = newMode;
  state.history[taskId].push({
    mode: newMode,
    timestamp: new Date().toISOString(),
    comment: `Switched to ${newMode} mode.`
  });

  saveState(projectRoot, state);
  return state;
}

/**
 * Gets the current status of the RIPER-5 workflow.
 * @param {string} projectRoot - The root directory of the project.
 * @returns {object} The current status.
 */
export function getStatus(projectRoot) {
  return loadState(projectRoot);
} 
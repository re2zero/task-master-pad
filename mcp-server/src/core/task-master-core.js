/**
 * task-master-core.js
 * Central module that imports and re-exports all direct function implementations
 * for improved organization and maintainability.
 */

// Import direct function implementations
import { listTasksDirect } from './direct-functions/list-tasks.js';
import { getCacheStatsDirect } from './direct-functions/cache-stats.js';
import { parsePRDDirect } from './direct-functions/parse-prd.js';
import { updateTasksDirect } from './direct-functions/update-tasks.js';
import { updateTaskByIdDirect } from './direct-functions/update-task-by-id.js';
import { updateSubtaskByIdDirect } from './direct-functions/update-subtask-by-id.js';
import { generateTaskFilesDirect } from './direct-functions/generate-task-files.js';
import { setTaskStatusDirect } from './direct-functions/set-task-status.js';
import { showTaskDirect } from './direct-functions/show-task.js';
import { nextTaskDirect } from './direct-functions/next-task.js';
import { expandTaskDirect } from './direct-functions/expand-task.js';
import { expandAllTasksDirect } from './direct-functions/expand-all-tasks.js';
import { clearSubtasksDirect } from './direct-functions/clear-subtasks.js';
import { addTaskDirect } from './direct-functions/add-task.js';
import { addSubtaskDirect } from './direct-functions/add-subtask.js';
import { removeSubtaskDirect } from './direct-functions/remove-subtask.js';
import { analyzeTaskComplexityDirect } from './direct-functions/analyze-task-complexity.js';
import { complexityReportDirect } from './direct-functions/complexity-report.js';
import { addDependencyDirect } from './direct-functions/add-dependency.js';
import { removeDependencyDirect } from './direct-functions/remove-dependency.js';
import { validateDependenciesDirect } from './direct-functions/validate-dependencies.js';
import { fixDependenciesDirect } from './direct-functions/fix-dependencies.js';
import { removeTaskDirect } from './direct-functions/remove-task.js';
import { initializeProjectDirect } from './direct-functions/initialize-project.js';
import { modelsDirect } from './direct-functions/models.js';
import { moveTaskDirect } from './direct-functions/move-task.js';

// Import RIPER-5 workflow direct functions
import { 
	initializeRiper5Direct,
	switchModeDirect,
	getStatusDirect,
	getModeProgressDirect,
	getAllModeProgressDirect,
	getNextRecommendedModeDirect,
	getModeHistoryDirect,
	exportModeHistoryReportDirect,
	addHistoryCommentDirect,
	generateTaskFileDirect,
	exportTaskReportDirect
} from './direct-functions/riper5-workflow.js';

// Re-export utility functions
export { findTasksPath } from './utils/path-utils.js';

// Use Map for potential future enhancements like introspection or dynamic dispatch
export const directFunctions = new Map([
	['listTasksDirect', listTasksDirect],
	['getCacheStatsDirect', getCacheStatsDirect],
	['parsePRDDirect', parsePRDDirect],
	['updateTasksDirect', updateTasksDirect],
	['updateTaskByIdDirect', updateTaskByIdDirect],
	['updateSubtaskByIdDirect', updateSubtaskByIdDirect],
	['generateTaskFilesDirect', generateTaskFilesDirect],
	['setTaskStatusDirect', setTaskStatusDirect],
	['showTaskDirect', showTaskDirect],
	['nextTaskDirect', nextTaskDirect],
	['expandTaskDirect', expandTaskDirect],
	['expandAllTasksDirect', expandAllTasksDirect],
	['clearSubtasksDirect', clearSubtasksDirect],
	['addTaskDirect', addTaskDirect],
	['addSubtaskDirect', addSubtaskDirect],
	['removeSubtaskDirect', removeSubtaskDirect],
	['analyzeTaskComplexityDirect', analyzeTaskComplexityDirect],
	['complexityReportDirect', complexityReportDirect],
	['addDependencyDirect', addDependencyDirect],
	['removeDependencyDirect', removeDependencyDirect],
	['validateDependenciesDirect', validateDependenciesDirect],
	['fixDependenciesDirect', fixDependenciesDirect],
	['removeTaskDirect', removeTaskDirect],
	['initializeProjectDirect', initializeProjectDirect],
	['modelsDirect', modelsDirect],
	['moveTaskDirect', moveTaskDirect],
	
	// RIPER-5 workflow direct functions
	['initializeRiper5', initializeRiper5Direct],
	['switchMode', switchModeDirect],
	['getStatus', getStatusDirect],
	['getModeProgress', getModeProgressDirect],
	['getAllModeProgress', getAllModeProgressDirect],
	['getNextRecommendedMode', getNextRecommendedModeDirect],
	['getModeHistory', getModeHistoryDirect],
	['exportModeHistoryReport', exportModeHistoryReportDirect],
	['addHistoryComment', addHistoryCommentDirect],
	['generateTaskFile', generateTaskFileDirect],
	['exportTaskReport', exportTaskReportDirect]
]);

// Re-export all direct function implementations
export {
	listTasksDirect,
	getCacheStatsDirect,
	parsePRDDirect,
	updateTasksDirect,
	updateTaskByIdDirect,
	updateSubtaskByIdDirect,
	generateTaskFilesDirect,
	setTaskStatusDirect,
	showTaskDirect,
	nextTaskDirect,
	expandTaskDirect,
	expandAllTasksDirect,
	clearSubtasksDirect,
	addTaskDirect,
	addSubtaskDirect,
	removeSubtaskDirect,
	analyzeTaskComplexityDirect,
	complexityReportDirect,
	addDependencyDirect,
	removeDependencyDirect,
	validateDependenciesDirect,
	fixDependenciesDirect,
	removeTaskDirect,
	initializeProjectDirect,
	modelsDirect,
	moveTaskDirect,
	initializeRiper5Direct,
	switchModeDirect,
	getStatusDirect,
	getModeProgressDirect,
	getAllModeProgressDirect,
	getNextRecommendedModeDirect,
	getModeHistoryDirect,
	exportModeHistoryReportDirect,
	addHistoryCommentDirect,
	generateTaskFileDirect,
	exportTaskReportDirect
};

/**
 * RIPER-5工作流模式管理直接函数
 */

import * as riper5 from '../../../../scripts/modules/riper5-workflow/index.js';
import { findProjectRoot } from '../../../../scripts/modules/utils.js';

/**
 * 初始化RIPER-5工作流
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 初始化结果
 */
export async function initializeRiper5Direct(args, log, context = {}) {
  try {
    const projectRoot = args.projectRoot || findProjectRoot();
    if (!args.taskId) {
      return { success: false, error: { code: 'MISSING_PARAM', message: 'taskId is required.' } };
    }
    const result = await riper5.stateManager.createState(args.taskId, {}, projectRoot);
    if (result.success) {
      // 初始化后切换到 research 模式
      const switchResult = await riper5.modeManager.switchMode('research', { taskId: args.taskId, note: 'Workflow initialized.'});
      if (switchResult.success) {
        return { success: true, data: switchResult.state };
      }
      return { success: false, error: { code: 'INITIALIZATION_ERROR', message: switchResult.message } };
    }
    return { success: false, error: { code: 'INITIALIZATION_ERROR', message: result.message } };
  } catch (error) {
    log.error(`Error initializing RIPER-5 workflow: ${error.message}`);
    return { success: false, error: { code: 'INITIALIZATION_ERROR', message: error.message } };
  }
}

/**
 * 切换RIPER-5模式
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 切换结果
 */
export async function switchModeDirect(args, log, context = {}) {
  try {
    const projectRoot = args.projectRoot || findProjectRoot();
    if (!args.taskId || !args.mode) {
      return { success: false, error: { code: 'MISSING_PARAM', message: 'taskId and mode are required.' } };
    }
    const result = await riper5.modeManager.switchMode(args.mode, { 
      taskId: args.taskId, 
      note: `Switched to ${args.mode} mode.`,
      projectRoot: projectRoot
    });
    if (result.success) {
      return { success: true, data: result.state };
    }
    return { success: false, error: { code: 'SWITCH_MODE_ERROR', message: result.message } };
  } catch (error) {
    log.error(`Error switching RIPER-5 mode: ${error.message}`);
    return { success: false, error: { code: 'SWITCH_MODE_ERROR', message: error.message } };
  }
}

/**
 * 获取任务状态
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 状态结果
 */
export async function getStatusDirect(args, log, context = {}) {
  try {
    const projectRoot = args.projectRoot || findProjectRoot();
    if (!args.taskId) {
      return await riper5.stateManager.getAllTasksState(projectRoot);
    }
    return await riper5.stateManager.getState(args.taskId, projectRoot);
  } catch (error) {
    log.error(`Error getting RIPER-5 status: ${error.message}`);
    return { success: false, error: { code: 'GET_STATUS_ERROR', message: error.message } };
  }
}

/**
 * 获取模式进度
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 进度结果
 */
export async function getModeProgressDirect(args, log, context = {}) {
  try {
    const { taskId, mode, projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();
    
    if (!taskId) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId' } };
    }
    
    if (!mode) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：mode' } };
    }
    
    const result = await riper5.modeManager.getModeProgress(taskId, mode, projectRoot);
    return { success: true, data: result };

  } catch (error) {
    log.error(`获取模式进度失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'GET_PROGRESS_ERROR',
        message: `获取模式进度失败: ${error.message}`
      }
    };
  }
}

/**
 * 获取所有模式进度
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 进度结果
 */
export async function getAllModeProgressDirect(args, log, context = {}) {
  try {
    const { taskId, projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();
    
    if (!taskId) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId' } };
    }
    
    const result = await riper5.modeManager.getAllModeProgress(taskId, projectRoot);
    return { success: true, data: result };

  } catch (error) {
    log.error(`获取所有模式进度失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'GET_ALL_PROGRESS_ERROR',
        message: `获取所有模式进度失败: ${error.message}`
      }
    };
  }
}

/**
 * 获取推荐的下一个模式
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 推荐结果
 */
export async function getNextRecommendedModeDirect(args, log, context = {}) {
  try {
    const { taskId, projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();
    
    if (!taskId) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId' } };
    }
    
    const result = await riper5.modeManager.getNextRecommendedMode(taskId, projectRoot);
    return { success: true, data: result };

  } catch (error) {
    log.error(`获取推荐模式失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'GET_RECOMMENDATION_ERROR',
        message: `获取推荐模式失败: ${error.message}`
      }
    };
  }
}

/**
 * 获取模式历史记录
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 历史结果
 */
export async function getModeHistoryDirect(args, log, context = {}) {
  try {
    const { taskId, limit, projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();
    
    if (!taskId) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId' } };
    }
    
    let result;
    if (limit && limit > 0) {
      result = await riper5.modeHistory.getRecentHistory(taskId, limit, projectRoot);
    } else {
      result = await riper5.modeHistory.getFullHistory(taskId, projectRoot);
    }

    return { success: true, data: result };

  } catch (error) {
    log.error(`获取模式历史记录失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'GET_HISTORY_ERROR',
        message: `获取模式历史记录失败: ${error.message}`
      }
    };
  }
}

/**
 * 导出模式历史报告
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 导出结果
 */
export async function exportModeHistoryReportDirect(args, log, context = {}) {
  try {
    const { taskId, format = 'json', projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();

    if (!['json', 'markdown', 'html'].includes(format)) {
      return { success: false, error: { code: 'INVALID_FORMAT', message: '不支持的格式' } };
    }

    if (!taskId) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId' } };
    }
    
    const result = await riper5.modeHistory.exportHistoryReport(taskId, format, projectRoot);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return result;

  } catch (error) {
    log.error(`导出模式历史报告失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'EXPORT_HISTORY_ERROR',
        message: `导出模式历史报告失败: ${error.message}`
      }
    };
  }
}

/**
 * 添加历史记录评论
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 操作结果
 */
export async function addHistoryCommentDirect(args, log, context = {}) {
  try {
    const { taskId, historyIndex, comment, projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();

    if (!taskId || !comment || typeof historyIndex === 'undefined') {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId, historyIndex, comment' } };
    }
    
    const result = await riper5.modeHistory.addCommentToHistory(taskId, historyIndex, comment, projectRoot);
    if (result.success) {
      return { success: true, data: { success: true, message: result.message, state: result.state } };
    }
    return { success: false, error: { code: 'ADD_COMMENT_ERROR', message: result.message } };
    
  } catch (error) {
    log.error(`添加历史记录注释失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'ADD_COMMENT_ERROR',
        message: `添加历史记录注释失败: ${error.message}`
      }
    };
  }
}

/**
 * 生成任务文件
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 生成结果
 */
export async function generateTaskFileDirect(args, log, context = {}) {
  try {
    const { taskId, outputDir, projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();

    if (!taskId || !outputDir) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId, outputDir' } };
    }

    const result = await riper5.taskFileManager.generateTaskFile(taskId, outputDir, projectRoot);
    return { success: true, data: result };
    
  } catch (error) {
    log.error(`生成RIPER-5任务文件失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'GENERATE_FILE_ERROR',
        message: `生成RIPER-5任务文件失败: ${error.message}`
      }
    };
  }
}

/**
 * 导出RIPER-5任务报告
 * @param {Object} args - 参数
 * @param {Object} log - 日志对象
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 导出结果
 */
export async function exportTaskReportDirect(args, log, context = {}) {
  try {
    const { taskId, format = 'json', outputDir, projectRoot: argProjectRoot } = args;
    const projectRoot = argProjectRoot || findProjectRoot();

    if (!['json', 'markdown', 'html'].includes(format)) {
        return { success: false, error: { code: 'INVALID_FORMAT', message: '不支持的格式' } };
    }

    if (!taskId) {
      return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：taskId' } };
    }
    
    if (!outputDir) {
        return { success: false, error: { code: 'MISSING_PARAM', message: '缺少必要参数：outputDir' } };
    }

    const result = await riper5.taskFileManager.exportTaskReport(taskId, format, outputDir, projectRoot);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return result;

  } catch (error) {
    log.error(`导出任务报告失败: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'EXPORT_REPORT_ERROR',
        message: `导出RIPER-5任务报告失败: ${error.message}`
      }
    };
  }
} 
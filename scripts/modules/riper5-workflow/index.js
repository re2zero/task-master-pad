/**
 * RIPER-5 Workflow Module
 * 
 * 这个模块实现了RIPER-5工作流模式（研究、创新、计划、执行、审查）
 * 为Task Master提供结构化的任务执行方法论
 */

import * as stateManager from './state-manager.js';
import * as modeManager from './mode-manager.js';
import * as taskFileManager from './task-file.js';
import * as config from './config.js';
import * as modeHistory from './mode-history.js';
import * as modeRules from './mode-rules.js';

// 导出RIPER-5模式枚举
const MODES = {
  RESEARCH: 'research',
  INNOVATE: 'innovate',
  PLAN: 'plan',
  EXECUTE: 'execute',
  REVIEW: 'review'
};

/**
 * 初始化RIPER-5工作流
 * @param {Object} options - 初始化选项
 * @param {string} options.projectRoot - 项目根目录
 * @param {Object} options.logger - 日志记录器实例
 * @returns {Promise<Object>} - 初始化状态
 */
async function initialize(options = {}) {
  try {
    // 初始化配置
    await config.initialize(options);
    
    // 初始化状态管理器
    await stateManager.initialize(options);
    
    // 初始化模式管理器
    await modeManager.initialize(options);
    
    // 初始化任务文件管理器
    await taskFileManager.initialize(options);
    
    return {
      success: true,
      message: 'RIPER-5工作流初始化成功',
      modes: MODES
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5工作流初始化失败: ${error.message}`,
      error
    };
  }
}

/**
 * 切换到指定的RIPER-5模式
 * @param {string} mode - 目标模式 (research|innovate|plan|execute|review)
 * @param {Object} options - 模式切换选项
 * @param {string} options.taskId - 关联的任务ID
 * @returns {Promise<Object>} - 模式切换结果
 */
async function switchMode(mode, options = {}) {
  try {
    if (!Object.values(MODES).includes(mode)) {
      throw new Error(`无效的模式: ${mode}. 有效模式: ${Object.values(MODES).join(', ')}`);
    }
    
    return await modeManager.switchMode(mode, options);
  } catch (error) {
    return {
      success: false,
      message: `切换到${mode}模式失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取当前RIPER-5工作流状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 当前工作流状态
 */
async function getStatus(taskId) {
  try {
    return await stateManager.getState(taskId);
  } catch (error) {
    return {
      success: false,
      message: `获取RIPER-5状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 导出模式特定的操作和工具
 */
async function getModeOperations(mode) {
  try {
    const modeModule = await import(`./modes/${mode}.js`);
    return modeModule;
  } catch (error) {
    throw new Error(`加载${mode}模式操作失败: ${error.message}`);
  }
}

// 直接导出子模块
export {
  MODES,
  initialize,
  switchMode,
  getStatus,
  getModeOperations,
  config,
  stateManager,
  modeManager,
  taskFileManager,
  modeHistory,
  modeRules
}; 
/**
 * RIPER-5 工作流模式管理模块
 * 
 * 管理RIPER-5工作流的模式切换、状态转换和规则验证
 */

import * as config from './config.js';
import * as stateManager from './state-manager.js';
import * as modeHistory from './mode-history.js';
import * as modeRules from './mode-rules.js';

/**
 * 模式转换事件钩子
 */
const hooks = {
  beforeModeSwitch: [],
  afterModeSwitch: []
};

/**
 * 初始化模式管理器
 * @param {Object} options - 初始化选项
 * @returns {Promise<Object>} - 初始化结果
 */
async function initialize(options = {}) {
  try {
    // 初始化历史记录管理器
    await modeHistory.initialize(options);
    
    // 初始化规则管理器
    await modeRules.initialize(options);
    
    return {
      success: true,
      message: 'RIPER-5模式管理器初始化成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5模式管理器初始化失败: ${error.message}`,
      error
    };
  }
}

/**
 * 切换到指定的RIPER-5模式
 * @param {string} mode - 目标模式
 * @param {Object} options - 选项
 * @param {string} options.taskId - 任务ID
 * @param {string} options.note - 模式切换说明
 * @param {boolean} options.force - 是否强制切换，忽略验证
 * @param {boolean} options.ignoreWarnings - 是否忽略警告级别的规则
 * @param {string} options.projectRoot - 项目根路径
 * @returns {Promise<Object>} - 切换结果
 */
async function switchMode(mode, options = {}) {
  try {
    const cfg = config.getConfig();
    const { taskId, note = '', force = false, ignoreWarnings = true, projectRoot } = options;
    
    if (!taskId) {
      throw new Error('未提供任务ID');
    }
    
    // 获取当前状态
    const { success, state } = await stateManager.getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    const currentMode = state.currentMode;
    
    // 如果已经在目标模式，则直接返回
    if (currentMode === mode) {
      return {
        success: true,
        message: `任务 #${taskId} 已经处于 ${mode} 模式`,
        state
      };
    }
    
    // 验证模式转换是否有效
    if (!force) {
      const context = { taskId, state };
      const validation = await modeRules.validateTransition(
        currentMode, 
        mode, 
        context, 
        !ignoreWarnings
      );
      
      if (!validation.success || !validation.isValid) {
        // 如果有错误，返回验证失败
        if (validation.errors && validation.errors.length > 0) {
          return {
            success: false,
            message: `模式转换验证失败: ${currentMode} -> ${mode}`,
            validationResult: validation,
            error: new Error(validation.errors[0].message)
          };
        }
        
        // 如果有警告且不忽略警告，返回验证失败
        if (!ignoreWarnings && validation.warnings && validation.warnings.length > 0) {
          return {
            success: false,
            message: `模式转换有警告: ${currentMode} -> ${mode}`,
            validationResult: validation,
            error: new Error(validation.warnings[0].message)
          };
        }
      }
    }
    
    // 运行前置钩子
    await runHooks('beforeModeSwitch', { taskId, fromMode: currentMode, toMode: mode, state });
    
    // 更新模式历史记录
    const result = await stateManager.updateModeHistory(taskId, mode, note, projectRoot);
    
    if (!result.success) {
      throw new Error(`更新模式历史失败: ${result.message}`);
    }
    
    // 运行后置钩子
    await runHooks('afterModeSwitch', { taskId, fromMode: currentMode, toMode: mode, state: result.state });
    
    return {
      success: true,
      message: `模式切换成功: ${currentMode} -> ${mode}`,
      state: result.state,
      previousMode: currentMode
    };
  } catch (error) {
    return {
      success: false,
      message: `模式切换失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取模式的完成进度
 * @param {string} taskId - 任务ID
 * @param {string} mode - 模式
 * @param {string} projectRoot - 项目根路径
 * @returns {Promise<Object>} - 进度信息
 */
async function getModeProgress(taskId, mode, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await stateManager.getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 检查模式是否存在
    if (!state.checklistProgress[mode]) {
      throw new Error(`模式不存在: ${mode}`);
    }
    
    // 计算完成进度
    const checklist = state.checklistProgress[mode];
    const totalItems = checklist.length;
    const completedItems = checklist.filter(item => item.completed).length;
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    return {
      success: true,
      message: `获取模式进度成功: ${mode}`,
      progress: {
        mode,
        totalItems,
        completedItems,
        percentage: progressPercentage,
        isComplete: progressPercentage === 100
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `获取模式进度失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取所有模式的完成进度
 * @param {string} taskId - 任务ID
 * @param {string} projectRoot - 项目根路径
 * @returns {Promise<Object>} - 所有模式的进度信息
 */
async function getAllModeProgress(taskId, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await stateManager.getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 获取所有模式
    const modes = Object.keys(state.checklistProgress);
    const progressPromises = modes.map(mode => getModeProgress(taskId, mode, projectRoot));
    
    // 等待所有进度请求完成
    const progressResults = await Promise.all(progressPromises);
    
    // 构建进度映射
    const progressMap = {};
    progressResults.forEach(result => {
      if (result.success) {
        progressMap[result.progress.mode] = result.progress;
      }
    });
    
    // 计算总体进度
    const totalPercentage = modes.length > 0
      ? Object.values(progressMap).reduce((sum, progress) => sum + progress.percentage, 0) / modes.length
      : 0;
    
    return {
      success: true,
      message: '获取所有模式进度成功',
      progress: {
        modes: progressMap,
        overallPercentage: totalPercentage
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `获取所有模式进度失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取下一个推荐模式
 * @param {string} taskId - 任务ID
 * @param {string} projectRoot - 项目根路径
 * @returns {Promise<Object>} - 推荐模式信息
 */
async function getNextRecommendedMode(taskId, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await stateManager.getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    const currentMode = state.currentMode;
    const cfg = config.getConfig();
    
    // 获取当前模式的完成进度
    const { success: progressSuccess, progress } = await getModeProgress(taskId, currentMode, projectRoot);
    
    if (!progressSuccess) {
      throw new Error(`无法获取当前模式 ${currentMode} 的进度`);
    }
    
    // 如果当前模式未完成，建议继续当前模式
    if (!progress.isComplete) {
      return {
        success: true,
        message: `建议继续当前模式: ${currentMode}`,
        recommendation: {
          mode: currentMode,
          reason: `当前模式 ${currentMode} 尚未完成（${progress.percentage.toFixed(1)}%）`
        }
      };
    }
    
    // 获取当前模式的下一个模式选项
    const nextModeOptions = cfg.modes[currentMode]?.nextModes || [];
    
    if (nextModeOptions.length === 0) {
      return {
        success: true,
        message: '当前模式没有下一步推荐',
        recommendation: {
          mode: null,
          reason: `模式 ${currentMode} 没有定义后续模式选项`
        }
      };
    }
    
    // 如果只有一个选项，直接推荐
    if (nextModeOptions.length === 1) {
      return {
        success: true,
        message: `推荐下一个模式: ${nextModeOptions[0]}`,
        recommendation: {
          mode: nextModeOptions[0],
          reason: `这是 ${currentMode} 模式完成后的下一个推荐步骤`
        }
      };
    }
    
    // 如果有多个选项，查找最佳匹配
    // 获取历史趋势以做出更智能的推荐
    const { success: trendsSuccess, trends } = await modeHistory.getModeTrends(taskId, projectRoot);
    
    if (trendsSuccess && trends && trends.mostCommonPattern) {
      const lastModeInPattern = trends.mostCommonPattern.pattern[trends.mostCommonPattern.pattern.length - 1];
      // 查找历史模式模式中是否有当前模式后面跟着的模式
      const pattern = trends.mostCommonPattern.pattern;
      for (let i = 0; i < pattern.length - 1; i++) {
        if (pattern[i] === currentMode && nextModeOptions.includes(pattern[i + 1])) {
          return {
            success: true,
            message: `基于历史模式推荐下一个模式: ${pattern[i + 1]}`,
            recommendation: {
              mode: pattern[i + 1],
              reason: `基于过去的模式使用历史，在 ${currentMode} 之后通常使用 ${pattern[i + 1]}`
            }
          };
        }
      }
    }
    
    // 如果没有历史模式匹配，返回所有选项
    return {
      success: true,
      message: '推荐多个可能的后续模式',
      recommendation: {
        mode: nextModeOptions,
        reason: '基于当前模式完成情况，有多个可能的后续模式',
        primaryRecommendation: nextModeOptions[0]
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `获取推荐模式失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加钩子函数
 * @param {string} hookName - 钩子名称
 * @param {Function} callback - 回调函数
 */
function addHook(hookName, callback) {
  if (!hooks[hookName]) {
    hooks[hookName] = [];
  }
  
  hooks[hookName].push(callback);
}

/**
 * 移除钩子函数
 * @param {string} hookName - 钩子名称
 * @param {Function} callback - 回调函数
 */
function removeHook(hookName, callback) {
  if (!hooks[hookName]) {
    return;
  }
  
  const index = hooks[hookName].indexOf(callback);
  if (index !== -1) {
    hooks[hookName].splice(index, 1);
  }
}

/**
 * 运行钩子函数
 * @private
 */
async function runHooks(hookName, data) {
  if (!hooks[hookName] || hooks[hookName].length === 0) {
    return;
  }
  
  // 运行所有注册的钩子函数
  const promises = hooks[hookName].map(callback => callback(data));
  await Promise.all(promises);
}

/**
 * 获取模式转换规则
 * @param {string} type - 规则类型 ('all', 'default', 'custom')
 * @returns {Promise<Object>} - 规则列表
 */
async function getTransitionRules(type = 'all') {
  return modeRules.getRules(type);
}

/**
 * 添加自定义模式转换规则
 * @param {Object} rule - 规则定义
 * @returns {Promise<Object>} - 添加结果
 */
async function addTransitionRule(rule) {
  return modeRules.addCustomRule(rule);
}

/**
 * 移除自定义模式转换规则
 * @param {string} ruleId - 规则ID
 * @returns {Promise<Object>} - 移除结果
 */
async function removeTransitionRule(ruleId) {
  return modeRules.removeCustomRule(ruleId);
}

/**
 * 获取模式历史记录
 * @param {string} taskId - 任务ID
 * @param {number} limit - 限制返回的记录数，如果为0则返回全部
 * @returns {Promise<Object>} - 历史记录
 */
async function getModeHistory(taskId, limit = 0) {
  if (limit > 0) {
    return modeHistory.getRecentHistory(taskId, limit);
  } else {
    return modeHistory.getFullHistory(taskId);
  }
}

/**
 * 导出模式历史记录报告
 * @param {string} taskId - 任务ID
 * @param {string} format - 导出格式 ('json', 'markdown', 'html')
 * @returns {Promise<Object>} - 导出结果
 */
async function exportModeHistoryReport(taskId, format = 'json') {
  return modeHistory.exportHistoryReport(taskId, format);
}

/**
 * 添加历史记录注释
 * @param {string} taskId - 任务ID
 * @param {number} historyIndex - 历史记录索引
 * @param {string} comment - 注释内容
 * @returns {Promise<Object>} - 添加结果
 */
async function addHistoryComment(taskId, historyIndex, comment) {
  return modeHistory.addHistoryComment(taskId, historyIndex, comment);
}

export {
  initialize,
  switchMode,
  getModeProgress,
  getAllModeProgress,
  getNextRecommendedMode,
  addHook,
  removeHook,
  getTransitionRules,
  addTransitionRule,
  removeTransitionRule,
  getModeHistory,
  exportModeHistoryReport,
  addHistoryComment
}; 
/**
 * RIPER-5 工作流模式转换规则管理模块
 * 
 * 提供高级的模式转换规则定义和验证功能
 */

import * as config from './config.js';
import * as stateManager from './state-manager.js';

// 模式转换规则注册表
const ruleRegistry = {
  default: [], // 默认规则
  custom: []   // 自定义规则
};

/**
 * 初始化规则管理器
 * @param {Object} options - 初始化选项
 * @returns {Promise<Object>} - 初始化结果
 */
async function initialize(options = {}) {
  try {
    // 添加默认规则
    addDefaultRules();
    
    return {
      success: true,
      message: 'RIPER-5模式转换规则管理器初始化成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5模式转换规则管理器初始化失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加默认规则
 * @private
 */
function addDefaultRules() {
  // 规则1: 检查检查清单完成情况
  const checklistCompletionRule = {
    id: 'checklist-completion',
    name: '检查清单完成度规则',
    description: '如果当前模式的检查清单完成度不足，建议继续当前模式',
    condition: async (fromMode, toMode, context) => {
      const { taskId } = context;
      const { success, state } = await stateManager.getState(taskId);
      
      if (!success || !state) {
        return { isValid: true, message: '无法获取状态，跳过规则验证' };
      }
      
      // 获取当前模式的检查清单
      const checklist = state.checklistProgress[fromMode] || [];
      if (checklist.length === 0) {
        return { isValid: true, message: '没有检查清单项，跳过规则验证' };
      }
      
      // 计算完成度
      const completedItems = checklist.filter(item => item.completed).length;
      const completionRate = completedItems / checklist.length;
      
      // 如果完成度低于阈值，建议继续当前模式
      if (completionRate < 0.7) {
        return {
          isValid: false,
          message: `检查清单完成度不足 (${Math.round(completionRate * 100)}%)，建议继续当前模式`,
          recommendation: '建议在模式切换前完成更多检查清单项',
          severity: 'warning'
        };
      }
      
      return { isValid: true, message: '检查清单完成度足够' };
    }
  };
  
  // 规则2: 检查配置的有效转换路径
  const validTransitionRule = {
    id: 'valid-transition-path',
    name: '有效转换路径规则',
    description: '验证模式转换是否遵循配置中定义的有效路径',
    condition: async (fromMode, toMode, context) => {
      const cfg = config.getConfig();
      
      // 检查当前模式是否定义了下一个模式选项
      const nextModeOptions = cfg.modes[fromMode]?.nextModes || [];
      
      // 如果没有定义下一个模式选项，则允许任意转换
      if (nextModeOptions.length === 0) {
        return { isValid: true, message: '没有定义转换限制，允许任意转换' };
      }
      
      // 检查目标模式是否在允许的下一个模式列表中
      if (!nextModeOptions.includes(toMode)) {
        return {
          isValid: false,
          message: `无效的模式转换路径: ${fromMode} -> ${toMode}`,
          recommendation: `有效的转换选项: ${nextModeOptions.join(', ')}`,
          severity: 'error'
        };
      }
      
      return { isValid: true, message: '模式转换路径有效' };
    }
  };
  
  // 规则3: 检查任务处理时间
  const minTimeSpentRule = {
    id: 'min-time-spent',
    name: '最短停留时间规则',
    description: '确保在当前模式停留了足够的时间，防止过快切换',
    condition: async (fromMode, toMode, context) => {
      const { taskId } = context;
      const { success, state } = await stateManager.getState(taskId);
      
      if (!success || !state) {
        return { isValid: true, message: '无法获取状态，跳过规则验证' };
      }
      
      // 获取最后一次模式切换的时间
      const lastModeChange = state.modeHistory.find(h => h.mode === fromMode);
      if (!lastModeChange) {
        return { isValid: true, message: '无法找到当前模式的历史记录，跳过规则验证' };
      }
      
      const lastChangeTime = new Date(lastModeChange.timestamp);
      const now = new Date();
      const timeSpent = now - lastChangeTime; // 毫秒
      
      // 如果停留时间少于最低阈值（例如5分钟），给出警告
      const minTimeThreshold = 5 * 60 * 1000; // 5分钟（毫秒）
      if (timeSpent < minTimeThreshold) {
        return {
          isValid: false,
          message: `在当前模式停留时间过短 (${formatDuration(timeSpent)})`,
          recommendation: `建议至少停留 ${formatDuration(minTimeThreshold)}`,
          severity: 'warning'
        };
      }
      
      return { isValid: true, message: '模式停留时间足够' };
    }
  };
  
  // 添加默认规则
  ruleRegistry.default = [
    checklistCompletionRule,
    validTransitionRule,
    minTimeSpentRule
  ];
}

/**
 * 添加自定义转换规则
 * @param {Object} rule - 规则定义
 * @returns {Object} - 添加结果
 */
function addCustomRule(rule) {
  try {
    // 验证规则结构
    if (!rule.id || !rule.name || !rule.condition || typeof rule.condition !== 'function') {
      throw new Error('无效的规则定义，必须包含id、name和condition函数');
    }
    
    // 检查规则ID是否已存在
    const existingRule = [...ruleRegistry.default, ...ruleRegistry.custom]
      .find(r => r.id === rule.id);
    
    if (existingRule) {
      throw new Error(`规则ID已存在: ${rule.id}`);
    }
    
    // 添加规则
    ruleRegistry.custom.push(rule);
    
    return {
      success: true,
      message: `自定义规则添加成功: ${rule.name}`
    };
  } catch (error) {
    return {
      success: false,
      message: `添加自定义规则失败: ${error.message}`,
      error
    };
  }
}

/**
 * 移除自定义转换规则
 * @param {string} ruleId - 规则ID
 * @returns {Object} - 移除结果
 */
function removeCustomRule(ruleId) {
  try {
    const initialLength = ruleRegistry.custom.length;
    
    // 移除指定ID的规则
    ruleRegistry.custom = ruleRegistry.custom.filter(rule => rule.id !== ruleId);
    
    if (ruleRegistry.custom.length === initialLength) {
      return {
        success: false,
        message: `未找到ID为 ${ruleId} 的自定义规则`
      };
    }
    
    return {
      success: true,
      message: `自定义规则移除成功: ${ruleId}`
    };
  } catch (error) {
    return {
      success: false,
      message: `移除自定义规则失败: ${error.message}`,
      error
    };
  }
}

/**
 * 验证模式转换是否符合规则
 * @param {string} fromMode - 源模式
 * @param {string} toMode - 目标模式
 * @param {Object} context - 上下文信息
 * @param {boolean} includeWarnings - 是否将警告视为失败
 * @returns {Promise<Object>} - 验证结果
 */
async function validateTransition(fromMode, toMode, context, includeWarnings = false) {
  try {
    // 合并所有规则
    const allRules = [...ruleRegistry.default, ...ruleRegistry.custom];
    
    // 验证每个规则
    const validationResults = [];
    const validationPromises = allRules.map(async rule => {
      try {
        const result = await rule.condition(fromMode, toMode, context);
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ...result
        };
      } catch (error) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          isValid: true, // 规则执行出错时默认通过
          message: `规则执行出错: ${error.message}`,
          error
        };
      }
    });
    
    // 等待所有规则验证完成
    const results = await Promise.all(validationPromises);
    
    // 处理结果
    let isValid = true;
    const errors = [];
    const warnings = [];
    
    results.forEach(result => {
      validationResults.push(result);
      
      if (!result.isValid) {
        if (result.severity === 'error') {
          isValid = false;
          errors.push(result);
        } else if (result.severity === 'warning') {
          warnings.push(result);
          if (includeWarnings) {
            isValid = false;
          }
        } else {
          isValid = false;
          errors.push(result);
        }
      }
    });
    
    return {
      success: true,
      isValid,
      message: isValid ? `模式转换验证通过: ${fromMode} -> ${toMode}` : `模式转换验证失败: ${fromMode} -> ${toMode}`,
      results: validationResults,
      errors,
      warnings
    };
  } catch (error) {
    return {
      success: false,
      isValid: false,
      message: `模式转换验证执行失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取所有转换规则
 * @param {string} type - 规则类型 ('all', 'default', 'custom')
 * @returns {Object} - 规则列表
 */
function getRules(type = 'all') {
  try {
    let rules = [];
    
    switch (type.toLowerCase()) {
      case 'default':
        rules = [...ruleRegistry.default];
        break;
      case 'custom':
        rules = [...ruleRegistry.custom];
        break;
      case 'all':
      default:
        rules = [...ruleRegistry.default, ...ruleRegistry.custom];
        break;
    }
    
    // 简化规则表示（去除条件函数）
    const simplifiedRules = rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: ruleRegistry.default.find(r => r.id === rule.id) ? 'default' : 'custom'
    }));
    
    return {
      success: true,
      message: `获取${type}规则成功`,
      rules: simplifiedRules
    };
  } catch (error) {
    return {
      success: false,
      message: `获取规则失败: ${error.message}`,
      error
    };
  }
}

/**
 * 格式化持续时间
 * @private
 */
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

export {
  initialize,
  addCustomRule,
  removeCustomRule,
  validateTransition,
  getRules
}; 
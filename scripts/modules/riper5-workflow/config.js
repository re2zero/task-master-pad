/**
 * RIPER-5 工作流配置管理模块
 * 
 * 管理RIPER-5工作流的配置项，包括路径、默认设置和用户自定义选项
 */

import path from 'path';
import fs from 'fs/promises';
import { findProjectRoot } from '../utils.js';

// 默认配置
const DEFAULT_CONFIG = {
  // 模式配置
  modes: {
    research: {
      description: '研究模式 - 收集和分析信息，识别问题和机会',
      nextModes: ['innovate', 'plan'],
      aiPromptTemplate: '研究阶段：收集和分析与{{taskTitle}}相关的信息。识别问题和机会，提供系统性见解。',
      checklistItems: [
        '明确定义了研究问题或目标',
        '收集了相关信息和资源',
        '分析了收集到的数据',
        '识别了关键问题和机会',
        '记录了发现和见解'
      ]
    },
    innovate: {
      description: '创新模式 - 提出创新思路和解决方案',
      nextModes: ['plan'],
      aiPromptTemplate: '创新阶段：为{{taskTitle}}提出创新思路和解决方案。运用创新思维，发展多样化视角。',
      checklistItems: [
        '采用了创新思维技术',
        '生成了多个潜在解决方案',
        '评估了创新方案的可行性',
        '选择了最佳创新路径',
        '记录了创新过程和决策'
      ]
    },
    plan: {
      description: '计划模式 - 制定详细的执行计划',
      nextModes: ['execute'],
      aiPromptTemplate: '计划阶段：为{{taskTitle}}制定详细的执行计划。确定目标、资源、时间表和风险缓解策略。',
      checklistItems: [
        '定义了明确的目标和成功标准',
        '分解了任务为可管理的步骤',
        '制定了时间表和里程碑',
        '分配了必要的资源',
        '识别了风险并制定了应对策略'
      ]
    },
    execute: {
      description: '执行模式 - 实施计划并监控进度',
      nextModes: ['review'],
      aiPromptTemplate: '执行阶段：实施{{taskTitle}}的计划并监控进度。确保高效率和高质量的交付。',
      checklistItems: [
        '按照计划开始执行任务',
        '跟踪进度和指标',
        '处理执行中的问题和障碍',
        '与相关方沟通进展情况',
        '完成了所有计划的工作项'
      ]
    },
    review: {
      description: '审查模式 - 评估结果和总结经验',
      nextModes: ['research', 'innovate', 'plan', 'execute'],
      aiPromptTemplate: '审查阶段：评估{{taskTitle}}的结果，总结经验教训，为未来工作提供反馈。',
      checklistItems: [
        '评估了结果与目标的一致性',
        '收集了反馈和意见',
        '分析了成功因素和不足之处',
        '提出了改进建议',
        '记录了经验教训供未来参考'
      ]
    }
  },
  
  // 文件和路径配置
  paths: {
    stateDir: '.taskmaster/riper5-states',
    templatesDir: '.taskmaster/templates/riper5',
    stateFilePattern: 'riper5-state-{{taskId}}.json',
    modeHistoryPattern: 'riper5-history-{{taskId}}.json',
    defaultTemplates: {
      research: 'research-template.md',
      innovate: 'innovate-template.md',
      plan: 'plan-template.md',
      execute: 'execute-template.md',
      review: 'review-template.md'
    }
  },
  
  // 系统设置
  settings: {
    autoCreateTemplates: true,
    enforceSequentialModes: false,
    trackModeHistory: true,
    defaultMode: 'research',
    integrationPoints: {
      taskCreate: true,
      taskUpdate: true,
      taskComplete: true
    }
  }
};

// 当前配置实例
let currentConfig = null;
let projectRoot = null;

/**
 * 初始化配置
 * @param {Object} options - 初始化选项
 * @param {string} options.projectRoot - 项目根目录
 * @returns {Promise<Object>} - 初始化结果
 */
async function initialize(options = {}) {
  try {
    projectRoot = options.projectRoot || await findProjectRoot();
    
    // 确保配置目录存在
    await ensureConfigDirectories();
    
    // 加载配置
    await loadConfig();
    
    return {
      success: true,
      message: 'RIPER-5配置初始化成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5配置初始化失败: ${error.message}`,
      error
    };
  }
}

/**
 * 确保所有必要的配置目录存在
 */
async function ensureConfigDirectories() {
  const createDirIfNotExists = async (dirPath) => {
    const fullPath = path.join(projectRoot, dirPath);
    try {
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  };
  
  // 创建状态目录
  await createDirIfNotExists(DEFAULT_CONFIG.paths.stateDir);
  
  // 创建模板目录
  await createDirIfNotExists(DEFAULT_CONFIG.paths.templatesDir);
}

/**
 * 加载配置
 */
async function loadConfig() {
  const configPath = path.join(projectRoot, '.taskmaster/config.json');
  
  try {
    // 检查配置文件是否存在
    await fs.access(configPath);
    
    // 读取配置文件
    const configData = await fs.readFile(configPath, 'utf8');
    const userConfig = JSON.parse(configData);
    
    // 合并用户配置与默认配置
    currentConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      // 深度合并特定部分
      modes: { ...DEFAULT_CONFIG.modes, ...(userConfig.modes || {}) },
      paths: { ...DEFAULT_CONFIG.paths, ...(userConfig.paths || {}) },
      settings: { ...DEFAULT_CONFIG.settings, ...(userConfig.settings || {}) }
    };
  } catch (error) {
    // 如果配置文件不存在或有错误，使用默认配置
    currentConfig = { ...DEFAULT_CONFIG };
    
    // 保存默认配置
    await saveConfig();
  }
}

/**
 * 保存配置
 */
async function saveConfig() {
  const configPath = path.join(projectRoot, '.taskmaster/config.json');
  
  try {
    await fs.writeFile(
      configPath,
      JSON.stringify(currentConfig, null, 2),
      'utf8'
    );
    
    return {
      success: true,
      message: '配置保存成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `配置保存失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取当前配置
 * @returns {Object} - 当前配置
 */
function getConfig() {
  if (!currentConfig) {
    currentConfig = { ...DEFAULT_CONFIG };
  }
  return currentConfig;
}

/**
 * 更新配置
 * @param {Object} newConfig - 新配置
 * @returns {Promise<Object>} - 更新结果
 */
async function updateConfig(newConfig) {
  try {
    // 合并配置
    currentConfig = {
      ...currentConfig,
      ...newConfig,
      // 深度合并特定部分
      modes: { ...currentConfig.modes, ...(newConfig.modes || {}) },
      paths: { ...currentConfig.paths, ...(newConfig.paths || {}) },
      settings: { ...currentConfig.settings, ...(newConfig.settings || {}) }
    };
    
    // 保存配置
    await saveConfig();
    
    return {
      success: true,
      message: 'RIPER-5配置更新成功',
      config: currentConfig
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5配置更新失败: ${error.message}`,
      error
    };
  }
}

export {
  initialize,
  getConfig,
  updateConfig,
  ensureConfigDirectories
}; 
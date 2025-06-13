/**
 * RIPER-5 工作流状态管理模块
 * 
 * 管理与任务关联的RIPER-5工作流状态，处理状态的持久化存储和检索
 */

import path from 'path';
import fs from 'fs/promises';
import * as config from './config.js';

/**
 * 初始化状态管理器
 * @param {Object} options - 初始化选项
 * @returns {Promise<Object>} - 初始化结果
 */
async function initialize(options = {}) {
  try {
    const cfg = config.getConfig();
    
    // 确保状态目录存在
    const stateDir = path.join(options.projectRoot || process.cwd(), cfg.paths.stateDir);
    await fs.mkdir(stateDir, { recursive: true });
    
    return {
      success: true,
      message: 'RIPER-5状态管理器初始化成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5状态管理器初始化失败: ${error.message}`,
      error
    };
  }
}

/**
 * 创建新的RIPER-5状态
 * @param {string} taskId - 任务ID
 * @param {Object} options - 状态创建选项
 * @returns {Promise<Object>} - 创建结果
 */
async function createState(taskId, options = {}, projectRoot) {
  try {
    const cfg = config.getConfig(projectRoot);
    const initialMode = options.initialMode || cfg.settings.defaultMode;
    
    // 基本状态结构
    const newState = {
      taskId,
      currentMode: initialMode,
      modeHistory: [
        {
          mode: initialMode,
          timestamp: new Date().toISOString(),
          note: options.note || '初始化RIPER-5工作流'
        }
      ],
      checklistProgress: {},
      notes: {},
      artifacts: {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    // 为每个模式初始化检查列表
    Object.keys(cfg.modes).forEach(mode => {
      const checklistItems = cfg.modes[mode].checklistItems || [];
      newState.checklistProgress[mode] = checklistItems.map(item => ({
        text: item,
        completed: false
      }));
      
      // 为每个模式初始化空笔记
      newState.notes[mode] = '';
      
      // 为每个模式初始化空工件列表
      newState.artifacts[mode] = [];
    });
    
    // 保存状态
    await saveState(taskId, newState, projectRoot);
    
    return {
      success: true,
      message: `RIPER-5状态创建成功: 任务 #${taskId}`,
      state: newState
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5状态创建失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取任务的RIPER-5状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 状态信息
 */
async function getState(taskId, projectRoot) {
  try {
    const cfg = config.getConfig(projectRoot);
    const stateFilePath = getStateFilePath(taskId, cfg, projectRoot);
    
    try {
      // 检查状态文件是否存在
      await fs.access(stateFilePath);
      
      // 读取状态文件
      const stateData = await fs.readFile(stateFilePath, 'utf8');
      const state = JSON.parse(stateData);
      
      return {
        success: true,
        message: `获取RIPER-5状态成功: 任务 #${taskId}`,
        state,
        filePath: stateFilePath
      };
    } catch (error) {
      // 如果状态文件不存在，创建新状态
      if (error.code === 'ENOENT') {
        return await createState(taskId, {}, projectRoot);
      }
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      message: `获取RIPER-5状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新任务的RIPER-5状态
 * @param {string} taskId - 任务ID
 * @param {Object} updates - 要应用的更新
 * @returns {Promise<Object>} - 更新结果
 */
async function updateState(taskId, updates, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 应用更新
    const updatedState = {
      ...state,
      ...updates,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    // 保存更新后的状态
    await saveState(taskId, updatedState, projectRoot);
    
    return {
      success: true,
      message: `RIPER-5状态更新成功: 任务 #${taskId}`,
      state: updatedState
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5状态更新失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新模式历史记录
 * @param {string} taskId - 任务ID
 * @param {string} mode - 新模式
 * @param {string} note - 模式变更说明
 * @returns {Promise<Object>} - 更新结果
 */
async function updateModeHistory(taskId, mode, note = '', projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 添加新的历史记录项
    const newHistoryEntry = {
      mode,
      timestamp: new Date().toISOString(),
      note
    };
    
    // 更新状态
    return await updateState(taskId, {
      currentMode: mode,
      modeHistory: [...state.modeHistory, newHistoryEntry]
    }, projectRoot);
  } catch (error) {
    return {
      success: false,
      message: `更新模式历史记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新检查列表项状态
 * @param {string} taskId - 任务ID
 * @param {string} mode - 模式
 * @param {number} itemIndex - 检查列表项索引
 * @param {boolean} completed - 完成状态
 * @returns {Promise<Object>} - 更新结果
 */
async function updateChecklistItem(taskId, mode, itemIndex, completed, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 检查模式和检查列表项是否存在
    if (!state.checklistProgress[mode]) {
      throw new Error(`模式不存在: ${mode}`);
    }
    
    if (itemIndex < 0 || itemIndex >= state.checklistProgress[mode].length) {
      throw new Error(`检查列表项索引无效: ${itemIndex}`);
    }
    
    // 克隆检查列表
    const updatedChecklist = { ...state.checklistProgress };
    updatedChecklist[mode] = [...state.checklistProgress[mode]];
    updatedChecklist[mode][itemIndex] = {
      ...updatedChecklist[mode][itemIndex],
      completed
    };
    
    // 更新状态
    return await updateState(taskId, {
      checklistProgress: updatedChecklist
    }, projectRoot);
  } catch (error) {
    return {
      success: false,
      message: `更新检查列表项失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新模式笔记
 * @param {string} taskId - 任务ID
 * @param {string} mode - 模式
 * @param {string} note - 笔记内容
 * @param {boolean} append - 是否追加而非替换
 * @returns {Promise<Object>} - 更新结果
 */
async function updateNote(taskId, mode, note, append = false, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 检查模式是否存在
    if (!state.notes[mode] && state.notes[mode] !== '') {
      throw new Error(`模式不存在: ${mode}`);
    }
    
    // 更新笔记
    const updatedNotes = { ...state.notes };
    if (append) {
      const timestamp = new Date().toISOString();
      updatedNotes[mode] = `${updatedNotes[mode]}\n\n--- ${timestamp} ---\n${note}`;
    } else {
      updatedNotes[mode] = note;
    }
    
    // 更新状态
    return await updateState(taskId, {
      notes: updatedNotes
    }, projectRoot);
  } catch (error) {
    return {
      success: false,
      message: `更新模式笔记失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加工件
 * @param {string} taskId - 任务ID
 * @param {string} mode - 模式
 * @param {Object} artifact - 工件信息
 * @returns {Promise<Object>} - 更新结果
 */
async function addArtifact(taskId, mode, artifact, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 检查模式是否存在
    if (!state.artifacts[mode]) {
      throw new Error(`模式不存在: ${mode}`);
    }
    
    // 添加工件
    const updatedArtifacts = { ...state.artifacts };
    updatedArtifacts[mode] = [
      ...updatedArtifacts[mode],
      {
        ...artifact,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      }
    ];
    
    // 更新状态
    return await updateState(taskId, {
      artifacts: updatedArtifacts
    }, projectRoot);
  } catch (error) {
    return {
      success: false,
      message: `添加工件失败: ${error.message}`,
      error
    };
  }
}

/**
 * 删除任务的RIPER-5状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 删除结果
 */
async function deleteState(taskId, projectRoot) {
  try {
    const cfg = config.getConfig(projectRoot);
    const stateFilePath = getStateFilePath(taskId, cfg, projectRoot);
    
    try {
      // 检查状态文件是否存在
      await fs.access(stateFilePath);
      
      // 删除状态文件
      await fs.unlink(stateFilePath);
      
      return {
        success: true,
        message: `RIPER-5状态删除成功: 任务 #${taskId}`
      };
    } catch (error) {
      // 如果状态文件不存在，视为成功
      if (error.code === 'ENOENT') {
        return {
          success: true,
          message: `没有找到要删除的RIPER-5状态: 任务 #${taskId}`
        };
      }
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5状态删除失败: ${error.message}`,
      error
    };
  }
}

/**
 * 从文件中获取状态文件路径
 * @private
 */
function getStateFilePath(taskId, cfg, projectRoot) {
  const stateDir = path.join(projectRoot || process.cwd(), cfg.paths.stateDir);
  return path.join(stateDir, `${taskId}.riper5.json`);
}

/**
 * 保存状态到文件
 * @private
 */
async function saveState(taskId, state, projectRoot) {
  const cfg = config.getConfig(projectRoot);
  const stateFilePath = getStateFilePath(taskId, cfg, projectRoot);
  
  // 确保状态目录存在
  const stateDir = path.dirname(stateFilePath);
  await fs.mkdir(stateDir, { recursive: true });
  
  // 保存状态
  await fs.writeFile(
    stateFilePath,
    JSON.stringify(state, null, 2),
    'utf8'
  );
}

/**
 * 从任务文件更新状态
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {Object} fileData - 文件数据
 * @returns {Promise<Object>} - 更新结果
 */
async function updateStateFromFile(taskId, mode, fileData, projectRoot) {
  try {
    const { checklistItems, notes } = fileData;
    
    // 获取当前状态
    const { success, state } = await getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的当前状态`);
    }
    
    // 更新检查列表
    const updates = { 
      checklistProgress: { ...state.checklistProgress },
      notes: { ...state.notes }
    };
    
    if (checklistItems && Array.isArray(checklistItems)) {
      updates.checklistProgress[mode] = checklistItems;
    }
    
    if (notes) {
      updates.notes[mode] = notes;
    }
    
    // 更新状态
    return await updateState(taskId, updates, projectRoot);
  } catch (error) {
    return {
      success: false,
      message: `从文件更新状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取所有任务的RIPER-5状态
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} - 包含所有状态的数组
 */
async function getAllTasksState(projectRoot) {
  try {
    const cfg = config.getConfig(projectRoot);
    const stateDir = path.join(projectRoot || process.cwd(), cfg.paths.stateDir);
    const files = await fs.readdir(stateDir);
    const allStates = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const taskId = path.basename(file, '.json');
        const stateData = await getState(taskId, projectRoot);
        if (stateData.success) {
          allStates.push(stateData.state);
        }
      }
    }

    return {
      success: true,
      message: `成功获取了 ${allStates.length} 个任务的状态`,
      data: allStates,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 如果目录不存在，返回空数组
      return { success: true, message: '状态目录不存在，返回空列表。', data: [] };
    }
    return {
      success: false,
      message: `获取所有RIPER-5任务状态失败: ${error.message}`,
      error,
    };
  }
}

export {
  initialize,
  createState,
  getState,
  updateState,
  updateModeHistory,
  updateChecklistItem,
  updateNote,
  addArtifact,
  deleteState,
  updateStateFromFile,
  getAllTasksState,
  saveState
}; 
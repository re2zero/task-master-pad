/**
 * RIPER-5 计划模式实现
 * 
 * 负责计划模式的特定操作和功能
 */

import * as stateManager from '../state-manager.js';
import * as taskFileManager from '../task-file.js';

/**
 * 添加任务
 * @param {string} taskId - 主任务ID
 * @param {Object} task - 子任务信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addTask(taskId, task) {
  try {
    // 添加任务作为工件
    const artifact = {
      type: 'task',
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      estimatedTime: task.estimatedTime,
      dependencies: task.dependencies || [],
      status: 'pending',
      tags: task.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'plan', artifact);
    
    if (!result.success) {
      throw new Error(`添加任务失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '任务添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加任务失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加里程碑
 * @param {string} taskId - 主任务ID
 * @param {Object} milestone - 里程碑信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addMilestone(taskId, milestone) {
  try {
    // 添加里程碑作为工件
    const artifact = {
      type: 'milestone',
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate,
      criteria: milestone.criteria || [],
      status: 'pending',
      tags: milestone.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'plan', artifact);
    
    if (!result.success) {
      throw new Error(`添加里程碑失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '里程碑添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加里程碑失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新计划笔记
 * @param {string} taskId - 任务ID
 * @param {string} notes - 笔记内容
 * @param {boolean} append - 是否追加
 * @returns {Promise<Object>} - 更新结果
 */
async function updateNotes(taskId, notes, append = true) {
  try {
    const result = await stateManager.updateNote(taskId, 'plan', notes, append);
    
    if (!result.success) {
      throw new Error(`更新计划笔记失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '计划笔记更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `更新计划笔记失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取任务列表
 * @param {string} taskId - 主任务ID
 * @returns {Promise<Object>} - 任务列表
 */
async function getTasks(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出任务类型的工件
    const tasks = (state.artifacts.plan || [])
      .filter(artifact => artifact.type === 'task');
    
    return {
      success: true,
      message: '获取任务列表成功',
      tasks
    };
  } catch (error) {
    return {
      success: false,
      message: `获取任务列表失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取里程碑列表
 * @param {string} taskId - 主任务ID
 * @returns {Promise<Object>} - 里程碑列表
 */
async function getMilestones(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出里程碑类型的工件
    const milestones = (state.artifacts.plan || [])
      .filter(artifact => artifact.type === 'milestone');
    
    return {
      success: true,
      message: '获取里程碑列表成功',
      milestones
    };
  } catch (error) {
    return {
      success: false,
      message: `获取里程碑列表失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新任务状态
 * @param {string} taskId - 主任务ID
 * @param {number} subtaskIndex - 子任务索引
 * @param {string} status - 新状态
 * @returns {Promise<Object>} - 更新结果
 */
async function updateTaskStatus(taskId, subtaskIndex, status) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取任务
    const planArtifacts = state.artifacts.plan || [];
    const tasks = planArtifacts.filter(artifact => artifact.type === 'task');
    
    if (subtaskIndex < 0 || subtaskIndex >= tasks.length) {
      throw new Error(`无效的任务索引: ${subtaskIndex}`);
    }
    
    // 找到原始索引
    const originalIndex = planArtifacts.findIndex(
      artifact => artifact === tasks[subtaskIndex]
    );
    
    if (originalIndex === -1) {
      throw new Error('无法找到任务的原始索引');
    }
    
    // 验证状态有效性
    const validStatuses = ['pending', 'in-progress', 'completed', 'blocked', 'deferred'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的任务状态: ${status}`);
    }
    
    // 更新状态
    const updatedArtifacts = [...planArtifacts];
    updatedArtifacts[originalIndex] = {
      ...updatedArtifacts[originalIndex],
      status,
      statusUpdatedAt: new Date().toISOString()
    };
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, {
      artifacts: {
        ...state.artifacts,
        plan: updatedArtifacts
      }
    });
    
    if (!updateResult.success) {
      throw new Error(`更新任务状态失败: ${updateResult.message}`);
    }
    
    return {
      success: true,
      message: `任务状态更新为 ${status}`,
      task: updatedArtifacts[originalIndex]
    };
  } catch (error) {
    return {
      success: false,
      message: `更新任务状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新里程碑状态
 * @param {string} taskId - 主任务ID
 * @param {number} milestoneIndex - 里程碑索引
 * @param {string} status - 新状态
 * @returns {Promise<Object>} - 更新结果
 */
async function updateMilestoneStatus(taskId, milestoneIndex, status) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取里程碑
    const planArtifacts = state.artifacts.plan || [];
    const milestones = planArtifacts.filter(artifact => artifact.type === 'milestone');
    
    if (milestoneIndex < 0 || milestoneIndex >= milestones.length) {
      throw new Error(`无效的里程碑索引: ${milestoneIndex}`);
    }
    
    // 找到原始索引
    const originalIndex = planArtifacts.findIndex(
      artifact => artifact === milestones[milestoneIndex]
    );
    
    if (originalIndex === -1) {
      throw new Error('无法找到里程碑的原始索引');
    }
    
    // 验证状态有效性
    const validStatuses = ['pending', 'in-progress', 'completed', 'at-risk', 'missed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的里程碑状态: ${status}`);
    }
    
    // 更新状态
    const updatedArtifacts = [...planArtifacts];
    updatedArtifacts[originalIndex] = {
      ...updatedArtifacts[originalIndex],
      status,
      statusUpdatedAt: new Date().toISOString()
    };
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, {
      artifacts: {
        ...state.artifacts,
        plan: updatedArtifacts
      }
    });
    
    if (!updateResult.success) {
      throw new Error(`更新里程碑状态失败: ${updateResult.message}`);
    }
    
    return {
      success: true,
      message: `里程碑状态更新为 ${status}`,
      milestone: updatedArtifacts[originalIndex]
    };
  } catch (error) {
    return {
      success: false,
      message: `更新里程碑状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 生成计划总结
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 总结结果
 */
async function generateSummary(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取任务和里程碑
    const tasks = (state.artifacts.plan || [])
      .filter(artifact => artifact.type === 'task');
    
    const milestones = (state.artifacts.plan || [])
      .filter(artifact => artifact.type === 'milestone');
    
    // 计算任务状态统计
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      deferred: tasks.filter(t => t.status === 'deferred').length
    };
    
    // 按优先级统计
    const tasksByPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };
    
    // 简单的总结格式
    const summary = `
# 计划总结

## 任务统计
- 总任务数: ${taskStats.total}
- 待处理: ${taskStats.pending}
- 进行中: ${taskStats.inProgress}
- 已完成: ${taskStats.completed}
- 已阻塞: ${taskStats.blocked}
- 已延期: ${taskStats.deferred}

## 优先级分布
- 高优先级: ${tasksByPriority.high}
- 中优先级: ${tasksByPriority.medium}
- 低优先级: ${tasksByPriority.low}

## 里程碑
${milestones.map(m => `### ${m.title} (${m.status})\n${m.description}\n\n**目标日期:** ${m.dueDate || '无'}\n\n**完成标准:**\n${m.criteria.map(c => `- ${c}`).join('\n')}`).join('\n\n')}

## 任务清单
${tasks.map(t => `### ${t.title} (${t.status})\n${t.description}\n\n**优先级:** ${t.priority}\n**预计时间:** ${t.estimatedTime || '未指定'}`).join('\n\n')}

## 计划笔记
${state.notes.plan || '暂无计划笔记'}
`;
    
    return {
      success: true,
      message: '计划总结生成成功',
      summary
    };
  } catch (error) {
    return {
      success: false,
      message: `生成计划总结失败: ${error.message}`,
      error
    };
  }
}

export {
  addTask,
  addMilestone,
  updateNotes,
  getTasks,
  getMilestones,
  updateTaskStatus,
  updateMilestoneStatus,
  generateSummary
}; 
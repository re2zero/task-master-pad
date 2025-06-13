/**
 * RIPER-5 研究模式实现
 * 
 * 负责研究模式的特定操作和功能
 */

import * as stateManager from '../state-manager.js';
import * as taskFileManager from '../task-file.js';

/**
 * 添加研究资源
 * @param {string} taskId - 任务ID
 * @param {Object} resource - 资源信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addResource(taskId, resource) {
  try {
    // 添加资源作为工件
    const artifact = {
      type: 'resource',
      title: resource.title,
      url: resource.url,
      notes: resource.notes,
      tags: resource.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'research', artifact);
    
    if (!result.success) {
      throw new Error(`添加资源失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '研究资源添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加研究资源失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加研究发现
 * @param {string} taskId - 任务ID
 * @param {Object} finding - 发现信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addFinding(taskId, finding) {
  try {
    // 添加发现作为工件
    const artifact = {
      type: 'finding',
      title: finding.title,
      description: finding.description,
      importance: finding.importance || 'medium',
      category: finding.category || 'general',
      tags: finding.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'research', artifact);
    
    if (!result.success) {
      throw new Error(`添加发现失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '研究发现添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加研究发现失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新研究笔记
 * @param {string} taskId - 任务ID
 * @param {string} notes - 笔记内容
 * @param {boolean} append - 是否追加
 * @returns {Promise<Object>} - 更新结果
 */
async function updateNotes(taskId, notes, append = true) {
  try {
    const result = await stateManager.updateNote(taskId, 'research', notes, append);
    
    if (!result.success) {
      throw new Error(`更新研究笔记失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '研究笔记更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `更新研究笔记失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取研究资料
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 资料列表
 */
async function getResources(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出资源类型的工件
    const resources = (state.artifacts.research || [])
      .filter(artifact => artifact.type === 'resource');
    
    return {
      success: true,
      message: '获取研究资源成功',
      resources
    };
  } catch (error) {
    return {
      success: false,
      message: `获取研究资源失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取研究发现
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 发现列表
 */
async function getFindings(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出发现类型的工件
    const findings = (state.artifacts.research || [])
      .filter(artifact => artifact.type === 'finding');
    
    return {
      success: true,
      message: '获取研究发现成功',
      findings
    };
  } catch (error) {
    return {
      success: false,
      message: `获取研究发现失败: ${error.message}`,
      error
    };
  }
}

/**
 * 生成研究总结
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 总结结果
 */
async function generateSummary(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取资源和发现
    const resources = (state.artifacts.research || [])
      .filter(artifact => artifact.type === 'resource');
    
    const findings = (state.artifacts.research || [])
      .filter(artifact => artifact.type === 'finding');
    
    // 简单的总结格式
    const summary = `
# 研究总结

## 研究资源
${resources.map(r => `- ${r.title}${r.url ? ` [链接](${r.url})` : ''}`).join('\n')}

## 关键发现
${findings.map(f => `### ${f.title}\n${f.description}`).join('\n\n')}

## 研究笔记
${state.notes.research || '暂无研究笔记'}
`;
    
    return {
      success: true,
      message: '研究总结生成成功',
      summary
    };
  } catch (error) {
    return {
      success: false,
      message: `生成研究总结失败: ${error.message}`,
      error
    };
  }
}

export {
  addResource,
  addFinding,
  updateNotes,
  getResources,
  getFindings,
  generateSummary
}; 
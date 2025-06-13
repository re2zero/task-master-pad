/**
 * RIPER-5 创新模式实现
 * 
 * 负责创新模式的特定操作和功能
 */

import * as stateManager from '../state-manager.js';
import * as taskFileManager from '../task-file.js';

/**
 * 添加创意
 * @param {string} taskId - 任务ID
 * @param {Object} idea - 创意信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addIdea(taskId, idea) {
  try {
    // 添加创意作为工件
    const artifact = {
      type: 'idea',
      title: idea.title,
      description: idea.description,
      potential: idea.potential || 'medium',
      feasibility: idea.feasibility || 'medium',
      tags: idea.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'innovate', artifact);
    
    if (!result.success) {
      throw new Error(`添加创意失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '创意添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加创意失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加方案
 * @param {string} taskId - 任务ID
 * @param {Object} solution - 方案信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addSolution(taskId, solution) {
  try {
    // 添加方案作为工件
    const artifact = {
      type: 'solution',
      title: solution.title,
      description: solution.description,
      pros: solution.pros || [],
      cons: solution.cons || [],
      priority: solution.priority || 'medium',
      tags: solution.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'innovate', artifact);
    
    if (!result.success) {
      throw new Error(`添加方案失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '方案添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加方案失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新创新笔记
 * @param {string} taskId - 任务ID
 * @param {string} notes - 笔记内容
 * @param {boolean} append - 是否追加
 * @returns {Promise<Object>} - 更新结果
 */
async function updateNotes(taskId, notes, append = true) {
  try {
    const result = await stateManager.updateNote(taskId, 'innovate', notes, append);
    
    if (!result.success) {
      throw new Error(`更新创新笔记失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '创新笔记更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `更新创新笔记失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取创意列表
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 创意列表
 */
async function getIdeas(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出创意类型的工件
    const ideas = (state.artifacts.innovate || [])
      .filter(artifact => artifact.type === 'idea');
    
    return {
      success: true,
      message: '获取创意列表成功',
      ideas
    };
  } catch (error) {
    return {
      success: false,
      message: `获取创意列表失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取方案列表
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 方案列表
 */
async function getSolutions(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出方案类型的工件
    const solutions = (state.artifacts.innovate || [])
      .filter(artifact => artifact.type === 'solution');
    
    return {
      success: true,
      message: '获取方案列表成功',
      solutions
    };
  } catch (error) {
    return {
      success: false,
      message: `获取方案列表失败: ${error.message}`,
      error
    };
  }
}

/**
 * 评估创意
 * @param {string} taskId - 任务ID
 * @param {number} ideaIndex - 创意索引
 * @param {Object} evaluation - 评估信息
 * @returns {Promise<Object>} - 评估结果
 */
async function evaluateIdea(taskId, ideaIndex, evaluation) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取创意
    const innovateArtifacts = state.artifacts.innovate || [];
    const ideas = innovateArtifacts.filter(artifact => artifact.type === 'idea');
    
    if (ideaIndex < 0 || ideaIndex >= ideas.length) {
      throw new Error(`无效的创意索引: ${ideaIndex}`);
    }
    
    // 找到原始索引
    const originalIndex = innovateArtifacts.findIndex(
      artifact => artifact === ideas[ideaIndex]
    );
    
    if (originalIndex === -1) {
      throw new Error('无法找到创意的原始索引');
    }
    
    // 更新评估
    const updatedArtifacts = [...innovateArtifacts];
    updatedArtifacts[originalIndex] = {
      ...updatedArtifacts[originalIndex],
      evaluation: {
        score: evaluation.score,
        comments: evaluation.comments,
        timestamp: new Date().toISOString()
      }
    };
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, {
      artifacts: {
        ...state.artifacts,
        innovate: updatedArtifacts
      }
    });
    
    if (!updateResult.success) {
      throw new Error(`更新创意评估失败: ${updateResult.message}`);
    }
    
    return {
      success: true,
      message: '创意评估更新成功',
      idea: updatedArtifacts[originalIndex]
    };
  } catch (error) {
    return {
      success: false,
      message: `评估创意失败: ${error.message}`,
      error
    };
  }
}

/**
 * 生成创新总结
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 总结结果
 */
async function generateSummary(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取创意和方案
    const ideas = (state.artifacts.innovate || [])
      .filter(artifact => artifact.type === 'idea');
    
    const solutions = (state.artifacts.innovate || [])
      .filter(artifact => artifact.type === 'solution');
    
    // 找出评分最高的创意
    const topIdeas = [...ideas]
      .filter(idea => idea.evaluation && idea.evaluation.score)
      .sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0))
      .slice(0, 3);
    
    // 简单的总结格式
    const summary = `
# 创新总结

## 创意概览
总计创意数: ${ideas.length}
优先方案数: ${solutions.length}

## 评分最高的创意
${topIdeas.length > 0 
  ? topIdeas.map(i => `### ${i.title} (评分: ${i.evaluation?.score || 'N/A'})\n${i.description}`).join('\n\n')
  : '暂无评分创意'}

## 优先方案
${solutions.map(s => `### ${s.title}\n${s.description}\n\n**优点:**\n${s.pros.map(p => `- ${p}`).join('\n')}\n\n**缺点:**\n${s.cons.map(c => `- ${c}`).join('\n')}`).join('\n\n')}

## 创新笔记
${state.notes.innovate || '暂无创新笔记'}
`;
    
    return {
      success: true,
      message: '创新总结生成成功',
      summary
    };
  } catch (error) {
    return {
      success: false,
      message: `生成创新总结失败: ${error.message}`,
      error
    };
  }
}

export {
  addIdea,
  addSolution,
  updateNotes,
  getIdeas,
  getSolutions,
  evaluateIdea,
  generateSummary
}; 
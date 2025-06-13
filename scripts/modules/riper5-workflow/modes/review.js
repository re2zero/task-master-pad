/**
 * RIPER-5 审查模式实现
 * 
 * 负责审查模式的特定操作和功能
 */

import * as stateManager from '../state-manager.js';
import * as taskFileManager from '../task-file.js';

/**
 * 添加审查评论
 * @param {string} taskId - 任务ID
 * @param {Object} comment - 评论信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addComment(taskId, comment) {
  try {
    // 添加评论作为工件
    const artifact = {
      type: 'comment',
      title: comment.title,
      content: comment.content,
      category: comment.category || 'general',
      severity: comment.severity || 'info',
      location: comment.location, // 可以是文件路径+行号等
      timestamp: new Date().toISOString(),
      author: comment.author,
      resolved: false,
      tags: comment.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'review', artifact);
    
    if (!result.success) {
      throw new Error(`添加评论失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '评论添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加评论失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加审查问题
 * @param {string} taskId - 任务ID
 * @param {Object} issue - 问题信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addIssue(taskId, issue) {
  try {
    // 添加问题作为工件
    const artifact = {
      type: 'issue',
      title: issue.title,
      description: issue.description,
      category: issue.category || 'bug',
      severity: issue.severity || 'medium',
      reproducible: issue.reproducible !== undefined ? issue.reproducible : true,
      steps: issue.steps || [],
      status: 'open',
      assignee: issue.assignee,
      timestamp: new Date().toISOString(),
      tags: issue.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'review', artifact);
    
    if (!result.success) {
      throw new Error(`添加审查问题失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '审查问题添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加审查问题失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新审查笔记
 * @param {string} taskId - 任务ID
 * @param {string} notes - 笔记内容
 * @param {boolean} append - 是否追加
 * @returns {Promise<Object>} - 更新结果
 */
async function updateNotes(taskId, notes, append = true) {
  try {
    const result = await stateManager.updateNote(taskId, 'review', notes, append);
    
    if (!result.success) {
      throw new Error(`更新审查笔记失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '审查笔记更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `更新审查笔记失败: ${error.message}`,
      error
    };
  }
}

/**
 * 解决评论
 * @param {string} taskId - 任务ID
 * @param {number} commentIndex - 评论索引
 * @param {string} resolution - 解决说明
 * @returns {Promise<Object>} - 更新结果
 */
async function resolveComment(taskId, commentIndex, resolution) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取评论
    const reviewArtifacts = state.artifacts.review || [];
    const comments = reviewArtifacts.filter(artifact => artifact.type === 'comment');
    
    if (commentIndex < 0 || commentIndex >= comments.length) {
      throw new Error(`无效的评论索引: ${commentIndex}`);
    }
    
    // 找到原始索引
    const originalIndex = reviewArtifacts.findIndex(
      artifact => artifact === comments[commentIndex]
    );
    
    if (originalIndex === -1) {
      throw new Error('无法找到评论的原始索引');
    }
    
    // 更新评论状态
    const updatedArtifacts = [...reviewArtifacts];
    updatedArtifacts[originalIndex] = {
      ...updatedArtifacts[originalIndex],
      resolved: true,
      resolution,
      resolvedAt: new Date().toISOString()
    };
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, {
      artifacts: {
        ...state.artifacts,
        review: updatedArtifacts
      }
    });
    
    if (!updateResult.success) {
      throw new Error(`解决评论失败: ${updateResult.message}`);
    }
    
    return {
      success: true,
      message: '评论已标记为已解决',
      comment: updatedArtifacts[originalIndex]
    };
  } catch (error) {
    return {
      success: false,
      message: `解决评论失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新问题状态
 * @param {string} taskId - 任务ID
 * @param {number} issueIndex - 问题索引
 * @param {Object} update - 更新信息
 * @returns {Promise<Object>} - 更新结果
 */
async function updateIssueStatus(taskId, issueIndex, update) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取问题
    const reviewArtifacts = state.artifacts.review || [];
    const issues = reviewArtifacts.filter(artifact => artifact.type === 'issue');
    
    if (issueIndex < 0 || issueIndex >= issues.length) {
      throw new Error(`无效的问题索引: ${issueIndex}`);
    }
    
    // 找到原始索引
    const originalIndex = reviewArtifacts.findIndex(
      artifact => artifact === issues[issueIndex]
    );
    
    if (originalIndex === -1) {
      throw new Error('无法找到问题的原始索引');
    }
    
    // 验证状态有效性
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed', 'wontfix'];
    if (update.status && !validStatuses.includes(update.status)) {
      throw new Error(`无效的问题状态: ${update.status}`);
    }
    
    // 更新问题
    const updatedArtifacts = [...reviewArtifacts];
    updatedArtifacts[originalIndex] = {
      ...updatedArtifacts[originalIndex],
      status: update.status || updatedArtifacts[originalIndex].status,
      resolution: update.resolution !== undefined ? update.resolution : updatedArtifacts[originalIndex].resolution,
      assignee: update.assignee !== undefined ? update.assignee : updatedArtifacts[originalIndex].assignee,
      lastUpdated: new Date().toISOString()
    };
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, {
      artifacts: {
        ...state.artifacts,
        review: updatedArtifacts
      }
    });
    
    if (!updateResult.success) {
      throw new Error(`更新问题状态失败: ${updateResult.message}`);
    }
    
    return {
      success: true,
      message: `问题状态已更新`,
      issue: updatedArtifacts[originalIndex]
    };
  } catch (error) {
    return {
      success: false,
      message: `更新问题状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取评论列表
 * @param {string} taskId - 任务ID
 * @param {boolean} includeResolved - 是否包含已解决的评论
 * @returns {Promise<Object>} - 评论列表
 */
async function getComments(taskId, includeResolved = true) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出评论类型的工件
    let comments = (state.artifacts.review || [])
      .filter(artifact => artifact.type === 'comment');
    
    // 如果不包含已解决的评论，进一步过滤
    if (!includeResolved) {
      comments = comments.filter(comment => !comment.resolved);
    }
    
    return {
      success: true,
      message: '获取评论列表成功',
      comments
    };
  } catch (error) {
    return {
      success: false,
      message: `获取评论列表失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取问题列表
 * @param {string} taskId - 任务ID
 * @param {string} status - 过滤状态
 * @returns {Promise<Object>} - 问题列表
 */
async function getIssues(taskId, status = null) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出问题类型的工件
    let issues = (state.artifacts.review || [])
      .filter(artifact => artifact.type === 'issue');
    
    // 如果指定了状态，进一步过滤
    if (status) {
      issues = issues.filter(issue => issue.status === status);
    }
    
    return {
      success: true,
      message: '获取问题列表成功',
      issues
    };
  } catch (error) {
    return {
      success: false,
      message: `获取问题列表失败: ${error.message}`,
      error
    };
  }
}

/**
 * 添加审查检查点
 * @param {string} taskId - 任务ID
 * @param {Object} checkpoint - 检查点信息
 * @returns {Promise<Object>} - 添加结果
 */
async function addCheckpoint(taskId, checkpoint) {
  try {
    // 添加检查点作为工件
    const artifact = {
      type: 'checkpoint',
      title: checkpoint.title,
      description: checkpoint.description,
      category: checkpoint.category || 'quality',
      status: checkpoint.status || 'pending',
      criteria: checkpoint.criteria || [],
      timestamp: new Date().toISOString(),
      tags: checkpoint.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'review', artifact);
    
    if (!result.success) {
      throw new Error(`添加检查点失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '检查点添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加检查点失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新检查点状态
 * @param {string} taskId - 任务ID
 * @param {number} checkpointIndex - 检查点索引
 * @param {string} status - 新状态
 * @param {string} notes - 说明
 * @returns {Promise<Object>} - 更新结果
 */
async function updateCheckpointStatus(taskId, checkpointIndex, status, notes = '') {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取检查点
    const reviewArtifacts = state.artifacts.review || [];
    const checkpoints = reviewArtifacts.filter(artifact => artifact.type === 'checkpoint');
    
    if (checkpointIndex < 0 || checkpointIndex >= checkpoints.length) {
      throw new Error(`无效的检查点索引: ${checkpointIndex}`);
    }
    
    // 找到原始索引
    const originalIndex = reviewArtifacts.findIndex(
      artifact => artifact === checkpoints[checkpointIndex]
    );
    
    if (originalIndex === -1) {
      throw new Error('无法找到检查点的原始索引');
    }
    
    // 验证状态有效性
    const validStatuses = ['pending', 'passed', 'failed', 'waived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的检查点状态: ${status}`);
    }
    
    // 更新检查点
    const updatedArtifacts = [...reviewArtifacts];
    updatedArtifacts[originalIndex] = {
      ...updatedArtifacts[originalIndex],
      status,
      notes,
      updatedAt: new Date().toISOString()
    };
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, {
      artifacts: {
        ...state.artifacts,
        review: updatedArtifacts
      }
    });
    
    if (!updateResult.success) {
      throw new Error(`更新检查点状态失败: ${updateResult.message}`);
    }
    
    return {
      success: true,
      message: `检查点状态已更新为 ${status}`,
      checkpoint: updatedArtifacts[originalIndex]
    };
  } catch (error) {
    return {
      success: false,
      message: `更新检查点状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 生成审查总结
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 总结结果
 */
async function generateSummary(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取评论、问题和检查点
    const comments = (state.artifacts.review || [])
      .filter(artifact => artifact.type === 'comment');
    
    const issues = (state.artifacts.review || [])
      .filter(artifact => artifact.type === 'issue');
    
    const checkpoints = (state.artifacts.review || [])
      .filter(artifact => artifact.type === 'checkpoint');
    
    // 计算评论状态统计
    const commentStats = {
      total: comments.length,
      resolved: comments.filter(c => c.resolved).length,
      unresolved: comments.filter(c => !c.resolved).length
    };
    
    // 计算问题状态统计
    const issueStats = {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in-progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      closed: issues.filter(i => i.status === 'closed').length,
      wontfix: issues.filter(i => i.status === 'wontfix').length
    };
    
    // 计算检查点状态统计
    const checkpointStats = {
      total: checkpoints.length,
      passed: checkpoints.filter(c => c.status === 'passed').length,
      failed: checkpoints.filter(c => c.status === 'failed').length,
      pending: checkpoints.filter(c => c.status === 'pending').length,
      waived: checkpoints.filter(c => c.status === 'waived').length
    };
    
    // 检查是否所有必要的检查点都已通过
    const passRate = checkpointStats.total > 0 
      ? (checkpointStats.passed + checkpointStats.waived) / checkpointStats.total * 100 
      : 0;
    
    // 简单的总结格式
    const summary = `
# 审查总结

## 审查状态
- 总体状态: ${passRate === 100 ? '✅ 全部通过' : `⚠️ 部分通过 (${passRate.toFixed(1)}%)`}
- 未解决评论: ${commentStats.unresolved}
- 未关闭问题: ${issueStats.open + issueStats.inProgress}

## 检查点统计
- 总检查点: ${checkpointStats.total}
- 已通过: ${checkpointStats.passed} (${checkpointStats.total > 0 ? (checkpointStats.passed / checkpointStats.total * 100).toFixed(1) : 0}%)
- 未通过: ${checkpointStats.failed}
- 待检查: ${checkpointStats.pending}
- 已豁免: ${checkpointStats.waived}

## 评论统计
- 总评论数: ${commentStats.total}
- 已解决: ${commentStats.resolved}
- 未解决: ${commentStats.unresolved}

## 问题统计
- 总问题数: ${issueStats.total}
- 未解决: ${issueStats.open}
- 处理中: ${issueStats.inProgress}
- 已解决: ${issueStats.resolved}
- 已关闭: ${issueStats.closed}
- 不修复: ${issueStats.wontfix}

## 关键问题
${issues.filter(i => i.severity === 'high' && i.status !== 'closed').map(i => `### ${i.title} (${i.status})\n${i.description}`).join('\n\n') || '无待处理的高优先级问题'}

## 检查点详情
${checkpoints.map(c => `### ${c.title} (${c.status})\n${c.description}\n\n**标准:**\n${c.criteria.map(cr => `- ${cr}`).join('\n')}\n\n${c.notes ? `**备注:** ${c.notes}` : ''}`).join('\n\n')}

## 审查笔记
${state.notes.review || '暂无审查笔记'}
`;
    
    return {
      success: true,
      message: '审查总结生成成功',
      summary,
      passRate
    };
  } catch (error) {
    return {
      success: false,
      message: `生成审查总结失败: ${error.message}`,
      error
    };
  }
}

export {
  addComment,
  addIssue,
  updateNotes,
  resolveComment,
  updateIssueStatus,
  getComments,
  getIssues,
  addCheckpoint,
  updateCheckpointStatus,
  generateSummary
}; 
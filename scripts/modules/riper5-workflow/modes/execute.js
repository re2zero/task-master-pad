/**
 * RIPER-5 执行模式实现
 * 
 * 负责执行模式的特定操作和功能
 */

import * as stateManager from '../state-manager.js';
import * as taskFileManager from '../task-file.js';

/**
 * 记录进度更新
 * @param {string} taskId - 任务ID
 * @param {Object} progress - 进度更新信息
 * @returns {Promise<Object>} - 更新结果
 */
async function logProgress(taskId, progress) {
  try {
    // 添加进度记录作为工件
    const artifact = {
      type: 'progress',
      title: progress.title,
      description: progress.description,
      completionPercentage: progress.completionPercentage || 0,
      workItems: progress.workItems || [],
      blockers: progress.blockers || [],
      timestamp: new Date().toISOString(),
      tags: progress.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'execute', artifact);
    
    if (!result.success) {
      throw new Error(`添加进度记录失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '进度记录添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加进度记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 记录执行问题
 * @param {string} taskId - 任务ID
 * @param {Object} issue - 问题信息
 * @returns {Promise<Object>} - 添加结果
 */
async function logIssue(taskId, issue) {
  try {
    // 添加问题作为工件
    const artifact = {
      type: 'issue',
      title: issue.title,
      description: issue.description,
      severity: issue.severity || 'medium',
      status: issue.status || 'open',
      steps: issue.steps || [],
      resolution: issue.resolution || '',
      timestamp: new Date().toISOString(),
      tags: issue.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'execute', artifact);
    
    if (!result.success) {
      throw new Error(`添加执行问题记录失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '执行问题记录添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加执行问题记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新执行笔记
 * @param {string} taskId - 任务ID
 * @param {string} notes - 笔记内容
 * @param {boolean} append - 是否追加
 * @returns {Promise<Object>} - 更新结果
 */
async function updateNotes(taskId, notes, append = true) {
  try {
    const result = await stateManager.updateNote(taskId, 'execute', notes, append);
    
    if (!result.success) {
      throw new Error(`更新执行笔记失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '执行笔记更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `更新执行笔记失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取进度记录
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 进度记录列表
 */
async function getProgressLogs(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出进度记录类型的工件
    const progressLogs = (state.artifacts.execute || [])
      .filter(artifact => artifact.type === 'progress');
    
    return {
      success: true,
      message: '获取进度记录成功',
      progressLogs
    };
  } catch (error) {
    return {
      success: false,
      message: `获取进度记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取问题记录
 * @param {string} taskId - 任务ID
 * @param {string} status - 过滤状态
 * @returns {Promise<Object>} - 问题记录列表
 */
async function getIssues(taskId, status = null) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出问题记录类型的工件
    let issues = (state.artifacts.execute || [])
      .filter(artifact => artifact.type === 'issue');
    
    // 如果指定了状态，进一步过滤
    if (status) {
      issues = issues.filter(issue => issue.status === status);
    }
    
    return {
      success: true,
      message: '获取问题记录成功',
      issues
    };
  } catch (error) {
    return {
      success: false,
      message: `获取问题记录失败: ${error.message}`,
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
    
    // 获取问题记录
    const executeArtifacts = state.artifacts.execute || [];
    const issues = executeArtifacts.filter(artifact => artifact.type === 'issue');
    
    if (issueIndex < 0 || issueIndex >= issues.length) {
      throw new Error(`无效的问题索引: ${issueIndex}`);
    }
    
    // 找到原始索引
    const originalIndex = executeArtifacts.findIndex(
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
    const updatedArtifacts = [...executeArtifacts];
    updatedArtifacts[originalIndex] = {
      ...updatedArtifacts[originalIndex],
      status: update.status || updatedArtifacts[originalIndex].status,
      resolution: update.resolution !== undefined ? update.resolution : updatedArtifacts[originalIndex].resolution,
      lastUpdated: new Date().toISOString()
    };
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, {
      artifacts: {
        ...state.artifacts,
        execute: updatedArtifacts
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
 * 记录代码变更
 * @param {string} taskId - 任务ID
 * @param {Object} change - 变更信息
 * @returns {Promise<Object>} - 添加结果
 */
async function logCodeChange(taskId, change) {
  try {
    // 添加代码变更作为工件
    const artifact = {
      type: 'code-change',
      title: change.title,
      description: change.description,
      files: change.files || [],
      commitId: change.commitId,
      pullRequestUrl: change.pullRequestUrl,
      timestamp: new Date().toISOString(),
      tags: change.tags || []
    };
    
    const result = await stateManager.addArtifact(taskId, 'execute', artifact);
    
    if (!result.success) {
      throw new Error(`添加代码变更记录失败: ${result.message}`);
    }
    
    return {
      success: true,
      message: '代码变更记录添加成功',
      artifact
    };
  } catch (error) {
    return {
      success: false,
      message: `添加代码变更记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取代码变更记录
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 代码变更记录列表
 */
async function getCodeChanges(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 过滤出代码变更类型的工件
    const codeChanges = (state.artifacts.execute || [])
      .filter(artifact => artifact.type === 'code-change');
    
    return {
      success: true,
      message: '获取代码变更记录成功',
      codeChanges
    };
  } catch (error) {
    return {
      success: false,
      message: `获取代码变更记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 生成执行总结
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} - 总结结果
 */
async function generateSummary(taskId) {
  try {
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 获取进度记录、问题和代码变更
    const progressLogs = (state.artifacts.execute || [])
      .filter(artifact => artifact.type === 'progress');
    
    const issues = (state.artifacts.execute || [])
      .filter(artifact => artifact.type === 'issue');
    
    const codeChanges = (state.artifacts.execute || [])
      .filter(artifact => artifact.type === 'code-change');
    
    // 计算问题状态统计
    const issueStats = {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in-progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      closed: issues.filter(i => i.status === 'closed').length,
      wontfix: issues.filter(i => i.status === 'wontfix').length
    };
    
    // 获取最近的进度更新
    const latestProgress = progressLogs.length > 0 
      ? progressLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
      : null;
    
    // 简单的总结格式
    const summary = `
# 执行总结

## 当前进度
${latestProgress 
  ? `- 最新进度: ${latestProgress.title} (${latestProgress.completionPercentage}%)\n- 更新时间: ${new Date(latestProgress.timestamp).toLocaleString()}\n- 详情: ${latestProgress.description}`
  : '暂无进度记录'}

## 问题统计
- 总问题数: ${issueStats.total}
- 未解决: ${issueStats.open}
- 处理中: ${issueStats.inProgress}
- 已解决: ${issueStats.resolved}
- 已关闭: ${issueStats.closed}
- 不修复: ${issueStats.wontfix}

## 关键问题
${issues.filter(i => i.severity === 'high').map(i => `### ${i.title} (${i.status})\n${i.description}\n\n${i.resolution ? `**解决方案:** ${i.resolution}` : '**尚未解决**'}`).join('\n\n') || '无高优先级问题'}

## 代码变更
${codeChanges.map(c => `### ${c.title}\n${c.description}\n\n**修改文件:**\n${c.files.map(f => `- ${f}`).join('\n')}\n\n${c.commitId ? `**提交ID:** ${c.commitId}` : ''}\n${c.pullRequestUrl ? `**PR链接:** ${c.pullRequestUrl}` : ''}`).join('\n\n') || '暂无代码变更记录'}

## 执行笔记
${state.notes.execute || '暂无执行笔记'}
`;
    
    return {
      success: true,
      message: '执行总结生成成功',
      summary
    };
  } catch (error) {
    return {
      success: false,
      message: `生成执行总结失败: ${error.message}`,
      error
    };
  }
}

export {
  logProgress,
  logIssue,
  updateNotes,
  getProgressLogs,
  getIssues,
  updateIssueStatus,
  logCodeChange,
  getCodeChanges,
  generateSummary
}; 
/**
 * RIPER-5 工作流模式历史记录管理模块
 * 
 * 提供模式转换历史的详细跟踪、分析和导出功能
 */

import path from 'path';
import fs from 'fs/promises';
import * as config from './config.js';
import { getState, saveState } from './state-manager.js';

/**
 * 初始化历史记录管理器
 * @param {Object} options - 初始化选项
 * @returns {Promise<Object>} - 初始化结果
 */
async function initialize(options = {}) {
  try {
    const cfg = config.getConfig();
    
    // 确保历史记录目录存在
    const historyDir = path.join(options.projectRoot || process.cwd(), '.taskmaster/riper5-history');
    await fs.mkdir(historyDir, { recursive: true });
    
    return {
      success: true,
      message: 'RIPER-5历史记录管理器初始化成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5历史记录管理器初始化失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取任务的完整模式历史记录
 * @param {string} taskId - 任务ID
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} - 历史记录结果
 */
async function getFullHistory(taskId, projectRoot) {
  try {
    // 获取当前状态
    const { success, state } = await getState(taskId, projectRoot);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }
    
    // 提取模式历史记录
    const history = state.modeHistory || [];
    
    // 计算每个模式的使用时间
    const modeTimeSpent = calculateModeTimeSpent(history);
    
    // 计算模式转换统计
    const transitionStats = calculateTransitionStats(history);
    
    return {
      success: true,
      message: `获取任务 #${taskId} 的历史记录成功`,
      history: {
        entries: history,
        summary: {
          totalTransitions: history.length - 1,
          currentMode: state.currentMode,
          timeInCurrentMode: calculateTimeInCurrentMode(history),
          modeTimeSpent,
          transitionStats,
          mostUsedMode: findMostUsedMode(modeTimeSpent)
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `获取历史记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取任务的最近历史记录
 * @param {string} taskId - 任务ID
 * @param {number} limit - 限制返回的记录数
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} - 最近历史记录结果
 */
async function getRecentHistory(taskId, limit = 5, projectRoot) {
  try {
    const { success, history } = await getFullHistory(taskId, projectRoot);
    
    if (!success) {
      throw new Error(`无法获取任务 #${taskId} 的历史记录失败`);
    }
    
    // 获取最近的历史记录
    const recentEntries = [...history.entries].reverse().slice(0, limit);
    
    return {
      success: true,
      message: `获取任务 #${taskId} 的最近历史记录成功`,
      history: {
        entries: recentEntries,
        summary: history.summary
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `获取最近历史记录失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取模式使用趋势分析
 * @param {string} taskId - 任务ID
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} - 趋势分析结果
 */
async function getModeTrends(taskId, projectRoot) {
  try {
    const { success, history } = await getFullHistory(taskId, projectRoot);
    
    if (!success) {
      throw new Error(`获取任务 #${taskId} 的历史记录失败`);
    }
    
    // 获取模式使用趋势
    const modeSequence = history.entries.map(entry => entry.mode);
    const modeFrequency = {};
    modeSequence.forEach(mode => {
      modeFrequency[mode] = (modeFrequency[mode] || 0) + 1;
    });
    
    // 计算模式循环
    const modeCycles = identifyModeCycles(modeSequence);
    
    // 计算模式使用模式
    const modePatterns = identifyModePatterns(modeSequence);
    
    return {
      success: true,
      message: `获取任务 #${taskId} 的模式趋势分析成功`,
      trends: {
        modeFrequency,
        modeCycles,
        modePatterns,
        cycleCount: modeCycles.length,
        mostCommonPattern: modePatterns.length > 0 ? modePatterns[0] : null
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `获取模式趋势分析失败: ${error.message}`,
      error
    };
  }
}

/**
 * 导出历史记录报告
 * @param {string} taskId - 任务ID
 * @param {string} format - 导出格式 ('json', 'markdown', 'html')
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} - 导出结果
 */
async function exportHistoryReport(taskId, format = 'json', projectRoot) {
  try {
    // 获取完整历史记录
    const { success, history } = await getFullHistory(taskId, projectRoot);
    
    if (!success) {
      throw new Error(`获取任务 #${taskId} 的历史记录失败`);
    }
    
    // 获取趋势分析
    const { success: trendSuccess, trends } = await getModeTrends(taskId, projectRoot);
    
    if (!trendSuccess) {
      throw new Error(`获取任务 #${taskId} 的模式趋势失败`);
    }
    
    // 根据格式生成报告
    let report = '';
    const reportData = { history, trends };
    
    switch (format.toLowerCase()) {
      case 'json':
        report = JSON.stringify(reportData, null, 2);
        break;
      case 'markdown':
        report = generateMarkdownReport(taskId, reportData);
        break;
      case 'html':
        report = generateHtmlReport(taskId, reportData);
        break;
      default:
        throw new Error(`不支持的报告格式: ${format}`);
    }
    
    // 保存报告文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `riper5-history-report-${taskId}-${timestamp}.${getFileExtension(format)}`;
    const reportDir = path.join(projectRoot || process.cwd(), '.taskmaster/riper5-reports');
    await fs.mkdir(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, fileName);
    await fs.writeFile(reportPath, report, 'utf8');
    
    return {
      success: true,
      message: `历史记录报告导出成功: ${reportPath}`,
      reportPath,
      reportData
    };
  } catch (error) {
    return {
      success: false,
      message: `导出历史记录报告失败: ${error.message}`,
      error
    };
  }
}

/**
 * 为指定的历史记录条目添加评论
 * @param {string} taskId - 任务ID
 * @param {number} historyIndex - 历史记录条目的索引
 * @param {string} comment - 要添加的评论
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} - 操作结果
 */
async function addCommentToHistory(taskId, historyIndex, comment, projectRoot) {
  try {
    // 获取当前状态
    const { success, state, filePath } = await getState(taskId, projectRoot);

    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的状态`);
    }

    if (historyIndex < 0 || historyIndex >= state.modeHistory.length) {
      return { success: false, message: `无效的历史记录索引: ${historyIndex}` };
    }

    // 添加评论
    state.modeHistory[historyIndex].comment = comment;

    // 保存更新后的状态
    await saveState(taskId, state, projectRoot);

    return {
      success: true,
      message: '评论添加成功',
      state
    };
  } catch (error) {
    return {
      success: false,
      message: `添加历史记录注释失败: ${error.message}`,
      error
    };
  }
}

/**
 * 计算模式转换统计
 * @private
 */
function calculateTransitionStats(history) {
  const transitions = {};
  
  for (let i = 1; i < history.length; i++) {
    const fromMode = history[i - 1].mode;
    const toMode = history[i].mode;
    const transitionKey = `${fromMode} -> ${toMode}`;
    
    transitions[transitionKey] = (transitions[transitionKey] || 0) + 1;
  }
  
  return transitions;
}

/**
 * 计算每个模式的使用时间
 * @private
 */
function calculateModeTimeSpent(history) {
  const modeTimeSpent = {};
  
  for (let i = 0; i < history.length - 1; i++) {
    const mode = history[i].mode;
    const startTime = new Date(history[i].timestamp);
    const endTime = new Date(history[i + 1].timestamp);
    const timeSpent = endTime - startTime; // 毫秒
    
    modeTimeSpent[mode] = (modeTimeSpent[mode] || 0) + timeSpent;
  }
  
  // 处理最后一个模式（仍在进行中）
  if (history.length > 0) {
    const lastMode = history[history.length - 1].mode;
    const startTime = new Date(history[history.length - 1].timestamp);
    const now = new Date();
    const timeSpent = now - startTime; // 毫秒
    
    modeTimeSpent[lastMode] = (modeTimeSpent[lastMode] || 0) + timeSpent;
  }
  
  return modeTimeSpent;
}

/**
 * 计算当前模式使用时间
 * @private
 */
function calculateTimeInCurrentMode(history) {
  if (history.length === 0) {
    return 0;
  }
  
  const lastEntry = history[history.length - 1];
  const startTime = new Date(lastEntry.timestamp);
  const now = new Date();
  
  return now - startTime; // 毫秒
}

/**
 * 查找使用时间最长的模式
 * @private
 */
function findMostUsedMode(modeTimeSpent) {
  let mostUsedMode = null;
  let maxTime = 0;
  
  for (const [mode, time] of Object.entries(modeTimeSpent)) {
    if (time > maxTime) {
      maxTime = time;
      mostUsedMode = mode;
    }
  }
  
  return mostUsedMode;
}

/**
 * 识别模式循环
 * @private
 */
function identifyModeCycles(modeSequence) {
  const cycles = [];
  const seenPatterns = new Set();
  
  // 尝试查找长度为2到5的循环
  for (let cycleLength = 2; cycleLength <= 5; cycleLength++) {
    for (let i = 0; i <= modeSequence.length - 2 * cycleLength; i++) {
      const pattern = modeSequence.slice(i, i + cycleLength);
      const patternStr = pattern.join(',');
      
      // 检查这个模式是否重复出现
      const nextPattern = modeSequence.slice(i + cycleLength, i + 2 * cycleLength);
      const nextPatternStr = nextPattern.join(',');
      
      if (patternStr === nextPatternStr && !seenPatterns.has(patternStr)) {
        cycles.push({
          pattern,
          startIndex: i,
          length: cycleLength
        });
        seenPatterns.add(patternStr);
      }
    }
  }
  
  return cycles;
}

/**
 * 识别模式使用模式
 * @private
 */
function identifyModePatterns(modeSequence) {
  const patterns = [];
  const patternCounts = {};
  
  // 查找长度为2到3的模式
  for (let patternLength = 2; patternLength <= 3; patternLength++) {
    for (let i = 0; i <= modeSequence.length - patternLength; i++) {
      const pattern = modeSequence.slice(i, i + patternLength);
      const patternStr = pattern.join(',');
      
      patternCounts[patternStr] = (patternCounts[patternStr] || 0) + 1;
    }
  }
  
  // 排序并返回最常见的模式
  const sortedPatterns = Object.entries(patternCounts)
    .filter(([_, count]) => count > 1) // 只考虑出现多次的模式
    .sort((a, b) => b[1] - a[1]) // 按出现次数降序排序
    .map(([pattern, count]) => ({
      pattern: pattern.split(','),
      occurrences: count
    }));
  
  return sortedPatterns;
}

/**
 * 生成Markdown格式的历史报告
 * @private
 */
function generateMarkdownReport(taskId, reportData) {
  const { history, trends } = reportData;
  
  let report = `# RIPER-5工作流历史报告 - 任务 #${taskId}\n\n`;
  
  // 添加总结部分
  report += `## 总体摘要\n\n`;
  report += `- **当前模式**: ${history.summary.currentMode}\n`;
  report += `- **当前模式持续时间**: ${formatDuration(history.summary.timeInCurrentMode)}\n`;
  report += `- **总模式转换次数**: ${history.summary.totalTransitions}\n`;
  report += `- **使用时间最长的模式**: ${history.summary.mostUsedMode || '无'}\n\n`;
  
  // 添加模式使用时间
  report += `## 模式使用时间\n\n`;
  for (const [mode, time] of Object.entries(history.summary.modeTimeSpent)) {
    report += `- **${mode}**: ${formatDuration(time)}\n`;
  }
  report += `\n`;
  
  // 添加模式转换统计
  report += `## 模式转换统计\n\n`;
  for (const [transition, count] of Object.entries(history.summary.transitionStats)) {
    report += `- **${transition}**: ${count} 次\n`;
  }
  report += `\n`;
  
  // 添加模式循环
  report += `## 模式循环\n\n`;
  if (trends.modeCycles.length === 0) {
    report += `未检测到明显的模式循环。\n\n`;
  } else {
    trends.modeCycles.forEach((cycle, index) => {
      report += `### 循环 ${index + 1}\n\n`;
      report += `- **模式**: ${cycle.pattern.join(' -> ')}\n`;
      report += `- **起始索引**: ${cycle.startIndex}\n`;
      report += `- **循环长度**: ${cycle.length}\n\n`;
    });
  }
  
  // 添加常见模式
  report += `## 常见模式组合\n\n`;
  if (trends.modePatterns.length === 0) {
    report += `未检测到频繁出现的模式组合。\n\n`;
  } else {
    trends.modePatterns.forEach((pattern, index) => {
      report += `- **组合 ${index + 1}**: ${pattern.pattern.join(' -> ')} (出现 ${pattern.occurrences} 次)\n`;
    });
  }
  report += `\n`;
  
  // 添加完整历史记录
  report += `## 完整历史记录\n\n`;
  history.entries.forEach((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleString();
    report += `### ${index + 1}. ${entry.mode} (${date})\n\n`;
    report += `${entry.note || '无附注'}\n\n`;
    if (entry.comment) {
      report += `**评论**: ${entry.comment}\n\n`;
    }
  });
  
  return report;
}

/**
 * 生成HTML格式的历史报告
 * @private
 */
function generateHtmlReport(taskId, reportData) {
  const { history, trends } = reportData;
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>RIPER-5工作流历史报告 - 任务 #${taskId}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #444; margin-top: 20px; }
    h3 { color: #555; }
    .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
    .history-entry { border-left: 3px solid #ddd; padding-left: 15px; margin: 10px 0; }
    .mode-research { border-left-color: #4285f4; }
    .mode-innovate { border-left-color: #ea4335; }
    .mode-plan { border-left-color: #fbbc05; }
    .mode-execute { border-left-color: #34a853; }
    .mode-review { border-left-color: #9c27b0; }
    .note { font-style: italic; }
    .comment { color: #666; margin-top: 5px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>RIPER-5工作流历史报告 - 任务 #${taskId}</h1>
  
  <h2>总体摘要</h2>
  <div class="summary">
    <p><strong>当前模式:</strong> ${history.summary.currentMode}</p>
    <p><strong>当前模式持续时间:</strong> ${formatDuration(history.summary.timeInCurrentMode)}</p>
    <p><strong>总模式转换次数:</strong> ${history.summary.totalTransitions}</p>
    <p><strong>使用时间最长的模式:</strong> ${history.summary.mostUsedMode || '无'}</p>
  </div>
  
  <h2>模式使用时间</h2>
  <table>
    <tr>
      <th>模式</th>
      <th>使用时间</th>
    </tr>`;
  
  for (const [mode, time] of Object.entries(history.summary.modeTimeSpent)) {
    html += `
    <tr>
      <td>${mode}</td>
      <td>${formatDuration(time)}</td>
    </tr>`;
  }
  
  html += `
  </table>
  
  <h2>模式转换统计</h2>
  <table>
    <tr>
      <th>转换路径</th>
      <th>次数</th>
    </tr>`;
  
  for (const [transition, count] of Object.entries(history.summary.transitionStats)) {
    html += `
    <tr>
      <td>${transition}</td>
      <td>${count}</td>
    </tr>`;
  }
  
  html += `
  </table>
  
  <h2>模式循环</h2>`;
  
  if (trends.modeCycles.length === 0) {
    html += `<p>未检测到明显的模式循环。</p>`;
  } else {
    trends.modeCycles.forEach((cycle, index) => {
      html += `
      <h3>循环 ${index + 1}</h3>
      <p><strong>模式:</strong> ${cycle.pattern.join(' -> ')}</p>
      <p><strong>起始索引:</strong> ${cycle.startIndex}</p>
      <p><strong>循环长度:</strong> ${cycle.length}</p>`;
    });
  }
  
  html += `
  <h2>常见模式组合</h2>`;
  
  if (trends.modePatterns.length === 0) {
    html += `<p>未检测到频繁出现的模式组合。</p>`;
  } else {
    html += `<ul>`;
    trends.modePatterns.forEach((pattern, index) => {
      html += `<li><strong>组合 ${index + 1}:</strong> ${pattern.pattern.join(' -> ')} (出现 ${pattern.occurrences} 次)</li>`;
    });
    html += `</ul>`;
  }
  
  html += `
  <h2>完整历史记录</h2>`;
  
  history.entries.forEach((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleString();
    html += `
    <div class="history-entry mode-${entry.mode}">
      <h3>${index + 1}. ${entry.mode} (${date})</h3>
      <p class="note">${entry.note || '无附注'}</p>`;
    
    if (entry.comment) {
      html += `<p class="comment"><strong>评论:</strong> ${entry.comment}</p>`;
    }
    
    html += `</div>`;
  });
  
  html += `
</body>
</html>`;
  
  return html;
}

/**
 * 获取文件扩展名
 * @private
 */
function getFileExtension(format) {
  switch (format.toLowerCase()) {
    case 'json': return 'json';
    case 'markdown': return 'md';
    case 'html': return 'html';
    default: return 'txt';
  }
}

/**
 * 格式化持续时间
 * @private
 */
function formatDuration(milliseconds) {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

export {
  initialize,
  getFullHistory,
  getRecentHistory,
  getModeTrends,
  exportHistoryReport,
  addCommentToHistory
}; 
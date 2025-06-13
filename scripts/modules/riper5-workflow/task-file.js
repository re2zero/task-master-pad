/**
 * RIPER-5 工作流任务文件管理模块
 * 
 * 负责创建、读取和更新与RIPER-5工作流相关的任务文件
 */

import path from 'path';
import fs from 'fs/promises';
import * as config from './config.js';
import { findProjectRoot } from '../utils.js';
import * as stateManager from './state-manager.js';
import * as modeManager from './mode-manager.js';
import * as research from './modes/research.js';
import * as innovate from './modes/innovate.js';
import * as plan from './modes/plan.js';
import * as execute from './modes/execute.js';
import * as review from './modes/review.js';

// 添加所需的导出工具库
import { marked } from 'marked';
import * as diff from 'diff';

// 模式模块映射
const modeModules = {
  research,
  innovate,
  plan,
  execute,
  review
};

// 默认模板内容
const DEFAULT_TEMPLATES = {
  research: `# {{taskTitle}} - 研究模式

## 研究概述
*收集和分析信息，识别问题和机会*

### 研究目标
- 

### 收集的信息
- 

### 分析
- 

### 关键问题与机会
- 

### 结论与见解
- 

## 检查清单
{{checklistItems}}
`,
  
  innovate: `# {{taskTitle}} - 创新模式

## 创新概述
*提出创新思路和解决方案*

### 创新目标
- 

### 潜在解决方案
1. 
2. 
3. 

### 方案评估
| 方案 | 可行性 | 优势 | 劣势 | 创新程度 |
|------|--------|------|------|----------|
|      |        |      |      |          |
|      |        |      |      |          |
|      |        |      |      |          |

### 选择的创新路径
- 

### 创新过程记录
- 

## 检查清单
{{checklistItems}}
`,
  
  plan: `# {{taskTitle}} - 计划模式

## 计划概述
*制定详细的执行计划*

### 目标与成功标准
- 

### 任务分解
1. 
   - 
   - 
2. 
   - 
   - 
3. 
   - 
   - 

### 时间表与里程碑
- [ ] 
- [ ] 
- [ ] 

### 资源分配
- 

### 风险分析与缓解策略
| 风险 | 可能性 | 影响 | 缓解策略 |
|------|--------|------|----------|
|      |        |      |          |
|      |        |      |          |

## 检查清单
{{checklistItems}}
`,
  
  execute: `# {{taskTitle}} - 执行模式

## 执行概述
*实施计划并监控进度*

### 执行状态
- 开始时间: {{startDate}}
- 当前进度: 

### 进度追踪
| 任务 | 状态 | 开始日期 | 完成日期 | 备注 |
|------|------|----------|----------|------|
|      |      |          |          |      |
|      |      |          |          |      |
|      |      |          |          |      |

### 遇到的问题与解决方案
- 

### 沟通记录
- 

## 检查清单
{{checklistItems}}
`,
  
  review: `# {{taskTitle}} - 审查模式

## 审查概述
*评估结果和总结经验*

### 目标达成情况
- 

### 反馈收集
- 

### 成功因素
- 

### 需要改进的地方
- 

### 经验教训
- 

## 检查清单
{{checklistItems}}
`
};

// 添加HTML导出模板
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    h2 {
      color: #3498db;
      margin-top: 30px;
    }
    h3 {
      color: #2980b9;
      margin-top: 20px;
    }
    code {
      background-color: #f8f8f8;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background-color: #f8f8f8;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    blockquote {
      background-color: #f9f9f9;
      border-left: 4px solid #ccc;
      margin: 1.5em 10px;
      padding: 0.5em 10px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    .task-meta {
      background-color: #f8f8f8;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 0.9em;
    }
    .checklist-item {
      margin: 5px 0;
    }
    .checklist-item.completed {
      text-decoration: line-through;
      color: #7f8c8d;
    }
    .mode-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      color: white;
      font-size: 0.8em;
      margin-right: 10px;
    }
    .mode-research { background-color: #3498db; }
    .mode-innovate { background-color: #9b59b6; }
    .mode-plan { background-color: #2ecc71; }
    .mode-execute { background-color: #e67e22; }
    .mode-review { background-color: #e74c3c; }
    @media print {
      body {
        max-width: none;
        padding: 0;
        font-size: 12pt;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="task-meta">
    <span class="mode-badge mode-{{mode}}">{{mode}}</span>
    任务ID: {{taskId}} | 导出日期: {{exportDate}}
  </div>
  {{content}}
</body>
</html>
`;

/**
 * 初始化任务文件管理器
 * @param {Object} options - 初始化选项
 * @returns {Promise<Object>} - 初始化结果
 */
async function initialize(options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const cfg = config.getConfig();
    
    // 确保模板目录存在
    const templatesDir = path.join(projectRoot, cfg.paths.templatesDir);
    await fs.mkdir(templatesDir, { recursive: true });
    
    // 如果配置中启用了自动创建模板，则创建默认模板
    if (cfg.settings.autoCreateTemplates) {
      await createDefaultTemplates(templatesDir);
    }
    
    // 确保导出目录存在
    const exportDir = path.join(projectRoot, '.taskmaster/exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    return {
      success: true,
      message: 'RIPER-5任务文件管理器初始化成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5任务文件管理器初始化失败: ${error.message}`,
      error
    };
  }
}

/**
 * 创建默认模板文件
 * @private
 */
async function createDefaultTemplates(templatesDir) {
  try {
    const cfg = config.getConfig();
    
    // 为每个模式创建默认模板
    for (const [mode, templateContent] of Object.entries(DEFAULT_TEMPLATES)) {
      const templateFileName = cfg.paths.defaultTemplates[mode];
      const templatePath = path.join(templatesDir, templateFileName);
      
      try {
        // 检查模板文件是否存在
        await fs.access(templatePath);
      } catch (error) {
        // 如果文件不存在，则创建默认模板
        if (error.code === 'ENOENT') {
          await fs.writeFile(templatePath, templateContent, 'utf8');
        } else {
          throw error;
        }
      }
    }
    
    return {
      success: true,
      message: '默认模板创建成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `创建默认模板失败: ${error.message}`,
      error
    };
  }
}

/**
 * 创建RIPER-5任务文件
 * @param {Object} task - 任务信息
 * @param {string} mode - RIPER-5模式
 * @param {Object} options - 创建选项
 * @returns {Promise<Object>} - 创建结果
 */
async function createTaskFile(task, mode, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const cfg = config.getConfig();
    
    // 任务信息
    const { id: taskId, title: taskTitle } = task;
    
    // 获取任务的RIPER-5状态
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的RIPER-5状态`);
    }
    
    // 构建文件名
    const fileName = `task-${taskId}-${mode}.md`;
    const outputDir = path.join(projectRoot, '.taskmaster/tasks/riper5');
    const filePath = path.join(outputDir, fileName);
    
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });
    
    // 读取模板
    const templateFileName = cfg.paths.defaultTemplates[mode];
    const templatePath = path.join(projectRoot, cfg.paths.templatesDir, templateFileName);
    let templateContent;
    
    try {
      templateContent = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // 如果模板文件不存在，使用默认模板
      templateContent = DEFAULT_TEMPLATES[mode];
    }
    
    // 准备检查清单项
    let checklistContent = '';
    const checklistItems = state.checklistProgress[mode] || [];
    checklistItems.forEach((item, index) => {
      const checkmark = item.completed ? 'x' : ' ';
      checklistContent += `- [${checkmark}] ${item.text}\n`;
    });
    
    // 替换模板变量
    const content = templateContent
      .replace(/{{taskId}}/g, taskId)
      .replace(/{{taskTitle}}/g, taskTitle)
      .replace(/{{mode}}/g, mode)
      .replace(/{{checklistItems}}/g, checklistContent)
      .replace(/{{startDate}}/g, new Date().toISOString().split('T')[0])
      .replace(/{{notes}}/g, state.notes[mode] || '');
    
    // 写入文件
    await fs.writeFile(filePath, content, 'utf8');
    
    return {
      success: true,
      message: `RIPER-5任务文件创建成功: ${filePath}`,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5任务文件创建失败: ${error.message}`,
      error
    };
  }
}

/**
 * 更新RIPER-5任务文件
 * @param {Object} task - 任务信息
 * @param {string} mode - RIPER-5模式
 * @param {Object} options - 更新选项
 * @returns {Promise<Object>} - 更新结果
 */
async function updateTaskFile(task, mode, options = {}) {
  try {
    // 直接重新创建文件，覆盖旧文件
    return await createTaskFile(task, mode, options);
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5任务文件更新失败: ${error.message}`,
      error
    };
  }
}

// 保存原始函数的引用
const originalCreateTaskFile = createTaskFile;
const originalUpdateTaskFile = updateTaskFile;

// 重写createTaskFile函数
createTaskFile = async function(task, mode, options = {}) {
  // 调用原始函数
  const result = await originalCreateTaskFile(task, mode, options);
  
  // 如果创建成功，保存版本
  if (result.success) {
    try {
      // 读取创建的文件内容
      const content = await fs.readFile(result.filePath, 'utf8');
      
      // 保存版本
      await saveFileVersion(task.id, mode, content, {
        projectRoot: options.projectRoot,
        comment: '初始创建',
        user: options.user || process.env.USER || 'unknown'
      });
    } catch (error) {
      console.warn(`警告: 无法保存版本历史: ${error.message}`);
    }
  }
  
  return result;
};

// 重写updateTaskFile函数
updateTaskFile = async function(task, mode, options = {}) {
  // 调用原始函数
  const result = await originalUpdateTaskFile(task, mode, options);
  
  // 如果更新成功，保存版本
  if (result.success) {
    try {
      // 读取更新的文件内容
      const content = await fs.readFile(result.filePath, 'utf8');
      
      // 保存版本
      await saveFileVersion(task.id, mode, content, {
        projectRoot: options.projectRoot,
        comment: options.versionComment || '自动更新',
        user: options.user || process.env.USER || 'unknown'
      });
    } catch (error) {
      console.warn(`警告: 无法保存版本历史: ${error.message}`);
    }
  }
  
  return result;
};

/**
 * 读取RIPER-5任务文件
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {Object} options - 读取选项
 * @returns {Promise<Object>} - 读取结果
 */
async function readTaskFile(taskId, mode, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    
    // 构建文件路径
    const fileName = `task-${taskId}-${mode}.md`;
    const filePath = path.join(projectRoot, '.taskmaster/tasks/riper5', fileName);
    
    try {
      // 检查文件是否存在
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          message: `RIPER-5任务文件不存在: ${filePath}`,
          error: { code: 'FILE_NOT_FOUND' }
        };
      }
      throw error;
    }
    
    // 读取文件内容
    const content = await fs.readFile(filePath, 'utf8');
    
    return {
      success: true,
      message: `RIPER-5任务文件读取成功: ${filePath}`,
      content,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      message: `RIPER-5任务文件读取失败: ${error.message}`,
      error
    };
  }
}

/**
 * 为一个任务生成所有模式的文件
 * @param {Object} task - 任务信息
 * @param {Object} options - 生成选项
 * @returns {Promise<Object>} - 生成结果
 */
async function generateAllModeFiles(task, options = {}) {
  try {
    const cfg = config.getConfig();
    const results = {};
    const modes = options.modes || Object.keys(cfg.modes);
    
    // 为每个模式创建文件
    for (const mode of modes) {
      try {
        const result = await createTaskFile(task, mode, options);
        results[mode] = result;
      } catch (error) {
        results[mode] = {
          success: false,
          message: `模式 ${mode} 的任务文件创建失败: ${error.message}`,
          error
        };
      }
    }
    
    // 计算成功和失败的数量
    const successCount = Object.values(results).filter(r => r.success).length;
    const failureCount = modes.length - successCount;
    
    return {
      success: true,
      message: `任务 #${task.id} 的所有模式文件生成完成: ${successCount} 个成功, ${failureCount} 个失败`,
      results
    };
  } catch (error) {
    return {
      success: false,
      message: `生成所有模式文件失败: ${error.message}`,
      error
    };
  }
}

/**
 * 从任务文件更新RIPER-5状态
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {Object} options - 更新选项
 * @returns {Promise<Object>} - 更新结果
 */
async function updateStateFromTaskFile(taskId, mode, options = {}) {
  try {
    // 读取任务文件
    const { success, content, error } = await readTaskFile(taskId, mode, options);
    
    if (!success) {
      throw new Error(`无法读取任务文件: ${error.message || error.code}`);
    }
    
    // 解析文件内容
    const checklistItems = parseChecklistItems(content);
    const notes = parseNotes(content, mode);
    
    // 更新状态
    const updateResult = await stateManager.updateStateFromFile(taskId, mode, {
      checklistItems,
      notes
    });
    
    if (!updateResult.success) {
      throw new Error(`无法更新RIPER-5状态: ${updateResult.message}`);
    }
    
    return {
      success: true,
      message: `从文件更新RIPER-5状态成功: 任务 #${taskId}, 模式 ${mode}`,
      checklistItems,
      notes
    };
  } catch (error) {
    return {
      success: false,
      message: `从文件更新RIPER-5状态失败: ${error.message}`,
      error
    };
  }
}

/**
 * 从任务文件中解析检查清单项
 * @param {string} content - 文件内容
 * @returns {Array} - 检查清单项数组
 */
function parseChecklistItems(content) {
  const checklistItems = [];
  
  // 使用正则表达式匹配检查清单项
  const checklistRegex = /- \[([ x])\] (.*)/g;
  let match;
  
  while ((match = checklistRegex.exec(content)) !== null) {
    const completed = match[1] === 'x';
    const text = match[2].trim();
    
    checklistItems.push({
      text,
      completed
    });
  }
  
  return checklistItems;
}

/**
 * 从任务文件中解析笔记
 * @param {string} content - 文件内容
 * @param {string} mode - RIPER-5模式
 * @returns {string} - 笔记内容
 */
function parseNotes(content, mode) {
  // 不同模式下，笔记区域可能有所不同
  let notesContent = '';
  
  switch (mode) {
    case 'research':
      // 从研究结论与见解部分提取
      notesContent = extractSection(content, '### 结论与见解', '##');
      break;
    case 'innovate':
      // 从选择的创新路径部分提取
      notesContent = extractSection(content, '### 选择的创新路径', '##');
      break;
    case 'plan':
      // 从任务分解部分提取
      notesContent = extractSection(content, '### 任务分解', '###');
      break;
    case 'execute':
      // 从执行状态部分提取
      notesContent = extractSection(content, '### 执行状态', '###');
      break;
    case 'review':
      // 从经验教训部分提取
      notesContent = extractSection(content, '### 经验教训', '##');
      break;
    default:
      // 默认提取整个内容
      notesContent = content;
  }
  
  return notesContent.trim();
}

/**
 * 从文本中提取指定部分
 * @private
 */
function extractSection(content, startMarker, endMarker) {
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    return '';
  }
  
  const startPos = startIndex + startMarker.length;
  const endIndex = content.indexOf(endMarker, startPos);
  
  if (endIndex === -1) {
    return content.substring(startPos).trim();
  }
  
  return content.substring(startPos, endIndex).trim();
}

/**
 * 将Markdown转换为HTML
 * @private
 */
function convertMarkdownToHtml(markdown) {
  return marked.parse(markdown);
}

/**
 * 导出任务文件为HTML
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {Object} options - 导出选项
 * @returns {Promise<Object>} - 导出结果
 */
async function exportTaskFileToHtml(taskId, mode, options = {}) {
  try {
    // 读取任务文件
    const { success, content, error } = await readTaskFile(taskId, mode, options);
    
    if (!success) {
      throw new Error(`无法读取任务文件: ${error.message || error.code}`);
    }
    
    const projectRoot = options.projectRoot || await findProjectRoot();
    
    // 转换为HTML
    const htmlContent = convertMarkdownToHtml(content);
    
    // 准备HTML模板
    let htmlOutput = HTML_TEMPLATE
      .replace(/{{title}}/g, `任务 #${taskId} - ${mode} 模式`)
      .replace(/{{taskId}}/g, taskId)
      .replace(/{{mode}}/g, mode)
      .replace(/{{exportDate}}/g, new Date().toISOString().split('T')[0])
      .replace(/{{content}}/g, htmlContent);
    
    // 创建导出目录
    const exportDir = path.join(projectRoot, '.taskmaster/exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    // 保存HTML文件
    const htmlFileName = `task-${taskId}-${mode}.html`;
    const htmlFilePath = path.join(exportDir, htmlFileName);
    
    await fs.writeFile(htmlFilePath, htmlOutput, 'utf8');
    
    return {
      success: true,
      message: `任务文件成功导出为HTML: ${htmlFilePath}`,
      filePath: htmlFilePath
    };
  } catch (error) {
    return {
      success: false,
      message: `导出任务文件为HTML失败: ${error.message}`,
      error
    };
  }
}

/**
 * 导出任务文件为PDF
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {Object} options - 导出选项
 * @returns {Promise<Object>} - 导出结果
 */
async function exportTaskFileToPdf(taskId, mode, options = {}) {
  try {
    return {
      success: false,
      message: `PDF导出功能已禁用，请使用HTML导出功能`,
      error: new Error('PDF导出功能已禁用')
    };
  } catch (error) {
    return {
      success: false,
      message: `导出任务文件为PDF失败: ${error.message}`,
      error
    };
  }
}

/**
 * 创建任务文件同步包
 * @param {string} taskId - 任务ID
 * @param {Array<string>} modes - 要包含的模式列表，默认为所有模式
 * @param {Object} options - 同步选项
 * @returns {Promise<Object>} - 同步包结果
 */
async function createSyncPackage(taskId, modes = [], options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const cfg = config.getConfig();
    
    // 如果未指定模式，则使用所有模式
    if (!modes || modes.length === 0) {
      modes = Object.keys(cfg.modes);
    }
    
    // 获取任务的RIPER-5状态
    const { success, state } = await stateManager.getState(taskId);
    
    if (!success || !state) {
      throw new Error(`无法获取任务 #${taskId} 的RIPER-5状态`);
    }
    
    // 为每个模式读取任务文件
    const files = {};
    for (const mode of modes) {
      try {
        const fileResult = await readTaskFile(taskId, mode, { projectRoot });
        if (fileResult.success) {
          files[mode] = fileResult.content;
        }
      } catch (error) {
        // 如果某个模式的文件不存在，则跳过
        console.warn(`警告: 无法读取任务 #${taskId} 的 ${mode} 模式文件: ${error.message}`);
      }
    }
    
    // 创建同步包
    const syncPackage = {
      taskId,
      timestamp: new Date().toISOString(),
      state,
      files
    };
    
    // 创建导出目录
    const syncDir = path.join(projectRoot, '.taskmaster/sync');
    await fs.mkdir(syncDir, { recursive: true });
    
    // 保存同步包到文件
    const syncFileName = `riper5-sync-${taskId}-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const syncFilePath = path.join(syncDir, syncFileName);
    
    await fs.writeFile(
      syncFilePath,
      JSON.stringify(syncPackage, null, 2),
      'utf8'
    );
    
    return {
      success: true,
      message: `RIPER-5任务同步包创建成功: ${syncFilePath}`,
      syncPackage,
      syncFilePath
    };
  } catch (error) {
    return {
      success: false,
      message: `创建RIPER-5任务同步包失败: ${error.message}`,
      error
    };
  }
}

/**
 * 应用任务文件同步包
 * @param {string|Object} syncPackage - 同步包文件路径或同步包对象
 * @param {Object} options - 应用选项
 * @returns {Promise<Object>} - 应用结果
 */
async function applySyncPackage(syncPackage, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    let syncData;
    
    // 根据输入类型加载同步包
    if (typeof syncPackage === 'string') {
      // 如果是文件路径，从文件加载
      try {
        const syncContent = await fs.readFile(syncPackage, 'utf8');
        syncData = JSON.parse(syncContent);
      } catch (error) {
        throw new Error(`无法读取同步包文件: ${error.message}`);
      }
    } else if (typeof syncPackage === 'object') {
      // 如果是对象，直接使用
      syncData = syncPackage;
    } else {
      throw new Error('无效的同步包格式');
    }
    
    // 验证同步包
    if (!syncData.taskId || !syncData.state || !syncData.files) {
      throw new Error('同步包缺少必要字段');
    }
    
    const { taskId, state, files } = syncData;
    
    // 更新状态
    const updateResult = await stateManager.updateState(taskId, state);
    
    if (!updateResult.success) {
      throw new Error(`无法更新RIPER-5状态: ${updateResult.message}`);
    }
    
    // 为每个模式创建或更新文件
    const results = {};
    for (const [mode, content] of Object.entries(files)) {
      try {
        // 确保输出目录存在
        const outputDir = path.join(projectRoot, '.taskmaster/tasks/riper5');
        await fs.mkdir(outputDir, { recursive: true });
        
        // 写入文件
        const fileName = `task-${taskId}-${mode}.md`;
        const filePath = path.join(outputDir, fileName);
        
        await fs.writeFile(filePath, content, 'utf8');
        
        results[mode] = {
          success: true,
          message: `模式 ${mode} 的任务文件已同步: ${filePath}`
        };
      } catch (error) {
        results[mode] = {
          success: false,
          message: `模式 ${mode} 的任务文件同步失败: ${error.message}`,
          error
        };
      }
    }
    
    return {
      success: true,
      message: `RIPER-5任务同步包应用成功: 任务 #${taskId}`,
      results
    };
  } catch (error) {
    return {
      success: false,
      message: `应用RIPER-5任务同步包失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取可用的同步包列表
 * @param {Object} options - 列表选项
 * @returns {Promise<Object>} - 列表结果
 */
async function listSyncPackages(options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const syncDir = path.join(projectRoot, '.taskmaster/sync');
    
    // 确保同步目录存在
    await fs.mkdir(syncDir, { recursive: true });
    
    // 读取目录内容
    const files = await fs.readdir(syncDir);
    
    // 筛选同步包文件
    const syncFiles = files.filter(file => file.startsWith('riper5-sync-') && file.endsWith('.json'));
    
    // 读取每个同步包的元信息
    const packages = [];
    for (const file of syncFiles) {
      try {
        const filePath = path.join(syncDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        packages.push({
          filename: file,
          filePath,
          taskId: data.taskId,
          timestamp: data.timestamp,
          modes: Object.keys(data.files)
        });
      } catch (error) {
        console.warn(`警告: 无法读取同步包文件 ${file}: ${error.message}`);
      }
    }
    
    // 按时间戳排序，最新的在前
    packages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
      success: true,
      message: `找到 ${packages.length} 个RIPER-5任务同步包`,
      packages
    };
  } catch (error) {
    return {
      success: false,
      message: `获取RIPER-5任务同步包列表失败: ${error.message}`,
      error
    };
  }
}

/**
 * 导入同步包从外部源
 * @param {string} sourcePath - 同步包文件路径
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} - 导入结果
 */
async function importSyncPackage(sourcePath, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    
    // 读取源文件
    let syncData;
    try {
      const syncContent = await fs.readFile(sourcePath, 'utf8');
      syncData = JSON.parse(syncContent);
    } catch (error) {
      throw new Error(`无法读取同步包文件: ${error.message}`);
    }
    
    // 验证同步包
    if (!syncData.taskId || !syncData.state || !syncData.files) {
      throw new Error('无效的同步包格式，缺少必要字段');
    }
    
    // 创建同步目录
    const syncDir = path.join(projectRoot, '.taskmaster/sync');
    await fs.mkdir(syncDir, { recursive: true });
    
    // 生成目标文件路径
    const syncFileName = `riper5-sync-${syncData.taskId}-imported-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const targetPath = path.join(syncDir, syncFileName);
    
    // 复制同步包文件
    await fs.copyFile(sourcePath, targetPath);
    
    return {
      success: true,
      message: `RIPER-5任务同步包导入成功: ${targetPath}`,
      syncPackage: syncData,
      syncFilePath: targetPath
    };
  } catch (error) {
    return {
      success: false,
      message: `导入RIPER-5任务同步包失败: ${error.message}`,
      error
    };
  }
}

/**
 * 合并多个模式的任务文件为一个综合报告
 * @param {string} taskId - 任务ID
 * @param {Array<string>} modes - 要包含的模式列表，默认为所有模式
 * @param {Object} options - 合并选项
 * @returns {Promise<Object>} - 合并结果
 */
async function mergeTaskFiles(taskId, modes = [], options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const cfg = config.getConfig();
    
    // 如果未指定模式，则使用所有模式
    if (!modes || modes.length === 0) {
      modes = Object.keys(cfg.modes);
    }
    
    // 获取任务信息
    const tasksJsonPath = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
    const tasksData = await fs.readFile(tasksJsonPath, 'utf8');
    const tasks = JSON.parse(tasksData);
    
    let task = null;
    // 查找任务
    for (const t of tasks) {
      if (t.id.toString() === taskId.toString()) {
        task = t;
        break;
      }
      
      // 检查子任务
      if (t.subtasks) {
        for (const sub of t.subtasks) {
          if (`${t.id}.${sub.id}` === taskId.toString()) {
            task = sub;
            task.parentTitle = t.title;
            break;
          }
        }
      }
      
      if (task) break;
    }
    
    if (!task) {
      throw new Error(`任务 #${taskId} 不存在`);
    }
    
    // 构建标题
    let title = task.title;
    if (task.parentTitle) {
      title = `${task.parentTitle} > ${title}`;
    }
    
    // 构建合并内容
    let mergedContent = `# 任务 #${taskId}: ${title} - RIPER-5综合报告\n\n`;
    mergedContent += `**生成时间**: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    // 添加任务描述
    if (task.description) {
      mergedContent += `## 任务描述\n\n${task.description}\n\n`;
    }
    
    // 添加状态和依赖信息
    mergedContent += `**状态**: ${task.status || 'pending'}\n`;
    if (task.dependencies && task.dependencies.length > 0) {
      mergedContent += `**依赖**: ${task.dependencies.join(', ')}\n`;
    }
    mergedContent += '\n---\n\n';
    
    // 获取任务的RIPER-5状态
    const { success, state } = await stateManager.getState(taskId);
    
    if (success && state) {
      mergedContent += `**当前RIPER-5模式**: ${state.currentMode}\n`;
      mergedContent += `**历史记录**:\n`;
      
      // 添加模式历史记录
      for (const historyEntry of state.modeHistory) {
        const date = new Date(historyEntry.timestamp).toLocaleString();
        mergedContent += `- ${date}: ${historyEntry.mode} - ${historyEntry.note || '无备注'}\n`;
      }
      mergedContent += '\n';
    }
    
    // 合并各模式的内容
    for (const mode of modes) {
      try {
        const { success, content } = await readTaskFile(taskId, mode, { projectRoot });
        
        if (success) {
          // 处理内容以适应合并格式
          let processedContent = content;
          
          // 移除原始标题
          processedContent = processedContent.replace(/^# .*?\n/, '');
          
          // 将二级标题转换为三级标题，以此类推
          processedContent = processedContent.replace(/^##/gm, '###');
          processedContent = processedContent.replace(/^###/gm, '####');
          processedContent = processedContent.replace(/^####/gm, '#####');
          
          // 添加模式分隔符和标题
          const modeTitle = cfg.modes[mode].description || mode;
          mergedContent += `## ${modeTitle}\n\n`;
          mergedContent += processedContent;
          mergedContent += '\n\n---\n\n';
        }
      } catch (error) {
        mergedContent += `## ${mode} 模式\n\n*无法加载该模式的内容: ${error.message}*\n\n---\n\n`;
      }
    }
    
    // 创建输出目录
    const outputDir = path.join(projectRoot, '.taskmaster/reports/riper5');
    await fs.mkdir(outputDir, { recursive: true });
    
    // 保存合并后的文件
    const fileName = `task-${taskId}-merged-report.md`;
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, mergedContent, 'utf8');
    
    return {
      success: true,
      message: `RIPER-5任务综合报告生成成功: ${filePath}`,
      content: mergedContent,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      message: `生成RIPER-5任务综合报告失败: ${error.message}`,
      error
    };
  }
}

/**
 * 导出合并后的任务报告为HTML或PDF
 * @param {string} taskId - 任务ID
 * @param {Array<string>} modes - 要包含的模式列表，默认为所有模式
 * @param {string} format - 导出格式 (html 或 pdf)
 * @param {Object} options - 导出选项
 * @returns {Promise<Object>} - 导出结果
 */
async function exportMergedReport(taskId, modes = [], format = 'html', options = {}) {
  try {
    // 首先生成合并报告
    const { success, content, filePath } = await mergeTaskFiles(taskId, modes, options);
    
    if (!success) {
      throw new Error(`生成合并报告失败`);
    }
    
    const projectRoot = options.projectRoot || await findProjectRoot();
    const exportDir = path.join(projectRoot, '.taskmaster/exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    // 仅支持HTML格式导出
    if (format === 'html') {
      // 转换为HTML
      const htmlContent = convertMarkdownToHtml(content);
      
      // 准备HTML模板
      let htmlOutput = HTML_TEMPLATE
        .replace(/{{title}}/g, `任务 #${taskId} 综合报告`)
        .replace(/{{taskId}}/g, taskId)
        .replace(/{{mode}}/g, 'merged')
        .replace(/{{exportDate}}/g, new Date().toISOString().split('T')[0])
        .replace(/{{content}}/g, htmlContent);
      
      // 保存HTML文件
      const htmlFileName = `task-${taskId}-merged-report.html`;
      const htmlFilePath = path.join(exportDir, htmlFileName);
      await fs.writeFile(htmlFilePath, htmlOutput, 'utf8');
      
      return {
        success: true,
        message: `RIPER-5任务综合报告成功导出为HTML: ${htmlFilePath}`,
        filePath: htmlFilePath
      };
    } else if (format === 'pdf') {
      return {
        success: false,
        message: `PDF导出功能已禁用，请使用HTML导出功能`,
        error: new Error('PDF导出功能已禁用')
      };
    } else {
      throw new Error(`不支持的导出格式: ${format}`);
    }
  } catch (error) {
    return {
      success: false,
      message: `导出RIPER-5任务综合报告失败: ${error.message}`,
      error
    };
  }
}

/**
 * 批量处理多个任务的RIPER-5文件
 * @param {Array<string>} taskIds - 任务ID列表
 * @param {string} operation - 操作类型 ('create', 'export-html', 'export-pdf', 'merge', 'sync')
 * @param {Object} options - 批处理选项
 * @returns {Promise<Object>} - 批处理结果
 */
async function batchProcessTaskFiles(taskIds, operation, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const cfg = config.getConfig();
    const results = {};
    const modes = options.modes || Object.keys(cfg.modes);
    
    // 验证操作类型
    const validOperations = ['create', 'export-html', 'export-pdf', 'merge', 'sync'];
    if (!validOperations.includes(operation)) {
      throw new Error(`不支持的操作类型: ${operation}`);
    }
    
    // 获取任务列表
    const tasksJsonPath = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
    const tasksData = await fs.readFile(tasksJsonPath, 'utf8');
    const tasks = JSON.parse(tasksData);
    
    // 为每个任务执行操作
    for (const taskId of taskIds) {
      try {
        // 查找任务
        let task = null;
        
        // 查找顶级任务
        for (const t of tasks) {
          if (t.id.toString() === taskId.toString()) {
            task = t;
            break;
          }
          
          // 检查子任务
          if (t.subtasks) {
            for (const sub of t.subtasks) {
              if (`${t.id}.${sub.id}` === taskId.toString()) {
                task = { ...sub, id: `${t.id}.${sub.id}` };
                break;
              }
            }
          }
          
          if (task) break;
        }
        
        if (!task) {
          results[taskId] = {
            success: false,
            message: `任务 #${taskId} 不存在`
          };
          continue;
        }
        
        // 根据操作类型执行不同的功能
        switch (operation) {
          case 'create':
            // 生成所有模式的任务文件
            const createResult = await generateAllModeFiles(task, { projectRoot });
            results[taskId] = createResult;
            break;
            
          case 'export-html':
            // 为每个模式导出HTML
            const htmlResults = {};
            for (const mode of modes) {
              const htmlResult = await exportTaskFileToHtml(taskId, mode, { projectRoot });
              htmlResults[mode] = htmlResult;
            }
            results[taskId] = {
              success: true,
              message: `任务 #${taskId} 的所有模式文件已导出为HTML`,
              results: htmlResults
            };
            break;
            
          case 'export-pdf':
            // PDF导出功能已禁用
            results[taskId] = {
              success: false,
              message: `PDF导出功能已禁用，请使用HTML导出功能`,
              error: new Error('PDF导出功能已禁用')
            };
            break;
            
          case 'merge':
            // 合并所有模式文件为一个报告
            const mergeResult = await mergeTaskFiles(taskId, modes, { projectRoot });
            results[taskId] = mergeResult;
            break;
            
          case 'sync':
            // 创建同步包
            const syncResult = await createSyncPackage(taskId, modes, { projectRoot });
            results[taskId] = syncResult;
            break;
        }
      } catch (error) {
        results[taskId] = {
          success: false,
          message: `处理任务 #${taskId} 失败: ${error.message}`,
          error
        };
      }
    }
    
    // 计算成功和失败的数量
    const successCount = Object.values(results).filter(r => r.success).length;
    const failureCount = taskIds.length - successCount;
    
    return {
      success: true,
      message: `批量处理完成: ${successCount} 个成功, ${failureCount} 个失败`,
      results
    };
  } catch (error) {
    return {
      success: false,
      message: `批量处理失败: ${error.message}`,
      error
    };
  }
}

/**
 * 查找符合条件的任务ID
 * @param {Object} criteria - 查询条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 查询结果
 */
async function findTasksByFilter(criteria = {}, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    
    // 获取任务列表
    const tasksJsonPath = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
    const tasksData = await fs.readFile(tasksJsonPath, 'utf8');
    const tasks = JSON.parse(tasksData);
    
    const matchedTasks = [];
    
    // 处理每个任务
    for (const task of tasks) {
      let matches = true;
      
      // 检查任务是否符合标准
      if (criteria.status && task.status !== criteria.status) {
        matches = false;
      }
      
      if (criteria.priority && task.priority !== criteria.priority) {
        matches = false;
      }
      
      if (criteria.titleContains && !task.title.includes(criteria.titleContains)) {
        matches = false;
      }
      
      if (criteria.dependency && (!task.dependencies || !task.dependencies.includes(criteria.dependency))) {
        matches = false;
      }
      
      // 如果任务符合标准，添加到结果集
      if (matches) {
        matchedTasks.push(task.id.toString());
      }
      
      // 如果包含子任务，检查子任务
      if (task.subtasks && criteria.includeSubtasks) {
        for (const subtask of task.subtasks) {
          let subtaskMatches = true;
          
          if (criteria.status && subtask.status !== criteria.status) {
            subtaskMatches = false;
          }
          
          if (criteria.titleContains && !subtask.title.includes(criteria.titleContains)) {
            subtaskMatches = false;
          }
          
          if (subtaskMatches) {
            matchedTasks.push(`${task.id}.${subtask.id}`);
          }
        }
      }
    }
    
    return {
      success: true,
      message: `找到 ${matchedTasks.length} 个符合条件的任务`,
      taskIds: matchedTasks
    };
  } catch (error) {
    return {
      success: false,
      message: `查找任务失败: ${error.message}`,
      error
    };
  }
}

/**
 * 批量生成指定条件任务的所有模式文件
 * @param {Object} criteria - 任务过滤条件
 * @param {Object} options - 批处理选项
 * @returns {Promise<Object>} - 批处理结果
 */
async function batchGenerateByFilter(criteria = {}, options = {}) {
  try {
    // 查找符合条件的任务
    const { success, taskIds } = await findTasksByFilter(criteria, options);
    
    if (!success || taskIds.length === 0) {
      return {
        success: false,
        message: `没有找到符合条件的任务`
      };
    }
    
    // 批量处理
    return await batchProcessTaskFiles(taskIds, 'create', options);
  } catch (error) {
    return {
      success: false,
      message: `批量生成任务文件失败: ${error.message}`,
      error
    };
  }
}

/**
 * 保存任务文件的版本历史
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {string} content - 文件内容
 * @param {Object} options - 版本选项
 * @returns {Promise<Object>} - 版本保存结果
 */
async function saveFileVersion(taskId, mode, content, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const comment = options.comment || '自动保存版本';
    
    // 创建版本目录
    const versionDir = path.join(projectRoot, '.taskmaster/versions/riper5', taskId, mode);
    await fs.mkdir(versionDir, { recursive: true });
    
    // 生成版本号
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionId = timestamp;
    
    // 创建版本元数据
    const metadata = {
      versionId,
      taskId,
      mode,
      timestamp: new Date().toISOString(),
      comment,
      user: options.user || process.env.USER || 'unknown'
    };
    
    // 保存版本内容
    const contentFilePath = path.join(versionDir, `${versionId}.md`);
    await fs.writeFile(contentFilePath, content, 'utf8');
    
    // 保存版本元数据
    const metadataFilePath = path.join(versionDir, `${versionId}.json`);
    await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf8');
    
    return {
      success: true,
      message: `任务文件版本保存成功: ${contentFilePath}`,
      versionId,
      contentFilePath,
      metadataFilePath
    };
  } catch (error) {
    return {
      success: false,
      message: `保存任务文件版本失败: ${error.message}`,
      error
    };
  }
}

/**
 * 列出任务文件的所有版本
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {Object} options - 列表选项
 * @returns {Promise<Object>} - 版本列表结果
 */
async function listFileVersions(taskId, mode, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const versionDir = path.join(projectRoot, '.taskmaster/versions/riper5', taskId, mode);
    
    try {
      // 检查版本目录是否存在
      await fs.access(versionDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: true,
          message: `任务 #${taskId} 的 ${mode} 模式没有版本历史`,
          versions: []
        };
      }
      throw error;
    }
    
    // 读取目录内容
    const files = await fs.readdir(versionDir);
    
    // 筛选元数据文件
    const metadataFiles = files.filter(file => file.endsWith('.json'));
    
    // 读取每个版本的元数据
    const versions = [];
    for (const file of metadataFiles) {
      try {
        const filePath = path.join(versionDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const metadata = JSON.parse(content);
        versions.push(metadata);
      } catch (error) {
        console.warn(`警告: 无法读取版本元数据文件 ${file}: ${error.message}`);
      }
    }
    
    // 按时间戳排序，最新的在前
    versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
      success: true,
      message: `找到 ${versions.length} 个版本`,
      versions
    };
  } catch (error) {
    return {
      success: false,
      message: `列出任务文件版本失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取指定版本的任务文件内容
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {string} versionId - 版本ID
 * @param {Object} options - 获取选项
 * @returns {Promise<Object>} - 版本内容结果
 */
async function getFileVersion(taskId, mode, versionId, options = {}) {
  try {
    const projectRoot = options.projectRoot || await findProjectRoot();
    const versionDir = path.join(projectRoot, '.taskmaster/versions/riper5', taskId, mode);
    
    // 获取版本内容文件路径
    const contentFilePath = path.join(versionDir, `${versionId}.md`);
    const metadataFilePath = path.join(versionDir, `${versionId}.json`);
    
    try {
      // 检查文件是否存在
      await fs.access(contentFilePath);
      await fs.access(metadataFilePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          message: `版本 ${versionId} 不存在`
        };
      }
      throw error;
    }
    
    // 读取内容和元数据
    const content = await fs.readFile(contentFilePath, 'utf8');
    const metadataContent = await fs.readFile(metadataFilePath, 'utf8');
    const metadata = JSON.parse(metadataContent);
    
    return {
      success: true,
      message: `获取版本内容成功: ${versionId}`,
      content,
      metadata
    };
  } catch (error) {
    return {
      success: false,
      message: `获取版本内容失败: ${error.message}`,
      error
    };
  }
}

/**
 * 获取两个版本之间的差异
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {string} fromVersionId - 起始版本ID
 * @param {string} toVersionId - 目标版本ID
 * @param {Object} options - 差异选项
 * @returns {Promise<Object>} - 差异结果
 */
async function getVersionDiff(taskId, mode, fromVersionId, toVersionId, options = {}) {
  try {
    // 获取两个版本的内容
    const fromVersion = await getFileVersion(taskId, mode, fromVersionId, options);
    const toVersion = await getFileVersion(taskId, mode, toVersionId, options);
    
    if (!fromVersion.success || !toVersion.success) {
      throw new Error(`无法获取版本内容: ${!fromVersion.success ? fromVersion.message : toVersion.message}`);
    }
    
    // 计算差异
    const diffResult = diff.createPatch(
      `task-${taskId}-${mode}.md`,
      fromVersion.content,
      toVersion.content,
      `版本 ${fromVersionId}`,
      `版本 ${toVersionId}`
    );
    
    // 格式化差异为HTML (可选)
    let htmlDiff = '';
    if (options.format === 'html') {
      htmlDiff = diffToHtml(diffResult);
    }
    
    return {
      success: true,
      message: `获取版本差异成功`,
      diff: diffResult,
      htmlDiff: options.format === 'html' ? htmlDiff : undefined,
      fromVersion: fromVersion.metadata,
      toVersion: toVersion.metadata
    };
  } catch (error) {
    return {
      success: false,
      message: `获取版本差异失败: ${error.message}`,
      error
    };
  }
}

/**
 * 将差异转换为HTML格式
 * @private
 */
function diffToHtml(diffText) {
  // 简单的HTML格式化
  const lines = diffText.split('\n');
  let html = '<pre class="diff">';
  
  for (const line of lines) {
    if (line.startsWith('+')) {
      html += `<span class="addition">${escapeHtml(line)}</span>\n`;
    } else if (line.startsWith('-')) {
      html += `<span class="deletion">${escapeHtml(line)}</span>\n`;
    } else if (line.startsWith('@@')) {
      html += `<span class="info">${escapeHtml(line)}</span>\n`;
    } else {
      html += `${escapeHtml(line)}\n`;
    }
  }
  
  html += '</pre>';
  html += `
  <style>
    .diff {
      background-color: #f8f8f8;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .addition {
      background-color: #e6ffed;
      color: #22863a;
      display: block;
    }
    .deletion {
      background-color: #ffeef0;
      color: #cb2431;
      display: block;
    }
    .info {
      color: #6f42c1;
      display: block;
    }
  </style>
  `;
  
  return html;
}

/**
 * 转义HTML特殊字符
 * @private
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 恢复到特定版本
 * @param {string} taskId - 任务ID
 * @param {string} mode - RIPER-5模式
 * @param {string} versionId - 版本ID
 * @param {Object} options - 恢复选项
 * @returns {Promise<Object>} - 恢复结果
 */
async function restoreFileVersion(taskId, mode, versionId, options = {}) {
  try {
    // 获取版本内容
    const version = await getFileVersion(taskId, mode, versionId, options);
    
    if (!version.success) {
      throw new Error(`无法获取版本内容: ${version.message}`);
    }
    
    const projectRoot = options.projectRoot || await findProjectRoot();
    
    // 确保任务文件目录存在
    const outputDir = path.join(projectRoot, '.taskmaster/tasks/riper5');
    await fs.mkdir(outputDir, { recursive: true });
    
    // 获取当前内容 (如果存在)
    const currentFilePath = path.join(outputDir, `task-${taskId}-${mode}.md`);
    let currentContent = '';
    
    try {
      currentContent = await fs.readFile(currentFilePath, 'utf8');
      
      // 保存当前版本 (如果与要恢复的版本不同)
      if (currentContent !== version.content) {
        await saveFileVersion(taskId, mode, currentContent, {
          projectRoot,
          comment: `自动保存版本 (恢复前)`,
          user: options.user || process.env.USER || 'unknown'
        });
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // 文件不存在，继续恢复
    }
    
    // 写入恢复的内容
    await fs.writeFile(currentFilePath, version.content, 'utf8');
    
    // 更新任务状态
    await updateStateFromTaskFile(taskId, mode, { projectRoot });
    
    return {
      success: true,
      message: `恢复到版本 ${versionId} 成功`,
      versionId,
      taskId,
      mode
    };
  } catch (error) {
    return {
      success: false,
      message: `恢复到版本 ${versionId} 失败: ${error.message}`,
      error
    };
  }
}

/**
 * 导出指定任务的综合报告
 * 
 * 这个函数会获取任务的当前状态和所有模式的内容，
 * 然后调用 exportMergedReport 生成一个完整的报告。
 * 
 * @param {string} taskId - 任务ID
 * @param {string} outputDir - 报告输出目录
 * @param {string} [format='html'] - 报告格式 (html, markdown, json)
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<Object>} - 包含报告路径和成功信息的对象
 */
export async function exportTaskReport(taskId, outputDir, format = 'html', projectRoot) {
  try {
    const state = await stateManager.getState(taskId, projectRoot);
    if (!state || !state.success) {
      throw new Error(`无法获取任务 ${taskId} 的状态: ${state.message}`);
    }

    const allModes = Object.keys(modeModules);
    
    // 调用现有的 exportMergedReport 函数
    return await exportMergedReport(taskId, allModes, format, { projectRoot, outputDir });
  } catch (error) {
    console.error(`导出任务 ${taskId} 报告失败:`, error);
    return {
      success: false,
      message: `导出任务 ${taskId} 报告失败: ${error.message}`
    };
  }
}

// 添加新函数到导出
export {
  initialize,
  createTaskFile,
  updateTaskFile,
  readTaskFile,
  generateAllModeFiles,
  updateStateFromTaskFile,
  parseChecklistItems,
  parseNotes,
  exportTaskFileToHtml,
  exportTaskFileToPdf,
  createSyncPackage,
  applySyncPackage,
  listSyncPackages,
  importSyncPackage,
  mergeTaskFiles,
  exportMergedReport,
  batchProcessTaskFiles,
  findTasksByFilter,
  batchGenerateByFilter,
  saveFileVersion,
  listFileVersions,
  getFileVersion,
  getVersionDiff,
  restoreFileVersion
}; 
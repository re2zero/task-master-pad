/**
 * RIPER-5工作流MCP工具
 */

import { z } from 'zod';
import { 
  initializeRiper5Direct,
  switchModeDirect,
  getStatusDirect,
  getModeProgressDirect,
  getAllModeProgressDirect,
  getNextRecommendedModeDirect,
  getModeHistoryDirect,
  exportModeHistoryReportDirect,
  addHistoryCommentDirect,
  generateTaskFileDirect,
  exportTaskReportDirect
} from '../core/task-master-core.js';
import { 
  withNormalizedProjectRoot,
  handleApiResult,
  createErrorResponse
} from './utils.js';

/**
 * 注册初始化RIPER-5工具
 */
export function registerInitializeRiper5Tool(server) {
  server.addTool({
    name: 'initialize_riper5',
    description: 'Initializes the RIPER-5 workflow for a given task.',
    parameters: z.object({
      taskId: z.string().describe('The ID of the task to initialize.'),
      projectRoot: z.string().optional().describe('The root directory of the project.'),
    }),
    execute: withNormalizedProjectRoot(async (args, { log }) => {
      try {
        const result = await initializeRiper5Direct(args, log);
        return handleApiResult(result, log);
      } catch (error) {
        return createErrorResponse(`Failed to initialize RIPER-5 workflow: ${error.message}`, log);
      }
    }),
  });
}

/**
 * 注册切换模式工具
 */
export function registerSwitchModeTool(server) {
  server.addTool({
    name: 'switch_mode',
    description: 'Switches the active mode for a task in the RIPER-5 workflow.',
    parameters: z.object({
      taskId: z.string().describe('The ID of the task.'),
      mode: z.string().describe('The new mode to switch to (e.g., research, implementation).'),
      projectRoot: z.string().optional().describe('The root directory of the project.'),
    }),
    execute: withNormalizedProjectRoot(async (args, { log }) => {
      try {
        const result = await switchModeDirect(args, log);
        return handleApiResult(result, log);
      } catch (error) {
        return createErrorResponse(`Failed to switch mode: ${error.message}`, log);
      }
    }),
  });
}

/**
 * 注册获取状态工具
 */
export function registerGetStatusTool(server) {
  server.addTool({
    name: 'get_riper5_status',
    description: 'Gets the current status of the RIPER-5 workflow.',
    parameters: z.object({
      projectRoot: z.string().optional().describe('The root directory of the project.'),
    }),
    execute: withNormalizedProjectRoot(async (args, { log }) => {
      try {
        const result = await getStatusDirect(args, log);
        return handleApiResult(result, log);
      } catch (error) {
        return createErrorResponse(`Failed to get status: ${error.message}`, log);
      }
    }),
  });
}

/**
 * 注册获取模式进度工具
 */
export function registerGetModeProgressTool(server) {
  server.addTool({
    name: 'get_mode_progress',
    description: '获取任务特定模式的进度',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      mode: z.string().describe('模式名称'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await getModeProgressDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`获取模式进度失败: ${error.message}`);
        return createErrorResponse(`获取模式进度失败: ${error.message}`);
      }
    })
  });
}

/**
 * 注册获取所有模式进度工具
 */
export function registerGetAllModeProgressTool(server) {
  server.addTool({
    name: 'get_all_mode_progress',
    description: '获取任务所有模式的进度',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await getAllModeProgressDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`获取所有模式进度失败: ${error.message}`);
        return createErrorResponse(`获取所有模式进度失败: ${error.message}`);
      }
    })
  });
}

/**
 * 注册获取推荐模式工具
 */
export function registerGetNextRecommendedModeTool(server) {
  server.addTool({
    name: 'get_next_recommended_mode',
    description: '获取任务推荐的下一个模式',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await getNextRecommendedModeDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`获取推荐模式失败: ${error.message}`);
        return createErrorResponse(`获取推荐模式失败: ${error.message}`);
      }
    })
  });
}

/**
 * 注册获取模式历史工具
 */
export function registerGetModeHistoryTool(server) {
  server.addTool({
    name: 'get_mode_history',
    description: '获取任务的模式切换历史',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      limit: z.number().optional().describe('限制返回的记录数量'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await getModeHistoryDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`获取模式历史失败: ${error.message}`);
        return createErrorResponse(`获取模式历史失败: ${error.message}`);
      }
    })
  });
}

/**
 * 注册导出模式历史报告工具
 */
export function registerExportModeHistoryReportTool(server) {
  server.addTool({
    name: 'export_mode_history_report',
    description: '导出任务的模式历史报告',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      format: z.enum(['json', 'markdown', 'html']).optional().describe('导出格式'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await exportModeHistoryReportDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`导出模式历史报告失败: ${error.message}`);
        return createErrorResponse(`导出模式历史报告失败: ${error.message}`);
      }
    })
  });
}

/**
 * 注册添加历史评论工具
 */
export function registerAddHistoryCommentTool(server) {
  server.addTool({
    name: 'add_history_comment',
    description: '为任务的模式历史记录添加评论',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      historyIndex: z.number().describe('历史记录索引'),
      comment: z.string().describe('评论内容'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await addHistoryCommentDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`添加历史评论失败: ${error.message}`);
        return createErrorResponse(`添加历史评论失败: ${error.message}`);
      }
    })
  });
}

/**
 * 注册生成任务文件工具
 */
export function registerGenerateTaskFileTool(server) {
  server.addTool({
    name: 'generate_riper5_task_file',
    description: '生成RIPER-5任务文件',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      outputDir: z.string().describe('输出目录'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await generateTaskFileDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`生成任务文件失败: ${error.message}`);
        return createErrorResponse(`生成任务文件失败: ${error.message}`);
      }
    })
  });
}

/**
 * 注册导出任务报告工具
 */
export function registerExportTaskReportTool(server) {
  server.addTool({
    name: 'export_riper5_task_report',
    description: '导出RIPER-5任务报告',
    parameters: z.object({
      taskId: z.string().describe('任务ID'),
      format: z.enum(['markdown', 'html', 'json']).optional().describe('导出格式'),
      outputDir: z.string().describe('输出目录'),
      projectRoot: z.string().optional().describe('项目根目录路径')
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await exportTaskReportDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`导出任务报告失败: ${error.message}`);
        return createErrorResponse(`导出任务报告失败: ${error.message}`);
      }
    })
  });
} 
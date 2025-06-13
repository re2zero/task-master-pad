# RIPER-5 与 Task Master Pad 融合蓝图

## 1. 概述

本蓝图详细说明如何将 RIPER-5 工作流模式（研究、创新、计划、执行、审查）集成到 Task Master Pad 项目中，为用户提供更结构化的任务执行方法论。

## 2. 系统架构

### 2.1 模块架构

```
task-master-pad/
└── scripts/
    └── modules/
        ├── task-manager/          # 现有任务管理模块
        └── riper5-workflow/       # 新增 RIPER-5 工作流模块
            ├── index.js           # 模块入口
            ├── config.js          # RIPER-5 配置管理
            ├── state-manager.js   # 状态管理器
            ├── mode-manager.js    # 模式管理
            ├── task-file.js       # 任务文件处理
            └── modes/             # 各模式实现
                ├── research.js    # 研究模式
                ├── innovate.js    # 创新模式
                ├── plan.js        # 计划模式
                ├── execute.js     # 执行模式
                └── review.js      # 审查模式
```

### 2.2 数据流架构

```
                    ┌────────────────┐
                    │   用户命令/API  │
                    └────────┬───────┘
                             │
          ┌──────────────────▼──────────────────┐
          │      RIPER-5 命令/MCP工具处理器      │
          └──────────────────┬──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │          RIPER-5 状态管理器          │
          └─┬───────────────┬────────────────┬──┘
            │               │                │
┌───────────▼────────┐ ┌────▼─────────┐ ┌────▼────────────┐
│ 任务关联和跟踪管理  │ │  模式管理器  │ │ 任务文件管理器   │
└───────────┬────────┘ └────┬─────────┘ └────┬────────────┘
            │               │                │
            └───────────────┼────────────────┘
                            │
            ┌───────────────▼───────────────┐
            │      AI 服务 (增强提示)       │
            └───────────────┬───────────────┘
                            │
            ┌───────────────▼───────────────┐
            │        Task Master 核心       │
            └───────────────────────────────┘
```

## 3. 数据模型

### 3.1 RIPER-5 状态模型

```javascript
{
  "taskId": "5",                      // 关联的 Task Master 任务 ID
  "currentMode": "RESEARCH",          // 当前 RIPER-5 模式
  "created": "2023-10-15T14:30:00",   // 创建时间戳
  "lastUpdated": "2023-10-15T16:45:00", // 最后更新时间戳
  "history": [                        // 模式历史记录
    {
      "mode": "RESEARCH",
      "enteredAt": "2023-10-15T14:30:00",
      "exitedAt": "2023-10-15T16:45:00",
      "summary": "初始研究阶段，分析了系统架构"
    }
  ],
  "taskFile": ".tasks/task_5_riper5.md", // RIPER-5 任务文件路径
  "checklist": [                      // PLAN 模式生成的检查清单
    {
      "id": 1,
      "description": "创建模式管理器基类",
      "completed": false,
      "completedAt": null,
      "result": null                  // 执行结果：成功/失败
    }
  ],
  "progressEntries": [                // 进度记录条目
    {
      "timestamp": "2023-10-15T15:30:00",
      "mode": "RESEARCH",
      "entry": "- 已分析核心文件结构\n- 已识别集成点"
    }
  ]
}
```

### 3.2 RIPER-5 任务文件模板

```markdown
# 任务: [任务标题] (ID: [任务ID])

## 概述
[任务描述]

## 状态
- **当前模式**: [RESEARCH|INNOVATE|PLAN|EXECUTE|REVIEW]
- **状态**: [进行中|已完成]
- **创建时间**: [创建时间]
- **上次更新**: [更新时间]

## 研究发现
[研究模式中的发现和观察]

## 提议的解决方案
[创新模式中提出的各种可能方案]

## 执行计划
[计划模式中制定的详细计划]

### 实施清单
- [ ] 步骤 1: [详细描述]
- [ ] 步骤 2: [详细描述]
- ...

## 任务进度
[执行模式中的进度记录]

## 最终审查
[审查模式中的验证和结论]
```

## 4. 功能详细规范

### 4.1 RIPER-5 工作流初始化

**功能**: 为指定任务初始化 RIPER-5 工作流

**API**:
```javascript
function initializeRiper5Workflow(taskId, options = {}) -> Promise<RiperState>
```

**参数**:
- `taskId`: 任务 ID
- `options`: 
  - `initialMode`: 初始模式 (默认: "RESEARCH")
  - `taskTitle`: 任务标题 (从任务系统获取)
  - `taskDescription`: 任务描述 (从任务系统获取)
  - `customTemplatePath`: 自定义任务文件模板路径

**存储位置**:
`.taskmaster/riper5/task-states/task_[ID].json`

### 4.2 模式管理

**功能**: 管理 RIPER-5 工作流模式切换

**API**:
```javascript
function switchMode(taskId, newMode, summary = "") -> Promise<RiperState>
function getCurrentMode(taskId) -> Promise<string>
```

**模式转换规则**:
- RESEARCH → INNOVATE: 完成研究阶段
- INNOVATE → PLAN: 确定创新方案
- PLAN → EXECUTE: 完成详细计划并获批准
- EXECUTE → REVIEW: 完成实施
- EXECUTE → PLAN: 实施失败，需要重新计划
- REVIEW → RESEARCH: 新任务或新迭代开始
- 任何模式 → 任何模式: 允许但记录非标准转换

### 4.3 任务文件管理

**功能**: 管理 RIPER-5 任务文件

**API**:
```javascript
function createTaskFile(taskId, templateData) -> Promise<string> // 返回文件路径
function updateTaskFileSection(taskId, section, content) -> Promise<boolean>
function getTaskFileContent(taskId) -> Promise<string>
```

**文件位置**:
`.tasks/task_[ID]_riper5.md`

### 4.4 计划与清单管理

**功能**: 管理执行计划和检查清单

**API**:
```javascript
function createChecklist(taskId, items) -> Promise<RiperState>
function updateChecklistItem(taskId, itemId, updates) -> Promise<RiperState>
function getChecklist(taskId) -> Promise<Array>
```

**检查清单状态**:
- 未开始
- 进行中
- 已完成-成功
- 已完成-失败

### 4.5 进度记录管理

**功能**: 管理任务进度记录

**API**:
```javascript
function addProgressEntry(taskId, entry, mode = null) -> Promise<RiperState>
function getProgressEntries(taskId) -> Promise<Array>
```

## 5. 界面设计

### 5.1 命令行界面

**新增命令**:

```bash
# 初始化 RIPER-5 工作流
task-master riper5 init [任务ID] [--mode=RESEARCH]

# 切换 RIPER-5 模式
task-master riper5 mode [任务ID] [模式名] [--summary="模式切换摘要"]

# 查看 RIPER-5 状态
task-master riper5 status [任务ID]

# 添加进度记录
task-master riper5 progress [任务ID] [--entry="进度内容"]

# 管理检查清单
task-master riper5 checklist [任务ID] [--add="项目描述" | --complete=项目ID | --fail=项目ID]

# 打开 RIPER-5 任务文件
task-master riper5 open [任务ID]
```

### 5.2 MCP 工具界面

**新增 MCP 工具**:

```javascript
// 初始化 RIPER-5 工作流
riper5_initialize(taskId, options)

// 切换模式
riper5_switch_mode(taskId, newMode, summary)

// 获取状态
riper5_get_status(taskId)

// 添加进度记录
riper5_add_progress(taskId, entry)

// 管理检查清单
riper5_manage_checklist(taskId, action, itemData)

// 获取任务文件内容
riper5_get_task_file(taskId)
```

## 6. AI 集成设计

### 6.1 增强的 AI 提示

为 AI 服务层添加特定于 RIPER-5 模式的提示：

```javascript
// 基于当前模式生成系统提示增强
function getRiper5ModePrompt(mode) {
  switch(mode) {
    case "RESEARCH":
      return `[MODE: RESEARCH]
      You are now in RESEARCH mode.
      Focus only on gathering information, understanding requirements, and analyzing the codebase.
      Avoid making suggestions or implementation plans in this mode.
      Output should begin with [MODE: RESEARCH] and focus on observations and questions.`;
    
    case "INNOVATE":
      // 创新模式提示...
    
    case "PLAN":
      // 计划模式提示...
    
    case "EXECUTE":
      // 执行模式提示...
    
    case "REVIEW":
      // 审查模式提示...
  }
}
```

### 6.2 AI 响应格式化

增强 AI 响应处理，确保按模式格式化输出：

```javascript
function formatRiper5Response(response, mode) {
  // 确保响应以模式声明开始
  if (!response.startsWith(`[MODE: ${mode}]`)) {
    response = `[MODE: ${mode}]\n\n${response}`;
  }
  
  // 根据模式应用特定格式
  switch(mode) {
    case "PLAN":
      // 确保响应包含检查清单
      if (!response.includes("IMPLEMENTATION CHECKLIST:")) {
        // 添加检查清单部分...
      }
      break;
    
    // 其他模式格式化...
  }
  
  return response;
}
```

## 7. 与 Task Master 集成点

### 7.1 任务创建集成

```javascript
// 在添加任务时提供启用 RIPER-5 的选项
async function addTask(params) {
  // 现有任务创建逻辑...
  
  // RIPER-5 集成
  if (params.enableRiper5) {
    const { initializeRiper5Workflow } = require('../riper5-workflow');
    await initializeRiper5Workflow(newTask.id, {
      taskTitle: newTask.title,
      taskDescription: newTask.description
    });
  }
  
  return result;
}
```

### 7.2 任务状态更新集成

```javascript
// 在更新任务状态时同步 RIPER-5 状态
async function setTaskStatus(params) {
  // 现有状态更新逻辑...
  
  // RIPER-5 集成
  const { isRiper5Task, updateRiper5TaskStatus } = require('../riper5-workflow');
  if (await isRiper5Task(taskId)) {
    await updateRiper5TaskStatus(taskId, newStatus);
  }
  
  return result;
}
```

### 7.3 任务展示集成

```javascript
// 在展示任务时包含 RIPER-5 信息
async function listTasks(params) {
  // 现有任务列表逻辑...
  
  // RIPER-5 集成
  const { getRiper5StatusForTasks } = require('../riper5-workflow');
  const riper5Statuses = await getRiper5StatusForTasks(tasks.map(t => t.id));
  
  // 增强任务信息
  tasks.forEach(task => {
    if (riper5Statuses[task.id]) {
      task.riper5 = {
        enabled: true,
        mode: riper5Statuses[task.id].currentMode,
        checklistProgress: `${riper5Statuses[task.id].completedItems}/${riper5Statuses[task.id].totalItems}`
      };
    }
  });
  
  return result;
}
```

## 8. 存储和配置

### 8.1 目录结构

```
.taskmaster/
├── config.json                # 现有配置
├── tasks/                     # 任务文件
└── riper5/                    # RIPER-5 相关文件
    ├── config.json            # RIPER-5 配置
    ├── task-states/           # 任务状态文件
    │   ├── task_1.json
    │   └── task_2.json
    └── templates/             # RIPER-5 模板
        ├── default.md         # 默认任务文件模板
        └── custom/            # 自定义模板
```

### 8.2 配置选项

```javascript
// .taskmaster/riper5/config.json
{
  "enabled": true,              // 全局启用/禁用 RIPER-5
  "defaultMode": "RESEARCH",    // 默认初始模式
  "taskFileTemplate": "default.md", // 默认任务文件模板
  "autoSwitchModes": false,     // 自动模式切换
  "strictModeTransitions": false, // 严格模式转换规则
  "ai": {
    "enhancePrompts": true,     // 增强 AI 提示
    "enforceFormatting": true   // 强制 AI 响应格式
  },
  "integration": {
    "showInTaskList": true,     // 在任务列表中显示 RIPER-5 信息
    "statusSync": true          // 同步任务状态更新
  }
}
```

## 9. 扩展点

### 9.1 自定义模板

允许用户创建自定义 RIPER-5 任务文件模板：

```bash
task-master riper5 template create [名称] [--from=现有模板]
task-master riper5 template list
task-master riper5 template set-default [名称]
```

### 9.2 集成外部工具

支持将任务进度导出为外部格式：

```bash
task-master riper5 export [任务ID] --format=[markdown|json|html]
```

### 9.3 团队协作

支持团队成员之间共享 RIPER-5 工作流：

```bash
task-master riper5 share [任务ID] --with=[用户ID|team]
``` 
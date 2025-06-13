# Task Master Pad 项目指引文档

## 1. 项目基本信息

### 项目名称
Pollinations TaskMaster (Task Master Pad)

### 主要功能
Task Master Pad 是一个由 AI 驱动的任务管理系统，专为软件开发工作流设计。它的主要功能包括：

- 基于产品需求文档 (PRD) 自动生成任务列表
- 提供任务依赖关系管理
- 支持任务分解和扩展
- 任务状态跟踪和更新
- 复杂度分析和报告
- 支持通过 MCP (Model Control Protocol) 协议与编辑器（如 Cursor）集成
- 提供命令行界面 (CLI) 进行任务管理

### 技术栈

- **编程语言**：JavaScript (Node.js)
- **运行时要求**：Node.js >= 18.0.0
- **AI 集成**：
  - 支持多种 AI 提供商：Anthropic, OpenAI, Google, Perplexity, Mistral, Azure OpenAI, OpenRouter, XAI, Ollama, Bedrock, Vertex AI, Pollinations, 自定义端点
  - 使用 AI SDK 与各种 LLM API 交互
- **框架与库**：
  - Express.js (MCP 服务器)
  - Commander.js (CLI 命令)
  - fastMCP (MCP 协议支持)
  - Zod (参数验证)
  - Inquirer (交互式命令行)
  - 其他 UI 相关库：chalk, boxen, ora, figlet, gradient-string
- **测试框架**：Jest
- **构建工具**：Biome

## 2. 构建体系

### 构建工具
- **Biome**：代码格式化与检查工具
- **Changesets**：版本管理与变更日志生成

### 依赖管理
- **包管理工具**：npm (package.json)
- **锁文件**：bun.lock
- **主要依赖**：
  - AI SDK 相关依赖 (@ai-sdk/*)
  - CLI 工具依赖 (commander, inquirer)
  - Web 服务器依赖 (express, fastmcp)
  - 展示相关依赖 (chalk, boxen, ora)

### 编译配置
- 项目使用 ES Modules (ESM) 格式
- Node.js 原生执行，无需编译转换
- 使用 `type: "module"` 在 package.json 中启用 ESM
- Jest 配置文件：jest.config.js
- Biome 配置文件：biome.json

### 运行脚本
主要 npm 脚本：
- `npm test`：运行测试
- `npm run changeset`：创建版本变更
- `npm run release`：发布版本
- `npm run mcp-server`：启动 MCP 服务器
- `npm run format`：格式化代码

## 3. 模块划分

### 项目结构

```
task-master-pad/
├── assets/             # 静态资源
├── bin/                # 可执行脚本入口
├── docs/               # 项目文档
├── mcp-server/         # MCP 服务器实现
│   └── src/
│       ├── core/       # 核心功能
│       └── tools/      # MCP 工具定义
├── scripts/
│   └── modules/        # 核心业务逻辑模块
│       ├── task-manager/ # 任务管理核心功能
│       └── ...         # 其他模块
├── src/
│   ├── ai-providers/   # AI 提供商集成
│   ├── constants/      # 常量定义
│   └── utils/          # 通用工具函数
└── tests/              # 测试目录
```

### 核心模块

1. **任务管理模块** (`scripts/modules/task-manager/`)
   - 任务创建、列表、状态管理
   - 任务扩展与分解
   - 任务依赖关系管理
   - 复杂度分析

2. **AI 服务模块** (`scripts/modules/ai-services-unified.js`)
   - 统一的 AI 服务层
   - 支持多种 AI 提供商
   - 处理生成文本、对象和流式文本

3. **AI 提供商实现** (`src/ai-providers/`)
   - 基础提供商抽象类
   - 各种 AI 服务提供商的具体实现
   - 支持 Anthropic, OpenAI, Google, Perplexity 等

4. **配置管理模块** (`scripts/modules/config-manager.js`)
   - 管理模型配置
   - 环境变量处理
   - 用户配置存储

5. **MCP 服务器模块** (`mcp-server/`)
   - 提供 Model Control Protocol 接口
   - 工具注册与管理
   - 会话处理和日志

6. **UI 模块** (`scripts/modules/ui.js`)
   - 命令行界面展示
   - 格式化输出
   - 用户交互处理

7. **命令模块** (`scripts/modules/commands.js`)
   - CLI 命令定义和处理
   - 参数解析
   - 交互式提示

### 组件关系

- **MCP 工具 → 直接函数 → 核心逻辑**：MCP 工具调用直接函数包装器，然后调用核心任务管理逻辑
- **CLI 命令 → 核心逻辑**：CLI 命令直接调用核心任务管理逻辑
- **核心逻辑 → AI 服务**：任务管理逻辑使用统一 AI 服务进行任务生成和更新
- **AI 服务 → AI 提供商**：统一 AI 服务层根据配置选择合适的 AI 提供商实现

## 4. 开发规范

### 代码风格
- 使用 ESM 模块系统
- 使用 Biome 进行代码格式化
- 使用 async/await 处理异步操作
- 使用 JSDoc 注释记录函数功能
- 统一错误处理模式
- 一致的日志记录方式

### 目录结构规范
- 按功能模块分组
- 核心逻辑与接口分离
- 测试与实现对应
- 工具函数集中管理
- 配置文件位于项目根目录

### 命名约定
- 文件名使用连字符分隔 (kebab-case)
- 函数和变量使用小驼峰命名 (camelCase)
- 类使用大驼峰命名 (PascalCase)
- 常量使用大写下划线命名 (UPPER_SNAKE_CASE)
- 遵循语义化命名原则

### 提交规范
- 使用 Changesets 管理版本和变更日志
- 主要变更类型：
  - 新功能 (Feature)
  - Bug 修复 (Bug Fix)
  - 重大变更 (Breaking Change)
  - 性能优化 (Performance Improvement)
  - 重构 (Refactoring)
  - 文档更新 (Documentation)
  - 依赖更新 (Dependency Update)
  - 构建/工具变更 (Build/Tooling Changes)

## 5. 部署说明

### 构建流程
1. 确保 Node.js 环境 (>=18.0.0)
2. 安装依赖：`npm install`
3. 运行测试：`npm test`
4. 代码格式化：`npm run format`
5. 创建变更集：`npm run changeset`
6. 发布版本：`npm run release`

### 部署方式

#### 全局安装
```bash
npm install -g pollinations-taskmaster
```

#### 本地项目安装
```bash
npm install pollinations-taskmaster
```

#### 通过 npx 运行
```bash
npx pollinations-taskmaster <command>
```

### 环境要求

#### 必需环境
- Node.js >= 18.0.0
- npm 或兼容的包管理器

#### 配置项
1. **API 密钥** (通过环境变量或 .env 文件)：
   - ANTHROPIC_API_KEY
   - PERPLEXITY_API_KEY
   - OPENAI_API_KEY
   - GOOGLE_API_KEY
   - MISTRAL_API_KEY
   - OPENROUTER_API_KEY
   - XAI_API_KEY
   - AZURE_OPENAI_API_KEY
   - OLLAMA_API_KEY

2. **端点配置**：
   - AZURE_OPENAI_ENDPOINT
   - OLLAMA_BASE_URL

3. **项目配置文件**：
   - `.taskmaster/config.json`：存储 AI 模型选择、参数设置、日志级别等

#### MCP 服务器部署
对于与编辑器（如 Cursor）集成，需要配置 MCP 服务器：

1. 编辑器全局配置（Cursor）：`~/.cursor/mcp.json`
2. 项目级配置：`<project_folder>/.cursor/mcp.json`

配置格式：
```json
{
  "mcpServers": {
    "taskmaster-ai": {
      "command": "npx",
      "args": ["-y", "--package=pollinations-taskmaster", "pollinations-taskmaster"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_API_KEY_HERE",
        ...其他 API 密钥...
      }
    }
  }
}
```

### 使用指南

#### 初始化项目
```bash
task-master init
```

#### 解析 PRD 生成任务
```bash
task-master parse-prd your-prd.txt
```

#### 查看任务列表
```bash
task-master list
```

#### 查看下一个任务
```bash
task-master next
```

#### 生成任务文件
```bash
task-master generate
```

## 6. 扩展与贡献

### 添加新的 AI 提供商
1. 在 `src/ai-providers/` 创建新的提供商实现
2. 继承 `BaseProvider` 类
3. 实现必要的方法
4. 在 `index.js` 中导出
5. 在 `ai-services-unified.js` 中注册提供商

### 添加新的 MCP 工具
1. 在 `mcp-server/src/tools/` 创建新的工具定义
2. 在 `mcp-server/src/core/direct-functions/` 创建对应的直接函数
3. 实现核心逻辑 (如需要)
4. 在 `mcp-server/src/tools/index.js` 中注册工具

### 添加新的 CLI 命令
1. 在 `scripts/modules/commands.js` 中定义新命令
2. 实现命令的核心逻辑
3. 更新命令文档 
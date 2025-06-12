# 安装与发布


## 1. 本地安装和测试

1. **创建本地测试包**：
   ```bash
   npm pack
   ```
   这会生成一个名为`pollinations-taskmaster-xxx.tgz`的压缩包。

2. **在其他项目中本地安装**：
   ```bash
   # 在另一个目录中
   npm install /path/to/pollinations-taskmaster-xxx.tgz
   ```

3. **全局安装**：
   ```bash
   npm install -g /path/to/pollinations-taskmaster-xxx.tgz
   ```
   
   安装后可以使用以下命令：
   - `task-master` - 运行CLI工具
   - `pollinations-taskmaster` - 相同的CLI工具（别名）
   - `task-master-mcp` - 启动MCP服务器
   - `pollinations-taskmaster-ai` - 同样是启动MCP服务器的别名

## 2. 发布到npm官方registry

### 准备工作

1. **注册npm账号**：
   如果你还没有npm账号，需要先在[npmjs.com](https://www.npmjs.com)注册。

2. **登录npm**：
   ```bash
   npm login
   ```
   输入你的用户名、密码和邮箱。

3. **确认包名唯一性**：
   包名`pollinations-taskmaster`必须在npm registry中是唯一的。可以在npm网站上搜索确认。

4. **确认许可证**：
   包使用的是`MIT WITH Commons-Clause`许可证，确保你有权限以此许可发布。

5. **检查`package.json`**：
   - 确保`name`字段正确
   - 确保`version`字段遵循语义化版本规范
   - 确保`bin`字段包含了正确的可执行文件路径
   - 确保`files`字段列出了所有需要包含在发布包中的文件和目录

### 发布流程

1. **创建变更集（如果使用changesets）**：
   ```bash
   npm run changeset
   ```
   根据提示选择要发布的包和版本升级类型（patch/minor/major）。

2. **发布到npm**：
   ```bash
   npm publish
   ```
   或者如果使用changesets：
   ```bash
   npm run release
   ```

3. **发布范围包（可选）**：
   如果想发布为组织范围的包（例如`@yourorg/pollinations-taskmaster`），修改`package.json`中的`name`字段，然后运行：
   ```bash
   npm publish --access public
   ```

## 3. 使用和安装

发布后，其他用户可以这样安装和使用：

1. **全局安装**：
   ```bash
   npm install -g pollinations-taskmaster
   ```

2. **作为项目依赖安装**：
   ```bash
   npm install pollinations-taskmaster
   ```

3. **使用CLI**：
   ```bash
   # 如果全局安装
   task-master init
   
   # 如果作为项目依赖安装
   npx task-master init
   ```

4. **使用MCP服务器**：
   ```bash
   # 如果全局安装
   task-master-mcp
   
   # 如果作为项目依赖安装
   npx task-master-mcp
   ```

## 注意事项

1. **依赖问题**：该包依赖Node.js 18+，确保用户使用兼容版本。

2. **API密钥**：用户需要设置一个`.env`文件或在`.cursor/mcp.json`中配置AI提供商的API密钥（如果不使用Pollinations）。

3. **文档**：确保用户了解如何配置和使用Task Master，包括如何设置模型和初始化项目。

4. **许可限制**：`MIT WITH Commons-Clause`许可证有商业限制，确保用户理解这一点。

5. **版本更新**：使用语义化版本规范进行后续更新，使用changesets追踪变更。

这样，用户就可以安装和使用你的Task Master包，包括我们之前修复的Pollinations适配功能！
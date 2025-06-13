/**
 * RIPER-5工作流工具集成测试
 */

import { expect } from 'chai';
import { mockLog } from '../test-utils.js';
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
} from '../../../../mcp-server/src/core/task-master-core.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('RIPER-5工作流MCP直接函数', () => {
  const testProjectRoot = path.join(os.tmpdir(), 'tm-test-riper5-' + Date.now().toString());
  
  beforeAll(() => {
    // 创建测试目录
    if (!fs.existsSync(testProjectRoot)) {
      fs.mkdirSync(testProjectRoot, { recursive: true });
    }
  });
  
  afterAll(() => {
    // 清理测试目录
    if (fs.existsSync(testProjectRoot)) {
      fs.rmSync(testProjectRoot, { recursive: true, force: true });
    }
  });
  
  describe('initializeRiper5Direct函数', () => {
    it('应该成功初始化RIPER-5工作流', async () => {
      const result = await initializeRiper5Direct({
        projectRoot: testProjectRoot,
        taskId: '1',
        options: {}
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.true;
      expect(result).to.have.property('data');
    });
  });

  describe('switchModeDirect函数', () => {
    it('应该验证必要参数', async () => {
      // 测试缺少taskId
      const result1 = await switchModeDirect({
        projectRoot: testProjectRoot,
        mode: 'research'
      }, mockLog());
      
      expect(result1).to.have.property('success').that.is.false;
      expect(result1.error).to.have.property('code').that.equals('MISSING_PARAM');
      
      // 测试缺少mode
      const result2 = await switchModeDirect({
        projectRoot: testProjectRoot,
        taskId: '1'
      }, mockLog());
      
      expect(result2).to.have.property('success').that.is.false;
      expect(result2.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
  });

  describe('getStatusDirect函数', () => {
    it('应该在没有taskId时成功获取所有任务状态', async () => {
      const result = await getStatusDirect({
        projectRoot: testProjectRoot
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.true;
      expect(Array.isArray(result.data)).to.be.true;
    });
  });

  describe('getModeProgressDirect函数', () => {
    it('应该验证必要参数', async () => {
      // 测试缺少taskId
      const result1 = await getModeProgressDirect({
        projectRoot: testProjectRoot,
        mode: 'research'
      }, mockLog());
      
      expect(result1).to.have.property('success').that.is.false;
      expect(result1.error).to.have.property('code').that.equals('MISSING_PARAM');
      
      // 测试缺少mode
      const result2 = await getModeProgressDirect({
        projectRoot: testProjectRoot,
        taskId: '1'
      }, mockLog());
      
      expect(result2).to.have.property('success').that.is.false;
      expect(result2.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
  });

  describe('getAllModeProgressDirect函数', () => {
    it('应该验证必要参数', async () => {
      const result = await getAllModeProgressDirect({
        projectRoot: testProjectRoot
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.false;
      expect(result.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
  });

  describe('getNextRecommendedModeDirect函数', () => {
    it('应该验证必要参数', async () => {
      const result = await getNextRecommendedModeDirect({
        projectRoot: testProjectRoot
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.false;
      expect(result.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
  });

  describe('getModeHistoryDirect函数', () => {
    it('应该验证必要参数', async () => {
      const result = await getModeHistoryDirect({
        projectRoot: testProjectRoot
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.false;
      expect(result.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
  });

  describe('exportModeHistoryReportDirect函数', () => {
    it('应该验证必要参数', async () => {
      const result = await exportModeHistoryReportDirect({
        projectRoot: testProjectRoot
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.false;
      expect(result.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
    
    it('应该验证格式有效性', async () => {
      const result = await exportModeHistoryReportDirect({
        projectRoot: testProjectRoot,
        taskId: '1',
        format: 'invalid'
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.false;
      expect(result.error).to.have.property('code').that.equals('INVALID_FORMAT');
    });
  });

  describe('addHistoryCommentDirect函数', () => {
    it('应该验证必要参数', async () => {
      // 测试缺少taskId
      const result1 = await addHistoryCommentDirect({
        projectRoot: testProjectRoot,
        historyIndex: 0,
        comment: 'Test comment'
      }, mockLog());
      
      expect(result1).to.have.property('success').that.is.false;
      expect(result1.error).to.have.property('code').that.equals('MISSING_PARAM');
      
      // 测试缺少historyIndex
      const result2 = await addHistoryCommentDirect({
        projectRoot: testProjectRoot,
        taskId: '1',
        comment: 'Test comment'
      }, mockLog());
      
      expect(result2).to.have.property('success').that.is.false;
      expect(result2.error).to.have.property('code').that.equals('MISSING_PARAM');
      
      // 测试缺少comment
      const result3 = await addHistoryCommentDirect({
        projectRoot: testProjectRoot,
        taskId: '1',
        historyIndex: 0
      }, mockLog());
      
      expect(result3).to.have.property('success').that.is.false;
      expect(result3.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
  });

  describe('generateTaskFileDirect函数', () => {
    it('应该验证必要参数', async () => {
      // 测试缺少taskId
      const result1 = await generateTaskFileDirect({
        projectRoot: testProjectRoot,
        outputDir: path.join(testProjectRoot, 'output')
      }, mockLog());
      
      expect(result1).to.have.property('success').that.is.false;
      expect(result1.error).to.have.property('code').that.equals('MISSING_PARAM');
      
      // 测试缺少outputDir
      const result2 = await generateTaskFileDirect({
        projectRoot: testProjectRoot,
        taskId: '1'
      }, mockLog());
      
      expect(result2).to.have.property('success').that.is.false;
      expect(result2.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
  });

  describe('exportTaskReportDirect函数', () => {
    it('应该验证必要参数', async () => {
      // 测试缺少taskId
      const result1 = await exportTaskReportDirect({
        projectRoot: testProjectRoot,
        outputDir: path.join(testProjectRoot, 'output')
      }, mockLog());
      
      expect(result1).to.have.property('success').that.is.false;
      expect(result1.error).to.have.property('code').that.equals('MISSING_PARAM');
      
      // 测试缺少outputDir
      const result2 = await exportTaskReportDirect({
        projectRoot: testProjectRoot,
        taskId: '1'
      }, mockLog());
      
      expect(result2).to.have.property('success').that.is.false;
      expect(result2.error).to.have.property('code').that.equals('MISSING_PARAM');
    });
    
    it('应该验证格式有效性', async () => {
      const result = await exportTaskReportDirect({
        projectRoot: testProjectRoot,
        taskId: '1',
        outputDir: path.join(testProjectRoot, 'output'),
        format: 'invalid'
      }, mockLog());
      
      expect(result).to.have.property('success').that.is.false;
      expect(result.error).to.have.property('code').that.equals('INVALID_FORMAT');
    });
  });
}); 
/**
 * RIPER-5模式管理系统测试脚本
 * 
 * 这个脚本测试RIPER-5模式管理系统的功能，包括模式切换、规则验证和历史记录
 */

import * as riper5 from './index.js';
import { getEnumValues } from '../utils.js';

// 任务ID
const TASK_ID = 'test-task-123';

/**
 * 执行测试
 */
async function runTests() {
  console.log('开始测试RIPER-5模式管理系统...');
  
  // 初始化RIPER-5
  console.log('\n1. 初始化RIPER-5工作流');
  const initResult = await riper5.initialize();
  console.log(`初始化结果: ${initResult.success ? '成功' : '失败'}`);
  if (!initResult.success) {
    console.error(`错误: ${initResult.message}`);
    return;
  }
  
  // 获取当前状态（如果不存在会创建一个）
  console.log('\n2. 获取测试任务状态');
  const { success, state } = await riper5.stateManager.getState(TASK_ID);
  console.log(`获取状态结果: ${success ? '成功' : '失败'}`);
  if (!success) {
    console.error(`错误: ${state.message}`);
    return;
  }
  console.log(`当前模式: ${state.currentMode}`);
  
  // 获取模式进度
  console.log('\n3. 获取模式进度');
  const progressResult = await riper5.modeManager.getModeProgress(TASK_ID, state.currentMode);
  console.log(`获取进度结果: ${progressResult.success ? '成功' : '失败'}`);
  if (progressResult.success) {
    console.log(`模式 ${progressResult.progress.mode} 进度: ${progressResult.progress.percentage.toFixed(1)}%`);
    console.log(`完成项: ${progressResult.progress.completedItems}/${progressResult.progress.totalItems}`);
  }
  
  // 更新检查列表项
  console.log('\n4. 更新检查列表项');
  // 更新第一个检查列表项为已完成
  const checklistResult = await riper5.stateManager.updateChecklistItem(TASK_ID, state.currentMode, 0, true);
  console.log(`更新检查列表项结果: ${checklistResult.success ? '成功' : '失败'}`);
  
  // 添加笔记
  console.log('\n5. 添加模式笔记');
  const noteResult = await riper5.stateManager.updateNote(
    TASK_ID, 
    state.currentMode, 
    '这是一条测试笔记，记录了当前模式的重要信息。', 
    true
  );
  console.log(`添加笔记结果: ${noteResult.success ? '成功' : '失败'}`);
  
  // 获取转换规则
  console.log('\n6. 获取模式转换规则');
  const rulesResult = await riper5.modeManager.getTransitionRules();
  console.log(`获取规则结果: ${rulesResult.success ? '成功' : '失败'}`);
  if (rulesResult.success) {
    console.log(`规则数量: ${rulesResult.rules.length}`);
    rulesResult.rules.forEach(rule => {
      console.log(`- ${rule.name} (${rule.id}): ${rule.description}`);
    });
  }
  
  // 测试模式切换
  console.log('\n7. 测试模式切换');
  // 获取可能的下一个模式
  const modesArray = getEnumValues(riper5.MODES);
  const currentModeIndex = modesArray.indexOf(state.currentMode);
  const nextMode = modesArray[(currentModeIndex + 1) % modesArray.length];
  
  console.log(`尝试从 ${state.currentMode} 切换到 ${nextMode}`);
  const switchResult = await riper5.modeManager.switchMode(nextMode, {
    taskId: TASK_ID,
    note: '这是一次测试模式切换',
    ignoreWarnings: true
  });
  
  console.log(`模式切换结果: ${switchResult.success ? '成功' : '失败'}`);
  if (!switchResult.success) {
    console.error(`切换失败原因: ${switchResult.message}`);
    if (switchResult.validationResult) {
      console.log('验证结果:');
      if (switchResult.validationResult.errors && switchResult.validationResult.errors.length > 0) {
        console.log('错误:');
        switchResult.validationResult.errors.forEach(error => {
          console.log(`- ${error.message}`);
          if (error.recommendation) {
            console.log(`  建议: ${error.recommendation}`);
          }
        });
      }
      
      if (switchResult.validationResult.warnings && switchResult.validationResult.warnings.length > 0) {
        console.log('警告:');
        switchResult.validationResult.warnings.forEach(warning => {
          console.log(`- ${warning.message}`);
          if (warning.recommendation) {
            console.log(`  建议: ${warning.recommendation}`);
          }
        });
      }
    }
  } else {
    console.log(`成功切换到 ${switchResult.state.currentMode} 模式`);
  }
  
  // 使用强制选项切换模式
  console.log('\n8. 使用强制选项切换模式');
  const forceSwitchResult = await riper5.modeManager.switchMode(
    modesArray[(currentModeIndex + 2) % modesArray.length], 
    {
      taskId: TASK_ID,
      note: '这是一次强制模式切换',
      force: true
    }
  );
  
  console.log(`强制模式切换结果: ${forceSwitchResult.success ? '成功' : '失败'}`);
  if (forceSwitchResult.success) {
    console.log(`成功切换到 ${forceSwitchResult.state.currentMode} 模式`);
  }
  
  // 获取历史记录
  console.log('\n9. 获取模式历史记录');
  const historyResult = await riper5.modeManager.getModeHistory(TASK_ID);
  console.log(`获取历史记录结果: ${historyResult.success ? '成功' : '失败'}`);
  if (historyResult.success) {
    console.log(`历史记录条目数: ${historyResult.history.entries.length}`);
    console.log('历史摘要:');
    console.log(`- 总转换次数: ${historyResult.history.summary.totalTransitions}`);
    console.log(`- 当前模式: ${historyResult.history.summary.currentMode}`);
    console.log(`- 使用最多的模式: ${historyResult.history.summary.mostUsedMode || '无'}`);
    
    console.log('\n历史条目:');
    historyResult.history.entries.forEach((entry, index) => {
      const date = new Date(entry.timestamp).toLocaleString();
      console.log(`${index + 1}. ${entry.mode} (${date}): ${entry.note || '无附注'}`);
    });
  }
  
  // 导出历史报告
  console.log('\n10. 导出历史报告');
  const reportResult = await riper5.modeManager.exportModeHistoryReport(TASK_ID, 'markdown');
  console.log(`导出报告结果: ${reportResult.success ? '成功' : '失败'}`);
  if (reportResult.success) {
    console.log(`报告已保存到: ${reportResult.reportPath}`);
  }
  
  // 获取下一个推荐模式
  console.log('\n11. 获取下一个推荐模式');
  const recommendationResult = await riper5.modeManager.getNextRecommendedMode(TASK_ID);
  console.log(`获取推荐结果: ${recommendationResult.success ? '成功' : '失败'}`);
  if (recommendationResult.success) {
    const recommendation = recommendationResult.recommendation;
    if (Array.isArray(recommendation.mode)) {
      console.log(`推荐多个模式: ${recommendation.mode.join(', ')}`);
      console.log(`主要推荐: ${recommendation.primaryRecommendation}`);
    } else {
      console.log(`推荐模式: ${recommendation.mode || '无'}`);
    }
    console.log(`推荐理由: ${recommendation.reason}`);
  }
  
  // 添加历史记录注释
  console.log('\n12. 添加历史记录注释');
  const commentResult = await riper5.modeManager.addHistoryComment(
    TASK_ID, 
    historyResult.history.entries.length - 1, 
    '这是对最近一次模式切换的重要注释'
  );
  console.log(`添加注释结果: ${commentResult.success ? '成功' : '失败'}`);
  
  // 添加自定义规则
  console.log('\n13. 添加自定义转换规则');
  const customRule = {
    id: 'test-custom-rule',
    name: '测试自定义规则',
    description: '这是一个测试用的自定义规则，用于演示规则系统',
    condition: async (fromMode, toMode, context) => {
      // 简单的测试规则：不允许在同一天内多次切换到同一个模式
      const { taskId } = context;
      const { success, state } = await riper5.stateManager.getState(taskId);
      
      if (!success || !state) {
        return { isValid: true, message: '无法获取状态，跳过规则验证' };
      }
      
      // 查找历史记录中是否有今天切换到目标模式的记录
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const hasSwitchedToday = state.modeHistory.some(entry => {
        const entryDate = entry.timestamp.split('T')[0];
        return entry.mode === toMode && entryDate === today;
      });
      
      if (hasSwitchedToday) {
        return {
          isValid: false,
          message: `今天已经切换到 ${toMode} 模式`,
          recommendation: '请明天再尝试切换到此模式',
          severity: 'warning'
        };
      }
      
      return { isValid: true, message: '自定义规则验证通过' };
    }
  };
  
  const addRuleResult = await riper5.modeManager.addTransitionRule(customRule);
  console.log(`添加自定义规则结果: ${addRuleResult.success ? '成功' : '失败'}`);
  
  // 再次获取规则列表，确认自定义规则已添加
  const updatedRulesResult = await riper5.modeManager.getTransitionRules();
  if (updatedRulesResult.success) {
    console.log(`更新后的规则数量: ${updatedRulesResult.rules.length}`);
  }
  
  console.log('\n测试完成！');
}

// 执行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});

export { runTests }; 
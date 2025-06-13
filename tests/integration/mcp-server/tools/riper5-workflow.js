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
  // ... existing code ...
}); 
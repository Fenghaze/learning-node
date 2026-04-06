import { test, expect } from '@playwright/test';

test.describe('账户记账应用 - E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('首页加载正确', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('简易记账本');
    await expect(page.locator('.stats')).toBeVisible();
    await expect(page.locator('#addForm')).toBeVisible();
  });

  test('添加支出账单', async ({ page }) => {
    const uniqueAmount = Date.now().toString().slice(-5) + '.50';

    await page.fill('input[name="date"]', '2026-01-15');
    await page.selectOption('#typeSelect', 'expense');
    await page.selectOption('#categorySelect', '餐饮');
    await page.fill('input[name="amount"]', uniqueAmount);
    await page.fill('input[name="remark"]', 'E2E测试支出');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('添加成功');
    await expect(page.locator('.account-item.expense').filter({ hasText: uniqueAmount })).toBeVisible();
  });

  test('添加收入账单', async ({ page }) => {
    const uniqueAmount = Date.now().toString().slice(-6) + '.00';

    await page.fill('input[name="date"]', '2026-01-16');
    await page.selectOption('#typeSelect', 'income');
    await page.fill('input[name="amount"]', uniqueAmount);
    await page.fill('input[name="remark"]', 'E2E测试收入');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('添加成功');
    await expect(page.locator('.account-item.income').filter({ hasText: uniqueAmount })).toBeVisible();
  });

  test('添加账单 - 验证必填字段', async ({ page }) => {
    // HTML5 原生验证会阻止提交，检查必填字段的 required 属性
    const dateInput = page.locator('input[name="date"]');
    const amountInput = page.locator('input[name="amount"]');

    await expect(dateInput).toHaveAttribute('required', '');
    await expect(amountInput).toHaveAttribute('required', '');
  });

  test('添加账单 - 验证金额有效性', async ({ page }) => {
    await page.fill('input[name="date"]', '2026-01-01');
    await page.fill('input[name="amount"]', '-50');

    // 点击提交后 HTML5 验证会显示内置错误提示
    await page.locator('#addForm button[type="submit"]').click();

    // 检查 amount 输入框有 min 属性
    await expect(page.locator('input[name="amount"]')).toHaveAttribute('min', '0.01');
  });

  test('类型切换显示/隐藏分类', async ({ page }) => {
    const categoryRow = page.locator('#categoryRow');

    await expect(categoryRow).toBeVisible();

    await page.selectOption('#typeSelect', 'income');
    await expect(categoryRow).toBeHidden();

    await page.selectOption('#typeSelect', 'expense');
    await expect(categoryRow).toBeVisible();
  });

  test('自定义分类功能', async ({ page }) => {
    const uniqueCategory = '自定义' + Date.now().toString().slice(-4);

    await page.fill('input[name="date"]', '2026-01-17');
    await page.selectOption('#typeSelect', 'expense');
    await page.selectOption('#categorySelect', 'custom');
    await page.fill('#customCategory', uniqueCategory);
    await page.fill('input[name="amount"]', '31.00');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('添加成功');
    await expect(page.locator('.account-item').filter({ hasText: uniqueCategory })).toBeVisible();
  });

  test('编辑账单', async ({ page }) => {
    const uniqueAmount = '99.' + Date.now().toString().slice(-2);

    await page.fill('input[name="date"]', '2026-01-18');
    await page.selectOption('#typeSelect', 'expense');
    await page.selectOption('#categorySelect', '餐饮');
    await page.fill('input[name="amount"]', uniqueAmount);
    await page.fill('input[name="remark"]', '待编辑');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('添加成功');

    await page.locator('.account-item.expense').filter({ hasText: uniqueAmount }).locator('.btn-edit').click();

    await expect(page.locator('h1')).toContainText('编辑账单');

    const newAmount = (parseFloat(uniqueAmount) + 10).toFixed(2);
    await page.fill('input[name="amount"]', newAmount);
    await page.locator('#editForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('更新成功');
  });

  test('编辑页面 - 返回列表按钮', async ({ page }) => {
    await page.locator('.btn-edit').first().click();
    await page.click('.btn-back');
    await expect(page.locator('h1')).toContainText('简易记账本');
  });

  test('删除账单', async ({ page }) => {
    const uniqueAmount = '88.' + Date.now().toString().slice(-2);

    await page.fill('input[name="date"]', '2026-01-19');
    await page.selectOption('#typeSelect', 'expense');
    await page.selectOption('#categorySelect', '餐饮');
    await page.fill('input[name="amount"]', uniqueAmount);
    await page.locator('#addForm button[type="submit"]').click();

    const initialCount = await page.locator('.account-item').count();

    page.on('dialog', dialog => dialog.accept());
    await page.locator('.account-item.expense').filter({ hasText: uniqueAmount }).locator('.btn-delete').click();

    await expect(page.locator('.message.success')).toContainText('删除成功');
  });

  test('统计数据显示正确', async ({ page }) => {
    await expect(page.locator('.stat-card')).toHaveCount(3);
    await expect(page.locator('.stat-card.income .stat-value')).toBeVisible();
    await expect(page.locator('.stat-card.expense .stat-value')).toBeVisible();
    await expect(page.locator('.stat-card.balance .stat-value')).toBeVisible();
  });

  test('空列表状态显示', async ({ page }) => {
    const emptyMessage = page.locator('.empty');
    const listSection = page.locator('.account-list');

    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toContainText('暂无账单记录');
    }
  });

  test('支出分类统计显示', async ({ page }) => {
    const categoryStats = page.locator('.category-stats');
    if (await categoryStats.isVisible()) {
      await expect(page.locator('.category-item').first()).toBeVisible();
    }
  });

  test('账单不存在时跳转', async ({ page }) => {
    await page.goto('/edit/nonexistent-id');
    await expect(page.locator('.message.error')).toContainText('账单不存在');
  });

  test('页面响应式布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('#addForm')).toBeVisible();
  });

  // ========== 清除账单功能测试 ==========

  test('清空所有账单', async ({ page }) => {
    // 1. 添加测试数据
    const amount1 = '11.' + Date.now().toString().slice(-2);
    const amount2 = '22.' + Date.now().toString().slice(-2);

    await page.fill('#addForm input[name="date"]', '2026-02-01');
    await page.selectOption('#addForm #typeSelect', 'expense');
    await page.selectOption('#addForm #categorySelect', '餐饮');
    await page.fill('#addForm input[name="amount"]', amount1);
    await page.fill('#addForm input[name="remark"]', '清空测试1');
    await page.locator('#addForm button[type="submit"]').click();

    await page.fill('#addForm input[name="date"]', '2026-02-02');
    await page.fill('#addForm input[name="amount"]', amount2);
    await page.fill('#addForm input[name="remark"]', '清空测试2');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('添加成功');

    // 2. 点击"清空所有账单"按钮
    await page.click('button:has-text("清空所有账单")');

    // 3. 确认对话框
    await page.evaluate(() => {
      window.confirm = () => true;
      document.getElementById('clearAllForm').submit();
    });

    // 4. 验证所有账单被清空
    await expect(page.locator('.message.success')).toContainText('已清空所有账单');
    await expect(page.locator('.empty')).toContainText('暂无账单记录');
    // 统计数据归零
    const incomeValue = await page.locator('.stat-card.income .stat-value').textContent();
    const expenseValue = await page.locator('.stat-card.expense .stat-value').textContent();
    expect(incomeValue).toContain('0.00');
    expect(expenseValue).toContain('0.00');
  });

  test('按条件清除账单', async ({ page }) => {
    // 1. 添加多条不同类型的账单
    const uniquePrefix = Date.now().toString().slice(-4);

    // 支出 - 餐饮 - 2026-03-01
    await page.fill('#addForm input[name="date"]', '2026-03-01');
    await page.selectOption('#addForm #typeSelect', 'expense');
    await page.selectOption('#addForm #categorySelect', '餐饮');
    await page.fill('#addForm input[name="amount"]', '31.' + uniquePrefix);
    await page.fill('#addForm input[name="remark"]', '条件清除餐饮');
    await page.locator('#addForm button[type="submit"]').click();

    // 支出 - 交通 - 2026-03-02
    await page.fill('#addForm input[name="date"]', '2026-03-02');
    await page.selectOption('#addForm #typeSelect', 'expense');
    await page.selectOption('#addForm #categorySelect', '交通');
    await page.fill('#addForm input[name="amount"]', '32.' + uniquePrefix);
    await page.fill('#addForm input[name="remark"]', '条件清除交通');
    await page.locator('#addForm button[type="submit"]').click();

    // 收入 - 2026-03-03
    await page.fill('#addForm input[name="date"]', '2026-03-03');
    await page.selectOption('#addForm #typeSelect', 'income');
    await page.fill('#addForm input[name="amount"]', '100.' + uniquePrefix);
    await page.fill('#addForm input[name="remark"]', '条件清除收入');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('添加成功');

    // 2. 填写筛选条件 - 清除支出类型的账单
    await page.fill('input[name="startDate"]', '2026-03-01');
    await page.fill('input[name="endDate"]', '2026-03-31');
    await page.selectOption('select[name="type"]', 'expense');
    await page.selectOption('select[name="category"]', 'all');

    // 3. 提交
    await page.click('button:has-text("清除符合条件的账单")');

    // 4. 验证符合条件的被清除（支出类型的被删除，收入保留）
    await expect(page.locator('.message.success')).toContainText('已清除 2 条账单');
    // 应该只剩收入那一条
    await expect(page.locator('.account-item.income')).toHaveCount(1);
    await expect(page.locator('.account-item.expense')).toHaveCount(0);
  });

  test('批量删除账单', async ({ page }) => {
    // 1. 添加多条账单
    const uniquePrefix = Date.now().toString().slice(-5);

    await page.fill('#addForm input[name="date"]', '2026-04-01');
    await page.selectOption('#addForm #typeSelect', 'expense');
    await page.selectOption('#addForm #categorySelect', '餐饮');
    await page.fill('#addForm input[name="amount"]', '41.' + uniquePrefix);
    await page.fill('#addForm input[name="remark"]', '批量删除1');
    await page.locator('#addForm button[type="submit"]').click();

    await page.fill('#addForm input[name="date"]', '2026-04-02');
    await page.fill('#addForm input[name="amount"]', '42.' + uniquePrefix);
    await page.fill('#addForm input[name="remark"]', '批量删除2');
    await page.locator('#addForm button[type="submit"]').click();

    await page.fill('#addForm input[name="date"]', '2026-04-03');
    await page.fill('#addForm input[name="amount"]', '43.' + uniquePrefix);
    await page.fill('#addForm input[name="remark"]', '批量删除3');
    await page.locator('#addForm button[type="submit"]').click();

    await page.fill('#addForm input[name="date"]', '2026-04-04');
    await page.fill('#addForm input[name="amount"]', '44.' + uniquePrefix);
    await page.fill('#addForm input[name="remark"]', '批量删除4');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toContainText('添加成功');
    await expect(page.locator('.account-item.expense')).toHaveCount(4);

    // 2. 勾选2-3条账单（第1、3、4条）
    const checkboxes = page.locator('input[name="ids"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(2).check();
    await checkboxes.nth(3).check();

    // 3. 点击"删除选中"
    await page.click('button:has-text("删除选中")');

    // 4. 确认对话框
    await page.evaluate(() => {
      window.confirm = () => true;
      document.getElementById('batchDeleteForm').submit();
    });

    // 5. 验证选中的被删除，未勾选的保留
    await expect(page.locator('.message.success')).toContainText('已删除 3 条账单');
    await expect(page.locator('.account-item.expense')).toHaveCount(1);
    // 应该只剩第2条
    await expect(page.locator('.account-item').filter({ hasText: '42.' + uniquePrefix })).toBeVisible();
  });
});
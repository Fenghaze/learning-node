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
    await page.click('button[type="submit"]');

    await expect(page.locator('.message.success')).toContainText('添加成功');
    await expect(page.locator('.account-item.expense').filter({ hasText: uniqueAmount })).toBeVisible();
  });

  test('添加收入账单', async ({ page }) => {
    const uniqueAmount = Date.now().toString().slice(-6) + '.00';

    await page.fill('input[name="date"]', '2026-01-16');
    await page.selectOption('#typeSelect', 'income');
    await page.fill('input[name="amount"]', uniqueAmount);
    await page.fill('input[name="remark"]', 'E2E测试收入');
    await page.click('button[type="submit"]');

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
    await page.click('button[type="submit"]');

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
    await page.click('button[type="submit"]');

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
    await page.click('button[type="submit"]');

    await expect(page.locator('.message.success')).toContainText('添加成功');

    await page.locator('.account-item.expense').filter({ hasText: uniqueAmount }).locator('.btn-edit').click();

    await expect(page.locator('h1')).toContainText('编辑账单');

    const newAmount = (parseFloat(uniqueAmount) + 10).toFixed(2);
    await page.fill('input[name="amount"]', newAmount);
    await page.click('button[type="submit"]');

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
    await page.click('button[type="submit"]');

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
});
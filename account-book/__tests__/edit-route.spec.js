import { test, expect } from '@playwright/test';

test.describe('编辑账单 E2E 测试', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('GET /edit/:id - 存在的账单显示编辑表单', async ({ page }) => {
    // 添加账单
    await page.selectOption('#addForm select[name="type"]', 'expense');
    await page.selectOption('#addForm select[name="category"]', '餐饮');
    await page.fill('#addForm input[name="amount"]', '99');
    await page.locator('#addForm button[type="submit"]').click();

    await expect(page.locator('.message.success')).toBeVisible();

    // 进入编辑页
    await page.click('.account-item .btn-edit');
    await page.waitForURL(/\/edit\/\d+/);

    // 验证编辑页面
    await expect(page.locator('h1')).toContainText('编辑账单');
    await expect(page.locator('input[name="amount"]')).toHaveValue('99');
  });

  test('GET /edit/:id - 不存在的账单重定向', async ({ page }) => {
    await page.goto('/edit/999999');
    await expect(page).toHaveURL(/\/\?error=/);
    await expect(page.locator('.message.error')).toContainText('账单不存在');
  });

  test('POST /edit/:id - 成功更新', async ({ page }) => {
    // 添加
    await page.selectOption('#addForm select[name="type"]', 'expense');
    await page.selectOption('#addForm select[name="category"]', '交通');
    await page.fill('#addForm input[name="amount"]', '50');
    await page.locator('#addForm button[type="submit"]').click();
    await expect(page.locator('.message.success')).toBeVisible();

    // 编辑
    await page.click('.account-item .btn-edit');
    await page.waitForURL(/\/edit\/\d+/);
    await page.fill('input[name="amount"]', '150');
    await page.locator('#editForm button[type="submit"]').click();

    // 验证成功
    await expect(page).toHaveURL(/\/\?success=/);
    await expect(page.locator('.message.success')).toContainText('更新成功');
  });

  test('POST /edit/:id - 无效金额报错', async ({ page }) => {
    // 添加
    await page.selectOption('#addForm select[name="type"]', 'income');
    await page.fill('#addForm input[name="amount"]', '100');
    await page.locator('#addForm button[type="submit"]').click();
    await expect(page.locator('.message.success')).toBeVisible();

    // 编辑
    await page.click('.account-item .btn-edit');
    await page.waitForURL(/\/edit\/\d+/);
    await page.fill('input[name="amount"]', '-10');  // 负数金额
    await page.locator('#editForm button[type="submit"]').click();

    // 验证错误
    await expect(page.locator('.message.error')).toContainText('请输入有效的金额');
  });

  test('POST /edit/:id - 支出未选分类报错', async ({ page }) => {
    // 添加
    await page.selectOption('#addForm select[name="type"]', 'expense');
    await page.selectOption('#addForm select[name="category"]', '餐饮');
    await page.fill('#addForm input[name="amount"]', '100');
    await page.locator('#addForm button[type="submit"]').click();
    await expect(page.locator('.message.success')).toBeVisible();

    // 编辑
    await page.click('.account-item .btn-edit');
    await page.waitForURL(/\/edit\/\d+/);

    // 验证页面正常显示
    await expect(page.locator('h1')).toContainText('编辑账单');
  });
});

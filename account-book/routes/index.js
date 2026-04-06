import express from 'express';
import * as accounts from '../data/accounts.js';

const router = express.Router();

// ============================================================
// 公共工具函数
// ============================================================

/**
 * 构建重定向 URL
 * @param {string} message - 提示消息
 * @param {string} type - success 或 error
 * @returns {string} 编码后的重定向 URL
 */
const buildRedirectUrl = (message, type) => {
  return `/?${type}=${encodeURIComponent(message)}`;
};

/**
 * 构建编辑页重定向 URL
 * @param {string} id - 账单 ID
 * @param {string} message - 提示消息
 * @returns {string} 编码后的重定向 URL
 */
const buildEditRedirectUrl = (id, message) => {
  return `/edit/${id}?error=${encodeURIComponent(message)}`;
};

// ============================================================
// 路由定义
// ============================================================

/* GET home page - 账单列表 */
router.get('/', async (req, res, next) => {
  try {
    const accountList = await accounts.getAll();
    const stats = await accounts.getStats();
    const categoryStats = await accounts.getCategoryStats();
    res.render('index', {
      title: '简易记账本',
      accounts: accountList,
      stats,
      categoryStats,
      expenseCategories: accounts.EXPENSE_CATEGORIES,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    next(err);
  }
});

/* POST add - 添加账单 */
router.post('/add', async (req, res, next) => {
  try {
    const { date, type, category, amount, remark } = req.body;

    // 验证必填字段
    if (!date || !amount) {
      return res.redirect(buildRedirectUrl('请填写日期和金额', 'error'));
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.redirect(buildRedirectUrl('请输入有效的金额', 'error'));
    }

    if (!type || (type !== 'income' && type !== 'expense')) {
      return res.redirect(buildRedirectUrl('请选择收入或支出类型', 'error'));
    }

    // 支出时分类必填
    if (type === 'expense' && !category) {
      return res.redirect(buildRedirectUrl('支出必须选择或输入分类', 'error'));
    }

    const newAccount = {
      date,
      type,
      category: type === 'expense' ? category : '',
      amount: amountValue,
      remark: remark || ''
    };

    await accounts.add(newAccount);
    res.redirect(buildRedirectUrl('添加成功', 'success'));
  } catch (err) {
    next(err);
  }
});

/* GET edit/:id - 编辑页面 */
router.get('/edit/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await accounts.getById(id);

    if (!account) {
      return res.redirect(buildRedirectUrl('账单不存在', 'error'));
    }

    res.render('edit', {
      title: '编辑账单',
      account,
      expenseCategories: accounts.EXPENSE_CATEGORIES,
      error: req.query.error || null
    });
  } catch (err) {
    next(err);
  }
});

/* POST edit/:id - 提交编辑 */
router.post('/edit/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, type, category, amount, remark } = req.body;

    // 验证必填字段
    if (!date || !amount) {
      return res.redirect(buildEditRedirectUrl(id, '请填写日期和金额'));
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.redirect(buildEditRedirectUrl(id, '请输入有效的金额'));
    }

    if (!type || (type !== 'income' && type !== 'expense')) {
      return res.redirect(buildEditRedirectUrl(id, '请选择收入或支出类型'));
    }

    if (type === 'expense' && !category) {
      return res.redirect(buildEditRedirectUrl(id, '支出必须选择或输入分类'));
    }

    const updated = await accounts.update(id, {
      date,
      type,
      category: type === 'expense' ? category : '',
      amount: amountValue,
      remark: remark || ''
    });

    if (!updated) {
      return res.redirect(buildRedirectUrl('账单不存在', 'error'));
    }
    res.redirect(buildRedirectUrl('更新成功', 'success'));
  } catch (err) {
    next(err);
  }
});

/* GET delete/:id - 删除账单 */
router.get('/delete/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await accounts.remove(id);

    if (deleted) {
      res.redirect(buildRedirectUrl('删除成功', 'success'));
    } else {
      res.redirect(buildRedirectUrl('账单不存在', 'error'));
    }
  } catch (err) {
    next(err);
  }
});

/* POST clear-all - 清空所有账单 */
router.post('/clear-all', async (_req, res, next) => {
  try {
    await accounts.clearAll();
    res.redirect(buildRedirectUrl('已清空所有账单', 'success'));
  } catch (err) {
    next(err);
  }
});

/* POST clear-by-condition - 按条件清除账单 */
router.post('/clear-by-condition', async (req, res, next) => {
  try {
    const { startDate, endDate, type, category } = req.body;
    const count = await accounts.clearByCondition({ startDate, endDate, type, category });
    res.redirect(buildRedirectUrl(`已清除 ${count} 条账单`, 'success'));
  } catch (err) {
    next(err);
  }
});

/* POST /query - 按条件查询账单 */
router.post('/query', async (req, res, next) => {
  try {
    const { startDate, endDate, type, category, minAmount, maxAmount, page, limit } = req.body;
    const { list: accountList, total } = await accounts.queryByCondition({
      startDate,
      endDate,
      type,
      category,
      minAmount,
      maxAmount,
      page,
      limit
    });
    const stats = await accounts.getStats();
    const categoryStats = await accounts.getCategoryStats();
    const currentPage = page ? parseInt(page) : 1;
    const pageLimit = limit ? parseInt(limit) : 15;
    const startNum = (currentPage - 1) * pageLimit + 1;
    const endNum = Math.min(currentPage * pageLimit, total);
    res.render('index', {
      title: '简易记账本 - 查询结果',
      accounts: accountList,
      stats,
      categoryStats,
      expenseCategories: accounts.EXPENSE_CATEGORIES,
      error: null,
      success: `显示 ${startNum}-${endNum} 条，共 ${total} 条`,
      currentPage,
      pageLimit,
      total,
      query: { startDate, endDate, type, category, minAmount, maxAmount }
    });
  } catch (err) {
    next(err);
  }
});

/* POST batch-delete - 批量删除账单 */
router.post('/batch-delete', async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids) {
      return res.redirect(buildRedirectUrl('请选择要删除的账单', 'error'));
    }
    const idList = Array.isArray(ids) ? ids : [ids];
    const count = await accounts.batchRemove(idList);
    res.redirect(buildRedirectUrl(`已删除 ${count} 条账单`, 'success'));
  } catch (err) {
    next(err);
  }
});

/* GET /api/chart-data - 返回图表所需数据 */
router.get('/api/chart-data', async (_req, res, next) => {
  try {
    const allAccounts = await accounts.getAll();

    // 计算每月支出趋势（函数式编程：使用 reduce）
    const monthlyStats = allAccounts
      .filter(account => account.type === 'expense')
      .reduce((acc, account) => {
        const month = account.date.substring(0, 7);
        acc[month] = (acc[month] || 0) + account.amount;
        return acc;
      }, {});

    // 转换为数组并排序
    const monthlyTrend = Object.entries(monthlyStats)
      .map(([month, amount]) => ({ month, amount }))
      .sort((itemA, itemB) => itemA.month.localeCompare(itemB.month));

    // 分类占比数据
    const categoryStats = await accounts.getCategoryStats();
    const categoryData = Object.entries(categoryStats)
      .map(([category, amount]) => ({ category, amount }))
      .sort((itemA, itemB) => itemB.amount - itemA.amount);

    res.json({
      monthlyTrend,
      categoryData
    });
  } catch (err) {
    next(err);
  }
});

export default router;

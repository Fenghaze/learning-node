import express from 'express';
import * as accounts from '../data/accounts.js';

const router = express.Router();

/* GET home page - 账单列表 */
router.get('/', async function (req, res, next) {
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
router.post('/add', async function (req, res, next) {
  try {
    const { date, type, category, amount, remark } = req.body;

    // 验证
    if (!date || !amount) {
      return res.redirect('/?error=' + encodeURIComponent('请填写日期和金额'));
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.redirect('/?error=' + encodeURIComponent('请输入有效的金额'));
    }

    if (!type || (type !== 'income' && type !== 'expense')) {
      return res.redirect('/?error=' + encodeURIComponent('请选择收入或支出类型'));
    }

    // 支出时分类必填
    if (type === 'expense' && !category) {
      return res.redirect('/?error=' + encodeURIComponent('支出必须选择或输入分类'));
    }

    const account = {
      date,
      type,
      category: type === 'expense' ? category : '',
      amount: amountValue,
      remark: remark || ''
    };

    await accounts.add(account);
    res.redirect('/?success=' + encodeURIComponent('添加成功'));
  } catch (err) {
    next(err);
  }
});

/* GET edit/:id - 编辑页面 */
router.get('/edit/:id', async function (req, res, next) {
  try {
    const id = req.params.id;
    const account = await accounts.getById(id);

    if (!account) {
      return res.redirect('/?error=' + encodeURIComponent('账单不存在'));
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
router.post('/edit/:id', async function (req, res, next) {
  try {
    const id = req.params.id;
    const { date, type, category, amount, remark } = req.body;

    // 验证
    if (!date || !amount) {
      return res.redirect('/edit/' + id + '?error=' + encodeURIComponent('请填写日期和金额'));
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.redirect('/edit/' + id + '?error=' + encodeURIComponent('请输入有效的金额'));
    }

    if (!type || (type !== 'income' && type !== 'expense')) {
      return res.redirect('/edit/' + id + '?error=' + encodeURIComponent('请选择收入或支出类型'));
    }

    if (type === 'expense' && !category) {
      return res.redirect('/edit/' + id + '?error=' + encodeURIComponent('支出必须选择或输入分类'));
    }

    const updated = await accounts.update(id, {
      date,
      type,
      category: type === 'expense' ? category : '',
      amount: amountValue,
      remark: remark || ''
    });

    if (!updated) {
      return res.redirect('/?error=' + encodeURIComponent('账单不存在'));
    }
    res.redirect('/?success=' + encodeURIComponent('更新成功'));
  } catch (err) {
    next(err);
  }
});

/* GET delete/:id - 删除账单 */
router.get('/delete/:id', async function (req, res, next) {
  try {
    const id = req.params.id;
    const success = await accounts.remove(id);

    if (success) {
      res.redirect('/?success=' + encodeURIComponent('删除成功'));
    } else {
      res.redirect('/?error=' + encodeURIComponent('账单不存在'));
    }
  } catch (err) {
    next(err);
  }
});

/* POST clear-all - 清空所有账单 */
router.post('/clear-all', async function (req, res, next) {
  try {
    await accounts.clearAll();
    res.redirect('/?success=' + encodeURIComponent('已清空所有账单'));
  } catch (err) {
    next(err);
  }
});

/* POST clear-by-condition - 按条件清除账单 */
router.post('/clear-by-condition', async function (req, res, next) {
  try {
    const { startDate, endDate, type, category } = req.body;
    const count = await accounts.clearByCondition({ startDate, endDate, type, category });
    res.redirect('/?success=' + encodeURIComponent('已清除 ' + count + ' 条账单'));
  } catch (err) {
    next(err);
  }
});

/* POST batch-delete - 批量删除账单 */
router.post('/batch-delete', async function (req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids) {
      return res.redirect('/?error=' + encodeURIComponent('请选择要删除的账单'));
    }
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    const count = await accounts.batchRemove(idsToDelete);
    res.redirect('/?success=' + encodeURIComponent('已删除 ' + count + ' 条账单'));
  } catch (err) {
    next(err);
  }
});

/* GET /api/chart-data - 返回图表所需数据 */
router.get('/api/chart-data', async function (req, res, next) {
  try {
    const allAccounts = await accounts.getAll();

    // 计算每月支出趋势
    const monthlyStats = {};
    allAccounts.forEach(account => {
      if (account.type === 'expense') {
        const month = account.date.substring(0, 7); // YYYY-MM
        monthlyStats[month] = (monthlyStats[month] || 0) + account.amount;
      }
    });

    // 转换为数组并排序
    const monthlyTrend = Object.entries(monthlyStats)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 分类占比数据
    const categoryStats = await accounts.getCategoryStats();
    const categoryData = Object.entries(categoryStats)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    res.json({
      monthlyTrend,
      categoryData
    });
  } catch (err) {
    next(err);
  }
});

export default router;

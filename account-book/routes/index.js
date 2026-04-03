var express = require("express");
var router = express.Router();
const accounts = require("../data/accounts");

/* GET home page - 账单列表 */
router.get("/", function (req, res, next) {
  const accountList = accounts.getAll();
  const stats = accounts.getStats();
  const categoryStats = accounts.getCategoryStats();
  res.render("index", {
    title: "简易记账本",
    accounts: accountList,
    stats,
    categoryStats,
    expenseCategories: accounts.EXPENSE_CATEGORIES,
    error: req.query.error || null,
    success: req.query.success || null
  });
});

/* POST add - 添加账单 */
router.post("/add", function (req, res, next) {
  const { date, type, category, amount, remark } = req.body;

  // 验证
  if (!date || !amount) {
    return res.redirect("/?error=" + encodeURIComponent("请填写日期和金额"));
  }

  const amountValue = parseFloat(amount);
  if (isNaN(amountValue) || amountValue <= 0) {
    return res.redirect("/?error=" + encodeURIComponent("请输入有效的金额"));
  }

  if (!type || (type !== 'income' && type !== 'expense')) {
    return res.redirect("/?error=" + encodeURIComponent("请选择收入或支出类型"));
  }

  // 支出时分类必填
  if (type === 'expense' && !category) {
    return res.redirect("/?error=" + encodeURIComponent("支出必须选择或输入分类"));
  }

  const account = {
    date,
    type,
    category: type === 'expense' ? category : '',
    amount: amountValue,
    remark: remark || ''
  };

  accounts.add(account);
  res.redirect("/?success=" + encodeURIComponent("添加成功"));
});

/* GET edit/:id - 编辑页面 */
router.get("/edit/:id", function (req, res, next) {
  const id = req.params.id;
  const account = accounts.getById(id);

  if (!account) {
    return res.redirect("/?error=" + encodeURIComponent("账单不存在"));
  }

  res.render("edit", {
    title: "编辑账单",
    account,
    expenseCategories: accounts.EXPENSE_CATEGORIES,
    error: req.query.error || null
  });
});

/* POST edit/:id - 提交编辑 */
router.post("/edit/:id", function (req, res, next) {
  const id = req.params.id;
  const { date, type, category, amount, remark } = req.body;

  // 验证
  if (!date || !amount) {
    return res.redirect("/edit/" + id + "?error=" + encodeURIComponent("请填写日期和金额"));
  }

  const amountValue = parseFloat(amount);
  if (isNaN(amountValue) || amountValue <= 0) {
    return res.redirect("/edit/" + id + "?error=" + encodeURIComponent("请输入有效的金额"));
  }

  if (!type || (type !== 'income' && type !== 'expense')) {
    return res.redirect("/edit/" + id + "?error=" + encodeURIComponent("请选择收入或支出类型"));
  }

  if (type === 'expense' && !category) {
    return res.redirect("/edit/" + id + "?error=" + encodeURIComponent("支出必须选择或输入分类"));
  }

  const updated = accounts.update(id, {
    date,
    type,
    category: type === 'expense' ? category : '',
    amount: amountValue,
    remark: remark || ''
  });

  if (!updated) {
    return res.redirect("/?error=" + encodeURIComponent("账单不存在"));
  }
  res.redirect("/?success=" + encodeURIComponent("更新成功"));
});

/* GET delete/:id - 删除账单 */
router.get("/delete/:id", function (req, res, next) {
  const id = req.params.id;
  const success = accounts.remove(id);

  if (success) {
    res.redirect("/?success=" + encodeURIComponent("删除成功"));
  } else {
    res.redirect("/?error=" + encodeURIComponent("账单不存在"));
  }
});

module.exports = router;

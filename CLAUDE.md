# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning repository for Node.js server-side development, containing demo projects.

### account-book

An Express + EJS-based accounting/bookkeeping application.

**Stack:**
- Express 4.16.1 - Web framework
- EJS - Template engine
- Multer - File upload
- Formidable - Form data parsing
- Morgan - HTTP logging middleware
- Cookie-Parser - Cookie parsing
- MongoDB + Mongoose - Document database with ODM
- Jest + Supertest - API testing
- Playwright - E2E browser testing

**Testing:**
- `npm test` - Runs Jest API tests
- `npx playwright test` - Runs E2E tests (auto-starts server)

**Module system:** ESM (ECMAScript Modules) with `"type": "module"` in package.json

**Start the server:**
```bash
cd account-book
npm install  # if not already installed
npm start
```
Server runs on port 3000 by default.

## Architecture

**Entry point:** [bin/www](account-book/bin/www) - Creates HTTP server and listens on port

**App setup:** [app.js](account-book/app.js) - Express app configuration (middleware, view engine, routes)

**Data layer:** [data/accounts.js](account-book/data/accounts.js) - Uses Mongoose ODM (database: `account-book-database`)
- All data operations are async: `getAll`, `getById`, `add`, `update`, `remove`
- Statistics: `getStats` (income/expense/balance), `getCategoryStats`

**Routes:** [routes/index.js](account-book/routes/index.js) - All route handlers
- `GET /` - List all accounts with stats
- `POST /add` - Add new account
- `GET /edit/:id` - Edit page
- `POST /edit/:id` - Submit edit
- `GET /delete/:id` - Delete account

**Views:** EJS templates in [views/](account-book/views/)
- `index.ejs` - Main list page
- `edit.ejs` - Edit form
- `error.ejs` - Error page

**Static files:** Served from [public/](account-book/public/)

**Tests:** [\_\_tests\_\_/](account-book/__tests__/)
- `*.test.js` - Jest API tests with Supertest
- `*.spec.js` - Playwright E2E browser tests
- `playwright-report/` - HTML test report (view with `npx playwright show-report`)

## Code Conventions

### JavaScript 代码规范

| 规则 | 要求 |
|-----|------|
| **函数式编程** | 优先使用箭头函数、数组方法（map/filter/reduce） |
| **变量命名** | 禁止单字母变量，使用有意义的名字 |
| **条件语句** | 所有 `if`/`else`/`for`/`while` 必须使用 `{}` 包裹 |
| **嵌套深度** | 最大嵌套深度不超过 4 层 |
| **文件长度** | 每个文件不超过 1000 行 |
| **注释文档** | 公共函数添加中文注释 |
| **代码复用** | 相似代码提炼为公共工具函数 |
| **日志输出** | 禁止使用 emoji 图标，仅使用中文文本描述 |

### 表单开发规范 ⚠️ 防止 name 属性冲突

**核心规则：一个表单中绝不能出现多个相同 `name` 属性的输入字段。**

**问题场景**：动态表单中下拉框和自定义输入框竞争同一个 name
```html
<!-- 错误示例：两个字段 name="category" -->
<select name="category">...</select>
<input type="text" name="category">  <!-- 冲突！ -->
```

**正确做法**：使用条件逻辑动态切换 name 属性
```html
<select name="category" id="categorySelect">...</select>
<input type="text" name="customCategory" id="customCategory" style="display:none;">

<script>
if (categorySelect.value === 'custom') {
  customCategory.name = 'category';
  categorySelect.name = '';
} else {
  customCategory.name = '';
  categorySelect.name = 'category';
}
</script>
```

**调试技巧**：遇到 Mongoose `CastError: Cast to string failed for value "[...]" (type Array)` 时，首先检查表单是否有重复 name。

### 表单值保留规范 ⚠️ POST 请求后表单状态丢失

**核心规则：POST 请求重新渲染表单页面时，必须保留用户输入的查询条件。**

**问题场景**：查询表单提交后，切换分页或每页条数时表单值丢失
```html
<!-- 错误示例：表单字段没有动态 value -->
<input type="date" name="startDate">  <!-- 刷新后变为空 -->
<select name="type">
  <option value="all">全部</option>  <!-- 刷新后恢复默认选中 -->
  <option value="expense">支出</option>
</select>
```

**正确做法**：
1. **路由层**：将查询参数作为对象传回视图
```javascript
res.render('index', {
  // ...其他数据
  query: { startDate, endDate, type, category, minAmount, maxAmount },
  currentPage,
  pageLimit,
  total
});
```

2. **视图层**：表单字段设置动态 value 属性
```html
<!-- 输入框保留值 -->
<input type="date" name="startDate" value="<%= typeof query !== 'undefined' ? query.startDate || '' : '' %>">

<!-- Select 保留选中状态 -->
<select name="type">
  <option value="all" <%= typeof query !== 'undefined' && query.type === 'all' ? 'selected' : '' %>>全部</option>
  <option value="expense" <%= typeof query !== 'undefined' && query.type === 'expense' ? 'selected' : '' %>>支出</option>
</select>
```

3. **分页导航**：传递当前查询条件
```html
<button onclick="goToPage(<%= currentPage %>)">下一页</button>
<script>
function goToPage(pageNum) {
  document.getElementById('queryPage').value = pageNum;
  document.getElementById('queryForm').submit();  // 自动提交当前表单所有字段
}
</script>
```

**调试技巧**：如果表单值不保留，检查：
1. 路由是否传递了 query 对象到视图
2. 视图表单字段是否有动态 value/selected 属性
3. 服务器是否已重启加载最新代码（用 curl 测试验证）

### 示例

```javascript
// 函数式编程 - 使用数组方法 + 箭头函数
const expenseTotal = accounts
  .filter(account => account.type === 'expense')
  .map(account => account.amount)
  .reduce((sum, amount) => sum + amount, 0);

// 变量命名 - 禁止单字母
// 错误: accounts.forEach(a => { ... })
// 正确: accounts.forEach(account => { ... })

// 嵌套深度 - 超过 4 层时提取函数
const processAccount = (data) => {
  if (!data) return null;
  const validated = validate(data);
  if (!validated) return null;
  return transform(validated);
};

// 公共函数 - 添加中文注释
/**
 * 构建重定向 URL
 * @param {string} message - 提示消息
 * @param {string} type - success 或 error
 * @returns {string} 编码后的重定向 URL
 */
const buildRedirectUrl = (message, type) => {
  return `/?${type}=${encodeURIComponent(message)}`;
};
```

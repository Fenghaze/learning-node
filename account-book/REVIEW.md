# 知识回顾：简易记账本 DEMO

- **功能标题**：简易记账本 DEMO
- **实现时间**：2026年04月03日 10:34:19
- **更新时间**：2026年04月06日
- **涉及技术**：Express.js、EJS 模板引擎、Node.js ESM、lowdb v7 持久化

---

## 1. 功能概述

简易记账本实现了一个基本的账务管理工具：
- **添加账单**：支持日期、类型（收入/支出）、分类、金额、备注
- **查看列表**：按日期降序显示所有账单
- **编辑账单**：修改已有账单的所有字段
- **删除账单**：删除指定账单，带确认提示
- **统计功能**：实时计算收入、支出、余额，支持分类统计
- **数据持久化**：使用 lowdb 存储到 JSON 文件，重启后数据保留

---

## 2. 设计思路

### 数据流设计

```
浏览器表单 → Express路由(异步) → accounts.js(lowdb) → accounts.json(持久化)
     ↑                                      ↓
     └──────────── 渲染 EJS ←──────────────┘
```

### 核心模块划分

| 模块 | 职责 | 文件 |
|------|------|------|
| 路由层 | 接收请求、参数验证、调用业务、返回响应 | routes/index.js |
| 数据层 | CRUD操作、lowdb持久化、统计计算 | data/accounts.js |
| 视图层 | 页面渲染、表单展示 | views/index.ejs, views/edit.ejs |

### 为什么这样设计？

- **分层职责**：路由不写业务逻辑，业务逻辑独立到 data 模块
- **lowdb持久化**：DEMO级别无需数据库，lowdb 提供内存缓存+懒写入
- **EJS模板**：服务端渲染，简单直接，无需构建工具
- **ESM模块**：现代 Node.js 模块系统，与 lowdb v7 兼容

---

## 3. 核心代码解析

### 3.1 路由处理（routes/index.js）

**注意：所有路由处理器都是 async 函数**

```javascript
import express from 'express';
import * as accounts from '../data/accounts.js';

const router = express.Router();

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
```

### 3.2 lowdb 数据持久化（data/accounts.js）

**初始化 lowdb**
```javascript
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'accounts.json');

async function initDb() {
  const adapter = new JSONFile(DATA_FILE);
  const db = new Low(adapter, { accounts: [] });
  await db.read();
  return db;
}

// 单例模式
let dbPromise = null;
async function getDb() {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}
```

**CRUD 操作示例**
```javascript
export async function getAll() {
  const db = await getDb();
  const accounts = db.data.accounts || [];
  return accounts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function add(account) {
  const db = await getDb();
  const newAccount = {
    id: Date.now(),
    date: account.date,
    type: account.type,
    category: account.category || '',
    amount: parseFloat(account.amount),
    remark: account.remark || ''
  };
  db.data.accounts.push(newAccount);
  await db.write();  // lowdb 自动将更改写入文件
  return newAccount;
}
```

---

## 4. 知识点详解

### 知识点 1：ESM (ECMAScript Modules)

**核心概念**

| 概念 | 代码示例 | 说明 |
|------|---------|------|
| `import` | `import express from 'express'` | 导入模块 |
| `export` | `export default router` | 导出模块 |
| `import.meta.url` | `fileURLToPath(import.meta.url)` | 获取当前文件 URL |
| `__dirname` | 需要通过 `fileURLToPath` 计算 | ESM 中没有 __dirname |

**package.json 配置**
```json
{
  "type": "module"
}
```

**__dirname 的 ESM 替代**
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

---

### 知识点 2：lowdb v7

**核心 API**

| 方法 | 说明 |
|------|------|
| `new JSONFile(path)` | 创建 JSON 文件适配器 |
| `new Low(adapter, defaultData)` | 创建 lowdb 实例 |
| `await db.read()` | 从文件读取数据到内存 |
| `await db.write()` | 将内存数据写入文件 |
| `db.data.accounts` | 访问数据（自动类型推断） |

**lowdb vs 手动 fs**

| 方面 | 手动 fs | lowdb |
|------|--------|-------|
| 文件读取 | 每次操作都读 | 启动时读一次，内存缓存 |
| 文件写入 | 每次操作都写 | 懒写入（调用 write() 时） |
| 代码量 | 需要 readFromFile/writeToFile | 内置 |
| 原子性 | 无 | 支持事务 |

---

### 知识点 3：Express 异步路由

**为什么需要 async/await？**

lowdb 的 `db.read()` 和 `db.write()` 是异步的，所以路由处理器必须 async：

```javascript
// 错误：同步函数无法 await
router.get('/', function (req, res) {
  const data = await getAll();  // SyntaxError
});

// 正确：async 函数可以 await
router.get('/', async function (req, res) {
  const data = await getAll();  // 正常工作
  res.render('index', { accounts: data });
});
```

**错误处理**
```javascript
router.get('/', async function (req, res, next) {
  try {
    const data = await getAll();
    res.render('index', { accounts: data });
  } catch (err) {
    next(err);  // 传递给 Express 错误处理中间件
  }
});
```

---

## 5. 关键代码位置

| 功能 | 文件路径 | 关键函数 |
|------|---------|---------|
| 路由处理 | routes/index.js | async route handlers |
| 数据操作 | data/accounts.js | getAll, add, update, remove, getStats |
| lowdb 初始化 | data/accounts.js | initDb, getDb |
| 列表页面 | views/index.ejs | 账单循环、统计卡片 |
| 编辑页面 | views/edit.ejs | 表单预填充 |
| 样式 | public/stylesheets/style.css | 统计卡片、列表样式 |

---

## 6. 测试

### 测试文件

| 文件 | 类型 | 测试内容 |
|------|------|---------|
| `__tests__/accounts.test.js` | 单元测试 | 数据层函数 getStats, getCategoryStats |
| `__tests__/app.test.js` | API 测试 | HTTP 路由 (Supertest) |

### 测试命令

```bash
cd account-book
npm test        # 运行所有测试（9 passed, 2 test suites）
npm start       # 启动服务器
```

### Supertest API 测试示例

```javascript
import request from 'supertest';
import app from '../app.js';

describe('API 路由测试', () => {
  it('GET / 应返回 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  it('POST /add 应能创建账单', async () => {
    const res = await request(app)
      .post('/add')
      .send({ date: '2024-01-01', type: 'expense', category: '餐饮', amount: 100 });
    expect(res.status).toBe(302);
  });
});
```

---

*更新时间：2026年04月06日 - 新增 Supertest API 测试*
*更新时间：2026年04月06日 - 更新为 lowdb v7 持久化 + ESM 模块系统*

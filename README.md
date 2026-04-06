# learning-node

学习 Node.js 服务端开发的示例项目集

## Demo 项目

### account-book

基于 Express + EJS 的记账本应用

**技术栈：**
- Express 4.16.1 - Web 框架
- EJS - 模板引擎
- Multer - 文件上传处理
- Formidable - 解析表单数据
- Morgan - HTTP 日志中间件
- Cookie-Parser - Cookie 解析
- MongoDB + Mongoose - 文档数据库 + ODM（持久化存储）
- Jest + Supertest - API 测试框架
- Playwright - E2E 浏览器测试框架

**测试命令：**
```bash
npm test              # 运行 Jest API 测试
npx playwright test   # 运行 E2E 测试（自动启动服务器）
```

**模块系统：** ESM（ECMAScript Modules），package.json 中设置 `"type": "module"`

**功能特点：**
- 账单管理：添加、编辑、删除、批量删除
- 按条件查询：日期范围、类型、分类、金额范围
- 分页展示：支持 5/10/15/30/100 条每页
- 统计看板：收入/支出/余额、分类统计
- 图表可视化：支出趋势图（折线图）、分类占比图（环形图）
- Excel 导出：导出账单数据
- 空状态提示：数据为空时显示友好提示
- 数据持久化：MongoDB + Mongoose

**启动方式：**
```bash
cd account-book
npm install
npm start
```

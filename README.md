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
- lowdb v7 - JSON 数据库（持久化存储）
- Jest + Supertest - 测试框架

**测试命令：**
```bash
npm test  # 运行所有测试（9 个测试，2 个测试套件）
```

**模块系统：** ESM（ECMAScript Modules），package.json 中设置 `"type": "module"`

**功能特点：**
- 页面渲染 (EJS 模板)
- 文件上传
- 表单数据处理
- Cookie 管理
- 静态资源服务

**启动方式：**
```bash
cd account-book
npm install
npm start
```

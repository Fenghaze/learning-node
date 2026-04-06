import request from 'supertest';
import app from '../app.js';
import * as accounts from '../data/accounts.js';

describe('API 路由测试', () => {
  beforeAll(async () => {
    await accounts.initializeDb();
  });

  afterAll(async () => {
    await accounts.closeDb();
  });

  describe('GET /', () => {
    it('应返回 200 并显示账单列表', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('简易记账本');
    });
  });

  describe('POST /add', () => {
    it('成功添加账单应返回 302 重定向', async () => {
      const res = await request(app)
        .post('/add')
        .send({ date: '2024-01-01', type: 'expense', category: '餐饮', amount: 100, remark: '测试' });
      // 正常返回 302 重定向到首页
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('success=');
    });

    it('缺少必填字段应返回 302 并带 error', async () => {
      const res = await request(app)
        .post('/add')
        .send({ date: '2024-01-01' }); // 缺少 amount
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('error=');
    });
  });

  describe('GET /edit/:id', () => {
    it('不存在的账单应重定向', async () => {
      const res = await request(app).get('/edit/999999');
      expect(res.status).toBe(302);
    });
  });

  describe('404 处理', () => {
    it('不存在的路由应返回 404', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});

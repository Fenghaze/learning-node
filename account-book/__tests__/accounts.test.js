import * as accounts from '../data/accounts.js';

describe('账单数据模块', () => {
  beforeAll(async () => {
    await accounts.initializeDb();
  });

  afterAll(async () => {
    await accounts.closeDb();
  });

  const testAccount = {
    date: '2024-01-01',
    type: 'expense',
    category: '餐饮',
    amount: 100,
    remark: '测试'
  };

  describe('getStats()', () => {
    it('应返回正确的统计对象结构', async () => {
      const stats = await accounts.getStats();
      expect(stats).toHaveProperty('totalIncome');
      expect(stats).toHaveProperty('totalExpense');
      expect(stats).toHaveProperty('balance');
    });

    it('余额应等于收入减去支出', async () => {
      const stats = await accounts.getStats();
      expect(stats.balance).toBe(stats.totalIncome - stats.totalExpense);
    });
  });

  describe('getCategoryStats()', () => {
    it('应返回对象类型', async () => {
      const categoryStats = await accounts.getCategoryStats();
      expect(typeof categoryStats).toBe('object');
    });
  });

  describe('EXPENSE_CATEGORIES', () => {
    it('应包含预设的分类', () => {
      expect(accounts.EXPENSE_CATEGORIES).toContain('餐饮');
      expect(accounts.EXPENSE_CATEGORIES).toContain('交通');
      expect(accounts.EXPENSE_CATEGORIES).toContain('购物');
    });
  });
});

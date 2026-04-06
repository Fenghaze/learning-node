// 账单数据存储模块 - 使用 lowdb 持久化

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'accounts.json');

// 预设分类
const EXPENSE_CATEGORIES = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '医疗',
  '教育',
  '其他'
];

// 初始化 lowdb
async function initDb() {
  const adapter = new JSONFile(DATA_FILE);
  const db = new Low(adapter, { accounts: [] });
  await db.read();
  return db;
}

// 单例 db 实例
let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

// 同步版本，用于启动时初始化
let dbInstance = null;

export async function initializeDb() {
  if (!dbInstance) {
    dbInstance = await initDb();
  }
  return dbInstance;
}

// 获取所有账单
export async function getAll() {
  const db = await getDb();
  if (!db.data.accounts) {
    db.data.accounts = [];
  }
  const accounts = db.data.accounts || [];
  return accounts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 获取单条账单
export async function getById(id) {
  const db = await getDb();
  if (!db.data.accounts) {
    db.data.accounts = [];
  }
  return db.data.accounts.find(a => a.id === parseInt(id));
}

// 添加账单
export async function add(account) {
  const db = await getDb();
  if (!db.data.accounts) {
    db.data.accounts = [];
  }
  const newAccount = {
    id: Date.now(),
    date: account.date,
    type: account.type,
    category: account.category || '',
    amount: parseFloat(account.amount),
    remark: account.remark || ''
  };
  db.data.accounts.push(newAccount);
  await db.write();
  return newAccount;
}

// 更新账单
export async function update(id, account) {
  const db = await getDb();
  if (!db.data.accounts) {
    db.data.accounts = [];
  }
  const index = db.data.accounts.findIndex(a => a.id === parseInt(id));
  if (index === -1) {
    return null;
  }
  db.data.accounts[index] = {
    ...db.data.accounts[index],
    date: account.date,
    type: account.type,
    category: account.category || '',
    amount: parseFloat(account.amount),
    remark: account.remark || ''
  };
  await db.write();
  return db.data.accounts[index];
}

// 删除账单
export async function remove(id) {
  const db = await getDb();
  if (!db.data.accounts) {
    db.data.accounts = [];
  }
  const index = db.data.accounts.findIndex(a => a.id === parseInt(id));
  if (index === -1) {
    return false;
  }
  db.data.accounts.splice(index, 1);
  await db.write();
  return true;
}

// 获取统计数据
export async function getStats() {
  const db = await getDb();
  const accounts = db.data.accounts || [];

  const totalIncome = accounts
    .filter(a => a.type === 'income')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalExpense = accounts
    .filter(a => a.type === 'expense')
    .reduce((sum, a) => sum + a.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  };
}

// 获取支出分类统计
export async function getCategoryStats() {
  const db = await getDb();
  const accounts = db.data.accounts || [];
  const expenseAccounts = accounts.filter(a => a.type === 'expense');

  const stats = {};
  expenseAccounts.forEach(a => {
    const cat = a.category || '其他';
    stats[cat] = (stats[cat] || 0) + a.amount;
  });

  return stats;
}

// 清空所有账单
export async function clearAll() {
  const db = await getDb();
  db.data.accounts = [];
  await db.write();
  return true;
}

// 按条件清除账单
export async function clearByCondition({ startDate, endDate, type, category }) {
  const db = await getDb();
  let accounts = db.data.accounts || [];

  if (startDate) {
    accounts = accounts.filter(a => a.date >= startDate);
  }
  if (endDate) {
    accounts = accounts.filter(a => a.date <= endDate);
  }
  if (type && type !== 'all') {
    accounts = accounts.filter(a => a.type === type);
  }
  if (category && category !== 'all') {
    accounts = accounts.filter(a => a.category === category);
  }

  // 从原始数据中移除符合条件的账单
  const idsToRemove = new Set(accounts.map(a => a.id));
  db.data.accounts = db.data.accounts.filter(a => !idsToRemove.has(a.id));
  await db.write();
  return accounts.length;
}

// 批量删除账单
export async function batchRemove(ids) {
  const db = await getDb();
  const idSet = new Set(ids.map(id => parseInt(id)));
  const originalCount = db.data.accounts.length;
  db.data.accounts = db.data.accounts.filter(a => !idSet.has(a.id));
  await db.write();
  return originalCount - db.data.accounts.length;
}

// 同步版本 - 供路由直接调用（Express 会等待 promise）
export const getAllSync = async (...args) => getAll(...args);
export const getByIdSync = async (...args) => getById(...args);
export const addSync = async (...args) => add(...args);
export const updateSync = async (...args) => update(...args);
export const removeSync = async (...args) => remove(...args);
export const getStatsSync = async (...args) => getStats(...args);
export const getCategoryStatsSync = async (...args) => getCategoryStats(...args);
export const clearAllSync = async (...args) => clearAll(...args);
export const clearByConditionSync = async (...args) => clearByCondition(...args);
export const batchRemoveSync = async (...args) => batchRemove(...args);

export {
  EXPENSE_CATEGORIES
};

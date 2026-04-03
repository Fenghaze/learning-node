// 账单数据存储模块

const fs = require('fs');
const path = require('path');

// JSON 文件路径
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

// 从文件读取账单
function readFromFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (error) {
    console.error('读取账单文件失败:', error);
    return [];
  }
}

// 将账单写入文件
function writeToFile(accounts) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('写入账单文件失败:', error);
    return false;
  }
}

// 获取所有账单
function getAll() {
  const accounts = readFromFile();
  return accounts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 获取单条账单
function getById(id) {
  const accounts = readFromFile();
  return accounts.find(a => a.id === parseInt(id));
}

// 添加账单
function add(account) {
  const accounts = readFromFile();
  const newAccount = {
    id: Date.now(),
    date: account.date,
    type: account.type,
    category: account.category || '',
    amount: parseFloat(account.amount),
    remark: account.remark || ''
  };
  accounts.push(newAccount);
  writeToFile(accounts);
  return newAccount;
}

// 更新账单
function update(id, account) {
  const accounts = readFromFile();
  const index = accounts.findIndex(a => a.id === parseInt(id));
  if (index === -1) {
    return null;
  }
  accounts[index] = {
    ...accounts[index],
    date: account.date,
    type: account.type,
    category: account.category || '',
    amount: parseFloat(account.amount),
    remark: account.remark || ''
  };
  writeToFile(accounts);
  return accounts[index];
}

// 删除账单
function remove(id) {
  const accounts = readFromFile();
  const index = accounts.findIndex(a => a.id === parseInt(id));
  if (index === -1) {
    return false;
  }
  accounts.splice(index, 1);
  return writeToFile(accounts);
}

// 获取统计数据
function getStats() {
  const accounts = readFromFile();

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
function getCategoryStats() {
  const accounts = readFromFile();
  const expenseAccounts = accounts.filter(a => a.type === 'expense');

  const stats = {};
  expenseAccounts.forEach(a => {
    const cat = a.category || '其他';
    stats[cat] = (stats[cat] || 0) + a.amount;
  });

  return stats;
}

module.exports = {
  getAll,
  getById,
  add,
  update,
  remove,
  getStats,
  getCategoryStats,
  EXPENSE_CATEGORIES
};

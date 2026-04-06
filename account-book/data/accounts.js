// 账单数据存储模块 - 使用 Mongoose ODM

import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/account-book-database';

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

// 定义账单 Schema
const accountSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  date: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  },
  remark: {
    type: String,
    default: ''
  }
}, {
  versionKey: false
});

// 创建 Model
const Account = mongoose.model('Account', accountSchema);
// Mongoose 客户端单例
let isConnected = false;

// 数据库连接事件监听
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] 连接成功');
});

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] 连接已断开');
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] 连接错误:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] 重新连接成功');
});

/**
 * 初始化数据库连接
 */
export async function initializeDb() {
  if (!isConnected) {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
  }
  return true;
}

/**
 * 关闭数据库连接（Jest 测试需要）
 */
export async function closeDb() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

/**
 * 获取所有账单（按日期降序）
 * @returns {Promise<Array>} 账单列表
 */
export async function getAll() {
  const accountList = await Account.find({}).sort({ date: -1 });
  return accountList;
}

/**
 * 获取单条账单
 * @param {string|number} id - 账单 ID
 * @returns {Promise<Object|null>} 账单或 null
 */
export async function getById(id) {
  const numId = parseInt(id);
  if (isNaN(numId)) return null;
  return Account.findOne({ id: numId });
}

/**
 * 添加账单
 * @param {Object} account - 账单对象
 * @returns {Promise<Object>} 新增的账单
 */
export async function add(account) {
  const newAccount = new Account({
    id: Date.now(),
    date: account.date,
    type: account.type,
    category: account.category || '',
    amount: parseFloat(account.amount),
    remark: account.remark || ''
  });
  await newAccount.save();
  return newAccount;
}

/**
 * 更新账单
 * @param {string|number} id - 账单 ID
 * @param {Object} account - 更新后的账单对象
 * @returns {Promise<Object|null>} 更新后的账单或 null
 */
export async function update(id, account) {
  const numId = parseInt(id);
  const updated = await Account.findOneAndUpdate(
    { id: numId },
    {
      $set: {
        date: account.date,
        type: account.type,
        category: account.category || '',
        amount: parseFloat(account.amount),
        remark: account.remark || ''
      }
    },
    { new: true }
  );
  return updated;
}

/**
 * 删除账单
 * @param {string|number} id - 账单 ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function remove(id) {
  const numId = parseInt(id);
  const result = await Account.deleteOne({ id: numId });
  return result.deletedCount > 0;
}

/**
 * 获取统计数据（总收入、总支出、余额）
 * @returns {Promise<Object>} 统计对象
 */
export async function getStats() {
  const [incomeResult, expenseResult] = await Promise.all([
    Account.aggregate([{ $match: { type: 'income' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Account.aggregate([{ $match: { type: 'expense' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);

  const totalIncome = incomeResult[0]?.total || 0;
  const totalExpense = expenseResult[0]?.total || 0;

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  };
}

/**
 * 获取支出分类统计
 * @returns {Promise<Object>} 分类统计对象
 */
export async function getCategoryStats() {
  const stats = await Account.aggregate([
    { $match: { type: 'expense' } },
    { $group: { _id: { $ifNull: ['$category', '其他'] }, total: { $sum: '$amount' } } }
  ]);

  const result = stats.reduce((acc, stat) => {
    acc[stat._id] = stat.total;
    return acc;
  }, {});
  return result;
}

/**
 * 清空所有账单
 * @returns {Promise<boolean>} 是否成功
 */
export async function clearAll() {
  await Account.deleteMany({});
  return true;
}

/**
 * 构建查询条件对象
 * @param {Object} condition - 查询条件
 * @returns {Object} MongoDB 查询对象
 */
const buildQuery = ({ startDate, endDate, type, category, minAmount, maxAmount }) => {
  const query = {};

  if (startDate) {
    query.date = { ...query.date, $gte: startDate };
  }
  if (endDate) {
    query.date = { ...query.date, $lte: endDate };
  }
  if (type && type !== 'all') {
    query.type = type;
  }
  if (category && category !== 'all') {
    query.category = category;
  }
  if (minAmount !== undefined && minAmount !== '') {
    query.amount = { ...query.amount, $gte: parseFloat(minAmount) };
  }
  if (maxAmount !== undefined && maxAmount !== '') {
    query.amount = { ...query.amount, $lte: parseFloat(maxAmount) };
  }

  return query;
};

/**
 * 按条件查询账单（支持分页）
 * @param {Object} condition - 查询条件
 * @param {number} [condition.page] - 页码（从1开始）
 * @param {number} [condition.limit] - 每页条数
 * @returns {Promise<{list: Array, total: number}>} 账单列表和总数
 */
export async function queryByCondition({ page, limit, ...condition }) {
  const query = buildQuery(condition);

  if (page && limit) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [list, total] = await Promise.all([
      Account.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Account.countDocuments(query)
    ]);
    return { list, total };
  }

  const list = await Account.find(query).sort({ date: -1 });
  return { list, total: list.length };
}

/**
 * 按条件清除账单
 * @param {Object} condition - 筛选条件
 * @returns {Promise<number>} 删除的数量
 */
export async function clearByCondition({ startDate, endDate, type, category }) {
  const query = buildQuery({ startDate, endDate, type, category });
  const result = await Account.deleteMany(query);
  return result.deletedCount;
}

/**
 * 批量删除账单
 * @param {Array} ids - 账单 ID 数组
 * @returns {Promise<number>} 删除的数量
 */
export async function batchRemove(ids) {
  const idSet = new Set(ids.map(id => parseInt(id)));
  const result = await Account.deleteMany({ id: { $in: [...idSet] } });
  return result.deletedCount;
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
export const queryByConditionSync = async (...args) => queryByCondition(...args);
export const batchRemoveSync = async (...args) => batchRemove(...args);

export {
  EXPENSE_CATEGORIES
};

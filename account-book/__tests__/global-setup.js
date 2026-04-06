import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/account-book-database';

/**
 * 全局测试设置 - 在所有测试开始前清空数据库
 */
export default async function globalSetup() {
  try {
    await mongoose.connect(MONGO_URI);
    const Account = mongoose.model('Account', new mongoose.Schema({}, { versionKey: false }));
    await Account.deleteMany({});
    console.log('[全局Setup] 数据库已清空');
  } finally {
    await mongoose.disconnect();
  }
}

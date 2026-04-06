// Excel 导出模块
import * as accounts from './accounts.js';
import * as XLSX from 'xlsx';

export async function exportToExcel() {
  const allAccounts = await accounts.getAll();
  const stats = await accounts.getStats();
  const categoryStats = await accounts.getCategoryStats();

  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // Sheet1: 账单明细
  const detailData = allAccounts.map(a => ({
    '日期': a.date,
    '类型': a.type === 'income' ? '收入' : '支出',
    '分类': a.category || '-',
    '金额': a.amount,
    '备注': a.remark || ''
  }));

  // 按日期排序（从旧到新）
  detailData.sort((a, b) => new Date(a['日期']) - new Date(b['日期']));

  const ws1 = XLSX.utils.json_to_sheet(detailData);
  // 设置金额列格式
  ws1['!cols'] = [
    { wch: 12 },  // 日期
    { wch: 8 },   // 类型
    { wch: 10 },  // 分类
    { wch: 12 },  // 金额
    { wch: 20 }   // 备注
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '账单明细');

  // Sheet2: 分类汇总
  const total = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);
  const summaryData = Object.entries(categoryStats)
    .map(([category, amount]) => ({
      '分类': category,
      '金额': amount,
      '占比': total > 0 ? ((amount / total) * 100).toFixed(1) + '%' : '0%'
    }))
    .sort((a, b) => b['金额'] - a['金额']);

  // 添加总计行
  summaryData.push({
    '分类': '总计',
    '金额': total,
    '占比': '100%'
  });

  // 添加收支概览
  const overviewData = [
    { '项目': '总收入', '金额': stats.totalIncome },
    { '项目': '总支出', '金额': stats.totalExpense },
    { '项目': '余额', '金额': stats.balance }
  ];

  const ws2 = XLSX.utils.json_to_sheet(overviewData);
  XLSX.utils.sheet_add_aoa(ws2, [['分类', '金额', '占比']], { origin: 'A5' });
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amount], i) => {
      ws2['A' + (i + 6)] = { t: 's', v: cat };
      ws2['B' + (i + 6)] = { t: 'n', v: amount };
      ws2['C' + (i + 6)] = { t: 's', v: total > 0 ? ((amount / total) * 100).toFixed(1) + '%' : '0%' };
    });
  const lastRow = Object.keys(categoryStats).length + 6;
  ws2['A' + lastRow] = { t: 's', v: '总计' };
  ws2['B' + lastRow] = { t: 'n', v: total };
  ws2['C' + lastRow] = { t: 's', v: '100%' };

  ws2['!cols'] = [
    { wch: 12 },  // 项目/分类
    { wch: 15 },  // 金额
    { wch: 10 }   // 占比
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '分类汇总');

  return wb;
}

export function workbookToBuffer(wb) {
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

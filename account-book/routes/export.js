import express from 'express';
import { exportToExcel, workbookToBuffer } from '../data/export.js';

const router = express.Router();

/* GET /export - 导出 Excel */
router.get('/', async function (req, res, next) {
  try {
    const wb = await exportToExcel();
    const buf = workbookToBuffer(wb);

    // 生成文件名：记账本_YYYYMMDD_HHmmss.xlsx
    const now = new Date();
    const filename = `记账本_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

export default router;

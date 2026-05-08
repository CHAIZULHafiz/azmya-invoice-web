const express = require('express');
const auth = require('../middleware/auth');
const { getSheetData } = require('../utils/sheets');
const router = express.Router();

// GET /api/units - Get all unit data
router.get('/units', async (req, res) => {
  try {
    const rows = await getSheetData('DATA_UNIT', 'A2:M');
    const data = rows.map(row => ({
      unit: row[0] || '',
      namaUnit: row[1] || '',
      nopol: row[2] || '',
      area: row[3] || '',
      koordinator: row[4] || '',
      jabatan: row[5] || '',
      hargaUnit: parseInt(row[6]) || 0,
      kodeInvoice: row[7] || '',
      nomorSPK: row[8] || '',
      tanggalSPK: row[9] || '',
      tglMulaiSewa: row[10] || '',
      namaCustomer: row[11] || '',
      npwpCustomer: row[12] || '',
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data unit: ' + error.message });
  }
});

module.exports = router;

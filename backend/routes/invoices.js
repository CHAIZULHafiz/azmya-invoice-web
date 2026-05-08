const express = require('express');
const auth = require('../middleware/auth');
const axios = require('axios');
const { getSheetData, appendRow, updateCell, deleteRow } = require('../utils/sheets');
const { generateInvoiceNumber, generateBANumber, calculateDPP, calculatePPN, formatRupiah, terbilang } = require('../utils/formatting');
const { addDays, formatDateISO, getIndonesianDateParts } = require('../utils/date');
const { getDrive } = require('../config/google');
const router = express.Router();

// Drive folder mapping per unit
const DRIVE_FOLDERS = {
  // SCI Folders
  'SCI U1': process.env.DRIVE_FOLDER_U1 || '1a2nRyNNiqNt7bkdphLzyn4CqvlHjjbEV',
  'SCI U2': process.env.DRIVE_FOLDER_U2 || '1SscTKQmvet0J7yINJXR-lTjAd7UcEO7o',
  'SCI U3': process.env.DRIVE_FOLDER_U3 || '1fKxlwrwUh6fbNneoFOb35L1Bl8uEAXfW',
  // SLB Pengajuan Folders
  'SLB U1_PENGAJUAN': '1nr-y6lA6OJ6kugxotiTY1nZla6NtTldZ',
  'SLB U2_PENGAJUAN': '17k5qR1VA1DmmUhk_utTfr06wTqD9uX1Q',
  // SLB Invoice Folders
  'SLB U1_INVOICE': '1LzCmxrmnQGni2KGrCYOqD-SDUsTYwtcZ',
  'SLB U2_INVOICE': '15lmZdOOrAMubJLUYYNhwRbf524c4woRM',
};

const TEMPLATE_IDS = {
  SCI_INVOICE: process.env.INVOICE_TEMPLATE_ID,
  SLB_PENGAJUAN: '1b6H4hKW9KCVZh9TXsPU316B1sX2fGUzvDI5KPICEDmE',
  SLB_INVOICE: '19AQ9HN242JpbO-4E52k9dcExtQPh2Yn9r-xuXzty1OY',
};

// Month name to number mapping
const MONTH_MAP = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4,
  'May': 5, 'June': 6, 'July': 7, 'August': 8,
  'September': 9, 'October': 10, 'November': 11, 'December': 12
};

function getRentangWaktu(tglMulaiSewa, periodeMonth, year) {
  const monthMapZero = { 'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5, 'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11 };
  const monthNamesIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const monthIndex = monthMapZero[periodeMonth];
  if (monthIndex === undefined) return `${periodeMonth} ${year}`;
  
  const dayStart = parseInt(tglMulaiSewa, 10);
  if (isNaN(dayStart)) return `${periodeMonth} ${year}`; 
  
  const startDate = new Date(year, monthIndex, dayStart);
  const endDate = new Date(year, monthIndex + 1, dayStart - 1);
  
  const startDayStr = String(startDate.getDate()).padStart(2, '0');
  const startMonthStr = monthNamesIndo[startDate.getMonth()];
  
  const endDayStr = String(endDate.getDate()).padStart(2, '0');
  const endMonthStr = monthNamesIndo[endDate.getMonth()];
  const endYearStr = endDate.getFullYear();
  
  if (startDate.getFullYear() === endDate.getFullYear()) {
     return `${startDayStr} ${startMonthStr} - ${endDayStr} ${endMonthStr} ${endYearStr}`;
  } else {
     return `${startDayStr} ${startMonthStr} ${startDate.getFullYear()} - ${endDayStr} ${endMonthStr} ${endYearStr}`;
  }
}

// GET /api/invoices - List all invoices
router.get('/invoices', async (req, res) => {
  try {
    const rows = await getSheetData('MONITORING_INVOICE', 'A2:M');
    let data = rows.map((row, index) => {
      const tglPengiriman = row[6] || '';
      const jatuhTempo = row[8] || '';
      const statusKirim = row[9] || '';

      // Determine if overdue or days left
      let isOverdue = false;
      let overdueDays = 0;
      let daysLeft = null;
      if (jatuhTempo && statusKirim !== 'LUNAS') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const jt = new Date(jatuhTempo);
        jt.setHours(0, 0, 0, 0);
        
        if (today > jt) {
          isOverdue = true;
          const diffTime = Math.abs(today - jt);
          overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          const diffTime = Math.abs(jt - today);
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      return {
        rowIndex: index + 2,
        no: parseInt(row[0]) || 0,
        pilihUnit: row[1] || '',
        noInvoice: row[2] || '',
        noBA: row[3] || '',
        periode: row[4] || '',
        tglDokumen: row[5] || '',
        tglPengiriman,
        totalIncPPN: parseInt(row[7]) || 0,
        jatuhTempo,
        statusKirim,
        daysLeft,
        linkPDF: row[10] || '',
        noPO: row[11] || '',
        noDP: row[12] || '',
        isOverdue,
        overdueDays,
      };
    });

    // Filter by unit code if query param provided
    if (req.query.unit) {
      data = data.filter(inv => inv.pilihUnit.startsWith(req.query.unit));
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data invoice: ' + error.message });
  }
});

// GET /api/invoices/stats - Dashboard statistics
router.get('/invoices/stats', async (req, res) => {
  try {
    const rows = await getSheetData('MONITORING_INVOICE', 'A2:K');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let total = rows.length;
    let pending = 0;
    let dikirim = 0;
    let lunas = 0;
    let overdue = 0;
    let totalRevenue = 0;

    rows.forEach(row => {
      const status = row[9] || '';
      const jatuhTempo = row[8] || '';
      const amount = parseInt(row[7]) || 0;

      if (status === 'PENDING') pending++;
      else if (status === 'DIKIRIM') dikirim++;
      else if (status === 'LUNAS') lunas++;

      totalRevenue += amount;

      if (jatuhTempo && status !== 'LUNAS') {
        const jt = new Date(jatuhTempo);
        if (today > jt) overdue++;
      }
    });

    res.json({
      success: true,
      data: { total, pending, dikirim, lunas, overdue, totalRevenue },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/invoices - Create new invoice
router.post('/invoices', auth, async (req, res) => {
  try {
    const { unitCode, periode, noUrut, tglDokumen, docType } = req.body;

    if (!unitCode || !periode || !noUrut || !tglDokumen) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    // Get unit data
    const units = await getSheetData('DATA_UNIT', 'A2:M');
    const unitRow = units.find(row => row[0] === unitCode);
    if (!unitRow) {
      return res.status(404).json({ success: false, message: 'Unit tidak ditemukan' });
    }

    const namaUnit = unitRow[1];
    const nopol = unitRow[2];
    const area = unitRow[3];
    const koordinator = unitRow[4];
    const jabatan = unitRow[5];
    const hargaUnit = parseInt(unitRow[6]);
    const kodeInvoice = unitRow[7];
    const nomorSPK = unitRow[8];
    const tanggalSPK = unitRow[9];
    const tglMulaiSewa = unitRow[10] || '1';
    const namaCustomer = unitRow[11] || '';
    const npwpCustomer = unitRow[12] || '';

    // Calculate pricing
    const dpp = hargaUnit;
    const ppn = Math.round(dpp * 0.11);
    const totalIncPPN = dpp + ppn;

    // Parse periode
    const [periodeMonth, periodeYear] = periode.split(' ');
    const monthNum = MONTH_MAP[periodeMonth];
    const year = parseInt(periodeYear);

    if (!monthNum) {
      return res.status(400).json({ success: false, message: 'Format periode tidak valid. Gunakan: "January 2026"' });
    }

    // Generate invoice & BA numbers (using tglDokumen month)
    const tglDokumenMonth = new Date(tglDokumen).getMonth() + 1; // 1-12
    const noInvoice = generateInvoiceNumber(noUrut, kodeInvoice, tglDokumenMonth, year);
    const noBA = generateBANumber(noUrut, kodeInvoice, tglDokumenMonth, year);

    // Get Indonesian date parts for template
    const dateParts = getIndonesianDateParts(new Date(tglDokumen));
    
    // Rentang waktu & terbilang tahun
    const rentangWaktu = getRentangWaktu(tglMulaiSewa, periodeMonth, year);
    const tahunTeks = terbilang(new Date(tglDokumen).getFullYear()).trim().toLowerCase();

    // Prepare replacements for Google Docs template
    const replacements = {
      '{{no_inv}}': noInvoice,
      '{{no_ba}}': noBA,
      '{{tgl_buat}}': dateParts.formatted,
      '{{nama_unit}}': namaUnit,
      '{{nopol}}': nopol,
      '{{periode}}': rentangWaktu,
      '{{harga_dpp}}': formatRupiah(dpp),
      '{{ppn}}': formatRupiah(ppn),
      '{{total}}': formatRupiah(totalIncPPN),
      '{{terbilang}}': terbilang(totalIncPPN),
      '{{hari_teks}}': dateParts.hari,
      '{{tgl_teks}}': terbilang(parseInt(dateParts.tanggal)).trim().toLowerCase(),
      '{{bulan_teks}}': dateParts.bulan,
      '{{tahun_teks}}': tahunTeks,
      '{{tgl_singkat}}': dateParts.singkat,
      '{{area_ops}}': area,
      '{{periode bulan}}': `${periodeMonth} ${year}`,
      '{{jabatan_koor}}': jabatan,
      '{{koordinator}}': koordinator,
      '{{koordinator_ttd}}': koordinator.toUpperCase(),
      '{{no_spk}}': nomorSPK,
      '{{tgl_spk}}': tanggalSPK,
      '{{customer_nama}}': String(namaCustomer || '-'),
      '{{customer_npwp}}': String(npwpCustomer || '-'),
      '{{no_inp}}': String(noInvoice).replace('/ INV /', '/ INP /'),
      '{{rentang_waktu}}': String(rentangWaktu),
      '{{terbilang_dpp}}': String(terbilang(dpp)) + ' rupiah',
    };

    // Ensure absolutely every replacement is a string to prevent Google Apps Script crash
    for (const key in replacements) {
      if (replacements[key] === null || replacements[key] === undefined) {
        replacements[key] = '';
      } else {
        replacements[key] = String(replacements[key]);
      }
    }

    // Get Drive folder & template
    let folderId = DRIVE_FOLDERS[unitCode] || DRIVE_FOLDERS['SCI U1'];
    let templateId = TEMPLATE_IDS.SCI_INVOICE;
    let fileNamePrefix = 'INVOICE';
    let statusAwal = 'PENDING';
    
    if (docType === 'SLB_PENGAJUAN') {
      folderId = DRIVE_FOLDERS[`${unitCode}_PENGAJUAN`] || DRIVE_FOLDERS['SLB U1_PENGAJUAN'];
      templateId = TEMPLATE_IDS.SLB_PENGAJUAN;
      fileNamePrefix = 'PENGAJUAN';
      statusAwal = 'MENUNGGU PO';
      
      const formatAngka = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      replacements['{{harga_dpp}}'] = formatAngka(dpp);
      replacements['{{total}}'] = formatAngka(totalIncPPN);
    }

    // Call Apps Script to generate PDF
    let pdfLink = '';
    try {
      const monthMapZero = { 'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5, 'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11 };
      const monthNamesIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const monthIndo = monthNamesIndo[monthMapZero[periodeMonth]]?.toUpperCase() || periodeMonth.toUpperCase();
      
      const scriptResponse = await axios.post(process.env.GOOGLE_APPS_SCRIPT_URL, {
        templateId: templateId,
        newFileName: `${fileNamePrefix} ${unitCode} ${monthIndo} ${nopol}`,
        folderId,
        replacements,
      });
      pdfLink = scriptResponse.data.pdfLink || '';
    } catch (scriptError) {
      console.error('Apps Script error:', scriptError.message);
      // Continue even if PDF generation fails
    }

    // Build unit label
    const pilihUnit = `${unitCode} - ${namaUnit}`;

    // Get next row number
    const existingRows = await getSheetData('MONITORING_INVOICE', 'A2:A');
    const nextNo = existingRows.length + 1;

    // Append row to MONITORING_INVOICE sheet
    await appendRow('MONITORING_INVOICE', [
      nextNo,
      pilihUnit,
      docType === 'SLB_PENGAJUAN' ? noInvoice.replace('/ INV /', '/ INP /') : noInvoice,
      docType === 'SLB_PENGAJUAN' ? '-' : noBA,
      periode,
      tglDokumen,
      '',           // tgl pengiriman (set later)
      docType === 'SLB_PENGAJUAN' ? dpp : totalIncPPN,
      '',           // jatuh tempo (calculated when shipping date is set)
      statusAwal,
      pdfLink,
      '',           // noPO (Kolom L)
      '',           // noDP (Kolom M)
    ]);

    res.json({
      success: true,
      message: 'Invoice berhasil dibuat',
      data: {
        no: nextNo,
        pilihUnit,
        noInvoice,
        noBA,
        periode,
        tglDokumen,
        totalIncPPN,
        statusKirim: 'PENDING',
        linkPDF: pdfLink,
      },
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat invoice: ' + error.message });
  }
});

// PUT /api/invoices/:rowIndex - Update invoice status & shipping
router.put('/invoices/:rowIndex', auth, async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex);
    const { statusKirim, tglPengiriman } = req.body;

    if (statusKirim) {
      await updateCell('MONITORING_INVOICE', `J${rowIndex}`, statusKirim);
    }

    if (tglPengiriman) {
      await updateCell('MONITORING_INVOICE', `G${rowIndex}`, tglPengiriman);
      
      // Ambil unit untuk menentukan durasi jatuh tempo
      const unitRows = await getSheetData('MONITORING_INVOICE', `B${rowIndex}:B${rowIndex}`);
      const unit = unitRows[0] ? unitRows[0][0] : '';
      const days = unit.startsWith('SLB') ? 70 : 60;

      // Auto-calculate jatuh tempo
      const jatuhTempo = addDays(new Date(tglPengiriman), days);
      await updateCell('MONITORING_INVOICE', `I${rowIndex}`, formatDateISO(jatuhTempo));
    }

    res.json({ success: true, message: 'Invoice berhasil diupdate' });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ success: false, message: 'Gagal update invoice: ' + error.message });
  }
});

// DELETE /api/invoices/:rowIndex - Delete invoice
router.delete('/invoices/:rowIndex', auth, async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex);

    // Get PDF link to trash the Drive file
    const rows = await getSheetData('MONITORING_INVOICE', `K${rowIndex}:K${rowIndex}`);
    if (rows[0] && rows[0][0]) {
      const linkPDF = rows[0][0];
      const fileIdMatch = linkPDF.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        try {
          const drive = getDrive();
          await drive.files.delete({
            fileId: fileIdMatch[1],
            supportsAllDrives: true,
          });
        } catch (driveErr) {
          console.log('Drive file cleanup skipped:', driveErr.message);
        }
      }
    }

    // Delete row from sheet
    await deleteRow('MONITORING_INVOICE', rowIndex);

    res.json({ success: true, message: 'Invoice berhasil dihapus' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus invoice: ' + error.message });
  }
});

// POST /api/invoices/:index/generate-slb
router.post('/invoices/:index/generate-slb', auth, async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.index);
    const { noPO, tglInvoice, grNumber } = req.body;
    
    const rows = await getSheetData('MONITORING_INVOICE', 'A2:M');
    const row = rows[rowIndex - 2];
    if (!row) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    const noPengajuan = row[2];
    if (!noPengajuan.includes('INP')) {
      return res.status(400).json({ success: false, message: 'Bukan dokumen Pengajuan PO' });
    }

    const unitCode = row[1].split(' - ')[0];
    const units = await getSheetData('DATA_UNIT', 'A2:M');
    const unitRow = units.find(r => r[0] === unitCode);
    if (!unitRow) return res.status(404).json({ success: false, message: 'Unit tidak ditemukan' });
    
    const nopolDB = unitRow[2];
    const kodeInvoice = unitRow[7];
    const hargaUnit = parseInt(unitRow[6]);
    const namaCustomer = unitRow[11] || '';
    const npwpCustomer = unitRow[12] || '';

    const dpp = hargaUnit;
    const ppn = Math.round(dpp * 0.11);
    const totalIncPPN = dpp + ppn;

    const periode = row[4];
    const [periodeMonth, periodeYear] = periode.split(' ');
    const year = parseInt(periodeYear);

    const newInvoiceNo = noPengajuan.replace('/ INP /', '/ INV /');
    const finalTglDokumen = tglInvoice || new Date().toISOString().split('T')[0];
    const tglDokumenMonth = new Date(finalTglDokumen).getMonth() + 1;
    const noUrutStr = newInvoiceNo.split(' / ')[0];
    const noUrut = parseInt(noUrutStr, 10);
    const newBA = generateBANumber(noUrut, kodeInvoice, tglDokumenMonth, year);

    const dateParts = getIndonesianDateParts(new Date(finalTglDokumen));

    const replacements = {
      '{{no_inv}}': newInvoiceNo,
      '{{no_ba}}': newBA,
      '{{tgl_buat}}': dateParts.formatted,
      '{{po_number}}': noPO || '-',
      '{{gr_number}}': grNumber || '-',
      '{{nopol}}': nopolDB,
      '{{periode_bulan}}': `${periodeMonth} ${year}`,
      '{{harga_dpp}}': dpp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      '{{ppn}}': ppn.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      '{{total_inc_ppn}}': totalIncPPN.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      '{{customer_nama}}': namaCustomer || '-',
      '{{customer_npwp}}': npwpCustomer || '-',
    };

    for (const key in replacements) {
      if (replacements[key] === null || replacements[key] === undefined) {
        replacements[key] = '';
      } else {
        replacements[key] = String(replacements[key]);
      }
    }

    const monthMapZero = { 'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5, 'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11 };
    const monthNamesIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthIndo = monthNamesIndo[monthMapZero[periodeMonth]]?.toUpperCase() || periodeMonth.toUpperCase();

    const folderId = DRIVE_FOLDERS[`${unitCode}_INVOICE`] || DRIVE_FOLDERS['SLB U1_INVOICE'];
    const templateId = TEMPLATE_IDS.SLB_INVOICE;
    
    let pdfLink = row[10] || '';
    try {
      const scriptResponse = await axios.post(process.env.GOOGLE_APPS_SCRIPT_URL, {
        templateId,
        newFileName: `INVOICE ${unitCode} ${monthIndo} ${nopolDB}`,
        folderId,
        replacements,
      });
      pdfLink = scriptResponse.data.pdfLink || pdfLink;
    } catch (scriptError) {
      console.error('Apps Script error SLB Invoice:', scriptError.message);
    }

    const rowRange = `C${rowIndex}:M${rowIndex}`;
    const newValues = [
      newInvoiceNo,
      newBA,
      row[4],
      finalTglDokumen,
      row[6] || '',
      totalIncPPN,
      row[8] || '',
      'PENDING',
      pdfLink,
      noPO || '',
      row[12] || ''
    ];

    const { updateRange } = require('../utils/sheets');
    await updateRange('MONITORING_INVOICE', rowRange, newValues);

    res.json({ success: true, message: 'Invoice Final berhasil dibuat', pdfLink });
  } catch (error) {
    console.error('Generate SLB Invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/invoices/:index/dp
router.put('/invoices/:index/dp', auth, async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.index);
    const { noDP } = req.body;
    await updateCell('MONITORING_INVOICE', `M${rowIndex}`, noDP || '');
    res.json({ success: true, message: 'No DP berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

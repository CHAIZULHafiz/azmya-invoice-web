const express = require('express');
const auth = require('../middleware/auth');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const { getDrive } = require('../config/google');
const { getSheetData, updateCell } = require('../utils/sheets');
const { Readable } = require('stream');
const router = express.Router();

// Drive folder mapping per unit for faktur
const DRIVE_FOLDERS = {
  'SCI U1': process.env.DRIVE_FOLDER_U1 || '1a2nRyNNiqNt7bkdphLzyn4CqvlHjjbEV',
  'SCI U2': process.env.DRIVE_FOLDER_U2 || '1SscTKQmvet0J7yINJXR-lTjAd7UcEO7o',
  'SCI U3': process.env.DRIVE_FOLDER_U3 || '1fKxlwrwUh6fbNneoFOb35L1Bl8uEAXfW',
  'SLB U1': '1LzCmxrmnQGni2KGrCYOqD-SDUsTYwtcZ',
  'SLB U2': '15lmZdOOrAMubJLUYYNhwRbf524c4woRM',
};

/**
 * POST /api/pdf/merge-attachments
 * 
 * Menggabungkan PDF Invoice utama dengan satu atau lebih PDF lampiran.
 * Body: { rowIndex, files: [{ base64, label }] }
 */
router.post('/pdf/merge-attachments', auth, async (req, res) => {
  try {
    const { rowIndex, files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal satu file lampiran wajib diisi' });
    }
    if (!rowIndex) {
      return res.status(400).json({ success: false, message: 'rowIndex wajib diisi' });
    }

    // 1. Ambil data invoice dari sheet
    const rows = await getSheetData('MONITORING_INVOICE', `A${rowIndex}:M${rowIndex}`);
    if (!rows || !rows[0]) {
      return res.status(404).json({ success: false, message: 'Data invoice tidak ditemukan' });
    }

    const row = rows[0];
    const pilihUnit = row[1] || '';
    const noInvoice = row[2] || '';
    const linkPDF = row[10] || '';
    const unitCode = pilihUnit.split(' - ')[0];

    if (!linkPDF) {
      return res.status(400).json({ success: false, message: 'Invoice utama belum ada. Buat invoice dulu.' });
    }

    const fileIdMatch = linkPDF.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      return res.status(400).json({ success: false, message: 'Link PDF tidak valid' });
    }
    const existingFileId = fileIdMatch[1];

    // 2. Download PDF Utama
    console.log(`[MergeAttachments] Downloading: ${existingFileId}`);
    const drive = getDrive();
    
    // Clean trash to free quota
    try { await drive.files.emptyTrash(); } catch(e) {}

    let mainPdfBytes;
    try {
      const response = await drive.files.get(
        { fileId: existingFileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
      );
      const chunks = [];
      for await (const chunk of response.data) { chunks.push(chunk); }
      mainPdfBytes = Buffer.concat(chunks);
    } catch (err) {
      throw new Error(`Gagal download PDF utama: ${err.message}`);
    }

    // 3. Gabungkan semua PDF
    console.log(`[MergeAttachments] Merging ${files.length} attachments...`);
    const mergedPdf = await PDFDocument.create();

    // Load PDF Utama
    const mainDoc = await PDFDocument.load(mainPdfBytes);
    const mainPages = await mergedPdf.copyPages(mainDoc, mainDoc.getPageIndices());
    mainPages.forEach(p => mergedPdf.addPage(p));

    // Load Lampiran
    for (const fileObj of files) {
      try {
        const attBytes = Buffer.from(fileObj.base64, 'base64');
        const attDoc = await PDFDocument.load(attBytes);
        const attPages = await mergedPdf.copyPages(attDoc, attDoc.getPageIndices());
        attPages.forEach(p => mergedPdf.addPage(p));
        console.log(`[MergeAttachments] Added attachment: ${fileObj.label || 'unnamed'}`);
      } catch (attErr) {
        console.error(`[MergeAttachments] Error loading attachment ${fileObj.label}:`, attErr.message);
        // Continue merging other files even if one fails? Or throw?
        // Let's throw to be safe and clear.
        throw new Error(`Gagal memuat lampiran "${fileObj.label}": ${attErr.message}`);
      }
    }

    const mergedPdfBytes = await mergedPdf.save();

    // 4. Update file di Drive (Overwrite)
    const bufferStream = new Readable();
    bufferStream.push(mergedPdfBytes);
    bufferStream.push(null);

    await drive.files.update({
      fileId: existingFileId,
      // Hapus requestBody: { name: ... } agar nama file tidak berubah
      media: { mimeType: 'application/pdf', body: bufferStream },
      supportsAllDrives: true,
    });

    // Ensure permissions
    try {
      await drive.permissions.create({
        fileId: existingFileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      });
    } catch (e) {}

    const newLink = `https://drive.google.com/file/d/${existingFileId}/view`;
    await updateCell('MONITORING_INVOICE', `K${rowIndex}`, newLink);

    res.json({
      success: true,
      message: `${files.length} Lampiran berhasil digabungkan ke PDF Utama!`,
      pdfLink: newLink,
    });

  } catch (error) {
    console.error('Merge attachments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/pdf/upload-faktur - Upload Faktur Pajak PDF (standalone, tanpa merge)
router.post('/pdf/upload-faktur', auth, async (req, res) => {
  try {
    const { fileBase64, fileName, unitCode } = req.body;

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ success: false, message: 'File dan nama file wajib diisi' });
    }

    const folderId = DRIVE_FOLDERS[unitCode] || DRIVE_FOLDERS['SCI U1'];

    const response = await axios.post(process.env.GOOGLE_APPS_SCRIPT_URL, {
      action: 'uploadFaktur',
      fileBase64,
      fileName,
      folderId,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Upload faktur error:', error);
    res.status(500).json({ success: false, message: 'Gagal upload faktur: ' + error.message });
  }
});

module.exports = router;

/**
 * Sistem Otomatisasi Invoice & BA - CV. Azmya Car Transindo
 * Disimpan untuk referensi pengembangan.
 * ID sensitif telah disamarkan.
 */

function buatDokumenTagihan() {
  // 1. Hubungkan ke Google Sheets Anda menggunakan ID
  const ss = SpreadsheetApp.openById('[ID_SPREADSHEET_DISAMARKAN]');
  
  // Ambil sheet dengan cara yang lebih aman (menghindari error nama tab)
  const allSheets = ss.getSheets();
  let sheetMonitoring, sheetData;
  
  // Mencari tab yang mengandung kata MONITORING dan DATA
  for (let s of allSheets) {
    let name = s.getName().toUpperCase().trim();
    if (name.includes("MONITORING")) sheetMonitoring = s;
    if (name.includes("DATA")) sheetData = s;
  }

  if (!sheetMonitoring || !sheetData) {
    SpreadsheetApp.getUi().alert('Ralat: Tab MONITORING_INVOICE atau DATA_UNIT tidak ditemukan. Pastikan nama tab sudah benar.');
    return;
  }

  // 2. Ambil baris yang sedang diklik oleh kursor Anda
  const activeRow = ss.getActiveCell().getRow();
  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('Silakan klik salah satu sel di baris data (baris 2 ke atas).');
    return;
  }
  
  // --- KONFIGURASI ID DARI LINK ANDA ---
  const idTemplateInv = '[ID_TEMPLATE_INV_DISAMARKAN]';
  const idTemplateBA  = '[ID_TEMPLATE_BA_DISAMARKAN]';
  const idFolderSimpan = '[ID_FOLDER_SIMPAN_DISAMARKAN]'; 
  // -------------------------------------

  // Ambil data dari baris aktif
  const unitKode    = sheetMonitoring.getRange(activeRow, 2).getValue(); // Kolom B (Pilih Unit)
  const noInv       = sheetMonitoring.getRange(activeRow, 3).getValue(); // Kolom C
  const noBa        = sheetMonitoring.getRange(activeRow, 4).getValue(); // Kolom D
  const periode     = sheetMonitoring.getRange(activeRow, 5).getValue(); // Kolom E
  const tglDokumen  = sheetMonitoring.getRange(activeRow, 6).getValue(); // Kolom F

  // Cari detail unit di tab DATA_UNIT
  const masterData = sheetData.getDataRange().getValues();
  let unit = {};
  for (let i = 1; i < masterData.length; i++) {
    if (masterData[i][0].toString().trim() == unitKode.toString().trim()) {
      unit = {
        nama: masterData[i][1],
        nopol: masterData[i][2],
        area: masterData[i][3],
        koor: masterData[i][4],
        jab: masterData[i][5],
        dpp: masterData[i][6]
      };
      break;
    }
  }

  if (!unit.nopol) {
    SpreadsheetApp.getUi().alert('Ralat: Data untuk Unit "' + unitKode + '" tidak ditemukan di tab DATA_UNIT.');
    return;
  }

  // 3. Proses pembuatan file
  const folder = DriveApp.getFolderById(idFolderSimpan);
  const copyInv = DriveApp.getFileById(idTemplateInv).makeCopy("Invoice - " + unit.nopol + " - " + periode, folder);
  const copyBA  = DriveApp.getFileById(idTemplateBA).makeCopy("BA - " + unit.nopol + " - " + periode, folder);

  // Fungsi Replace Variabel
  function isiData(fileId) {
    const doc = DocumentApp.openById(fileId);
    const body = doc.getBody();
    
    body.replaceText('{{no_inv}}', noInv);
    body.replaceText('{{no_ba}}', noBa);
    body.replaceText('{{nama_unit}}', unit.nama);
    body.replaceText('{{nopol}}', unit.nopol);
    body.replaceText('{{periode}}', periode);
    body.replaceText('{{area_ops}}', unit.area);
    body.replaceText('{{koordinator}}', unit.koor);
    body.replaceText('{{jabatan_koor}}', unit.jab);
    
    // Format tanggal Indonesia
    const tglFormatted = (tglDokumen instanceof Date) ? Utilities.formatDate(tglDokumen, "GMT+8", "dd MMMM yyyy") : tglDokumen;
    body.replaceText('{{tgl_buat}}', tglFormatted);
    
    doc.saveAndClose();
  }

  isiData(copyInv.getId());
  isiData(copyBA.getId());

  // Simpan Link di Kolom K
  sheetMonitoring.getRange(activeRow, 11).setValue(copyInv.getUrl());
  
  SpreadsheetApp.getUi().alert('Berhasil! Invoice & BA sudah dibuat di Drive.');
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // PERBAIKAN: Gunakan folderId dari sistem Node.js jika ada. 
    // Jika tidak ada, baru gunakan folder default Anda.
    var targetFolderId = data.folderId || '[ID_FOLDER_DEFAULT_DISAMARKAN]'; 
    var folder = DriveApp.getFolderById(targetFolderId);

    // --- LOGIKA GABUNG FAKTUR KE PDF LAMA ---
    if (data.action === 'uploadFaktur') {
      var invoiceFileId = data.oldFileId; 
      var blob = Utilities.newBlob(Utilities.base64Decode(data.fileBase64), 'application/pdf', data.fileName);
      var newFile = folder.createFile(blob);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileUrl: newFile.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- LOGIKA BUAT INVOICE ---
    var templateFile = DriveApp.getFileById(data.templateId);
    var newDocFile = templateFile.makeCopy(data.newFileName, folder);
    var doc = DocumentApp.openById(newDocFile.getId());
    var body = doc.getBody();

    for (var key in data.replacements) {
      body.replaceText(key, data.replacements[key]);
    }
    doc.saveAndClose();

    var pdfBlob = newDocFile.getAs('application/pdf');
    var pdfFile = folder.createFile(pdfBlob);
    newDocFile.setTrashed(true);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      pdfLink: pdfFile.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

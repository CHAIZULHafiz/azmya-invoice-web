const { getSheets } = require('../config/google');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

async function getSheetData(sheetName, range) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  });
  return res.data.values || [];
}

async function appendRow(sheetName, values) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:M`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function updateCell(sheetName, cellRange, value) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${cellRange}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
}

async function updateRange(sheetName, cellRange, values) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${cellRange}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function getSheetId(sheetName) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = res.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : 0;
}

async function deleteRow(sheetName, rowIndex) {
  const sheets = getSheets();
  const sheetId = await getSheetId(sheetName);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

module.exports = { getSheetData, appendRow, updateCell, updateRange, deleteRow };

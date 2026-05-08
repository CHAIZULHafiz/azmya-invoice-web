const { google } = require('googleapis');

let sheetsInstance = null;
let driveInstance = null;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

function getSheets() {
  if (!sheetsInstance) {
    sheetsInstance = google.sheets({ version: 'v4', auth: getAuth() });
  }
  return sheetsInstance;
}

function getDrive() {
  if (!driveInstance) {
    driveInstance = google.drive({ version: 'v3', auth: getAuth() });
  }
  return driveInstance;
}

module.exports = { getSheets, getDrive };

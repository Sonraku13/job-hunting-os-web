/**
 * Membuat sheet pendamping untuk lowongan yang ditempel manual.
 *
 * Relasi:
 * MANUAL_POSTS.job_id -> JOBS.id
 *
 * Tidak mengubah JOBS, PROFILE, APPLICATIONS, atau SETTINGS.
 * Aman dijalankan ulang; tidak menghapus data yang sudah ada.
 */
function setupManualPostsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Spreadsheet DATABASE tidak ditemukan. ' +
      'Jalankan dari Apps Script yang terikat ke spreadsheet DATABASE.'
    );
  }

  const sheetName = 'MANUAL_POSTS';

  const headers = [
    'job_id',
    'post_url',
    'post_text',
    'apply_email',
    'work_arrangement',
    'extraction_status',
    'saved_at'
  ];

  let sheet = ss.getSheetByName(sheetName);
  let created = false;

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    created = true;
  }

  // Pastikan tersedia minimal tujuh kolom.
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length - sheet.getMaxColumns()
    );
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, headers.length)
    .getDisplayValues()[0]
    .map(function (value) {
      return String(value).trim();
    });

  const headerIsEmpty = currentHeaders.every(function (value) {
    return value === '';
  });

  if (headerIsEmpty) {
    sheet
      .getRange(1, 1, 1, headers.length)
      .setValues([headers]);
  } else if (currentHeaders.join('|') !== headers.join('|')) {
    throw new Error(
      'Sheet MANUAL_POSTS sudah ada, tetapi header A:G berbeda. ' +
      'Data tidak diubah. Header saat ini: ' +
      currentHeaders.join(', ')
    );
  }

  sheet.setFrozenRows(1);

  sheet
    .getRange(1, 1, 1, headers.length)
    .setBackground('#253244')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // ID dan URL sebagai teks supaya tidak dikonversi oleh Sheets.
  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('B:B').setNumberFormat('@');

  // saved_at kelak diisi objek Date oleh fungsi penyimpanan manual.
  sheet.getRange('G:G').setNumberFormat('dd mmm yyyy hh:mm');

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 480);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 160);
  sheet.setColumnWidth(7, 180);

  SpreadsheetApp.flush();

  const result = {
    success: true,
    sheet: sheetName,
    created: created,
    spreadsheetId: ss.getId(),
    headers: headers
  };

  console.log('MANUAL POSTS SETUP:', JSON.stringify(result));
  return result;
}
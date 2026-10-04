// WebUI.gs — GANTI ISI FILE WebUI.gs SAJA DENGAN KODE INI.
// Memerlukan CONFIG, getAppSettings(), saveAppSettings(), runLinkedInPipeline(),
// runJobstreetPipeline(), calculateSingleAiMatch() dari file lain yang sudah ada.
// Penghapusan hanya JOBS + APPLICATIONS, tidak mengubah PROFILE / SETTINGS.

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Job Hunting OS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function uiSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet DATABASE tidak ditemukan.');
  return ss;
}
function uiRequiredSheet_(name, headers) {
  const sheet = uiSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);
  if (sheet.getLastColumn() < headers.length) throw new Error('Kolom ' + name + ' tidak lengkap.');
  const actual = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0]
    .map(function(v) { return String(v).trim().toLowerCase(); });
  if (actual.join('|') !== headers.join('|')) throw new Error('Header ' + name + ' tidak sesuai skema.');
  return sheet;
}
function uiJobs_() {
  return uiRequiredSheet_(CONFIG.SHEETS.JOBS,
    ['id','external_job_id','source','title','company','description','match_score','url','status','created_at','location','salary']);
}
function uiApplications_() {
  return uiRequiredSheet_(CONFIG.SHEETS.APPLICATIONS,
    ['job_id','status','applied_date','notes','cover_letter','email_sent']);
}
function uiText_(value) { return value == null ? '' : String(value); }
function uiDate_(value, timezone) {
  if (value === null || value === undefined || value === '') return '';
  let date = value;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) return text;
    date = new Date(text);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) return uiText_(value);
  return Utilities.formatDate(date, timezone || 'Asia/Jakarta', 'dd MMM yyyy HH:mm');
}
function uiRow_(sheet, column, id) {
  const n = sheet.getLastRow() - 1;
  if (n <= 0) return 0;
  const rows = sheet.getRange(2, column, n, 1).getDisplayValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(id).trim()) return i + 2;
  }
  return 0;
}
function uiLock_(work) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return work(); } finally { lock.releaseLock(); }
}

// Daftar awal maksimal 200 job; deskripsi & draft penuh diminta saat modal dibuka.
function getDashboardData() {
  const ss = uiSpreadsheet_(), jobsSheet = uiJobs_(), appSheet = uiApplications_();
  const tz = ss.getSpreadsheetTimeZone();
  const totalJobs = Math.max(0, jobsSheet.getLastRow() - 1);
  const count = Math.min(200, totalJobs);
  const jobs = [];
  if (count) {
    const rows = jobsSheet.getRange(jobsSheet.getLastRow() - count + 1, 1, count, 12).getValues();
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (!r[0]) continue;
      const scoreText = uiText_(r[6]);
      const match = scoreText.match(/^\s*(\d{1,3})\s*%/);
      jobs.push({
        id: uiText_(r[0]), external_job_id: uiText_(r[1]), source: uiText_(r[2]),
        title: uiText_(r[3]), company: uiText_(r[4]),
        description_preview: uiText_(r[5]).slice(0, 175),
        score: match ? Math.min(100, Number(match[1])) : null,
        analysis_preview: scoreText.replace(/^\s*\d{1,3}\s*%\s*[-–]?\s*/, '').slice(0, 200),
        url: uiText_(r[7]), status: uiText_(r[8]) || 'DISCOVERED',
        created_at: uiDate_(r[9], tz), location: uiText_(r[10]), salary: uiText_(r[11])
      });
    }
  }
  const applications = {};
  const n = Math.max(0, appSheet.getLastRow() - 1);
  if (n) {
    const rows = appSheet.getRange(2, 1, n, 6).getValues();
    rows.forEach(function(r) {
      if (!r[0]) return;
      applications[uiText_(r[0])] = {
        job_id: uiText_(r[0]), status: uiText_(r[1]), applied_date: uiDate_(r[2], tz),
        has_email: Boolean(uiText_(r[3]).trim()), has_cover_letter: Boolean(uiText_(r[4]).trim()),
        email_sent: r[5] === true || uiText_(r[5]).toUpperCase() === 'TRUE'
      };
    });
  }
  return { jobs: jobs, applications: applications, settings: getAppSettings(),
    totalJobs: totalJobs, shownJobs: jobs.length };
}

function getJobDetailWeb(jobId) {
  const id = uiText_(jobId).trim();
  if (!id) throw new Error('ID job wajib ada.');
  const jobs = uiJobs_(), apps = uiApplications_();
  const row = uiRow_(jobs, 1, id);
  if (!row) throw new Error('Job tidak ditemukan: ' + id);
  const j = jobs.getRange(row, 1, 1, 12).getValues()[0];
  const appRow = uiRow_(apps, 1, id);
  const a = appRow ? apps.getRange(appRow, 1, 1, 6).getValues()[0] : null;
  return { id: id, title: uiText_(j[3]), company: uiText_(j[4]),
    description: uiText_(j[5]), match_score: uiText_(j[6]),
    url: uiText_(j[7]), status: uiText_(j[8]) || 'DISCOVERED',
    location: uiText_(j[10]), salary: uiText_(j[11]),
    email: a ? uiText_(a[3]) : '', cover_letter: a ? uiText_(a[4]) : '',
    applied_date: a ? uiDate_(a[2], uiSpreadsheet_().getSpreadsheetTimeZone()) : '',
    email_sent: a ? a[5] === true || uiText_(a[5]).toUpperCase() === 'TRUE' : false };
}

function saveSettingsWeb(location, frequency) {
  try {
    const locations = ['Jakarta','Tangerang','Yogyakarta','Surabaya','Malaysia','Singapore'];
    const frequencies = ['MANUAL','HOURLY','DAILY'];
    if (locations.indexOf(location) < 0 || frequencies.indexOf(frequency) < 0) {
      return { success: false, message: 'Lokasi atau frekuensi tidak valid.' };
    }
    return saveAppSettings(location, frequency);
  } catch (error) { return { success: false, message: error.message }; }
}

function updateJobStatus(jobId, status) {
  try {
    const id = uiText_(jobId).trim();
    const next = uiText_(status).trim().toUpperCase();

    if (!id) throw new Error('ID job kosong.');

    const transitions = {
      DISCOVERED: ['APPLIED', 'REJECTED'],
      ANALYZED: ['APPLIED', 'REJECTED'],
      APPLIED: ['INTERVIEW', 'REJECTED'],
      INTERVIEW: ['OFFER', 'REJECTED'],
      OFFER: ['REJECTED'],
      REJECTED: []
    };

    if (!['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(next)) {
      throw new Error('Status manual tidak valid.');
    }

    return uiLock_(function () {
      const jobs = uiJobs_();
      const apps = uiApplications_();
      const jobRow = uiRow_(jobs, 1, id);

      if (!jobRow) throw new Error('Job tidak ditemukan: ' + id);

      const current =
        uiText_(jobs.getRange(jobRow, 9).getDisplayValue()).trim().toUpperCase()
        || 'DISCOVERED';

      if (current === next) {
        return { success: true, status: current, message: 'Status tidak berubah.' };
      }

      if (!(transitions[current] || []).includes(next)) {
        throw new Error('Transisi ' + current + ' → ' + next + ' tidak diizinkan.');
      }

      let appRow = uiRow_(apps, 1, id);

      if (appRow) {
        const appStatus =
          uiText_(apps.getRange(appRow, 2).getDisplayValue()).trim().toUpperCase();

        if (
          ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(appStatus) &&
          appStatus !== current
        ) {
          throw new Error(
            'Status JOBS dan APPLICATIONS berbeda. Periksa sheet sebelum melanjutkan.'
          );
        }

        apps.getRange(appRow, 2).setValue(next);

        if (
          next === 'APPLIED' &&
          !apps.getRange(appRow, 3).getValue()
        ) {
          apps.getRange(appRow, 3).setValue(new Date());
        }
      } else {
        // Lamaran manual: belum ada hasil AI, jadi draft tetap kosong.
        apps.appendRow([
          id,
          next,
          next === 'APPLIED' ? new Date() : '',
          '',
          '',
          false
        ]);

        appRow = uiRow_(apps, 1, id);
        if (!appRow) {
          throw new Error('Baris APPLICATIONS gagal ditemukan setelah dibuat.');
        }
      }

      jobs.getRange(jobRow, 9).setValue(next);
      SpreadsheetApp.flush();

      return {
        success: true,
        status: next,
        message: 'Status diperbarui menjadi ' + next + '.'
      };
    });
  } catch (error) {
    return {
      success: false,
      message: error.message || String(error)
    };
  }
}
function triggerLinkedInScraperWeb() {
  try { const result = runLinkedInPipeline(); return { success: true, message: 'LinkedIn sync selesai.', result: result }; }
  catch (error) { return { success: false, message: error.message }; }
}
function triggerJobstreetScraperWeb() {
  try { const result = runJobstreetPipeline(); return { success: true, message: 'Jobstreet sync selesai.', result: result }; }
  catch (error) { return { success: false, message: error.message }; }
}
function triggerSingleAiMatchWeb(jobId) {
  try {
    const result = calculateSingleAiMatch(jobId);
    if (!result || !result.success) return { success: false,
      message: result && (result.message || result.error) || 'Analisis AI gagal.' };
    return { success: true, message: 'AI match dan draft disimpan.', score: result.score,
      applicationRow: result.applicationRow };
  } catch (error) { return { success: false, message: error.message }; }
}

function deleteJobIds_(input) {
  if (!Array.isArray(input) || !input.length || input.length > 200) {
    throw new Error('Pilih 1–200 job dalam satu proses.');
  }
  const ids = input.map(function(value) { return uiText_(value).trim(); });
  if (ids.some(function(id) { return !/^(?:JBS|LNK)-[A-Za-z0-9_-]+$/.test(id); })) {
    throw new Error('Format ID job tidak valid.');
  }
  if (new Set(ids).size !== ids.length) throw new Error('Daftar ID mengandung duplikat.');
  return ids;
}

// Preview tidak mengubah sheet. ID + nama job disajikan untuk konfirmasi.
function getDeleteJobsPreviewWeb(input) {
  const ids = deleteJobIds_(input);
  const jobs = uiJobs_(), apps = uiApplications_();
  const n = jobs.getLastRow() - 1, a = apps.getLastRow() - 1;
  const jobRows = n > 0 ? jobs.getRange(2, 1, n, 5).getDisplayValues() : [];
  const appRows = a > 0 ? apps.getRange(2, 1, a, 1).getDisplayValues() : [];
  const byId = {};
  jobRows.forEach(function(row) {
    const id = uiText_(row[0]).trim();
    if (id && !byId[id]) byId[id] = { id: id, title: row[3], company: row[4] };
  });
  const matches = ids.filter(function(id) { return byId[id]; }).map(function(id) { return byId[id]; });
  const appCount = appRows.filter(function(row) { return ids.indexOf(uiText_(row[0]).trim()) >= 0; }).length;
  return { jobs: matches, jobsCount: matches.length,
    applicationsCount: appCount, missing: ids.filter(function(id) { return !byId[id]; }) };
}

function deleteSelectedJobsWeb(input) {
  try {
    const ids = deleteJobIds_(input);
    return uiLock_(function() {
      const jobs = uiJobs_(), apps = uiApplications_();
      const wanted = new Set(ids);
      const n = jobs.getLastRow() - 1, a = apps.getLastRow() - 1;
      const jobIds = n > 0 ? jobs.getRange(2, 1, n, 1).getDisplayValues() : [];
      const appIds = a > 0 ? apps.getRange(2, 1, a, 1).getDisplayValues() : [];
      const jobRows = [], appRows = [], found = {};
      jobIds.forEach(function(row, index) {
        const id = uiText_(row[0]).trim();
        if (wanted.has(id)) { jobRows.push(index + 2); found[id] = (found[id] || 0) + 1; }
      });
      if (ids.some(function(id) { return found[id] !== 1; })) {
        throw new Error('ID job tidak ada atau duplikat dalam JOBS. Refresh lalu pilih ulang; belum ada data yang dihapus.');
      }
      appIds.forEach(function(row, index) {
        if (wanted.has(uiText_(row[0]).trim())) appRows.push(index + 2);
      });
      appRows.sort(function(x,y) { return y-x; }).forEach(function(row) { apps.deleteRow(row); });
      jobRows.sort(function(x,y) { return y-x; }).forEach(function(row) { jobs.deleteRow(row); });
      SpreadsheetApp.flush();
      console.log('BULK DELETE:', JSON.stringify({ jobs: jobRows.length, applications: appRows.length }));
      return { success: true, deletedJobs: jobRows.length, deletedApplications: appRows.length,
        message: jobRows.length + ' job dan ' + appRows.length + ' application dihapus dari DATABASE.' };
    });
  } catch (error) {
    console.error('BULK DELETE ERROR:', error);
    return { success: false, message: error.message || String(error) };
  }
}

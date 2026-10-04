/**
 * ScraperService.gs
 *
 * Satu kali Sync = satu portal + satu lokasi dari SETTINGS.
 *
 * Lokasi yang didukung:
 * Jakarta, Yogyakarta, Tangerang, Surabaya, Singapore, Malaysia.
 *
 * Tidak menghapus JOBS lama.
 * Tidak mengubah header JOBS A:L.
 * Tidak otomatis mencari enam lokasi sekaligus.
 */

const SCRAPER_LOCATIONS = {
  'jakarta': 'Jakarta',
  'yogyakarta': 'Yogyakarta',
  'jogja': 'Yogyakarta',
  'tangerang': 'Tangerang',
  'surabaya': 'Surabaya',
  'singapore': 'Singapore',
  'singapura': 'Singapore',
  'malaysia': 'Malaysia'
};

function getScraperLocation_() {
  const settings = getAppSettings();
  const raw = String(
    settings && settings.location
      ? settings.location
      : CONFIG.LOCATION
  ).trim();

  const location = SCRAPER_LOCATIONS[raw.toLowerCase()];

  if (!location) {
    throw new Error(
      'Target lokasi tidak didukung: "' + raw + '". ' +
      'Pilih Jakarta, Yogyakarta, Tangerang, Surabaya, ' +
      'Singapore, atau Malaysia di web app.'
    );
  }

  return location;
}

function checkZapiKey_() {
  if (!CONFIG.ZAPI_KEY) {
    throw new Error(
      'ZAPI_KEY belum diatur di Script Properties.'
    );
  }
}

function runLinkedInPipeline() {
  const location = getScraperLocation_();
  console.log('LINKEDIN SEARCH LOCATION:', location);

  const items = scrapeLinkedIn(location);

  if (!items.length) {
    return {
      success: true,
      location: location,
      fetched: 0,
      normalized: 0,
      added: 0,
      updated: 0
    };
  }

  const normalized = normalizeJobs('LinkedIn', items);
  const saved = saveJobsToDatabase(normalized);

  return {
    success: true,
    location: location,
    fetched: items.length,
    normalized: normalized.length,
    added: saved.added,
    updated: saved.updated
  };
}

function runJobstreetPipeline() {
  const location = getScraperLocation_();
  console.log('JOBSTREET SEARCH LOCATION:', location);

  const items = scrapeJobstreet(location);

  if (!items.length) {
    return {
      success: true,
      location: location,
      fetched: 0,
      normalized: 0,
      added: 0,
      updated: 0
    };
  }

  const normalized = normalizeJobs('Jobstreet', items);
  const saved = saveJobsToDatabase(normalized);

  return {
    success: true,
    location: location,
    fetched: items.length,
    normalized: normalized.length,
    added: saved.added,
    updated: saved.updated
  };
}

function scrapeLinkedIn(location) {
  checkZapiKey_();

  const url =
    CONFIG.ZAPI_BASE_URL +
    '/jobs:linkedin/search?query=' +
    encodeURIComponent(CONFIG.SEARCH_QUERY) +
    '&location=' +
    encodeURIComponent(location) +
    '&postedWithin=24h&page=1&limit=40';

  return fetchJobsFromZapi(url);
}

function scrapeJobstreet(location) {
  checkZapiKey_();

  // Endpoint mengikuti endpoint yang SUDAH digunakan proyek ini.
  const url =
    CONFIG.ZAPI_BASE_URL +
    '/jobs:jobstreet/recent-jobs?query=' +
    encodeURIComponent(CONFIG.SEARCH_QUERY) +
    '&location=' +
    encodeURIComponent(location) +
    '&withinDays=1&page=1&limit=40';

  return fetchJobsFromZapi(url);
}

function fetchJobsFromZapi(url) {
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'x-api-key': CONFIG.ZAPI_KEY
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(
      'ZAPI search HTTP ' +
      response.getResponseCode() +
      ': ' +
      response.getContentText().slice(0, 350)
    );
  }

  let payload;

  try {
    payload = JSON.parse(response.getContentText());
  } catch (error) {
    throw new Error('Respons ZAPI search bukan JSON valid.');
  }

  const items =
    payload.items ||
    (payload.data && payload.data.items) ||
    payload.data;

  if (!Array.isArray(items)) {
    throw new Error(
      'Respons ZAPI tidak berisi items array.'
    );
  }

  console.log(
    'ZAPI SEARCH:',
    payload.provider || 'unknown',
    'page:',
    payload.page || 1,
    'items:',
    items.length
  );

  return items;
}

function firstValue_(values) {
  for (let i = 0; i < values.length; i++) {
    if (
      values[i] !== undefined &&
      values[i] !== null &&
      values[i] !== ''
    ) {
      return values[i];
    }
  }

  return '';
}

function extractJobId(job) {
  const value = firstValue_([
    job.jobId,
    job.job_id,
    job.id,
    job.uuid,
    job.reference
  ]);

  return value === ''
    ? ''
    : String(value).trim();
}

function createInternalId(source, externalId) {
  return (
    source === 'LinkedIn'
      ? 'LNK-'
      : 'JBS-'
  ) + externalId;
}

function extractTitle(job) {
  return String(
    firstValue_([
      job.title,
      job.roleTitle,
      job.roleTitles && job.roleTitles[0],
      job.position,
      job.name
    ]) || ''
  ).trim();
}

function extractCompany(job) {
  const company = firstValue_([
    job.company,
    job.employer,
    job.advertiser
  ]);

  if (company && typeof company === 'object') {
    return String(
      firstValue_([
        company.name,
        company.displayName,
        company.label
      ]) || ''
    ).trim();
  }

  return String(company || '').trim();
}

function extractUrl(job) {
  return String(
    firstValue_([
      job.url,
      job.applyUrl,
      job.link
    ]) || ''
  ).trim();
}

/**
 * Jangan pakai CONFIG.LOCATION sebagai lokasi job.
 * Lokasi target pencarian bukan bukti lokasi setiap iklan.
 */
function extractLocation(job) {
  const value = firstValue_([
    job.location,
    job.city
  ]);

  const place =
    value && typeof value === 'object'
      ? firstValue_([
          value.label,
          value.name,
          [
            value.city,
            value.region || value.state
          ].filter(Boolean).join(', ')
        ])
      : value;

  return String(place || '').trim();
}

function extractSalary(job) {
  return firstValue_([
    job.salary,
    job.salaryRange,
    job.compensation
  ]);
}

function htmlDecode_(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&#(\d+);/g, function (_, value) {
      const code = Number(value);
      return code >= 32 && code <= 65535
        ? String.fromCharCode(code)
        : ' ';
    })
    .replace(/&#x([\da-f]+);/gi, function (_, value) {
      const code = parseInt(value, 16);
      return code >= 32 && code <= 65535
        ? String.fromCharCode(code)
        : ' ';
    });
}

function cleanHTML(value) {
  if (value && typeof value === 'object') {
    value = firstValue_([
      value.text,
      value.content,
      value.html,
      value.description
    ]);
  }

  const text = String(value || '')
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
      ' '
    )
    .replace(
      /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,
      ' '
    )
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(
      /<\/(?:p|div|li|ul|ol|h[1-6])\s*>/gi,
      '\n'
    )
    .replace(/<\s*li\b[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, ' ');

  return htmlDecode_(text)
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractDescription(job) {
  return cleanHTML(
    firstValue_([
      job.description,
      job.jobDescription,
      job.summary,
      job.teaser
    ])
  );
}

function extractDetailPayload_(payload) {
  const data =
    payload &&
    payload.data &&
    typeof payload.data === 'object'
      ? payload.data
      : payload;

  return data &&
    data.job &&
    typeof data.job === 'object'
      ? data.job
      : data || {};
}

function fetchJobDetail_(source, externalId) {
  const portal =
    source === 'LinkedIn'
      ? 'linkedin'
      : 'jobstreet';

  const url =
    CONFIG.ZAPI_BASE_URL +
    '/jobs:' +
    portal +
    '/job/' +
    encodeURIComponent(externalId);

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'x-api-key': CONFIG.ZAPI_KEY
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      console.log(
        'ZAPI DETAIL HTTP:',
        portal,
        externalId,
        response.getResponseCode()
      );

      return null;
    }

    return extractDetailPayload_(
      JSON.parse(response.getContentText())
    );
  } catch (error) {
    console.log(
      'ZAPI DETAIL ERROR:',
      portal,
      externalId,
      String(error)
    );

    return null;
  }
}

function conciseDescription_(
  searchJob,
  detailJob,
  title,
  company
) {
  const searchText = extractDescription(searchJob);
  const detailText = detailJob
    ? extractDescription(detailJob)
    : '';

  const body =
    detailText.length > searchText.length
      ? detailText
      : searchText;

  if (!body) {
    return (
      'Detail tanggung jawab dan persyaratan untuk ' +
      title +
      ' di ' +
      company +
      ' tidak tersedia di sumber.'
    );
  }

  const summary =
    detailJob && detailJob.summary
      ? cleanHTML(detailJob.summary)
      : searchText;

  const unique =
    summary &&
    body.indexOf(summary) !== 0 &&
    summary !== body;

  if (body.length <= 1600) {
    return unique
      ? summary.slice(0, 500) + '\n\n' + body
      : body;
  }

  const paragraphs = body
    .split(/\n\n+/)
    .map(value => value.trim())
    .filter(Boolean);

  let first = paragraphs[0] || '';
  let second = paragraphs.slice(1).join(' ');

  if (!second) {
    const pivot = first.lastIndexOf('. ', 1000);

    if (pivot > 250) {
      second = first.slice(pivot + 2);
      first = first.slice(0, pivot + 1);
    }
  }

  return [
    unique
      ? summary.slice(0, 380) + ' ' + first
      : first,
    second
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 40000);
}

function formatSalary(value) {
  if (value == null || value === '') {
    return 'Tidak ditampilkan';
  }

  if (typeof value === 'string') {
    const text = value.trim();

    if (text.charAt(0) === '{') {
      try {
        return formatSalary(JSON.parse(text));
      } catch (error) {
        return 'Tidak ditampilkan';
      }
    }

    return text || 'Tidak ditampilkan';
  }

  if (typeof value !== 'object') {
    return 'Tidak ditampilkan';
  }

  if (
    value.shown === false ||
    value.visible === false ||
    value.isVisible === false
  ) {
    return 'Tidak ditampilkan';
  }

  const display = firstValue_([
    value.display,
    value.formatted,
    value.text,
    value.label
  ]);

  if (
    typeof display === 'string' &&
    display.trim()
  ) {
    return display.trim().replace(/\u00a0/g, ' ');
  }

  const min = Number(
    firstValue_([
      value.min,
      value.minimum,
      value.minSalary
    ])
  );

  const max = Number(
    firstValue_([
      value.max,
      value.maximum,
      value.maxSalary
    ])
  );

  const hasMin =
    Number.isFinite(min) &&
    min > 0;

  const hasMax =
    Number.isFinite(max) &&
    max > 0;

  if (!hasMin && !hasMax) {
    return 'Tidak ditampilkan';
  }

  const currency = String(
    value.currency || 'IDR'
  ).toUpperCase();

  const asMoney = amount =>
    (
      currency === 'IDR'
        ? 'Rp '
        : currency + ' '
    ) + amount.toLocaleString('id-ID');

  const interval = String(
    firstValue_([
      value.interval,
      value.period,
      value.frequency
    ]) || ''
  ).toLowerCase();

  const period = ({
    monthly: 'bulan',
    month: 'bulan',
    yearly: 'tahun',
    annual: 'tahun',
    hourly: 'jam',
    daily: 'hari',
    weekly: 'minggu'
  })[interval] || interval;

  const range =
    hasMin && hasMax
      ? (
          min === max
            ? asMoney(min)
            : asMoney(min) + '–' + asMoney(max)
        )
      : hasMin
        ? 'Mulai ' + asMoney(min)
        : 'Hingga ' + asMoney(max);

  return range + (
    period
      ? ' / ' + period
      : ''
  );
}

function normalizeJobs(source, items) {
  const result = [];

  items.forEach(function (item, index) {
    if (!item || typeof item !== 'object') return;

    const externalId = extractJobId(item);
    const title = extractTitle(item);
    const company = extractCompany(item);

    if (!externalId || !title || !company) {
      console.log(
        'SKIP ITEM incomplete:',
        source,
        index
      );
      return;
    }

    const detail = fetchJobDetail_(
      source,
      externalId
    );

    const detailSalary = detail
      ? extractSalary(detail)
      : '';

    const rawSalary =
      detailSalary !== ''
        ? detailSalary
        : extractSalary(item);

    result.push({
      id: createInternalId(
        source,
        externalId
      ),
      external_job_id: externalId,
      source: source,
      title: title,
      company: company,
      description: conciseDescription_(
        item,
        detail,
        title,
        company
      ),
      match_score: '',
      url:
        extractUrl(item) ||
        (detail ? extractUrl(detail) : ''),
      status: 'DISCOVERED',
      created_at: new Date().toISOString(),
      location:
        extractLocation(item) ||
        (detail ? extractLocation(detail) : ''),
      salary: formatSalary(rawSalary)
    });
  });

  return result;
}

function safeScraperCell_(value) {
  const text = String(
    value == null
      ? ''
      : value
  );

  return /^\s*[=+@\-]/.test(text)
    ? "'" + text
    : text;
}

function saveJobsToDatabase(jobs) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) {
      throw new Error(
        'Spreadsheet DATABASE tidak ditemukan.'
      );
    }

    const sheet = ss.getSheetByName(
      CONFIG.SHEETS.JOBS
    );

    if (!sheet) {
      throw new Error(
        'JOBS tidak ditemukan.'
      );
    }

    const lastRow = sheet.getLastRow();
    const old = lastRow > 1
      ? sheet
          .getRange(
            2,
            1,
            lastRow - 1,
            12
          )
          .getValues()
      : [];

    const idRows = {};

    old.forEach(function (row, index) {
      if (row[0]) {
        idRows[
          String(row[0]).trim()
        ] = index + 2;
      }
    });

    const rows = [];
    const seen = {};
    let updated = 0;

    jobs.forEach(function (job) {
      if (
        !job.id ||
        seen[job.id]
      ) {
        return;
      }

      seen[job.id] = true;

      const rowIndex = idRows[job.id];

      if (!rowIndex) {
        rows.push([
          safeScraperCell_(job.id),
          safeScraperCell_(
            job.external_job_id
          ),
          job.source,
          safeScraperCell_(
            job.title
          ),
          safeScraperCell_(
            job.company
          ),
          safeScraperCell_(
            job.description
          ),
          '',
          safeScraperCell_(
            job.url
          ),
          'DISCOVERED',
          job.created_at,
          safeScraperCell_(
            job.location
          ),
          safeScraperCell_(
            job.salary
          )
        ]);

        return;
      }

      const previous =
        old[rowIndex - 2];

      const previousDescription =
        String(
          previous[5] || ''
        );

      const previousSalary =
        String(
          previous[11] || ''
        );

      const previousLocation =
        String(
          previous[10] || ''
        ).trim();

      if (
        job.description &&
        job.description.length >
          previousDescription.length + 30
      ) {
        sheet
          .getRange(rowIndex, 6)
          .setValue(
            safeScraperCell_(
              job.description
            )
          );

        updated++;
      }

      if (
        previousSalary.charAt(0) === '{' ||
        !previousSalary ||
        previousSalary === 'Tidak tercantum' ||
        previousSalary === 'Tidak tersedia' ||
        (
          previousSalary ===
            'Tidak ditampilkan' &&
          job.salary !==
            'Tidak ditampilkan'
        )
      ) {
        sheet
          .getRange(rowIndex, 12)
          .setValue(
            safeScraperCell_(
              job.salary
            )
          );
      }

      /*
       * Isi lokasi lama yang kosong.
       * Jangan timpa lokasi lama yang sudah ada:
       * bisa jadi iklan yang sama muncul dalam
       * beberapa pencarian kota berbeda.
       */
      if (
        !previousLocation &&
        job.location
      ) {
        sheet
          .getRange(rowIndex, 11)
          .setValue(
            safeScraperCell_(
              job.location
            )
          );
      }
    });

    if (rows.length) {
      sheet
        .getRange(
          sheet.getLastRow() + 1,
          1,
          rows.length,
          12
        )
        .setValues(rows);
    }

    SpreadsheetApp.flush();

    return {
      added: rows.length,
      updated: updated
    };
  } finally {
    lock.releaseLock();
  }
}

function repairExistingSalaryValues() {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.JOBS
      );

  if (
    !sheet ||
    sheet.getLastRow() <= 1
  ) {
    return {
      updated: 0
    };
  }

  const range = sheet.getRange(
    2,
    12,
    sheet.getLastRow() - 1,
    1
  );

  const rows = range.getValues();
  let changed = 0;

  const output = rows.map(function (row) {
    const old = row[0];

    if (
      typeof old !== 'string' ||
      old.trim().charAt(0) !== '{'
    ) {
      return [old];
    }

    const next = formatSalary(old);

    if (old !== next) {
      changed++;
    }

    return [
      safeScraperCell_(next)
    ];
  });

  if (changed) {
    range.setValues(output);
  }

  return {
    updated: changed
  };
}
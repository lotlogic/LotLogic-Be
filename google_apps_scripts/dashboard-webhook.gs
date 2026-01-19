const SHEET_NAME = 'DASHBOARD';
const WEBHOOK_SECRET = '';
const BACKEND_BASE_URL = 'https://agnei6ds9x.ap-southeast-2.awsapprunner.com/';
const DASHBOARD_TRIGGER_PATH = 'api/google-sheets/dashboard-trigger';
const HEADER_ROW = 2;
const TEMPLATE_ROW = 3;
const REPORT_ID_BASE = 15000;
const TRIGGER_COLUMN_AB = 28; // Column AB ("send for QA?")

function doGet() {
  return ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Installable edit trigger handler for column AB ("send for QA?").
 * Set this as an "On edit" trigger in Apps Script.
 *
 * When AB is set to TRUE (e.g. checkbox ticked), it posts the full row payload
 * (including "Row Number") to the backend dashboard-trigger endpoint.
 */
function onDashboardSendForQaEdit(e) {
  try {
    if (!e || !e.range) return;

    const range = e.range;
    const sheet = range.getSheet();
    if (!sheet || sheet.getName() !== SHEET_NAME) return;

    Logger.log(
      'onDashboardSendForQaEdit: sheet=%s range=%s',
      sheet.getName(),
      range.getA1Notation()
    );

    const startCol = range.getColumn();
    const numCols = range.getNumColumns();
    const endCol = startCol + numCols - 1;

    // Only react when the edited range includes column AB
    if (TRIGGER_COLUMN_AB < startCol || TRIGGER_COLUMN_AB > endCol) return;

    const startRow = range.getRow();
    const numRows = range.getNumRows();
    const lastCol = sheet.getLastColumn();

    // Read headers once
    const headers = sheet
      .getRange(HEADER_ROW, 1, 1, lastCol)
      .getValues()[0]
      .map(h => String(h).trim());

    const headerIndex = new Map(headers.map((h, i) => [h, i]));

    for (let i = 0; i < numRows; i++) {
      const rowNumber = startRow + i;
      if (rowNumber < TEMPLATE_ROW) continue;

      const abValue = sheet.getRange(rowNumber, TRIGGER_COLUMN_AB).getValue();
      if (!isTruthy_(abValue)) {
        Logger.log('onDashboardSendForQaEdit: row=%s AB not truthy (%s)', rowNumber, String(abValue));
        continue;
      }

      const payload = buildRowPayload_(sheet, headers, rowNumber, lastCol);
      payload['Row Number'] = rowNumber;

      Logger.log(
        'onDashboardSendForQaEdit: firing backend trigger row=%s reportId=%s',
        rowNumber,
        String(payload['Report ID'] || '')
      );
      callBackendDashboardTrigger_(payload);
    }
  } catch (err) {
    // Best effort: triggers shouldn't throw
    Logger.log('onDashboardSendForQaEdit error: ' + String(err && err.message ? err.message : err));
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const secret = (e?.parameter?.secret || payload.secret || '');

    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return json_({ ok: false, error: 'sheet_not_found' });

    const lastCol = sheet.getLastColumn();

    // Read headers
    const headers = sheet
      .getRange(HEADER_ROW, 1, 1, lastCol)
      .getValues()[0]
      .map(h => String(h).trim());

    const headerIndex = new Map(headers.map((h, i) => [h, i]));

    const action = String(payload.action || e?.parameter?.action || '').toLowerCase();
    const rowNumber = normalizeInt_(
      payload.rowNumber || payload['Row Number'] || e?.parameter?.rowNumber || e?.parameter?.['Row Number']
    );

    Logger.log('doPost: action=%s rowNumber=%s', action || '(append)', rowNumber || '');

    if (action === 'update' || rowNumber) {
      return updateRow_(sheet, lastCol, headerIndex, payload, rowNumber);
    }

    return appendRow_(sheet, lastCol, headerIndex, payload);
  } catch (err) {
    return json_({ ok: false, error: String(err?.message || err) });
  }
}

function appendRow_(sheet, lastCol, headerIndex, payload) {
  // Determine append row number
  const targetRowNumber = sheet.getLastRow() + 1;

  // Create the new row
  sheet.insertRowAfter(sheet.getLastRow());

  // Copy template row (values, formatting, data validation, etc.) into the new row
  sheet
    .getRange(TEMPLATE_ROW, 1, 1, lastCol)
    .copyTo(sheet.getRange(targetRowNumber, 1, 1, lastCol), { contentsOnly: false });

  // Now set the values you want to override
  const targetRange = sheet.getRange(targetRowNumber, 1, 1, lastCol);
  const targetRow = targetRange.getValues()[0];

  // Timestamp
  const tsIdx = headerIndex.get('Timestamp');
  if (tsIdx === undefined) return json_({ ok: false, error: 'missing_timestamp_header' });
  targetRow[tsIdx] = new Date();

  // Auto Report ID
  const reportIdIdx = headerIndex.get('Report ID');
  if (reportIdIdx !== undefined) {
    targetRow[reportIdIdx] = REPORT_ID_BASE + targetRowNumber;
  }

  // Payload field mapping
  const fieldMap = [
    { header: 'Client name', key: 'clientName' },
    { header: 'Client email', key: 'clientEmail' },
    { header: 'Client phone', key: 'clientPhone' },
    { header: 'Address', key: 'address' },
    { header: 'Suburb', key: 'suburb' },
    { header: 'Block size (m²)', key: 'blockSizeM2' },
    { header: 'Zone', key: 'zone' },
  ];

  for (const { header, key } of fieldMap) {
    const idx = headerIndex.get(header);
    if (idx === undefined) continue;
    targetRow[idx] = normalize_(payload[key]);
  }

  // Write updated values back into the copied row
  targetRange.setValues([targetRow]);

  Logger.log('appendRow_: row=%s reportId=%s', targetRowNumber, String(REPORT_ID_BASE + targetRowNumber));

  return json_({
    ok: true,
    reportId: REPORT_ID_BASE + targetRowNumber,
    rowNumber: targetRowNumber,
  });
}

function updateRow_(sheet, lastCol, headerIndex, payload, rowNumber) {
  if (!rowNumber) return json_({ ok: false, error: 'missing_row_number' });
  if (rowNumber < TEMPLATE_ROW) return json_({ ok: false, error: 'invalid_row_number' });
  if (rowNumber > sheet.getLastRow()) return json_({ ok: false, error: 'row_out_of_range' });

  const range = sheet.getRange(rowNumber, 1, 1, lastCol);
  const row = range.getValues()[0];

  const updates = (payload.updates && typeof payload.updates === 'object' && !Array.isArray(payload.updates))
    ? payload.updates
    : {};

  // Convenience keys (backend-friendly)
  if (payload.finalPdfLink !== undefined) updates['Final PDF link'] = payload.finalPdfLink;
  if (payload.deliveryStatus !== undefined) updates['Delivery status'] = payload.deliveryStatus;
  if (payload.deliveryDate !== undefined) updates['Delivery date'] = payload.deliveryDate;
  if (payload.internalNotes !== undefined) updates['Internal notes'] = payload.internalNotes;
  if (payload.escalation !== undefined) updates['Escalation'] = payload.escalation;

  // Also allow direct header keys in the payload (sheets-friendly)
  for (const k in payload) {
    if (headerIndex.has(k) && payload[k] !== undefined) {
      updates[k] = payload[k];
    }
  }

  let applied = 0;
  for (const header in updates) {
    const idx = headerIndex.get(header);
    if (idx === undefined) continue;
    row[idx] = normalize_(updates[header]);
    applied++;
  }

  range.setValues([row]);

  Logger.log('updateRow_: row=%s applied=%s', rowNumber, applied);

  return json_({ ok: true, rowNumber, applied });
}

function parsePayload_(e) {
  const type = e?.postData?.type || '';
  const contents = e?.postData?.contents || '';

  if (type.includes('application/json')) {
    try {
      return JSON.parse(contents || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  return Object.assign({}, e?.parameter || {});
}

function normalize_(v) {
  if (v === undefined || v === null) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function isTruthy_(v) {
  if (v === true) return true;
  if (v === false || v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'y' || s === '1' || s === 'on' || s === 'checked';
}

function buildRowPayload_(sheet, headers, rowNumber, lastCol) {
  const values = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  const payload = {};
  for (let c = 0; c < headers.length; c++) {
    const header = String(headers[c] || '').trim();
    if (!header) continue;
    payload[header] = normalize_(values[c]);
  }
  return payload;
}

function callBackendDashboardTrigger_(payload) {
  const base = String(BACKEND_BASE_URL || '').trim();
  if (!base) return;

  const url =
    base.replace(/\/+$/, '') +
    '/' +
    String(DASHBOARD_TRIGGER_PATH || '').replace(/^\/+/, '') +
    '?secret=' +
    encodeURIComponent(WEBHOOK_SECRET || '');

  const safeUrl = url.replace(/\bsecret=[^&]+/i, 'secret=REDACTED');
  Logger.log(
    'callBackendDashboardTrigger_: POST %s row=%s reportId=%s',
    safeUrl,
    String(payload && (payload['Row Number'] || payload.rowNumber) ? (payload['Row Number'] || payload.rowNumber) : ''),
    String(payload && payload['Report ID'] ? payload['Report ID'] : '')
  );

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true,
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const bodyText = res.getContentText();
    Logger.log('callBackendDashboardTrigger_: response code=%s body=%s', code, bodyText);
    if (code < 200 || code >= 300) {
      Logger.log('dashboard-trigger non-2xx: ' + code + ' body=' + bodyText);
    }
  } catch (err) {
    Logger.log('callBackendDashboardTrigger_ error: ' + String(err && err.message ? err.message : err));
  }
}

function normalizeInt_(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'number' && isFinite(v)) return Math.floor(v);
  const s = String(v).trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return isFinite(n) ? n : null;
}

function getHeader_(e, name) {
  return (e?.headers && (e.headers[name] || e.headers[name.toLowerCase()])) || '';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


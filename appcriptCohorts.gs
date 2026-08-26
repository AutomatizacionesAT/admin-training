// ============================================================
//  COHORTS — Google Apps Script
//  Adjuntar este script al Google Sheet de Cohorts.
//  Deployar como Web App: "Anyone" puede acceder.
//
//  Por ahora solo tiene doGet (lectura de config).
//  Cuando se necesite escritura, descomentar doPost.
// ============================================================

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action === 'ping') {
    return createSuccessResponse({ status: 'active', module: 'COHORTS' });
  }

  return createSuccessResponse({ status: 'active' });
}

// ── Helpers ──────────────────────────────────────────────────

function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ result: 'success' }, data)))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'error', error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateDebugSheet(doc) {
  var name = 'CohortsLogs';
  var sheet = doc.getSheetByName(name);
  if (!sheet) {
    sheet = doc.insertSheet(name);
    sheet.appendRow(['Timestamp', 'Message']);
  }
  return sheet;
}

function logToDebug(sheet, message) {
  try {
    sheet.appendRow([new Date(), message]);
  } catch(e) { /* fail silently */ }
}

// ============================================================
//  ESCRITURA — descomentar cuando se necesite desde la app
// ============================================================

/*
var GAS_SHEET_NAME = "Jenny Carolina"; // cambiar según coordinador

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var debugSheet = getOrCreateDebugSheet(doc);

  try {
    logToDebug(debugSheet, "POST recibido");

    if (!e || !e.postData) {
      return createErrorResponse("No postData");
    }

    var payload = JSON.parse(e.postData.contents);
    var sheet = doc.getSheetByName(GAS_SHEET_NAME);

    if (!sheet) return createErrorResponse("Sheet no encontrado: " + GAS_SHEET_NAME);

    var action = payload.action || 'create';

    if (action === 'create') {
      return handleCreate(sheet, payload.data || payload, debugSheet);
    } else if (action === 'update') {
      return handleUpdate(sheet, payload, debugSheet);
    } else if (action === 'delete') {
      return handleDelete(sheet, payload, debugSheet);
    }

    return createErrorResponse("Acción no reconocida: " + action);

  } catch(err) {
    logToDebug(debugSheet, "Error: " + err.toString());
    return createErrorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

function handleCreate(sheet, data, debugSheet) {
  var records = Array.isArray(data) ? data : [data];
  var rows = records.map(mapRecordToRow);
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    logToDebug(debugSheet, "Creados: " + rows.length + " registros");
  }
  return createSuccessResponse({ rows: rows.length, action: 'create' });
}

function handleUpdate(sheet, payload, debugSheet) {
  var rowIndex = payload.rowIndex;
  var record = payload.data;
  if (!rowIndex || !record) return createErrorResponse("Faltan rowIndex o data");
  var rowData = mapRecordToRow(record);
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  logToDebug(debugSheet, "Actualizado rowIndex: " + rowIndex);
  return createSuccessResponse({ updated: true, rowIndex: rowIndex, action: 'update' });
}

function handleDelete(sheet, payload, debugSheet) {
  var rowIndex = payload.rowIndex;
  if (!rowIndex) return createErrorResponse("Falta rowIndex");
  sheet.deleteRow(rowIndex);
  logToDebug(debugSheet, "Eliminado rowIndex: " + rowIndex);
  return createSuccessResponse({ deleted: true, rowIndex: rowIndex, action: 'delete' });
}

function mapRecordToRow(r) {
  return [
    r.anio || "",
    r.mes || "",
    r.req || "",
    r.direccion || "",
    r.campana || "",
    r.segmento || "",
    r.nombre || "",
    r.documento || "",
    r.indicador || "",
    r.referencia || "",
    r.formato || "",
    r.metaOjt || "",
    r.resultadoOjt || "",
    r.cumplimientoOjt || "",
    r.metaS1 || "",
    r.resultadoS1 || "",
    r.cumplimientoS1 || "",
    r.metaS2 || "",
    r.resultadoS2 || "",
    r.cumplimientoS2 || "",
    r.metaS3 || "",
    r.resultadoS3 || "",
    r.cumplimientoS3 || "",
    r.metaS4 || "",
    r.resultadoS4 || "",
    r.cumplimientoS4 || "",
    r.metaCierre || "",
    r.resultadoCierre || "",
    r.cumplimientoCierre || "",
    r.observacion || "",
    r.formador || "",
    r.coordinador || "",
    r.cumplimiento70 || "",
  ];
}
*/

// ─── SALAS — Google Apps Script ──────────────────────────────────────────────
// Pega este código en el Apps Script del spreadsheet "Salas 2026"
// Hojas requeridas: SALAS_CATALOGO, SALAS_ASIGNACIONES, SALAS_ADMINS

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action === 'getSalasAdmins') {
    return handleGetSalasAdmins();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ "status": "active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var debugSheet = getOrCreateDebugSheet(doc);

  try {
    logToDebug(debugSheet, "Inicio de petición POST");

    if (!e || !e.postData) {
      logToDebug(debugSheet, "Error: No postData received");
      return createErrorResponse("No postData");
    }

    var rawData = e.postData.contents;
    logToDebug(debugSheet, "Datos recibidos (length): " + rawData.length);

    var payload;
    try {
      payload = JSON.parse(rawData);
    } catch (parseError) {
      logToDebug(debugSheet, "Error JSON.parse: " + parseError.toString());
      return createErrorResponse("Invalid JSON");
    }

    var action = payload.action || '';
    logToDebug(debugSheet, "Acción: " + action);

    if (action === 'createSala') {
      return handleCreateSala(doc, payload.data || payload, debugSheet);
    } else if (action === 'updateSala') {
      return handleUpdateSala(doc, payload, debugSheet);
    } else if (action === 'deleteSala') {
      return handleDeleteSala(doc, payload, debugSheet);
    } else if (action === 'createAsignacion') {
      return handleCreateAsignacion(doc, payload.data || payload, debugSheet);
    } else if (action === 'updateAsignacion') {
      return handleUpdateAsignacion(doc, payload, debugSheet);
    } else if (action === 'deleteAsignacion') {
      return handleDeleteAsignacion(doc, payload, debugSheet);
    } else {
      return createErrorResponse("Acción no reconocida: " + action);
    }

  } catch (err) {
    logToDebug(debugSheet, "Error General: " + err.toString());
    return createErrorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

// ─── SALAS_ADMINS ─────────────────────────────────────────────────────────────
function handleGetSalasAdmins() {
  var doc   = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("SALAS_ADMINS");
  if (!sheet || sheet.getLastRow() < 2) {
    return createSuccessResponse({ admins: [] });
  }
  var rows   = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  var admins = rows
    .filter(function(r) { return r[0] !== "" && r[0] !== null; })
    .map(function(r) {
      return {
        documento: String(r[0]).trim(),
        nombre:    String(r[1]).trim(),
        cargo:     String(r[2]).trim()
      };
    });
  return createSuccessResponse({ admins: admins });
}

// ─── SALAS_CATALOGO CRUD ──────────────────────────────────────────────────────
function mapSalaToRow(d) {
  return [
    d.sede      || '',
    d.sala      || '',
    d.tipo      || '',
    d.capacidad || '',
    d.equipos   || '',
    d.horario   || '',
    d.tablero   || '',
    d.tv        || ''
  ];
}

function handleCreateSala(doc, data, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_CATALOGO");
  if (!sheet) return createErrorResponse("Sheet SALAS_CATALOGO not found");
  var row = mapSalaToRow(data);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Sala creada: " + data.sala);
  return createSuccessResponse({ action: "createSala" });
}

function handleUpdateSala(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_CATALOGO");
  if (!sheet) return createErrorResponse("Sheet SALAS_CATALOGO not found");
  var row = mapSalaToRow(payload.data);
  sheet.getRange(payload.rowIndex, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Sala actualizada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "updateSala" });
}

function handleDeleteSala(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_CATALOGO");
  if (!sheet) return createErrorResponse("Sheet SALAS_CATALOGO not found");
  sheet.deleteRow(payload.rowIndex);
  logToDebug(debugSheet, "Sala eliminada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "deleteSala" });
}

// ─── SALAS_ASIGNACIONES CRUD ──────────────────────────────────────────────────
function mapAsignacionToRow(d) {
  return [
    d.campana      || '',
    d.req          || '',
    d.sala         || '',
    d.sede         || '',
    d.formador     || '',
    d.fechaInicial || '',
    d.fechaFin     || '',
    d.horario      || '',
    d.dPersonas    || ''
  ];
}

function handleCreateAsignacion(doc, data, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  var row = mapAsignacionToRow(data);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Asignacion creada: " + data.campana);
  return createSuccessResponse({ action: "createAsignacion" });
}

function handleUpdateAsignacion(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  var row = mapAsignacionToRow(payload.data);
  sheet.getRange(payload.rowIndex, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Asignacion actualizada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "updateAsignacion" });
}

function handleDeleteAsignacion(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  sheet.deleteRow(payload.rowIndex);
  logToDebug(debugSheet, "Asignacion eliminada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "deleteAsignacion" });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ result: "success" }, data)))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: "error", error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateDebugSheet(doc) {
  var name  = "SystemLogs_Salas";
  var sheet = doc.getSheetByName(name);
  if (!sheet) {
    sheet = doc.insertSheet(name);
    sheet.appendRow(["Timestamp", "Message"]);
  }
  return sheet;
}

function logToDebug(sheet, message) {
  try {
    sheet.appendRow([new Date(), message]);
  } catch(e) {
    // Fail silently
  }
}

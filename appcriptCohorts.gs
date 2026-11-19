// ============================================================
//  COHORTS — Google Apps Script
//  Adjuntar este script al Google Sheet de Cohorts.
//  Publicar como Web App: ejecutar como tu cuenta, acceso "Cualquier usuario".
//
//  Solo lectura. GET: estado del servicio. POST: consultas autenticadas.
//  En Propiedades de la secuencia de comandos, copiar TRAINING_SESSION_SECRET
//  del proyecto de login con el MISMO valor. No generar otro secreto aquí.
//  Nunca compartir el secreto ni guardarlo en el frontend.
//
//  POST {action:"getCohortData", sessionToken:"..."}: pestañas autorizadas.
//  POST {action:"getCohortData", sheet:"NOMBRE EXACTO", sessionToken:"..."}: una pestaña.
//  POST {action:"getCohortSheets", sessionToken:"..."}: nombres autorizados.
//  sessionToken proviene del login actual; no enviarlo en la URL.
//  El frontend todavía debe adaptarse tras publicar esta versión.
// ============================================================

var COHORT_ADMIN_DOCUMENTOS = [
  '1075657236', '52829724', '1018509964', '1030550388',
  '79616534', '1088309969', '52748970'
];

// Nombres exactos de las pestañas que ya consulta el frontend.
// Para agregar un coordinador, registrar aquí su documento y pestaña.
var COHORT_COORDINATOR_SHEETS = [
  { documento: '1016048741', sheet: 'CRISTIAM CAMILO LOPEZ CONTRERAS' },
  { documento: '1019047075', sheet: 'JHONNY ALEXANDER VARELA RUSINQUE' },
  { documento: '1020808847', sheet: 'JENNY CAROLINA PINZON FERNANDEZ' },
  { documento: '1032485963', sheet: 'JEIMMY LORENA MUÑOZ DIAZ' },
  { documento: '1081514968', sheet: 'OLGA LUCIA BRAVO NUNEZ' },
  { documento: '1088312274', sheet: 'JHON EYDER RAMIREZ CORREA' },
  { documento: '1113789102', sheet: 'YENNY VANESSA RUIZ VALLEJO' },
  { documento: '1013675280', sheet: 'MICHAEL DANIEL RENDON MORATO' },
  { documento: '1012385857', sheet: 'WALTHER DUVAN GOMEZ OSORIO' },
];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action && action !== 'ping') {
    return createErrorResponse('Usa POST con sessionToken para consultar datos.');
  }

  return createSuccessResponse({ status: 'active', module: 'COHORTS', version: 'restricted-cohorts-v1' });
}

function doPost(e) {
  try {
    if (!e || !e.postData) return createErrorResponse('No postData');
    var payload = JSON.parse(e.postData.contents || '{}');
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return createErrorResponse('Invalid payload');
    }
    if (payload.action !== 'getCohortData' && payload.action !== 'getCohortSheets') {
      return createErrorResponse('Acción no permitida. Cohorts solo permite lectura.');
    }
    var session = requireCohortSession(payload.sessionToken);
    var allowedSheets = getAllowedCohortSheets(session.documento);
    if (!allowedSheets.length) {
      return createErrorResponse('Tu usuario no tiene una pestaña de Cohorts asignada. Contacta al administrador.');
    }
    if (payload.action === 'getCohortSheets') {
      return createSuccessResponse({ sheets: allowedSheets });
    }
    if (payload.sheet !== undefined) {
      if (allowedSheets.indexOf(payload.sheet) === -1) {
        return createErrorResponse('No tienes permisos para consultar esa pestaña.');
      }
      allowedSheets = [payload.sheet];
    }
    return handleGetCohortData(SpreadsheetApp.getActiveSpreadsheet(), allowedSheets);
  } catch (error) {
    return createErrorResponse(String(error));
  }
}

function requireCohortSession(token) {
  var secret = PropertiesService.getScriptProperties().getProperty('TRAINING_SESSION_SECRET');
  if (!secret) {
    throw new Error('Falta configurar TRAINING_SESSION_SECRET con el mismo valor del proyecto de login.');
  }
  var message = 'Sesión inválida o vencida. Inicia sesión nuevamente.';
  try {
    if (typeof token !== 'string' || token.length > 2048) throw new Error(message);
    var parts = token.split('.');
    if (parts.length !== 2) throw new Error(message);
    var expected = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(parts[0], secret, Utilities.Charset.UTF_8)
    );
    if (parts[1].length !== expected.length) throw new Error(message);
    var difference = 0;
    for (var i = 0; i < expected.length; i++) {
      difference |= parts[1].charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (difference !== 0) throw new Error(message);
    var session = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (session.audience !== 'training' ||
        typeof session.documento !== 'string' || !session.documento.trim() ||
        typeof session.expiresAt !== 'number' || !isFinite(session.expiresAt) ||
        session.expiresAt <= Date.now()) throw new Error(message);
    return session;
  } catch (error) {
    throw new Error(message);
  }
}

function getAllowedCohortSheets(documento) {
  var isAdmin = COHORT_ADMIN_DOCUMENTOS.indexOf(documento) !== -1;
  return COHORT_COORDINATOR_SHEETS.filter(function(coordinator) {
    return isAdmin || coordinator.documento === documento;
  }).map(function(coordinator) { return coordinator.sheet; });
}

function handleGetCohortData(doc, sheetNames) {
  var sheets = [];
  var missingSheets = [];
  var timezone = doc.getSpreadsheetTimeZone();
  sheetNames.forEach(function(name) {
    var sheet = doc.getSheetByName(name);
    if (!sheet) {
      missingSheets.push(name);
      return;
    }
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (!lastRow || !lastColumn) {
      sheets.push({ sheet: name, headers: [], rows: [], displayRows: [], rowIndices: [] });
      return;
    }
    var range = sheet.getRange(1, 1, lastRow, lastColumn);
    var values = range.getValues();
    var display = range.getDisplayValues();
    var rows = values.slice(1).map(function(row) {
      return row.map(function(value) {
        // Preservar el día local del libro, sin desplazamientos de zona horaria.
        return value instanceof Date
          ? Utilities.formatDate(value, timezone, "yyyy-MM-dd'T'HH:mm:ss")
          : value;
      });
    });
    sheets.push({
      sheet: name,
      headers: display[0],
      rows: rows,
      displayRows: display.slice(1),
      // No filtrar filas vacías para conservar sus índices reales.
      rowIndices: rows.map(function(row, index) { return index + 2; })
    });
  });
  if (!sheets.length) {
    return createErrorResponse('No existen las pestañas de Cohorts solicitadas: ' + missingSheets.join(', '));
  }
  // Una pestaña faltante se informa; no se oculta como si fuera una hoja vacía.
  return createSuccessResponse({ sheets: sheets, missingSheets: missingSheets, timezone: timezone });
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
//  EJEMPLO LEGACY DE ESCRITURA — permanece deshabilitado.
//  No descomentar: duplicaría doPost y omitiría la validación de sesión.
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

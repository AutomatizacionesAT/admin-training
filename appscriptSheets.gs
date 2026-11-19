// Aplicación web vinculada al libro: ejecutar como el propietario, acceso "Cualquier usuario".
// Las operaciones de datos requieren sessionToken (devuelto por login); no enviarlo en la URL.
// Lectura: POST {action:"readSheet", sheet:"Base_WT25", sessionToken:"..."}
// Configuración: POST {action:"getConfig", sessionToken:"..."}
// Escritura: acciones existentes create/update/delete/saveConfig + sessionToken.
// El secreto TRAINING_SESSION_SECRET se genera automáticamente en Propiedades del script.
// No copiar secretos al frontend. Las sesiones duran 8 horas.
//
// IMPORTANTE: publicar este archivo no migra el frontend. Hasta adaptar sus peticiones,
// las escrituras antiguas sin sesión serán rechazadas y gviz seguirá requiriendo acceso público.

var TRAINING_ADMIN_DOCUMENTOS = [
  '1075657236', '52829724', '1018509964', '1030550388',
  '79616534', '1088309969', '52748970'
];
var TRAINING_READABLE_SHEETS = [
  'Base_WT25', 'Base_SM (1)', 'CONTROL_DE_ACCESOS', 'INFORME BIOMETRICO',
  'DATA (4)', 'DATA', 'Novedades', 'Envios Servidores'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  var debugSheet;
  
  try {
    if (!e || !e.postData) {
      return createErrorResponse("No postData");
    }

    var rawData = e.postData.contents;
    var payload;
    try {
      payload = JSON.parse(rawData);
    } catch (parseError) {
      return createErrorResponse("Invalid JSON");
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return createErrorResponse("Invalid payload");
    }

    var action = payload.action || '';
    var allowedActions = ['login', 'readSheet', 'getConfig', 'create', 'update', 'delete', 'saveConfig'];
    if (allowedActions.indexOf(action) === -1) {
      return createErrorResponse("Acción no reconocida");
    }
    var doc = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'login') {
      locked = lock.tryLock(10000);
      if (!locked) return createErrorResponse("Servicio ocupado. Intenta nuevamente.");
      return handleLogin(doc, payload);
    }

    var session = requireTrainingSession(doc, payload.sessionToken);
    if (action === 'readSheet') {
      return handleReadSheet(doc, payload.sheet);
    }
    if (action === 'getConfig') return handleGetConfig(doc);

    if (TRAINING_ADMIN_DOCUMENTOS.indexOf(session.documento) === -1) {
      return createErrorResponse("No tienes permisos para modificar estos datos.");
    }
    locked = lock.tryLock(10000);
    if (!locked) return createErrorResponse("Servicio ocupado. Intenta nuevamente.");
    debugSheet = getOrCreateDebugSheet(doc);
    logToDebug(debugSheet, "Acción: " + action + " | Documento: " + session.documento);
    if (action === 'saveConfig') {
      return handleSaveConfig(doc, payload.configData, debugSheet);
    }
    var sheet = doc.getSheetByName("Base_WT25");
    if (!sheet) return createErrorResponse("Sheet Base_WT25 not found");
    if (action === 'update') {
      return handleUpdate(sheet, payload, debugSheet);
    } else if (action === 'delete') {
      return handleDelete(sheet, payload, debugSheet);
    } else {
      return handleCreate(sheet, payload.data, debugSheet);
    }
  } catch (e) {
    logToDebug(debugSheet, "Error General: " + e.toString());
    return createErrorResponse(e.toString());
  } finally {
    if (locked) lock.releaseLock();
  }
}

function handleLogin(doc, payload) {
  var usuario = payload.usuario !== null && payload.usuario !== undefined
    ? String(payload.usuario).trim()
    : '';
  var clave = payload.clave !== null && payload.clave !== undefined
    ? String(payload.clave)
    : '';

  if (!usuario || !clave) {
    return createSuccessResponse({ "authenticated": false });
  }

  var sheet = doc.getSheetByName("ingresoAdmin");
  if (!sheet) {
    return createErrorResponse("Authentication sheet not found");
  }

  if (sheet.getLastRow() < 2) {
    return createSuccessResponse({ "authenticated": false });
  }

  // A: documento, B: nombre completos, C: cargo hs,
  // D: usuario, E: clave, F: observacion.
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getDisplayValues();

  for (var i = 0; i < rows.length; i++) {
    var rowUsuario = String(rows[i][3]).trim();
    var rowClave = String(rows[i][4]);

    if (rowUsuario === usuario && rowClave === clave) {
      var documento = String(rows[i][0]).trim();
      if (!documento) {
        return createSuccessResponse({ "authenticated": false });
      }

      return createSuccessResponse({
        "authenticated": true,
        "documento": documento,
        "sessionToken": createTrainingToken(documento),
        "expiresIn": 8 * 60 * 60,
        // Compatibilidad con el servidor separado de Salas, si ya está configurado.
        "salasToken": documento === '52829724' &&
          PropertiesService.getScriptProperties().getProperty('SALAS_SESSION_SECRET')
          ? createSalasToken(documento) : null
      });
    }
  }

  return createSuccessResponse({ "authenticated": false });
}

function createTrainingToken(documento) {
  var properties = PropertiesService.getScriptProperties();
  var secret = properties.getProperty('TRAINING_SESSION_SECRET');
  if (!secret) {
    // doPost mantiene el bloqueo durante login para no generar secretos simultáneos.
    secret = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('TRAINING_SESSION_SECRET', secret);
  }
  return signSessionToken(documento, 'training', secret);
}

function createSalasToken(documento) {
  var secret = PropertiesService.getScriptProperties().getProperty('SALAS_SESSION_SECRET');
  if (!secret) throw new Error('Falta configurar SALAS_SESSION_SECRET.');
  return signSessionToken(documento, 'salas', secret);
}

function signSessionToken(documento, audience, secret) {
  var body = Utilities.base64EncodeWebSafe(JSON.stringify({
    documento: documento,
    audience: audience,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000
  }), Utilities.Charset.UTF_8);
  var signature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(body, secret, Utilities.Charset.UTF_8)
  );
  return body + '.' + signature;
}

function requireTrainingSession(doc, token) {
  var message = 'Sesión inválida o vencida. Inicia sesión nuevamente.';
  try {
    if (typeof token !== 'string' || token.length > 2048) throw new Error(message);
    var parts = token.split('.');
    var secret = PropertiesService.getScriptProperties().getProperty('TRAINING_SESSION_SECRET');
    if (parts.length !== 2 || !secret) throw new Error(message);
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
    if (session.audience !== 'training' || typeof session.documento !== 'string' ||
        typeof session.expiresAt !== 'number' || !isFinite(session.expiresAt) ||
        session.expiresAt <= Date.now()) throw new Error(message);
    // Dar de baja un usuario en ingresoAdmin revoca también sus sesiones existentes.
    var sheet = doc.getSheetByName('ingresoAdmin');
    if (!sheet || sheet.getLastRow() < 2) throw new Error(message);
    var users = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
    var active = users.some(function(row) { return String(row[0]).trim() === session.documento; });
    if (!active) throw new Error(message);
    return session;
  } catch (error) {
    throw new Error(message);
  }
}

function handleReadSheet(doc, sheetName) {
  // Lista cerrada: nunca exponer ingresoAdmin, SystemLogs u otra pestaña arbitraria.
  if (TRAINING_READABLE_SHEETS.indexOf(sheetName) === -1) {
    return createErrorResponse('Pestaña no permitida.');
  }
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) return createErrorResponse('No existe la pestaña: ' + sheetName);
  var timezone = doc.getSpreadsheetTimeZone();
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (!lastRow || !lastColumn) {
    return createSuccessResponse({
      sheet: sheetName, headers: [], rows: [], displayRows: [], rowIndices: [], timezone: timezone
    });
  }
  var range = sheet.getRange(1, 1, lastRow, lastColumn);
  var values = range.getValues();
  var display = range.getDisplayValues();
  var rows = values.slice(1).map(function(row) {
    return row.map(function(value) {
      return value instanceof Date
        ? Utilities.formatDate(value, timezone, "yyyy-MM-dd'T'HH:mm:ss")
        : value;
    });
  });
  // Se conservan filas vacías intermedias para no desplazar rowIndex en las ediciones.
  return createSuccessResponse({
    sheet: sheetName,
    headers: display[0],
    rows: rows,
    displayRows: display.slice(1),
    rowIndices: rows.map(function(row, index) { return index + 2; }),
    timezone: timezone
  });
}

function requireDataRow(sheet, value) {
  var rowIndex = Number(value);
  if (!isFinite(rowIndex) || Math.floor(rowIndex) !== rowIndex ||
      rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error('Fila inválida. No se puede modificar el encabezado ni una fila inexistente.');
  }
  return rowIndex;
}

function handleDelete(sheet, payload, debugSheet) {
  var rowIndex = requireDataRow(sheet, payload.rowIndex);

  logToDebug(debugSheet, "Eliminando fila: " + rowIndex);
  sheet.deleteRow(rowIndex);
  
  return createSuccessResponse({ "deleted": true, "rowIndex": rowIndex, "action": "delete" });
}

function handleSaveConfig(doc, configData, debugSheet) {
  if (!Array.isArray(configData) || configData.some(function(row) {
    return !Array.isArray(row) || row.length !== 2 || row.some(function(value) {
      return typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null;
    });
  })) {
    return createErrorResponse('Configuración inválida: se requieren filas de clave y valor.');
  }
  var sheetName = "CONTROL_DE_ACCESOS_CONFIG";
  var sheet = doc.getSheetByName(sheetName);
  
  // Si la pestaña no existe, se crea automáticamente
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  // Borrar contenido anterior para evitar que queden campañas viejas
  sheet.clearContents();
  
  // Escribir los nuevos datos desde la celda A1 (Key - Value)
  if (configData && configData.length > 0) {
    sheet.getRange(1, 1, configData.length, configData[0].length).setValues(configData);
    logToDebug(debugSheet, "Configuración actualizada en " + sheetName);
  }
  
  return createSuccessResponse({ "updated": true, "action": "saveConfig" });
}

function handleCreate(sheet, data, debugSheet) {
  // Soporta tanto array de registros como un solo registro
  var records = Array.isArray(data) ? data : [data];
  if (!records.length || records.some(function(record) {
    return !record || typeof record !== 'object' || Array.isArray(record);
  })) return createErrorResponse('No hay registros válidos para crear.');
  
  var rowsToAdd = records.map(function(record) {
    return mapRecordToRow(record);
  });

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    logToDebug(debugSheet, "Éxito: " + rowsToAdd.length + " filas agregadas");
  }

  return createSuccessResponse({ "rows": rowsToAdd.length, "action": "create" });
}

function handleUpdate(sheet, payload, debugSheet) {
  var rowIndex = requireDataRow(sheet, payload.rowIndex);
  var record = payload.data;

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return createErrorResponse("Missing rowIndex or data for update");
  }

  // Validar rowIndex (asegurar que es número y > 1)
  // Nota: rowIndex viene del frontend. Si el frontend calcula index+2, aquí es directo.
  // Es mejor usar número de fila 1-based directo.
  
  logToDebug(debugSheet, "Actualizando fila: " + rowIndex);
  
  var rowData = mapRecordToRow(record);
  
  // Actualizar la fila específica (col 1 a 16)
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  
  return createSuccessResponse({ "updated": true, "rowIndex": rowIndex, "action": "update" });
}

function mapRecordToRow(record) {
  return [
    record.fechaSolicitud || "",
    record.coordinador || "",
    record.cliente || "",
    record.segmento || "",
    record.desarrollador || "",
    record.segmentoMenu || "",
    record.desarrollo || "",
    record.nombre || "",
    record.cantidad !== null && record.cantidad !== undefined ? record.cantidad : "",
    record.fechaMaterial || "",
    record.fechaInicio || "",
    record.fechaFin || "",
    record.estado || "",
    record.formador || "",
    record.observaciones || "",
    record.campana || ""
  ];
}

function createErrorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ "result": "error", "error": msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createSuccessResponse(data) {
  return ContentService
      .createTextOutput(JSON.stringify(Object.assign({ "result": "success" }, data)))
      .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateDebugSheet(doc) {
  var name = "SystemLogs";
  var sheet = doc.getSheetByName(name);
  if (!sheet) {
    sheet = doc.insertSheet(name);
    sheet.appendRow(["Timestamp", "Message"]);
  }
  return sheet;
}

function logToDebug(sheet, message) {
  try {
    var timestamp = new Date();
    sheet.appendRow([timestamp, message]);
  } catch(e) {
    // Fail silently
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action) {
    return createErrorResponse('Usa POST con sessionToken para consultar datos.');
  }

  return ContentService
    .createTextOutput(JSON.stringify({ "status": "active", "version": "restricted-sheets-v1" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetConfig(doc) {
  var sheetName = "CONTROL_DE_ACCESOS_CONFIG";
  var sheet = doc.getSheetByName(sheetName);

  if (!sheet || sheet.getLastRow() === 0) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "config": {} }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
  var config = {};
  
  for (var i = 0; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    if (key !== "" && key !== null && key !== undefined) {
      // Si el valor es un objeto Date, formatearlo como yyyy-MM-dd
      if (val instanceof Date) {
        val = Utilities.formatDate(val, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "yyyy-MM-dd");
      }
      config[String(key)] = (val !== null && val !== undefined) ? String(val) : "";
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ "result": "success", "config": config }))
    .setMimeType(ContentService.MimeType.JSON);
}

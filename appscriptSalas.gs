// ─── SALAS — Google Apps Script ──────────────────────────────────────────────
// Pega este código en el Apps Script del spreadsheet "Salas 2026"
// Hojas requeridas: SALAS_CATALOGO, SALAS_ASIGNACIONES, SALAS_ADMINS, ASIGNACION_TICKET
// Publicar como Web App: ejecutar como tu cuenta, acceso "Cualquier usuario".
// En Propiedades de script: TRAINING_SESSION_SECRET debe tener el MISMO valor
// del proyecto de login. No generar otra clave ni incluirla en el frontend.
//
// POST {action:"readSheet", sheet:"SALAS_CATALOGO", sessionToken:"..."}
// POST {action:"getSalasAdmins", sessionToken:"..."}
// Las acciones de escritura existentes también requieren sessionToken.
// Solo Diana (52829724) puede gestionar salas y aprobar/rechazar asignaciones.
// Otros usuarios pueden solicitar en PENDIENTE y gestionar sus propios tickets.
// SALAS_ADMINS debe contener documento (A), nombre completo (B) y cargo (C)
// de quienes crean solicitudes/tickets, para verificar su identidad en el servidor.
// GET solo devuelve el estado; no se envían tokens por URL.
// Tras publicar, falta adaptar el frontend a POST autenticado y a la nueva URL.

var SALAS_MANAGER_DOCUMENTO = '52829724';

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action) {
    return createErrorResponse('Usa POST con sessionToken para consultar datos.');
  }

  return ContentService
    .createTextOutput(JSON.stringify({ "status": "active", "version": "restricted-salas-v1" }))
    .setMimeType(ContentService.MimeType.JSON);
}

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
      return createErrorResponse('Invalid payload');
    }
    var action = payload.action || '';
    var actions = [
      'readSheet', 'getSalasAdmins', 'createSala', 'updateSala', 'deleteSala',
      'createAsignacion', 'updateAsignacion', 'deleteAsignacion', 'updateEstadoAsignacion',
      'createTicket', 'updateTicket', 'respondTicket', 'closeTicket'
    ];
    if (actions.indexOf(action) === -1) return createErrorResponse('Acción no reconocida.');
    var session = requireSalasSession(payload.sessionToken);
    var isManager = session.documento === SALAS_MANAGER_DOCUMENTO;
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    if (action === 'readSheet') return handleReadSalasSheet(doc, payload.sheet, isManager);
    if (action === 'getSalasAdmins') {
      if (!isManager) return createErrorResponse('Solo Diana puede consultar el directorio de administradores.');
      return handleGetSalasAdmins(doc);
    }

    // Nunca confiar en el rol o documento enviados por el navegador.
    var managerActions = [
      'createSala', 'updateSala', 'deleteSala',
      'updateAsignacion', 'deleteAsignacion', 'updateEstadoAsignacion',
      'updateTicket', 'respondTicket'
    ];
    var isRequest = action === 'createAsignacion' &&
      payload.data && payload.data.estadoAsignacion === 'PENDIENTE';
    if (managerActions.indexOf(action) !== -1 ||
        (action === 'createAsignacion' && !isRequest)) {
      if (!isManager) {
        return createErrorResponse('Solo Diana Maritza Pedreros Cuervo puede gestionar Salas. Inicia sesión nuevamente.');
      }
    }
    var dataActions = ['createSala', 'updateSala', 'createAsignacion', 'updateAsignacion', 'createTicket', 'updateTicket'];
    if (dataActions.indexOf(action) !== -1 &&
        (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data))) {
      return createErrorResponse('Datos inválidos.');
    }
    locked = lock.tryLock(10000);
    if (!locked) return createErrorResponse('Servicio ocupado. Intenta nuevamente.');

    if (!isManager) {
      var identity = getSalasIdentity(doc, session.documento);
      if (action === 'createAsignacion') {
        payload.data.coordinador = identity.nombre;
        payload.data.estadoAsignacion = 'PENDIENTE';
        payload.data.ticket = '';
        payload.data.estadoTicket = '';
      } else if (action === 'createTicket') {
        if (payload.data.rowIndexAsignacion !== undefined) {
          requireOwnedAsignacion(doc, payload.data.rowIndexAsignacion, identity);
        }
        payload.data.personaReporta = identity.nombre;
        payload.data.personaCreaTicket = identity.nombre;
        payload.data.fechaCierre = '';
        payload.data.respuesta = '';
      } else if (action === 'closeTicket') {
        var ticketSheet = doc.getSheetByName('ASIGNACION_TICKET');
        if (!ticketSheet) return createErrorResponse('Sheet ASIGNACION_TICKET not found');
        var ticketRow = requireSalasDataRow(ticketSheet, payload.rowIndex);
        var reporter = ticketSheet.getRange(ticketRow, 4).getDisplayValues()[0][0];
        if (!matchesSalasIdentity(reporter, identity)) {
          return createErrorResponse('Solo puedes cerrar tus propios tickets.');
        }
        if (payload.rowIndexAsignacion !== undefined) {
          requireOwnedAsignacion(doc, payload.rowIndexAsignacion, identity);
        }
      }
    }
    debugSheet = getOrCreateDebugSheet(doc);
    logToDebug(debugSheet, 'Acción: ' + action + ' | Documento: ' + session.documento);

    // ── Salas ────────────────────────────────────────────────────────────────
    if (action === 'createSala') {
      return handleCreateSala(doc, payload.data, debugSheet);
    } else if (action === 'updateSala') {
      return handleUpdateSala(doc, payload, debugSheet);
    } else if (action === 'deleteSala') {
      return handleDeleteSala(doc, payload, debugSheet);

    // ── Asignaciones ─────────────────────────────────────────────────────────
    } else if (action === 'createAsignacion') {
      return handleCreateAsignacion(doc, payload.data, debugSheet);
    } else if (action === 'updateAsignacion') {
      return handleUpdateAsignacion(doc, payload, debugSheet);
    } else if (action === 'deleteAsignacion') {
      return handleDeleteAsignacion(doc, payload, debugSheet);
    } else if (action === 'updateEstadoAsignacion') {
      return handleUpdateEstadoAsignacion(doc, payload, debugSheet);

    // ── Tickets ───────────────────────────────────────────────────────────────
    } else if (action === 'createTicket') {
      return handleCreateTicket(doc, payload.data, debugSheet);
    } else if (action === 'updateTicket') {
      return handleUpdateTicket(doc, payload, debugSheet);
    } else if (action === 'respondTicket') {
      return handleRespondTicket(doc, payload, debugSheet);
    } else if (action === 'closeTicket') {
      return handleCloseTicket(doc, payload, debugSheet);

    } else {
      return createErrorResponse("Acción no reconocida: " + action);
    }

  } catch (err) {
    logToDebug(debugSheet, "Error General: " + err.toString());
    return createErrorResponse(err.toString());
  } finally {
    if (locked) lock.releaseLock();
  }
}

function requireSalasSession(token) {
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
    var claims = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (claims.audience !== 'training' ||
        typeof claims.documento !== 'string' || !claims.documento.trim() ||
        typeof claims.expiresAt !== 'number' || !isFinite(claims.expiresAt) ||
        claims.expiresAt <= Date.now()) throw new Error(message);
    return claims;
  } catch (error) {
    throw new Error(message);
  }
}

function handleReadSalasSheet(doc, name, isManager) {
  var widths = { SALAS_CATALOGO: 8, SALAS_ASIGNACIONES: 14, ASIGNACION_TICKET: 12, SALAS_ADMINS: 3 };
  if (!Object.prototype.hasOwnProperty.call(widths, name)) return createErrorResponse('Pestaña no permitida.');
  if (name === 'SALAS_ADMINS' && !isManager) return createErrorResponse('Solo Diana puede consultar el directorio de administradores.');
  var sheet = doc.getSheetByName(name);
  if (!sheet) return createErrorResponse('No existe la pestaña: ' + name);
  var timezone = doc.getSpreadsheetTimeZone();
  var lastRow = sheet.getLastRow();
  if (!lastRow) {
    return createSuccessResponse({ sheet: name, headers: [], rows: [], displayRows: [], rowIndices: [], timezone: timezone });
  }
  var range = sheet.getRange(1, 1, lastRow, widths[name]);
  var display = range.getDisplayValues();
  var rows = range.getValues().slice(1).map(function(row) {
    return row.map(function(value) {
      return value instanceof Date ? Utilities.formatDate(value, timezone, 'yyyy-MM-dd') : value;
    });
  });
  return createSuccessResponse({
    sheet: name, headers: display[0], rows: rows, displayRows: display.slice(1),
    rowIndices: rows.map(function(row, index) { return index + 2; }), timezone: timezone
  });
}

function requireSalasDataRow(sheet, value) {
  var rowIndex = Number(value);
  if (!isFinite(rowIndex) || Math.floor(rowIndex) !== rowIndex ||
      rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error('Fila inválida. No se puede modificar el encabezado ni una fila inexistente.');
  }
  return rowIndex;
}

function getSalasIdentity(doc, documento) {
  var sheet = doc.getSheetByName('SALAS_ADMINS');
  if (sheet && sheet.getLastRow() >= 2) {
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getDisplayValues();
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === documento && String(rows[i][1]).trim()) {
        return { documento: documento, nombre: String(rows[i][1]).trim() };
      }
    }
  }
  throw new Error('Tu usuario no está registrado en SALAS_ADMINS. Contacta al administrador.');
}

function matchesSalasIdentity(value, identity) {
  var normalize = function(text) {
    return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
  };
  var normalized = normalize(value);
  return normalized === normalize(identity.nombre) || normalized === identity.documento;
}

function requireOwnedAsignacion(doc, value, identity) {
  var sheet = doc.getSheetByName('SALAS_ASIGNACIONES');
  if (!sheet) throw new Error('Sheet SALAS_ASIGNACIONES not found');
  var row = requireSalasDataRow(sheet, value);
  var coordinator = sheet.getRange(row, 13).getDisplayValues()[0][0];
  if (!matchesSalasIdentity(coordinator, identity)) {
    throw new Error('Solo puedes gestionar tickets de tus propias asignaciones.');
  }
}

// ─── SALAS_ADMINS ─────────────────────────────────────────────────────────────
function handleGetSalasAdmins(doc) {
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
  payload.rowIndex = requireSalasDataRow(sheet, payload.rowIndex);
  var row = mapSalaToRow(payload.data);
  sheet.getRange(payload.rowIndex, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Sala actualizada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "updateSala" });
}

function handleDeleteSala(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_CATALOGO");
  if (!sheet) return createErrorResponse("Sheet SALAS_CATALOGO not found");
  payload.rowIndex = requireSalasDataRow(sheet, payload.rowIndex);
  sheet.deleteRow(payload.rowIndex);
  logToDebug(debugSheet, "Sala eliminada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "deleteSala" });
}

// ─── SALAS_ASIGNACIONES CRUD ──────────────────────────────────────────────────
// Columnas: CAMPAÑA(1) REQ(2) SALA(3) SEDE(4) FORMADOR(5) FECHA INICIAL(6)
//           FECHA FIN(7) HORARIO(8) CANTIDAD(9) ESTADO ASIGNACION(10)
//           TICKET(11) ESTADO TICKET(12) COORDINADOR(13) TIPO DE USO(14)
function mapAsignacionToRow(d) {
  return [
    d.campana            || '',
    d.req                || '',
    d.sala               || '',
    d.sede               || '',
    d.formador           || '',
    d.fechaInicial       || '',
    d.fechaFin           || '',
    d.horario            || '',
    d.dPersonas          || '',
    d.estadoAsignacion   || 'PENDIENTE',
    d.ticket             || '',
    d.estadoTicket       || '',
    d.coordinador        || '',
    d.tipoDeUso          || ''
  ];
}

function normalizeText(value) {
  return String(value || '').trim().toUpperCase();
}

function parseAsignacionDate(raw) {
  if (!raw) return null;

  if (raw instanceof Date) {
    var fromDate = new Date(raw.getTime());
    fromDate.setHours(0, 0, 0, 0);
    return fromDate;
  }

  var text = String(raw).trim();
  if (!text) return null;

  var gs = text.match(/Date\((\d{4}),(\d+),(\d+)\)/);
  if (gs) {
    var fromGs = new Date(+gs[1], +gs[2], +gs[3]);
    fromGs.setHours(0, 0, 0, 0);
    return fromGs;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    var iso = new Date(text + 'T00:00:00');
    if (!isNaN(iso.getTime())) {
      iso.setHours(0, 0, 0, 0);
      return iso;
    }
  }

  var dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    var fromDmy = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
    fromDmy.setHours(0, 0, 0, 0);
    return fromDmy;
  }

  var ymd = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) {
    var fromYmd = new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
    fromYmd.setHours(0, 0, 0, 0);
    return fromYmd;
  }

  var fallback = new Date(text);
  if (isNaN(fallback.getTime())) return null;
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

function datesOverlap(s1, e1, s2, e2) {
  return s1 <= e2 && s2 <= e1;
}

function validateAsignacion(data) {
  var start = parseAsignacionDate(data.fechaInicial);
  var end = parseAsignacionDate(data.fechaFin);
  if (!normalizeText(data.sala) || !normalizeText(data.horario) ||
      !start || !end || start > end) {
    throw new Error('Sala, horario o rango de fechas inválidos.');
  }
  if (['PENDIENTE', 'APROBADO', 'RECHAZADO'].indexOf(data.estadoAsignacion || 'PENDIENTE') === -1) {
    throw new Error('Estado de asignación inválido.');
  }
}

function findAsignacionConflict(doc, data, excludeRowIndex) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet || sheet.getLastRow() < 2) return null;

  var sala = normalizeText(data.sala);
  var horario = normalizeText(data.horario);
  var newStart = parseAsignacionDate(data.fechaInicial);
  var newEnd = parseAsignacionDate(data.fechaFin);
  if (!sala || !horario || !newStart || !newEnd) return null;

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  for (var i = 0; i < rows.length; i++) {
    var rowIndex = i + 2;
    if (excludeRowIndex && rowIndex === excludeRowIndex) continue;

    var estado = normalizeText(rows[i][9]);
    if (estado === 'RECHAZADO') continue;

    if (normalizeText(rows[i][2]) !== sala) continue;
    if (normalizeText(rows[i][7]) !== horario) continue;

    var existStart = parseAsignacionDate(rows[i][5]);
    var existEnd = parseAsignacionDate(rows[i][6]);
    if (!existStart || !existEnd) continue;

    if (datesOverlap(newStart, newEnd, existStart, existEnd)) {
      return {
        rowIndex: rowIndex,
        campana: String(rows[i][0] || '').trim(),
        sala: String(rows[i][2] || '').trim(),
        horario: String(rows[i][7] || '').trim(),
        estado: String(rows[i][9] || '').trim() || 'PENDIENTE'
      };
    }
  }

  return null;
}

function handleCreateAsignacion(doc, data, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  validateAsignacion(data);

  var conflicto = findAsignacionConflict(doc, data, null);
  if (conflicto) {
    logToDebug(debugSheet, "Conflicto asignacion: sala " + conflicto.sala + " / horario " + conflicto.horario + " / estado " + conflicto.estado + " / fila " + conflicto.rowIndex);
    return createErrorResponse("Sala no disponible en el rango seleccionado");
  }

  var row = mapAsignacionToRow(data);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Asignacion creada: " + data.campana + " | Estado: " + (data.estadoAsignacion || 'PENDIENTE'));
  return createSuccessResponse({ action: "createAsignacion" });
}

function handleUpdateAsignacion(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  payload.rowIndex = requireSalasDataRow(sheet, payload.rowIndex);
  validateAsignacion(payload.data);

  var conflicto = findAsignacionConflict(doc, payload.data || {}, payload.rowIndex);
  if (conflicto) {
    logToDebug(debugSheet, "Conflicto update asignacion: sala " + conflicto.sala + " / horario " + conflicto.horario + " / estado " + conflicto.estado + " / fila " + conflicto.rowIndex);
    return createErrorResponse("Sala no disponible en el rango seleccionado");
  }

  var row = mapAsignacionToRow(payload.data);
  sheet.getRange(payload.rowIndex, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Asignacion actualizada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "updateAsignacion" });
}

function handleDeleteAsignacion(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  payload.rowIndex = requireSalasDataRow(sheet, payload.rowIndex);
  sheet.deleteRow(payload.rowIndex);
  logToDebug(debugSheet, "Asignacion eliminada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "deleteAsignacion" });
}

// Actualiza solo la columna J (ESTADO ASIGNACION SALA)
function handleUpdateEstadoAsignacion(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  var rowIndex = requireSalasDataRow(sheet, payload.rowIndex);
  var estado   = payload.estado;
  if (estado !== 'APROBADO' && estado !== 'RECHAZADO') return createErrorResponse("Estado inválido.");
  if (estado === 'APROBADO') {
    var existing = sheet.getRange(rowIndex, 1, 1, 14).getValues()[0];
    var data = {
      sala: existing[2], horario: existing[7],
      fechaInicial: existing[5], fechaFin: existing[6], estadoAsignacion: estado
    };
    validateAsignacion(data);
    if (findAsignacionConflict(doc, data, rowIndex)) {
      return createErrorResponse('Sala no disponible en el rango seleccionado');
    }
  }

  sheet.getRange(rowIndex, 10).setValue(estado); // Columna J = 10
  logToDebug(debugSheet, "Estado asignacion fila " + rowIndex + " → " + estado);
  return createSuccessResponse({ action: "updateEstadoAsignacion", estado: estado });
}

// ─── ASIGNACION_TICKET CRUD ───────────────────────────────────────────────────
// Columnas: CAMPAÑA(1) POSICION(2) FALLA PUNTUAL(3) PERSONA REPORTA(4)
//           NUMERO TICKET(5) FECHA REALIZACION(6) PERSONA CREA TICKET(7)
//           FECHA CIERRE(8) OBSERVACIONES(9) RESPUESTA(10) SALA(11) SEDE(12)
function mapTicketToRow(d) {
  return [
    d.campana            || '',
    d.posicion           || '',
    d.fallaPuntual       || '',
    d.personaReporta     || '',
    d.numeroTicket       || '',
    d.fechaRealizacion   || '',
    d.personaCreaTicket  || '',
    d.fechaCierre        || '',
    d.observaciones      || '',
    d.respuesta          || '',
    d.sala               || '',
    d.sede               || ''
  ];
}

/** Busca la fila del ticket por número (col E) — más confiable que rowIndex del frontend */
function findTicketRowByNumber(sheet, numeroTicket) {
  if (!sheet || !numeroTicket) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var values = sheet.getRange(2, 5, lastRow - 1, 1).getValues(); // col E
  var target = String(numeroTicket).trim();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === target) return i + 2;
  }
  return null;
}

function generateTicketNumber() {
  var doc   = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("ASIGNACION_TICKET");
  var count = sheet ? Math.max(sheet.getLastRow() - 1, 0) + 1 : 1;
  var num   = String(count);
  while (num.length < 4) { num = '0' + num; }
  return "TKT-" + num;
}

function handleCreateTicket(doc, data, debugSheet) {
  var sheet = doc.getSheetByName("ASIGNACION_TICKET");
  if (!sheet) return createErrorResponse("Sheet ASIGNACION_TICKET not found");
  var asigSheet;
  if (data.rowIndexAsignacion !== undefined) {
    asigSheet = doc.getSheetByName("SALAS_ASIGNACIONES");
    if (!asigSheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
    data.rowIndexAsignacion = requireSalasDataRow(asigSheet, data.rowIndexAsignacion);
  }

  // Generar número de ticket automático si no viene
  data.numeroTicket = data.numeroTicket || generateTicketNumber();
  data.fechaRealizacion = data.fechaRealizacion || Utilities.formatDate(new Date(), doc.getSpreadsheetTimeZone(), "yyyy-MM-dd");

  var row = mapTicketToRow(data);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

  // Actualizar columna K (TICKET) en SALAS_ASIGNACIONES si viene rowIndexAsignacion
  if (asigSheet) {
    asigSheet.getRange(data.rowIndexAsignacion, 11).setValue(data.numeroTicket); // Col K
    asigSheet.getRange(data.rowIndexAsignacion, 12).setValue("ABIERTO");          // Col L
  }

  logToDebug(debugSheet, "Ticket creado: " + data.numeroTicket + " para campaña: " + data.campana);
  return createSuccessResponse({ action: "createTicket", numeroTicket: data.numeroTicket });
}

function handleUpdateTicket(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("ASIGNACION_TICKET");
  if (!sheet) return createErrorResponse("Sheet ASIGNACION_TICKET not found");
  var rowIndex = payload.rowIndex;
  var numeroTicket = (payload.data && payload.data.numeroTicket) || payload.numeroTicket || '';
  var found = findTicketRowByNumber(sheet, numeroTicket);
  if (found) rowIndex = found;
  rowIndex = requireSalasDataRow(sheet, rowIndex);
  var row = mapTicketToRow(payload.data);
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  logToDebug(debugSheet, "Ticket actualizado fila: " + rowIndex + " ticket: " + numeroTicket);
  return createSuccessResponse({ action: "updateTicket" });
}

// ─── Responder ticket (admin) ─────────────────────────────────────────────────
// Solo escribe la respuesta en col J. No toca fechaCierre (col H).
function handleRespondTicket(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("ASIGNACION_TICKET");
  if (!sheet) return createErrorResponse("Sheet ASIGNACION_TICKET not found");
  var rowIndex  = payload.rowIndex;
  var respuesta = payload.respuesta || '';
  var found = findTicketRowByNumber(sheet, payload.numeroTicket);
  if (found) rowIndex = found;
  rowIndex = requireSalasDataRow(sheet, rowIndex);

  sheet.getRange(rowIndex, 10).setValue(respuesta);  // Col J: RESPUESTA

  logToDebug(debugSheet, "Ticket respondido fila: " + rowIndex);
  return createSuccessResponse({ action: "respondTicket" });
}

function handleCloseTicket(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("ASIGNACION_TICKET");
  if (!sheet) return createErrorResponse("Sheet ASIGNACION_TICKET not found");
  var rowIndex  = requireSalasDataRow(sheet, payload.rowIndex);
  var asigSheet;
  if (payload.rowIndexAsignacion !== undefined) {
    asigSheet = doc.getSheetByName("SALAS_ASIGNACIONES");
    if (!asigSheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
    payload.rowIndexAsignacion = requireSalasDataRow(asigSheet, payload.rowIndexAsignacion);
  }
  var respuesta = payload.respuesta || '';
  var fechaCierre = Utilities.formatDate(new Date(), doc.getSpreadsheetTimeZone(), "yyyy-MM-dd");

  sheet.getRange(rowIndex, 8).setValue(fechaCierre);  // Col H: FECHA CIERRE
  sheet.getRange(rowIndex, 10).setValue(respuesta);    // Col J: RESPUESTA

  // Actualizar estadoTicket en SALAS_ASIGNACIONES si aplica
  if (asigSheet) {
    asigSheet.getRange(payload.rowIndexAsignacion, 12).setValue("CERRADO"); // Col L
  }

  logToDebug(debugSheet, "Ticket cerrado fila: " + rowIndex);
  return createSuccessResponse({ action: "closeTicket" });
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

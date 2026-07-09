// ─── SALAS — Google Apps Script ──────────────────────────────────────────────
// Pega este código en el Apps Script del spreadsheet "Salas 2026"
// Hojas requeridas: SALAS_CATALOGO, SALAS_ASIGNACIONES, SALAS_ADMINS, ASIGNACION_TICKET

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

    // ── Salas ────────────────────────────────────────────────────────────────
    if (action === 'createSala') {
      return handleCreateSala(doc, payload.data || payload, debugSheet);
    } else if (action === 'updateSala') {
      return handleUpdateSala(doc, payload, debugSheet);
    } else if (action === 'deleteSala') {
      return handleDeleteSala(doc, payload, debugSheet);

    // ── Asignaciones ─────────────────────────────────────────────────────────
    } else if (action === 'createAsignacion') {
      return handleCreateAsignacion(doc, payload.data || payload, debugSheet);
    } else if (action === 'updateAsignacion') {
      return handleUpdateAsignacion(doc, payload, debugSheet);
    } else if (action === 'deleteAsignacion') {
      return handleDeleteAsignacion(doc, payload, debugSheet);
    } else if (action === 'updateEstadoAsignacion') {
      return handleUpdateEstadoAsignacion(doc, payload, debugSheet);

    // ── Tickets ───────────────────────────────────────────────────────────────
    } else if (action === 'createTicket') {
      return handleCreateTicket(doc, payload.data || payload, debugSheet);
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
  sheet.deleteRow(payload.rowIndex);
  logToDebug(debugSheet, "Asignacion eliminada fila: " + payload.rowIndex);
  return createSuccessResponse({ action: "deleteAsignacion" });
}

// Actualiza solo la columna J (ESTADO ASIGNACION SALA)
function handleUpdateEstadoAsignacion(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("SALAS_ASIGNACIONES");
  if (!sheet) return createErrorResponse("Sheet SALAS_ASIGNACIONES not found");
  var rowIndex = payload.rowIndex;
  var estado   = payload.estado;
  if (!rowIndex || !estado) return createErrorResponse("Missing rowIndex or estado");

  sheet.getRange(rowIndex, 10).setValue(estado); // Columna J = 10
  logToDebug(debugSheet, "Estado asignacion fila " + rowIndex + " → " + estado);
  return createSuccessResponse({ action: "updateEstadoAsignacion", estado: estado });
}

// ─── ASIGNACION_TICKET CRUD ───────────────────────────────────────────────────
// Columnas: CAMPAÑA(1) POSICION(2) FALLA PUNTUAL(3) PERSONA REPORTA(4)
//           NUMERO TICKET(5) FECHA REALIZACION(6) PERSONA CREA TICKET(7)
//           FECHA CIERRE(8) OBSERVACIONES(9) RESPUESTA(10)
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
    d.respuesta          || ''
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

  // Generar número de ticket automático si no viene
  data.numeroTicket = data.numeroTicket || generateTicketNumber();
  data.fechaRealizacion = data.fechaRealizacion || Utilities.formatDate(new Date(), doc.getSpreadsheetTimeZone(), "yyyy-MM-dd");

  var row = mapTicketToRow(data);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

  // Actualizar columna K (TICKET) en SALAS_ASIGNACIONES si viene rowIndexAsignacion
  if (data.rowIndexAsignacion) {
    var asigSheet = doc.getSheetByName("SALAS_ASIGNACIONES");
    if (asigSheet) {
      asigSheet.getRange(data.rowIndexAsignacion, 11).setValue(data.numeroTicket); // Col K
      asigSheet.getRange(data.rowIndexAsignacion, 12).setValue("ABIERTO");          // Col L
    }
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
  if (!rowIndex) return createErrorResponse("rowIndex requerido");
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
  if (!rowIndex) return createErrorResponse("rowIndex requerido");

  sheet.getRange(rowIndex, 10).setValue(respuesta);  // Col J: RESPUESTA

  logToDebug(debugSheet, "Ticket respondido fila: " + rowIndex);
  return createSuccessResponse({ action: "respondTicket" });
}

function handleCloseTicket(doc, payload, debugSheet) {
  var sheet = doc.getSheetByName("ASIGNACION_TICKET");
  if (!sheet) return createErrorResponse("Sheet ASIGNACION_TICKET not found");
  var rowIndex  = payload.rowIndex;
  var respuesta = payload.respuesta || '';
  var fechaCierre = Utilities.formatDate(new Date(), doc.getSpreadsheetTimeZone(), "yyyy-MM-dd");

  sheet.getRange(rowIndex, 8).setValue(fechaCierre);  // Col H: FECHA CIERRE
  sheet.getRange(rowIndex, 10).setValue(respuesta);    // Col J: RESPUESTA

  // Actualizar estadoTicket en SALAS_ASIGNACIONES si aplica
  if (payload.rowIndexAsignacion) {
    var asigSheet = doc.getSheetByName("SALAS_ASIGNACIONES");
    if (asigSheet) {
      asigSheet.getRange(payload.rowIndexAsignacion, 12).setValue("CERRADO"); // Col L
    }
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

// ─── AgileTRaining — academy Google Apps Script ──────────────────────────────────────────────
function handleGetAgileData() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("dataagile");

  if (!sheet) {
    return createErrorResponse("Sheet not found: dataagile");
  }

  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow <= 1 || lastColumn === 0) {
    return createSuccessResponse({ rows: [] });
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  return createSuccessResponse({ rows: values });
}

function handleGetAcademyData(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = e && e.parameter ? e.parameter.sheet : "";

  if (sheetName !== "formacionInicial" && sheetName !== "formacionContinua") {
    return createErrorResponse("Invalid sheet");
  }

  var sheet = doc.getSheetByName(sheetName);

  if (!sheet) {
    return createErrorResponse("Sheet not found: " + sheetName);
  }

  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow <= 1 || lastColumn === 0) {
    return createSuccessResponse({ rows: [] });
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  return createSuccessResponse({ rows: values });
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";

  if (action === "getConfig") {
    return handleGetConfig();
  }

  if (action === "getAgileData") {
    return handleGetAgileData();
  }

  if (action === "getAcademyData") {
    return handleGetAcademyData(e);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "agiletrainig";

  try {
    if (!e || !e.postData) {
      return createErrorResponse("No postData");
    }

    var payload = JSON.parse(e.postData.contents || "{}");
    var action = payload.action || "create";
    var sheet = doc.getSheetByName(sheetName);

    if (!sheet) {
      return createErrorResponse("Sheet not found: " + sheetName);
    }

    if (action === "create") {
      return handleCreate(sheet, payload.data || payload);
    }

    if (action === "update") {
      return handleUpdate(sheet, payload.rowIndex, payload.data);
    }

    if (action === "delete") {
      return handleDelete(sheet, payload.rowIndex);
    }

    if (action === "saveConfig") {
      return handleSaveConfig(doc, payload.configData);
    }

    return createErrorResponse("Invalid action");
  } catch (error) {
    return createErrorResponse(String(error));
  } finally {
    lock.releaseLock();
  }
}

function handleCreate(sheet, data) {
  var records = Array.isArray(data) ? data : [data];
  var rows = records.map(mapRecordToRow);

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return createSuccessResponse({ action: "create", rows: rows.length });
}

function handleUpdate(sheet, rowIndex, data) {
  if (!rowIndex || !data) {
    return createErrorResponse("Missing rowIndex or data");
  }

  var row = mapRecordToRow(data);
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);

  return createSuccessResponse({ action: "update", rowIndex: rowIndex });
}

function handleDelete(sheet, rowIndex) {
  if (!rowIndex) {
    return createErrorResponse("Missing rowIndex");
  }

  sheet.deleteRow(rowIndex);
  return createSuccessResponse({ action: "delete", rowIndex: rowIndex });
}

function handleSaveConfig(doc, configData) {
  var sheetName = "AGILE_TRAINING_CONFIG";
  var sheet = doc.getSheetByName(sheetName);

  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }

  sheet.clearContents();

  if (configData && configData.length > 0) {
    sheet.getRange(1, 1, configData.length, configData[0].length).setValues(configData);
  }

  return createSuccessResponse({ action: "saveConfig" });
}

function handleGetConfig() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("AGILE_TRAINING_CONFIG");

  if (!sheet || sheet.getLastRow() === 0) {
    return createSuccessResponse({ config: {} });
  }

  var data = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
  var config = {};

  for (var i = 0; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];

    if (key !== "" && key != null) {
      config[String(key)] = val != null ? String(val) : "";
    }
  }

  return createSuccessResponse({ config: config });
}

function mapRecordToRow(record) {
  return [
    record.campana || "",
    record.coordinador || "",
    record.industria || "",
    record.especializacionFormadores || "",
    record.formadorDeFormadores || "",
    record.ced || "",
    record.uAtento || "",
    record.redefinicionMallaFormacion || "",
    record.tipologiasParetoKpi || "",
    record.encuestaAsesor || "",
    record.mejoraEncuestaPostTraining || "",
    record.levantamientosCliente || "",
    record.migracionMalla || "",
    record.desarrolloDigital || "",
    record.herramientasDiferenciales || "",
    record.metodologiasObjetivos || "",
    record.avance || "",
    record.piloto || "",
    record.pptLanzamiento || "",
    record.graduacionOjt || "",
    record.resultados || "",
    record.fechaInicio || "",
    record.fechaFin || "",
    record.duracion || "",
    record.meta || "",
    record.cumplimiento || "",
    record.insignia || "",
    record.estado || "",
    record.notas || "",
    record.jefeDeNegocio || "",
    record.gerencia || ""
  ];
}

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
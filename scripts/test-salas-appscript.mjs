import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const secret = 'test-only-shared-training-secret';
let configuredSecret = secret;
let lockAvailable = true;
let releases = 0;
let writes = 0;
const sheets = new Map();
function sheet(name, values) {
  const result = {
    values,
    getLastRow: () => values.length,
    getRange: (row, column, count = 1, width = 1) => ({
      getValues: () => Array.from({ length: count }, (_, i) =>
        Array.from({ length: width }, (_, j) => values[row - 1 + i]?.[column - 1 + j] ?? '')),
      getDisplayValues: () => Array.from({ length: count }, (_, i) =>
        Array.from({ length: width }, (_, j) => String(values[row - 1 + i]?.[column - 1 + j] ?? ''))),
      setValues: rows => {
        for (const [i, data] of rows.entries()) {
          values[row - 1 + i] ??= [];
          for (const [j, value] of data.entries()) values[row - 1 + i][column - 1 + j] = value;
        }
        writes++;
      },
      setValue: value => {
        values[row - 1] ??= [];
        values[row - 1][column - 1] = value;
        writes++;
      },
    }),
    deleteRow: row => { values.splice(row - 1, 1); writes++; },
    appendRow: data => { values.push(data); },
  };
  sheets.set(name, result);
  return result;
}
const jenny = 'JENNY CAROLINA PINZON FERNANDEZ';
const sebastian = 'SEBASTIAN SANTOS POLANIA';
sheet('SALAS_ADMINS', [
  ['Documento', 'Nombre', 'Cargo'],
  ['52829724', 'DIANA MARITZA PEDREROS CUERVO', 'Analista'],
  ['1020808847', jenny, 'Coordinador'],
  ['1018509964', sebastian, 'Analista'],
]);
sheet('SALAS_CATALOGO', [['Sede', 'Sala'], ['Principal', 'A']]);
const asignaciones = sheet('SALAS_ASIGNACIONES', [
  ['Campaña', 'REQ', 'Sala', 'Sede', 'Formador', 'Fecha inicial', 'Fecha final', 'Horario'],
  ['Campaña A', '', 'A', 'Principal', '', '2026-01-01', '2026-01-03', 'AM', 5, 'APROBADO', '', '', jenny, ''],
  ['Campaña B', '', 'B', 'Principal', '', '2026-01-01', '2026-01-03', 'AM', 5, 'APROBADO', '', '', sebastian, ''],
]);
const tickets = sheet('ASIGNACION_TICKET', [
  ['Campaña', 'Posicion', 'Falla', 'Reporta', 'Ticket'],
  ['Campaña A', '', 'Falla', jenny, 'TKT-0001'],
  ['Campaña B', '', 'Falla', sebastian, 'TKT-0002'],
]);
const doc = {
  getSheetByName: name => sheets.get(name),
  getSpreadsheetTimeZone: () => 'America/Bogota',
  insertSheet: name => sheet(name, []),
};
const utilities = {
  Charset: { UTF_8: 'utf8' },
  base64EncodeWebSafe: value => Buffer.from(value).toString('base64url'),
  base64DecodeWebSafe: value => Buffer.from(value, 'base64url'),
  computeHmacSha256Signature: (body, key) => createHmac('sha256', key).update(body).digest(),
  newBlob: value => ({ getDataAsString: () => Buffer.from(value).toString('utf8') }),
  formatDate: (date, timezone) => {
    assert.equal(timezone, 'America/Bogota');
    return '2026-01-01';
  },
};
const properties = { getScriptProperties: () => ({ getProperty: () => configuredSecret }) };
const context = vm.createContext({
  Date,
  Utilities: utilities,
  PropertiesService: properties,
  SpreadsheetApp: { getActiveSpreadsheet: () => doc },
  LockService: { getScriptLock: () => ({
    tryLock: () => lockAvailable,
    releaseLock: () => { releases++; },
  }) },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }),
  },
});
vm.runInContext(readFileSync(new URL('../appscriptSalas.gs', import.meta.url), 'utf8'), context);
const login = vm.createContext({ Utilities: utilities, PropertiesService: properties });
vm.runInContext(readFileSync(new URL('../appscriptSheets.gs', import.meta.url), 'utf8'), login);
const managerToken = login.createTrainingToken('52829724');
const coordinatorToken = login.createTrainingToken('1020808847');
const otherAdminToken = login.createTrainingToken('1018509964');
const post = payload => context.doPost({ postData: { contents: JSON.stringify(payload) } });
const manager = payload => post({ ...payload, sessionToken: managerToken });
const coordinator = payload => post({ ...payload, sessionToken: coordinatorToken });
assert.equal(context.doGet({ parameter: {} }).version, 'restricted-salas-v1');
assert.equal(context.doGet({ parameter: { action: 'getSalasAdmins' } }).result, 'error');
const actions = ['readSheet', 'getSalasAdmins', 'createSala', 'updateSala', 'deleteSala', 'createAsignacion',
  'updateAsignacion', 'deleteAsignacion', 'updateEstadoAsignacion', 'createTicket', 'updateTicket', 'respondTicket', 'closeTicket'];
for (const action of actions) {
  for (const sessionToken of [undefined, 'fake', `${managerToken}tampered`, login.signSessionToken('52829724', 'salas', secret)]) {
    const before = writes;
    assert.equal(post({ action, sessionToken, salasToken: managerToken }).result, 'error');
    assert.equal(writes, before);
  }
}
assert.equal(sheets.has('SystemLogs_Salas'), false); // Las consultas rechazadas no crean logs.
for (const name of ['SALAS_CATALOGO', 'SALAS_ASIGNACIONES', 'ASIGNACION_TICKET']) {
  assert.equal(coordinator({ action: 'readSheet', sheet: name }).result, 'success');
}
for (const name of ['ingresoAdmin', 'SystemLogs_Salas', '__proto__', 'constructor', 'SALAS_ADMINS']) {
  assert.equal(coordinator({ action: 'readSheet', sheet: name }).result, 'error');
}
assert.equal(manager({ action: 'readSheet', sheet: 'SALAS_ADMINS' }).result, 'success');
assert.equal(coordinator({ action: 'getSalasAdmins' }).result, 'error');
assert.equal(manager({ action: 'getSalasAdmins' }).admins.length, 3);
const reads = coordinator({ action: 'readSheet', sheet: 'SALAS_ASIGNACIONES' });
assert.deepEqual(reads.rowIndices, [2, 3]);
assert.equal(reads.rows[0][5], '2026-01-01');
const managerActions = ['createSala', 'updateSala', 'deleteSala', 'updateAsignacion',
  'deleteAsignacion', 'updateEstadoAsignacion', 'updateTicket', 'respondTicket'];
for (const action of managerActions) {
  const before = writes;
  assert.equal(post({
    action, sessionToken: otherAdminToken, documento: '52829724', rol: 'SUPER_ADMIN', rowIndex: 2, data: {},
  }).result, 'error');
  assert.equal(writes, before);
}
const request = {
  sala: 'A', horario: 'AM', fechaInicial: '2026-01-10', fechaFin: '2026-01-11',
  campana: 'Solicitud', estadoAsignacion: 'PENDIENTE', coordinador: 'Suplantado', ticket: 'FAKE',
};
assert.equal(coordinator({ action: 'createAsignacion', data: request }).result, 'success');
assert.equal(asignaciones.values.at(-1)[12], jenny);
assert.equal(asignaciones.values.at(-1)[9], 'PENDIENTE');
assert.equal(asignaciones.values.at(-1)[10], '');
assert.equal(coordinator({ action: 'createAsignacion', data: { ...request, estadoAsignacion: 'APROBADO' } }).result, 'error');
assert.equal(coordinator({ action: 'createAsignacion', data: { ...request, fechaInicial: 'bad' } }).result, 'error');
assert.equal(coordinator({ action: 'createAsignacion', data: { ...request, fechaInicial: '2026-01-12' } }).result, 'error');
assert.equal(coordinator({ action: 'createAsignacion', data: request }).result, 'error'); // Conflicto.
assert.equal(manager({ action: 'updateEstadoAsignacion', rowIndex: 4, estado: 'APROBADO' }).result, 'success');
assert.equal(manager({ action: 'updateEstadoAsignacion', rowIndex: 4, estado: 'RECHAZADO' }).result, 'success');
assert.equal(manager({ action: 'updateEstadoAsignacion', rowIndex: 4, estado: 'INVALIDO' }).result, 'error');
assert.equal(manager({ action: 'createAsignacion', data: { ...request, estadoAsignacion: 'APROBADO' } }).result, 'success');
const beforeConflict = writes;
assert.equal(manager({ action: 'updateEstadoAsignacion', rowIndex: 4, estado: 'APROBADO' }).result, 'error');
assert.equal(writes, beforeConflict);
assert.equal(coordinator({ action: 'closeTicket', rowIndex: 3 }).result, 'error');
assert.equal(coordinator({ action: 'closeTicket', rowIndex: 2, respuesta: 'Solucionado' }).result, 'success');
assert.equal(tickets.values[1][7], '2026-01-01');
assert.equal(coordinator({ action: 'createTicket', data: {
  campana: 'Campaña', personaReporta: 'Suplantado', respuesta: 'Falsa respuesta', fechaCierre: '2000-01-01', rowIndexAsignacion: 2,
} }).result, 'success');
assert.equal(tickets.values.at(-1)[3], jenny);
assert.equal(tickets.values.at(-1)[7], '');
assert.equal(tickets.values.at(-1)[9], '');
assert.equal(coordinator({ action: 'createTicket', data: { rowIndexAsignacion: 3 } }).result, 'error');
assert.equal(coordinator({ action: 'closeTicket', rowIndex: 2, rowIndexAsignacion: 3 }).result, 'error');
assert.equal(manager({ action: 'respondTicket', rowIndex: 3, respuesta: 'Respuesta Diana' }).result, 'success');
assert.equal(tickets.values[2][9], 'Respuesta Diana');
assert.equal(manager({ action: 'createSala', data: { sede: 'Principal', sala: 'Nueva' } }).result, 'success');
assert.equal(manager({ action: 'updateSala', rowIndex: 3, data: { sala: 'Editada' } }).result, 'success');
assert.equal(manager({ action: 'deleteSala', rowIndex: 3 }).result, 'success');
for (const rowIndex of [0, 1, -1, 2.5, 999, 'bad']) {
  const before = writes;
  assert.equal(manager({ action: 'deleteSala', rowIndex }).result, 'error');
  assert.equal(manager({ action: 'closeTicket', rowIndex }).result, 'error');
  assert.equal(writes, before);
}
const beforeInvalidLink = writes;
assert.equal(manager({ action: 'createTicket', data: { rowIndexAsignacion: 1 } }).result, 'error');
assert.equal(manager({ action: 'closeTicket', rowIndex: 2, rowIndexAsignacion: 999 }).result, 'error');
assert.equal(writes, beforeInvalidLink);
assert.equal(post({ action: 'createAsignacion', sessionToken: login.createTrainingToken('unknown'), data: request }).result, 'error');
assert.equal(post(null).result, 'error');
assert.equal(post({ action: 'unknown' }).result, 'error');
assert.equal(context.doPost({ postData: { contents: '{bad' } }).result, 'error');
const claims = { documento: '52829724', audience: 'training', expiresAt: Date.now() - 1000 };
const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
const expired = `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
assert.equal(post({ action: 'readSheet', sheet: 'SALAS_CATALOGO', sessionToken: expired }).result, 'error');
configuredSecret = 'wrong-secret';
assert.equal(manager({ action: 'readSheet', sheet: 'SALAS_CATALOGO' }).result, 'error');
configuredSecret = null;
assert.match(manager({ action: 'readSheet', sheet: 'SALAS_CATALOGO' }).error, /Falta configurar/);
configuredSecret = secret;
lockAvailable = false;
const beforeLock = releases;
assert.equal(manager({ action: 'deleteSala', rowIndex: 2 }).result, 'error');
assert.equal(releases, beforeLock);
assert.equal(manager({ action: 'readSheet', sheet: 'SALAS_CATALOGO' }).result, 'success');
console.log('OK: Salas privado, sesión común, gestión exclusiva de Diana, solicitudes y tickets propios, conflictos y filas protegidas.');

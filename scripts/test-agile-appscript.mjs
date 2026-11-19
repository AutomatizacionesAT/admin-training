import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const secret = 'test-only-shared-login-secret';
let configuredSecret = secret;
let writes = 0;
let releases = 0;
let lockAvailable = true;
const sheets = new Map();
function sheet(values) {
  return {
    getLastRow: () => values.length,
    getLastColumn: () => values[0]?.length ?? 0,
    getRange: (row, column, count, width) => ({
      getValues: () => values.slice(row - 1, row - 1 + count).map(value => value.slice(column - 1, column - 1 + width)),
      getDisplayValues: () => values.slice(row - 1, row - 1 + count).map(value => value.slice(column - 1, column - 1 + width).map(String)),
      setValues: () => { writes++; },
    }),
    clearContents: () => { writes++; },
    deleteRow: () => { writes++; },
  };
}
for (const name of ['dataagile', 'agiletrainig', 'formacionInicial', 'formacionContinua']) {
  sheets.set(name, sheet([['Campaña', 'Fecha'], ['Campaña A', new Date('2026-04-01T00:00:00Z')], ['', ''], ['Campaña B', 0]]));
}
sheets.set('AGILE_TRAINING_CONFIG', sheet([['meta', 0]]));
const doc = {
  getSheetByName: name => sheets.get(name),
  getSpreadsheetTimeZone: () => 'America/Bogota',
  insertSheet: name => {
    const result = sheet([]);
    sheets.set(name, result);
    return result;
  },
};
const utilities = {
  Charset: { UTF_8: 'utf8' },
  base64EncodeWebSafe: value => Buffer.from(value).toString('base64url'),
  base64DecodeWebSafe: value => Buffer.from(value, 'base64url'),
  computeHmacSha256Signature: (body, key) => createHmac('sha256', key).update(body).digest(),
  newBlob: value => ({ getDataAsString: () => Buffer.from(value).toString('utf8') }),
  formatDate: (date, timezone) => {
    assert.equal(timezone, 'America/Bogota');
    return '2026-03-31T19:00:00';
  },
};
const properties = { getScriptProperties: () => ({ getProperty: () => configuredSecret }) };
const context = vm.createContext({
  Date,
  Utilities: utilities,
  PropertiesService: properties,
  SpreadsheetApp: { getActiveSpreadsheet: () => doc },
  LockService: { getScriptLock: () => ({
    tryLock: () => lockAvailable, releaseLock: () => { releases++; },
  }) },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }),
  },
});
vm.runInContext(readFileSync(new URL('../appscriptAgileTraining.gs', import.meta.url), 'utf8'), context);
// Usar el emisor REAL del proyecto de login para comprobar interoperabilidad.
const login = vm.createContext({ Utilities: utilities, PropertiesService: properties });
vm.runInContext(readFileSync(new URL('../appscriptSheets.gs', import.meta.url), 'utf8'), login);
const adminToken = login.createTrainingToken('52829724');
const coordinatorToken = login.createTrainingToken('1032430434');
const expired = login.signSessionToken('52829724', 'training', secret);
const post = payload => context.doPost({ postData: { contents: JSON.stringify(payload) } });

assert.equal(context.doGet({ parameter: {} }).version, 'restricted-agile-v1');
for (const action of ['getAgileData', 'getAcademyData', 'getConfig']) {
  assert.equal(context.doGet({ parameter: { action } }).result, 'error');
}
const actions = ['getAgileData', 'getAcademyData', 'getConfig', 'create', 'update', 'delete', 'saveConfig'];
for (const action of actions) {
  for (const token of [undefined, 'fake', `${adminToken}tampered`, login.signSessionToken('52829724', 'salas', secret)]) {
    const before = writes;
    assert.equal(post({ action, sessionToken: token }).result, 'error');
    assert.equal(writes, before);
  }
}
const read = post({ action: 'getAgileData', sessionToken: coordinatorToken });
assert.equal(read.result, 'success');
assert.equal(read.rows[0][1], '2026-03-31T19:00:00');
assert.deepEqual(read.rowIndices, [2, 3, 4]);
assert.deepEqual(read.rows[1], ['', '']);
for (const name of ['formacionInicial', 'formacionContinua']) {
  assert.equal(post({ action: 'getAcademyData', sheet: name, sessionToken: coordinatorToken }).result, 'success');
}
for (const name of ['ingresoAdmin', 'dataagile', '__proto__', 'SystemLogs']) {
  assert.equal(post({ action: 'getAcademyData', sheet: name, sessionToken: adminToken }).result, 'error');
}
assert.equal(post({ action: 'getConfig', sessionToken: coordinatorToken }).config.meta, '0');
for (const action of ['create', 'update', 'delete', 'saveConfig']) {
  assert.equal(post({ action, sessionToken: coordinatorToken, documento: '52829724', rol: 'SUPER_ADMIN' }).result, 'error');
}
assert.equal(post({ action: 'create', sessionToken: adminToken, data: { campana: 'Nueva', meta: 0 } }).result, 'success');
assert.equal(post({ action: 'update', sessionToken: adminToken, rowIndex: 2, data: {} }).result, 'success');
assert.equal(post({ action: 'delete', sessionToken: adminToken, rowIndex: 2 }).result, 'success');
assert.equal(post({ action: 'saveConfig', sessionToken: adminToken, configData: [['meta', 0]] }).result, 'success');
assert.equal(context.mapRecordToRow({ meta: 0, piloto: false })[24], 0);
assert.equal(context.mapRecordToRow({ piloto: false })[17], false);
for (const rowIndex of [0, 1, -1, 2.5, 999, 'bad']) {
  assert.equal(post({ action: 'delete', sessionToken: adminToken, rowIndex }).result, 'error');
  assert.equal(post({ action: 'update', sessionToken: adminToken, rowIndex, data: {} }).result, 'error');
}
const beforeInvalid = writes;
for (const data of [undefined, null, [], [null], 'bad']) {
  assert.equal(post({ action: 'create', sessionToken: adminToken, data }).result, 'error');
}
assert.equal(post({ action: 'saveConfig', sessionToken: adminToken, configData: [['bad']] }).result, 'error');
assert.equal(post({ data: {} }).result, 'error');
assert.equal(post({ action: 'unknown' }).result, 'error');
assert.equal(post(null).result, 'error');
assert.equal(context.doPost({ postData: { contents: '{invalid' } }).result, 'error');
assert.equal(writes, beforeInvalid);

const [body] = expired.split('.');
const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
claims.expiresAt = Date.now() - 1000;
const expiredBody = Buffer.from(JSON.stringify(claims)).toString('base64url');
const expiredToken = `${expiredBody}.${createHmac('sha256', secret).update(expiredBody).digest('base64url')}`;
assert.equal(post({ action: 'getAgileData', sessionToken: expiredToken }).result, 'error');
configuredSecret = 'different-secret';
assert.equal(post({ action: 'getAgileData', sessionToken: adminToken }).result, 'error');
configuredSecret = null;
assert.match(post({ action: 'getAgileData', sessionToken: adminToken }).error, /Falta configurar/);
configuredSecret = secret;
lockAvailable = false;
const beforeLock = releases;
assert.equal(post({ action: 'delete', sessionToken: adminToken, rowIndex: 2 }).result, 'error');
assert.equal(releases, beforeLock);
assert.equal(post({ action: 'getAgileData', sessionToken: adminToken }).result, 'success');
// Config y Academy no dependen de que exista la pestaña de escritura.
sheets.delete('agiletrainig');
assert.equal(post({ action: 'getConfig', sessionToken: adminToken }).result, 'success');
assert.equal(post({ action: 'getAcademyData', sheet: 'formacionInicial', sessionToken: adminToken }).result, 'success');
console.log('OK: Agile/Academy privados, compatibilidad con login, permisos, fechas, filas y validación de escrituras.');

import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const properties = new Map();
let writes = 0;
let lockAvailable = true;
let releases = 0;
const sheets = new Map();
function sheet(values, display = values.map(row => row.map(String))) {
  return {
    getLastRow: () => values.length,
    getLastColumn: () => values[0]?.length ?? 0,
    getRange: (start, column, count, width) => ({
      getValues: () => values.slice(start - 1, start - 1 + count).map(row => row.slice(column - 1, column - 1 + width)),
      getDisplayValues: () => display.slice(start - 1, start - 1 + count).map(row => row.slice(column - 1, column - 1 + width)),
      setValues: () => { writes++; },
    }),
    deleteRow: () => { writes++; },
    clearContents: () => { writes++; },
    appendRow: () => {},
  };
}
sheets.set('ingresoAdmin', sheet([
  ['documento', 'nombre', 'cargo', 'usuario', 'clave', 'observacion'],
  ['52829724', 'Diana', '', 'diana', 'pass-diana', ''],
  ['1018509964', 'Sebastian', '', 'sebastian', 'pass-sebastian', ''],
  ['1032430434', 'Alvaro', '', 'alvaro', 'pass-alvaro', ''],
]));
sheets.set('Base_WT25', sheet([
  ['Fecha', 'Cantidad', 'Activo'],
  [new Date('2026-01-02T03:04:05Z'), 0, false],
  ['', '', ''],
  ['último', 2, true],
]));
for (const name of ['Base_SM (1)', 'CONTROL_DE_ACCESOS', 'INFORME BIOMETRICO', 'DATA (4)', 'DATA', 'Novedades', 'Envios Servidores']) {
  sheets.set(name, sheet([['Encabezado'], ['dato']]));
}
sheets.set('CONTROL_DE_ACCESOS_CONFIG', sheet([['campana', 'Campaña A']]));
const doc = {
  getSheetByName: name => sheets.get(name),
  getSpreadsheetTimeZone: () => 'America/Bogota',
  insertSheet: name => {
    const result = sheet([]);
    sheets.set(name, result);
    return result;
  },
};
const context = vm.createContext({
  Date,
  PropertiesService: { getScriptProperties: () => ({
    getProperty: key => properties.get(key),
    setProperty: (key, value) => properties.set(key, value),
  }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => doc },
  LockService: { getScriptLock: () => ({
    tryLock: () => lockAvailable,
    releaseLock: () => { releases++; },
  }) },
  Utilities: {
    Charset: { UTF_8: 'utf8' },
    getUuid: randomUUID,
    base64EncodeWebSafe: value => Buffer.from(value).toString('base64url'),
    base64DecodeWebSafe: value => Buffer.from(value, 'base64url'),
    newBlob: value => ({ getDataAsString: () => Buffer.from(value).toString('utf8') }),
    computeHmacSha256Signature: (body, secret) => createHmac('sha256', secret).update(body).digest(),
    formatDate: (date, timezone, format) => {
      assert.equal(timezone, 'America/Bogota');
      assert.equal(format, "yyyy-MM-dd'T'HH:mm:ss");
      return '2026-01-01T22:04:05';
    },
  },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }),
  },
});
vm.runInContext(readFileSync(new URL('../appscriptSheets.gs', import.meta.url), 'utf8'), context);
const post = payload => context.doPost({ postData: { contents: JSON.stringify(payload) } });
const login = (usuario, clave) => post({ action: 'login', usuario, clave });
assert.equal(login('diana', 'incorrecta').authenticated, false);
const diana = login('diana', 'pass-diana');
assert.equal(diana.authenticated, true);
assert.equal(typeof diana.sessionToken, 'string');
assert.ok(properties.get('TRAINING_SESSION_SECRET'));
assert.equal(diana.salasToken, null); // El servidor separado de Salas es opcional.
const token = diana.sessionToken;
assert.equal(login('alvaro', 'pass-alvaro').authenticated, true);
const coordinatorToken = login('alvaro', 'pass-alvaro').sessionToken;

for (const name of context.TRAINING_READABLE_SHEETS) {
  const result = post({ action: 'readSheet', sheet: name, sessionToken: coordinatorToken });
  assert.equal(result.result, 'success', name);
  assert.equal(result.sheet, name);
}
const read = post({ action: 'readSheet', sheet: 'Base_WT25', sessionToken: token });
assert.deepEqual(read.rowIndices, [2, 3, 4]);
assert.deepEqual(read.rows[0], ['2026-01-01T22:04:05', 0, false]);
assert.deepEqual(read.rows[1], ['', '', '']);
assert.equal(read.timezone, 'America/Bogota');
assert.equal(post({ action: 'getConfig', sessionToken: token }).config.campana, 'Campaña A');
assert.equal(context.doGet({ parameter: { action: 'getConfig' } }).result, 'error');
assert.equal(context.doGet({ parameter: {} }).status, 'active');
for (const name of ['ingresoAdmin', 'SystemLogs', 'CONTROL_DE_ACCESOS_CONFIG', '__proto__', 'No existe']) {
  assert.equal(post({ action: 'readSheet', sheet: name, sessionToken: token }).result, 'error');
}
for (const action of ['readSheet', 'getConfig', 'create', 'update', 'delete', 'saveConfig']) {
  for (const invalid of [undefined, 'fake', `${token}alterado`]) {
    const before = writes;
    assert.equal(post({ action, sessionToken: invalid, data: {} }).result, 'error');
    assert.equal(writes, before);
  }
}
for (const action of ['create', 'update', 'delete', 'saveConfig']) {
  assert.equal(post({
    action, sessionToken: coordinatorToken, documento: '52829724', rol: 'SUPER_ADMIN',
    rowIndex: 2, data: {}, configData: [],
  }).result, 'error');
}
assert.equal(post({ action: 'create', sessionToken: token, data: { cantidad: 0 } }).result, 'success');
assert.equal(post({ action: 'update', sessionToken: token, rowIndex: 2, data: {} }).result, 'success');
assert.equal(post({ action: 'delete', sessionToken: token, rowIndex: 2 }).result, 'success');
assert.equal(post({ action: 'saveConfig', sessionToken: token, configData: [['key', 'value']] }).result, 'success');
for (const rowIndex of [1, 0, -1, 2.5, 999, 'not-a-number']) {
  assert.equal(post({ action: 'delete', sessionToken: token, rowIndex }).result, 'error');
}
const beforeInvalid = writes;
assert.equal(post({ action: 'saveConfig', sessionToken: token, configData: [['bad']] }).result, 'error');
assert.equal(post({ action: 'unknown', sessionToken: token }).result, 'error');
assert.equal(post({ data: {} }).result, 'error');
assert.equal(context.doPost({ postData: { contents: '{broken' } }).result, 'error');
assert.equal(writes, beforeInvalid);
assert.equal(context.mapRecordToRow({ cantidad: 0 })[8], 0);

const signed = (claims, secret = properties.get('TRAINING_SESSION_SECRET')) => {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
};
for (const claims of [
  { documento: '52829724', audience: 'training', expiresAt: Date.now() - 1000 },
  { documento: '52829724', audience: 'salas', expiresAt: Date.now() + 10000 },
  { documento: 'unknown', audience: 'training', expiresAt: Date.now() + 10000 },
]) {
  assert.equal(post({ action: 'readSheet', sheet: 'Base_WT25', sessionToken: signed(claims) }).result, 'error');
}
lockAvailable = false;
const releasesBefore = releases;
assert.equal(login('diana', 'pass-diana').result, 'error');
assert.equal(post({ action: 'delete', sessionToken: token, rowIndex: 2 }).result, 'error');
assert.equal(releases, releasesBefore);
// Las lecturas no toman el bloqueo de escritura.
assert.equal(post({ action: 'readSheet', sheet: 'Base_WT25', sessionToken: token }).result, 'success');

console.log('OK: login, lecturas privadas, pestañas permitidas, permisos, fechas, filas, escrituras y tokens inválidos/vencidos.');

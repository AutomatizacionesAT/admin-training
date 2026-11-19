import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const secret = 'test-only-shared-secret';
let configuredSecret = secret;
const accessed = [];
const sheets = new Map();
function sheet(values) {
  return {
    getLastRow: () => values.length,
    getLastColumn: () => values[0]?.length ?? 0,
    getRange: (row, column, count, width) => ({
      getValues: () => values.slice(row - 1, row - 1 + count).map(value => value.slice(column - 1, column - 1 + width)),
      getDisplayValues: () => values.slice(row - 1, row - 1 + count).map(value => value.slice(column - 1, column - 1 + width).map(String)),
    }),
  };
}
const utilities = {
  Charset: { UTF_8: 'utf8' },
  base64EncodeWebSafe: value => Buffer.from(value).toString('base64url'),
  base64DecodeWebSafe: value => Buffer.from(value, 'base64url'),
  computeHmacSha256Signature: (body, key) => createHmac('sha256', key).update(body).digest(),
  newBlob: value => ({ getDataAsString: () => Buffer.from(value).toString('utf8') }),
  formatDate: (date, timezone) => {
    assert.equal(timezone, 'America/Bogota');
    return '2026-01-01T00:00:00';
  },
};
const properties = { getScriptProperties: () => ({ getProperty: () => configuredSecret }) };
const context = vm.createContext({
  Date,
  Utilities: utilities,
  PropertiesService: properties,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({
    getSheetByName: name => { accessed.push(name); return sheets.get(name); },
    getSpreadsheetTimeZone: () => 'America/Bogota',
    insertSheet: () => { throw new Error('No debe escribir'); },
  }) },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }),
  },
});
vm.runInContext(readFileSync(new URL('../appcriptCohorts.gs', import.meta.url), 'utf8'), context);
// Comprobar interoperabilidad con el emisor de sesiones real.
const login = vm.createContext({ Utilities: utilities, PropertiesService: properties });
vm.runInContext(readFileSync(new URL('../appscriptSheets.gs', import.meta.url), 'utf8'), login);
const adminToken = login.createTrainingToken('52829724');
const coordinatorToken = login.createTrainingToken('1020808847');
const ownSheet = 'JENNY CAROLINA PINZON FERNANDEZ';
const anotherSheet = 'CRISTIAM CAMILO LOPEZ CONTRERAS';
for (const entry of context.COHORT_COORDINATOR_SHEETS) {
  sheets.set(entry.sheet, sheet([
    ['Año', 'Mes', 'Meta'],
    [2026, new Date('2026-01-01T05:00:00Z'), 0],
    ['', '', ''],
    [2026, 'febrero', false],
  ]));
}
const post = payload => context.doPost({ postData: { contents: JSON.stringify(payload) } });
assert.equal(context.doGet({ parameter: { action: 'ping' } }).module, 'COHORTS');
assert.equal(context.doGet({ parameter: {} }).version, 'restricted-cohorts-v1');
assert.equal(context.doGet({ parameter: { action: 'getCohortData' } }).result, 'error');
for (const sessionToken of [undefined, 'fake', `${adminToken}tampered`, login.signSessionToken('52829724', 'salas', secret)]) {
  assert.equal(post({ action: 'getCohortData', sessionToken }).result, 'error');
}
assert.equal(accessed.length, 0);
const admin = post({ action: 'getCohortData', sessionToken: adminToken });
assert.equal(admin.sheets.length, 13);
assert.equal(admin.sheets[0].rows[0][1], '2026-01-01T00:00:00');
assert.equal(admin.sheets[0].rows[0][2], 0);
assert.equal(admin.sheets[0].rows[2][2], false);
assert.deepEqual(admin.sheets[0].rowIndices, [2, 3, 4]);
assert.deepEqual(admin.sheets[0].rows[1], ['', '', '']);
assert.equal(admin.timezone, 'America/Bogota');
assert.equal(post({ action: 'getCohortSheets', sessionToken: adminToken }).sheets.length, 13);
assert.deepEqual(post({ action: 'getCohortSheets', sessionToken: coordinatorToken }).sheets, [ownSheet]);
accessed.length = 0;
const coordinator = post({ action: 'getCohortData', sessionToken: coordinatorToken });
assert.equal(coordinator.sheets.length, 1);
assert.equal(coordinator.sheets[0].sheet, ownSheet);
assert.deepEqual(accessed, [ownSheet]);
for (const name of [anotherSheet, 'ingresoAdmin', 'CohortsLogs', '__proto__', null, ['bad']]) {
  const before = accessed.length;
  assert.equal(post({
    action: 'getCohortData', sessionToken: coordinatorToken, sheet: name,
    documento: '52829724', rol: 'SUPER_ADMIN',
  }).result, 'error');
  assert.equal(accessed.length, before);
}
assert.equal(post({ action: 'getCohortData', sessionToken: adminToken, sheet: 'ingresoAdmin' }).result, 'error');
assert.equal(post({ action: 'getCohortData', sessionToken: adminToken, sheet: anotherSheet }).sheets.length, 1);
for (const action of ['create', 'update', 'delete', 'saveConfig', 'readSheet', 'login']) {
  assert.equal(post({ action, sessionToken: adminToken }).result, 'error');
}
assert.equal(post(null).result, 'error');
assert.equal(post([]).result, 'error');
assert.equal(context.doPost({ postData: { contents: '{bad' } }).result, 'error');
assert.equal(context.doPost({}).result, 'error');
assert.equal(post({ action: 'getCohortData', sessionToken: login.createTrainingToken('1032430434') }).result, 'error');

const claims = { documento: '52829724', audience: 'training', expiresAt: Date.now() - 1000 };
const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
const expired = `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
assert.equal(post({ action: 'getCohortData', sessionToken: expired }).result, 'error');
configuredSecret = 'wrong-secret';
assert.equal(post({ action: 'getCohortData', sessionToken: adminToken }).result, 'error');
configuredSecret = null;
assert.match(post({ action: 'getCohortData', sessionToken: adminToken }).error, /Falta configurar/);
configuredSecret = secret;

sheets.delete(anotherSheet);
const partial = post({ action: 'getCohortData', sessionToken: adminToken });
assert.equal(partial.sheets.length, 12);
assert.deepEqual(partial.missingSheets, [anotherSheet]);
assert.equal(post({ action: 'getCohortData', sessionToken: adminToken, sheet: anotherSheet }).result, 'error');
sheets.set(ownSheet, sheet([]));
assert.deepEqual(post({ action: 'getCohortData', sessionToken: coordinatorToken }).sheets[0].rows, []);
sheets.set(ownSheet, sheet([['Año', 'Mes']]));
assert.deepEqual(post({ action: 'getCohortData', sessionToken: coordinatorToken }).sheets[0].rows, []);
console.log('OK: Cohorts privado y de solo lectura, sesiones de login, acceso por coordinador, fechas e índices, pestañas faltantes.');

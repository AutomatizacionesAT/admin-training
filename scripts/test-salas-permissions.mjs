import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const secret = 'test-only-secret-not-for-production';
const utilities = {
  Charset: { UTF_8: 'utf8' },
  base64EncodeWebSafe: value => Buffer.from(value).toString('base64url'),
  base64DecodeWebSafe: value => Buffer.from(value, 'base64url'),
  computeHmacSha256Signature: (body, key) => createHmac('sha256', key).update(body).digest(),
  newBlob: value => ({ getDataAsString: () => Buffer.from(value).toString('utf8') }),
};
const properties = {
  getScriptProperties: () => ({ getProperty: () => secret }),
};
const auth = vm.createContext({ Utilities: utilities, PropertiesService: properties });
vm.runInContext(readFileSync(new URL('../appscriptSheets.gs', import.meta.url), 'utf8'), auth);

const salas = vm.createContext({
  Utilities: utilities,
  PropertiesService: properties,
  LockService: { getScriptLock: () => ({ tryLock() {}, releaseLock() {} }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({}) },
});
vm.runInContext(readFileSync(new URL('../appscriptSalas.gs', import.meta.url), 'utf8'), salas);
salas.getOrCreateDebugSheet = () => ({});
salas.logToDebug = () => {};
salas.createErrorResponse = error => ({ result: 'error', error });
salas.createSuccessResponse = data => ({ result: 'success', ...data });

const managerToken = auth.createSalasToken('52829724');
assert.equal(salas.isSalasManagerToken(managerToken), true);
assert.equal(salas.isSalasManagerToken(auth.createSalasToken('1018509964')), false);
assert.equal(salas.isSalasManagerToken(null), false);
assert.equal(salas.isSalasManagerToken('52829724'), false);
assert.equal(salas.isSalasManagerToken(`${managerToken}tampered`), false);
const [body, signature] = managerToken.split('.');
const alteredBody = utilities.base64EncodeWebSafe(JSON.stringify({
  documento: '52829724', audience: 'salas', expiresAt: Date.now() + 99999999,
}));
assert.equal(salas.isSalasManagerToken(`${alteredBody}.${signature}`), false);

function signedClaims(claims) {
  const body = utilities.base64EncodeWebSafe(JSON.stringify(claims));
  return `${body}.${utilities.base64EncodeWebSafe(utilities.computeHmacSha256Signature(body, secret))}`;
}
assert.equal(salas.isSalasManagerToken(signedClaims({
  documento: '52829724', audience: 'salas', expiresAt: Date.now() - 1000,
})), false);
assert.equal(salas.isSalasManagerToken(signedClaims({
  documento: '52829724', audience: 'other', expiresAt: Date.now() + 10000,
})), false);
assert.ok(body);

const actions = {
  createSala: 'handleCreateSala',
  updateSala: 'handleUpdateSala',
  deleteSala: 'handleDeleteSala',
  createAsignacion: 'handleCreateAsignacion',
  updateAsignacion: 'handleUpdateAsignacion',
  deleteAsignacion: 'handleDeleteAsignacion',
  updateEstadoAsignacion: 'handleUpdateEstadoAsignacion',
  updateTicket: 'handleUpdateTicket',
  respondTicket: 'handleRespondTicket',
};
for (const handler of Object.values(actions)) {
  salas[handler] = () => ({ result: 'success' });
}
function post(payload) {
  return salas.doPost({ postData: { contents: JSON.stringify(payload) } });
}
for (const action of Object.keys(actions)) {
  const payload = { action, data: { estadoAsignacion: 'APROBADO' } };
  for (const token of [undefined, 'fake', auth.createSalasToken('1018509964')]) {
    assert.equal(post({ ...payload, salasToken: token, documento: '52829724', rol: 'SUPER_ADMIN' }).result, 'error', action);
  }
  assert.equal(post({ ...payload, salasToken: managerToken }).result, 'success', action);
}
assert.equal(post({ action: 'createAsignacion', data: { estadoAsignacion: 'PENDIENTE' } }).result, 'success');
assert.equal(post({ action: 'createAsignacion', data: {} }).result, 'error');
assert.equal(post({ action: 'createAsignacion', estadoAsignacion: 'APROBADO' }).result, 'error');

salas.PropertiesService = { getScriptProperties: () => ({ getProperty: () => null }) };
assert.equal(salas.isSalasManagerToken(managerToken), false);

// Verifica que solo la cuenta autorizada reciba un token al autenticar.
auth.createSuccessResponse = data => data;
function loginAs(documento) {
  const doc = { getSheetByName: () => ({
    getLastRow: () => 2,
    getRange: () => ({ getDisplayValues: () => [[documento, '', '', 'user', 'password', '']] }),
  }) };
  return auth.handleLogin(doc, { usuario: 'user', clave: 'password' });
}
assert.equal(typeof loginAs('52829724').salasToken, 'string');
assert.equal(loginAs('1018509964').salasToken, null);

const source = readFileSync(new URL('../src/lib/salasPermissions.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const permissions = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
assert.equal(permissions.canManageSalas({ documento: '52829724' }), true);
assert.equal(permissions.canManageSalas({ documento: '1018509964', rol: 'SUPER_ADMIN' }), false);
assert.equal(permissions.canManageSalas(null), false);
permissions.setSalasSessionToken(managerToken);
assert.equal(permissions.getSalasSessionToken(), managerToken);
permissions.setSalasSessionToken(null);
assert.equal(permissions.getSalasSessionToken(), null);

console.log('OK: permisos exclusivos, tokens firmados, caducidad, acciones administrativas y solicitudes pendientes.');

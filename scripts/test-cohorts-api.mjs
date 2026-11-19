import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function compile(relative, imports = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const output = outputText.replace(/from ['"]([^'"]+)['"]/g, (match, specifier) => {
    assert.ok(imports[specifier], `Import no esperado: ${specifier}`);
    return `from '${imports[specifier]}'`;
  });
  return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
}
const apiUrl = compile('../src/lib/trainingApi.ts');
const api = await import(apiUrl);
const cohorts = await import(compile('../src/components/app/cohorts/utils/utils.ts', {
  '@/lib/trainingApi': apiUrl,
}));
const coordinator = 'JENNY CAROLINA PINZON FERNANDEZ';
const row = [
  2026, '2026-01-01T00:00:00', 'REQ-1', 'Dirección', 'Campaña', 'Segmento',
  'Persona', '001234', 'Indicador', 'Referencia', '%',
  0, 0.75, 0.75, 1, 0.8, 0.8, 1, 0.9, 0.9, 1, 1, 1,
  1, 0.95, 0.95, 1, 0.9, 0.9, 'Observación', 'Formador', coordinator, 0.7,
];
let result = {
  result: 'success',
  sheets: [{
    sheet: coordinator,
    rows: [row, Array(33).fill(''), [...row]],
    rowIndices: [2, 3, 4],
  }],
  missingSheets: [],
};
let calls = 0;
globalThis.fetch = async (url, options) => {
  calls++;
  assert.equal(url, cohorts.COHORTS_API_URL);
  assert.ok(url.endsWith('/exec'));
  assert.ok(!url.includes('gviz'));
  assert.equal(options.method, 'POST');
  assert.equal(options.mode, undefined);
  assert.match(options.headers['Content-Type'], /^text\/plain/);
  assert.deepEqual(JSON.parse(options.body), {
    action: 'getCohortData', sessionToken: api.getTrainingSessionToken(),
  });
  return { ok: true, status: 200, json: async () => result };
};
await assert.rejects(cohorts.fetchAllCohortData(), /Inicia sesión/);
assert.equal(calls, 0);
api.setTrainingSessionToken('test-coordinator-session');
const data = await cohorts.fetchAllCohortData();
assert.equal(calls, 1);
assert.equal(data.records.length, 3);
assert.equal(data.records[0].anio, 2026);
assert.equal(data.records[0].mes, '01/01/2026');
assert.equal(cohorts.mesLabel(data.records[0].mes), 'Enero');
assert.equal(cohorts.mesNumero(data.records[0].mes), 1);
assert.equal(data.records[0].documento, '001234');
assert.equal(data.records[0].metaOjt, 0);
assert.equal(data.records[0].cumplimientoOjt, 0.75);
assert.equal(data.records[0].cumplimiento70, 0.7);
assert.equal(data.records[0].sheetName, coordinator);
assert.equal(data.records[2].rowIndex, 4);
assert.equal(data.records[1].metaOjt, null);
assert.equal(data.records[1].mes, null);
assert.equal(cohorts.matchCoordinatorName('JENNY CAROLINA PINZÓN FERNÁNDEZ', [coordinator]), coordinator);
assert.deepEqual(data.missingSheets, []);
result = { ...result, missingSheets: ['Pestaña faltante'] };
assert.deepEqual((await cohorts.fetchAllCohortData()).missingSheets, ['Pestaña faltante']);
result = { result: 'success', sheets: [{ sheet: coordinator, rows: [], rowIndices: [] }], missingSheets: [] };
assert.deepEqual((await cohorts.fetchAllCohortData()).records, []);
for (const bad of [
  { result: 'success' },
  { result: 'success', sheets: [null], missingSheets: [] },
  { result: 'success', sheets: [], missingSheets: [123] },
  { result: 'success', sheets: [{ sheet: coordinator, rows: [row], rowIndices: [] }], missingSheets: [] },
  { result: 'success', sheets: [{ sheet: coordinator, rows: [row], rowIndices: [1] }], missingSheets: [] },
]) {
  result = bad;
  await assert.rejects(cohorts.fetchAllCohortData(), /Respuesta inválida/);
}
result = { result: 'error', error: 'Sesión inválida o vencida' };
await assert.rejects(cohorts.fetchAllCohortData(), /Sesión inválida o vencida/);
result = { result: 'error', error: 'Falta configurar TRAINING_SESSION_SECRET' };
await assert.rejects(cohorts.fetchAllCohortData(), /Falta configurar/);
let finish;
globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
const pending = cohorts.fetchAllCohortData();
api.setTrainingSessionToken(null);
finish({ ok: true, status: 200, json: async () => ({ result: 'success', sheets: [], missingSheets: [] }) });
await assert.rejects(pending, /La sesión cambió/);
console.log('OK: Cohorts usa POST autenticado en la nueva URL, una consulta, fechas/porcentajes/índices y errores explícitos.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Carga los mapeos TypeScript reales sin servidor ni credenciales de producción.
const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
function moduleUrl(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const output = outputText.replace(/from ['"]([^'"]+)['"]/g, (match, specifier) => {
    const target = specifier.startsWith('@/')
      ? path.join(root, 'src', specifier.slice(2))
      : path.resolve(path.dirname(filename), specifier);
    return `from '${moduleUrl(`${target}.ts`)}'`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  modules.set(filename, url);
  return url;
}
const api = await import(moduleUrl('src/lib/trainingApi.ts'));
const web = await import(moduleUrl('src/components/app/web_training/utils/utils.tsx'));
const simulator = await import(moduleUrl('src/components/app/simulator/utils/utils.tsx'));
const usage = await import(moduleUrl('src/components/app/usabilidad_web_training/utils/fetchData.ts'));
const biometric = await import(moduleUrl('src/components/app/informe_biometrico/utils/fetchData.ts'));

const calls = [];
const fixtures = {
  Base_WT25: [
    ['2026-03-04T00:00:00', 'Coordinador', 'Cliente', 'Segmento', 'Dev', '', '', 'Proceso', 0, '', '2026-03-04T00:00:00', '', 'Activo'],
    Array(18).fill(''),
    ['2026-03-05T00:00:00', 'Otro'],
  ],
  'Base_SM (1)': [['id', 'Industria', 'Dirección', 'Campaña', 'Coordinador', 'App', 'Proceso', 'Activo', '2026-03-04T00:00:00']],
  'DATA (4)': [['Dev', '', '', '2026-03-04T00:00:00', 'Festivo', '', 'Coordinador', '', 'Cliente', '', 'Tipo', '', 'Activo']],
  DATA: [['', '', '', '', '', '', 'Coordinador']],
  Novedades: [['Dev', '2026-03-04T00:00:00', '2026-03-05T00:00:00', 'Ausencia']],
  'Envios Servidores': [['Campaña', 'Segmento', true, '', '', 'https://example.com', 'Base']],
  CONTROL_DE_ACCESOS: [
    [1, '2026-03-04T00:00:00', '123', 'Campaña', '', 'Web Training'],
    [2, '2026-03-04T00:00:00', '123', 'Campaña', '', 'Movilidad'],
  ],
  'INFORME BIOMETRICO': [['2026-03-04T00:00:00', 10, '123', 'Persona', '1899-12-30T08:00:00', '1899-12-30T17:07:21', 9 / 24, '']],
};
const reply = result => ({ ok: true, status: 200, json: async () => result });
globalThis.fetch = async (url, options) => {
  assert.equal(url, api.TRAINING_API_URL);
  assert.equal(options.method, 'POST');
  assert.equal(options.mode, undefined);
  assert.match(options.headers['Content-Type'], /^text\/plain/);
  const payload = JSON.parse(options.body);
  calls.push(payload);
  if (payload.action === 'login') return reply({ result: 'success', authenticated: false });
  assert.equal(payload.sessionToken, api.getTrainingSessionToken());
  if (payload.action === 'getConfig') return reply({ result: 'success', config: { globalDiasMes: '19' } });
  if (payload.action !== 'readSheet') return reply({ result: 'success' });
  const rows = fixtures[payload.sheet];
  assert.ok(rows, payload.sheet);
  const displayRows = rows.map(row => row.map(String));
  if (payload.sheet === 'INFORME BIOMETRICO') {
    displayRows[0] = ['04/03/2026', '10', '123', 'Persona', '08:00:00', '17:07:21', '9:07:21', ''];
  }
  return reply({
    result: 'success', headers: rows[0].map((_, index) => `Col ${index}`),
    rows, displayRows, rowIndices: rows.map((_, index) => index + 2),
  });
};
await assert.rejects(api.fetchTrainingSheet('Base_WT25'), /Inicia sesión/);
assert.equal(calls.length, 0);
assert.equal((await api.trainingRequest({ action: 'login', usuario: 'test', clave: 'test' }, false)).authenticated, false);
assert.equal(calls[0].sessionToken, undefined);
api.setTrainingSessionToken('test-session');

const [first, second] = await Promise.all([
  api.fetchTrainingSheet('Base_WT25'), api.fetchTrainingSheet('Base_WT25'),
]);
assert.equal(first, second);
assert.equal(calls.filter(call => call.action === 'readSheet').length, 1);
const records = await web.fetchGoogleSheetData();
assert.equal(records[0].fechaSolicitud, '04/03/2026');
assert.equal(records[0].cantidad, '0');
assert.equal(records[2].rowIndex, 4);
assert.equal((await simulator.fetchGoogleSheetData())[0].fechaInicio, '04/03/2026');
assert.equal((await simulator.fetchSheetFestivosData())[0].festivo, '04/03/2026');
assert.equal((await web.fetchMasterData()).coordinadores[0], 'Coordinador');
assert.equal((await web.fetchSheetNovedades())[0].fechaFin, '05/03/2026');
assert.equal((await simulator.fetchSheetNovedades())[0].fechaInicio, '04/03/2026');
assert.equal((await web.fetchEnviosServidores())[0].estadoServidor, 'true');
assert.equal((await usage.fetchControlDeAccesos()).length, 1);
assert.equal((await usage.fetchControlDeAccesos())[0].dateISO, '2026-03-04');
assert.deepEqual(await usage.fetchCoordinadores(), ['Coordinador']);
assert.equal((await usage.fetchUserConfig()).globalDiasMes, '19');
assert.equal(await usage.saveUserConfig([['key', 'value']]), true);
const bio = (await biometric.fetchInformeBiometrico())[0];
assert.equal(bio.dateISO, '2026-03-04');
assert.equal(bio.ingreso, '08:00:00');
assert.equal(bio.horasDecimal, 9 + 7 / 60 + 21 / 3600);

await web.submitTrainingData({ action: 'delete', rowIndex: 4 });
assert.equal(calls.at(-1).action, 'delete');
assert.equal(calls.at(-1).rowIndex, 4);
await web.submitTrainingData({ action: 'update', data: records[0], rowIndex: 2 });
assert.equal(calls.at(-1).action, 'update');
await web.submitTrainingData([records[0]]);
assert.equal(calls.at(-1).action, 'create');
await web.submitTrainingData(records[0]);
assert.equal(calls.at(-1).action, 'create');

api.setTrainingSessionToken(null);
assert.deepEqual(web.getEnviosInfo('Campaña Segmento'), {});
// Los rechazos siguientes son esperados; omitir sus trazas con URLs de módulos data:.
const originalError = console.error;
console.error = () => {};
await assert.rejects(web.fetchEnviosServidores(), /Inicia sesión/);
api.setTrainingSessionToken('another-session');
globalThis.fetch = async () => reply({ result: 'error', error: 'Sesión vencida' });
await assert.rejects(api.fetchTrainingSheet('Base_WT25'), /Sesión vencida/);
await assert.rejects(web.submitTrainingData({ action: 'delete', rowIndex: 2 }), /Sesión vencida/);
assert.equal(await usage.saveUserConfig([]), false);
globalThis.fetch = async () => ({ ok: true, json: async () => { throw new Error('HTML login'); } });
await assert.rejects(api.fetchTrainingSheet('Base_WT25'), /Respuesta inválida/);

let finish;
globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
const pending = api.trainingRequest({ action: 'getConfig' });
api.setTrainingSessionToken(null);
finish(reply({ result: 'success', config: {} }));
await assert.rejects(pending, /La sesión cambió/);
console.error = originalError;
console.log('OK: nueva URL, sesión, deduplicación, mapeos, fechas/horas, escrituras confirmadas y cierre de sesión.');

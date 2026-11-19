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
const permissionsUrl = compile('../src/lib/salasPermissions.ts');
const api = await import(apiUrl);
const salas = await import(compile('../src/components/app/Salas/utils/fetchData.ts', {
  '@/lib/trainingApi': apiUrl, '@/lib/salasPermissions': permissionsUrl,
}));
const fixtures = {
  SALAS_CATALOGO: [
    ['Principal', 'A', 'Formación', 0, '', 'AM', true, false],
    ['', '', '', '', '', 'PM', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', 'B', '', 10, '', 'AM', '', ''],
  ],
  SALAS_ASIGNACIONES: [
    ['Campaña A', 'REQ1', 'A', 'Principal', 'Formador', '2026-01-01', '2026-01-02', 'AM', 0, 'PENDIENTE', '', '', 'Coordinador', 'Formación'],
    Array(14).fill(''),
    ['Otra campaña', 'REQ2', 'B', '', '', '2026-02-01', '2026-02-02', 'PM', 5, 'APROBADO'],
  ],
  ASIGNACION_TICKET: [
    ['Campaña A', '1', 'Falla', 'Coordinador', 'TKT-0001', '2026-01-01', '', '', '', '', 'A', 'Principal'],
    Array(12).fill(''),
    ['Otra campaña', '2', 'Otra falla', 'Otro', 'TKT-0002', '2026-01-02'],
  ],
  SALAS_ADMINS: [
    ['52829724', 'Diana', 'Analista'],
    ['1018509964', 'Sebastian', 'Analista'],
  ],
};
const calls = [];
let failure;
globalThis.fetch = async (url, options) => {
  assert.equal(url, salas.SALAS_API_URL);
  assert.equal(options.method, 'POST');
  assert.equal(options.mode, undefined);
  assert.match(options.headers['Content-Type'], /^text\/plain/);
  const payload = JSON.parse(options.body);
  assert.equal(payload.sessionToken, api.getTrainingSessionToken());
  assert.equal(payload.salasToken, undefined);
  calls.push(payload);
  if (failure) return { ok: true, status: 200, json: async () => ({ result: 'error', error: failure }) };
  let result = { result: 'success' };
  if (payload.action === 'readSheet') {
    const rows = fixtures[payload.sheet];
    assert.ok(rows);
    result = {
      ...result, rows, headers: rows[0].map((_, i) => `Col ${i}`),
      displayRows: rows.map(row => row.map(String)),
      rowIndices: rows.map((_, i) => i + 2),
    };
  }
  return { ok: true, status: 200, json: async () => result };
};
await assert.rejects(salas.fetchSalasCatalogo(), /Inicia sesión/);
await assert.rejects(salas.createSala({}), /Inicia sesión/);
assert.equal(calls.length, 0);
api.setTrainingSessionToken('test-session');
const catalog = await salas.fetchSalasCatalogo();
assert.equal(catalog.length, 3);
assert.equal(catalog[0].capacidad, '0');
assert.equal(catalog[0].tablero, 'true');
assert.equal(catalog[1].sala, 'A');
assert.equal(catalog[1].horario, 'PM');
assert.equal(catalog[1].rowIndex, 3);
assert.equal(catalog[2].sede, 'Principal');
assert.equal(catalog[2].rowIndex, 5);
const asignaciones = await salas.fetchSalasAsignaciones();
assert.equal(asignaciones.length, 2);
assert.equal(asignaciones[0].fechaInicial, '2026-01-01');
assert.equal(asignaciones[0].dPersonas, '0');
assert.equal(asignaciones[1].rowIndex, 4);
const tickets = await salas.fetchTickets();
assert.equal(tickets.length, 2);
assert.equal(tickets[1].rowIndex, 4);
const admins = await salas.fetchSalasAdmins();
assert.equal(admins[0].rol, 'SUPER_ADMIN');
assert.equal(admins[1].rol, 'COORDINADOR');
assert.equal((await salas.loginByCedula('52829724')).nombre, 'Diana');
const checks = [
  ['createSala', () => salas.createSala(catalog[0])],
  ['updateSala', () => salas.updateSala(catalog[0])],
  ['deleteSala', () => salas.deleteSala(2)],
  ['createAsignacion', () => salas.createAsignacion(asignaciones[0])],
  ['updateAsignacion', () => salas.updateAsignacion(asignaciones[0])],
  ['deleteAsignacion', () => salas.deleteAsignacion(2)],
  ['updateEstadoAsignacion', () => salas.updateEstadoAsignacion(2, 'APROBADO')],
  ['createTicket', () => salas.createTicket(tickets[0])],
  ['updateTicket', () => salas.updateTicket(tickets[0])],
  ['respondTicket', () => salas.respondTicket(tickets[0], 'Respuesta')],
  ['closeTicket', () => salas.closeTicket(2, 'Solucionado')],
];
for (const [action, run] of checks) {
  await run();
  assert.equal(calls.at(-1).action, action);
}
failure = 'Sesión inválida o vencida';
await assert.rejects(salas.fetchSalasCatalogo(), /Sesión inválida o vencida/);
await assert.rejects(salas.updateEstadoAsignacion(2, 'RECHAZADO'), /Sesión inválida o vencida/);
failure = 'Solo Diana puede gestionar Salas';
await assert.rejects(salas.deleteSala(2), /Solo Diana/);
api.setTrainingSessionToken(null);
await assert.rejects(salas.fetchTickets(), /Inicia sesión/);
console.log('OK: Salas usa la nueva URL con sesión para lecturas y escrituras, conserva fechas/índices/horarios y propaga errores.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import './test-salas-appscript.mjs';

// Conserva la comprobación de los permisos del frontend, además del servidor.
const source = readFileSync(new URL('../src/lib/salasPermissions.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const permissions = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
assert.equal(permissions.canManageSalas({ documento: '52829724' }), true);
assert.equal(permissions.canManageSalas({ documento: '1018509964', rol: 'SUPER_ADMIN' }), false);
assert.equal(permissions.canManageSalas(null), false);
permissions.setSalasSessionToken('test-session');
assert.equal(permissions.getSalasSessionToken(), 'test-session');
permissions.setSalasSessionToken(null);
assert.equal(permissions.getSalasSessionToken(), null);
console.log('OK: el frontend limita la gestión de Salas a Diana.');

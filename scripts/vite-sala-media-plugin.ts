import type { Plugin } from 'vite';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SALAS_DIR = path.join(ROOT, 'public', 'salas');
const SCRIPT = path.join(ROOT, 'scripts', 'generate-sala-media.mjs');

function runGenerate() {
  execSync(`node "${SCRIPT}"`, { stdio: 'inherit', cwd: ROOT });
}

/** Regenera salaMedia.manifest.ts al iniciar dev/build y al copiar fotos nuevas */
export function salaMediaPlugin(): Plugin {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(runGenerate, 400);
  };

  return {
    name: 'sala-media',
    buildStart() {
      runGenerate();
    },
    configureServer(server) {
      server.watcher.add(SALAS_DIR);
      server.watcher.on('add', (file) => {
        if (file.startsWith(SALAS_DIR)) schedule();
      });
      server.watcher.on('unlink', (file) => {
        if (file.startsWith(SALAS_DIR)) schedule();
      });
    },
  };
}

// Copies the ffmpeg.wasm core from node_modules into public/ffmpeg so the app
// serves it from its own origin (no third-party CDN, works offline once cached).
// Runs automatically before `dev` and `build`.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');
const to = join(root, 'public', 'ffmpeg');

if (!existsSync(from)) {
  console.error('[copy-ffmpeg-core] @ffmpeg/core is not installed. Run `npm install` first.');
  process.exit(1);
}

mkdirSync(to, { recursive: true });
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  copyFileSync(join(from, file), join(to, file));
}
console.log('[copy-ffmpeg-core] copied ffmpeg core to public/ffmpeg');

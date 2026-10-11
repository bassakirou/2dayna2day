const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseEnv } = require('node:util');

const root = path.resolve(__dirname, '..');
const local = process.argv.includes('--local');
const profile = local ? 'development' : 'production';
// Only the selected profile is read. Shell variables take priority.
for (const file of [`.env.${profile}.local`, `.env.${profile}`]) {
  const filename = path.join(root, file);
  if (!fs.existsSync(filename)) continue;
  const values = parseEnv(fs.readFileSync(filename, 'utf8'));
  for (const key of ['NEXT_PUBLIC_WP_ORIGIN', 'NEXT_PUBLIC_WP_API_URL']) {
    if (process.env[key] === undefined && values[key] !== undefined) {
      process.env[key] = values[key];
    }
  }
}
process.env.NODE_ENV = 'production';
process.env.STATIC_EXPORT_TARGET = local ? 'local' : 'production';
require('./validate-env.cjs')(process.env);
if (!local && process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  throw new Error('La production exige la validation TLS. Retirez NODE_TLS_REJECT_UNAUTHORIZED=0.');
}
if (local) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (process.argv.includes('--check')) {
  console.log(`Configuration ${profile} valide (aucun build exécuté).`);
  process.exit(0);
}
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], {
  cwd: root, env: process.env, stdio: 'inherit',
});
if (result.status !== 0) {
  console.error('Export échoué : aucun nouveau dist produit. Les anciens exports ne sont pas validés par cette exécution.');
  process.exit(result.status || 1);
}
if (!local) {
  const inspect = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(filename);
      else if (/\.(html|js|json|txt|css|xml)$/i.test(entry.name) &&
          /https?:\/\/(?:2dayna2day\.test|localhost|127\.0\.0\.1)\b/i.test(fs.readFileSync(filename, 'utf8'))) {
        throw new Error(`URL locale dans l'export de production : ${path.relative(root, filename)}`);
      }
    }
  };
  inspect(path.join(root, 'out'));
}
const destination = path.join(root, local ? 'dist-local' : 'dist');
fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(path.join(root, 'out'), destination, { recursive: true });
console.log(`Export ${profile} : ${destination}`);

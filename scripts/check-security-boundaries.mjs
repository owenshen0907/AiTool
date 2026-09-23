import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const forbiddenRoutes = [
  'pages/api/asr-sse.js',
  'src/app/api/audio/transcriptions/route.ts',
  'src/app/api/completions/route.ts',
  'src/app/api/embedding/route.ts',
];

const failures = [];

async function sourceFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(entryPath)));
    else if (/\.(?:js|mjs|ts|tsx)$/.test(entry.name)) files.push(entryPath);
  }

  return files;
}

for (const route of forbiddenRoutes) {
  try {
    await access(path.join(root, route));
    failures.push(`${route} must not expose a server-side provider proxy`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

const codeRoots = ['src', 'pages'];
for (const codeRoot of codeRoots) {
  for (const file of await sourceFiles(path.join(root, codeRoot))) {
    const source = await readFile(file, 'utf8');
    const relativeFile = path.relative(root, file);

    for (const secretName of ['STEP_API_KEY', 'OPENAI_API_KEY', 'X_API_KEY']) {
      if (source.includes(secretName)) {
        failures.push(`${relativeFile} must not read provider secret ${secretName}`);
      }
    }

    if (source.includes('decodeJwtPayload')) {
      failures.push(`${relativeFile} must not treat an unverified JWT payload as authentication`);
    }
  }
}

if (failures.length > 0) {
  console.error('Security boundary check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Security boundary check passed.');
}

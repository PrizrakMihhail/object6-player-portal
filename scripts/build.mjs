import { cp, mkdtemp, rename, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeSupabaseConfig } from './build-supabase-config.mjs';

const root = new URL('../', import.meta.url);
const source = new URL('src/', root);
const output = new URL('dist/', root);
const temporaryPath = await mkdtemp(fileURLToPath(new URL('.build-', root)));
const temporaryDirectory = pathToFileURL(temporaryPath + '/');

try {
  await cp(source, temporaryDirectory, { recursive: true });
  await writeSupabaseConfig(temporaryDirectory);
  await rm(output, { recursive: true, force: true });
  await rename(temporaryDirectory, output);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

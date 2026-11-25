import { writeFile } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';

export async function writeSupabaseConfig(directory) {
  try {
    loadEnvFile(new URL('../.env', import.meta.url));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const projectUrl = process.env.SUPABASE_URL?.trim();
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  let config = null;

  if (projectUrl || publishableKey) {
    if (!projectUrl || !/^sb_publishable_[\w-]+$/.test(publishableKey || '')) {
      throw new Error('Set SUPABASE_URL and a Supabase sb_publishable_ key.');
    }

    const url = new URL(projectUrl);
    if (url.protocol !== 'https:' || url.href !== url.origin + '/') {
      throw new Error('SUPABASE_URL must be the HTTPS project origin.');
    }
    config = { url: url.origin, publishableKey };
  }

  await writeFile(new URL('shared/supabase-config.js', directory),
    `export default ${JSON.stringify(config)};\n`);
}

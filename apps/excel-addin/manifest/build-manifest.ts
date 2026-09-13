/**
 * Renders `manifest.template.xml` into `manifest.<env>.xml` by substituting the
 * add-in id and base URL. Keeps the manifest in sync with the deployment target
 * and makes moving to the unified (JSON) manifest a one-file change later.
 *
 *   tsx manifest/build-manifest.ts dev
 *   tsx manifest/build-manifest.ts prod
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Target = 'dev' | 'prod';

const TARGETS: Record<Target, { baseUrl: string }> = {
  dev: { baseUrl: process.env['ADDIN_DEV_URL'] ?? 'https://localhost:3000' },
  prod: { baseUrl: process.env['ADDIN_PROD_URL'] ?? 'https://REPLACE-WITH-YOUR-HOST' },
};

// The permanent AppSource product id — do not regenerate after submission.
const ADDIN_ID = process.env['ADDIN_ID'] ?? '7e6a89f9-977e-420f-bb66-674d8fded137';

function main(): void {
  const target = process.argv[2] as Target | undefined;
  if (target !== 'dev' && target !== 'prod') {
    console.error('Usage: tsx manifest/build-manifest.ts <dev|prod>');
    process.exit(1);
  }

  const dir = fileURLToPath(new URL('.', import.meta.url));
  const template = readFileSync(join(dir, 'manifest.template.xml'), 'utf8');
  const baseUrl = TARGETS[target].baseUrl.replace(/\/$/, '');

  const rendered = template
    .replaceAll('__ADDIN_ID__', ADDIN_ID)
    .replaceAll('__BASE_URL__', baseUrl);

  if (target === 'prod' && baseUrl.includes('REPLACE-WITH-YOUR-HOST')) {
    console.warn('[manifest] prod base URL is a placeholder — set ADDIN_PROD_URL.');
  }

  const out = join(dir, `manifest.${target}.xml`);
  writeFileSync(out, rendered, 'utf8');
  console.log(`[manifest] wrote ${out}  (id=${ADDIN_ID}, base=${baseUrl})`);
}

main();

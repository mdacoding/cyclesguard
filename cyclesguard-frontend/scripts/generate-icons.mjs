import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');
const svg = readFileSync(join(iconsDir, 'icon.svg'));

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('sharp not installed — run: npm install -D sharp && npm run generate-icons');
    return;
  }

  for (const size of [192, 512]) {
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    writeFileSync(join(iconsDir, `icon-${size}.png`), png);
    console.log(`Generated icon-${size}.png`);
  }
}

main().catch(console.error);

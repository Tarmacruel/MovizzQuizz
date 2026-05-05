import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const iconsDir = resolve(root, 'public/brand/bee/icons');

const outputs = [
  {
    source: resolve(iconsDir, 'icon.svg'),
    target: resolve(iconsDir, 'icon-192x192.svg'),
    width: 192,
    height: 192,
  },
  {
    source: resolve(iconsDir, 'icon.svg'),
    target: resolve(iconsDir, 'icon-512x512.svg'),
    width: 512,
    height: 512,
  },
  {
    source: resolve(iconsDir, 'maskable-icon.svg'),
    target: resolve(iconsDir, 'icon-maskable-512x512.svg'),
    width: 512,
    height: 512,
  },
  {
    source: resolve(iconsDir, 'icon.svg'),
    target: resolve(iconsDir, 'apple-touch-icon-180x180.svg'),
    width: 180,
    height: 180,
  },
  {
    source: resolve(iconsDir, 'icon.svg'),
    target: resolve(iconsDir, 'favicon-32x32.svg'),
    width: 32,
    height: 32,
  },
  {
    source: resolve(iconsDir, 'icon.svg'),
    target: resolve(iconsDir, 'favicon-16x16.svg'),
    width: 16,
    height: 16,
  },
];

function withSize(svg, width, height) {
  return svg
    .replace(/<svg\s+width="[^"]+"\s+height="[^"]+"/, `<svg width="${width}" height="${height}"`)
    .replace(/viewBox="[^"]+"/, 'viewBox="0 0 512 512"');
}

await mkdir(iconsDir, { recursive: true });

for (const item of outputs) {
  const svg = await readFile(item.source, 'utf8');
  await writeFile(item.target, withSize(svg, item.width, item.height), 'utf8');
  console.log(`created ${item.target.replace(root, 'client')}`);
}

console.log('\nPNG export note:');
console.log('The repository stores SVG source assets safely. For final PNG export, run one of:');
console.log('  npx sharp-cli -i public/brand/bee/icons/icon.svg -o public/brand/bee/icons/icon-512x512.png resize 512 512');
console.log('  magick public/brand/bee/icons/icon.svg -resize 512x512 public/brand/bee/icons/icon-512x512.png');

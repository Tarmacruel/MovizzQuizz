import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const iconsDir = resolve(root, 'public/brand/bee/icons');
const avatarsDir = resolve(root, 'public/brand/bee/avatars');
const adaptiveDir = resolve(root, 'public/brand/bee/android');

const iconExports = [
  { source: 'icon.svg', target: 'icon-192x192.png', width: 192, height: 192 },
  { source: 'icon.svg', target: 'icon-512x512.png', width: 512, height: 512 },
  { source: 'maskable-icon.svg', target: 'icon-maskable-512x512.png', width: 512, height: 512 },
  { source: 'icon.svg', target: 'apple-touch-icon-180x180.png', width: 180, height: 180 },
  { source: 'icon.svg', target: 'favicon-32x32.png', width: 32, height: 32 },
  { source: 'icon.svg', target: 'favicon-16x16.png', width: 16, height: 16 },
  { source: 'notification-monochrome.svg', target: 'android-notification-monochrome.png', width: 96, height: 96 },
];

const svgAliasExports = [
  { source: 'icon.svg', target: 'icon-192x192.svg', width: 192, height: 192 },
  { source: 'icon.svg', target: 'icon-512x512.svg', width: 512, height: 512 },
  { source: 'maskable-icon.svg', target: 'icon-maskable-512x512.svg', width: 512, height: 512 },
  { source: 'icon.svg', target: 'apple-touch-icon-180x180.svg', width: 180, height: 180 },
  { source: 'icon.svg', target: 'favicon-32x32.svg', width: 32, height: 32 },
  { source: 'icon.svg', target: 'favicon-16x16.svg', width: 16, height: 16 },
];

const avatarExports = [
  { source: 'default-user.svg', name: 'default-user' },
  { source: 'guest-user.svg', name: 'guest-user' },
];

const adaptiveExports = [
  { source: resolve(iconsDir, 'maskable-icon.svg'), target: resolve(adaptiveDir, 'adaptive-icon-foreground.png'), width: 432, height: 432 },
  { source: resolve(iconsDir, 'icon.svg'), target: resolve(adaptiveDir, 'adaptive-icon-background.png'), width: 512, height: 512 },
];

function repoPath(filePath) {
  return relative(root, filePath).replaceAll('\\', '/');
}

function withSize(svg, width, height) {
  return svg
    .replace(/<svg\s+width="[^"]+"\s+height="[^"]+"/, `<svg width="${width}" height="${height}"`)
    .replace(/viewBox="[^"]+"/, 'viewBox="0 0 512 512"');
}

async function exportSvgAlias({ source, target, width, height }) {
  const sourcePath = resolve(iconsDir, source);
  const targetPath = resolve(iconsDir, target);
  const svg = await readFile(sourcePath, 'utf8');
  await writeFile(targetPath, withSize(svg, width, height), 'utf8');
  console.log(`created ${repoPath(targetPath)}`);
}

async function exportPng({ source, target, width, height }) {
  const sourcePath = resolve(iconsDir, source);
  const targetPath = resolve(iconsDir, target);
  await sharp(sourcePath)
    .resize(width, height, { fit: 'contain', background: { r: 7, g: 7, b: 19, alpha: 1 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(targetPath);
  console.log(`created ${repoPath(targetPath)}`);
}

async function exportAvatar({ source, name }) {
  const sourcePath = resolve(avatarsDir, source);
  for (const size of [64, 128, 256, 512]) {
    const targetPath = resolve(avatarsDir, `${name}-${size}x${size}.png`);
    await sharp(sourcePath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(targetPath);
    console.log(`created ${repoPath(targetPath)}`);
  }
}

async function exportAdaptive({ source, target, width, height }) {
  await sharp(source)
    .resize(width, height, { fit: 'contain', background: { r: 7, g: 7, b: 19, alpha: 1 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(target);
  console.log(`created ${repoPath(target)}`);
}

await mkdir(iconsDir, { recursive: true });
await mkdir(avatarsDir, { recursive: true });
await mkdir(adaptiveDir, { recursive: true });

for (const item of svgAliasExports) await exportSvgAlias(item);
for (const item of iconExports) await exportPng(item);
for (const item of avatarExports) await exportAvatar(item);
for (const item of adaptiveExports) await exportAdaptive(item);

console.log('\nBee identity assets exported successfully.');
console.log('Review generated PNGs before committing them to the repository.');

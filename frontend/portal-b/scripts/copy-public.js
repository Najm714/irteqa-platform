// scripts/copy-public.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(publicDir)) {
  console.log('⚠️  No public/ folder found. Skipping.');
  process.exit(0);
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const files = fs.readdirSync(publicDir);

files.forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  
  if (fs.statSync(src).isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.copyFileSync(src, dest);
  }
  console.log(`✅ Copied: ${file}`);
});

console.log('✅ Public folder copied to dist/');
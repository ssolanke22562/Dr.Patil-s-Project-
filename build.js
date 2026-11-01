/**
 * Build script for Vercel deployment
 * Ensures static assets are prepared for any Vercel configuration
 * (Root, Public directory, or Dist directory).
 */

const fs = require('fs');
const path = require('path');

const targets = ['public', 'dist'];

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const dir of targets) {
  const targetDir = path.join(__dirname, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy index.html
  fs.copyFileSync(
    path.join(__dirname, 'index.html'),
    path.join(targetDir, 'index.html')
  );

  // Copy css & js directories
  copyDirRecursive(path.join(__dirname, 'css'), path.join(targetDir, 'css'));
  copyDirRecursive(path.join(__dirname, 'js'), path.join(targetDir, 'js'));

  console.log(`[Build] Static files synced to /${dir}`);
}

console.log('[Build] Deployment preparation complete.');


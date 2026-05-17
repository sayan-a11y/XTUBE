const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Copying static assets to standalone directory...');
  
  // 1. Copy .next/static -> .next/standalone/.next/static
  if (fs.existsSync('.next/static')) {
    copyDir('.next/static', '.next/standalone/.next/static');
    console.log('Copied .next/static to .next/standalone/.next/static');
  } else {
    console.warn('Warning: .next/static directory not found.');
  }

  // 2. Copy public -> .next/standalone/public
  if (fs.existsSync('public')) {
    copyDir('public', '.next/standalone/public');
    console.log('Copied public/ to .next/standalone/public');
  } else {
    console.log('No public/ directory found to copy.');
  }
  
  console.log('✓ Assets copied successfully.');
} catch (err) {
  console.error('Error copying assets:', err);
  process.exit(1);
}

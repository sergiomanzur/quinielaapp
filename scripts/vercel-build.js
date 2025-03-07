import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Vercel build process...');

try {
  // Create dist folder if it doesn't exist
  const distDir = path.join(__dirname, '../dist');
  fs.ensureDirSync(distDir);

  // Run Vite build directly using npx to avoid permission issues
  console.log('Building frontend...');
  execSync('npx --no-install vite build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Vercel build completed successfully!');
} catch (error) {
  console.error('Build error:', error);
  process.exit(1);
}

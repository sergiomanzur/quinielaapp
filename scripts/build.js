import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Build the frontend
console.log('Building frontend...');
exec('npm run build', { cwd: rootDir }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Frontend build error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Frontend build stderr: ${stderr}`);
  }
  console.log(`Frontend build stdout: ${stdout}`);
  console.log('Frontend build complete!');
  
  // Copy server files to dist
  console.log('Copying server files...');
  const serverDir = path.join(rootDir, 'src', 'server');
  const serverDistDir = path.join(rootDir, 'dist', 'server');
  
  fs.ensureDirSync(serverDistDir);
  fs.copySync(serverDir, serverDistDir);
  
  console.log('Server files copied!');
  console.log('Build complete!');
});

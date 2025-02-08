const { execSync } = require('child_process');

console.log('Stopping development environment...');

// Kill all Node.js processes
try {
  console.log('Stopping Node.js processes...');
  execSync('taskkill /F /IM node.exe >nul 2>&1', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors
}

// Kill all Electron processes
try {
  console.log('Stopping Electron processes...');
  execSync('taskkill /F /IM electron.exe >nul 2>&1', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors
}

// Clean up build directories
const fs = require('fs');
const path = require('path');

const dirsToClean = ['dist', 'dist-electron', '.vite'];
dirsToClean.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      console.log(`Cleaning ${dir} directory...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error cleaning ${dir}:`, error);
    }
  }
});

console.log('Development environment stopped.');

import { spawn } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import waitOn from 'wait-on';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Kill existing processes
const killProcesses = async () => {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const kill1 = spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
      const kill2 = spawn('taskkill', ['/F', '/IM', 'electron.exe'], { stdio: 'ignore' });
      
      Promise.all([
        new Promise(r => kill1.on('exit', r)),
        new Promise(r => kill2.on('exit', r))
      ]).then(() => {
        setTimeout(resolve, 1000); // Give processes time to fully terminate
      });
    } else {
      const kill1 = spawn('pkill', ['-f', 'node'], { stdio: 'ignore' });
      const kill2 = spawn('pkill', ['-f', 'electron'], { stdio: 'ignore' });
      
      Promise.all([
        new Promise(r => kill1.on('exit', r)),
        new Promise(r => kill2.on('exit', r))
      ]).then(() => {
        setTimeout(resolve, 1000); // Give processes time to fully terminate
      });
    }
  });
};

// Start development processes
const startProcesses = async () => {
  const processes = [];
  let cleanup = null;

  try {
    // TypeScript compilation
    const tsc = spawn('npx', ['tsc', '--project', 'electron/tsconfig.json', '--watch'], {
      stdio: 'inherit',
      shell: true
    });
    processes.push(tsc);

    // Vite development server
    const vite = spawn('npx', ['vite'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    processes.push(vite);

    // Backend server
    const server = spawn('node', ['--experimental-modules', 'server.mjs'], {
      stdio: 'inherit',
      shell: true
    });
    processes.push(server);

    // Wait for both servers to be ready
    console.log('Waiting for servers to start...');
    await waitOn({
      resources: [
        'http-get://localhost:5174',
        'http-get://localhost:3000'
      ],
      timeout: 30000,
      interval: 100,
      validateStatus: status => status !== 503
    });

    console.log('All servers are ready. Starting Electron...');

    // Launch Electron
    const electron = spawn('npx', ['electron', '.'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'development', FORCE_COLOR: '1' }
    });
    processes.push(electron);

    // Define cleanup function
    cleanup = (exitCode = 0) => {
      console.log('\nCleaning up processes...');
      processes.forEach(proc => {
        try {
          proc.kill();
        } catch (err) {
          console.error('Error killing process:', err);
        }
      });
      process.exit(exitCode);
    };

    // Handle process termination
    process.on('SIGINT', () => cleanup());
    process.on('SIGTERM', () => cleanup());
    electron.on('close', (code) => cleanup(code));

    // Handle child process errors
    processes.forEach(proc => {
      proc.on('error', (err) => {
        console.error('Process error:', err);
        cleanup(1);
      });
    });

  } catch (error) {
    console.error('Error starting development servers:', error);
    if (cleanup) cleanup(1);
    else process.exit(1);
  }
};

// Main execution
(async () => {
  try {
    console.log('Killing existing processes...');
    await killProcesses();
    
    console.log('Starting development servers...');
    await startProcesses();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();

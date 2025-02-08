// launch.js
// This script prompts the user to choose CPU mode (disable hardware acceleration)
// and optionally specify a custom cache folder, then spawns the Electron app.

const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');

// Create readline interface for command-line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask a question and return a promise
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, answer => resolve(answer.trim())));
}

(async () => {
  console.log('\nMega IDE Launcher\n');

  // Prompt for hardware acceleration preference
  const cpuAnswer = await askQuestion('Do you want to run in CPU mode (disable hardware acceleration)? [y/n]: ');
  const useCPUMode = cpuAnswer.toLowerCase().startsWith('y');
  console.log(useCPUMode
    ? '\nRunning in CPU mode (hardware acceleration disabled).'
    : '\nRunning with GPU acceleration enabled.'
  );

  // Prompt for custom cache folder selection
  const cacheAnswer = await askQuestion('\nEnter a custom cache folder path or press enter to use default: ');
  let cacheFolder = '';
  if (cacheAnswer !== '') {
    cacheFolder = path.resolve(cacheAnswer);
    console.log(`\nUsing custom cache folder: ${cacheFolder}`);
  } else {
    console.log('\nUsing default cache folder.');
  }

  // Close the readline interface
  rl.close();

  console.log('\nStarting Mega IDE...\n');

  // Set environment variables for the Electron process
  const env = Object.assign({}, process.env, {
    USE_CPU_MODE: useCPUMode ? 'true' : 'false',
    CACHE_FOLDER: cacheFolder,
    NODE_ENV: 'development',
    VITE_SOCKET_SERVER_PORT: '3000',
    API_SERVER_PORT: '3000'
  });

  // Start the backend server
  const serverProcess = spawn('node', ['server.mjs'], {
    env,
    stdio: 'inherit'
  });

  // Start Vite development server
  const viteProcess = spawn('npm', ['run', 'dev'], {
    env,
    stdio: 'inherit'
  });

  // Wait a bit for the servers to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Start Electron
  const electronProcess = spawn('npm', ['run', 'electron:dev'], {
    env,
    stdio: 'inherit'
  });

  // Handle process cleanup
  const cleanup = () => {
    serverProcess.kill();
    viteProcess.kill();
    electronProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Handle child process exits
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('Backend server process exited with code:', code);
      cleanup();
    }
  });

  viteProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('Vite process exited with code:', code);
      cleanup();
    }
  });

  electronProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('Electron process exited with code:', code);
    }
    cleanup();
  });
})();

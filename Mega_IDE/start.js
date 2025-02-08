const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting development environment...');

// Ensure clean state
try {
    console.log('Cleaning up existing processes...');
    require('child_process').execSync('taskkill /F /IM node.exe >nul 2>&1', { stdio: 'ignore' });
    require('child_process').execSync('taskkill /F /IM electron.exe >nul 2>&1', { stdio: 'ignore' });
} catch (error) {
    // Ignore errors
}

// Clean build directories
console.log('Cleaning build directories...');
const dirsToClean = ['dist', 'dist-electron', '.vite'];
dirsToClean.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
    }
});

// Track child processes
const processes = new Set();

// Function to spawn process with error handling
function spawnProcess(command, args, options = {}) {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        windowsHide: false,
        ...options
    });

    proc.on('error', (error) => {
        console.error(`Failed to start ${command}:`, error);
        cleanup();
    });

    proc.on('exit', (code, signal) => {
        if (code !== 0) {
            console.error(`${command} exited with code ${code}`);
            cleanup();
        }
    });

    processes.add(proc);
    return proc;
}

// Start Vite dev server
console.log('\nStarting Vite development server...');
const vite = spawnProcess('npm.cmd', ['run', 'dev']);

// Function to check if a port is in use
const isPortInUse = async (port) => {
    return new Promise((resolve) => {
        const net = require('net');
        const tester = net.createServer()
            .once('error', () => resolve(true))
            .once('listening', () => {
                tester.once('close', () => resolve(false));
                tester.close();
            })
            .listen(port);
    });
};

// Wait for Vite server to be ready
const checkServer = async () => {
    console.log('\nWaiting for Vite server to be ready...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        console.log(`Checking server (attempt ${attempts + 1}/${maxAttempts})...`);
        const inUse = await isPortInUse(5174);
        if (inUse) {
            console.log('Vite server is ready!');
            startElectron();
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }
    
    console.error('Timeout waiting for Vite server');
    cleanup();
};

// Start Electron
const startElectron = () => {
    console.log('\nStarting Electron...');
    const electron = spawnProcess('npm.cmd', ['run', 'electron:dev'], {
        env: {
            ...process.env,
            NODE_ENV: 'development',
            ELECTRON_START_URL: 'http://localhost:5174'
        }
    });
};

// Cleanup function
const cleanup = () => {
    console.log('\nCleaning up processes...');
    processes.forEach(proc => {
        try {
            proc.kill();
        } catch (error) {
            console.error('Error killing process:', error);
            // Force kill on Windows
            try {
                require('child_process').execSync(`taskkill /F /PID ${proc.pid}`, { stdio: 'ignore' });
            } catch (e) {
                // Ignore errors from taskkill
            }
        }
    });
    process.exit(1);
};

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    cleanup();
});
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    cleanup();
});

// Start the server check
console.log('\nInitializing development environment...');
checkServer().catch((error) => {
    console.error('Error in server check:', error);
    cleanup();
});

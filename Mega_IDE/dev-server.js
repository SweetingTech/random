const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const os = require('os');

// Configuration
const VITE_PORT = 5174;
const MAX_ATTEMPTS = 30;
const CHECK_INTERVAL = 1000;
const IS_WINDOWS = os.platform() === 'win32';
const NPM_CMD = IS_WINDOWS ? 'npm.cmd' : 'npm';

// Store process references
let viteProcess = null;
let electronProcess = null;

function log(message) {
    console.log(`[DevServer] ${message}`);
}

function cleanup() {
    log('Cleaning up processes...');
    
    if (viteProcess) {
        try {
            if (IS_WINDOWS) {
                require('child_process').execSync(`taskkill /F /PID ${viteProcess.pid} >nul 2>&1`);
            } else {
                viteProcess.kill();
            }
        } catch (err) {
            // Ignore errors
        }
        viteProcess = null;
    }
    
    if (electronProcess) {
        try {
            if (IS_WINDOWS) {
                require('child_process').execSync(`taskkill /F /PID ${electronProcess.pid} >nul 2>&1`);
            } else {
                electronProcess.kill();
            }
        } catch (err) {
            // Ignore errors
        }
        electronProcess = null;
    }
}

// Handle process exit
process.on('SIGINT', () => {
    log('Received SIGINT signal');
    cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM signal');
    cleanup();
    process.exit(0);
});

// Check if port is in use
function checkPort(port) {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
            .once('listening', () => {
                tester.once('close', () => resolve(false));
                tester.close();
            })
            .listen(port);
    });
}

// Start Vite development server
function startVite() {
    log('Starting Vite development server...');
    
    viteProcess = spawn(NPM_CMD, ['run', 'dev'], {
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            FORCE_COLOR: true
        }
    });

    viteProcess.on('error', (err) => {
        log(`Vite server error: ${err.message}`);
        cleanup();
        process.exit(1);
    });

    return viteProcess;
}

// Start Electron
function startElectron() {
    log('Starting Electron...');
    
    electronProcess = spawn(NPM_CMD, ['run', 'electron:dev'], {
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            NODE_ENV: 'development',
            ELECTRON_START_URL: `http://localhost:${VITE_PORT}`,
            FORCE_COLOR: true
        }
    });

    electronProcess.on('error', (err) => {
        log(`Electron error: ${err.message}`);
        cleanup();
        process.exit(1);
    });

    return electronProcess;
}

// Wait for Vite server to be ready
async function waitForVite() {
    log('Waiting for Vite server to be ready...');
    
    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
        const portInUse = await checkPort(VITE_PORT);
        if (!portInUse) {
            log('Vite server is ready');
            return true;
        }
        
        attempts++;
        log(`Waiting for Vite server... (${attempts}/${MAX_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
    
    log('Timed out waiting for Vite server');
    return false;
}

// Main function
async function main() {
    try {
        // Clean up any existing processes
        if (IS_WINDOWS) {
            try {
                require('child_process').execSync('taskkill /F /IM node.exe >nul 2>&1');
                require('child_process').execSync('taskkill /F /IM electron.exe >nul 2>&1');
            } catch (err) {
                // Ignore errors
            }
        }

        // Start Vite
        startVite();
        
        // Wait for Vite to be ready
        const viteReady = await waitForVite();
        if (!viteReady) {
            log('Failed to start Vite server');
            cleanup();
            process.exit(1);
        }
        
        // Start Electron
        startElectron();
        
        log('Development environment is running');
        log('Press Ctrl+C to stop');
        
    } catch (error) {
        log(`Error starting development environment: ${error.message}`);
        cleanup();
        process.exit(1);
    }
}

// Start the development environment
log('Initializing development environment...');
main().catch(error => {
    log(`Unhandled error: ${error.message}`);
    cleanup();
    process.exit(1);
});

Write-Host "Stopping existing processes..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Starting development environment..." -ForegroundColor Green

$env:NODE_ENV = "development"
$env:VITE_DEV_SERVER_PORT = "5174"
$env:FORCE_COLOR = "1"

$command = "npx concurrently " + `
    "--kill-others " + `
    "--prefix-colors `"blue.bold,magenta.bold,green.bold,yellow.bold`" " + `
    "--prefix `"[{name}]`" " + `
    "--names `"TSC,VITE,SERVER,ELECTRON`" " + `
    "--handle-input " + `
    "`"npx tsc --project electron/tsconfig.json --watch`" " + `
    "`"npx vite`" " + `
    "`"node --experimental-modules server.mjs`" " + `
    "`"npx wait-on -t 30000 -v http-get://localhost:5174 http-get://localhost:3000 && npx electron .`""

try {
    Write-Host "Running command: $command" -ForegroundColor Yellow
    Invoke-Expression $command
}
catch {
    Write-Host "Error running development environment: $_" -ForegroundColor Red
}
finally {
    Write-Host "Development environment stopped." -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force
}

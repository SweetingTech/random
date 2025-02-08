Write-Host 'Loading environment variables...' -ForegroundColor Cyan
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}

Write-Host 'Killing any existing processes...' -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host 'Starting development servers...' -ForegroundColor Green
$env:NODE_ENV = 'development'
$env:VITE_DEV_SERVER_PORT = '5174'

# Run all processes in a single window using concurrently
npx concurrently --handle-input --default-input-target 0 --kill-others --success first --names "TSC,VITE,SERVER,ELECTRON" --prefix "{name}" "npm:dev:tsc" "npm:dev:vite" "npm:dev:server" "npm:dev:electron"

# Claude Browser Automation Extension - Windows setup
# Run from PowerShell:  .\setup.ps1
# (If execution policy blocks:  powershell -ExecutionPolicy Bypass -File .\setup.ps1 )

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "    OK: $msg"   -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    !!  $msg"   -ForegroundColor Yellow }

Write-Host "Claude Browser Automation - Setup" -ForegroundColor Cyan

Write-Step "Checking Node.js"
try {
    $nodeVer = (node -v) -replace 'v',''
    $major = [int]($nodeVer.Split('.')[0])
    if ($major -lt 18) { throw "Node 18+ required (found $nodeVer)" }
    Write-OK "Node.js $nodeVer"
} catch {
    Write-Host "Node.js not found. Install Node 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Step "Preparing .env"
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-OK "Created .env from .env.example"
} else {
    Write-OK ".env already exists"
}

Write-Step "Installing dependencies"
npm install
Write-OK "Dependencies installed"

Write-Step "Generating signing secret (if default)"
$envContent = Get-Content .env -Raw
if ($envContent -match 'change-me-to-a-random-secret') {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ''
    (Get-Content .env) -replace 'change-me-to-a-random-secret', $secret | Set-Content .env
    Write-OK "Generated 64-char random signing secret in .env"
} else {
    Write-OK "SIGNING_SECRET already set"
}

Write-Step "Generating extension icons"
node generate-icons.js
Write-OK "Icons generated"

Write-Host "`nSetup complete." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit .env and set ANTHROPIC_API_KEY"
Write-Host "  2. Start the proxy:  npm start"
Write-Host "  3. Chrome -> chrome://extensions -> Developer mode -> Load unpacked -> select .\extension"
Write-Host "  4. Right-click the extension icon -> Options -> paste the SIGNING_SECRET from .env"
Write-Host ""
Write-Warn "The /api/claude-code endpoint is DISABLED by default. Only set ALLOW_CLAUDE_CODE_EXEC=true if you understand that it grants command execution on this machine."

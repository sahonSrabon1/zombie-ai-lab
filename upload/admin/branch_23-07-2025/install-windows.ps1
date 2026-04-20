# AI Management Dashboard - PowerShell Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Management Dashboard - Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Node.js is installed
if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = node --version
Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green

# Check if npm is available
if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not available" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$npmVersion = npm --version
Write-Host "npm found: $npmVersion" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create environment file if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating environment configuration..." -ForegroundColor Yellow
    
    $envContent = @"
# AI Management Dashboard Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3307
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3307
DATABASE_USER=root
DATABASE_PASSWORD=105585
DATABASE_NAME=modelsraver1
ELEVENLABS_API_KEY=your_api_key_here
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "Environment file created: .env.local" -ForegroundColor Green
} else {
    Write-Host "Environment file already exists: .env.local" -ForegroundColor Yellow
}

# Build the project
Write-Host ""
Write-Host "Building the project..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "Project built successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To start the production server:" -ForegroundColor Yellow
Write-Host "  npm run start" -ForegroundColor White
Write-Host ""
Write-Host "The dashboard will be available at:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Admin panel will be available at:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000/admin" -ForegroundColor White
Write-Host ""

# Ask if user wants to start the development server
$startDev = Read-Host "Would you like to start the development server now? (y/N)"
if ($startDev -eq "y" -or $startDev -eq "Y") {
    Write-Host "Starting development server..." -ForegroundColor Green
    npm run dev
} else {
    Write-Host "Setup complete. Run 'npm run dev' when ready to start." -ForegroundColor Green
}

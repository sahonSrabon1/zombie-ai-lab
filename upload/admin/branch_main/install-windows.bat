@echo off
echo ========================================
echo AI Management Dashboard - Windows Setup
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo Node.js found: 
node --version

:: Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo npm found:
npm --version
echo.

:: Install dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Create environment file if it doesn't exist
if not exist ".env.local" (
    echo Creating environment configuration...
    (
        echo # AI Management Dashboard Environment Variables
        echo NEXT_PUBLIC_API_URL=http://localhost:3307
        echo DATABASE_HOST=127.0.0.1
        echo DATABASE_PORT=3307
        echo DATABASE_USER=root
        echo DATABASE_PASSWORD=105585
        echo DATABASE_NAME=modelsraver1
        echo ELEVENLABS_API_KEY=your_api_key_here
    ) > .env.local
    echo Environment file created: .env.local
) else (
    echo Environment file already exists: .env.local
)

:: Build the project
echo.
echo Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo To start the development server:
echo   npm run dev
echo.
echo To start the production server:
echo   npm run start
echo.
echo The dashboard will be available at:
echo   http://localhost:3000
echo.
echo Admin panel will be available at:
echo   http://localhost:3000/admin
echo.
echo Press any key to exit...
pause >nul

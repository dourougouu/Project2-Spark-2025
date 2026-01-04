@echo off
echo ========================================
echo Stratos Backend API - Quick Start
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo.
    echo Please copy env.example to .env and configure your database settings:
    echo   copy env.example .env
    echo.
    echo Then edit .env with your database credentials.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server...
echo.
node server.js

pause


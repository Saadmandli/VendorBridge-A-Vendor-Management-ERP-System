@echo off
REM VendorBridge - zero-setup launcher (Windows). Only Node.js is required.
echo ============================================
echo   VendorBridge - starting up
echo ============================================

where node >nul 2>nul
if errorlevel 1 ( echo [X] Node.js not found. Install it from https://nodejs.org then re-run this file. & pause & exit /b 1 )

if not exist .env copy .env.example .env >nul

echo [1/2] Checking dependencies...
call npm.cmd install --legacy-peer-deps || ( echo [X] npm install failed & pause & exit /b 1 )

echo [2/2] Starting database + app...
echo      Open http://localhost:3000  (login: officer@vendorbridge.com / password123)
echo      Press Ctrl+C in this window to stop.
call npm.cmd run dev:local
pause

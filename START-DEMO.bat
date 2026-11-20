@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  py -3 preview_server.py
  exit /b %errorlevel%
)

where python >nul 2>nul
if not errorlevel 1 (
  python preview_server.py
  exit /b %errorlevel%
)

echo Python 3 was not found. Install Python 3, then double-click this file again.
echo To run the source version instead, install Node.js 18 or newer and run npm ci followed by npm run dev.
pause
exit /b 1

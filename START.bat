@echo off
title AURA 3D Universal Engineering Simulator
cd /d "%~dp0"

echo ============================================================
echo        AURA 3D UNIVERSAL ENGINEERING SIMULATOR
echo ============================================================
echo.
echo  [1/2] Opening browser at http://localhost:3000/ ...
start http://localhost:3000/
echo  [2/2] Starting high-speed local engine server...
echo.
echo  Press Ctrl+C in this window anytime to stop the simulator.
echo ============================================================
echo.

call npm.cmd run dev

if %errorlevel% neq 0 (
    echo.
    echo Server stopped or encountered an issue.
    pause
)

@echo off
title Upload Website to GitHub
cd /d "%~dp0"

echo ============================================================
echo         UPLOADING ALL FOLDERS & FILES TO GITHUB
echo ============================================================
echo.
echo Target Repository: https://github.com/YashKasat14/Car-3D-Model-TEST
echo.
echo [1/3] Staging files...
git add -A
git commit -m "Update website: clean folders and production files" 2>nul
echo.
echo [2/3] Uploading all folders directly to GitHub...
echo (If a GitHub sign-in window appears, click "Sign in with your browser")
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! All folders and files are now live on GitHub!
    echo ============================================================
) else (
    echo.
    echo If Git asked for login, complete the sign-in and run this script again.
)

echo.
pause

@echo off
REM ParkIt Android Development Environment Verification Script
REM Run this after installing Java and Android Studio

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  ParkIt Development Environment Verification          ║
echo ║  Java JDK + Android Studio Check                      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo Step 1: Checking Java Installation...
java -version 2>nul
if %errorlevel% equ 0 (
    echo ✓ Java is installed and accessible
) else (
    echo ✗ Java NOT found - please run installer
    echo   Guide: JAVA_ANDROID_INSTALL_GUIDE.md
)

echo.
echo Step 2: Checking JAVA_HOME environment variable...
if defined JAVA_HOME (
    echo ✓ JAVA_HOME = !JAVA_HOME!
) else (
    echo ✗ JAVA_HOME not set - please configure in Environment Variables
)

echo.
echo Step 3: Checking Android SDK Installation...
if exist "%LOCALAPPDATA%\Android\Sdk" (
    echo ✓ Android SDK found at: %LOCALAPPDATA%\Android\Sdk
) else (
    echo ✗ Android SDK NOT found
    echo   Expected location: %LOCALAPPDATA%\Android\Sdk
)

echo.
echo Step 4: Checking ANDROID_HOME environment variable...
if defined ANDROID_HOME (
    echo ✓ ANDROID_HOME = !ANDROID_HOME!
) else (
    echo ✗ ANDROID_HOME not set - please configure in Environment Variables
)

echo.
echo Step 5: Checking Android Debug Bridge (adb)...
adb version 2>nul
if %errorlevel% equ 0 (
    echo ✓ ADB is installed and accessible
) else (
    echo ✗ ADB NOT found - may need to restart PowerShell/Terminal
)

echo.
echo Step 6: Checking Android Studio installation...
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo ✓ Android Studio found at: C:\Program Files\Android\Android Studio
) else (
    echo ✗ Android Studio NOT found
    echo   Expected location: C:\Program Files\Android\Android Studio
)

echo.
echo Step 7: Checking Node.js and npm...
npm -v >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ npm is installed
    npm -v
) else (
    echo ✗ npm NOT found - please install Node.js from nodejs.org
)

echo.
echo ╔════════════════════════════════════════════════════════╗
if %errorlevel% equ 0 (
    echo ║           ✓ All required tools found!               ║
    echo ║     You can now build the Android APK              ║
) else (
    echo ║        ⚠ Some tools are missing or not in PATH     ║
    echo ║   Please complete the installation steps above      ║
)
echo ╚════════════════════════════════════════════════════════╝

echo.
echo 📝 IMPORTANT: If you just installed Java or Android Studio:
echo    - Restart PowerShell or Command Prompt for changes to take effect
echo    - Then run this script again to verify
echo.

pause

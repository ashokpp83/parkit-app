# Quick Verification Script for Java & Android Studio
# Run this in a NEW PowerShell window after closing the current one

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Environment Verification Script                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verifying Java installation..." -ForegroundColor Yellow
Write-Host ""

# Test Java
try {
    $javaVersion = & java -version 2>&1
    Write-Host "✓ Java is working!" -ForegroundColor Green
    Write-Host "  Version:" -ForegroundColor Cyan
    foreach ($line in $javaVersion) {
        Write-Host "    $line" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Java not found or not in PATH" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Solution: Make sure JAVA_HOME is set and you closed/reopened PowerShell" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verifying Android SDK tools..." -ForegroundColor Yellow
Write-Host ""

# Test adb
try {
    $adbVersion = & adb version 2>&1
    Write-Host "✓ Android Debug Bridge (adb) is working!" -ForegroundColor Green
    Write-Host "  Details:" -ForegroundColor Cyan
    $adbVersion | Select-Object -First 1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Cyan }
} catch {
    Write-Host "⚠ ADB not found (this is OK if Android Studio hasn't initialized SDK yet)" -ForegroundColor Yellow
    Write-Host "  It will be available after first Android Studio launch" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Checking environment variables..." -ForegroundColor Yellow
Write-Host ""

$javaHome = $env:JAVA_HOME
$androidHome = $env:ANDROID_HOME

if ($javaHome) {
    Write-Host "✓ JAVA_HOME = $javaHome" -ForegroundColor Green
} else {
    Write-Host "✗ JAVA_HOME not set" -ForegroundColor Red
}

if ($androidHome) {
    Write-Host "✓ ANDROID_HOME = $androidHome" -ForegroundColor Green
} else {
    Write-Host "⚠ ANDROID_HOME not set (will be created on first Android Studio launch)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ Verification Complete                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if ($javaHome) {
    Write-Host "🎉 You're ready to build the Android APK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Navigate to your ParkIt project and run:" -ForegroundColor Yellow
    Write-Host "  cd ""C:\Users\Ashok.Parasuraman\OneDrive - Wolters Kluwer\Ashok\Personal\Personal Projects\ParkIt App\Source\parkit-ui""" -ForegroundColor Cyan
    Write-Host "  npm run build" -ForegroundColor Cyan
    Write-Host "  npx cap add android" -ForegroundColor Cyan
    Write-Host "  npx cap sync" -ForegroundColor Cyan
    Write-Host "  npx cap open android" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Please restart PowerShell or check installation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Gray
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null

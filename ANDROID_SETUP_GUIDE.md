# ParkIt Android Development Setup Guide

## Overview
This guide will help you set up Android development tools to build native Android APKs for ParkIt using Capacitor.

## Prerequisites Required

### 1. Java Development Kit (JDK)
**Required Version:** JDK 11 or later (JDK 17 or 21 recommended)

**Installation Steps:**
1. Download from: https://www.oracle.com/java/technologies/downloads/
2. Choose Windows x64 installer (jdk-21_windows-x64_bin.exe or latest)
3. Run the installer and complete installation (default path: C:\Program Files\Java\jdk-21)
4. After installation, verify:
   ```powershell
   java -version
   javac -version
   ```

**Set Environment Variable (Windows):**
1. Open Environment Variables (Press Win+X → System → Advanced system settings)
2. Click "Environment Variables"
3. Under "System variables", click "New"
4. Variable name: `JAVA_HOME`
5. Variable value: `C:\Program Files\Java\jdk-21` (adjust version number)
6. Click OK and restart PowerShell

### 2. Android Studio & Android SDK
**Installation Steps:**
1. Download from: https://developer.android.com/studio
2. Run Android Studio installer
3. During setup, accept the default Android SDK location (typically: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`)
4. After installation, open Android Studio
5. Go to: SDK Manager → SDK Tools → Install:
   - Android SDK Build-Tools 35.0.0
   - Android Emulator (optional, for testing)
   - Android SDK Platform-tools

**Set Environment Variable (Windows):**
1. Open Environment Variables again
2. Create new System variable:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`
3. Edit "Path" variable and add: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk\platform-tools`
4. Restart PowerShell

**Verify Installation:**
```powershell
adb version
sdkmanager --list
```

### 3. Gradle (Usually installed with Android Studio)
If not installed, download from: https://gradle.org/releases/

## Next Steps After Installation

Once installed, run these commands from the ParkIt project:

```powershell
cd "C:\Users\Ashok.Parasuraman\OneDrive - Wolters Kluwer\Ashok\Personal\Personal Projects\ParkIt App\Source\parkit-ui"

# Add Android platform to Capacitor
npx cap add android

# Build the Android APK
npm run build
npx cap sync
npx cap open android
```

## Alternative: Use Cloud Build (Easier, No Local Setup)

If you prefer not to install Android development tools locally, use:
- **Capacitor Cloud Build**: https://capacitorjs.com/docs/guides/deploying-to-app-stores
- **Ionic Appflow**: https://ionicframework.com/appflow
- **Google Play Console**: Upload directly with Play Console build tools

## Troubleshooting

### "JAVA_HOME not set"
- Ensure JAVA_HOME environment variable is set correctly
- Restart PowerShell after setting the variable
- Verify with: `echo $env:JAVA_HOME`

### "ANDROID_HOME not set"
- Ensure ANDROID_HOME environment variable is set correctly
- Verify with: `echo $env:ANDROID_HOME`

### "SDK not found"
- Open Android Studio
- Go to SDK Manager and ensure Android SDK is installed
- Install missing SDK platforms

## Estimated Time
- Java JDK installation: 10-15 minutes
- Android Studio installation: 30-45 minutes (includes SDK download)
- Total setup: ~1 hour

## Support
If you encounter any issues, refer to:
- Android Studio Setup: https://developer.android.com/studio/intro
- Capacitor Android Setup: https://capacitorjs.com/docs/android
- Java Setup: https://www.oracle.com/java/technologies/javase-downloads.html

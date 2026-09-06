# Java & Android Studio Installation Guide for Windows

This guide will walk you through installing the required tools to build Android APKs for the ParkIt application.

## Prerequisites
- Windows 10 or later (64-bit)
- At least 8 GB RAM (16 GB recommended)
- At least 20 GB free disk space
- Administrator access to your computer
- Active internet connection

---

## Part 1: Install Java Development Kit (JDK)

### Step 1.1: Download Java JDK 21
1. Go to: https://www.oracle.com/java/technologies/downloads/
2. Look for "JDK 21" (or latest LTS version)
3. Click on "JDK 21"
4. Select **"Windows x64 Installer"** (.exe file)
5. Accept the license agreement
6. Download the file (~150 MB)

### Step 1.2: Install Java JDK
1. Run the downloaded `.exe` installer
2. Click "Next" on the welcome screen
3. Accept the default installation path: `C:\Program Files\Java\jdk-21`
4. Click "Next" and then "Install"
5. Wait for the installation to complete (2-3 minutes)
6. Click "Finish"

### Step 1.3: Set JAVA_HOME Environment Variable
1. Press `Win + X` and select "System"
2. Click "Advanced system settings" on the right
3. Click "Environment Variables" button at the bottom
4. Under "User variables", click "New..."
5. **Variable name:** `JAVA_HOME`
6. **Variable value:** `C:\Program Files\Java\jdk-21`
7. Click "OK"

### Step 1.4: Add Java to PATH
1. In the Environment Variables window, find the "Path" variable under "User variables"
2. Click "Edit..."
3. Click "New"
4. Add: `C:\Program Files\Java\jdk-21\bin`
5. Click "OK" three times to close all windows

### Step 1.5: Verify Java Installation
1. Press `Win + X` and select "Windows Terminal" or "PowerShell"
2. Type: `java -version`
3. You should see output like:
   ```
   java version "21.0.1" 2023-10-17 LTS
   Java(TM) SE Runtime Environment (build 21.0.1+12-LTS-29)
   ```

✅ If you see version information, Java is installed correctly!

---

## Part 2: Install Android Studio

### Step 2.1: Download Android Studio
1. Go to: https://developer.android.com/studio
2. Click the large "Download Android Studio" button
3. Accept the terms and download the Windows installer (.exe file)
4. This is ~900 MB and may take several minutes

### Step 2.2: Install Android Studio
1. Run the Android Studio installer
2. Click "Next" on the welcome screen
3. Choose "Standard" installation (includes all recommended SDK components)
4. Accept the default paths:
   - Install location: `C:\Program Files\Android\Android Studio`
   - Android SDK location: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`
5. Click "Next" and "Install"
6. ⏳ **Wait for installation** - This takes 5-15 minutes depending on your internet speed
7. Check "Start Android Studio" before clicking "Finish"

### Step 2.3: Android Studio First-Run Setup
1. Android Studio will launch and show a setup wizard
2. Click "Next" and follow the prompts
3. When asked, choose "Standard" installation
4. Select to download the latest SDK (API 34)
5. ⏳ **Be patient** - Android Studio downloads and installs SDK components (10-30 minutes)
6. Once complete, you'll see the welcome screen with "Start a new Android Studio project"

### Step 2.4: Set ANDROID_HOME Environment Variable
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", click "New..."
5. **Variable name:** `ANDROID_HOME`
6. **Variable value:** `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`
   (Replace `[YourUsername]` with your actual Windows username)
7. Click "OK"

### Step 2.5: Add Android Tools to PATH
1. In Environment Variables, find or create the "Path" variable
2. Click "Edit..."
3. Click "New" and add:
   - `C:\Users\[YourUsername]\AppData\Local\Android\Sdk\tools`
   - `C:\Users\[YourUsername]\AppData\Local\Android\Sdk\platform-tools`
   (Replace `[YourUsername]` with your actual Windows username)
4. Click "OK" three times

### Step 2.6: Verify Android Installation
1. **Restart PowerShell/Terminal** (important - environment variables need to reload)
2. Press `Win + X` and select "Windows Terminal" or "PowerShell"
3. Type: `adb version`
4. You should see output with Android Debug Bridge version information

✅ If you see version information, Android is installed correctly!

---

## Part 3: Verify All Installations

Open a **new PowerShell** window and run both commands:

```powershell
java -version
adb version
```

You should see version information for both.

---

## Part 4: Build Your First APK

Navigate to your ParkIt project and run:

```powershell
# Navigate to project
cd "C:\Users\Ashok.Parasuraman\OneDrive - Wolters Kluwer\Ashok\Personal\Personal Projects\ParkIt App\Source\parkit-ui"

# Build the web bundle
npm run build

# Add Android platform (only run once)
npx cap add android

# Sync web assets to Android
npx cap sync

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
2. Wait for the build to complete
3. You'll see "Build successful" message

---

## Troubleshooting

### "java: command not found"
- ✅ Did you restart PowerShell after setting JAVA_HOME?
- ✅ Is the JAVA_HOME environment variable set correctly?
- Run: `echo $env:JAVA_HOME` (should show Java path)

### "adb: command not found"
- ✅ Did you restart PowerShell after setting ANDROID_HOME?
- ✅ Is the ANDROID_HOME environment variable set correctly?
- Run: `echo $env:ANDROID_HOME` (should show SDK path)

### "Android Studio won't start"
- Make sure your PC has at least 8 GB RAM
- Clear Windows temp files (Disk Cleanup)
- Reinstall Android Studio to a shorter path (avoid spaces)

### Installation is very slow
- Android Studio downloads gigabytes of SDK components
- This is normal on first launch
- Estimated time: 30-45 minutes depending on internet
- Do NOT interrupt the process

### Gradle build fails in Android Studio
- Click "File" → "Sync Now" (let Gradle re-download dependencies)
- This may take 5-10 minutes on first run

---

## Next Steps

After successful installation:

1. ✅ Build the web bundle: `npm run build`
2. ✅ Add Android: `npx cap add android`
3. ✅ Sync assets: `npx cap sync`
4. ✅ Open in Android Studio: `npx cap open android`
5. ✅ Build APK in Android Studio
6. ✅ Test on Android emulator or device

---

## Need Help?

- Java troubleshooting: https://www.java.com/en/download/help/
- Android Studio help: https://developer.android.com/studio/intro
- Capacitor docs: https://capacitorjs.com/docs
- Common Android build issues: https://developer.android.com/studio/build/gradle-tips

**Estimated total setup time:** 1-2 hours (mostly automated downloads)

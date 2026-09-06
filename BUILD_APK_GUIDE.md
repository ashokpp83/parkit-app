# 🔨 BUILD APK IN ANDROID STUDIO - QUICK GUIDE

## 📍 EXACT MENU PATH

```
Menu Bar: Build
         ↓
    Build Bundle(s) / APK(s)
         ↓
       Build APK(s)
```

## ⏬ STEP-BY-STEP WITH SCREENSHOTS

### Step 1: Wait for Gradle Sync
- Look at the **bottom of Android Studio**
- Wait until you see: `"Gradle build finished"`
- First time: Usually takes 1-2 minutes (downloading dependencies)

### Step 2: Click "Build" Menu
- Top menu bar → Click **Build**

### Step 3: Select "Build Bundle(s) / APK(s)"
- From dropdown → Click **Build Bundle(s) / APK(s)**

### Step 4: Select "Build APK(s)"
- From submenu → Click **Build APK(s)**
- ⚠️ Don't click "Build Bundle" (that's for Play Store)

### Step 5: Wait for Build to Complete
- Watch the **Build** tab at the bottom
- Should take 2-3 minutes
- Look for: ✅ **"Build successful"** message

## ✅ SUCCESS CHECKLIST

After build completes, you should see:

```
✓ Build tab shows "Gradle build finished"
✓ No red error text in Build tab
✓ Message displays: "APK(s) generated successfully"
✓ File exists: android/app/build/outputs/apk/debug/app-debug.apk
```

## 📁 YOUR APK LOCATION

```
parkit-ui/
└── android/
    └── app/
        └── build/
            └── outputs/
                └── apk/
                    └── debug/
                        └── app-debug.apk  ← Your APK file
```

## ⏱️ Build Timeline

| Phase | Time | What's Happening |
|-------|------|------------------|
| Gradle Sync | 1-2 min | Downloading dependencies |
| Compilation | 1-2 min | Compiling code |
| Build | 1-2 min | Creating APK package |
| **Total** | **2-3 min** | Complete APK ready |

## 🆘 TROUBLESHOOTING

### If build fails:
1. Try: **Build → Clean Project**
2. Then: **Build → Build APK(s)** again
3. If still failing:
   - **File → Invalidate Caches → Invalidate and Restart**
   - Wait for Android Studio to restart
   - Try building again

### If you see errors:
- Check the **Build** tab for error details
- Most common: Missing JAVA_HOME environment variable
- Solution: Set `JAVA_HOME=C:\Program Files\Java\jdk-21`

## 🎯 AFTER BUILD COMPLETES

You can:
- ✅ **View the APK** - Right-click on app → **Show in Explorer**
- ✅ **Install on emulator** - Run → Select emulator
- ✅ **Install on device** - Connect USB → Run → Select device
- ✅ **Share the APK** - Copy file to send to others

## 📝 NOTES

- **Debug APK**: Good for testing (~50-80 MB)
- **Release APK**: Needed for Play Store (requires signing key)
- **First build**: Takes longer because of dependency downloads
- **Subsequent builds**: Much faster (2-3 minutes)

---

**Ready? Go to Android Studio and click: Build → Build Bundle(s)/APK(s) → Build APK(s)** 🚀

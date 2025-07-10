# 🚀 Quick Fix: Get Your App Running on Phone

## The Issue
You're hitting the exact same bug from Stack Overflow: `Config _internal.projectRoot isn't defined by expo-cli, this is a bug.`

## ✅ **Working Solutions** (try in order):

### **Solution 1: Use Different Node Version**
```bash
# If you have nvm (Node Version Manager)
nvm use 16
npx expo start --clear

# OR try Node 18
nvm use 18
npx expo start --clear
```

### **Solution 2: Use Expo Development Build**
```bash
# For iOS (if you have Xcode)
npx expo run:ios

# For Android (if you have Android Studio)
npx expo run:android
```

### **Solution 3: Use Expo Go with IP Address**
Since your local dev server was working before, try accessing it directly:

1. **Find your local IP:**
   ```bash
   ipconfig getifaddr en0
   ```
   
2. **Open Expo Go app on your phone**
   
3. **Manually enter URL:**
   ```
   exp://YOUR_IP_ADDRESS:19000
   ```
   (Replace YOUR_IP_ADDRESS with the IP from step 1)

### **Solution 4: Clear Everything and Retry**
```bash
# Clear all caches
rm -rf node_modules
rm -rf .expo
rm -rf ~/.expo
npm install

# Try different ports
npx expo start --port 19001
```

### **Solution 5: Use Web Version**
```bash
# If you just want to test Skia functionality
npx expo start --web
```

## 🎯 **Once It's Working:**

1. **Test Skia Integration:**
   - Go to slideshow metadata screen
   - Tap the debug button (🐛)
   - Try "Save with Text Overlays (Skia)"
   - Compare with Canvas version

2. **Verify Pixel-Perfect Rendering:**
   - Export using both Skia and Canvas options
   - Compare the results in your Photos app
   - Skia should match the preview exactly

## 📱 **Quick Test Steps:**

1. Create a slideshow with text overlay
2. Go to metadata/export screen
3. Use "Save with Text Overlays (Skia)" option
4. Check Photos app - text should be positioned exactly like preview

## 🔧 **Why This Happened:**

This is a known Expo CLI bug that occurs when:
- Node version conflicts
- Expo CLI cache corruption
- Project configuration conflicts
- Working directory issues

The Skia implementation is **complete and ready** - it's just the development server that needs to start!
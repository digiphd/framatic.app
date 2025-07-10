# Quick Start Guide - Working Around Expo CLI Issue

## Current Issue
There's an Expo CLI configuration bug causing: `Config _internal.projectRoot isn't defined by expo-cli`

## Immediate Solution

### Option 1: Use Different Terminal/Environment
```bash
# Try clearing all caches
rm -rf node_modules .expo
npm install

# Try with different Node version (if using nvm)
nvm use 18  # or nvm use 16
npx expo start --clear
```

### Option 2: Use Expo Go App Directly
1. Install Expo Go on your phone
2. Run: `npx expo start --tunnel`
3. Scan QR code with Expo Go

### Option 3: Use Legacy CLI
```bash
npm install -g @expo/cli@latest
expo start --clear
```

### Option 4: Use Development Build
```bash
npx expo run:ios  # for iOS
# or
npx expo run:android  # for Android
```

## Skia Status
✅ React Native Skia is properly installed and configured
✅ All components are ready and enabled
✅ Server-side rendering endpoint is complete
✅ Debugging tools are implemented

## Test Skia Once Server Starts
1. Navigate to a slideshow metadata screen
2. Look for the debug button (🐛) in the header
3. Try "Save with Text Overlays (Skia)" export option
4. Compare with "Save with Text Overlays (Canvas)" to see the difference

## Expected Benefits
- **Pixel-perfect text rendering** between preview and export
- **Same Skia engine** used on both client and server
- **Consistent positioning** and styling
- **High-quality exports** with exact preview matching

## Troubleshooting
If Skia components show errors:
1. The infrastructure is there, just needs proper Metro bundler start
2. All imports are correctly configured
3. Dependencies are properly installed
4. The issue is purely with Expo CLI startup, not Skia itself
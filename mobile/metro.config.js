const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for React Native Skia
config.resolver.assetExts.push('obj', 'gltf', 'glb', 'bin', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg');

module.exports = config;
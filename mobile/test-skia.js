// Simple test to check if Skia can be imported
console.log('Testing Skia import...');

try {
  const skia = require('@shopify/react-native-skia');
  console.log('✅ Skia imported successfully!');
  console.log('Available Skia exports:', Object.keys(skia));
} catch (error) {
  console.log('❌ Skia import failed:', error.message);
}

try {
  const reanimated = require('react-native-reanimated');
  console.log('✅ Reanimated imported successfully!');
} catch (error) {
  console.log('❌ Reanimated import failed:', error.message);
}
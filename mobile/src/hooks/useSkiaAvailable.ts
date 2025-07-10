import { useState, useEffect } from 'react';

export function useSkiaAvailable(): boolean {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if Skia is available
    const checkSkiaAvailability = async () => {
      try {
        // Try to import Skia
        await import('@shopify/react-native-skia');
        setIsAvailable(true);
      } catch (error) {
        console.log('Skia not available:', error);
        setIsAvailable(false);
      }
    };

    checkSkiaAvailability();
  }, []);

  return isAvailable;
}
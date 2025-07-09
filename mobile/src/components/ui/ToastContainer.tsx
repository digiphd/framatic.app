import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { ToastNotification, ToastProps, toastManager } from './ToastNotification';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((newToasts) => {
      setToasts(newToasts);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
      {toasts.map((toast, index) => (
        <View
          key={`toast-${index}`}
          style={{
            top: index * 70, // Stack toasts vertically
          }}
        >
          <ToastNotification
            {...toast}
          />
        </View>
      ))}
    </View>
  );
}
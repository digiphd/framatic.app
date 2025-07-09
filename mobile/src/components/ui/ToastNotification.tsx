import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onHide?: () => void;
  action?: {
    text: string;
    onPress: () => void;
  };
}

export function ToastNotification({ 
  visible, 
  message, 
  type = 'info', 
  duration = 4000, 
  onHide,
  action
}: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      show();
    } else {
      hide();
    }
  }, [visible]);

  const show = () => {
    clearTimeout(timeoutRef.current);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after duration
    timeoutRef.current = setTimeout(() => {
      onHide?.();
    }, duration);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSwipeUp = () => {
    // Simple tap to dismiss
    onHide?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.primary;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 1000,
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim }
        ],
        paddingHorizontal: spacing.lg,
      }}
    >
      <TouchableOpacity
        onPress={handleSwipeUp}
        activeOpacity={0.9}
        style={{
          backgroundColor: getBackgroundColor(),
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons 
          name={getIcon()} 
          size={24} 
          color="white" 
          style={{ marginRight: spacing.sm }}
        />
        
        <Text
          style={{
            color: 'white',
            fontSize: 14,
            fontWeight: '500',
            flex: 1,
            lineHeight: 18,
          }}
        >
          {message}
        </Text>
        
        {action && (
          <TouchableOpacity
            onPress={action.onPress}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: spacing.sm,
              paddingVertical: 6,
              borderRadius: borderRadius.sm,
              marginLeft: spacing.sm,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {action.text}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={onHide}
          style={{
            marginLeft: spacing.sm,
            padding: 4,
          }}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Toast manager for global toasts
class ToastManager {
  private static instance: ToastManager;
  private toasts: Map<string, ToastProps> = new Map();
  private listeners: Set<(toasts: ToastProps[]) => void> = new Set();

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  show(toast: Omit<ToastProps, 'visible' | 'onHide'> & { id?: string }) {
    const id = toast.id || Date.now().toString();
    const toastWithActions: ToastProps = {
      ...toast,
      visible: true,
      onHide: () => this.hide(id),
    };
    
    this.toasts.set(id, toastWithActions);
    this.notifyListeners();
    
    return id;
  }

  hide(id: string) {
    this.toasts.delete(id);
    this.notifyListeners();
  }

  hideAll() {
    this.toasts.clear();
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastProps[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const toastArray = Array.from(this.toasts.values());
    this.listeners.forEach(listener => listener(toastArray));
  }
}

export const toastManager = ToastManager.getInstance();

// Helper functions for common toast types
export const showSuccessToast = (message: string, action?: { text: string; onPress: () => void }) => {
  return toastManager.show({
    message,
    type: 'success',
    action,
  });
};

export const showErrorToast = (message: string, action?: { text: string; onPress: () => void }) => {
  return toastManager.show({
    message,
    type: 'error',
    duration: 6000, // Longer duration for errors
    action,
  });
};

export const showInfoToast = (message: string, action?: { text: string; onPress: () => void }) => {
  return toastManager.show({
    message,
    type: 'info',
    action,
  });
};

export const showWarningToast = (message: string, action?: { text: string; onPress: () => void }) => {
  return toastManager.show({
    message,
    type: 'warning',
    action,
  });
};
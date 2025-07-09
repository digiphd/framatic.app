import React from 'react';
import { Alert } from 'react-native';

export interface ErrorAlertOptions {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onCancel?: () => void;
  retryText?: string;
  cancelText?: string;
}

export function showErrorAlert(options: ErrorAlertOptions) {
  const {
    title = 'Oops! Something went wrong',
    message,
    error,
    onRetry,
    onCancel,
    retryText = 'Try Again',
    cancelText = 'OK'
  } = options;

  // Generate user-friendly error message
  let friendlyMessage = message || 'Sorry! We encountered an unexpected issue.';

  if (error) {
    const errorString = error instanceof Error ? error.message : String(error);
    
    // Map technical errors to user-friendly messages
    if (errorString.includes('AI service unavailable')) {
      friendlyMessage = 'Our AI service is temporarily unavailable. We\'ve created a slideshow using our templates instead.';
    } else if (errorString.includes('Generated using static fallback')) {
      friendlyMessage = 'AI services were busy, so we created your slideshow using our proven templates. It\'s ready to use!';
    } else if (errorString.includes('HTTP error! status: 503')) {
      friendlyMessage = 'Our servers are experiencing high traffic. Please try again shortly.';
    } else if (errorString.includes('HTTP error! status: 500')) {
      friendlyMessage = 'We encountered a server error. Our team has been notified.';
    } else if (errorString.includes('Failed to fetch') || errorString.includes('Network')) {
      friendlyMessage = 'Please check your internet connection and try again.';
    } else if (errorString.includes('timeout')) {
      friendlyMessage = 'The request took too long. Please try again.';
    } else if (errorString.includes('analysis not completed')) {
      friendlyMessage = 'Your images are still being processed. Please wait a moment and try again.';
    } else if (errorString.includes('Asset not found')) {
      friendlyMessage = 'Some of your selected images could not be found. Please try selecting different images.';
    } else if (errorString.includes('No assets selected')) {
      friendlyMessage = 'Please select at least one image to create a slideshow.';
    } else {
      // For unknown errors, show a generic friendly message
      friendlyMessage = 'Something unexpected happened. Please try again.';
    }
  }

  const buttons = [];
  
  if (onRetry) {
    buttons.push({
      text: retryText,
      onPress: onRetry,
      style: 'default' as const
    });
  }
  
  buttons.push({
    text: cancelText,
    onPress: onCancel,
    style: 'cancel' as const
  });

  Alert.alert(title, friendlyMessage, buttons);
}

// Specific error handlers for common scenarios
export const ErrorHandlers = {
  slideshowGeneration: (error: Error | string, onRetry?: () => void) => {
    showErrorAlert({
      title: 'Slideshow Creation Failed',
      message: 'We couldn\'t create your slideshow right now.',
      error,
      onRetry,
      retryText: 'Try Again'
    });
  },

  imageUpload: (error: Error | string, onRetry?: () => void) => {
    showErrorAlert({
      title: 'Upload Failed',
      message: 'We couldn\'t upload your images.',
      error,
      onRetry,
      retryText: 'Try Again'
    });
  },

  networkError: (error: Error | string, onRetry?: () => void) => {
    showErrorAlert({
      title: 'Connection Problem',
      message: 'Please check your internet connection.',
      error,
      onRetry,
      retryText: 'Retry'
    });
  },

  contextSave: (error: Error | string, onRetry?: () => void) => {
    showErrorAlert({
      title: 'Settings Not Saved',
      message: 'We couldn\'t save your preferences.',
      error,
      onRetry,
      retryText: 'Try Again'
    });
  },

  smartTemplates: (error: Error | string, onRetry?: () => void) => {
    showErrorAlert({
      title: 'Smart Recommendations Unavailable',
      message: 'We\'ll use our default templates instead.',
      error,
      onRetry,
      retryText: 'Try Smart Templates Again',
      cancelText: 'Continue with Defaults'
    });
  }
};

// Loading state error helper
export function handleAsyncError<T>(
  promise: Promise<T>,
  errorHandler: (error: Error | string) => void
): Promise<T | null> {
  return promise.catch((error) => {
    errorHandler(error);
    return null;
  });
}
import React from 'react';

declare module 'react-native-toast-message' {
  interface ToastProps {
    type?: 'success' | 'error' | 'info';
    text1?: string;
    position?: 'top' | 'bottom';
    visibilityTime?: number;
    autoHide?: boolean;
  }

  interface Toast {
    show(props: ToastProps): void;
  }

  const toast: Toast;
  export default toast;
  export const Toast: React.ComponentType<{}>;
} 
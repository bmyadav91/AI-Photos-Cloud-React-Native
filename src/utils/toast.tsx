import Toast from 'react-native-toast-message';

export const showToast = (
  message: string,
  type: "success" | "error" | "info" = "error",
  duration: number = 5000
) => {
  Toast.show({
    type,
    text1: message,
    position: "top",
    visibilityTime: duration,
    autoHide: true,
  });
};

export const ToastWrapper = () => <Toast />;

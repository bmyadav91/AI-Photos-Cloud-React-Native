import { ImageSourcePropType } from 'react-native';

// Define icon paths
export const icons = {
  logo: require('../../assets/images/logo.png'),
  home: require('../../assets/icons/home.png'),
  upload: require('../../assets/icons/upload.png'),
  settings: require('../../assets/icons/settings.png'),
  google: require('../../assets/icons/google.png'),
  trash: require('../../assets/icons/delete.png'),
  person: require('../../assets/icons/person-add-outline.png'),
  download: require('../../assets/icons/download.png'),
  back_btn: require('../../assets/icons/arrow-back-circle.png'),
  checkmark: require('../../assets/icons/check-mark.png'),
  close: require('../../assets/icons/close.png'),
  loading: require('../../assets/images/loading.webp'),
  load_more: require('../../assets/images/load_more.png'),
  checkmark_circle: require('../../assets/icons/checkmark-filled.png'),
  close_circle: require('../../assets/icons/close-filled.png'),
  chevron_forward: require('../../assets/icons/chevron-forward.png'),
  document_text_outline: require('../../assets/icons/privacy-policy.png'),
  logout: require('../../assets/icons/turn-off.png'),
  // Add more icons as needed
} as const;

// Type for icon names
export type IconName = keyof typeof icons;

// Helper function to get icon source
export const getIconSource = (name: IconName): ImageSourcePropType => {
  return icons[name];
}; 
export const APP_CONSTANTS = {
  // App Name
  APP_NAME: 'whatbmphotos',

  // API Endpoints
  API_BASE_URL: 'YOUR_API_BASE_URL',
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: '@auth_token',
    USER_DATA: '@user_data',
  },
  
  // Routes
  ROUTES: {
    LOGIN: 'Login',
    TERMS: 'Terms',
    HOME: 'Home',
    FACE_ALBUM: 'Face Album',
    UPLOAD: 'Upload',
    SETTINGS: 'Settings',
  },
  
  // Toast Messages
  TOAST_MESSAGES: {
    LOGIN_SUCCESS: 'Successfully logged in',
    LOGIN_ERROR: 'Invalid credentials',
    UPLOAD_SUCCESS: 'Photo uploaded successfully',
    UPLOAD_ERROR: 'Failed to upload photo',
    NETWORK_ERROR: 'Please check your internet connection',
  },
  
  // Supported Languages
  LANGUAGES: {
    ENGLISH: 'en',
    SPANISH: 'es',
    FRENCH: 'fr',
  },
  
  // Default Language
  DEFAULT_LANGUAGE: 'en',
  
  // Image Upload
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/heic'],
}; 
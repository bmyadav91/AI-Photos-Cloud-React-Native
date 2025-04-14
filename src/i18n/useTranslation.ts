import { useLanguage } from './LanguageContext';
import { translations } from './config';

type TranslationKey = keyof typeof translations.en;

const DEFAULT_LANGUAGE = 'en';

export const useTranslation = () => {
  const languageContext = useLanguage();

  const t = (key: string) => {
    try {
      // Split the key into parts (e.g., 'login.title' -> ['login', 'title'])
      const keys = key.split('.');
      
      // Get the translation object for current language, fallback to English if not found
      const translationObj = translations[languageContext.currentLanguage] || translations[DEFAULT_LANGUAGE];
      
      // Navigate through the translation object using the keys
      let value: any = translationObj;
      for (const k of keys) {
        value = value?.[k];
        // If value is undefined, try to get it from English
        if (value === undefined) {
          value = translations[DEFAULT_LANGUAGE];
          for (const fallbackKey of keys) {
            value = value?.[fallbackKey];
            if (value === undefined) {
              console.warn(`Translation missing for key: ${key}`);
              return key;
            }
          }
          return value;
        }
      }
      return value;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  };

  return { t, language: languageContext };
};

export default useTranslation; 
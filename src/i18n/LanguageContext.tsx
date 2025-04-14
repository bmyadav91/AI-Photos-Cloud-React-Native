import React, { createContext, useContext, useState, useEffect } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import { LanguageCode, languages } from './config';

type LanguageContextType = {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const DEFAULT_LANGUAGE: LanguageCode = 'en';
const LANGUAGE_STORAGE_KEY = 'selectedLanguage';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await EncryptedStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage && Object.values(languages).some(lang => lang.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage as LanguageCode);
      } else {
        // Only set and save default language if no valid language is saved
        setCurrentLanguage(DEFAULT_LANGUAGE);
        try {
          await EncryptedStorage.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
        } catch (saveError) {
          console.error('Error saving default language to EncryptedStorage:', saveError);
        }
      }
    } catch (error) {
      console.error('Error loading saved language from EncryptedStorage:', error);
      console.error('Error details:', JSON.stringify(error));
      setCurrentLanguage(DEFAULT_LANGUAGE);
    }
  };

  const setLanguage = async (language: LanguageCode) => {
    try {
      await EncryptedStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error saving language to EncryptedStorage:', error);
      console.error('Error details:', JSON.stringify(error));
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider; 
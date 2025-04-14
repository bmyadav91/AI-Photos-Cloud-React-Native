import en from './locales/en';
import hi from './locales/hi';
import hin from './locales/hin';

export type LanguageCode = 'en' | 'hin' | 'hi';

export const languages = {
  English: { code: 'en' as LanguageCode, name: 'English', icon: 'A' },
  Hinglish: { code: 'hin' as LanguageCode, name: 'Hinglish', icon: 'HIN' },
  Hindi: { code: 'hi' as LanguageCode, name: 'हिंदी', icon: 'अ' },
};

export const translations = {
  en,
  hin,
  hi,
};

export type LanguageKey = keyof typeof languages;

const config = {
  languages,
  translations,
};

export default config; 
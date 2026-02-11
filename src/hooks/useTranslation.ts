import { Language, getTranslations } from '../locales';

export function useTranslation(language: Language) {
  return getTranslations(language);
}

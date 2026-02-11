import { getTranslations } from '../locales';
import type { Language } from '../locales';

export function useTranslation(language: Language) {
  return getTranslations(language);
}

import type { Language } from '../locales';

interface LanguageToggleProps {
  language: Language;
  onToggle: () => void;
}

export function LanguageToggle({ language, onToggle }: LanguageToggleProps) {
  return (
    <button
      className="icon-button"
      onClick={onToggle}
      aria-label={language === 'ja' ? 'Switch to English' : '日本語に切り替え'}
      title={language === 'ja' ? 'English' : '日本語'}
    >
      {language === 'ja' ? 'EN' : 'JA'}
    </button>
  );
}

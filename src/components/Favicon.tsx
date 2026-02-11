import { useEffect } from 'react';
import type { Theme } from '../utils/localStorage';

interface FaviconProps {
  theme: Theme;
}

export function Favicon({ theme }: FaviconProps) {
  useEffect(() => {
    // Update favicon based on theme
    const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = theme === 'dark' ? '/favicon-dark.svg' : '/favicon-light.svg';
    }
  }, [theme]);

  return null;
}

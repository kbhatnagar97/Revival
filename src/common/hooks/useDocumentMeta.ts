import { useEffect } from 'react';

interface UseDocumentMetaProps {
  title: string;
  favicon?: string;
}

export const useDocumentMeta = ({ title, favicon }: UseDocumentMetaProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update favicon if provided
    if (favicon) {
      const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (existingLink) {
        existingLink.href = favicon;
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = favicon;
        document.head.appendChild(link);
      }
    }

    // Cleanup function to reset to default
    return () => {
      document.title = 'Revival';
      const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (existingLink) {
        existingLink.href = '/bulb-favicon.png';
      }
    };
  }, [title, favicon]);
};

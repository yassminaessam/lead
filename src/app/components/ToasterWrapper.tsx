import { useLanguage } from '../contexts/LanguageContext';
import { Toaster } from './ui/sonner';

export function ToasterWrapper() {
  const { language } = useLanguage();

  return (
    <Toaster 
      position="top-center" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      toastOptions={{
        style: {
          fontFamily: 'inherit',
        },
      }}
    />
  );
}

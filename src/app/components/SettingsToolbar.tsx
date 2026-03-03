import { Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function SettingsToolbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative overflow-hidden"
        title={theme === 'light' ? t('dark_mode') : t('light_mode')}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      {/* Language Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title={t('language')}>
            <Globe className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onClick={() => setLanguage('ar')}
            className={language === 'ar' ? 'bg-accent' : ''}
          >
            <span className="mr-2">🇸🇦</span>
            {t('arabic')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-accent' : ''}
          >
            <span className="mr-2">🇬🇧</span>
            {t('english')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

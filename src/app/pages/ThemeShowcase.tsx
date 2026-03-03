import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Sparkles, 
  Palette, 
  Languages, 
  Moon, 
  Sun,
  CheckCircle,
  Code,
  Zap
} from 'lucide-react';

export default function ThemeShowcase() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="p-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-12 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-12 h-12" />
            <h1 className="text-5xl font-bold">
              {language === 'ar' ? 'المظهر الجديد' : 'New Elite Theme'}
            </h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl">
            {language === 'ar' 
              ? 'تجربة مستخدم حديثة واحترافية مع دعم كامل للوضع الليلي والنهاري واللغة العربية والإنجليزية' 
              : 'Modern and professional user experience with full support for dark/light modes and Arabic/English languages'}
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Theme Toggle */}
        <Card className="card-hover border-2">
          <CardHeader>
            <div className="p-3 bg-primary rounded-xl w-fit mb-3">
              {theme === 'light' ? (
                <Sun className="w-6 h-6 text-white" />
              ) : (
                <Moon className="w-6 h-6 text-white" />
              )}
            </div>
            <CardTitle>
              {language === 'ar' ? 'وضع العرض' : 'Display Mode'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'تبديل بين الوضع الليلي والنهاري' : 'Toggle between dark and light modes'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={toggleTheme} className="w-full btn-elite">
              {theme === 'light' ? t('dark_mode') : t('light_mode')}
            </Button>
          </CardContent>
        </Card>

        {/* Language Toggle */}
        <Card className="card-hover border-2">
          <CardHeader>
            <div className="p-3 bg-success rounded-xl w-fit mb-3">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <CardTitle>
              {language === 'ar' ? 'اللغة' : 'Language'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'تبديل بين العربية والإنجليزية' : 'Switch between Arabic and English'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={toggleLanguage} className="w-full bg-success hover:bg-success/90 hover:shadow-lg transition-all">
              {language === 'ar' ? '🇬🇧 English' : '🇸🇦 العربية'}
            </Button>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="card-hover border-2">
          <CardHeader>
            <div className="p-3 bg-warning rounded-xl w-fit mb-3">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <CardTitle>
              {language === 'ar' ? 'ألوان احترافية' : 'Professional Colors'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'لوحة ألوان حديثة ومتناسقة' : 'Modern and harmonious color palette'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="w-12 h-12 rounded-lg bg-primary shadow-md"></div>
              <div className="w-12 h-12 rounded-lg bg-success shadow-md"></div>
              <div className="w-12 h-12 rounded-lg bg-warning shadow-md"></div>
              <div className="w-12 h-12 rounded-lg bg-destructive shadow-md"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            {language === 'ar' ? 'المميزات الرئيسية' : 'Key Features'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                icon: CheckCircle, 
                title: language === 'ar' ? 'تصميم حديث وأنيق' : 'Modern & Elegant Design',
                desc: language === 'ar' ? 'واجهة مستخدم عصرية بتأثيرات بصرية متقدمة' : 'Contemporary UI with advanced visual effects'
              },
              { 
                icon: CheckCircle, 
                title: language === 'ar' ? 'دعم كامل للـ RTL' : 'Full RTL Support',
                desc: language === 'ar' ? 'دعم مثالي للغة العربية من اليمين لليسار' : 'Perfect right-to-left support for Arabic'
              },
              { 
                icon: CheckCircle, 
                title: language === 'ar' ? 'انتقالات سلسة' : 'Smooth Transitions',
                desc: language === 'ar' ? 'رسوم متحركة وانتقالات ناعمة' : 'Smooth animations and transitions'
              },
              { 
                icon: CheckCircle, 
                title: language === 'ar' ? 'ألوان متناسقة' : 'Harmonious Colors',
                desc: language === 'ar' ? 'لوحة ألوان احترافية ومتوازنة' : 'Professional and balanced color scheme'
              },
              { 
                icon: CheckCircle, 
                title: language === 'ar' ? 'تجربة محسّنة' : 'Enhanced UX',
                desc: language === 'ar' ? 'تجربة مستخدم محسنة للإنتاجية' : 'Optimized user experience for productivity'
              },
              { 
                icon: CheckCircle, 
                title: language === 'ar' ? 'متوافق مع الأجهزة' : 'Device Responsive',
                desc: language === 'ar' ? 'يعمل بشكل مثالي على جميع الشاشات' : 'Works perfectly on all screen sizes'
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                <div className="p-2 bg-primary rounded-lg">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Preview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-6 h-6 text-primary" />
            {language === 'ar' ? 'التقنيات المستخدمة' : 'Technologies Used'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['React', 'TypeScript', 'Tailwind CSS v4', 'Radix UI'].map((tech) => (
              <div key={tech} className="p-4 bg-card rounded-xl border-2 border-border text-center font-semibold hover:border-primary transition-colors">
                {tech}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
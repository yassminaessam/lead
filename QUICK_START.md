# 🚀 Quick Start - Elite Theme

## تطبيق المظهر الجديد على أي صفحة / Apply Elite Theme to Any Page

### 📝 Template Example

```tsx
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Sparkles } from 'lucide-react';

export default function MyNewPage() {
  const { t, language } = useLanguage();

  return (
    <div className="p-8 space-y-8">
      {/* Elite Header */}
      <div className="relative">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary-solid/10 rounded-full blur-3xl"></div>
        <h1 className="text-4xl font-bold gradient-text relative">
          {t('page_title')}
        </h1>
        <p className="text-muted-foreground mt-2 relative">
          {t('page_description')}
        </p>
      </div>

      {/* Elite Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="card-hover border-2 bg-gradient-to-br from-card to-accent/20">
          <CardHeader>
            <div className="p-3 bg-gradient-to-br from-primary-solid to-purple-600 rounded-xl w-fit mb-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <CardTitle>{t('card_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Content here</p>
          </CardContent>
        </Card>
      </div>

      {/* Elite Button */}
      <Button className="btn-elite">
        {t('action_button')}
      </Button>
    </div>
  );
}
```

---

## 🎨 CSS Classes Reference

### Text & Typography
```tsx
className="gradient-text"           // Gradient text effect
className="text-gradient-elite"     // Alternative gradient
```

### Cards & Containers
```tsx
className="card-hover"              // Hover lift effect
className="card-glow"               // Glow on hover
className="glass-card"              // Glassmorphism
```

### Buttons
```tsx
className="btn-elite"               // Elite gradient button
className="hover-lift"              // Hover lift effect
```

### Badges
```tsx
className="badge-new"               // Blue badge
className="badge-success"           // Green badge
className="badge-warning"           // Orange badge
className="badge-danger"            // Red badge
```

### Backgrounds
```tsx
className="bg-gradient-elite"       // Primary gradient
className="bg-gradient-success"     // Success gradient
className="bg-gradient-warning"     // Warning gradient
className="bg-gradient-danger"      // Danger gradient
```

---

## 🌍 Translation Keys

### Add Your Translations

Edit `/src/app/contexts/LanguageContext.tsx`:

```typescript
const translations = {
  ar: {
    // Your new keys
    'my_page_title': 'عنوان صفحتي',
    'my_button': 'زر جديد',
  },
  en: {
    // Your new keys
    'my_page_title': 'My Page Title',
    'my_button': 'New Button',
  }
};
```

### Use Translations

```tsx
import { useLanguage } from '../contexts/LanguageContext';

const { t } = useLanguage();

<h1>{t('my_page_title')}</h1>
<button>{t('my_button')}</button>
```

---

## 🎯 Common Patterns

### Elite KPI Card
```tsx
<Card className="card-hover border-2 bg-gradient-to-br from-card to-accent/20">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-semibold">
      {t('total_count')}
    </CardTitle>
    <div className="p-2 bg-gradient-to-br from-primary-solid to-purple-600 rounded-lg">
      <Icon className="h-5 w-5 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-bold gradient-text">123</div>
    <p className="text-xs text-muted-foreground mt-2">
      {t('description')}
    </p>
  </CardContent>
</Card>
```

### Elite Section Header
```tsx
<div className="relative">
  <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary-solid/10 rounded-full blur-3xl"></div>
  <h1 className="text-4xl font-bold gradient-text relative">
    {t('section_title')}
  </h1>
  <p className="text-muted-foreground mt-2 relative">
    {t('section_description')}
  </p>
</div>
```

### Elite Feature List
```tsx
<div className="flex items-start gap-3 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
  <div className="p-2 bg-gradient-to-br from-primary-solid to-purple-600 rounded-lg">
    <Icon className="w-5 h-5 text-white" />
  </div>
  <div>
    <h4 className="font-semibold mb-1">{t('feature_title')}</h4>
    <p className="text-sm text-muted-foreground">{t('feature_desc')}</p>
  </div>
</div>
```

### Elite Button Group
```tsx
<div className="flex gap-3">
  <Button className="btn-elite">
    {t('primary_action')}
  </Button>
  <Button variant="outline" className="hover-lift">
    {t('secondary_action')}
  </Button>
</div>
```

---

## 🎨 Icon Gradients

```tsx
{/* Method 1: Background Gradient */}
<div className="p-3 bg-gradient-to-br from-primary-solid to-purple-600 rounded-xl w-fit">
  <Icon className="w-6 h-6 text-white" />
</div>

{/* Method 2: Different Colors */}
<div className="p-3 bg-gradient-to-br from-success to-emerald-600 rounded-xl w-fit">
  <Icon className="w-6 h-6 text-white" />
</div>

<div className="p-3 bg-gradient-to-br from-warning to-orange-600 rounded-xl w-fit">
  <Icon className="w-6 h-6 text-white" />
</div>
```

---

## 📱 Responsive Grid

```tsx
{/* 1 column mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

{/* 1 column mobile, 2 tablet, 4 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <Card>...</Card>
</div>
```

---

## 🎯 RTL Support

```tsx
{/* Auto RTL/LTR based on language */}
const { language } = useLanguage();

<div dir={language === 'ar' ? 'rtl' : 'ltr'}>
  {/* Content */}
</div>

{/* Conditional margins */}
<Icon className={`${language === 'ar' ? 'mr-3' : 'ml-3'} h-5 w-5`} />

{/* Or use Tailwind's rtl: prefix */}
<div className="ml-3 rtl:mr-3 rtl:ml-0">
  {/* Content */}
</div>
```

---

## ⚡ Performance Tips

### 1. Use CSS Variables
```tsx
// Good - Uses CSS variables
<div className="bg-primary">...</div>

// Avoid - Inline styles
<div style={{ background: '#667eea' }}>...</div>
```

### 2. Optimize Re-renders
```tsx
// Use useCallback for handlers
const handleClick = useCallback(() => {
  // Handler code
}, []);
```

### 3. Lazy Load Heavy Components
```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<div>{t('loading')}</div>}>
  <HeavyComponent />
</Suspense>
```

---

## 🎨 Color System

### Primary Colors
```tsx
className="text-primary-solid"      // Solid primary color
className="bg-primary-solid"        // Solid background
className="border-primary-solid"    // Solid border
```

### Semantic Colors
```tsx
className="text-success"            // Green
className="text-warning"            // Orange
className="text-destructive"        // Red
className="text-muted-foreground"   // Gray
```

### Backgrounds
```tsx
className="bg-background"           // Page background
className="bg-card"                 // Card background
className="bg-accent"               // Accent background
className="bg-muted"                // Muted background
```

---

## 🔧 Debugging

### Check Current Theme
```tsx
import { useTheme } from '../contexts/ThemeContext';

const { theme } = useTheme();
console.log('Current theme:', theme);
```

### Check Current Language
```tsx
import { useLanguage } from '../contexts/LanguageContext';

const { language } = useLanguage();
console.log('Current language:', language);
```

---

## 📚 Resources

- **Full Documentation**: `THEME_GUIDE.md`
- **Arabic README**: `README_AR.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Translation Keys**: `/src/app/contexts/LanguageContext.tsx`
- **Theme Variables**: `/src/styles/theme.css`
- **Elite Utilities**: `/src/styles/elite.css`

---

## ✅ Checklist for New Pages

- [ ] Import `useLanguage` for translations
- [ ] Use `t()` function for all text
- [ ] Add gradient header with blur effect
- [ ] Use `card-hover` class on cards
- [ ] Add icon gradients with rounded backgrounds
- [ ] Use semantic spacing (space-y-8, gap-6)
- [ ] Make it responsive (grid with breakpoints)
- [ ] Test in both light and dark modes
- [ ] Test in both Arabic and English
- [ ] Add loading states
- [ ] Add error handling

---

**Happy Coding! 🚀✨**

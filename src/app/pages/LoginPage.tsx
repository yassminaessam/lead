import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PhoneCall, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsToolbar } from '../components/SettingsToolbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success(t('sign_in') + ' ' + t('success'));
        navigate('/dashboard');
      } else {
        toast.error(language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Elite Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Settings Toolbar */}
      <div className="absolute top-4 right-4 z-50">
        <SettingsToolbar />
      </div>

      {/* Login Card - Elite Design */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-2 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-4">
          {/* Elite Logo */}
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg bg-primary">
            <PhoneCall className="w-10 h-10 text-white relative z-10" />
            <Sparkles className="w-5 h-5 text-yellow-300 absolute top-2 right-2 z-10 animate-pulse" />
          </div>
          
          <div>
            <CardTitle className="text-4xl font-bold text-primary mb-2">LeadEngine</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="ahmed@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="h-11 border-2 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="h-11 border-2 focus:border-primary transition-all duration-200"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 hover:shadow-lg transition-all duration-200 font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? t('loading') : t('sign_in')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CRMProvider } from './contexts/CRMContext';
import { ToasterWrapper } from './components/ToasterWrapper';
import { Suspense } from 'react';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CRMProvider>
              <RouterProvider router={router} />
              <ToasterWrapper />
            </CRMProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Suspense>
  );
}
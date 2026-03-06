'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { LocaleProvider } from '@/contexts/LocaleContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </AuthProvider>
  );
}

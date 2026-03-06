'use client';

import AuthGuard from '@/components/AuthGuard';
import NavBar from '@/components/NavBar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
        <NavBar />
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}

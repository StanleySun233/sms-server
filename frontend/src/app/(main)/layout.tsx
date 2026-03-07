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
      <div
        className="flex flex-col h-screen overflow-hidden"
        style={{ backgroundColor: 'rgb(45, 45, 45)' }}
      >
        <NavBar />
        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/api';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function NavBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/devices', label: t('devices') },
    { href: '/devices/new', label: t('newDevice') },
    { href: '/settings', label: t('settings') },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/devices/new') return pathname === '/devices/new';
    if (href === '/settings') return pathname === '/settings';
    return pathname === '/devices' || (pathname.startsWith('/devices/') && !pathname.startsWith('/devices/new'));
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/login');
  };

  return (
    <nav
      className="flex items-center gap-1 px-4 py-3 border-b border-white/10"
      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
    >
      <Link
        href="/dashboard"
        className="text-lg font-semibold mr-6"
        style={{ color: '#c2905e' }}
      >
        {t('appName')}
      </Link>
      <div className="flex items-center gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: active ? 'rgba(194, 144, 94, 0.25)' : 'transparent',
                color: active ? '#c2905e' : 'rgba(255,255,255,0.8)',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {t('logout')}
        </button>
      </div>
    </nav>
  );
}

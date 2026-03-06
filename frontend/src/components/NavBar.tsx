'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: '仪表盘' },
  { href: '/devices', label: '设备列表' },
  { href: '/devices/new', label: '新建设备' },
  { href: '/settings', label: '个人设置' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

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
        短信服务
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
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-lg transition-all duration-200"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        退出登录
      </button>
    </nav>
  );
}

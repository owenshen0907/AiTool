'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useUser } from '@/app/providers/UserProvider';
import { buildLoginModalPath } from '@/lib/auth/loginModal';
import UserInfoModal from './info/UserInfoModal';

const links = [
  { href: '/products', label: '项目', english: 'Projects' },
  { href: '/notes', label: '手记', english: 'Notes' },
  { href: '/about', label: '关于', english: 'About' },
];

export default function NavBar() {
  const pathname = usePathname() || '/';
  const params = useSearchParams();
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  if (
    pathname === '/login-confirm' ||
    pathname === '/trip' ||
    pathname.startsWith('/trip/')
  )
    return null;
  return (
    <>
      <header className="studio-nav">
        <div className="studio-nav-inner">
          <Link
            href="/"
            className="studio-wordmark"
            aria-label="Owen Shen 首页"
          >
            OWEN<span className="wordmark-dot">/</span>
            <span className="wordmark-caption">SHEN</span>
          </Link>
          <nav className="studio-desktop-nav" aria-label="主导航">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? 'page'
                    : undefined
                }
              >
                {link.label}
                <span aria-hidden="true">{link.english}</span>
              </Link>
            ))}
          </nav>
          <div className="studio-nav-end">
            <a
              className="nav-github"
              href="https://github.com/owenshen0907"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub <ArrowUpRight size={15} />
            </a>
            {user && (
              <details className="account-menu">
                <summary>{user.displayName || '账号'}</summary>
                <div>
                  <button type="button" onClick={() => setShowProfile(true)}>
                    个人信息
                  </button>
                  <Link href="/dashboard">个人导航</Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUser(null);
                      window.location.href = '/api/auth/logout';
                    }}
                  >
                    退出登录
                  </button>
                </div>
              </details>
            )}
            <button
              className="mobile-menu-toggle"
              type="button"
              aria-label={open ? '收起导航' : '打开导航'}
              aria-expanded={open}
              aria-controls="studio-mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <nav
          id="studio-mobile-menu"
          className="studio-mobile-nav"
          aria-label="移动导航"
          hidden={!open}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
              <span>{link.english}</span>
            </Link>
          ))}
          <Link href="/tools" onClick={() => setOpen(false)}>
            工具箱
          </Link>
          {!user && (
            <Link
              href={buildLoginModalPath(
                pathname,
                params?.toString(),
                '/dashboard',
              )}
              scroll={false}
              onClick={() => setOpen(false)}
            >
              账号登录
            </Link>
          )}
        </nav>
      </header>
      {showProfile && user && (
        <UserInfoModal
          data={{ ...user, email: user.email ?? undefined }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

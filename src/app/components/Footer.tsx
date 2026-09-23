'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { buildLoginModalPath } from '@/lib/auth/loginModal';

export default function Footer() {
  const pathname = usePathname() || '/';
  const params = useSearchParams();
  if (pathname === '/trip' || pathname.startsWith('/trip/')) return null;
  return (
    <footer className="studio-footer">
      <div className="studio-container">
        <div className="footer-top">
          <div>
            <span className="studio-eyebrow">OWEN SHEN / 个人网站</span>
            <p>下次来，可能又多了一页。</p>
          </div>
          <Link href="/about" className="text-link">
            认识一下 <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Owen Shen</span>
          <nav aria-label="更多入口">
            <Link href="/tools">工具箱</Link>
            <Link href="/links">常用链接</Link>
            <Link href="/support">产品支持</Link>
            <Link href="/legal/apple-privacy">隐私</Link>
            <Link href="/legal/terms">条款</Link>
            <Link href="/legal/data-deletion">数据删除</Link>
            <Link href="/legal/app-store-checklist">上架材料</Link>
            <Link
              href={buildLoginModalPath(
                pathname,
                params?.toString(),
                '/dashboard',
              )}
              scroll={false}
            >
              账号
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

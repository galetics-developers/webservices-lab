'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/rest', label: 'REST' },
  { href: '/soap', label: 'SOAP' },
  { href: '/rss', label: 'RSS' },
  { href: '/external', label: 'Servicios externos' },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Secciones">
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

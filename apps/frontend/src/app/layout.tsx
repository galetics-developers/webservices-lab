import '@fontsource/archivo-black/400.css';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import '@fontsource/work-sans/700.css';
import '@fontsource/space-mono/400.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NavLinks } from '@/components/NavLinks';
import './globals.css';

export const metadata: Metadata = {
  title: 'webservices-lab',
  description: 'Práctica de publicación y consumo de servicios web: REST, SOAP/WSDL y RSS.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              webservices-lab
            </Link>
            <NavLinks />
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="container site-footer caption">
          Práctica académica de servicios web. Monorepo con pnpm workspaces, NestJS y Next.js.
        </footer>
      </body>
    </html>
  );
}

import type { ReactNode } from 'react';

export function PageHeader({ overline, title, children }: { overline: string; title: string; children?: ReactNode }) {
  return (
    <header className="page-header">
      <span className="overline">{overline}</span>
      <h1 className="headline">{title}</h1>
      {children && <p className="lead">{children}</p>}
    </header>
  );
}

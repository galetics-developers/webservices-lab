'use client';

import { useState } from 'react';
import { prettyRaw } from '@/lib/format';

export function RawView({ label, content }: { label: string; content?: string }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;
  return (
    <div className={open ? 'raw raw-block' : 'raw'}>
      <button type="button" className="btn ghost" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Ocultar' : 'Ver'} {label}
      </button>
      {open && <pre>{prettyRaw(content)}</pre>}
    </div>
  );
}

export function StatusChip({ status }: { status: number }) {
  const tone = status >= 200 && status < 300 ? 'success' : status >= 400 && status < 500 ? 'warning' : 'error';
  return <span className={`chip ${tone}`}>{status === 0 ? 'Sin conexión' : `HTTP ${status}`}</span>;
}

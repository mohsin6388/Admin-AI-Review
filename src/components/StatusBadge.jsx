const STYLES = {
  success: 'bg-green-50 text-good ring-1 ring-green-200',
  active: 'bg-green-50 text-good ring-1 ring-green-200',
  paid: 'bg-green-50 text-good ring-1 ring-green-200',
  failed: 'bg-red-50 text-bad ring-1 ring-red-200',
  cancelled: 'bg-red-50 text-bad ring-1 ring-red-200',
  expired: 'bg-red-50 text-bad ring-1 ring-red-200',
  pending: 'bg-amber-50 text-warn ring-1 ring-amber-200',
  default: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const style = STYLES[key] || STYLES.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style}`}>
      {status || 'unknown'}
    </span>
  );
}

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-bad text-sm px-4 py-4">
      {message || 'Something went wrong while fetching data.'}
    </div>
  );
}

export function EmptyState({ message = 'No data found.' }) {
  return (
    <div className="text-center py-16 text-gray-400 text-sm">{message}</div>
  );
}

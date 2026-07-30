import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, onMenuClick }) {
  const { admin, logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium text-ink">{admin?.name || 'Admin'}</span>
          <span className="text-xs text-gray-400">{admin?.email}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-accentSoft text-accent flex items-center justify-center font-semibold text-sm">
          {(admin?.name || 'A').charAt(0).toUpperCase()}
        </div>
        <button
          onClick={logout}
          className="ml-2 text-xs font-medium text-gray-500 hover:text-bad px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

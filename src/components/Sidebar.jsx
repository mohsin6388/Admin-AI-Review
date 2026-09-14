import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/users", label: "Users", icon: UsersIcon },
  { to: "/payments", label: "Payments", icon: PaymentIcon },
  { to: "/tickets", label: "Tickets", icon: TicketIcon },
  { to: "/add-business", label: "Add Business", icon: TicketIcon },
  { to: "/add-coupon", label: "Add Discount", icon: TicketIcon },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 min-h-screen w-64 bg-ink text-white flex flex-col
        transition-transform duration-200 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="px-6 py-5 flex items-center gap-2 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-sm">
            RP
          </div>
          <div>
            <p className="font-semibold leading-tight text-sm">
              Review Ninja Pro
            </p>
            <p className="text-[11px] text-white/50 leading-tight">
              Admin Panel
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-[11px] text-white/40">
          v1.0 · Internal use only
        </div>
      </aside>
    </>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M21 20c0-2.8-1.8-5-4.3-5.7" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0-2 2 2 2 0 0 0 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 2-2 2 2 0 0 0-2-2V8z" />
      <path d="M12 8v8" />
    </svg>
  );
}

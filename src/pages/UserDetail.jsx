import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getAllUsers, getPaymentDetails } from '../api/client';

export default function UserDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(location.state?.user || null);
  const [payments, setPayments] = useState(location.state?.payments || null);
  const [loading, setLoading] = useState(!location.state?.user);
  const [error, setError] = useState('');

  // Fallback fetch if the page was opened directly (no router state),
  // e.g. via a refreshed page or shared link.
  useEffect(() => {
    if (user && payments) return;

    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [usersRes, paymentsRes] = await Promise.all([
          getAllUsers(),
          getPaymentDetails(),
        ]);
        if (!alive) return;
        const found = (usersRes.users || []).find((u) => String(u.id) === String(id));
        if (!found) {
          setError('User not found.');
        } else {
          setUser(found);
          setPayments(paymentsRes.payments || []);
        }
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const userPayments = useMemo(() => {
    if (!user || !payments) return [];
    return payments
      .filter((p) => p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [user, payments]);

  const totalPaid = useMemo(
    () =>
      userPayments
        .filter((p) => (p.status || '').toLowerCase() === 'success')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [userPayments],
  );

  return (
    <DashboardLayout title="User Details">
      <button
        onClick={() => navigate('/users')}
        className="text-sm text-gray-500 hover:text-ink flex items-center gap-1 mb-5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to Users
      </button>

      {loading && <LoadingState label="Loading user..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && user && (
        <div className="space-y-6">
          {/* Identity header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accentSoft text-accent flex items-center justify-center font-semibold text-lg">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ink">{user.name || 'Unnamed User'}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Joined {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}
            </p>
          </div>

          {/* Payment & subscription — kept prominent, near the top */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm font-semibold text-ink mb-4">Subscription & Payment Summary</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MiniStat label="Plan" value={user.plan_name || 'No plan'} />
              <MiniStat
                label="Subscription Status"
                value={<StatusBadge status={user.subscription_status || 'free'} />}
              />
              <MiniStat
                label="Valid Till"
                value={user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('en-IN') : '—'}
              />
              <MiniStat label="Total Paid Till Date" value={formatCurrency(totalPaid)} highlight />
            </div>
          </div>

          {/* Usage totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Businesses" value={user.total_businesses ?? 0} />
            <StatCard label="Total Reviews Generated" value={user.total_reviews ?? 0} />
            <StatCard label="Total Payments Made" value={userPayments.length} />
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <p className="text-sm font-semibold text-ink px-6 py-4 border-b border-gray-100">
              Previous Payment History
            </p>
            {userPayments.length === 0 ? (
              <EmptyState message="No payments made by this user yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Method</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPayments.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-ink">{formatCurrency(p.amount)}</td>
                        <td className="px-6 py-3.5 capitalize">{p.payment_method || '—'}</td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                          {p.razorpay_payment_id || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Businesses */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <p className="text-sm font-semibold text-ink px-6 py-4 border-b border-gray-100">
              Businesses ({user.businesses?.length || 0})
            </p>
            {!user.businesses || user.businesses.length === 0 ? (
              <EmptyState message="This user hasn't added any business yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                      <th className="px-6 py-3 font-medium">Business Name</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Reviews Generated</th>
                      <th className="px-6 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.businesses.map((b) => (
                      <tr key={b.business_id} className="border-b border-gray-50 last:border-0">
                        <td className="px-6 py-3.5 font-medium text-ink">{b.business_name}</td>
                        <td className="px-6 py-3.5 capitalize">{b.business_type || '—'}</td>
                        <td className="px-6 py-3.5">{b.reviews_generated ?? 0}</td>
                        <td className="px-6 py-3.5 text-gray-400 whitespace-nowrap">
                          {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-accent text-base' : 'text-ink'}`}>{value}</p>
    </div>
  );
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

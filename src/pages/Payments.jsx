import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getPaymentDetails } from '../api/client';

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await getPaymentDetails();
        if (!alive) return;
        setAnalytics(res.analytics || {});
        setPayments(res.payments || []);
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
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus =
        statusFilter === 'all' || (p.status || '').toLowerCase() === statusFilter;
      const matchesSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [payments, statusFilter, search]);

  return (
    <DashboardLayout title="Payments">
      {loading && <LoadingState label="Loading payments..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Analytics row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(analytics?.totalRevenue)}
              sub="All-time, successful payments"
            />
            <StatCard label="Today's Revenue" value={formatCurrency(analytics?.todayRevenue)} />
            <StatCard label="Successful Payments" value={analytics?.successPayments ?? 0} tone="good" />
            <StatCard label="Failed Payments" value={analytics?.failedPayments ?? 0} tone="bad" />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or payment ID..."
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Payments table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState message="No payments match your filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Method</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Payment ID</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-accentSoft/30">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-ink">{p.name || '—'}</p>
                          <p className="text-xs text-gray-400">{p.email}</p>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-ink">{formatCurrency(p.amount)}</td>
                        <td className="px-5 py-3.5 capitalize">{p.payment_method || '—'}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                          {p.razorpay_payment_id || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '—'}
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

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

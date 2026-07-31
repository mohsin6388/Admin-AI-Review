import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { LoadingState, ErrorState } from '../components/States';
import { getDashboardStats, getAllUsers, getPaymentDetails } from '../api/client';

// A user counts as "paid" if their plan isn't the free plan.
// Using plan_name / plan_price directly from the users list because
// it's per-user ground truth — more reliable than a separately
// computed aggregate on the dashboard-stats endpoint.
//
// IMPORTANT: unverified users have plan_name/plan_price = null (no
// subscription row exists for them yet). We must NOT count those as
// paid — treat "no plan info at all" as free/unpaid explicitly.
function isPaidUser(user) {
  if (user.plan_name == null && user.plan_price == null) return false;
  const planName = (user.plan_name || '').toLowerCase();
  const planPrice = Number(user.plan_price) || 0;
  return planName !== 'free' || planPrice > 0;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        // Three calls combined so we can show numbers the single
        // /dashboard/stats endpoint doesn't provide yet (see README):
        // total businesses generated & all-time revenue.
        const [statsRes, usersRes, paymentsRes] = await Promise.all([
          getDashboardStats(),
          getAllUsers(),
          getPaymentDetails(),
        ]);

        if (!alive) return;

        const stats = statsRes.stats || {};
        const users = usersRes.users || [];
        const counts = usersRes.counts || {};

        const totalBusinesses = users.reduce(
          (sum, u) => sum + (Number(u.total_businesses) || 0),
          0,
        );
        const totalReviewsFromUsers = users.reduce(
          (sum, u) => sum + (Number(u.total_reviews) || 0),
          0,
        );

        // Prefer the count coming from the users list itself
        // (usersRes.counts.totalUsers / users.length) since it's
        // computed from the same data we're displaying below.
        const totalUsers =
        Number(counts.verifiedUsers ?? counts.totalUsers ?? stats.total_users ?? 0);

        // Verified vs non-verified signups (OTP not completed = non-verified).
        const verifiedUsers = Number(counts.verifiedUsers ?? stats.verified_users ?? 0);
        const nonVerifiedUsers = Number(
          counts.nonVerifiedUsers ?? Math.max(totalUsers - verifiedUsers, 0),
        );

        const paidUsers = users.filter(isPaidUser).length;
        const freeUsers = Math.max(totalUsers - paidUsers, 0);

        setData({
          totalUsers,
          verifiedUsers,
          nonVerifiedUsers,
          paidUsers,
          freeUsers,
          totalReviews: Number(stats.total_reviews_generated || totalReviewsFromUsers || 0),
          totalBusinesses,
          monthlyRevenue: Number(stats.monthly_revenue || 0),
          totalRevenue: Number(paymentsRes.analytics?.totalRevenue || 0),
          successPayments: Number(paymentsRes.analytics?.successPayments || 0),
          failedPayments: Number(paymentsRes.analytics?.failedPayments || 0),
        });
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

  return (
    <DashboardLayout title="Dashboard">
      {loading && <LoadingState label="Loading dashboard..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Top row - core counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={formatNumber(data.totalUsers)}
              sub={`${formatNumber(data.verifiedUsers)} verified`}
            />
            <StatCard label="Businesses Generated" value={formatNumber(data.totalBusinesses)} />
            <StatCard label="Reviews Generated" value={formatNumber(data.totalReviews)} />
            <StatCard
              label="Total Payment Received"
              value={formatCurrency(data.totalRevenue)}
              sub="All-time, successful payments"
            />
          </div>

          {/* Second row - verification + free vs paid + revenue this month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Non-Verified Users"
              value={formatNumber(data.nonVerifiedUsers)}
              tone="warning"
              sub={`${percent(data.nonVerifiedUsers, data.totalUsers)}% of total users`}
            />
            <StatCard
              label="Paid Users"
              value={formatNumber(data.paidUsers)}
              tone="good"
              sub={`${percent(data.paidUsers, data.totalUsers)}% of total users`}
            />
            <StatCard
              label="Free Users"
              value={formatNumber(data.freeUsers)}
              sub={`${percent(data.freeUsers, data.totalUsers)}% of total users`}
            />
            <StatCard
              label="This Month's Revenue"
              value={formatCurrency(data.monthlyRevenue)}
            />
          </div>

          {/* Third row - payment success/failed on its own since we freed up a slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Payment Success / Failed"
              value={`${data.successPayments} / ${data.failedPayments}`}
              sub="Successful vs failed attempts"
            />
          </div>

          {/* Simple visual split: free vs paid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-4">Free vs Paid Users</p>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex">
              <div
                className="h-full bg-accent"
                style={{ width: `${percent(data.paidUsers, data.totalUsers)}%` }}
              />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" /> Paid ({data.paidUsers})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> Free ({data.freeUsers})
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat('en-IN').format(n || 0);
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
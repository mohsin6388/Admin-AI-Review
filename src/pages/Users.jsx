import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getAllUsers, getPaymentDetails } from '../api/client';

export default function Users() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
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
        setUsers(usersRes.users || []);
        setPayments(paymentsRes.payments || []);
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
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());

      const isPaid = (u.subscription_status || '').toLowerCase() === 'active';
      const matchesPlan =
        planFilter === 'all' ||
        (planFilter === 'paid' && isPaid) ||
        (planFilter === 'free' && !isPaid);

      return matchesSearch && matchesPlan;
    });
  }, [users, search, planFilter]);

  function openUser(user) {
    // Pass along both the user row and the full payments list so the
    // detail page can build this user's payment history + total paid,
    // without needing a dedicated backend endpoint.
    navigate(`/users/${user.id}`, { state: { user, payments } });
  }

  return (
    <DashboardLayout title="Users">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="all">All Users</option>
          <option value="paid">Paid Only</option>
          <option value="free">Free Only</option>
        </select>
      </div>

      {loading && <LoadingState label="Loading users..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState message="No users match your search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Businesses</th>
                    <th className="px-5 py-3 font-medium">Reviews</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => openUser(u)}
                      className="border-b border-gray-50 last:border-0 hover:bg-accentSoft/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-ink whitespace-nowrap">{u.name || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{u.email}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">{u.plan_name || 'No plan'}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={u.subscription_status || 'free'} />
                      </td>
                      <td className="px-5 py-3.5">{u.total_businesses ?? 0}</td>
                      <td className="px-5 py-3.5">{u.total_reviews ?? 0}</td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

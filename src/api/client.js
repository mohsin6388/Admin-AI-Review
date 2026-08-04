
const BASE_URL = 'https://api.reviewninjapro.com/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

// ===================== AUTH =====================
// NOTE (backend gap): current route is `router.get('/admin/auth/login', ...)`
// but the controller reads credentials from req.body, which doesn't work
// reliably with GET requests. This client calls it as POST — the backend
// route method should be updated to router.post(...). See README for details.
export function adminLogin(email, password) {
  return request('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ===================== DASHBOARD =====================
export function getDashboardStats() {
  return request('/admin/dashboard/stats');
}

// ===================== USERS =====================
export function getAllUsers() {
  return request('/admin/users');
}

// ===================== PAYMENTS =====================
export function getPaymentDetails() {
  return request('/admin/users/payment-details');
}

export { getToken };

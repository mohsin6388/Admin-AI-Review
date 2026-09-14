import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

// Apni base URL yahan set kar
const API_BASE = "https://api.reviewninjapro.com/api/admin/coupon";
// const API_BASE = "http://localhost:5000/api/admin/coupon";

const initialForm = {
  code: "",
  discount_type: "flat", // "flat" | "percent"
  discount_value: "",
  usage_limit: "",
  valid_until: "",
};

export default function AddDiscount() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: string }

  // ---------- Fetch list ----------
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.success) {
        setCoupons(data.data);
      } else {
        showMessage("error", data.message || "Failed to load coupons");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Server se connect nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ---------- Form handlers ----------
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setForm(initialForm);

  // ---------- Add ----------
  const handleAdd = async (e) => {
    e.preventDefault();

    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discount_value);

    if (!code) {
      showMessage("error", "Coupon code is required");
      return;
    }
    if (!discountValue || discountValue <= 0) {
      showMessage("error", "Discount value must be greater than 0");
      return;
    }
    if (form.discount_type === "percent" && discountValue > 100) {
      showMessage("error", "Percent discount can't be more than 100");
      return;
    }

    // Baaki saari advanced fields (max_discount_amount, min_order_amount,
    // applicable_plans, per_user_limit) yahan se hardcoded default jaati hain.
    // Backend already inhe support karta hai — future mein zaroorat pade to
    // form mein field wapas add kar dena, kuch aur change nahi karna padega.
    const payload = {
      code,
      discount_type: form.discount_type,
      discount_value: discountValue,
      max_discount_amount: null,
      min_order_amount: 0,
      applicable_plans: null, // null = sab plans pe applicable
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_user_limit: 1, // hamesha ek user sirf ek baar use kar sake
      valid_until: form.valid_until || null,
    };

    try {
      setSubmitting(true);
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setCoupons((prev) => [data.data, ...prev]);
        resetForm();
        showMessage("success", "Coupon added successfully");
      } else {
        showMessage("error", data.message || "Failed to add coupon");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Server se connect nahi ho paya");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Delete ----------
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap sach me is coupon ko delete karna chahte hain?",
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        showMessage("success", data.message || "Coupon deleted successfully");
      } else {
        showMessage("error", data.message || "Failed to delete coupon");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Server se connect nahi ho paya");
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- Toggle active/inactive ----------
  const handleToggleActive = async (coupon) => {
    try {
      setTogglingId(coupon.id);
      const res = await fetch(`${API_BASE}/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      const data = await res.json();

      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, is_active: !c.is_active } : c,
          ),
        );
        showMessage(
          "success",
          `Coupon ${!coupon.is_active ? "activated" : "deactivated"}`,
        );
      } else {
        showMessage("error", data.message || "Failed to update coupon");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Server se connect nahi ho paya");
    } finally {
      setTogglingId(null);
    }
  };

  // ---------- Helper ----------
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDiscount = (c) =>
    c.discount_type === "percent"
      ? `${c.discount_value}%`
      : `₹${c.discount_value}`;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Manage Coupons
        </h1>

        {/* Message banner */}
        {message && (
          <div
            className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                handleChange("code", e.target.value.toUpperCase())
              }
              placeholder="e.g. WELCOME50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Discount Type
            </label>
            <select
              value={form.discount_type}
              onChange={(e) => handleChange("discount_type", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Discount Value
            </label>
            <input
              type="number"
              min="1"
              value={form.discount_value}
              onChange={(e) => handleChange("discount_value", e.target.value)}
              placeholder={
                form.discount_type === "percent" ? "e.g. 10" : "e.g. 200"
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Usage Limit (khali = unlimited)
            </label>
            <input
              type="number"
              min="1"
              value={form.usage_limit}
              onChange={(e) => handleChange("usage_limit", e.target.value)}
              placeholder="e.g. 100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Valid Until (khali = never expires)
            </label>
            <input
              type="date"
              value={form.valid_until}
              onChange={(e) => handleChange("valid_until", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition"
            >
              {submitting ? "Adding..." : "Add Coupon"}
            </button>
          </div>
        </form>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">
              All Coupons ({coupons.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No coupons added yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="text-sm">
                    <span className="font-medium text-gray-800">{c.code}</span>
                    <span className="text-gray-500 ml-2">
                      {formatDiscount(c)} off
                    </span>
                    <span className="text-gray-400 ml-2 text-xs">
                      ({c.used_count}
                      {c.usage_limit ? `/${c.usage_limit}` : "/∞"} used)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(c)}
                      disabled={togglingId === c.id}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition ${
                        c.is_active
                          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {togglingId === c.id
                        ? "..."
                        : c.is_active
                          ? "Active"
                          : "Inactive"}
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-red-300 px-3 py-1 rounded-md hover:bg-red-50 transition"
                    >
                      {deletingId === c.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

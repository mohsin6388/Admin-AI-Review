import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

// Apni base URL yahan set kar (agar env variable use kar rha hai to VITE_API_URL use kar le)
const API_BASE = "https://api.reviewninjapro.com/api/admin/business-types";

export default function BusinessTypes() {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: string }

  // ---------- Fetch list ----------
  const fetchBusinessTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.success) {
        setBusinessTypes(data.data);
      } else {
        showMessage("error", data.message || "Failed to load business types");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Server se connect nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  // ---------- Add ----------
  const handleAdd = async (e) => {
    e.preventDefault();

    const trimmed = newType.trim();
    if (!trimmed) {
      showMessage("error", "Business type is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_type: trimmed }),
      });
      const data = await res.json();

      if (data.success) {
        setBusinessTypes((prev) => [data.data, ...prev]);
        setNewType("");
        showMessage("success", "Business type added successfully");
      } else {
        showMessage("error", data.message || "Failed to add business type");
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
      "Kya aap sach me is business type ko delete karna chahte hain?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setBusinessTypes((prev) => prev.filter((b) => b.id !== id));
        showMessage("success", "Business type deleted successfully");
      } else {
        showMessage("error", data.message || "Failed to delete business type");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Server se connect nahi ho paya");
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- Helper ----------
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (

    <DashboardLayout>
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Manage Business Types
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
        className="flex gap-3 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200"
      >
        <input
          type="text"
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          placeholder="Enter business type (e.g. Restaurant, Salon)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition"
        >
          {submitting ? "Adding..." : "Add Business"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-medium text-gray-700">
            All Business Types ({businessTypes.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading...</div>
        ) : businessTypes.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No business types added yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {businessTypes.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
              >
                <span className="text-sm text-gray-800">{item.business_type}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-red-300 px-3 py-1 rounded-md hover:bg-red-50 transition"
                >
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

    </DashboardLayout>
  );
}
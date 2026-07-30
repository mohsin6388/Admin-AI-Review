import DashboardLayout from "../components/DashboardLayout";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://api.reviewninjapro.com/api/message";

// Backend allowed statuses: Open, In Progress, Resolved, Closed
const STATUS_STYLES = {
  Open: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Resolved: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  Closed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const PRIORITY_STYLES = {
  High: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Low: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

function initials(name = "") {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Backend -> UI shape mapping helpers
// tickets table doesn't have a `subject` column yet, so we fall back to `category`.
// If you add a real `subject` column later, just swap t.category -> t.subject here.
function normalizeTicket(t) {
  return {
    ...t,
    subject: t.subject || t.category || "General Inquiry",
    createdAt: formatDate(t.created_at),
  };
}

function normalizeMessages(messages = []) {
  return messages.map((m) => ({
    ...m,
    sender: m.sender_type === "agent" ? "admin" : "user",
    time: formatDate(m.created_at),
  }));
}

function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
        PRIORITY_STYLES[priority] || "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200"
      }`}
    >
      {priority}
    </span>
  );
}

function Avatar({ name, size = "md" }) {
  const dims = size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-sm";
  return (
    <div
      className={`${dims} shrink-0 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center`}
    >
      {initials(name) || "?"}
    </div>
  );
}

export default function Tickets() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ticketList, setTicketList] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
    },
  });

  const fetchAllTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_URL}/admin/tickets`, authHeaders());
      const list = (res.data.tickets || []).map(normalizeTicket);
      setTicketList(list);
    } catch (err) {
      console.log(err);
      setError("Tickets load nahi ho paaye. Baad me try karein.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTicket = async (id) => {
    try {
      setTicketLoading(true);
      const res = await axios.get(`${API_URL}/admin/tickets/${id}`, authHeaders());
      const ticket = normalizeTicket(res.data.ticket);
      const messages = normalizeMessages(res.data.messages);
      setSelectedTicket({ ...ticket, messages });
    } catch (err) {
      console.log(err);
      setError("Ticket detail load nahi ho paayi.");
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const filteredTickets = ticketList.filter((ticket) => {
    const haystack = `${ticket.name || ""} ${ticket.subject || ""} ${
      ticket.last_message || ""
    }`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = async () => {
    if (!reply.trim() || sending) return;
    try {
      setSending(true);
      await axios.post(
        `${API_URL}/admin/tickets/${selectedTicket.id}/reply`,
        { message: reply },
        authHeaders()
      );
      setReply("");
      await fetchTicket(selectedTicket.id);
      // adminReplyToTicket backend automatically sets status to "In Progress",
      // so refresh the list too so the sidebar badge stays in sync.
      fetchAllTickets();
    } catch (err) {
      console.log(err);
      setError("Reply bhejne me error aayi.");
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      await axios.patch(
        `${API_URL}/admin/tickets/${selectedTicket.id}/status`,
        { status: "Closed" },
        authHeaders()
      );
      await fetchTicket(selectedTicket.id);
      fetchAllTickets();
    } catch (err) {
      console.log(err);
      setError("Status update nahi ho paaya.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/admin/tickets/${selectedTicket.id}`, authHeaders());
      setSelectedTicket(null);
      setShowDeleteModal(false);
      fetchAllTickets();
    } catch (err) {
      console.log(err);
      setError("Ticket delete nahi ho paaya.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Support Tickets</h1>
          <p className="text-gray-500 mt-1">
            Manage customer support requests and conversations.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-medium">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 h-[680px]">
          {/* Left Panel */}
          <div className="col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-lg text-gray-900">Tickets</h2>
              <p className="text-sm text-gray-500">
                {ticketList.length} recent customer request{ticketList.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer or category..."
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>All</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3">
                      <div className="w-11 h-11 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-gray-500 text-sm">No tickets match your search.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => fetchTicket(ticket.id)}
                    className={`w-full text-left px-5 py-4 border-b border-gray-100 transition flex gap-3 ${
                      selectedTicket?.id === ticket.id
                        ? "bg-indigo-50/70 border-l-4 border-l-indigo-600"
                        : "hover:bg-gray-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <Avatar name={ticket.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-gray-900 text-sm">#{ticket.id}</p>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="mt-1 font-medium text-gray-800 text-sm truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {ticket.name} {ticket.last_message ? `· ${ticket.last_message}` : ""}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {!selectedTicket ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl">💬</div>
                  <h2 className="text-xl font-semibold mt-4 text-gray-900">Select a ticket</h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    Choose a ticket from the left panel to view the conversation.
                  </p>
                </div>
              </div>
            ) : ticketLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Loading conversation...
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="border-b border-gray-100 p-6 flex justify-between items-start gap-4">
                  <div className="flex gap-3 min-w-0">
                    <Avatar name={selectedTicket.name} />
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 truncate">
                        {selectedTicket.subject}
                      </h2>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Ticket #{selectedTicket.id} · Created {selectedTicket.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleCloseTicket}
                      disabled={selectedTicket.status === "Closed"}
                      className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Close Ticket
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Customer info */}
                <div className="border-b border-gray-100 p-5 bg-gray-50/70">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {selectedTicket.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5 truncate">
                        {selectedTicket.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {selectedTicket.phone || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Priority</p>
                      <div className="mt-1">
                        <PriorityBadge priority={selectedTicket.priority} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          msg.sender === "admin"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p
                          className={`text-xs mt-1.5 ${
                            msg.sender === "admin" ? "text-indigo-100" : "text-gray-400"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="border-t border-gray-100 p-5 bg-white">
                  <div className="flex gap-3">
                    <textarea
                      rows="2"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!reply.trim() || sending}
                      className="bg-indigo-600 text-white px-6 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Delete ticket</h2>
            <p className="text-gray-500 mt-2 text-sm">
              This will permanently remove ticket #{selectedTicket?.id} and its conversation.
              This action can't be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
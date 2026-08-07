import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTrash, FaCheck, FaArchive, FaSearch, FaTimes, FaInbox } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationCenter() {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username"); // Target user id matches username/email

  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // History filtering states
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`/api/notifications/unread-count?role=${role || ""}&userId=${username || ""}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Unread notifications count fetch error:", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?role=${role || ""}&userId=${username || ""}&page=0&size=5`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content || []);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(
        `/api/notifications?role=${role || ""}&userId=${username || ""}&page=${page}&size=10${searchParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();

    // Real-Time Short Polling for event updates
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
      if (isHistoryOpen) {
        fetchHistory();
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, [isOpen, isHistoryOpen, page, search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        fetchUnreadCount();
        if (isHistoryOpen) fetchHistory();
        else fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all?role=${role || ""}&userId=${username || ""}`, {
        method: "POST",
      });
      if (res.ok) {
        fetchUnreadCount();
        if (isHistoryOpen) fetchHistory();
        else fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/archive`, { method: "POST" });
      if (res.ok) {
        fetchUnreadCount();
        if (isHistoryOpen) fetchHistory();
        else fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUnreadCount();
        if (isHistoryOpen) fetchHistory();
        else fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    if ("CRITICAL".equalsIgnoreCase(priority)) return "🔴";
    if ("WARNING".equalsIgnoreCase(priority)) return "🟠";
    if ("SUCCESS".equalsIgnoreCase(priority)) return "🟢";
    return "🔵";
  };

  const formatNotifTime = (timestamp) => {
    if (!timestamp) return "Just now";
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", zIndex: 1000 }}>
      {/* Bell Button */}
      <button
        type="button"
        style={{
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: "20px",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center"
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBell style={{ color: unreadCount > 0 ? "#16C784" : "#9ca3af" }} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            background: "#ef4444",
            color: "white",
            fontSize: "10px",
            fontWeight: "700",
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              right: 0,
              marginTop: "12px",
              background: "#111a14",
              border: "1px solid #1f2d22",
              borderRadius: "12px",
              width: "360px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #1f2d22", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#f0fdf4", fontWeight: "700", fontSize: "14px" }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{ background: "none", border: "none", color: "#16C784", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "30px 20px", textAlign: "center", color: "#6b7280" }}>
                  <FaInbox style={{ fontSize: "24px", marginBottom: "8px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "13px" }}>No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid #18221b",
                      background: n.isRead ? "transparent" : "rgba(22, 199, 132, 0.04)",
                      display: "flex",
                      gap: "10px",
                      position: "relative"
                    }}
                  >
                    <span style={{ fontSize: "14px", marginTop: "2px" }}>
                      {n.priority === "CRITICAL" ? "🔴" : n.priority === "WARNING" ? "🟠" : n.priority === "SUCCESS" ? "🟢" : "🔵"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <span style={{ color: n.isRead ? "#9ca3af" : "#f0fdf4", fontSize: "13px", fontWeight: n.isRead ? "500" : "700" }}>
                          {n.title}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: "10px" }}>{formatNotifTime(n.timestamp)}</span>
                      </div>
                      <p style={{ color: "#88968d", fontSize: "12px", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                        {n.description}
                      </p>
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                        {n.type === "KYC_CONSENT_REQUEST" ? (
                          <>
                            <button
                              onClick={async () => {
                                const consentMatch = n.description?.match(/Consent ID: (\d+)/);
                                if (consentMatch) {
                                  const consentId = consentMatch[1];
                                  try {
                                    const res = await fetch(`/api/customer/verification/consent/${consentId}/approve?email=${encodeURIComponent(username)}`, { method: "POST" });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert("Access Granted: Admin has 15-minute one-time access to view your document.");
                                      handleMarkRead(n.id);
                                      window.location.reload();
                                    } else alert(data.error || "Approval failed.");
                                  } catch { alert("Connection error."); }
                                }
                              }}
                              style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: "11px", fontWeight: "700", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                            >
                              ✓ Approve Access (15 Min)
                            </button>
                            <button
                              onClick={async () => {
                                const consentMatch = n.description?.match(/Consent ID: (\d+)/);
                                if (consentMatch) {
                                  const consentId = consentMatch[1];
                                  try {
                                    const res = await fetch(`/api/customer/verification/consent/${consentId}/reject?email=${encodeURIComponent(username)}`, { method: "POST" });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert("Access Declined.");
                                      handleMarkRead(n.id);
                                      window.location.reload();
                                    } else alert(data.error || "Decline failed.");
                                  } catch { alert("Connection error."); }
                                }
                              }}
                              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: "11px", fontWeight: "700", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                            >
                              ✕ Decline
                            </button>
                          </>
                        ) : (
                          <>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkRead(n.id)}
                                style={{ background: "none", border: "none", color: "#16C784", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: 0 }}
                              >
                                <FaCheck size={9} /> Mark read
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(n.id)}
                              style={{ background: "none", border: "none", color: "#6b7280", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: 0 }}
                            >
                              <FaArchive size={9} /> Archive
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: "12px 18px", borderTop: "1px solid #1f2d22", background: "#0d1410", textAlign: "center" }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsHistoryOpen(true);
                }}
                style={{ background: "none", border: "none", color: "#16C784", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
              >
                View All History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full History Dialog Modal */}
      {isHistoryOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px"
        }}>
          <div style={{
            background: "#111a14",
            border: "1px solid #1f2d22",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "750px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
            overflow: "hidden"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2d22", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#16C784", fontWeight: "800" }}>Notification Center</h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                style={{ background: "none", border: "none", color: "#6b7280", fontSize: "22px", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Filters Bar */}
            <div style={{ padding: "16px 24px", background: "#0d1410", borderBottom: "1px solid #1f2d22", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <FaSearch style={{ position: "absolute", left: "12px", top: "11px", color: "#6b7280" }} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", background: "#0a0f0d", border: "1px solid #1f2d22", color: "#white", padding: "8px 12px 8px 36px", borderRadius: "8px", fontSize: "13px" }}
                />
              </div>
              <button
                onClick={handleMarkAllRead}
                style={{ padding: "8px 16px", background: "rgba(22, 199, 132, 0.15)", border: "1px solid rgba(22,199,132,0.3)", color: "#16C784", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Mark All as Read
              </button>
            </div>

            {/* List */}
            <div style={{ maxHeight: "400px", overflowY: "auto", padding: "10px 24px" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "#6b7280" }}>
                  <FaInbox style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "14px" }}>No notifications matching search filters</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "16px 0",
                      borderBottom: "1px solid #18221b",
                      display: "flex",
                      gap: "14px",
                      background: n.isRead ? "transparent" : "rgba(22, 199, 132, 0.02)"
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>
                      {n.priority === "CRITICAL" ? "🔴" : n.priority === "WARNING" ? "🟠" : n.priority === "SUCCESS" ? "🟢" : "🔵"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", color: n.isRead ? "#9ca3af" : "#f0fdf4", fontWeight: n.isRead ? "600" : "800" }}>{n.title}</h4>
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>{formatNotifTime(n.timestamp)}</span>
                      </div>
                      <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#88968d", lineHeight: 1.5 }}>{n.description}</p>
                      {n.orderId && (
                        <div style={{ display: "inline-block", background: "rgba(22,199,132,0.1)", color: "#16C784", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", marginTop: "8px" }}>
                          Order ID: #{n.orderId}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "14px", marginTop: "10px" }}>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            style={{ background: "none", border: "none", color: "#16C784", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: 0 }}
                          >
                            <FaCheck size={10} /> Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleArchive(n.id)}
                          style={{ background: "none", border: "none", color: "#6b7280", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: 0 }}
                        >
                          <FaArchive size={10} /> Archive
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: 0 }}
                        >
                          <FaTrash size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #1f2d22", background: "#0d1410", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>Page {page + 1} of {totalPages}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  style={{
                    padding: "6px 12px",
                    background: page === 0 ? "transparent" : "#111a14",
                    border: "1px solid #1f2d22",
                    borderRadius: "6px",
                    color: page === 0 ? "#4b5563" : "#9ca3af",
                    cursor: page === 0 ? "not-allowed" : "pointer"
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  style={{
                    padding: "6px 12px",
                    background: page >= totalPages - 1 ? "transparent" : "#111a14",
                    border: "1px solid #1f2d22",
                    borderRadius: "6px",
                    color: page >= totalPages - 1 ? "#4b5563" : "#9ca3af",
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

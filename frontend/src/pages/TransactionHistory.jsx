import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import API_BASE_URL from "../utils/api";
import "./TransactionHistory.css";

/**
 * TransactionHistory Page
 * ─────────────────────────────────────────────────────────────────
 * Demonstrates:
 *  - Requires authentication (guarded client-side and server-side)
 *  - Fetches all transactions for the logged-in user
 *  - Renders purchase history with status badges, timestamps,
 *    item pills, and total amounts
 *  - Aggregate stats at the top for a dashboard feel
 * ─────────────────────────────────────────────────────────────────
 */

const api = axios.create({
  baseURL: `${API_BASE_URL}/subscription`,
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await api.get("/transactions");
        setTransactions(data.transactions);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser]);

  // ── LOGIN GATE ─────────────────────────────────────────────────
  if (!authUser) {
    return (
      <div className="txn-page">
        <div className="txn-container">
          <div className="txn-login-required">
            <div className="lock-icon">🔒</div>
            <h3>Login Required</h3>
            <p>You need to be logged in to view your transaction history.</p>
            <Link className="btn-login-link" to="/signin">Sign In →</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="txn-page">
        <div className="txn-container">
          <div className="txn-loading">
            <div className="txn-spinner" />
            <p>Loading your transactions…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── STATS ──────────────────────────────────────────────────────
  const totalSpent = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((s, t) => s + t.total, 0);

  const uniquePlans = new Set(
    transactions.flatMap((t) => t.items.map((i) => i.planId))
  ).size;

  return (
    <div className="txn-page">
      <div className="txn-container">
        <button className="txn-back-btn" onClick={() => navigate("/subscriptions")}>
          ← Back to Plans
        </button>

        <h1>Transaction History</h1>
        <p className="txn-subtitle">All your subscription purchases on KalaSetu.</p>

        {/* Stats bar */}
        <div className="txn-stats">
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{transactions.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">₹{totalSpent}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Plans Purchased</div>
            <div className="stat-value">{uniquePlans}</div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="txn-empty">
            <div className="txn-empty-icon">📭</div>
            <h3>No transactions yet</h3>
            <p>Your purchases will appear here after checkout.</p>
            <Link className="btn-login-link" to="/subscriptions">Browse Plans →</Link>
          </div>
        ) : (
          <div className="txn-list">
            {transactions.map((txn) => (
              <div key={txn._id} className="txn-card">
                <div className="txn-card-header">
                  <div className="txn-id-date">
                    <span className="txn-id">#{txn._id}</span>
                    <span className="txn-date">
                      {new Date(txn.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="txn-status-amount">
                    <span className={`status-badge ${txn.status}`}>{txn.status}</span>
                    <span className="txn-amount">₹{txn.total}</span>
                  </div>
                </div>

                <div className="txn-items">
                  {txn.items.map((item) => (
                    <div key={item.planId} className="txn-item-pill">
                      {item.name}
                      <span className="txn-item-price">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

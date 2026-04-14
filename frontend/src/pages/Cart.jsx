import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import "./Cart.css";

/**
 * Cart Page
 * ─────────────────────────────────────────────────────────────────
 * Demonstrates:
 *  - Cart loaded from server (session-aware — guest or user)
 *  - Checkout requires authentication (guarded client-side)
 *  - Post-checkout: transaction recorded, cart cleared
 *  - Success banner with transaction ID for academic demonstration
 * ─────────────────────────────────────────────────────────────────
 */
export default function Cart() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const {
    items, total, loading, error,
    checkoutResult, fetchCart, removeFromCart, checkout, clearCheckoutResult,
  } = useCartStore();

  useEffect(() => {
    fetchCart();
    // Clear any previous checkout result so the success banner
    // doesn't flash on re-entry after navigating away
    clearCheckoutResult();
  }, []);

  const handleCheckout = async () => {
    if (!authUser) {
      navigate("/signin");
      return;
    }
    try {
      await checkout();
    } catch {
      // error already in store
    }
  };

  const sessionLabel = authUser
    ? `User session: ${authUser.fullName}`
    : "Guest session: Active";

  // ── POST-CHECKOUT SUCCESS VIEW ─────────────────────────────────
  if (checkoutResult) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="checkout-success">
            <div className="success-icon">🎉</div>
            <h2>Purchase Successful!</h2>
            <p>Thank you for supporting KalaSetu. Your subscription is active.</p>
            <p>Total paid: <strong>₹{checkoutResult.total}</strong></p>
            <p className="txn-id">Transaction ID: {checkoutResult.transactionId}</p>
            <p style={{ color: "#64748b", fontSize: "12px", marginTop: "8px" }}>
              Timestamp: {new Date(checkoutResult.timestamp).toLocaleString()}
            </p>
            <button className="btn-view-history" onClick={() => navigate("/transactions")}>
              View Transaction History →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Back link */}
        <button className="cart-back-btn" onClick={() => navigate("/subscriptions")}>
          ← Back to Plans
        </button>

        <h1>Your Cart</h1>
        <p className="cart-subtitle">Review your selected subscription plans before checkout.</p>

        {/* Session awareness indicator */}
        <div className="session-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {sessionLabel}
        </div>

        {loading && !items.length ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>Loading cart…</p>
        ) : items.length === 0 ? (
          // ── EMPTY CART ───────────────────────────────────────────
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add a subscription plan to get started.</p>
            <Link className="btn-browse-plans" to="/subscriptions">Browse Plans →</Link>
          </div>
        ) : (
          <>
            {/* ── CART ITEMS ─────────────────────────────────────── */}
            <div className="cart-items-list">
              {items.map((item) => (
                <div key={item.planId} className="cart-item-card">
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">₹{item.price}<span style={{ fontSize:"12px", color:"var(--text-muted, #6b7280)", fontFamily:"Poppins,Arial,sans-serif", fontWeight:500 }}>/month</span></p>
                  </div>
                  <button
                    className="btn-remove-item"
                    onClick={() => removeFromCart(item.planId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Error from store */}
            {error && (
              <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>⚠ {error}</p>
            )}

            {/* ── ORDER SUMMARY ─────────────────────────────────── */}
            <div className="cart-summary">
              <div className="summary-row">
                <span>{items.length} plan{items.length !== 1 ? "s" : ""}</span>
                <span>₹{total}</span>
              </div>
              <div className="summary-row">
                <span>Taxes</span>
                <span>Included</span>
              </div>
              <hr className="summary-divider" />
              <div className="summary-total-row">
                <span className="summary-total-label">Total</span>
                <span className="summary-total-amount">₹{total}</span>
              </div>

              {/* ── CHECKOUT BUTTON ─────────────────────────────── */}
              <button
                className={`btn-checkout${loading ? " loading" : ""}`}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Processing…" : authUser ? "Checkout (Simulated Payment)" : "Login to Checkout"}
              </button>

              {/* Reminder if not logged in */}
              {!authUser && (
                <div className="auth-required-note">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  You must be logged in to checkout. Your cart will be preserved and merged after login.
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* ── Submission Footer (Academic Proof) ── */}
      <footer className="submission-footer">
        © 2026 KalaSetu 24071A05J9 All rights reserved.
      </footer>
    </div>
  );
}

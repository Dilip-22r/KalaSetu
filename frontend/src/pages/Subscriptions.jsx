import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import "./Subscriptions.css";

/**
 * Subscriptions Page
 * ─────────────────────────────────────────────────────────────────
 * Demonstrates:
 *  - Plans visible to ALL users (guest or logged-in)
 *  - "Add to Cart" works BEFORE login (cart saved under guestId cookie)
 *  - Cart count updates immediately from Zustand store
 *  - Cookie-banner shows students/users that a guestId is active
 * ─────────────────────────────────────────────────────────────────
 */

const PLAN_META = {
  artisan: { emoji: "🎨", color: "#2f6f6d" },  // brand-700 teal
  patron:  { emoji: "⭐", color: "#d17b49" },  // accent-600 terracotta
  ngo:     { emoji: "🌿", color: "#5f918f" },  // brand-500 soft teal
};

export default function Subscriptions() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { plans, items, loading, error, sessionTracking, fetchPlans, fetchCart, addToCart, clearError } = useCartStore();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Fetch plans and current cart state (works for guests via guestId cookie)
    fetchPlans();
    fetchCart();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async (planId) => {
    try {
      await addToCart(planId);
      showToast("Plan added to cart! 🎉", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not add to cart", "error");
    }
  };

  const isInCart = (planId) => items.some((i) => i.planId === planId);

  return (
    <div className="sub-page">
      <div className="sub-header">
        <div className="sub-badge">Subscription Plans</div>
        <h1>Support KalaSetu</h1>
        <p>Choose a plan to unlock full platform features and empower the artisan community.</p>
      </div>

      {/* ── MINIMALIST SESSION TRACKING BAR (Academic Exercise) ── */}
      <div className="demo-bar">
        <div className="demo-bar-item">
          <span className="label">HTTP Session:</span>
          <span className="value">Views: {sessionTracking?.session.viewCount || "..."}</span>
        </div>
        <div className="demo-bar-divider" />
        <div className="demo-bar-item">
          <span className="label">Cookie:</span>
          <span className="value">{sessionTracking?.cookie.value || "..."}</span>
        </div>
        <div className="demo-bar-divider" />
        <div className="demo-bar-item">
          <span className="label">Auth Proof:</span>
          <span className="value">{authUser ? "JWT Valid" : "Guest Mode"}</span>
        </div>
        <div className="demo-bar-tag">Demo Mode</div>
      </div>

      {/* Plans grid */}
      <div className="plans-grid">
        {plans.map((plan) => {
          const meta = PLAN_META[plan.planId] || { emoji: "📦", color: "#94a3b8" };
          const inCart = isInCart(plan.planId);

          return (
            <div
              key={plan.planId}
              className={`plan-card${plan.planId === "patron" ? " popular" : ""}`}
              style={{ "--plan-color": meta.color }}
            >
              {plan.planId === "patron" && <span className="popular-tag">Most Popular</span>}

              <div className="plan-icon">{meta.emoji}</div>
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>

              <div className="plan-price">
                <span className="currency">₹</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/month</span>
              </div>

              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`btn-add-cart${inCart ? " in-cart" : ""}`}
                disabled={loading || inCart}
                onClick={() => !inCart && handleAddToCart(plan.planId)}
              >
                {inCart ? "✓ In Cart" : "Add to Cart"}
              </button>
            </div>
          );
        })}
      </div>

      {/* View Cart CTA */}
      {items.length > 0 && (
        <div className="cart-nav-row">
          <button className="btn-view-cart" onClick={() => navigate("/cart")}>
            View Cart
            <span className="cart-count-bubble">{items.length}</span>
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`sub-toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}

      {/* ── Submission Footer (Academic Proof) ── */}
      <footer className="submission-footer">
        © 2026 KalaSetu 24071A05J9 All rights reserved.
      </footer>
    </div>
  );
}

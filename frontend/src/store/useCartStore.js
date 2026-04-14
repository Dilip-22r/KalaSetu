import { create } from "zustand";
import axios from "axios";
import API_BASE_URL from "../utils/api";

/**
 * useCartStore — Zustand store for subscription cart management
 * ═══════════════════════════════════════════════════════════════
 * This store handles:
 *  - Fetching the cart (works for guest via guestId cookie and
 *    for logged-in users via JWT in Authorization header)
 *  - Adding / removing plans
 *  - Merging guest cart into user cart after login
 *  - Checking out
 *
 * COOKIE INTERACTION:
 *  All requests are sent with `withCredentials: true` so the browser
 *  automatically includes the `guestId` (and `token`) cookies in
 *  every request to the backend.
 * ═══════════════════════════════════════════════════════════════
 */

// Axios instance with credentials so cookies are always sent
const api = axios.create({
  baseURL: `${API_BASE_URL}/subscription`,
  withCredentials: true, // ← sends guestId cookie automatically on every request
});

// Attach JWT from localStorage to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  plans: [],
  loading: false,
  checkoutResult: null,
  sessionTracking: null, // ← stores demo tracking data (ViewCount, StartTime)
  error: null,

  // ── Fetch available plans ────────────────────────────────────
  fetchPlans: async () => {
    try {
      const { data } = await api.get("/plans");
      set({ 
        plans: data.plans,
        sessionTracking: data.trackingDemo // Store the demo session/cookie data
      });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to load plans" });
    }
  },

  // ── Fetch cart for current session (guest OR user) ───────────
  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get("/cart");
      set({ items: data.items, total: data.total, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to load cart" });
    }
  },

  // ── Add a plan to cart ───────────────────────────────────────
  addToCart: async (planId) => {
    set({ loading: true, error: null });
    try {
      await api.post("/cart/add", { planId });
      await get().fetchCart(); // refresh cart state from server
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to add plan" });
      throw err; // re-throw so the UI can show feedback
    }
  },

  // ── Remove a plan from cart ───────────────────────────────────
  removeFromCart: async (planId) => {
    try {
      await api.delete(`/cart/${planId}`);
      await get().fetchCart();
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to remove item" });
    }
  },

  // ── Merge guest cart into user cart (called right after login) ─
  // ─────────────────────────────────────────────────────────────
  // GUEST → USER CART MERGE:
  //  We read the guestId from the cookie via document.cookie.
  //  (The httpOnly flag prevents reading the guestId here, so the
  //   backend reads the cookie directly. We send an empty body — the
  //   backend's assignGuestId middleware already set req.guestId.)
  //  After merge, the backend clears the guestId cookie.
  // ─────────────────────────────────────────────────────────────
  mergeCart: async () => {
    // Read guestId from document.cookie (only works if NOT httpOnly).
    // Since our guestId IS httpOnly, we let the backend read it from
    // the cookie header directly — we just call the endpoint.
    try {
      // The backend reads req.cookies.guestId automatically because
      // withCredentials:true sends all cookies with this request.
      // We still send an empty guestId in body as a fallback signal.
      const guestId = ""; // backend reads from cookie header
      const { data } = await api.post("/cart/merge", { guestId });
      await get().fetchCart();
      return data;
    } catch (err) {
      // Non-fatal — cart might just be empty
      console.warn("Cart merge skipped:", err.response?.data?.message);
    }
  },

  // ── Checkout ─────────────────────────────────────────────────
  checkout: async () => {
    set({ loading: true, error: null, checkoutResult: null });
    try {
      const { data } = await api.post("/checkout");
      set({ items: [], total: 0, loading: false, checkoutResult: data });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Checkout failed" });
      throw err;
    }
  },

  // ── Clear local error ────────────────────────────────────────
  clearError: () => set({ error: null }),
  clearCheckoutResult: () => set({ checkoutResult: null }),
}));

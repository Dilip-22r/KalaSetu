import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  hasMore: true,
  page: 1,
  loading: false,

  fetchNotifications: async (page = 1) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return set({ loading: false });
      
      const res = await axios.get(`${BASE_URL}/notifications?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set(state => ({
        notifications: page === 1 ? res.data.notifications : [...state.notifications, ...res.data.notifications],
        unreadCount: res.data.unreadCount,
        hasMore: res.data.hasMore,
        page: page,
        loading: false
      }));
    } catch (err) {
      console.error("Error fetching notifications", err);
      set({ loading: false });
    }
  },

  markAsRead: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      await axios.put(`${BASE_URL}/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set(state => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      }));
    } catch (err) {
      console.error("Error marking notifications as read", err);
    }
  },

  addNotification: (notification) => {
    set(state => {
      // prevent duplicate notification in list (by checking _id)
      if (state.notifications.some(n => n._id === notification._id)) return state;
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },

  subscribeToNotifications: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    // ensure we don't have multiple listeners
    socket.off("newNotification");

    socket.on("newNotification", (notification) => {
      get().addNotification(notification);
    });
  },

  unsubscribeFromNotifications: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;
    
    socket.off("newNotification");
  }
}));

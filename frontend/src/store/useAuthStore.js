import { create } from "zustand";
import { io } from "socket.io-client";
import API from "../utils/api";

export const useAuthStore = create((set, get) => ({
  authUser: JSON.parse(localStorage.getItem("user") || "null"),
  socket: null,
  onlineUsers: [],

  setAuthUser: (user) => {
    set({ authUser: user });
    if (user) {
      get().connectSocket();
    } else {
      get().disconnectSocket();
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    // Do not reconnect if already running for this user
    if (!authUser || socket?.connected) return;

    const newSocket = io(API, {
      query: {
        userId: authUser._id,
      },
    });

    newSocket.connect();
    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));

// Globally initialize socket immediately if user token is found in localStorage natively
if (useAuthStore.getState().authUser) {
  useAuthStore.getState().connectSocket();
}

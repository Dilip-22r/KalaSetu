import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUserId: null,
  isTyping: false,

  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setMessages: (newMessages) => set({ messages: newMessages }),

  updateMessageStatus: (messageId, status) => {
    set({
      messages: get().messages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
    });
  },

  markAllSeen: (partnerId) => {
    set({
      messages: get().messages.map((m) => {
        const senderId = String(m.sender?._id ?? m.sender ?? "");
        return senderId === String(partnerId) ? { ...m, status: "seen" } : m;
      }),
    });
  },

  markMessageDeleted: (messageId) => {
    set({
      messages: get().messages.map((m) =>
        m._id === messageId
          ? { ...m, text: "This message was deleted", deleted: true }
          : m
      ),
    });
  },

  addMessage: (msg) => {
    set({ messages: [...get().messages, msg] });
  },

  removeMessageById: (msgId) => {
    set({ messages: get().messages.filter((m) => m._id !== msgId) });
  },

  subscribeToMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUserId } = get();
      const senderId = newMessage.sender?._id ?? newMessage.sender;
      if (!selectedUserId || String(senderId) !== String(selectedUserId)) return;
      set({ messages: [...get().messages, newMessage], isTyping: false });
      const { socket: s } = useAuthStore.getState();
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      if (s?.connected && currentUser?._id) {
        s.emit("mark_seen", { viewerId: currentUser._id, partnerId: senderId });
      }
    });

    socket.on("message_delivered", ({ messageId }) => {
      get().updateMessageStatus(messageId, "delivered");
    });

    socket.on("message_seen", ({ partnerId }) => {
      get().markAllSeen(partnerId);
    });

    socket.on("message_deleted", ({ messageId }) => {
      get().markMessageDeleted(messageId);
    });

    socket.on("typing", ({ from }) => {
      const { selectedUserId } = get();
      if (String(from) === String(selectedUserId)) set({ isTyping: true });
    });

    socket.on("stop_typing", ({ from }) => {
      const { selectedUserId } = get();
      if (String(from) === String(selectedUserId)) set({ isTyping: false });
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;
    socket.off("newMessage");
    socket.off("message_delivered");
    socket.off("message_seen");
    socket.off("message_deleted");
    socket.off("typing");
    socket.off("stop_typing");
  },
}));

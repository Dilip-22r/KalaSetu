import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setMessages: (newMessages) => set({ messages: newMessages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
    }));
  },

  markAllSeen: (partnerId) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        const senderId = String(m.sender?._id ?? m.sender ?? "");
        return senderId !== String(partnerId) ? { ...m, status: "seen" } : m;
      }),
    }));
  },

  markMessageDeleted: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, text: "This message was deleted", deleted: true } : m
      ),
    }));
  },

  subscribeToMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUserId, addMessage } = get();
      if (!selectedUserId || newMessage.sender._id !== selectedUserId) return;
      addMessage(newMessage);
      const { socket: currentSocket } = useAuthStore.getState();
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      if (currentSocket?.connected && currentUser?._id) {
        currentSocket.emit("mark_seen", { viewerId: currentUser._id, partnerId: newMessage.sender._id });
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
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;
    socket.off("newMessage");
    socket.off("message_delivered");
    socket.off("message_seen");
    socket.off("message_deleted");
  },
}));
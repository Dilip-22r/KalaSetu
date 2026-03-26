import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setMessages: (newMessages) => set({ messages: newMessages }),

  // Update a single message's status by its _id
  updateMessageStatus: (messageId, status) => {
    set({
      messages: get().messages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
    });
  },

  // Set all messages sent BY the current user (NOT by the viewer) to "seen".
  // partnerId = the user who just opened the chat and viewed the messages.
  // We mark messages where sender !== partnerId, because those are the messages
  // the current user sent — which the partner just read.
  markAllSeen: (partnerId) => {
    set({
      messages: get().messages.map((m) => {
        const senderId = String(m.sender?._id ?? m.sender ?? "");
        return senderId !== String(partnerId) ? { ...m, status: "seen" } : m;
      }),
    });
  },

  subscribeToMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    // New incoming message
    socket.on("newMessage", (newMessage) => {
      const { selectedUserId } = get();
      if (!selectedUserId || newMessage.sender._id !== selectedUserId) return;
      set({ messages: [...get().messages, newMessage] });

      // The receiver is actively viewing this conversation — emit mark_seen immediately
      // so the sender's tick turns blue in real-time (no refresh needed).
      const { socket: currentSocket } = useAuthStore.getState();
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      if (currentSocket?.connected && currentUser?._id) {
        currentSocket.emit("mark_seen", {
          viewerId: currentUser._id,
          partnerId: newMessage.sender._id,
        });
      }
    });

    // Sender's own message was delivered (receiver came online or was already online)
    socket.on("message_delivered", ({ messageId }) => {
      get().updateMessageStatus(messageId, "delivered");
    });

    // Receiver opened the chat — all our sent messages are now "seen"
    socket.on("message_seen", ({ partnerId }) => {
      get().markAllSeen(partnerId);
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;
    socket.off("newMessage");
    socket.off("message_delivered");
    socket.off("message_seen");
  },
}));

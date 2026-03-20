import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setMessages: (newMessages) => set({ messages: newMessages }),

  subscribeToMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUserId } = get();
      
      // Only append if the chat is actively open on the screen
      if (!selectedUserId || newMessage.sender._id !== selectedUserId) return;

      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;
    
    // Cleanup function to prevent memory leaks or duplicate messages
    socket.off("newMessage");
  },
}));

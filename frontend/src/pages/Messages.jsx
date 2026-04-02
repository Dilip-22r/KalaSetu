import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import "./Messages.css";
import Navbar from "../components/common/Navbar";

const API = "http://localhost:5000";

function MessageTick({ status }) {
  if (status === "seen") {
    return (
      <span className="msg-tick seen" title="Seen">
        <i className="fi fi-sr-check" />
        <i className="fi fi-sr-check" />
      </span>
    );
  }
  if (status === "delivered") {
    return (
      <span className="msg-tick delivered" title="Delivered">
        <i className="fi fi-sr-check" />
        <i className="fi fi-sr-check" />
      </span>
    );
  }
  return (
    <span className="msg-tick sent" title="Sent">
      <i className="fi fi-sr-check" />
    </span>
  );
}

function Messages() {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  const authUser = useAuthStore((state) => state.authUser);
  const user = authUser ?? JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(paramUserId || null);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [msgMenuId, setMsgMenuId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState(null);

  const { onlineUsers, socket } = useAuthStore();
  const {
    messages,
    setMessages,
    setSelectedUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessageDeleted,
  } = useChatStore();

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const showNotification = useCallback((message) => {
    setNotification({ text: message });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!token || !user || user.role === "user") {
      setConversations([]);
      setLoadingConvs(false);
      return;
    }

    setLoadingConvs(true);
    try {
      const res = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
    } catch {
      setConversations([]);
    }
    setLoadingConvs(false);
  }, [token, user]);

  const openConversation = useCallback(async (uid) => {
    if (!uid || !token || !user || user.role === "user") return;

    navigate(`/messages/${uid}`, { replace: true });
    try {
      const res = await axios.get(`${API}/messages/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);

      if (socket?.connected) {
        socket.emit("mark_seen", { viewerId: user._id, partnerId: uid });
      }

      const conversation = conversations.find(
        (entry) => entry.partner._id === uid || entry.partner._id?.toString() === uid
      );

      if (conversation) {
        setActiveUser(conversation.partner);
        return;
      }

      try {
        const profileRes = await axios.get(`${API}/profiles/${uid}`);
        setActiveUser(profileRes.data.user);
      } catch {
        try {
          const userRes = await axios.get(`${API}/auth/user/${uid}`);
          setActiveUser(userRes.data);
        } catch {
          setActiveUser(null);
        }
      }
    } catch {
      setMessages([]);
    }
  }, [conversations, navigate, setMessages, socket, token, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!activeUserId || !user || user.role === "user") return;
    setSelectedUserId(activeUserId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    openConversation(activeUserId);
  }, [activeUserId, openConversation, setSelectedUserId, user]);

  useEffect(() => {
    if (!user || user.role === "user") return undefined;
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [subscribeToMessages, unsubscribeFromMessages, user]);

  useEffect(() => {
    if (!socket || !user || user.role === "user") return undefined;

    const handleNew = (msg) => {
      const senderId = msg.sender?._id ?? msg.sender;
      if (senderId !== activeUserId) {
        const senderName = msg.sender?.fullName || msg.sender?.username || "Someone";
        showNotification(`New message from ${senderName}`);
      }
      fetchConversations();
    };

    socket.on("newMessage", handleNew);
    return () => socket.off("newMessage", handleNew);
  }, [activeUserId, fetchConversations, showNotification, socket, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = () => setMsgMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim() || !activeUserId) return;

    setSending(true);
    try {
      const res = await axios.post(
        `${API}/messages`,
        {
          receiverId: activeUserId,
          text,
          replyTo: replyTo?._id || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([...messages, res.data]);
      setText("");
      setReplyTo(null);
      fetchConversations();
    } catch {
      showNotification("Failed to send message");
    }
    setSending(false);
  };

  const handleDeleteForEveryone = async (msgId) => {
    try {
      await axios.delete(`${API}/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      markMessageDeleted(msgId);
    } catch {
      showNotification("Failed to delete message");
    }
    setMsgMenuId(null);
  };

  const handleDeleteForMe = async (msgId) => {
    try {
      await axios.delete(`${API}/messages/${msgId}/for-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      useChatStore.getState().setMessages(messages.filter((msg) => msg._id !== msgId));
    } catch {
      showNotification("Failed to remove message");
    }
    setMsgMenuId(null);
  };

  const handleClearChat = async () => {
    try {
      await axios.delete(`${API}/messages/clear/${activeUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
      fetchConversations();
    } catch {
      showNotification("Failed to clear chat");
    }
    setShowClearConfirm(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await axios.get(`${API}/profiles/creators`, { params: { search: query } });
      setSearchResults(res.data.filter((profile) => profile.user._id !== user._id));
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const startNewConversation = (profile) => {
    const uid = profile.user._id;
    setActiveUserId(uid);
    setActiveUser(profile.user);
    navigate(`/messages/${uid}`, { replace: true });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleReply = (msg) => {
    const senderName =
      msg.sender?._id === user._id || msg.sender === user._id ? "You" : activeUser?.fullName || "Them";
    setReplyTo({ _id: msg._id, text: msg.text, senderName });
    setMsgMenuId(null);
    inputRef.current?.focus();
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date) => {
    const value = new Date(date);
    const today = new Date();
    if (value.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (value.toDateString() === yesterday.toDateString()) return "Yesterday";
    return value.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  if (!user || user.role === "user") {
    return (
      <div className="msg-bg">
        <Navbar />
        <div className="msg-locked">
          <span><i className="fi fi-sr-comments" /></span>
          <h2>Messaging is for Artisans and NGOs</h2>
          <p>Register as an Artisan or NGO to unlock messaging.</p>
          <button onClick={() => navigate(user ? "/register" : "/signin")}>
            {user ? "Register Now" : "Sign In"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-bg">
      {notification && (
        <div className="msg-notification-toast">
          <i className="fi fi-sr-bell" /> {notification.text}
        </div>
      )}

      {showClearConfirm && (
        <div className="msg-modal-overlay">
          <div className="msg-modal">
            <h3>Clear Chat</h3>
            <p>This will permanently delete all messages in this conversation for both sides. Are you sure?</p>
            <div className="msg-modal-btns">
              <button className="msg-modal-cancel" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button className="msg-modal-confirm" onClick={handleClearChat}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />

      <div className="msg-layout">
        <div className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h3><i className="fi fi-sr-comments" /> Messages</h3>
            {onlineUsers.length > 0 && <span className="msg-online-count">{onlineUsers.length} online</span>}
          </div>

          <div className="msg-search-wrap">
            <input
              type="text"
              placeholder="Find artisans and NGOs..."
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              className="msg-search"
            />
            {searchQuery && (
              <div className="msg-search-dropdown">
                {searching ? (
                  <div className="msg-search-loading">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="msg-search-empty">No results found</div>
                ) : (
                  searchResults.map((profile) => (
                    <div
                      key={profile._id}
                      className="msg-search-item"
                      onClick={() => startNewConversation(profile)}
                    >
                      <div className="msg-mini-avatar">{profile.user?.username?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="msg-search-name">{profile.displayName || profile.user?.fullName}</div>
                        <div className={`msg-search-role ${profile.user?.role}`}>{profile.user?.role}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="msg-conv-list">
            {loadingConvs ? (
              <div className="msg-conv-loading">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="msg-conv-empty">
                <p>No conversations yet.</p>
                <p>Search above to start one.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const partnerId = conv.partner._id?.toString() ?? conv.partner._id;
                const isActive = activeUserId === partnerId || activeUserId === conv.partner._id;
                const isOnline = onlineUsers.includes(partnerId);

                return (
                  <div
                    key={partnerId}
                    className={`msg-conv-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveUser(conv.partner);
                      setActiveUserId(partnerId);
                    }}
                  >
                    <div className="msg-conv-avatar-wrap">
                      <div className="msg-conv-avatar">
                        {conv.partner.photo ? (
                          <img src={conv.partner.photo} alt="" className="msg-conv-avatar-img" />
                        ) : (
                          conv.partner.username?.[0]?.toUpperCase() || conv.partner.fullName?.[0]?.toUpperCase()
                        )}
                      </div>
                      {isOnline && <span className="msg-online-dot"></span>}
                    </div>
                    <div className="msg-conv-info">
                      <div className="msg-conv-name">{conv.partner.fullName || conv.partner.username || "Unknown"}</div>
                      <div className="msg-conv-last">
                        {conv.lastMessage?.deleted
                          ? "Message deleted"
                          : conv.lastMessage?.text
                            ? conv.lastMessage.text.slice(0, 34) + (conv.lastMessage.text.length > 34 ? "..." : "")
                            : "No messages yet"}
                      </div>
                    </div>
                    <div className="msg-conv-time">{formatDate(conv.lastMessage?.createdAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="msg-chat">
          {!activeUserId ? (
            <div className="msg-empty-chat">
              <span><i className="fi fi-sr-comments" /></span>
              <h3>Select a conversation</h3>
              <p>Choose from the list or search for someone to message</p>
            </div>
          ) : (
            <>
              <div className="msg-chat-header">
                <div className="msg-chat-avatar-wrap">
                  <div className="msg-chat-avatar">
                    {activeUser?.photo ? (
                      <img src={activeUser.photo} alt="" className="msg-chat-avatar-img" />
                    ) : (
                      activeUser?.username?.[0]?.toUpperCase() || activeUser?.fullName?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  {onlineUsers.includes(activeUserId) && <span className="msg-chat-online-dot"></span>}
                </div>
                <div className="msg-chat-header-info">
                  <div className="msg-chat-name">{activeUser?.fullName || activeUser?.username || "User"}</div>
                  <div className="msg-chat-status">
                    {onlineUsers.includes(activeUserId) ? (
                      <span className="msg-online-text">Online</span>
                    ) : (
                      <span className={`msg-chat-role ${activeUser?.role}`}>{activeUser?.role}</span>
                    )}
                  </div>
                </div>
                <div className="msg-chat-actions">
                  <button className="msg-view-profile" onClick={() => navigate(`/profile/${activeUserId}`)}>
                    <i className="fi fi-sr-user" /> View Profile
                  </button>
                  <button className="msg-clear-btn" onClick={() => setShowClearConfirm(true)} title="Clear chat">
                    <i className="fi fi-sr-trash" /> Clear
                  </button>
                </div>
              </div>

              <div className="msg-messages">
                {messages.length === 0 ? (
                  <div className="msg-no-msgs">Start the conversation.</div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                    <div key={dateKey}>
                      <div className="msg-date-separator">
                        <span>{formatDate(dayMessages[0].createdAt)}</span>
                      </div>
                      {dayMessages.map((msg, index) => {
                        const isMine =
                          msg.sender?._id === user._id ||
                          msg.sender?._id?.toString() === user._id ||
                          msg.sender === user._id;
                        const isDeleted = msg.deleted;

                        return (
                          <div key={msg._id || index} className={`msg-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
                            <div
                              className={`msg-bubble ${isMine ? "mine" : "theirs"} ${isDeleted ? "deleted" : ""}`}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                if (!isDeleted) setMsgMenuId(msg._id);
                              }}
                            >
                              {msg.replyTo && !isDeleted && (
                                <div className="msg-reply-preview">
                                  <span className="msg-reply-name">
                                    {msg.replyTo.sender === user._id || msg.replyTo.sender?._id === user._id
                                      ? "You"
                                      : activeUser?.fullName || "Them"}
                                  </span>
                                  <span className="msg-reply-text">{msg.replyTo.text?.slice(0, 60)}</span>
                                </div>
                              )}
                              <p>{isDeleted ? "This message was deleted" : msg.text}</p>
                              <div className="msg-bubble-footer">
                                <span className="msg-time">{formatTime(msg.createdAt)}</span>
                                {isMine && !isDeleted && <MessageTick status={msg.status} />}
                              </div>
                            </div>

                            {!isDeleted && msgMenuId === msg._id && (
                              <div
                                className={`msg-context-menu ${isMine ? "mine" : "theirs"}`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button onClick={() => handleReply(msg)}><i className="fi fi-sr-reply" /> Reply</button>
                                {isMine && (
                                  <button className="msg-ctx-delete" onClick={() => handleDeleteForEveryone(msg._id)}>
                                    <i className="fi fi-sr-trash" /> Delete for Everyone
                                  </button>
                                )}
                                <button className="msg-ctx-delete-me" onClick={() => handleDeleteForMe(msg._id)}>
                                  <i className="fi fi-sr-cross-small" /> Delete for Me
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {replyTo && (
                <div className="msg-reply-bar">
                  <div className="msg-reply-bar-inner">
                    <span className="msg-reply-bar-label">Replying to {replyTo.senderName}</span>
                    <span className="msg-reply-bar-text">
                      {replyTo.text?.slice(0, 60)}
                      {replyTo.text?.length > 60 ? "..." : ""}
                    </span>
                  </div>
                  <button className="msg-reply-cancel" onClick={() => setReplyTo(null)}>
                    <i className="fi fi-sr-cross-small" />
                  </button>
                </div>
              )}

              <form className="msg-input-bar" onSubmit={handleSend}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="msg-text-input"
                />
                <button type="submit" className="msg-send-btn" disabled={sending || !text.trim()}>
                  <i className="fi fi-sr-comment-alt-dots" /> {sending ? "..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;

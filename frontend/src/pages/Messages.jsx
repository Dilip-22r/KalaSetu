import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import "./Messages.css";

const API = "http://localhost:5000";

// ─── Tick component ───────────────────────────────────────────────────────────
function MessageTick({ status }) {
  if (status === "seen")
    return <span className="msg-tick seen" title="Seen">✓✓</span>;
  if (status === "delivered")
    return <span className="msg-tick delivered" title="Delivered">✓✓</span>;
  return <span className="msg-tick sent" title="Sent">✓</span>;
}

// ─── Typing bubble ────────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="msg-bubble-wrap theirs">
      <div className="msg-typing-bubble">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
function Messages() {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  // Redirect to sign in if not logged in
  if (!user || !token) {
    return (
      <div className="msg-bg">
        <nav className="msg-navbar">
          <h1 onClick={() => navigate("/")}>KalaSetu</h1>
        </nav>
        <div className="msg-locked">
          <span>💬</span>
          <h2>Sign in to access Messages</h2>
          <p>You need to be logged in to send and receive messages.</p>
          <button onClick={() => navigate("/signin")}>Sign In</button>
        </div>
      </div>
    );
  }

  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(paramUserId || null);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [msgMenuId, setMsgMenuId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { onlineUsers, socket } = useAuthStore();
  const {
    messages,
    setMessages,
    addMessage,
    removeMessageById,
    setSelectedUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessageDeleted,
    isTyping,
  } = useChatStore();

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const searchTimerRef = useRef(null);

  // ── On mount: subscribe socket events ──
  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, []);

  // ── Open convo from URL param ──
  useEffect(() => {
    fetchConversations();
    if (paramUserId) {
      setActiveUserId(paramUserId);
      setSelectedUserId(paramUserId);
      openConversation(paramUserId);
    }
  }, []);

  // ── Listen for new messages from OTHER users (notification + sidebar update) ──
  useEffect(() => {
    if (!socket) return;
    const handleNew = (msg) => {
      const senderId = String(msg.sender?._id ?? msg.sender);
      if (senderId !== String(activeUserId)) {
        const name = msg.sender?.fullName || msg.sender?.username || "Someone";
        showNotification(`New message from ${name}`);
      }
      fetchConversations();
    };
    socket.on("newMessage", handleNew);
    return () => socket.off("newMessage", handleNew);
  }, [socket, activeUserId]);

  // ── Auto scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Close context menu on outside click ──
  useEffect(() => {
    const handler = () => { setMsgMenuId(null); setShowEmojiPicker(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const showNotification = (text) => {
    setNotification({ text });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Fetch conversations list ──
  const fetchConversations = async () => {
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
  };

  // ── Open / switch conversation ──
  const openConversation = async (uid) => {
    setLoadingMsgs(true);
    navigate(`/messages/${uid}`, { replace: true });
    setSelectedUserId(uid);
    try {
      const res = await axios.get(`${API}/messages/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);

      if (socket?.connected) {
        socket.emit("mark_seen", { viewerId: user._id, partnerId: uid });
      }

      // Resolve active user info
      const conv = conversations.find(
        (c) => String(c.partner._id) === String(uid)
      );
      if (conv) {
        setActiveUser(conv.partner);
      } else {
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
      }
    } catch {
      setMessages([]);
    }
    setLoadingMsgs(false);
  };

  // ── Send message ──
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId || sending) return;
    setSending(true);

    // Stop typing immediately
    if (socket?.connected) socket.emit("stop_typing", { to: activeUserId });
    clearTimeout(typingTimerRef.current);

    try {
      const res = await axios.post(
        `${API}/messages`,
        { receiverId: activeUserId, text: text.trim(), replyTo: replyTo?._id || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addMessage(res.data);
      setText("");
      setReplyTo(null);
      fetchConversations();
    } catch {}
    setSending(false);
    inputRef.current?.focus();
  };

  // ── Typing indicator ──
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket?.connected || !activeUserId) return;
    socket.emit("typing", { to: activeUserId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stop_typing", { to: activeUserId });
    }, 1500);
  };

  // ── Delete for everyone ──
  const handleDeleteForEveryone = async (msgId) => {
    try {
      await axios.delete(`${API}/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      markMessageDeleted(msgId);
    } catch {}
    setMsgMenuId(null);
  };

  // ── Delete for me ──
  const handleDeleteForMe = async (msgId) => {
    try {
      await axios.delete(`${API}/messages/${msgId}/for-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      removeMessageById(msgId);
    } catch {}
    setMsgMenuId(null);
  };

  // ── Clear chat ──
  const handleClearChat = async () => {
    try {
      await axios.delete(`${API}/messages/clear/${activeUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
      fetchConversations();
    } catch {}
    setShowClearConfirm(false);
  };

  // ── Search users (debounced) ──
  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/auth/users/search`, {
          params: { q },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
  };

  const startNewConversation = (u) => {
    setActiveUserId(u._id);
    setActiveUser(u);
    setSelectedUserId(u._id);
    navigate(`/messages/${u._id}`, { replace: true });
    setSearchQuery("");
    setSearchResults([]);
    openConversation(u._id);
  };

  const handleReply = (msg) => {
    const myId = user._id;
    const senderId = String(msg.sender?._id ?? msg.sender);
    const senderName = senderId === String(myId) ? "You" : (activeUser?.fullName || activeUser?.username || "Them");
    setReplyTo({ _id: msg._id, text: msg.text, senderName });
    setMsgMenuId(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const key = new Date(msg.createdAt).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const EMOJIS = ["😊", "😂", "❤️", "👍", "🙏", "🔥", "✨", "😍", "🎉", "👋", "😮", "😢"];

  return (
    <div className="msg-bg">
      {/* Toast notification */}
      {notification && (
        <div className="msg-notification-toast">
          🔔 {notification.text}
        </div>
      )}

      {/* Clear chat modal */}
      {showClearConfirm && (
        <div className="msg-modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="msg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal-icon">🗑️</div>
            <h3>Clear Chat</h3>
            <p>This will permanently delete all messages in this conversation. Are you sure?</p>
            <div className="msg-modal-btns">
              <button className="msg-modal-cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="msg-modal-confirm" onClick={handleClearChat}>Yes, Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="msg-navbar">
        <h1 onClick={() => navigate("/home")}>KalaSetu</h1>
        <div className="msg-nav-btns">
          <button onClick={() => navigate("/home")}>← Dashboard</button>
        </div>
      </nav>

      <div className="msg-layout">
        {/* ── Sidebar ── */}
        <div className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h3>Messages</h3>
            {onlineUsers.length > 1 && (
              <span className="msg-online-count">{onlineUsers.length - 1} online</span>
            )}
          </div>

          {/* Search */}
          <div className="msg-search-wrap">
            <span className="msg-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="msg-search"
            />
            {searchQuery && (
              <button className="msg-search-clear" onClick={() => { setSearchQuery(""); setSearchResults([]); }}>✕</button>
            )}
            {searchQuery && (
              <div className="msg-search-dropdown">
                {searching ? (
                  <div className="msg-search-loading">
                    <span className="msg-spinner" /> Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="msg-search-empty">No users found</div>
                ) : (
                  searchResults.map((u) => (
                    <div
                      key={u._id}
                      className="msg-search-item"
                      onClick={() => startNewConversation(u)}
                    >
                      <div className="msg-mini-avatar">
                        {u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="msg-search-name">{u.fullName || u.username}</div>
                        <div className="msg-search-sub">@{u.username}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Conversation list */}
          <div className="msg-conv-list">
            {loadingConvs ? (
              <div className="msg-conv-loading">
                <span className="msg-spinner" /> Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="msg-conv-empty">
                <span>💬</span>
                <p>No conversations yet.</p>
                <p>Search above to start one!</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const pid = String(conv.partner._id);
                const isActive = String(activeUserId) === pid;
                const isOnline = onlineUsers.includes(pid);
                return (
                  <div
                    key={pid}
                    className={`msg-conv-item${isActive ? " active" : ""}`}
                    onClick={() => {
                      setActiveUser(conv.partner);
                      setActiveUserId(pid);
                      setSelectedUserId(pid);
                      openConversation(pid);
                    }}
                  >
                    <div className="msg-conv-avatar-wrap">
                      <div className="msg-conv-avatar">
                        {conv.partner.photo ? (
                          <img src={conv.partner.photo} alt="" className="msg-conv-avatar-img" />
                        ) : (
                          (conv.partner.fullName?.[0] || conv.partner.username?.[0] || "?").toUpperCase()
                        )}
                      </div>
                      {isOnline && <span className="msg-online-dot" />}
                    </div>
                    <div className="msg-conv-info">
                      <div className="msg-conv-name">
                        {conv.partner.fullName || conv.partner.username || "Unknown"}
                      </div>
                      <div className="msg-conv-last">
                        {conv.lastMessage?.deleted
                          ? "🚫 Message deleted"
                          : (conv.lastMessage?.text || "No messages yet").slice(0, 38) +
                            ((conv.lastMessage?.text?.length || 0) > 38 ? "..." : "")}
                      </div>
                    </div>
                    <div className="msg-conv-meta">
                      <div className="msg-conv-time">{formatDate(conv.lastMessage?.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="msg-chat">
          {!activeUserId ? (
            <div className="msg-empty-chat">
              <div className="msg-empty-icon">💬</div>
              <h3>Your Messages</h3>
              <p>Select a conversation or search for a user to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="msg-chat-header">
                <div className="msg-chat-avatar-wrap">
                  <div className="msg-chat-avatar">
                    {activeUser?.photo ? (
                      <img src={activeUser.photo} alt="" className="msg-chat-avatar-img" />
                    ) : (
                      (activeUser?.fullName?.[0] || activeUser?.username?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  {onlineUsers.includes(activeUserId) && <span className="msg-chat-online-dot" />}
                </div>
                <div className="msg-chat-header-info">
                  <div className="msg-chat-name">
                    {activeUser?.fullName || activeUser?.username || "User"}
                  </div>
                  <div className="msg-chat-status">
                    {onlineUsers.includes(String(activeUserId)) ? (
                      <span className="msg-online-text">● Online</span>
                    ) : (
                      <span className="msg-offline-text">● Offline</span>
                    )}
                  </div>
                </div>
                <div className="msg-chat-actions">
                  <button
                    className="msg-view-profile"
                    onClick={() => navigate(`/profile/${activeUserId}`)}
                    title="View Profile"
                  >
                    👤 Profile
                  </button>
                  <button
                    className="msg-clear-btn"
                    onClick={() => setShowClearConfirm(true)}
                    title="Clear chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="msg-messages">
                {loadingMsgs ? (
                  <div className="msg-loading-msgs">
                    <span className="msg-spinner" /> Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="msg-no-msgs">
                    <span>👋</span>
                    <p>Start the conversation!</p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dayMsgs]) => (
                    <div key={dateKey}>
                      <div className="msg-date-separator">
                        <span>{formatDate(dayMsgs[0].createdAt)}</span>
                      </div>
                      {dayMsgs.map((msg, i) => {
                        const myId = String(user._id);
                        const senderId = String(msg.sender?._id ?? msg.sender);
                        const isMine = senderId === myId;
                        const isDeleted = msg.deleted;
                        return (
                          <div
                            key={msg._id || i}
                            className={`msg-bubble-wrap ${isMine ? "mine" : "theirs"}`}
                          >
                            <div
                              className={`msg-bubble ${isMine ? "mine" : "theirs"}${isDeleted ? " deleted" : ""}`}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (!isDeleted) setMsgMenuId(msg._id);
                              }}
                            >
                              {/* Reply preview */}
                              {msg.replyTo && !isDeleted && (
                                <div className="msg-reply-preview">
                                  <span className="msg-reply-name">
                                    {String(msg.replyTo.sender?._id ?? msg.replyTo.sender) === myId
                                      ? "You"
                                      : activeUser?.fullName || "Them"}
                                  </span>
                                  <span className="msg-reply-text">
                                    {msg.replyTo.text?.slice(0, 60)}
                                  </span>
                                </div>
                              )}

                              <p>{isDeleted ? "🚫 This message was deleted" : msg.text}</p>

                              <div className="msg-bubble-footer">
                                <span className="msg-time">{formatTime(msg.createdAt)}</span>
                                {isMine && !isDeleted && <MessageTick status={msg.status} />}
                              </div>
                            </div>

                            {/* Context menu (right-click) */}
                            {!isDeleted && msgMenuId === msg._id && (
                              <div
                                className={`msg-context-menu ${isMine ? "mine" : "theirs"}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button onClick={() => handleReply(msg)}>↩️ Reply</button>
                                {isMine && (
                                  <button
                                    className="msg-ctx-delete"
                                    onClick={() => handleDeleteForEveryone(msg._id)}
                                  >
                                    🗑️ Delete for Everyone
                                  </button>
                                )}
                                <button
                                  className="msg-ctx-delete-me"
                                  onClick={() => handleDeleteForMe(msg._id)}
                                >
                                  Delete for Me
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                {isTyping && <TypingBubble />}

                <div ref={bottomRef} />
              </div>

              {/* Reply bar */}
              {replyTo && (
                <div className="msg-reply-bar">
                  <div className="msg-reply-bar-inner">
                    <span className="msg-reply-bar-label">Replying to {replyTo.senderName}</span>
                    <span className="msg-reply-bar-text">
                      {replyTo.text?.slice(0, 70)}{replyTo.text?.length > 70 ? "..." : ""}
                    </span>
                  </div>
                  <button className="msg-reply-cancel" onClick={() => setReplyTo(null)}>✕</button>
                </div>
              )}

              {/* Input bar */}
              <form className="msg-input-bar" onSubmit={handleSend}>
                {/* Emoji picker */}
                <div className="msg-emoji-wrap">
                  <button
                    type="button"
                    className="msg-emoji-btn"
                    onClick={(e) => { e.stopPropagation(); setShowEmojiPicker((p) => !p); }}
                    title="Emoji"
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div className="msg-emoji-picker" onClick={(e) => e.stopPropagation()}>
                      {EMOJIS.map((em) => (
                        <button key={em} type="button" className="msg-emoji-opt" onClick={() => addEmoji(em)}>
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={handleTyping}
                  className="msg-text-input"
                  autoComplete="off"
                />

                <button
                  type="submit"
                  className="msg-send-btn"
                  disabled={sending || !text.trim()}
                >
                  {sending ? <span className="msg-spinner" /> : "➤"}
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

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import "./Messages.css";

const API = "http://localhost:5000";

function MessageTick({ status }) {
  if (status === "seen") return <span className="msg-tick seen" title="Seen">✓✓</span>;
  if (status === "delivered") return <span className="msg-tick delivered" title="Delivered">✓✓</span>;
  return <span className="msg-tick sent" title="Sent">✓</span>;
}

function Messages() {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "null");
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
  const [replyTo, setReplyTo] = useState(null); // { _id, text, senderName }
  const [msgMenuId, setMsgMenuId] = useState(null); // which message has context menu open
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState(null); // { text }

  const { onlineUsers, socket } = useAuthStore();
  const { messages, setMessages, setSelectedUserId, subscribeToMessages, unsubscribeFromMessages, markMessageDeleted } = useChatStore();

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Role gate
  if (!user || user.role === "user") {
    return (
      <div className="msg-bg">
        <nav className="msg-navbar"><h1 onClick={() => navigate(user ? "/home" : "/")}>KalaSetu</h1></nav>
        <div className="msg-locked">
          <span>💬</span>
          <h2>Messaging is for Artisans &amp; NGOs</h2>
          <p>Register as an Artisan or NGO to unlock messaging.</p>
          <button onClick={() => navigate(user ? "/register" : "/signin")}>
            {user ? "Register Now" : "Sign In"}
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (activeUserId) {
      setSelectedUserId(activeUserId);
      openConversation(activeUserId);
    }
  }, [activeUserId]);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, []);

  // Real-time: new message from someone NOT in active chat → show notification + refresh sidebar
  useEffect(() => {
    if (!socket) return;
    const handleNew = (msg) => {
      const senderId = msg.sender?._id ?? msg.sender;
      if (senderId !== activeUserId) {
        const name = msg.sender?.fullName || msg.sender?.username || "Someone";
        showNotification(`New message from ${name}`);
        fetchConversations();
      } else {
        fetchConversations(); // keep sidebar last message up to date
      }
    };
    socket.on("newMessage", handleNew);
    return () => socket.off("newMessage", handleNew);
  }, [socket, activeUserId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setMsgMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const showNotification = (text) => {
    setNotification({ text });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
    } catch { setConversations([]); }
    setLoadingConvs(false);
  };

  const openConversation = async (uid) => {
    navigate(`/messages/${uid}`, { replace: true });
    try {
      const res = await axios.get(`${API}/messages/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
      if (socket?.connected) socket.emit("mark_seen", { viewerId: user._id, partnerId: uid });

      // FIX: find partner from conversations OR fetch from profiles API
      const conv = conversations.find(c => c.partner._id === uid || c.partner._id?.toString() === uid);
      if (conv) {
        setActiveUser(conv.partner);
      } else {
        // New conversation — fetch user info directly
        try {
          const profileRes = await axios.get(`${API}/profiles/${uid}`);
          setActiveUser(profileRes.data.user);
        } catch {
          // fallback: try to get from users
          try {
            const userRes = await axios.get(`${API}/auth/user/${uid}`);
            setActiveUser(userRes.data);
          } catch { setActiveUser(null); }
        }
      }
    } catch { setMessages([]); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/messages`, {
        receiverId: activeUserId,
        text,
        replyTo: replyTo?._id || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages([...messages, res.data]);
      setText("");
      setReplyTo(null);
      fetchConversations();
    } catch {}
    setSending(false);
  };

  // Delete for everyone (sender only) — shows "deleted" placeholder to both sides
  const handleDeleteForEveryone = async (msgId) => {
    try {
      await axios.delete(`${API}/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      markMessageDeleted(msgId);
    } catch {}
    setMsgMenuId(null);
  };

  // Delete for me only — removes from current user's view silently
  const handleDeleteForMe = async (msgId) => {
    try {
      await axios.delete(`${API}/messages/${msgId}/for-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove from local state immediately
      const { setMessages: sm } = useChatStore.getState();
      sm(messages.filter(m => m._id !== msgId));
    } catch {}
    setMsgMenuId(null);
  };

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

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await axios.get(`${API}/profiles/creators`, { params: { search: q } });
      setSearchResults(res.data.filter(p => p.user._id !== user._id));
    } catch { setSearchResults([]); }
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
    const senderName = msg.sender?._id === user._id || msg.sender === user._id ? "You" : (activeUser?.fullName || "Them");
    setReplyTo({ _id: msg._id, text: msg.text, senderName });
    setMsgMenuId(null);
    inputRef.current?.focus();
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="msg-bg">
      {/* Notification toast */}
      {notification && (
        <div className="msg-notification-toast">
          🔔 {notification.text}
        </div>
      )}

      {/* Clear chat confirm modal */}
      {showClearConfirm && (
        <div className="msg-modal-overlay">
          <div className="msg-modal">
            <h3>Clear Chat</h3>
            <p>This will permanently delete all messages in this conversation for both sides. Are you sure?</p>
            <div className="msg-modal-btns">
              <button className="msg-modal-cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="msg-modal-confirm" onClick={handleClearChat}>Yes, Clear</button>
            </div>
          </div>
        </div>
      )}

      <nav className="msg-navbar">
        <h1 onClick={() => navigate("/home")}>KalaSetu</h1>
        <div className="msg-nav-btns">
          <button onClick={() => navigate("/home")}>← Dashboard</button>
        </div>
      </nav>

      <div className="msg-layout">
        {/* Sidebar */}
        <div className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h3>💬 Messages</h3>
            {onlineUsers.length > 0 && (
              <span className="msg-online-count">{onlineUsers.length} online</span>
            )}
          </div>

          <div className="msg-search-wrap">
            <input
              type="text"
              placeholder="Find artisans & NGOs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="msg-search"
            />
            {searchQuery && (
              <div className="msg-search-dropdown">
                {searching ? (
                  <div className="msg-search-loading">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="msg-search-empty">No results found</div>
                ) : (
                  searchResults.map((p) => (
                    <div key={p._id} className="msg-search-item" onClick={() => startNewConversation(p)}>
                      <div className="msg-mini-avatar">{p.user?.username?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="msg-search-name">{p.displayName || p.user?.fullName}</div>
                        <div className={`msg-search-role ${p.user?.role}`}>{p.user?.role}</div>
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
                <p>Search above to start one!</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const pid = conv.partner._id?.toString() ?? conv.partner._id;
                const isActive = activeUserId === pid || activeUserId === conv.partner._id;
                const isOnline = onlineUsers.includes(pid);
                return (
                  <div
                    key={pid}
                    className={`msg-conv-item ${isActive ? "active" : ""}`}
                    onClick={() => { setActiveUser(conv.partner); setActiveUserId(pid); }}
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
                      <div className="msg-conv-name">
                        {conv.partner.fullName || conv.partner.username || "Unknown"}
                      </div>
                      <div className="msg-conv-last">
                        {conv.lastMessage?.deleted
                          ? "🚫 Message deleted"
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

        {/* Chat area */}
        <div className="msg-chat">
          {!activeUserId ? (
            <div className="msg-empty-chat">
              <span>💬</span>
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
                  <div className="msg-chat-name">
                    {activeUser?.fullName || activeUser?.username || "User"}
                  </div>
                  <div className="msg-chat-status">
                    {onlineUsers.includes(activeUserId) ? (
                      <span className="msg-online-text">● Online</span>
                    ) : (
                      <span className={`msg-chat-role ${activeUser?.role}`}>{activeUser?.role}</span>
                    )}
                  </div>
                </div>
                <div className="msg-chat-actions">
                  <button className="msg-view-profile" onClick={() => navigate(`/profile/${activeUserId}`)}>
                    View Profile →
                  </button>
                  <button className="msg-clear-btn" onClick={() => setShowClearConfirm(true)} title="Clear chat">
                    🗑️ Clear
                  </button>
                </div>
              </div>

              <div className="msg-messages">
                {messages.length === 0 ? (
                  <div className="msg-no-msgs">Start the conversation! 👋</div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dayMsgs]) => (
                    <div key={dateKey}>
                      <div className="msg-date-separator">
                        <span>{formatDate(dayMsgs[0].createdAt)}</span>
                      </div>
                      {dayMsgs.map((msg, i) => {
                        const isMine = msg.sender?._id === user._id || msg.sender?._id?.toString() === user._id || msg.sender === user._id;
                        const isDeleted = msg.deleted;
                        return (
                          <div key={msg._id || i} className={`msg-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
                            <div
                              className={`msg-bubble ${isMine ? "mine" : "theirs"} ${isDeleted ? "deleted" : ""}`}
                              onContextMenu={(e) => { e.preventDefault(); if (!isDeleted) setMsgMenuId(msg._id); }}
                            >
                              {/* Reply preview */}
                              {msg.replyTo && !isDeleted && (
                                <div className="msg-reply-preview">
                                  <span className="msg-reply-name">
                                    {msg.replyTo.sender === user._id || msg.replyTo.sender?._id === user._id ? "You" : activeUser?.fullName || "Them"}
                                  </span>
                                  <span className="msg-reply-text">{msg.replyTo.text?.slice(0, 60)}</span>
                                </div>
                              )}
                              <p>{isDeleted ? "🚫 This message was deleted" : msg.text}</p>
                              <div className="msg-bubble-footer">
                                <span className="msg-time">{formatTime(msg.createdAt)}</span>
                                {isMine && !isDeleted && <MessageTick status={msg.status} />}
                              </div>
                            </div>

                            {/* Context menu */}
                            {!isDeleted && msgMenuId === msg._id && (
                              <div
                                className={`msg-context-menu ${isMine ? "mine" : "theirs"}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button onClick={() => handleReply(msg)}>↩️ Reply</button>
                                {isMine && (
                                  <button className="msg-ctx-delete" onClick={() => handleDeleteForEveryone(msg._id)}>🗑️ Delete for Everyone</button>
                                )}
                                <button className="msg-ctx-delete-me" onClick={() => handleDeleteForMe(msg._id)}>Delete for Me</button>
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

              {/* Reply bar */}
              {replyTo && (
                <div className="msg-reply-bar">
                  <div className="msg-reply-bar-inner">
                    <span className="msg-reply-bar-label">Replying to {replyTo.senderName}</span>
                    <span className="msg-reply-bar-text">{replyTo.text?.slice(0, 60)}{replyTo.text?.length > 60 ? "..." : ""}</span>
                  </div>
                  <button className="msg-reply-cancel" onClick={() => setReplyTo(null)}>✕</button>
                </div>
              )}

              <form className="msg-input-bar" onSubmit={handleSend}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="msg-text-input"
                />
                <button type="submit" className="msg-send-btn" disabled={sending || !text.trim()}>
                  {sending ? "..." : "Send ➤"}
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
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import "./Messages.css";
import Navbar from "../components/common/Navbar";

import API from "../utils/api";

function MessageTick({ status }) {
  if (status === "seen") {
    return (
      <span className="msg-tick seen" title="Seen" style={{ display: "inline-flex", alignItems: "center" }}>
        <i className="fi fi-sr-check" />
        <i className="fi fi-sr-check" style={{ marginLeft: "-6px" }} />
      </span>
    );
  }
  if (status === "delivered") {
    return (
      <span className="msg-tick delivered" title="Delivered" style={{ display: "inline-flex", alignItems: "center" }}>
        <i className="fi fi-sr-check" />
        <i className="fi fi-sr-check" style={{ marginLeft: "-6px" }} />
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
  // local unread count map: { [partnerId]: number } — updated in real time
  const [unreadMap, setUnreadMap] = useState({});
  // messaging permission
  const [messagingAllowed, setMessagingAllowed] = useState(null); // null=loading, true, false
  const [messagingBlockReason, setMessagingBlockReason] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // 'list' or 'chat'


  const { onlineUsers, socket } = useAuthStore();
  const {
    messages,
    setMessages,
    addMessage,
    setSelectedUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessageDeleted,
  } = useChatStore();

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const initialLoadRef = useRef(true);

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

    if (initialLoadRef.current) {
      setLoadingConvs(true);
      initialLoadRef.current = false;
    }
    try {
      const res = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
      // Sync unread map from backend counts (source of truth)
      const map = {};
      for (const conv of res.data) {
        const pid = conv.partner._id?.toString();
        if (pid) map[pid] = conv.unreadCount || 0;
      }
      setUnreadMap(map);
    } catch {
      setConversations([]);
    }
    setLoadingConvs(false);
  }, [token, user]);

  const checkMessagingPermission = useCallback(async (uid) => {
    if (!uid || !token) return;
    setMessagingAllowed(null); // loading
    try {
      const res = await axios.get(`${API}/messages/can-message/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessagingAllowed(res.data.canMessage);
      setMessagingBlockReason(res.data.reason || null);
    } catch {
      // Fail-closed on errors to avoid bypassing block restrictions
      setMessagingAllowed(false);
      setMessagingBlockReason("unavailable");
    }
  }, [token]);

  const openConversation = useCallback(async (uid) => {
    if (!uid || !token || !user || user.role === "user") return;

    // Clear unread badge immediately when opening
    setUnreadMap((prev) => ({ ...prev, [uid]: 0 }));
    // Reset permission while new chat loads
    setMessagingAllowed(null);
    setMessagingBlockReason(null);

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

    // Check permission after loading messages
    checkMessagingPermission(uid);
  }, [checkMessagingPermission, conversations, navigate, setMessages, socket, token, user]);

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
      const senderId = String(msg.sender?._id ?? msg.sender);
      if (senderId !== activeUserId) {
        const senderName = msg.sender?.fullName || msg.sender?.username || "Someone";
        showNotification(`New message from ${senderName}`);
        // Increment unread badge for that partner in real-time
        setUnreadMap((prev) => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
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
      addMessage(res.data);
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
            <p>This will clear all messages in this conversation for you only. The other person will still see the chat. Are you sure?</p>
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
        {/* SIDEBAR: Hidden on mobile when a chat is active */}
        <div className={`msg-sidebar ${mobileView === "chat" ? "hidden-mobile" : ""}`}>
          <div className="msg-sidebar-header">
            <h3><i className="fi fi-sr-comments" /> Messages</h3>
            {onlineUsers.length > 0 && <span className="msg-online-count">{onlineUsers.length} online</span>}
          </div>

          <div className="msg-search-wrap">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="msg-search"
            />
          </div>

          <div className="msg-conv-list">
            {loadingConvs ? (
              <div className="msg-conv-loading">Loading...</div>
            ) : (
              (() => {
                const filtered = conversations.filter(c => 
                  c.partner.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.partner.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div className="msg-conv-empty">
                      <p>{searchQuery ? "No matching conversations." : "No conversations yet."}</p>
                      {searchQuery && (
                         <button className="msg-global-search-hint" onClick={() => navigate("/search")}>
                            Try global search?
                         </button>
                      )}
                    </div>
                  );
                }

                return filtered.map((conv) => {
                  const partnerId = conv.partner._id?.toString() ?? conv.partner._id;
                  const isActive = activeUserId === partnerId;
                  const isOnline = onlineUsers.includes(partnerId);
                  const unread = isActive ? 0 : (unreadMap[partnerId] || 0);

                  return (
                    <div
                      key={partnerId}
                      className={`msg-conv-item ${isActive ? "active" : ""} ${unread > 0 ? "unread" : ""}`}
                      onClick={() => {
                        setActiveUser(conv.partner);
                        setActiveUserId(partnerId);
                        setMobileView("chat");
                        navigate(`/messages/${partnerId}`);
                      }}
                    >
                      <div className="msg-conv-avatar-wrap">
                        <div className="msg-conv-avatar">
                          {conv.partner.photo ? (
                            <img src={conv.partner.photo} alt="" className="msg-conv-avatar-img" />
                          ) : (
                            conv.partner.username?.[0]?.toUpperCase()
                          )}
                        </div>
                        {isOnline && <span className="msg-online-dot"></span>}
                      </div>
                      <div className="msg-conv-info">
                        <div className={`msg-conv-name ${unread > 0 ? "unread" : ""}`}>
                          {conv.partner.username}
                        </div>
                        <div className={`msg-conv-last ${unread > 0 ? "unread" : ""}`}>
                          {conv.lastMessage?.text || "Started a conversation"}
                        </div>
                      </div>
                      <div className="msg-conv-meta">
                        <div className="msg-conv-time">{formatDate(conv.lastMessage?.createdAt)}</div>
                        {unread > 0 && (
                          <span className="msg-unread-badge">{unread}</span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

        {/* CHAT AREA: Hidden on mobile when in list view */}
        <div className={`msg-chat ${mobileView === "list" ? "hidden-mobile" : ""}`}>
          {!activeUserId ? (
            <div className="msg-empty-chat">
              <span><i className="fi fi-sr-comments" /></span>
              <h3>Select a conversation</h3>
              <p>Choose from the list to start messaging.</p>
            </div>
          ) : (
            <>
              <div className="msg-chat-header">
                <button className="msg-back-btn mobile-only" onClick={() => setMobileView("list")}>
                  <i className="fi fi-sr-arrow-left" />
                </button>
                <div className="msg-chat-avatar-wrap" onClick={() => navigate(`/profile/${activeUserId}`)} style={{cursor: 'pointer'}}>
                  <div className="msg-chat-avatar">
                    {activeUser?.photo ? (
                      <img src={activeUser.photo} alt="" className="msg-chat-avatar-img" />
                    ) : (
                      activeUser?.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  {onlineUsers.includes(activeUserId) && <span className="msg-chat-online-dot"></span>}
                </div>
                <div className="msg-chat-header-info">
                  <div className="msg-chat-name" onClick={() => navigate(`/profile/${activeUserId}`)} style={{cursor: 'pointer'}}>
                    {activeUser?.username}
                  </div>
                  <div className="msg-chat-status">
                    {onlineUsers.includes(activeUserId) ? (
                      <span className="msg-online-text">Online</span>
                    ) : (
                      "Offline"
                    )}
                  </div>
                </div>
                <div className="msg-chat-actions">
                  <button className="msg-view-profile" onClick={() => navigate(`/profile/${activeUserId}`)}>
                    <i className="fi fi-sr-user" /> <span className="desktop-only">View Profile</span>
                  </button>
                  <button className="msg-clear-btn" onClick={() => setShowClearConfirm(true)}>
                    <i className="fi fi-sr-trash" /> <span className="desktop-only">Clear</span>
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
                                      : activeUser?.username || "Them"}
                                  </span>
                                  <span className="msg-reply-text">{msg.replyTo.text?.slice(0, 60)}</span>
                                </div>
                              )}
                              {msg.sharedPost && !isDeleted && (
                                <div className="msg-shared-post" onClick={() => navigate(`/profile/${msg.sharedPost.author?._id}`)}>
                                  <div className="msg-shared-author">
                                    <div className="msg-shared-avatar-wrap">
                                      {msg.sharedPost.author?.photo ? (
                                        <img src={msg.sharedPost.author.photo} alt="" className="msg-shared-avatar-img" />
                                      ) : (
                                        msg.sharedPost.author?.username?.[0]?.toUpperCase()
                                      )}
                                    </div>
                                    <div className="msg-shared-author-info">
                                      <div className="msg-shared-name">{msg.sharedPost.author?.username}</div>
                                      <div className="msg-shared-role">{msg.sharedPost.author?.role}</div>
                                    </div>
                                  </div>
                                  {msg.sharedPost.image && (
                                    <div className="msg-shared-img">
                                      <img src={msg.sharedPost.image} alt="" />
                                    </div>
                                  )}
                                  <div className="msg-shared-content">
                                    <div className="msg-shared-title">{msg.sharedPost.title}</div>
                                    <div className="msg-shared-desc">{msg.sharedPost.description?.slice(0, 80)}...</div>
                                  </div>
                                </div>
                              )}
                              {msg.image && !isDeleted && (
                                <div className="msg-bubble-media">
                                  <img src={msg.image} alt="" />
                                </div>
                              )}
                              {(!msg.sharedPost || !msg.text.startsWith("Check out this post:")) &&
                               (!msg.image || msg.text !== "Shared an image") && (
                                <p>{isDeleted ? "This message was deleted" : msg.text}</p>
                              )}
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

              {messagingAllowed === false ? (
                <div className="msg-input-bar msg-input-disabled">
                  <span className="msg-locked-icon">
                    <i className="fi fi-sr-lock" />
                  </span>
                  <span className="msg-locked-text">
                    {messagingBlockReason === "pending_request"
                      ? "You can message this user only after they accept your follow request."
                      : messagingBlockReason === "you_blocked"
                      ? "You have blocked this user. Unblock them to send messages."
                      : messagingBlockReason === "messaging_unavailable" || messagingBlockReason === "unavailable"
                      ? "Messaging is unavailable with this user."
                      : "Follow this user to send them a message."}
                  </span>
                </div>
              ) : (
                <form className="msg-input-bar" onSubmit={handleSend}>
                  <label className="msg-media-btn" title="Add Image">
                    <i className="fi fi-sr-picture" />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        if (messagingAllowed !== true) return;
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result;
                          try {
                            const res = await axios.post(
                              `${API}/messages`,
                              { receiverId: activeUserId, image: base64 },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            addMessage(res.data);
                            fetchConversations();
                          } catch {
                            showNotification("Failed to send image");
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="msg-text-input"
                  />
                  <button type="submit" className="msg-send-btn" disabled={sending || !text.trim() || messagingAllowed === null}>
                    <i className="fi fi-sr-paper-plane" /> 
                    <span>{sending ? "..." : "Send"}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
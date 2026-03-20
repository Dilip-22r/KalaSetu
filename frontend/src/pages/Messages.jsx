import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import "./Messages.css";

const API = "http://localhost:5000";

function Messages() {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(paramUserId || null);
  const [activeUser, setActiveUser] = useState(null);
  
  // Zustand States
  const { onlineUsers } = useAuthStore();
  const { messages, setMessages, setSelectedUserId, subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef(null);

  // Role gate
  if (!user || user.role === "user") {
    return (
      <div className="msg-bg">
        <nav className="msg-navbar">
          <h1 onClick={() => navigate(user ? "/home" : "/")}>KalaSetu</h1>
        </nav>
        <div className="msg-locked">
          <span>💬</span>
          <h2>Messaging is for Artisans & NGOs</h2>
          <p>Register as an Artisan or NGO to unlock messaging and connect with the community.</p>
          {user ? (
            <button onClick={() => navigate("/register")}>Register Now</button>
          ) : (
            <button onClick={() => navigate("/signin")}>Sign In</button>
          )}
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
  }, [activeUserId, setSelectedUserId]);

  useEffect(() => {
    subscribeToMessages();

    // Cleanup function to prevent memory leaks or duplicate messages
    return () => unsubscribeFromMessages();
  }, [subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    setActiveUserId(uid);
    try {
      const res = await axios.get(`${API}/messages/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
      // find partner info
      const conv = conversations.find(c => c.partner._id === uid);
      if (conv) setActiveUser(conv.partner);
    } catch { setMessages([]); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/messages`, { receiverId: activeUserId, text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([...messages, res.data]);
      setText("");
      fetchConversations();
    } catch {}
    setSending(false);
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
    setActiveUserId(profile.user._id);
    setActiveUser(profile.user);
    setSearchQuery("");
    setSearchResults([]);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="msg-bg">
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
                    <div
                      key={p._id}
                      className="msg-search-item"
                      onClick={() => startNewConversation(p)}
                    >
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
              conversations.map((conv) => (
                <div
                  key={conv.partner._id}
                  className={`msg-conv-item ${activeUserId === conv.partner._id ? "active" : ""}`}
                  onClick={() => { setActiveUser(conv.partner); setActiveUserId(conv.partner._id); }}
                >
                  <div className="msg-conv-avatar">
                    {conv.partner.photo ? (
                      <img src={conv.partner.photo} alt="" className="msg-conv-avatar-img" />
                    ) : (
                      conv.partner.username?.[0]?.toUpperCase()
                    )}
                    {onlineUsers.includes(conv.partner._id) && (
                       <span className="msg-online-dot"></span>
                    )}
                  </div>
                  <div className="msg-conv-info">
                    <div className="msg-conv-name">{conv.partner.fullName}</div>
                    <div className="msg-conv-last">
                      {conv.lastMessage?.text ? conv.lastMessage.text.slice(0, 32) + (conv.lastMessage.text.length > 32 ? "..." : "") : "No messages yet"}
                    </div>
                  </div>
                  <div className="msg-conv-time">{formatDate(conv.lastMessage?.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="msg-chat">
          {!activeUserId ? (
            <div className="msg-empty-chat">
              <span>🪷</span>
              <h3>Select a conversation</h3>
              <p>Choose from the list or search for someone to message</p>
            </div>
          ) : (
            <>
              <div className="msg-chat-header">
                <div className="msg-chat-avatar">
                  {activeUser?.photo ? (
                    <img src={activeUser.photo} alt="" className="msg-chat-avatar-img" />
                  ) : (
                    activeUser?.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <div className="msg-chat-name">{activeUser?.fullName || "User"}</div>
                  <div className={`msg-chat-role ${activeUser?.role}`}>{activeUser?.role}</div>
                </div>
                <button
                  className="msg-view-profile"
                  onClick={() => navigate(`/profile/${activeUserId}`)}
                >
                  View Profile →
                </button>
              </div>

              <div className="msg-messages">
                {messages.length === 0 ? (
                  <div className="msg-no-msgs">Start the conversation! 👋</div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine = msg.sender?._id === user._id || msg.sender === user._id;
                    return (
                      <div key={msg._id || i} className={`msg-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
                        <div className={`msg-bubble ${isMine ? "mine" : "theirs"}`}>
                          <p>{msg.text}</p>
                          <span className="msg-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form className="msg-input-bar" onSubmit={handleSend}>
                <input
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

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import kalasetuLogo from "../../assets/kalasetu_logo.png";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const subscribeToNotifications = useNotificationStore((state) => state.subscribeToNotifications);
  const unsubscribeFromNotifications = useNotificationStore((state) => state.unsubscribeFromNotifications);
  const hasMore = useNotificationStore((state) => state.hasMore);
  const page = useNotificationStore((state) => state.page);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const initializedUserIdRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const effectiveUser = authUser ?? storedUser;

  useEffect(() => {
    if (authUser) return;
    if (storedUser) {
      setAuthUser(storedUser);
    }
  }, [authUser, setAuthUser, storedUser]);

  const initializeNotifications = useCallback(() => {
    fetchNotifications(1);
    subscribeToNotifications();
  }, [fetchNotifications, subscribeToNotifications]);

  useEffect(() => {
    if (!effectiveUser?._id) return;
    if (initializedUserIdRef.current === effectiveUser._id) return;

    initializedUserIdRef.current = effectiveUser._id;
    initializeNotifications();

    return () => {
      unsubscribeFromNotifications();
      initializedUserIdRef.current = null;
    };
  }, [effectiveUser, initializeNotifications, unsubscribeFromNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications((value) => !value);
    if (!showNotifications && unreadCount > 0) {
      markAsRead();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuthUser(null);
    navigate("/");
  };

  const isActivePath = (path) => {
    if (path === "/home") return location.pathname === "/home";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (!effectiveUser) {
    return (
      <nav className="g-navbar">
        <div className="g-brand" onClick={() => navigate("/")}>
          <img src={kalasetuLogo} alt="KalaSetu" className="g-logo" />
          <div className="g-brand-copy">
            <h1 className="display-serif">KalaSetu</h1>
          </div>
        </div>

        <div className="g-guest-actions">
          <button className="g-ghost-btn" onClick={() => navigate("/signin")}>
            Sign In
          </button>
          <button className="g-primary-btn" onClick={() => navigate("/signup")}>
            Join KalaSetu
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="g-navbar">
      <div className="g-brand" onClick={() => navigate("/home")}>
        <img src={kalasetuLogo} alt="KalaSetu" className="g-logo" />
        <div className="g-brand-copy">
          <h1 className="display-serif">KalaSetu</h1>
        </div>
      </div>

      <div className="g-nav-shell">
        <div className="g-nav-main">
          <button
            className={`g-nav-item ${isActivePath("/home") ? "is-active" : ""}`}
            onClick={() => navigate("/home")}
          >
            <i className="fi fi-sr-home" />
            Home
          </button>
          <button
            className={`g-nav-item ${isActivePath("/search") ? "is-active" : ""}`}
            onClick={() => navigate("/search")}
          >
            <i className="fi fi-sr-search" />
            Explore
          </button>
          {effectiveUser.role !== "user" && (
            <button
              className={`g-nav-item ${isActivePath("/messages") ? "is-active" : ""}`}
              onClick={() => navigate("/messages")}
            >
              <i className="fi fi-sr-comments" />
              Messages
            </button>
          )}
        </div>

        <div className="g-nav-actions">
          <div className="g-notif-wrapper" ref={dropdownRef}>
            <button className="g-alert-btn" onClick={handleBellClick}>
              <i className="fi fi-sr-bell" />
              <span>Alerts</span>
              {unreadCount > 0 && <span className="g-badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="g-notif-dropdown">
                <div className="g-notif-header">
                  <h4>Notifications</h4>
                  <span>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="no-notif">No new notifications yet.</p>
                ) : (
                  <div className="notif-list">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`notif-card ${!notification.read ? "unread" : ""}`}
                        onClick={() => {
                          if (notification.type === "message") {
                            navigate(`/messages/${notification.sender?._id}`);
                            setShowNotifications(false);
                          }
                        }}
                        style={{ cursor: notification.type === "message" ? "pointer" : "default" }}
                      >
                        <div className="notif-avatar">
                          {notification.sender?.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="notif-content">
                          <p>
                            <strong>{notification.sender?.username}</strong>{" "}
                            {notification.type === "like" ? "liked your post" : "sent you a message"}
                          </p>
                          <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                        </div>
                      </div>
                    ))}
                    {hasMore && (
                      <button className="load-more-btn" onClick={() => fetchNotifications(page + 1)}>
                        Load More
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="g-profile-wrapper" ref={profileRef}>
            <button
              className={`g-profile-btn ${isActivePath("/profile") ? "is-active" : ""}`}
              onClick={() => setShowProfileMenu((v) => !v)}
            >
              <span className="g-profile-avatar">{effectiveUser.username?.[0]?.toUpperCase()}</span>
              <span className="g-profile-copy">
                <strong>{effectiveUser.username}</strong>
              </span>
            </button>
            {showProfileMenu && (
              <div className="g-profile-dropdown">
                <div className="g-profile-menu-item" onClick={() => { navigate(`/profile/${effectiveUser._id}`); setShowProfileMenu(false); }}>
                  <i className="fi fi-sr-user" /> View Profile
                </div>
                <div className="g-profile-menu-divider" />
                <div className="g-profile-menu-item g-profile-menu-logout" onClick={handleLogout}>
                  <i className="fi fi-sr-sign-out-alt" /> Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

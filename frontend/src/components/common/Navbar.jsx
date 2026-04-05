import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import axios from "axios";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingFollowActions, setPendingFollowActions] = useState({}); // { notifId: "accept"|"reject"|"done" }
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

  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    if (!effectiveUser?._id) return;
    axios.get(`http://localhost:5000/profiles/${effectiveUser._id}`)
      .then(res => {
        if (res.data?.photo) setProfilePhoto(res.data.photo);
      })
      .catch(() => { }); // silently fail if no profile yet
  }, [effectiveUser?._id]);

  const initializeNotifications = useCallback(() => {
    fetchNotifications(1);
    subscribeToNotifications();
  }, [fetchNotifications, subscribeToNotifications]);

  // Also fetch fresh unread count whenever user navigates back
  useEffect(() => {
    if (!effectiveUser?._id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    // Always refresh count on mount so badge is accurate
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleFollowRequest = async (e, senderId, notifId, action) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    const me = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !me) return;
    // Mark as loading
    setPendingFollowActions((prev) => ({ ...prev, [notifId]: action + "_loading" }));
    try {
      await axios.put(
        `http://localhost:5000/profiles/${senderId}/${action}-follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Mark as done with which action was taken
      setPendingFollowActions((prev) => ({ ...prev, [notifId]: action + "_done" }));
      // Refresh notification list after short delay to show done state
      setTimeout(() => fetchNotifications(1), 800);
    } catch (err) {
      console.error(`Follow ${action} failed`, err);
      setPendingFollowActions((prev) => { const s = { ...prev }; delete s[notifId]; return s; });
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowProfileMenu(false);
  };

  const confirmLogout = () => {
    localStorage.clear();
    setAuthUser(null);
    setShowLogoutConfirm(false);
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
    <>
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
            {effectiveUser.role === "user" && location.pathname !== "/register" && (
              <button
                className="g-primary-btn"
                onClick={() => navigate("/register")}
                style={{ fontSize: '13px', padding: '8px 16px', marginRight: '8px' }}
              >
                Register
              </button>
            )}
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
                            } else if (["follow", "follow_accept", "follow_request"].includes(notification.type)) {
                              navigate(`/profile/${notification.sender?._id}`);
                              setShowNotifications(false);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="notif-avatar">
                            {notification.sender?.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="notif-content">
                            <p>
                              {(() => {
                                const actionState = pendingFollowActions[notification._id];
                                const isAcc = actionState === "accept_done" || notification.type === "follow_accepted_by_me";
                                const isRej = actionState === "reject_done" || notification.type === "follow_rejected_by_me";

                                if (isAcc) {
                                  return <>You accepted <strong>{notification.sender?.username}</strong>'s follow request</>;
                                }
                                if (isRej) {
                                  return <>You declined <strong>{notification.sender?.username}</strong>'s follow request</>;
                                }

                                return (
                                  <>
                                    <strong>{notification.sender?.username}</strong>{" "}
                                    {notification.type === "like" && "liked your post"}
                                    {notification.type === "message" && "sent you a message"}
                                    {notification.type === "follow" && "started following you"}
                                    {notification.type === "follow_accept" && "accepted your follow request"}
                                    {notification.type === "follow_request" && "requested to follow you"}
                                  </>
                                );
                              })()}
                            </p>
                            <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                            {notification.type === "follow_request" && (() => {
                              const actionState = pendingFollowActions[notification._id];
                              const isLoading = actionState?.endsWith("_loading");
                              const isDone = actionState?.endsWith("_done");

                              if (isDone) return null;

                              return (
                                <div className="notif-follow-actions">
                                  <button
                                    className="notif-accept-btn"
                                    disabled={isLoading}
                                    onClick={(e) => handleFollowRequest(e, notification.sender?._id, notification._id, "accept")}
                                  >
                                    {actionState === "accept_loading" ? (
                                      <span className="notif-btn-spinner" />
                                    ) : (
                                      <><i className="fi fi-sr-user-check" /> Accept</>
                                    )}
                                  </button>
                                  <button
                                    className="notif-reject-btn"
                                    disabled={isLoading}
                                    onClick={(e) => handleFollowRequest(e, notification.sender?._id, notification._id, "reject")}
                                  >
                                    {actionState === "reject_loading" ? (
                                      <span className="notif-btn-spinner" />
                                    ) : (
                                      <><i className="fi fi-sr-user-minus" /> Decline</>
                                    )}
                                  </button>
                                </div>
                              );
                            })()}
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
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="g-profile-avatar-img" />
                ) : (
                  <span className="g-profile-avatar">{effectiveUser.username?.[0]?.toUpperCase()}</span>
                )}
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
                  <div className="g-profile-menu-item g-profile-menu-logout" onClick={handleLogoutClick}>
                    <i className="fi fi-sr-sign-out-alt" /> Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showLogoutConfirm && (
        <div className="g-modal-overlay nav-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="g-modal-content nav-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="g-modal-icon">
              <i className="fi fi-sr-sign-out-alt" />
            </div>
            <h3 className="display-serif">Sign out of KalaSetu?</h3>
            <p>You will need to sign back in to access your account.</p>
            <div className="nav-modal-actions">
              <button className="g-modal-cancel" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="g-modal-confirm" onClick={confirmLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;

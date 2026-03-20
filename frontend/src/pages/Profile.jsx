import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import "./Profile.css";

const API = "http://localhost:5000";

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showRegisterMsg, setShowRegisterMsg] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isOwn = currentUser && currentUser._id === userId;

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/profiles/${userId}`);
      setProfile(res.data);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    }
    setLoading(false);
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`${API}/posts`);
      setPosts(res.data.filter(p => p.author?._id === userId));
    } catch { setPosts([]); }
  };

  const handleLogout = () => {
    localStorage.clear();
    useAuthStore.getState().setAuthUser(null);
    navigate("/");
  };

  const handleEditClick = () => {
    // If role is "user", show the "register to edit" message
    if (currentUser?.role === "user") {
      setShowRegisterMsg(true);
      setTimeout(() => setShowRegisterMsg(false), 3000);
      return;
    }
    navigate("/edit-profile");
  };

  const renderNavbar = () => (
    <nav className="prof-navbar">
      <h1 onClick={() => navigate(currentUser ? "/home" : "/")}>KalaSetu</h1>
      <div className="prof-nav-btns">
        <button onClick={() => navigate(currentUser ? "/home" : "/")}>← Dashboard</button>
        {isOwn && (
          <button className="prof-edit-btn" onClick={handleEditClick}>
            ✏️ Edit Profile
          </button>
        )}
        {currentUser && !isOwn && currentUser.role !== "user" && (
          <button className="prof-msg-btn" onClick={() => navigate(`/messages/${userId}`)}>
            💬 Message
          </button>
        )}
        <button className="prof-logout-btn" onClick={() => setShowLogoutModal(true)}>Logout</button>
      </div>
    </nav>
  );

  if (loading) {
    return (
      <div className="prof-bg">
        {renderNavbar()}
        <div className="prof-loading"><div className="prof-spinner"></div><p>Loading profile...</p></div>
      </div>
    );
  }

  // Own profile but no registration done yet — show basic info from localStorage
  if (notFound && isOwn) {
    const roleLabel = currentUser.role === "artisan" ? "🎨 Artisan"
      : currentUser.role === "ngo" ? "🤝 NGO" : "👤 User";
    return (
      <div className="prof-bg">
        {renderNavbar()}
        {showRegisterMsg && (
          <div className="prof-register-toast">
            ⭐ Please register as an Artisan or NGO to edit your profile
          </div>
        )}
        <div className="prof-container">
          {/* Hero with basic info from localStorage */}
          <div className="prof-hero">
            <div className="prof-cover" />
            <div className="prof-hero-body">
              <div className="prof-avatar-wrap">
                <div className="prof-avatar-initials">
                  {currentUser.username?.[0]?.toUpperCase()}
                </div>
              </div>
              <div className="prof-hero-info">
                <div className="prof-name-row">
                  <h2>{currentUser.fullName}</h2>
                  <span className={`prof-role-badge ${currentUser.role}`}>{roleLabel}</span>
                </div>
                <p className="prof-username">@{currentUser.username}</p>
                <div className="prof-meta-row">
                  <span>✉️ {currentUser.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="prof-basic-cta">
            <span>🪷</span>
            <h3>Your profile isn't set up yet</h3>
            <p>Register as an Artisan or NGO to add your skills, location, and cultural story.</p>
            <button onClick={() => navigate("/register")}>⭐ Register as Artisan / NGO</button>
          </div>
        </div>
      </div>
    );
  }

  // Someone else's profile not found
  if (notFound || !profile) {
    return (
      <div className="prof-bg">
        {renderNavbar()}
        <div className="prof-not-found">
          <span>🪷</span>
          <h2>Profile Not Found</h2>
          <p>This user hasn't set up their profile yet.</p>
        </div>
      </div>
    );
  }

  const { user: profileUser } = profile;
  const roleLabel = profileUser?.role === "artisan" ? "🎨 Artisan"
    : profileUser?.role === "ngo" ? "🤝 NGO" : "👤 User";
  const joinDate = new Date(profileUser?.createdAt).toLocaleDateString("en-IN", {
    month: "long", year: "numeric",
  });

  return (
    <div className="prof-bg">
      {renderNavbar()}

      {/* Toast message when user role clicks Edit Profile */}
      {showRegisterMsg && (
        <div className="prof-register-toast">
          ⭐ Register as an Artisan or NGO to edit your profile
        </div>
      )}

      <div className="prof-container">
        {/* Hero */}
        <div className="prof-hero">
          <div className="prof-cover" />
          <div className="prof-hero-body">
            <div className="prof-avatar-wrap">
              {profile.photo ? (
                <img src={profile.photo} alt="" className="prof-avatar-img" />
              ) : (
                <div className="prof-avatar-initials">
                  {profileUser?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="prof-hero-info">
              <div className="prof-name-row">
                <h2>{profile.displayName || profileUser?.fullName}</h2>
                <span className={`prof-role-badge ${profileUser?.role}`}>{roleLabel}</span>
              </div>
              <p className="prof-username">@{profileUser?.username}</p>
              <div className="prof-meta-row">
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.skills && <span>🎨 {profile.skills}</span>}
                <span>📅 Joined {joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="prof-body">
          {/* Sidebar */}
          <div className="prof-sidebar">
            {profile.about && (
              <div className="prof-card">
                <h3>About</h3>
                <p>{profile.about}</p>
              </div>
            )}
            <div className="prof-card">
              <h3>Details</h3>
              <div className="prof-details">
                {profile.age && (
                  <div className="prof-detail-row">
                    <span className="prof-detail-label">Age</span>
                    <span>{profile.age}</span>
                  </div>
                )}
                {profile.gender && (
                  <div className="prof-detail-row">
                    <span className="prof-detail-label">Gender</span>
                    <span>{profile.gender}</span>
                  </div>
                )}
                {profile.userType && (
                  <div className="prof-detail-row">
                    <span className="prof-detail-label">Type</span>
                    <span className={`prof-type ${profileUser?.role}`}>{profile.userType}</span>
                  </div>
                )}
                <div className="prof-detail-row">
                  <span className="prof-detail-label">Email</span>
                  <span>{profileUser?.email}</span>
                </div>
              </div>
            </div>

            {!isOwn && currentUser && currentUser.role !== "user" && (
              <button className="prof-full-msg-btn" onClick={() => navigate(`/messages/${userId}`)}>
                💬 Send a Message
              </button>
            )}
          </div>

          {/* Posts */}
          <div className="prof-posts-section">
            <h3 className="prof-posts-title">
              Cultural Posts <span className="prof-posts-count">{posts.length}</span>
            </h3>
            {posts.length === 0 ? (
              <div className="prof-no-posts">
                <span>🖼️</span>
                <p>No posts yet{isOwn ? " — share your first cultural story!" : "."}</p>
                {isOwn && profileUser?.role !== "user" && (
                  <button onClick={() => navigate("/create-post")}>Create Post</button>
                )}
              </div>
            ) : (
              <div className="prof-posts-grid">
                {posts.map((post) => (
                  <div key={post._id} className="prof-post-card">
                    {post.image && <img src={post.image} alt="" className="prof-post-img" />}
                    <div className="prof-post-body">
                      <span className="prof-post-cat">{post.category}</span>
                      <h4>{post.title}</h4>
                      <p>{post.content}</p>
                      <div className="prof-post-footer">
                        <span className="prof-post-date">
                          {new Date(post.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                        <span className="prof-post-likes">❤️ {post.likes?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="prof-logout-overlay">
          <div className="prof-logout-modal">
            <h3>Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="prof-logout-actions">
              <button className="prof-logout-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="prof-logout-confirm" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
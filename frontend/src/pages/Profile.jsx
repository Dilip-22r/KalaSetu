import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import "./Profile.css";
import { PostCard } from "../components/home/Home";
import "../components/home/Home.css";
import { useAuthStore } from "../store/useAuthStore";

const API = "http://localhost:5000";

const getRoleLabel = (role) => {
  if (role === "artisan") return "Artisan";
  if (role === "ngo") return "NGO";
  return "Member";
};

const getProfileStoryline = (role) => {
  if (role === "ngo") {
    return "Building cultural impact through collaboration, outreach, and community storytelling.";
  }

  return "Preserving culture through craft, performance, and stories rooted in local identity.";
};

const getProfileTagline = (role, skills, location) => {
  const primarySkill = skills[0];
  const locationText = location ? ` from ${location}` : "";

  if (role === "ngo") {
    return `Community-led organisation${locationText} connecting artisans, stories, and cultural opportunities with purpose.`;
  }

  if (primarySkill) {
    return `Passionate ${primarySkill} practitioner${locationText}, preserving tradition through performance, craft, and storytelling.`;
  }

  return `Cultural creator${locationText}, building meaningful connections through tradition, identity, and shared stories.`;
};

const getRegionLabel = (location) => {
  if (!location) return "";

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || location;
};

const getSkillTags = (skills) =>
  (skills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

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
  const [following, setFollowing] = useState(false);
  const [requested, setRequested] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [moreModal, setMoreModal] = useState(null);
  const [moreToast, setMoreToast] = useState("");
  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [likers, setLikers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersError, setFollowersError] = useState("");

  const isOwn = currentUser && currentUser._id === userId;
  const { socket } = useAuthStore();

  const handleFollowersClick = async () => {
    setFollowersModalOpen(true);
    setFollowersLoading(true);
    setFollowersError("");
    setFollowersList([]);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/profiles/${userId}/followers`, { headers });
      setFollowersList(res.data.followers || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setFollowersError("🔒 This profile is private. Only followers can view this list.");
      } else {
        setFollowersError("Could not load followers. Please try again.");
      }
    } finally {
      setFollowersLoading(false);
    }
  };

  // Re-sync follow status when a socket event changes it (e.g. follow_accept)
  useEffect(() => {
    if (!socket) return;
    const refreshFollowStatus = async () => {
      if (!token || !currentUser) return;
      try {
        const fsRes = await axios.get(`${API}/profiles/${userId}/follow-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFollowing(fsRes.data.following);
        setRequested(fsRes.data.requested);
        setFollowersCount(fsRes.data.followersCount);
      } catch { /* silent */ }
    };
    socket.on("newNotification", (notif) => {
      if (notif.type === "follow_accept" || notif.type === "follow") {
        refreshFollowStatus();
      }
    });
    return () => socket.off("newNotification");
  }, [socket, userId, isOwn]);

  const openRegisterPrompt = () => {
    setShowRegisterMsg(true);
    setTimeout(() => setShowRegisterMsg(false), 3000);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    const previousPosts = [...posts];
    setPosts(posts.filter((post) => post._id !== postId));

    try {
      await axios.delete(`${API}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setPosts(previousPosts);
    }
  };

  const handleEditClick = () => {
    if (currentUser?.role === "user") {
      openRegisterPrompt();
      return;
    }

    navigate("/edit-profile");
  };

  const handleMessageClick = () => {
    if (currentUser?.role === "user") {
      openRegisterPrompt();
      return;
    }

    navigate(`/messages/${userId}`);
  };

  const handleFollow = async () => {
    if (!currentUser || !token) return;
    setFollowLoading(true);
    try {
      const res = await axios.put(`${API}/profiles/${userId}/follow`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === "requested" || res.data.status === "request_cancelled") {
        setRequested(res.data.requested);
      } else {
        setFollowing(res.data.following);
        setFollowersCount(res.data.followersCount);
        setRequested(false);
      }
    } catch { /* silent */ }
    setFollowLoading(false);
  };

  const handleMoreAction = (action) => {
    setShowMoreMenu(false);
    setMoreModal(action);
  };

  const confirmMoreAction = () => {
    const message =
      moreModal === "block"
        ? "User has been blocked."
        : "Report submitted. Our team will review it shortly.";

    setMoreModal(null);
    setMoreToast(message);
    setTimeout(() => setMoreToast(""), 3000);
  };

  const handleLikesClick = async (postId, likesCount) => {
    if (likesCount === 0) return;

    setLikesModalPostId(postId);
    setLoadingLikes(true);

    try {
      const res = await axios.get(`${API}/posts/${postId}/likes`);
      setLikers(res.data);
    } catch (err) {
      console.error("Error fetching likes:", err);
    }

    setLoadingLikes(false);
  };

  const handleLike = async (postId) => {
    if (!currentUser) return;
    const previousPosts = [...posts];
    setPosts(
      posts.map((post) => {
        if (post._id !== postId) return post;
        const isLiked = post.likes.includes(currentUser._id);
        const updatedLikes = isLiked
          ? post.likes.filter((id) => id !== currentUser._id)
          : [...post.likes, currentUser._id];
          
        const updatedDislikes = !isLiked && post.dislikes?.includes(currentUser._id)
          ? post.dislikes.filter((id) => id !== currentUser._id)
          : post.dislikes || [];
          
        return { ...post, likes: updatedLikes, dislikes: updatedDislikes };
      })
    );
    try {
      await axios.put(`${API}/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { setPosts(previousPosts); }
  };

  const handleDislike = async (postId) => {
    if (!currentUser) return;
    const previousPosts = [...posts];
    setPosts(posts.map((post) => {
      if (post._id !== postId) return post;
      const isDisliked = post.dislikes?.includes(currentUser._id);
      const updatedDislikes = isDisliked
        ? (post.dislikes || []).filter((id) => id !== currentUser._id)
        : [...(post.dislikes || []), currentUser._id];
        
      const updatedLikes = !isDisliked && post.likes?.includes(currentUser._id)
        ? post.likes.filter((id) => id !== currentUser._id)
        : post.likes || [];
        
      return { ...post, dislikes: updatedDislikes, likes: updatedLikes };
    }));
    try {
      await axios.put(`${API}/posts/${postId}/dislike`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { setPosts(previousPosts); }
  };

  const handleRepost = async (postId) => {
    if (!currentUser) return;
    const previousPosts = [...posts];
    setPosts(posts.map((post) => {
      if (post._id !== postId) return post;
      const isReposted = post.reposts?.includes(currentUser._id);
      const updatedReposts = isReposted
        ? (post.reposts || []).filter((id) => id !== currentUser._id)
        : [...(post.reposts || []), currentUser._id];
      return { ...post, reposts: updatedReposts };
    }));
    try {
      await axios.put(`${API}/posts/${postId}/repost`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { setPosts(previousPosts); }
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profileRes = await axios.get(`${API}/profiles/${userId}`);
        setProfile(profileRes.data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }

      try {
        const postsRes = await axios.get(`${API}/posts`);
        const allPosts = postsRes.data;
        setPosts(allPosts);
      } catch (err) {
        setPosts([]);
        console.error("Error fetching user posts:", err);
      }

      if (currentUser && token) {
        try {
          const fsRes = await axios.get(`${API}/profiles/${userId}/follow-status`, { headers: { Authorization: `Bearer ${token}` } });
          setFollowing(fsRes.data.following);
          setRequested(fsRes.data.requested);
          setFollowersCount(fsRes.data.followersCount);
        } catch { /* silent */ }
      }
    };

    loadProfileData();
  }, [userId]);

  if (loading) {
    return (
      <div className="prof-bg">
        <Navbar />
        <div className="prof-loading">
          <div className="prof-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound && isOwn) {
    const currentRoleLabel = getRoleLabel(currentUser.role);

    return (
      <div className="prof-bg">
        <Navbar />
        {showRegisterMsg && (
          <div className="prof-register-toast">
            Register as an Artisan or NGO to edit your profile.
          </div>
        )}

        <div className="prof-container">
          <div className="prof-hero prof-hero-empty">
            <div className="prof-cover">
              <div className="prof-cover-content">
                <span className="prof-cover-kicker">KalaSetu Profile</span>
                <p>Create a trusted cultural profile that tells people what you do and how to connect.</p>
              </div>
            </div>

            <div className="prof-hero-body">
              <div className="prof-avatar-wrap">
                <div className="prof-avatar-initials">
                  {currentUser.username?.[0]?.toUpperCase()}
                </div>
              </div>

              <div className="prof-hero-main">
                <div className="prof-name-row">
                  <h2 className="display-serif">{currentUser.fullName}</h2>
                  <span className={`prof-role-badge ${currentUser.role}`}>{currentRoleLabel}</span>
                </div>
                <p className="prof-username">@{currentUser.username}</p>
                <div className="prof-meta-row">
                  <span>
                    <i className="fi fi-sr-user" />
                    {currentUser.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="prof-empty-state">
            <div className="prof-empty-icon">
              <i className="fi fi-sr-circle-user" />
            </div>
            <h3 className="display-serif">Your portfolio is ready to be shaped</h3>
            <p>Complete your profile to add your location, skills, story, and cultural focus.</p>
            <button
              className="prof-primary-btn"
              onClick={() => navigate(currentUser?.role === "user" ? "/register" : "/edit-profile")}
            >
              {currentUser?.role === "user" ? "Register as Artisan / NGO" : "Complete Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="prof-bg">
        <Navbar />
        <div className="prof-not-found">
          <div className="prof-empty-icon">
            <i className="fi fi-sr-search" />
          </div>
          <h2 className="display-serif">Profile Not Found</h2>
          <p>This user has not set up their public profile yet.</p>
        </div>
      </div>
    );
  }

  const { user: profileUser } = profile;
  const roleLabel = getRoleLabel(profileUser?.role);
  const joinDate = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "Unknown";
  const displayName = profile.displayName || profileUser?.fullName || profileUser?.username;
  const skillTags = getSkillTags(profile.skills);
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  const profileStoryline = getProfileStoryline(profileUser?.role);
  const profileTagline = getProfileTagline(profileUser?.role, skillTags, profile.location);
  const profileRegion = getRegionLabel(profile.location);

  return (
    <div className="prof-bg">
      <Navbar />

      {showRegisterMsg && (
        <div className="prof-register-toast">
          Register as an Artisan or NGO to unlock messaging and profile editing.
        </div>
      )}

      <div className="prof-container">
        <div className="prof-hero">
          <div className="prof-cover">
            <div className="prof-cover-content">
              <span className="prof-cover-kicker">KalaSetu Portfolio</span>
            </div>
          </div>

          <div className="prof-hero-body">
            <div className="prof-avatar-wrap">
              {profile.photo ? (
                <img src={profile.photo} alt={displayName} className="prof-avatar-img" />
              ) : (
                <div className="prof-avatar-initials">
                  {profileUser?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="prof-hero-main">
              <div className="prof-name-row">
                <h2 className="display-serif">{displayName}</h2>
                <span className={`prof-role-badge ${profileUser?.role}`}>{roleLabel}</span>
              </div>
              <p className="prof-username">@{profileUser?.username}</p>

              <div className="prof-meta-row" style={{ marginTop: '10px' }}>
                {profile.location && (
                  <span>
                    <i className="fi fi-sr-map-marker" style={{ color: '#d1437b' }} />
                    {profile.location}
                  </span>
                )}
                {skillTags.length > 0 && (
                  <span>
                    <i className="fi fi-sr-palette" style={{ color: '#C4704A' }} />
                    {skillTags[0]}
                  </span>
                )}
                <span>
                  <i className="fi fi-sr-calendar" style={{ color: '#5a7fc4' }} />
                  Joined {joinDate}
                </span>
              </div>

              <div className="prof-stats-row">
                <div className="prof-stat-card">
                  <span className="prof-stat-icon"><i className="fi fi-sr-apps" /></span>
                  <strong>{posts.filter(p => p.author?._id === userId).length}</strong>
                  <small>Posts</small>
                </div>
                <div
                  className="prof-stat-card prof-stat-clickable"
                  onClick={handleFollowersClick}
                  title="View followers"
                >
                  <span className="prof-stat-icon"><i className="fi fi-sr-user-add" /></span>
                  <strong>{followersCount}</strong>
                  <small>Followers</small>
                </div>
              </div>
            </div>

            <div className="prof-hero-actions">
              {isOwn && (
                <button className="prof-secondary-btn" onClick={handleEditClick}>
                  Edit Profile
                </button>
              )}
              {currentUser && !isOwn && (
                <button
                  className={`prof-primary-btn ${following ? "prof-following-btn" : requested ? "prof-requested-btn" : ""}`}
                  style={requested ? { background: "rgba(47, 111, 109, 0.15)", color: "var(--brand-900)" } : {}}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  <i className={`fi ${following ? "fi-sr-user-check" : requested ? "fi-sr-time-check" : "fi-sr-user-add"}`} />
                  {following ? "Following" : requested ? "Requested" : "Follow"}
                </button>
              )}
              {currentUser && !isOwn && (
                <button className="prof-secondary-btn" onClick={handleMessageClick}>
                  <i className="fi fi-sr-comments" />
                  Message
                </button>
              )}
              {currentUser && !isOwn && (
                <div className="prof-more-wrap">
                  <button
                    className="prof-more-btn"
                    onClick={() => setShowMoreMenu((value) => !value)}
                    title="More options"
                  >
                    More
                  </button>
                  {showMoreMenu && (
                    <>
                      <div className="prof-more-overlay" onClick={() => setShowMoreMenu(false)} />
                      <div className="prof-more-dropdown">
                        <button onClick={() => handleMoreAction("block")}>Block user</button>
                        <button onClick={() => handleMoreAction("report")}>Report user</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="prof-body">
          <div className="prof-posts-section">
            <div className="prof-tabs">
              <button
                className={`prof-tab ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => setActiveTab("posts")}
              >
                <i className="fi fi-sr-apps" />
                Posts
              </button>
              <button
                className={`prof-tab ${activeTab === "reposts" ? "active" : ""}`}
                onClick={() => setActiveTab("reposts")}
              >
                <i className="fi fi-sr-arrows-retweet" />
                Reposts
              </button>
            </div>

            <div className="prof-posts-header">
              <div>
                <h3 className="prof-posts-title">
                  {activeTab === "posts" ? "Cultural Posts" : "Shared Stories"}
                  <span className="prof-posts-count">
                    {activeTab === "posts"
                      ? posts.filter(p => p.author?._id === userId).length
                      : posts.filter(p => p.reposts?.includes(userId)).length}
                  </span>
                </h3>
                <p className="prof-posts-subtitle">
                  {activeTab === "posts"
                    ? "Original stories and updates shared through KalaSetu."
                    : "Cultural works and announcements curated by this profile."}
                </p>
              </div>

              {isOwn && profileUser?.role !== "user" && activeTab === "posts" && (
                <button className="prof-primary-btn prof-posts-cta" onClick={() => navigate("/create-post")}>
                  Create Post
                </button>
              )}
            </div>

            {(activeTab === "posts"
              ? posts.filter(p => p.author?._id === userId).length
              : posts.filter(p => p.reposts?.includes(userId)).length) === 0 ? (
              <div className="prof-no-posts">
                <div className="prof-empty-icon">
                  <i className={activeTab === "posts" ? "fi fi-sr-image" : "fi fi-sr-arrows-retweet"} />
                </div>
                <p>
                  {activeTab === "posts"
                    ? (isOwn ? "No posts yet. Share your first cultural story and start building your portfolio." : "No posts yet.")
                    : (isOwn ? "You haven't reposted anything yet. Share cultural works from others to build your collection." : "No reposts yet.")}
                </p>
              </div>
            ) : (
              <div className="posts-grid" style={{ maxWidth: "600px", margin: "0 auto", padding: "10px 0" }}>
                {posts
                  .filter(p => activeTab === "posts" ? p.author?._id === userId : p.reposts?.includes(userId))
                  .map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUser={currentUser}
                      isOwn={isOwn && post.author?._id === currentUser?._id}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onRepost={handleRepost}
                      onShowLikes={handleLikesClick}
                      onEdit={() => navigate(`/edit-post/${post._id}`)}
                      onDelete={() => handleDeletePost(post._id)}
                    />
                  ))}
              </div>
            )}
          </div>

          <aside className="prof-sidebar">
            <div className="prof-card">
              <h3>
                <i className="fi fi-sr-comment-alt-dots" />
                About
              </h3>
              <p>{profile.about || "This member has not added a profile story yet."}</p>
            </div>

            {skillTags.length > 0 && (
              <div className="prof-card">
                <h3>
                  <i className="fi fi-sr-palette" />
                  Skills & Focus
                </h3>
                <div className="prof-side-tags">
                  {skillTags.map((skill) => (
                    <span key={skill} className="prof-skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="prof-card">
              <h3>
                <i className="fi fi-sr-user" />
                Details
              </h3>
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

            {currentUser && !isOwn && (
              <div className="prof-card prof-contact-rail">
                <h3><i className="fi fi-sr-comment-alt-dots" /> Contact</h3>
                <p>Open a conversation for collaborations, cultural projects, or event opportunities.</p>
                <button className="prof-primary-btn" onClick={handleMessageClick}>
                  <i className="fi fi-sr-comment-alt-dots" /> Message
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>

      {moreModal && (
        <div className="prof-logout-overlay" onClick={() => setMoreModal(null)}>
          <div className="prof-more-modal" onClick={(event) => event.stopPropagation()}>
            <div className="prof-empty-icon modal-icon">
              <i className="fi fi-sr-user" />
            </div>
            <h3 className="display-serif">{moreModal === "block" ? "Block User" : "Report User"}</h3>
            <p>
              {moreModal === "block"
                ? "They will not be able to find your profile or send you messages."
                : "We will review this account and take action if it violates community guidelines."}
            </p>
            <div className="prof-logout-actions">
              <button className="prof-secondary-btn" onClick={() => setMoreModal(null)}>
                Cancel
              </button>
              <button
                className={moreModal === "block" ? "prof-block-confirm" : "prof-report-confirm"}
                onClick={confirmMoreAction}
              >
                {moreModal === "block" ? "Block" : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {moreToast && <div className="prof-register-toast">{moreToast}</div>}

      {likesModalPostId && (
        <div className="prof-logout-overlay" onClick={() => setLikesModalPostId(null)}>
          <div className="prof-more-modal prof-likes-modal" onClick={(event) => event.stopPropagation()}>
            <div className="prof-likes-header">
              <h3 className="display-serif">Likes</h3>
              <button onClick={() => setLikesModalPostId(null)}>Close</button>
            </div>
            <div className="prof-likes-body">
              {loadingLikes ? (
                <div className="prof-likes-loading">
                  <div className="prof-spinner" />
                </div>
              ) : (
                <div className="prof-likers-list">
                  {likers.map((user) => (
                    <div
                      key={user._id}
                      className="prof-liker-item"
                      onClick={() => {
                        setLikesModalPostId(null);
                        navigate(`/profile/${user._id}`);
                      }}
                    >
                      <div className="prof-liker-avatar">{user.username?.[0]?.toUpperCase()}</div>
                      <div className="prof-liker-info">
                        <span className="prof-liker-username">{user.username}</span>
                        <span className="prof-liker-name">{user.fullName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {followersModalOpen && (
        <div className="prof-logout-overlay" onClick={() => setFollowersModalOpen(false)}>
          <div className="prof-more-modal prof-followers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prof-likes-header">
              <h3 className="display-serif">
                <i className="fi fi-sr-user-add" style={{ marginRight: 8, color: "var(--brand-700)" }} />
                Followers
                {!followersLoading && !followersError && (
                  <span className="prof-followers-count-badge">{followersList.length}</span>
                )}
              </h3>
              <button onClick={() => setFollowersModalOpen(false)}>
                <i className="fi fi-sr-cross-small" />
              </button>
            </div>

            <div className="prof-likes-body">
              {followersLoading ? (
                <div className="prof-likes-loading">
                  <div className="prof-spinner" />
                  <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 14 }}>Loading followers...</p>
                </div>
              ) : followersError ? (
                <div className="prof-followers-locked">
                  <div className="prof-followers-lock-icon">
                    <i className="fi fi-sr-lock" />
                  </div>
                  <p>{followersError}</p>
                </div>
              ) : followersList.length === 0 ? (
                <div className="prof-followers-locked">
                  <div className="prof-followers-lock-icon" style={{ background: "rgba(47,111,109,0.08)" }}>
                    <i className="fi fi-sr-user-add" style={{ color: "var(--brand-700)" }} />
                  </div>
                  <p style={{ color: "var(--text-muted)" }}>No followers yet.</p>
                </div>
              ) : (
                <div className="prof-likers-list">
                  {followersList.map((follower) => (
                    <div
                      key={follower._id}
                      className="prof-liker-item"
                      onClick={() => { setFollowersModalOpen(false); navigate(`/profile/${follower._id}`); }}
                    >
                      {follower.photo ? (
                        <img src={follower.photo} alt={follower.username} className="prof-follower-avatar-img" />
                      ) : (
                        <div className="prof-liker-avatar">{follower.username?.[0]?.toUpperCase()}</div>
                      )}
                      <div className="prof-liker-info">
                        <span className="prof-liker-username">{follower.displayName || follower.fullName || follower.username}</span>
                        <span className="prof-liker-name">@{follower.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import "./Profile.css";
import { PostCard } from "../components/home/Home";
import "../components/home/Home.css";
import { ProfileHeaderSkeleton, PostSkeleton } from "../components/common/Skeleton";
import { useAuthStore } from "../store/useAuthStore";

import API from "../utils/api";

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
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUnfollowDropdown, setShowUnfollowDropdown] = useState(false);
  const [moreModal, setMoreModal] = useState(null);
  const [moreToast, setMoreToast] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [moreLoading, setMoreLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [likesModalType, setLikesModalType] = useState("likes");
  const [likers, setLikers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersError, setFollowersError] = useState("");
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState("");
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);

  const isOwn = currentUser && currentUser._id === userId;
  const { socket } = useAuthStore();
  const postsRef = useRef(null);

  // Scroll to posts section whenever a tab becomes active
  useEffect(() => {
    if (!activeTab) return;
    const timer = setTimeout(() => {
      postsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Fetch block status when viewing another user's profile
  useEffect(() => {
    if (isOwn || !currentUser || !token) return;
    axios
      .get(`${API}/reports/block-status/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setIsBlocked(res.data.isBlocked))
      .catch(() => { });
  }, [userId, isOwn]);

  const handleUnblock = async () => {
    try {
      await axios.post(`${API}/reports/unblock/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsBlocked(false);
      setMoreToast("User unblocked.");
      setTimeout(() => setMoreToast(""), 3000);
    } catch {
      setMoreToast("Failed to unblock. Please try again.");
      setTimeout(() => setMoreToast(""), 3000);
    }
  };

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

  const handleFollowingClick = async () => {
    setFollowingModalOpen(true);
    setFollowingLoading(true);
    setFollowingError("");
    setFollowingList([]);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/profiles/${userId}/following`, { headers });
      setFollowingList(res.data.following || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setFollowingError("🔒 This profile is private. Only followers can view this list.");
      } else {
        setFollowingError("Could not load following. Please try again.");
      }
    } finally {
      setFollowingLoading(false);
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
    navigate("/settings?tab=profile");
  };

  const handleMessageClick = () => {
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

  const confirmMoreAction = async () => {
    if (moreModal === "report" && !reportReason) {
      setMoreToast("Please select a reason for the report.");
      setTimeout(() => setMoreToast(""), 3000);
      return;
    }
    setMoreLoading(true);
    try {
      if (moreModal === "block") {
        await axios.post(
          `${API}/reports/block/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsBlocked(true);
        setMoreToast("User has been blocked. You can unblock them from your settings.");
      } else {
        await axios.post(
          `${API}/reports/report/${userId}`,
          { reason: reportReason, details: reportDetails },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMoreToast("Report submitted. Our team will review it shortly.");
      }
    } catch (err) {
      setMoreToast(err.response?.data?.message || "Something went wrong. Please try again.");
    }
    setMoreModal(null);
    setMoreLoading(false);
    setReportReason("");
    setReportDetails("");
    setTimeout(() => setMoreToast(""), 4000);
  };

  const handleLikesClick = async (postId, likesCount) => {
    if (likesCount === 0) return;

    setLikesModalPostId(postId);
    setLikesModalType("likes");
    setLoadingLikes(true);

    try {
      const res = await axios.get(`${API}/posts/${postId}/likes`);
      setLikers(res.data);
    } catch (err) {
      console.error("Error fetching likes:", err);
    }

    setLoadingLikes(false);
  };

  const handleDislikesClick = async (postId, dislikesCount) => {
    if (dislikesCount === 0) return;

    setLikesModalPostId(postId);
    setLikesModalType("dislikes");
    setLoadingLikes(true);

    try {
      const res = await axios.get(`${API}/posts/${postId}/dislikes`);
      setLikers(res.data);
    } catch (err) {
      console.error("Error fetching dislikes:", err);
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
    window.scrollTo(0, 0);
    const loadProfileData = async () => {
      // Fire all three requests in parallel
      const token = localStorage.getItem("token");
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      const [profileResult, postsResult, followResult] = await Promise.allSettled([
        axios.get(`${API}/profiles/${userId}`),
        // Fetch both authored posts AND reposts so both tabs populate correctly
        axios.get(`${API}/posts`, { params: { author: userId, repostedBy: userId, limit: 50 } }),
        token && currentUser
          ? axios.get(`${API}/profiles/${userId}/follow-status`, { headers: authHeader })
          : Promise.resolve(null),
      ]);

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data);
      } else {
        if (profileResult.reason?.response?.status === 404) setNotFound(true);
      }
      setLoading(false);

      if (postsResult.status === "fulfilled") {
        // Handle both paginated { posts } and plain array responses
        const data = postsResult.value.data;
        const allPosts = Array.isArray(data) ? data : (data.posts || []);
        setPosts(allPosts);
      } else {
        setPosts([]);
      }

      if (followResult.status === "fulfilled" && followResult.value) {
        setFollowing(followResult.value.data.following);
        setRequested(followResult.value.data.requested);
        setFollowersCount(followResult.value.data.followersCount);
        setFollowingCount(followResult.value.data.followingCount || 0);
      }
    };

    loadProfileData();
  }, [userId]);


  if (loading) {
    return (
      <div className="prof-bg">
        <Navbar />
        <div className="prof-container" style={{ marginTop: "24px" }}>
          <ProfileHeaderSkeleton />
          <div className="posts-grid" style={{ maxWidth: "600px", margin: "0 auto" }}>
            {[...Array(2)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
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

                <div className="prof-stats-row">
                  {currentUser.role !== "user" && (
                    <div className="prof-stat-card">
                      <span className="prof-stat-icon"><i className="fi fi-sr-heart" /></span>
                      <strong>0</strong>
                      <small>Likes</small>
                    </div>
                  )}

                  <div
                    className={`prof-stat-card prof-stat-clickable ${currentUser.role === "user" ? "prof-stat-compact" : ""}`}
                    onClick={handleFollowingClick}
                  >
                    <span className="prof-stat-icon"><i className="fi fi-sr-user-check" /></span>
                    <strong>{followingCount}</strong>
                    <small>Following</small>
                  </div>
                </div>
              </div>

              <div className="prof-hero-actions">
                <button className="prof-secondary-btn prof-edit-btn" onClick={handleEditClick}>
                  <i className="fi fi-sr-pencil" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Unified Sidebar for Members */}
          <div className="prof-sidebar-col">
            <aside className="prof-sidebar">
              <div className="prof-card prof-register-card">
                <h3>
                  <i className="fi fi-sr-star" style={{ color: "var(--brand-500)" }} />
                  Join the Movement
                </h3>
                <p className="prof-register-desc">
                  Register as an Artisan or NGO to build your portfolio, share cultural stories, and unlock messaging.
                </p>
                <button 
                  className="prof-primary-btn prof-register-sidebar-btn" 
                  onClick={() => navigate("/register")}
                >
                  Register Now
                </button>
              </div>
            </aside>
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
        {/* Hero + Sidebar side by side */}
        <div className="prof-hero-with-sidebar">
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
                  {profileUser?.role !== "user" && (
                    <span>
                      <i className="fi fi-sr-calendar" style={{ color: '#5a7fc4' }} />
                      Joined {joinDate}
                    </span>
                  )}
                </div>

                <div className="prof-stats-row">
                  {profileUser?.role !== "user" && (
                    <div className="prof-stat-card">
                      <span className="prof-stat-icon"><i className="fi fi-sr-heart" /></span>
                      <strong>{totalLikes}</strong>
                      <small>Likes</small>
                    </div>
                  )}
                  {profileUser?.role !== "user" && (
                    <div
                      className="prof-stat-card prof-stat-clickable"
                      onClick={handleFollowersClick}
                      title="View followers"
                    >
                      <span className="prof-stat-icon"><i className="fi fi-sr-user-add" /></span>
                      <strong>{followersCount}</strong>
                      <small>Followers</small>
                    </div>
                  )}
                  <div
                    className={`prof-stat-card prof-stat-clickable ${profileUser?.role === "user" ? "prof-stat-compact" : ""}`}
                    onClick={handleFollowingClick}
                    title="View following"
                  >
                    <span className="prof-stat-icon"><i className="fi fi-sr-user-check" /></span>
                    <strong>{followingCount}</strong>
                    <small>Following</small>
                  </div>
                </div>
              </div>

              <div className="prof-hero-actions">
                {isOwn && (
                  <button className="prof-secondary-btn prof-edit-btn" onClick={handleEditClick}>
                    <i className="fi fi-sr-pencil" />
                    Edit Profile
                  </button>
                )}
                {currentUser && !isOwn && !isBlocked && profileUser?.role !== "user" && (
                  <div className="prof-more-wrap" style={{ position: "relative" }}>
                    <button
                      className={`prof-primary-btn ${following ? "prof-following-btn" : requested ? "prof-requested-btn" : ""}`}
                      style={requested ? { background: "rgba(47, 111, 109, 0.15)", color: "var(--brand-900)" } : {}}
                      onClick={() => following ? setShowUnfollowDropdown((prev) => !prev) : handleFollow()}
                      disabled={followLoading}
                    >
                      <i className={`fi ${following ? "fi-sr-user-check" : requested ? "fi-sr-time-check" : "fi-sr-user-add"}`} />
                      {following ? "Following" : requested ? "Requested" : "Follow"}
                    </button>
                    {following && showUnfollowDropdown && (
                      <>
                        <div className="prof-more-overlay" onClick={() => setShowUnfollowDropdown(false)} />
                        <div className="prof-more-dropdown" style={{ right: 0, left: "auto", minWidth: "120px" }}>
                          <button
                            className="prof-unfollow-btn"
                            onClick={() => { setShowUnfollowDropdown(false); handleFollow(); }}
                            style={{ color: "#e11d48", fontWeight: "600" }}
                          >
                            Unfollow
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {currentUser && !isOwn && (
                  <button
                    className={`prof-secondary-btn${isBlocked ? " prof-btn-disabled" : ""}`}
                    onClick={isBlocked ? undefined : handleMessageClick}
                    title={isBlocked ? "Messaging unavailable" : "Send a message"}
                    disabled={isBlocked}
                  >
                    <i className="fi fi-sr-comments" />
                    {isBlocked ? "Messaging unavailable" : "Message"}
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
                          <button onClick={() => isBlocked ? handleUnblock() : handleMoreAction("block")}>{isBlocked ? "Unblock user" : "Block user"}</button>
                          {!isBlocked && <button onClick={() => handleMoreAction("report")}>Report user</button>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar column: cards + content toggle buttons */}
          {!(profileUser?.role === "user" && !isOwn) && (
            <div className="prof-sidebar-col">
              <aside className="prof-sidebar">
                {profileUser?.role === "user" && (
                  <div className="prof-card prof-register-card">
                    <h3>
                      <i className="fi fi-sr-star" style={{ color: "var(--brand-500)" }} />
                      Join the Movement
                    </h3>
                    <p className="prof-register-desc">
                      Register as an Artisan or NGO to build your portfolio, share cultural stories, and unlock messaging.
                    </p>
                    <button 
                      className="prof-primary-btn prof-register-sidebar-btn" 
                      onClick={() => navigate("/register")}
                    >
                      Register Now
                    </button>
                  </div>
                )}

                {profileUser?.role !== "user" && (
                  <>
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
                          Skills &amp; Focus
                        </h3>
                        <div className="prof-side-tags-row">
                          {skillTags.slice(0, 2).map((skill) => (
                            <span key={skill} className="prof-skill-pill">
                              {skill}
                            </span>
                          ))}
                          {skillTags.length > 2 && (
                            <button
                              className="prof-skills-more-btn"
                              onClick={() => setSkillsModalOpen(true)}
                            >
                              +{skillTags.length - 2} more
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="prof-card">
                      <h3>
                        <i className="fi fi-sr-info" />
                        Details
                      </h3>
                      <div className="prof-details">
                        {profile.userType && (
                          <div className="prof-detail-row">
                            <span className="prof-detail-label">Type</span>
                            <span className={`prof-type ${profileUser?.role}`}>{profile.userType}</span>
                          </div>
                        )}
                        {profile.organizationId && profileUser?.role === "ngo" && (
                          <div className="prof-detail-row">
                            <span className="prof-detail-label">Org ID</span>
                            <span>{profile.organizationId}</span>
                          </div>
                        )}
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
                        <div className="prof-detail-row">
                          <span className="prof-detail-label">Email</span>
                          <span>{profileUser?.email}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </aside>

              {/* Posts / Reposts toggle buttons */}
              {profileUser?.role !== "user" && (
                <div className="prof-content-btns">
                  <button
                    className={`prof-content-btn ${activeTab === "posts" ? "active" : ""}`}
                    onClick={() => setActiveTab(activeTab === "posts" ? null : "posts")}
                  >
                    <i className="fi fi-sr-apps" />
                    Posts
                    <span className="prof-content-btn-count">
                      {posts.filter(p => p.author?._id === userId).length}
                    </span>
                  </button>
                  <button
                    className={`prof-content-btn ${activeTab === "reposts" ? "active" : ""}`}
                    onClick={() => setActiveTab(activeTab === "reposts" ? null : "reposts")}
                  >
                    <i className="fi fi-sr-arrows-retweet" />
                    Reposts
                    <span className="prof-content-btn-count">
                      {posts.filter(p => p.reposts?.includes(userId)).length}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Posts section — only visible when a tab is active */}
        {activeTab && (
          <div className="prof-posts-section" ref={postsRef}>
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

              {isOwn && profileUser?.role !== "user" && (
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
              <div className="prof-posts-grid">
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
                      onShowDislikes={handleDislikesClick}
                      onEdit={() => navigate(`/edit-post/${post._id}`)}
                      onDelete={() => handleDeletePost(post._id)}
                      useModalForComments={true}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {moreModal && (
        <div className="prof-logout-overlay" onClick={() => { setMoreModal(null); setReportReason(""); setReportDetails(""); }}>
          <div className="prof-more-modal" onClick={(event) => event.stopPropagation()}>
            <div className="prof-empty-icon modal-icon">
              <i className={moreModal === "block" ? "fi fi-sr-ban" : "fi fi-sr-flag"} />
            </div>
            <h3 className="display-serif">{moreModal === "block" ? "Block User" : "Report User"}</h3>
            <p>
              {moreModal === "block"
                ? "They will not be able to find your profile, view your posts, or send you messages."
                : "We will review this account and take action if it violates our community guidelines."}
            </p>
            {moreModal === "report" && (
              <div className="prof-report-form">
                <select
                  className="prof-report-select"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="">Select a reason *</option>
                  <option value="spam">Spam or fake account</option>
                  <option value="harassment">Harassment or bullying</option>
                  <option value="hate_speech">Hate speech or discrimination</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="inappropriate_content">Inappropriate content</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  className="prof-report-details"
                  placeholder="Additional details (optional)"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <div className="prof-logout-actions">
              <button className="prof-secondary-btn" onClick={() => { setMoreModal(null); setReportReason(""); setReportDetails(""); }}>
                Cancel
              </button>
              <button
                className={moreModal === "block" ? "prof-block-confirm" : "prof-report-confirm"}
                onClick={confirmMoreAction}
                disabled={moreLoading || (moreModal === "report" && !reportReason)}
              >
                {moreLoading ? "Please wait..." : moreModal === "block" ? "Block" : "Submit Report"}
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
              <h3 className="display-serif">
                <i className={likesModalType === "likes" ? "fi fi-sr-heart" : "fi fi-sr-thumbs-down"} style={{ marginRight: 8, color: "var(--brand-700)" }} />
                {likesModalType === "likes" ? "Likes" : "Dislikes"}
              </h3>
              <button onClick={() => setLikesModalPostId(null)}>
                <i className="fi fi-sr-cross-small" />
              </button>
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

      {/* Following Modal */}
      {followingModalOpen && (
        <div className="prof-logout-overlay" onClick={() => setFollowingModalOpen(false)}>
          <div className="prof-more-modal prof-followers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prof-likes-header">
              <h3 className="display-serif">
                <i className="fi fi-sr-user-check" style={{ marginRight: 8, color: "var(--brand-700)" }} />
                Following
                {!followingLoading && !followingError && (
                  <span className="prof-followers-count-badge">{followingList.length}</span>
                )}
              </h3>
              <button onClick={() => setFollowingModalOpen(false)}>
                <i className="fi fi-sr-cross-small" />
              </button>
            </div>

            <div className="prof-likes-body">
              {followingLoading ? (
                <div className="prof-likes-loading">
                  <div className="prof-spinner" />
                  <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 14 }}>Loading following...</p>
                </div>
              ) : followingError ? (
                <div className="prof-followers-locked">
                  <div className="prof-followers-lock-icon">
                    <i className="fi fi-sr-lock" />
                  </div>
                  <p>{followingError}</p>
                </div>
              ) : followingList.length === 0 ? (
                <div className="prof-followers-locked">
                  <div className="prof-followers-lock-icon" style={{ background: "rgba(47,111,109,0.08)" }}>
                    <i className="fi fi-sr-user-check" style={{ color: "var(--brand-700)" }} />
                  </div>
                  <p style={{ color: "var(--text-muted)" }}>Not following anyone yet.</p>
                </div>
              ) : (
                <div className="prof-likers-list">
                  {followingList.map((person) => (
                    <div
                      key={person._id}
                      className="prof-liker-item"
                      onClick={() => { setFollowingModalOpen(false); navigate(`/profile/${person._id}`); }}
                    >
                      {person.photo ? (
                        <img src={person.photo} alt={person.username} className="prof-follower-avatar-img" />
                      ) : (
                        <div className="prof-liker-avatar">{person.username?.[0]?.toUpperCase()}</div>
                      )}
                      <div className="prof-liker-info">
                        <span className="prof-liker-username">{person.displayName || person.fullName || person.username}</span>
                        <span className="prof-liker-name">@{person.username}</span>
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
      {skillsModalOpen && (
        <div className="prof-logout-overlay" style={{ zIndex: 10000 }}>
          <div className="prof-more-modal prof-likes-modal">
            <div className="prof-likes-header">
              <h3>Skills & Focus</h3>
              <button onClick={() => setSkillsModalOpen(false)}>Close</button>
            </div>
            <div className="prof-likes-body" style={{ padding: '24px' }}>
              <div className="prof-skill-tags" style={{ marginTop: 0 }}>
                {skillTags.map((skill) => (
                  <span key={skill} className="prof-skill-pill" style={{ fontSize: '13px', padding: '10px 16px' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
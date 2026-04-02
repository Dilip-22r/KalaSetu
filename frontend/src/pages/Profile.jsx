import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import "./Profile.css";

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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [moreModal, setMoreModal] = useState(null);
  const [moreToast, setMoreToast] = useState("");
  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [likers, setLikers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const isOwn = currentUser && currentUser._id === userId;

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
        setPosts(postsRes.data.filter((post) => post.author?._id === userId));
      } catch (err) {
        setPosts([]);
        console.error("Error fetching user posts:", err);
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
              <p>{profileStoryline}</p>
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
              <p className="prof-tagline">{profileTagline}</p>

              <div className="prof-meta-row">
                {profileRegion && (
                  <span>
                    <i className="fi fi-sr-map-marker" />
                    Region {profileRegion}
                  </span>
                )}
                {profile.location && (
                  <span>
                    <i className="fi fi-sr-map-marker" />
                    {profile.location}
                  </span>
                )}
                {profile.userType && (
                  <span>
                    <i className="fi fi-sr-palette" />
                    {profile.userType}
                  </span>
                )}
                <span>
                  <i className="fi fi-sr-calendar" />
                  Joined {joinDate}
                </span>
              </div>

              {skillTags.length > 0 && (
                <div className="prof-skill-tags">
                  {skillTags.map((skill) => (
                    <span key={skill} className="prof-skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="prof-stats-row">
                <div className="prof-stat-card">
                  <span className="prof-stat-icon">
                    <i className="fi fi-sr-image" />
                  </span>
                  <strong>{posts.length}</strong>
                  <small>Posts</small>
                </div>
                <div className="prof-stat-card">
                  <span className="prof-stat-icon">
                    <i className="fi fi-sr-heart" />
                  </span>
                  <strong>{totalLikes}</strong>
                  <small>Likes</small>
                </div>
                <div className="prof-stat-card">
                  <span className="prof-stat-icon">
                    <i className="fi fi-sr-palette" />
                  </span>
                  <strong>{skillTags.length || 1}</strong>
                  <small>{skillTags.length ? "Skills" : "Profile Focus"}</small>
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
                <button className="prof-primary-btn" onClick={handleMessageClick}>
                  <i className="fi fi-sr-comment-alt-dots" />
                  Collaborate
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
            <div className="prof-posts-header">
              <div>
                <h3 className="prof-posts-title">
                  Cultural Posts <span className="prof-posts-count">{posts.length}</span>
                </h3>
                <p className="prof-posts-subtitle">
                  Stories, updates, and cultural work shared through KalaSetu.
                </p>
              </div>

              {isOwn && profileUser?.role !== "user" && (
                <button className="prof-primary-btn prof-posts-cta" onClick={() => navigate("/create-post")}>
                  Create Post
                </button>
              )}
            </div>

            {posts.length === 0 ? (
              <div className="prof-no-posts">
                <div className="prof-empty-icon">
                  <i className="fi fi-sr-image" />
                </div>
                <p>
                  No posts yet
                  {isOwn ? ". Share your first cultural story and start building your portfolio." : "."}
                </p>
              </div>
            ) : (
              <div className="prof-posts-grid">
                {posts.map((post) => (
                  <article key={post._id} className="prof-post-card">
                    <div className="prof-post-media">
                      {post.image ? (
                        <img src={post.image} alt={post.title} className="prof-post-img" />
                      ) : (
                        <div className="prof-post-placeholder">
                          <i className="fi fi-sr-image" />
                        </div>
                      )}
                      <div className="prof-post-overlay">
                        <span className="prof-post-cat">{post.category}</span>
                      </div>
                    </div>

                    <div className="prof-post-body">
                      <span className="prof-post-date">
                        <i className="fi fi-sr-calendar" />
                        {new Date(post.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <div className="prof-post-tags">
                        <span className="prof-post-tag">#{post.category}</span>
                        {skillTags.slice(0, 2).map((skill) => (
                          <span key={`${post._id}-${skill}`} className="prof-post-tag muted">
                            #{skill.replace(/\s+/g, "")}
                          </span>
                        ))}
                      </div>
                      <h4>{post.title}</h4>
                      <p>{post.content}</p>

                      <div className="prof-post-footer">
                        <button
                          className="prof-like-pill"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleLikesClick(post._id, post.likes?.length || 0);
                          }}
                        >
                          <i className="fi fi-sr-heart" />
                          {post.likes?.length || 0}
                        </button>

                        {isOwn && (
                          <div className="prof-post-actions">
                            <button
                              className="prof-post-action"
                              onClick={() => navigate(`/edit-post/${post._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              className="prof-post-action danger"
                              onClick={() => handleDeletePost(post._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
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
                <h3>
                  <i className="fi fi-sr-comment-alt-dots" />
                  Contact
                </h3>
                <p>Open a conversation for collaborations, cultural projects, or event opportunities.</p>
                <button className="prof-primary-btn" onClick={handleMessageClick}>
                  <i className="fi fi-sr-comment-alt-dots" />
                  Contact / Collaborate
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
    </div>
  );
}

export default Profile;

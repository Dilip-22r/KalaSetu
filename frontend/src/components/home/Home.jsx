import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import Navbar from "../common/Navbar";

const API = "http://localhost:5000";

const CATEGORIES = [
  { value: "", label: "All Posts", icon: "fi-sr-apps" },
  { value: "event", label: "Events", icon: "fi-sr-calendar" },
  { value: "artwork", label: "Artwork", icon: "fi-sr-palette" },
  { value: "story", label: "Stories", icon: "fi-sr-search" },
  { value: "workshop", label: "Workshops", icon: "fi-sr-sparkles" },
  { value: "announcement", label: "Announcements", icon: "fi-sr-megaphone" },
];

const categoryIcons = {
  event: "fi fi-sr-calendar",
  artwork: "fi fi-sr-palette",
  story: "fi fi-sr-search",
  workshop: "fi fi-sr-sparkles",
  announcement: "fi fi-sr-megaphone",
};

function PostCard({ post, currentUser, onLike, onShowLikes }) {
  const navigate = useNavigate();
  const liked = post.likes?.includes(currentUser?._id);
  const categoryIconClass = categoryIcons[post.category] || "fi fi-sr-search";

  return (
    <div className="post-card">
      {post.image && (
        <div className="post-image-wrap">
          <img src={post.image} alt={post.title} className="post-image" />
        </div>
      )}
      <div className="post-body">
        <div className="post-meta">
          <span className="post-category">
            <i className={categoryIconClass} /> {post.category}
          </span>
          <span className="post-date">
            <i className="fi fi-sr-calendar" />{" "}
            {new Date(post.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        <h3 className="post-title">{post.title}</h3>
        <p className="post-content">{post.content}</p>

        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="post-footer">
          <div className="post-author" onClick={() => navigate(`/profile/${post.author?._id}`)}>
            <div className="author-avatar">{post.author?.username?.[0]?.toUpperCase()}</div>
            <div>
              <span className="author-name">{post.author?.fullName}</span>
              <span className={`role-badge ${post.author?.role}`}>{post.author?.role}</span>
            </div>
          </div>
          <div className="post-actions">
            <button
              className={`like-btn ${liked ? "liked" : ""}`}
              onClick={() => onLike(post._id)}
              disabled={!currentUser}
            >
              <i className="fi fi-sr-heart" />
              {liked ? "Liked" : "Like"}{" "}
              <span
                className="likes-count"
                onClick={(event) => {
                  event.stopPropagation();
                  onShowLikes(post._id, post.likes?.length || 0);
                }}
              >
                {post.likes?.length || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [likers, setLikers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await axios.get(`${API}/posts`, { params });
      setPosts(res.data);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [category, search]);

  const handleLikesClick = async (postId, likesCount) => {
    if (likesCount === 0) return;
    setLikesModalPostId(postId);
    setLoadingLikes(true);
    try {
      const res = await axios.get(`${API}/posts/${postId}/likes`);
      setLikers(res.data);
    } catch {
      setLikers([]);
    }
    setLoadingLikes(false);
  };

  useEffect(() => {
    if (!user) navigate("/signin");
  }, [navigate, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    const previousPosts = [...posts];

    setPosts(
      posts.map((post) => {
        if (post._id !== postId) return post;
        const isLiked = post.likes.includes(user._id);
        const updatedLikes = isLiked
          ? post.likes.filter((id) => id !== user._id)
          : [...post.likes, user._id];
        return { ...post, likes: updatedLikes };
      })
    );

    try {
      await axios.put(
        `${API}/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      setPosts(previousPosts);
    }
  };

  if (!user) return null;

  const roleLabel =
    user.role === "artisan" ? "Artisan" : user.role === "ngo" ? "NGO" : "User";

  const canPost = user.role === "artisan" || user.role === "ngo";

  return (
    <div className="home-bg">
      <Navbar />

      <div className="home-container">
        {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
        <aside className="home-sidebar">

          {/* Welcome Card */}
          <div className="welcome-banner">
            <div className="welcome-user-row">
              <div className="welcome-avatar">
                {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
              </div>
              <div className="welcome-text">
                <h2>Hi, {user.fullName?.split(" ")[0]}</h2>
                <p>
                  {canPost
                    ? "Share your culture with the community."
                    : "Browse artisan & NGO posts."}
                </p>
              </div>
            </div>

            <div className="welcome-role-badge">
              <span className={`big-role-badge ${user.role}`}>{roleLabel}</span>
            </div>

            {canPost && (
              <button
                className="sidebar-create-btn"
                onClick={() => navigate("/create-post")}
              >
                <i className="fi fi-sr-plus" /> Create Post
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sidebar-categories">
            <div className="sidebar-categories-title">Browse</div>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`sidebar-cat-item ${category === cat.value ? "active" : ""}`}
                onClick={() => setCategory(cat.value)}
              >
                <span className="cat-dot" />
                {cat.label}
              </button>
            ))}
          </div>
        </aside>

        {/* ─── MAIN FEED ────────────────────────────────────── */}
        <div className="home-feed">

          {/* Slim search bar */}
          <div className="filters-bar">
            <input
              className="search-input"
              type="text"
              placeholder="Search posts, tags, content..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="category-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Posts */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <h3>No posts found</h3>
              <p>
                {canPost
                  ? "Be the first to share something!"
                  : "No posts yet — check back soon."}
              </p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onLike={handleLike}
                  onShowLikes={handleLikesClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Likes Modal ──────────────────────────────────── */}
      {likesModalPostId && (
        <div className="likes-modal-overlay" onClick={() => setLikesModalPostId(null)}>
          <div className="likes-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="likes-modal-header">
              <h3>Likes</h3>
              <button className="close-modal-btn" onClick={() => setLikesModalPostId(null)}>
                ✕
              </button>
            </div>
            <div className="likes-modal-body">
              {loadingLikes ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <div className="spinner" />
                </div>
              ) : (
                <div className="likers-list">
                  {likers.map((liker) => (
                    <div
                      key={liker._id}
                      className="liker-item"
                      onClick={() => {
                        setLikesModalPostId(null);
                        navigate(`/profile/${liker._id}`);
                      }}
                    >
                      <div className="liker-avatar">{liker.username?.[0]?.toUpperCase()}</div>
                      <div className="liker-info">
                        <span className="liker-username">{liker.username}</span>
                        <span className="liker-fullname">{liker.fullName}</span>
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

export default Home;

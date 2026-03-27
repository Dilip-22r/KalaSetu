import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";

const API = "http://localhost:5000";

function PostCard({ post, currentUser, onLike, onDelete }) {
  const navigate = useNavigate();
  const liked = post.likes?.includes(currentUser?._id);
  const isOwner = post.author?._id === currentUser?._id;

  const categoryEmoji = { event: "🎪", artwork: "🎨", story: "📖", workshop: "🛠️", announcement: "📢" };

  return (
    <div className="post-card">
      {post.image && (
        <div className="post-image-wrap">
          <img src={post.image} alt={post.title} className="post-image" />
        </div>
      )}
      <div className="post-body">
        <div className="post-meta">
          <span className="post-category">{categoryEmoji[post.category] || "📌"} {post.category}</span>
          <span className="post-date">
            {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <h3 className="post-title">{post.title}</h3>
        <p className="post-content">{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.map((t, i) => <span key={i} className="tag">#{t}</span>)}
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
              {liked ? "❤️" : "🤍"} {post.likes?.length || 0}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/signin"); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => { fetchPosts(); }, [search, category]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await axios.get(`${API}/posts`, { params });
      setPosts(res.data);
    } catch { setPosts([]); }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    const previousPosts = [...posts];

    // Optimistically update the UI instantly without triggering loading spinner
    setPosts(posts.map(post => {
      if (post._id === postId) {
        const isLiked = post.likes.includes(user._id);
        const updatedLikes = isLiked 
          ? post.likes.filter(id => id !== user._id) 
          : [...post.likes, user._id];
        return { ...post, likes: updatedLikes };
      }
      return post;
    }));

    try {
      await axios.put(`${API}/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // Revert if API fails
      setPosts(previousPosts);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    const token = localStorage.getItem("token");
    const previousPosts = [...posts];

    // Optimistically remove from UI instantly
    setPosts(posts.filter(post => post._id !== postId));

    try {
      await axios.delete(`${API}/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // Revert if API fails
      setPosts(previousPosts);
    }
  };

  if (!user) return null;

  const roleLabel = user.role === "artisan" ? "🎨 Artisan" : user.role === "ngo" ? "🤝 NGO" : "👤 User";

  return (
    <div className="home-bg">
      <nav className="navbar">
        <h1 className="brand-title" onClick={() => navigate("/home")}>KalaSetu</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate("/search")}>🔍 Explore</button>
          {user.role !== "user" && (
            <>
              <button onClick={() => navigate("/create-post")}>✏️ Create Post</button>
              <button onClick={() => navigate("/messages")}>💬 Messages</button>
            </>
          )}
          {user.role === "user" && (
            <button className="register-btn" onClick={() => navigate("/register")}>
              ⭐ Register as Artisan/NGO
            </button>
          )}
          <button className="profile-btn" onClick={() => navigate(`/profile/${user._id}`)}>
            <span className="profile-btn-name">👤 {user.username}</span>
          </button>
        </div>
      </nav>

      <div className="home-container">
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Hi, {user.fullName?.split(" ")[0]} 🙏</h2>
            <p>
              {user.role === "user"
                ? "Browse cultural posts from artisans & NGOs across India. Register to share your own!"
                : `Welcome back, ${user.role === "artisan" ? "Artisan" : "NGO"} — share your culture with the community.`}
            </p>
          </div>
          <div className="welcome-role-badge">
            <span className={`big-role-badge ${user.role}`}>{roleLabel}</span>
          </div>
        </div>

        <div className="filters-bar">
          <input className="search-input" type="text" placeholder="Search posts, tags, content..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="event">🎪 Events</option>
            <option value="artwork">🎨 Artwork</option>
            <option value="story">📖 Stories</option>
            <option value="workshop">🛠️ Workshops</option>
            <option value="announcement">📢 Announcements</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>Loading cultural posts...</p></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3>No posts found</h3>
            <p>{user.role !== "user" ? "Be the first to share something cultural!" : "No posts yet — check back soon!"}</p>
            {user.role !== "user" && <button onClick={() => navigate("/create-post")}>Create First Post</button>}
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} currentUser={user} onLike={handleLike} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
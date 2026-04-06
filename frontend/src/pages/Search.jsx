import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Search.css";
import Navbar from "../components/common/Navbar";
import { useAuthStore } from "../store/useAuthStore";
import { PostCard } from "../components/home/Home";
import "../components/home/Home.css";
import { PostSkeleton, ProfileCardSkeleton } from "../components/common/Skeleton";
import API from "../utils/api";

function Search() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const user = authUser ?? JSON.parse(localStorage.getItem("user") || "null");

  const [tab, setTab] = useState("creators");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [results, setResults] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Likes and Actions state
  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [likers, setLikers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

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

  const handleLike = async (postId) => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const previousPosts = [...posts];

    setPosts(
      posts.map((post) => {
        if (post._id !== postId) return post;
        const isLiked = post.likes.includes(user._id);
        const updatedLikes = isLiked
          ? post.likes.filter((id) => id !== user._id)
          : [...post.likes, user._id];

        const updatedDislikes = !isLiked && post.dislikes?.includes(user._id)
          ? post.dislikes.filter((id) => id !== user._id)
          : post.dislikes || [];

        return { ...post, likes: updatedLikes, dislikes: updatedDislikes };
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

  const handleDislike = async (postId) => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const previousPosts = [...posts];
    setPosts(posts.map((post) => {
      if (post._id !== postId) return post;
      const isDisliked = post.dislikes?.includes(user._id);
      const updatedDislikes = isDisliked
        ? (post.dislikes || []).filter((id) => id !== user._id)
        : [...(post.dislikes || []), user._id];

      const updatedLikes = !isDisliked && post.likes?.includes(user._id)
        ? post.likes.filter((id) => id !== user._id)
        : post.likes || [];

      return { ...post, dislikes: updatedDislikes, likes: updatedLikes };
    }));
    try {
      await axios.put(`${API}/posts/${postId}/dislike`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { setPosts(previousPosts); }
  };

  const handleRepost = async (postId) => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const previousPosts = [...posts];
    setPosts(posts.map((post) => {
      if (post._id !== postId) return post;
      const isReposted = post.reposts?.includes(user._id);
      const updatedReposts = isReposted
        ? (post.reposts || []).filter((id) => id !== user._id)
        : [...(post.reposts || []), user._id];
      return { ...post, reposts: updatedReposts };
    }));
    try {
      await axios.put(`${API}/posts/${postId}/repost`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { setPosts(previousPosts); }
  };

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await axios.get(`${API}/profiles/creators`, { params });
      const filtered = user ? res.data.filter((profile) => profile.user?._id !== user._id) : res.data;
      setResults(filtered);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [search, typeFilter, user]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.category = typeFilter;
      const res = await axios.get(`${API}/posts`, { params });
      setPosts(res.data.posts || []);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    if (tab === "creators") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCreators();
      return;
    }
    fetchPosts();
  }, [fetchCreators, fetchPosts, tab]);

  return (
    <div className="search-bg">
      <Navbar />

      <div className="s-container">
        <div className="s-header">
          <h2><i className="fi fi-sr-search" /> Explore KalaSetu</h2>
          <p>Discover artisans, NGOs, and cultural content from across India</p>
        </div>

        <div className="s-tabs">
          <button
            className={tab === "creators" ? "active" : ""}
            onClick={() => {
              setTab("creators");
              setSearch("");
              setTypeFilter("");
            }}
          >
            <i className="fi fi-sr-user" /> Artisans & NGOs
          </button>
          <button
            className={tab === "posts" ? "active" : ""}
            onClick={() => {
              setTab("posts");
              setSearch("");
              setTypeFilter("");
            }}
          >
            <i className="fi fi-sr-image" /> Cultural Posts
          </button>
        </div>

        <div className="s-filters">
          <input
            type="text"
            placeholder={tab === "creators" ? "Search by name, skills, location..." : "Search posts..."}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="s-input"
          />
          {tab === "creators" ? (
            <select className="s-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All Types</option>
              <option value="artisan">Artisan</option>
              <option value="ngo">NGO</option>
            </select>
          ) : (
            <select className="s-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All Categories</option>
              <option value="event">Events</option>
              <option value="artwork">Artwork</option>
              <option value="story">Stories</option>
              <option value="workshop">Workshops</option>
              <option value="announcement">Announcements</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className={tab === "creators" ? "s-grid" : "explore-feed"}>
            {[...Array(6)].map((_, i) => (
              tab === "creators" ? <ProfileCardSkeleton key={i} /> : <div className="posts-grid" key={i}><PostSkeleton /></div>
            ))}
          </div>
        ) : tab === "creators" ? (
          results.length === 0 ? (
            <div className="s-empty">
              <span><i className="fi fi-sr-search" /></span>
              <p>No creators found</p>
            </div>
          ) : (
            <div className="s-grid">
              {results.map((profile) => (
                <div
                  key={profile._id}
                  className="creator-card"
                  onClick={() => navigate(`/profile/${profile.user?._id}`)}
                >
                  <div className="creator-avatar">
                    {profile.photo ? <img src={profile.photo} alt="" /> : <span>{profile.user?.username?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="creator-info">
                    <h3>{profile.displayName || profile.user?.fullName}</h3>
                    <span className={`s-role ${profile.user?.role}`}>{profile.user?.role}</span>
                    {profile.skills && <p className="creator-skills"><i className="fi fi-sr-palette" /> {profile.skills}</p>}
                    {profile.location && <p className="creator-location"><i className="fi fi-sr-map-marker" /> {profile.location}</p>}
                  </div>
                  <button className="view-btn"><i className="fi fi-sr-circle-user" /> View Profile</button>
                </div>
              ))}
            </div>
          )
        ) : posts.length === 0 ? (
          <div className="s-empty">
            <span><i className="fi fi-sr-image" /></span>
            <p>No posts found</p>
          </div>
        ) : (
          <div className="explore-feed">
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onRepost={handleRepost}
                  onShowLikes={handleLikesClick}
                  useModalForComments={true}
                />
              ))}
            </div>
          </div>
        )}
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

export default Search;

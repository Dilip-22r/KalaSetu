import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import "./Home.css";
import Navbar from "../common/Navbar";
import { useFeedStore } from "../../store/useFeedStore";
import { PostSkeleton } from "../common/Skeleton";

import API from "../../utils/api";

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

export function PostCard({ post, currentUser, onLike, onDislike, onRepost, onShowLikes, onEdit, onDelete, isOwn, hideRepost, useModalForComments }) {
  const navigate = useNavigate();
  const liked = post.likes?.includes(currentUser?._id);
  const disliked = post.dislikes?.includes(currentUser?._id);
  const reposted = post.reposts?.includes(currentUser?._id);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showFullPost, setShowFullPost] = useState(false);
  const [shareUsers, setShareUsers] = useState([]);
  const [shareSearch, setShareSearch] = useState("");
  const [sentTo, setSentTo] = useState([]);
  const [shareNote, setShareNote] = useState("");
  const repostRef = useState(null);
  const categoryIconClass = categoryIcons[post.category] || "fi fi-sr-search";

  const handleToggleComments = async () => {
    if (useModalForComments) {
      setShowFullPost(true);
      if (comments.length === 0 && (!post.comments || post.comments.length > 0)) {
        setLoadingComments(true);
        try {
          const res = await axios.get(`${API}/posts/${post._id}/comments`);
          setComments(res.data);
        } catch { setComments([]); }
        setLoadingComments(false);
      }
    } else {
      if (!showComments && comments.length === 0) {
        setLoadingComments(true);
        try {
          const res = await axios.get(`${API}/posts/${post._id}/comments`);
          setComments(res.data);
        } catch { setComments([]); }
        setLoadingComments(false);
      }
      setShowComments((v) => !v);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/posts/${post._id}/comments`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/posts/${post._id}/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setComments(comments.filter(c => c._id !== commentId));
    } catch { /* silent */ }
  };

  const handleOpenShare = async () => {
    setShowShareModal(true);
    setShareSearch("");
    setSentTo([]);
    setShareNote("");
    try {
      const res = await axios.get(`${API}/profiles/creators`);
      setShareUsers(res.data);
    } catch { setShareUsers([]); }
  };

  const handleSendShare = async (recipientId) => {
    if (sentTo.includes(recipientId)) return;
    const token = localStorage.getItem("token");
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const text = shareNote.trim()
      ? shareNote.trim()
      : `Check out this post: ${postUrl}`;
    try {
      await axios.post(
        `${API}/messages`,
        { receiverId: recipientId, text, sharedPostId: post._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSentTo((prev) => [...prev, recipientId]);
    } catch { /* silent */ }
  };

  const filteredShareUsers = shareUsers.filter((p) => {
    const name = (p.displayName || p.user?.fullName || p.user?.username || "").toLowerCase();
    return name.includes(shareSearch.toLowerCase()) && p.user?._id !== currentUser?._id;
  });

  return (
    <div className="post-card">
      {/* Header — Always at the top */}
      <div className="post-header-simple">
        {/* Author info on left */}
        <div className="post-author post-author-top" onClick={() => navigate(`/profile/${post.author?._id}`)}>          
          <div className="author-avatar">
            {post.author?.photo ? (
              <img src={post.author.photo} alt={post.author.fullName} className="welcome-avatar-img" />
            ) : (
              post.author?.username?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <span className="author-name">{post.author?.fullName}</span>
            <span className={`role-badge ${post.author?.role}`}>{post.author?.role}</span>
          </div>
        </div>

        {/* Category/Date stack on right */}
        <div className="post-meta-stack">
          <span className="post-category">
            <i className={categoryIconClass} /> {post.category}
          </span>
          <span className="post-date">
            {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>

      {post.image && (
        <div className="post-image-wrap">
          <img src={post.image} alt={post.title} className="post-image" />
        </div>
      )}

      <div className="post-body">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-content">{post.content}</p>

        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}



        <div className="post-actions">
          {/* Like */}
          <button className={`post-action-btn like ${liked ? "active" : ""}`} onClick={() => onLike(post._id)} disabled={!currentUser} title="Like">
            <motion.i 
              className="fi fi-sr-heart"
              initial={false}
              animate={liked ? { scale: [1, 1.4, 1.2], filter: ["none", "drop-shadow(0 0 8px rgba(255, 0, 0, 0.4))", "none"] } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            />
            <span className="action-count" onClick={(e) => { e.stopPropagation(); onShowLikes(post._id, post.likes?.length || 0); }}>
              {post.likes?.length || 0}
            </span>
          </button>

          {/* Dislike */}
          <button className={`post-action-btn dislike ${disliked ? "active" : ""}`} onClick={() => onDislike(post._id)} disabled={!currentUser} title="Dislike">
            <i className="fi fi-sr-thumbs-down" />
            {post.dislikes?.length > 0 && <span className="action-count">{post.dislikes.length}</span>}
          </button>

          {/* Comment */}
          <button className={`post-action-btn comment ${showComments ? "active" : ""}`} onClick={handleToggleComments} title="Comment">
            <i className="fi fi-sr-comment" />
            {(post.comments?.length > 0 || comments.length > 0) && (
              <span className="action-count">{comments.length || post.comments?.length}</span>
            )}
          </button>

          {/* Repost — LinkedIn-style dropdown */}
          {!hideRepost && post.author?._id !== currentUser?._id && (
            <div className="post-action-wrap" ref={repostRef}>
              <button
                className={`post-action-btn repost ${reposted ? "active" : ""}`}
                onClick={() => currentUser && setShowRepostMenu((v) => !v)}
                disabled={!currentUser}
                title="Repost"
              >
                <i className="fi fi-sr-arrows-retweet" />
                {post.reposts?.length > 0 && <span className="action-count">{post.reposts.length}</span>}
              </button>
              {showRepostMenu && (
                <div className="post-repost-menu">
                  <button onClick={() => { onRepost(post._id); setShowRepostMenu(false); }}>
                    <i className="fi fi-sr-arrows-retweet" />
                    {reposted ? "Undo repost" : "Repost"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Share — LinkedIn-style dropdown */}
          <div className="post-action-wrap">
            <button className="post-action-btn share" onClick={() => currentUser && setShowShareMenu(v => !v)} disabled={!currentUser} title="Share">
              <i className="fi fi-sr-share" />
            </button>
            {showShareMenu && (
              <div className="post-repost-menu">
                <button onClick={(e) => { e.stopPropagation(); setShowShareMenu(false); handleOpenShare(); }}>
                  <i className="fi fi-sr-paper-plane-top" />
                  Send in a message
                </button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                  setShowShareMenu(false);
                  alert("Link copied to clipboard!");
                }}>
                  <i className="fi fi-sr-link" />
                  Copy link
                </button>
              </div>
            )}
          </div>
          {isOwn && onEdit && (
            <button className="post-action-btn edit" onClick={() => onEdit()} title="Edit">
              <i className="fi fi-sr-pencil" />
            </button>
          )}
          {isOwn && onDelete && (
            <button className="post-action-btn delete" onClick={() => onDelete()} title="Delete" style={{ color: "var(--home-accent)" }}>
              <i className="fi fi-sr-trash" />
            </button>
          )}

          <button className="post-action-btn view-full-btn" onClick={() => setShowFullPost(true)} title="View full post">
            <i className="fi fi-sr-expand" />
          </button>
        </div>

        {/* Comments panel */}
        {showComments && (
          <div className="comments-section">
            {loadingComments ? (
              <div className="comments-loading"><div className="spinner" /></div>
            ) : (
              <>
                <div className="comments-list">
                  {comments.length === 0 && <p className="no-comments">No comments yet. Be the first!</p>}
                  {comments.map((c, i) => (
                    <div key={c._id || i} className="comment-item">
                      <div className="comment-avatar">
                        {c.author?.photo ? (
                          <img src={c.author.photo} alt={c.author.fullName} className="welcome-avatar-img" style={{ borderRadius: "50%" }} />
                        ) : (
                          c.author?.username?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="comment-body">
                        <span className="comment-author">{c.author?.fullName || c.author?.username}</span>
                        <p className="comment-text">{c.text}</p>
                      </div>
                      {currentUser?._id === c.author?._id && (
                        <button className="comment-delete-btn" onClick={() => handleDeleteComment(c._id)} title="Delete comment">
                          <i className="fi fi-sr-trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {currentUser && (
                  <form className="comment-form" onSubmit={handleAddComment}>
                    <input className="comment-input" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} disabled={submitting} />
                    <button className="comment-submit" type="submit" disabled={submitting || !commentText.trim()}>
                      <i className="fi fi-sr-paper-plane" />
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Full post modal — rendered via portal outside card */}
      {showFullPost && createPortal(
        <div className="full-post-overlay" onClick={() => setShowFullPost(false)}>
          <div className={`full-post-modal ${useModalForComments && post.image ? "instagram-modal" : ""}`} onClick={(e) => e.stopPropagation()}>
            <button className="full-post-close" onClick={() => setShowFullPost(false)}>
              <i className="fi fi-sr-cross" />
            </button>
            {post.image && (
              <div className="full-post-image-wrap">
                <img src={post.image} alt={post.title} className="full-post-image" />
              </div>
            )}
            <div className="full-post-body">
              <div className="full-post-scrollable">
                <div className="full-post-meta">
                  <span className="post-category"><i className={categoryIconClass} /> {post.category}</span>
                  <span className="post-date">
                    <i className="fi fi-sr-calendar" />{" "}
                    {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <h2 className="full-post-title">{post.title}</h2>
                <div className="full-post-author" onClick={() => { setShowFullPost(false); navigate(`/profile/${post.author?._id}`); }}>
                  <div className="author-avatar">
                    {post.author?.photo ? (
                      <img src={post.author.photo} alt={post.author.fullName} className="welcome-avatar-img" />
                    ) : (
                      post.author?.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="author-name">{post.author?.fullName}</span>
                    <span className={`role-badge ${post.author?.role}`}>{post.author?.role}</span>
                  </div>
                </div>
                <p className="full-post-content">{post.content}</p>
                {post.tags?.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, i) => <span key={i} className="tag">#{tag}</span>)}
                  </div>
                )}

                {/* Optional Comments section within Instagram modal */}
                {useModalForComments && (
                  <div className="comments-section modal-comments">
                    {loadingComments ? (
                      <div className="comments-loading"><div className="spinner" /></div>
                    ) : (
                      <div className="comments-list">
                        {comments.length === 0 && <p className="no-comments">No comments yet. Be the first!</p>}
                        {comments.map((c, i) => (
                          <div key={c._id || i} className="comment-item">
                            <div className="comment-avatar">
                              {c.author?.photo ? (
                                <img src={c.author.photo} alt={c.author.fullName} className="welcome-avatar-img" style={{ borderRadius: "50%" }} />
                              ) : (
                                c.author?.username?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div className="comment-body">
                               <span className="comment-author">{c.author?.fullName || c.author?.username}</span>
                              <p className="comment-text">{c.text}</p>
                            </div>
                            {currentUser?._id === c.author?._id && (
                              <button className="comment-delete-btn" onClick={() => handleDeleteComment(c._id)} title="Delete comment">
                                <i className="fi fi-sr-trash" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input section fixed at bottom for Instagram modal */}
              {useModalForComments && currentUser && (
                <div className="modal-comment-input-wrap">
                  <form className="comment-form" onSubmit={handleAddComment}>
                    <input className="comment-input" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} disabled={submitting} />
                    <button className="comment-submit" type="submit" disabled={submitting || !commentText.trim()}>
                      <i className="fi fi-sr-paper-plane" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Share modal — rendered via portal outside card */}
      {showShareModal && createPortal(
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Send post</h3>
              <button className="close-modal-btn" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <div className="share-post-preview">
              <strong>{post.title}</strong>
              <span className="share-post-author">by {post.author?.fullName}</span>
            </div>
            <textarea
              className="share-note-input"
              placeholder="Add a note (optional)..."
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              rows={2}
            />
            <input
              className="share-search-input"
              placeholder="Search people..."
              value={shareSearch}
              onChange={(e) => setShareSearch(e.target.value)}
            />
            <div className="share-users-list">
              {filteredShareUsers.length === 0 && <p className="no-comments">No users found.</p>}
              {filteredShareUsers.map((p) => (
                <div key={p.user?._id} className="share-user-item">
                  <div className="share-user-avatar">{(p.displayName || p.user?.fullName || p.user?.username)?.[0]?.toUpperCase()}</div>
                  <div className="share-user-info">
                    <span className="share-user-name">{p.displayName || p.user?.fullName}</span>
                    <span className={`role-badge ${p.user?.role}`}>{p.user?.role}</span>
                  </div>
                  <button
                    className={`share-send-btn ${sentTo.includes(p.user?._id) ? "sent" : ""}`}
                    onClick={() => handleSendShare(p.user?._id)}
                    disabled={sentTo.includes(p.user?._id)}
                  >
                    {sentTo.includes(p.user?._id) ? <><i className="fi fi-sr-check" /> Sent</> : <><i className="fi fi-sr-paper-plane-top" /> Send</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  
  const {
    posts, page, hasMore, category, search: storeSearch, loading, loadingMore,
    setCategory, setSearch: setStoreSearch, fetchPosts, updatePostLikes, updatePostReposts, deletePost
  } = useFeedStore();

  const [search, setSearch] = useState(storeSearch || "");

  const [likesModalPostId, setLikesModalPostId] = useState(null);
  const [likers, setLikers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const searchDebounceRef = useRef(null);

  // Debounce search input: 400ms delay before hitting the API
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setStoreSearch(search);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search, setStoreSearch]);

  useEffect(() => {
    if (!user?._id) return;
    axios.get(`${API}/profiles/${user._id}`)
      .then((res) => {
        if (res.data?.photo) setProfilePhoto(res.data.photo);
      })
      .catch(() => { });
  }, [user?._id]);

  useEffect(() => {
    // Caching handles preventing unnecessary requests automatically
    fetchPosts(1, false, false);
  }, [storeSearch, category, fetchPosts]);

  const handleLoadMore = () => {
    fetchPosts(page + 1, true);
  };

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
    fetchPosts(1, false);
  }, [fetchPosts]);

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    const previousLikes = [...(post.likes || [])];
    const previousDislikes = [...(post.dislikes || [])];

    const isLiked = previousLikes.includes(user._id);
    const updatedLikes = isLiked
      ? previousLikes.filter((id) => id !== user._id)
      : [...previousLikes, user._id];

    const updatedDislikes = !isLiked && previousDislikes.includes(user._id)
      ? previousDislikes.filter((id) => id !== user._id)
      : previousDislikes;

    updatePostLikes(postId, updatedLikes, updatedDislikes);

    try {
      await axios.put(
        `${API}/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      updatePostLikes(postId, previousLikes, previousDislikes);
    }
  };

  const handleDislike = async (postId) => {
    const token = localStorage.getItem("token");
    const post = posts.find(p => p._id === postId);
    if (!post) return;

    const previousLikes = [...(post.likes || [])];
    const previousDislikes = [...(post.dislikes || [])];

    const isDisliked = previousDislikes.includes(user._id);
    const updatedDislikes = isDisliked
      ? previousDislikes.filter((id) => id !== user._id)
      : [...previousDislikes, user._id];

    const updatedLikes = !isDisliked && previousLikes.includes(user._id)
      ? previousLikes.filter((id) => id !== user._id)
      : previousLikes;

    updatePostLikes(postId, updatedLikes, updatedDislikes);

    try {
      await axios.put(`${API}/posts/${postId}/dislike`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { 
      updatePostLikes(postId, previousLikes, previousDislikes);
    }
  };

  const handleRepost = async (postId) => {
    const token = localStorage.getItem("token");
    const post = posts.find((p) => p._id === postId);
    if (!post) return;

    const previousReposts = [...(post.reposts || [])];
    const isReposted = previousReposts.includes(user._id);
    const updatedReposts = isReposted
      ? previousReposts.filter((id) => id !== user._id)
      : [...previousReposts, user._id];

    updatePostReposts(postId, updatedReposts);

    try {
      await axios.put(`${API}/posts/${postId}/repost`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { 
      updatePostReposts(postId, previousReposts); 
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
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="welcome-avatar-img" />
                ) : (
                  user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()
                )}
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
            <div className="posts-grid">
              {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
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
                  onDislike={handleDislike}
                  onRepost={handleRepost}
                  onShowLikes={handleLikesClick}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
              <button
                className="g-primary-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{ minWidth: 140, fontSize: "13px", padding: "9px 20px" }}
              >
                {loadingMore ? (
                  <><span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />Loading...</>
                ) : (
                  <><i className="fi fi-sr-angle-down" style={{ marginRight: 6 }} />Load more</>
                )}
              </button>
            </div>
          )}

        </div>

        {/* ─── RIGHT SIDEBAR ────────────────────────────────── */}
        <aside className="home-right-sidebar">
          <div className="info-card">
            <h3>About KalaSetu</h3>
            <p>Empowering traditional artisans by bridging the gap between centuries-old craftsmanship and modern digital platforms.</p>
          </div>

          <div className="info-card">
            <h3>Why Join Us?</h3>
            <ul>
              <li><i className="fi fi-sr-globe" /> Connect globally</li>
              <li><i className="fi fi-sr-shop" /> Sell authentically</li>
              <li><i className="fi fi-sr-hands-heart" /> Support NGOs</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Platform Stats</h3>
            <ul>
              <li><i className="fi fi-sr-users" /> 1K+ Artisans</li>
              <li><i className="fi fi-sr-calendar-star" /> 500+ Events</li>
              <li><i className="fi fi-sr-heart" /> 100% Non-profit</li>
            </ul>
          </div>
        </aside>
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
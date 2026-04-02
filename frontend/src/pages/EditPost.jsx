import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./CreatePost.css";
import Navbar from "../components/common/Navbar";

const API = "http://localhost:5000";

const categoryOptions = [
  { value: "story", label: "Story" },
  { value: "event", label: "Event" },
  { value: "artwork", label: "Artwork" },
  { value: "workshop", label: "Workshop" },
  { value: "announcement", label: "Announcement" },
];

function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "story",
    tags: "",
    image: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API}/posts/${postId}`);
        const post = res.data;
        if (post.author?._id !== user._id) {
          navigate("/home");
          return;
        }
        setForm({
          title: post.title || "",
          content: post.content || "",
          category: post.category || "story",
          tags: (post.tags || []).join(", "),
          image: post.image || "",
        });
      } catch {
        navigate("/home");
      }
      setFetching(false);
    };

    fetchPost();
  }, [navigate, postId, user._id]);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const tags = form.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      await axios.put(
        `${API}/posts/${postId}`,
        { ...form, tags },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update post.");
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="cp-bg">
        <Navbar />
        <div className="cp-loading">Loading post...</div>
      </div>
    );
  }

  return (
    <div className="cp-bg">
      <Navbar />

      <div className="cp-shell">
        <aside className="cp-intro">
          <span className="cp-kicker">Refine your story</span>
          <h2 className="display-serif">Update the post so the message is sharper and easier to discover.</h2>
          <p>
            Small edits to the title, tags, or opening lines can make your post clearer and more
            compelling for people browsing KalaSetu.
          </p>

          <div className="cp-intro-list">
            <div className="cp-intro-item">
              <span><i className="fi fi-sr-calendar" /></span>
              <div>
                <strong>Keep details current</strong>
                <small>Refresh any dates, event information, or collaboration requests when needed.</small>
              </div>
            </div>
            <div className="cp-intro-item">
              <span><i className="fi fi-sr-search" /></span>
              <div>
                <strong>Improve discoverability</strong>
                <small>Adjust category and tags so your post reaches the right people faster.</small>
              </div>
            </div>
            <div className="cp-intro-item">
              <span><i className="fi fi-sr-image" /></span>
              <div>
                <strong>Refresh the visual</strong>
                <small>Swap in a stronger image to improve presentation inside the feed.</small>
              </div>
            </div>
          </div>
        </aside>

        <div className="cp-card">
          <h2>Edit Post</h2>
          <p className="cp-subtitle">Update your cultural post</p>

          {error && <div className="cp-error">{error}</div>}

          <form onSubmit={handleSubmit} className="cp-form">
            <div className="cp-field">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Post title"
              />
            </div>

            <div className="cp-field">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label>Content *</label>
              <textarea name="content" value={form.content} onChange={handleChange} rows={8} />
            </div>

            <div className="cp-field">
              <label>
                Tags <span className="cp-hint">(comma-separated)</span>
              </label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="e.g. handloom, folk art"
              />
            </div>

            <div className="cp-field">
              <label>
                Image URL <span className="cp-hint">(optional)</span>
              </label>
              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            {form.image && (
              <div className="cp-preview">
                <img src={form.image} alt="Preview" onError={(event) => { event.target.style.display = "none"; }} />
              </div>
            )}

            <button type="submit" className="cp-submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditPost;

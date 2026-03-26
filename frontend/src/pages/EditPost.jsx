import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./CreatePost.css";

const API = "http://localhost:5000";

function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({ title: "", content: "", category: "story", tags: "", image: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API}/posts/${postId}`);
        const p = res.data;
        // Verify ownership
        if (p.author?._id !== user._id) {
          navigate("/home");
          return;
        }
        setForm({
          title: p.title || "",
          content: p.content || "",
          category: p.category || "story",
          tags: (p.tags || []).join(", "),
          image: p.image || "",
        });
      } catch {
        navigate("/home");
      }
      setFetching(false);
    };
    fetchPost();
  }, [postId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.content.trim()) return setError("Title and content are required.");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await axios.put(`${API}/posts/${postId}`, { ...form, tags }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update post.");
    }
    setLoading(false);
  };

  if (fetching) return (
    <div className="cp-bg">
      <nav className="cp-navbar"><h1>KalaSetu</h1></nav>
      <div style={{ textAlign: "center", padding: "80px", color: "#aaa" }}>Loading post...</div>
    </div>
  );

  return (
    <div className="cp-bg">
      <nav className="cp-navbar">
        <h1 onClick={() => navigate("/home")}>KalaSetu</h1>
        <button onClick={() => navigate(-1)}>← Back</button>
      </nav>

      <div className="cp-container">
        <div className="cp-card">
          <h2>✏️ Edit Post</h2>
          <p className="cp-subtitle">Update your cultural post</p>

          {error && <div className="cp-error">{error}</div>}

          <form onSubmit={handleSubmit} className="cp-form">
            <div className="cp-field">
              <label>Title *</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Post title" />
            </div>
            <div className="cp-field">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="story">📖 Story</option>
                <option value="event">🎪 Event</option>
                <option value="artwork">🎨 Artwork</option>
                <option value="workshop">🛠️ Workshop</option>
                <option value="announcement">📢 Announcement</option>
              </select>
            </div>
            <div className="cp-field">
              <label>Content *</label>
              <textarea name="content" value={form.content} onChange={handleChange} rows={7} />
            </div>
            <div className="cp-field">
              <label>Tags <span className="cp-hint">(comma-separated)</span></label>
              <input type="text" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. handloom, folk art" />
            </div>
            <div className="cp-field">
              <label>Image URL <span className="cp-hint">(optional)</span></label>
              <input type="url" name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
            </div>
            {form.image && (
              <div className="cp-preview">
                <img src={form.image} alt="Preview" onError={(e) => e.target.style.display = "none"} />
              </div>
            )}
            <button type="submit" className="cp-submit" disabled={loading}>
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditPost;
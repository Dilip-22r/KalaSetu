import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreatePost.css";

const API = "http://localhost:5000";

function CreatePost() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({ title: "", content: "", category: "story", tags: "", image: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user.role === "user") {
    return (
      <div className="cp-bg">
        <div className="cp-locked">
          <span>🔒</span>
          <h2>Access Restricted</h2>
          <p>Only registered Artisans and NGOs can create posts.</p>
          <button onClick={() => navigate("/register")}>Register Now</button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.content.trim()) {
      return setError("Title and content are required.");
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // read fresh at submit time
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("Submitting post with role:", currentUser.role);
      console.log("Token first 30 chars:", token?.slice(0, 30));
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await axios.post(`${API}/posts`, { ...form, tags }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post.");
    }
    setLoading(false);
  };

  return (
    <div className="cp-bg">
      <nav className="cp-navbar">
        <h1 onClick={() => navigate("/home")}>KalaSetu</h1>
        <button onClick={() => navigate("/home")}>← Back</button>
      </nav>

      <div className="cp-container">
        <div className="cp-card">
          <h2>✏️ Create a Cultural Post</h2>
          <p className="cp-subtitle">Share your art, events, or stories with the community</p>

          {error && <div className="cp-error">{error}</div>}

          <form onSubmit={handleSubmit} className="cp-form">
            <div className="cp-field">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Give your post a compelling title"
              />
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
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Tell your story, describe your artwork, or share event details..."
                rows={7}
              />
            </div>

            <div className="cp-field">
              <label>Tags <span className="cp-hint">(comma-separated)</span></label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="e.g. handloom, folk art, Rajasthan"
              />
            </div>

            <div className="cp-field">
              <label>Image URL <span className="cp-hint">(optional)</span></label>
              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {form.image && (
              <div className="cp-preview">
                <img src={form.image} alt="Preview" onError={(e) => e.target.style.display="none"} />
              </div>
            )}

            <button type="submit" className="cp-submit" disabled={loading}>
              {loading ? "Publishing..." : "🚀 Publish Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
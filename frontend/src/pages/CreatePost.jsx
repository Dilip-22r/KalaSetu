import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

function CreatePost() {
  const navigate = useNavigate();
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

  if (user.role === "user") {
    return (
      <div className="cp-bg">
        <Navbar />
        <div className="cp-locked">
          <span><i className="fi fi-sr-comments" /></span>
          <h2 className="display-serif">Access Restricted</h2>
          <p>Only registered Artisans and NGOs can create posts.</p>
          <button onClick={() => navigate("/register")}>Register Now</button>
        </div>
      </div>
    );
  }

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
      await axios.post(
        `${API}/posts`,
        { ...form, tags },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post.");
    }
    setLoading(false);
  };

  return (
    <div className="cp-bg">
      <Navbar />

      <div className="cp-shell">
        <div className="cp-card">
          <h2>Create a Cultural Post</h2>
          <p className="cp-subtitle">Share your art, events, and stories with the community</p>

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
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label>Content *</label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Tell your story, describe your artwork, or share event details."
                rows={8}
              />
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
                placeholder="e.g. handloom, folk art, Rajasthan"
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
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {form.image && (
              <div className="cp-preview">
                <img src={form.image} alt="Preview" onError={(event) => { event.target.style.display = "none"; }} />
              </div>
            )}

            <button type="submit" className="cp-submit" disabled={loading}>
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;

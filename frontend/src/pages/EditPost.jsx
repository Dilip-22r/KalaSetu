import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./CreatePost.css";
import Navbar from "../components/common/Navbar";

import API from "../utils/api";

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

  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError("");
    setStep(2);
  };

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
        <div className="cp-card">
          <h2>Edit Post</h2>
          <p className="cp-subtitle">Update your cultural post</p>
          {error && <div className="cp-error">{error}</div>}

          {step === 1 && (
            <div className="cp-form">
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
              <div className="cp-row">
                <div className="cp-field">
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="cp-field">
                  <label>Tags <span className="cp-hint">(comma-separated)</span></label>
                  <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="e.g. handloom, folk art"
                  />
                </div>
              </div>
              <button type="button" className="cp-submit" onClick={handleNext}>
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="cp-form">
              <div className="cp-field">
                <label>Content *</label>
                <textarea name="content" value={form.content} onChange={handleChange} rows={7} />
              </div>
              <div className="cp-field">
                <label>Image <span className="cp-hint">(optional)</span></label>
                <div className="cp-image-upload">
                  {form.image && (
                    <div className="cp-preview">
                      <img src={form.image} alt="Preview" />
                      <button type="button" className="cp-remove-img" onClick={() => setForm({ ...form, image: "" })}>✕ Remove</button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id="editPostImageUpload"
                    className="cp-file-input"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      e.target.value = null;
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result }));
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label htmlFor="editPostImageUpload" className="cp-upload-label">
                    <i className="fi fi-sr-picture" /> Browse from device
                  </label>
                </div>
              </div>
              <div className="cp-form-actions">
                <button type="button" className="cp-back" onClick={() => { setError(""); setStep(1); }}>
                  ← Back
                </button>
                <button type="submit" className="cp-submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditPost;

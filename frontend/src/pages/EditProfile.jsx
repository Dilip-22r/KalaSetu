import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import getCroppedImg from "../utils/cropImage";
import { useAuthStore } from "../store/useAuthStore";
import "./EditProfile.css";

const API = "http://localhost:5000";

function EditProfile() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  // Form state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Photo state
  const [previewPhoto, setPreviewPhoto] = useState("");

  // Cropper state
  const [rawImage, setRawImage] = useState(null);       // The full image file loaded into browser
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPx, setCroppedPx] = useState(null);    // Pixel-accurate crop area from react-easy-crop

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  // ─── Fetch existing profile on load ───────────────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role === "user") {
      navigate("/register");
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${API}/profiles/${currentUser._id}`);
        const p = res.data;
        setValue("name", p.displayName || currentUser.fullName || "");
        setValue("age", p.age || "");
        setValue("gender", p.gender || "");
        setValue("skills", p.skills || "");
        setValue("location", p.location || "");
        setValue("about", p.about || "");
        setValue("userType", p.userType || (currentUser.role === "artisan" ? "Artisan" : "NGO"));
        if (p.photo) setPreviewPhoto(p.photo);
      } catch {
        // No profile yet — defaults are fine
      }
      setFetching(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── File selection → open cropper ────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = null; // allow re-picking same file
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // Reset all crop state before opening modal
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPx(null);
      setRawImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Called by react-easy-crop every time user drags/zooms
  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedPx(croppedAreaPixels);
  }, []);

  // ─── Apply crop button ─────────────────────────────────────────────────────
  const applyCrop = async () => {
    if (!rawImage) return;

    // If user never moved the circle, croppedPx may still be null on first render.
    // We use a centered square fallback in that case.
    let area = croppedPx;
    if (!area) {
      const img = await new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.src = rawImage;
      });
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      area = {
        x: Math.round((img.naturalWidth - side) / 2),
        y: Math.round((img.naturalHeight - side) / 2),
        width: side,
        height: side,
      };
    }

    try {
      const b64 = await getCroppedImg(rawImage, area);
      setPreviewPhoto(b64);
      setRawImage(null);   // close modal
      setError("");
    } catch (err) {
      setError("Crop failed — please try again.");
      console.error(err);
    }
  };

  // ─── Remove photo (immediate API call) ────────────────────────────────────
  const handleRemovePhoto = async () => {
    try {
      await axios.post(`${API}/profiles`, { photo: "" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreviewPhoto("");
      setSuccess("Profile photo removed.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to remove photo.");
    }
  };

  // ─── Save full profile form ────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      await axios.post(
        `${API}/profiles`,
        {
          displayName: data.name,
          age: data.age,
          gender: data.gender,
          skills: data.skills,
          location: data.location,
          about: data.about,
          photo: previewPhoto,
          userType: data.userType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/profile/${currentUser._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong saving the profile.");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    useAuthStore.getState().setAuthUser(null);
    navigate("/");
  };

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="theme-bg">
        <div className="ep-loading">Loading profile...</div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="theme-bg">

      {/* Navbar */}
      <nav className="navbar">
        <h1 className="brand-title" onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
          KalaSetu
        </h1>
        <div className="nav-buttons">
          <button onClick={() => navigate(`/profile/${currentUser._id}`)}>← Back</button>
          <button onClick={() => setShowLogoutModal(true)}>Logout</button>
        </div>
      </nav>

      {/* Form card */}
      <div className="ep-container">
        <div className="ep-card">
          <h2 className="theme-title">Edit Your Profile</h2>
          <p className="subtitle">Update your cultural journey or upload a fresh photo</p>

          {error   && <div className="ep-error">{error}</div>}
          {success && <div className="ep-success">{success}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="ep-form">

            {/* ── Photo Upload ── */}
            <div className="ep-photo-upload">
              <label>Profile Picture</label>
              <div className="ep-photo-preview-wrap">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="avatar" className="ep-photo-preview" />
                ) : (
                  <div className="ep-photo-placeholder">
                    {currentUser.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="ep-upload-actions">
                  <input
                    type="file"
                    accept="image/*"
                    id="profileUpload"
                    className="ep-file-input"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="profileUpload" className="ep-upload-btn">
                    📷 Browse from device
                  </label>
                  {previewPhoto && (
                    <button type="button" className="ep-remove-photo-btn" onClick={handleRemovePhoto}>
                      🗑️ Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Name + Age ── */}
            <div className="ep-row">
              <div className="ep-field">
                <label>Display Name *</label>
                <input type="text" {...register("name", { required: "Name is required" })} />
                {errors.name && <small>{errors.name.message}</small>}
              </div>
              <div className="ep-field">
                <label>Age *</label>
                <input type="number" {...register("age", { required: "Age is required", min: { value: 12, message: "Must be at least 12" } })} />
                {errors.age && <small>{errors.age.message}</small>}
              </div>
            </div>

            {/* ── Gender + Type ── */}
            <div className="ep-row">
              <div className="ep-field">
                <label>Gender *</label>
                <select {...register("gender", { required: "Gender is required" })}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
                {errors.gender && <small>{errors.gender.message}</small>}
              </div>
              <div className="ep-field">
                <label>User Type *</label>
                <select {...register("userType", { required: "Please select a type" })}>
                  <option value="">Select type</option>
                  <option>Artisan</option>
                  <option>NGO</option>
                </select>
                {errors.userType && <small>{errors.userType.message}</small>}
              </div>
            </div>

            {/* ── Skills ── */}
            <div className="ep-field">
              <label>Skills / Art Form *</label>
              <input type="text" {...register("skills", { required: "Skills are required" })} />
              {errors.skills && <small>{errors.skills.message}</small>}
            </div>

            {/* ── Location ── */}
            <div className="ep-field">
              <label>Location *</label>
              <input type="text" {...register("location", { required: "Location is required" })} />
              {errors.location && <small>{errors.location.message}</small>}
            </div>

            {/* ── About ── */}
            <div className="ep-field">
              <label>About You *</label>
              <textarea rows={4} {...register("about", { required: "Please write about yourself" })} />
              {errors.about && <small>{errors.about.message}</small>}
            </div>

            <button type="submit" className="ep-submit" disabled={loading}>
              {loading ? "Saving..." : "💾 Save Profile"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Crop Modal ── */}
      {rawImage && (
        <div className="ep-cropper-overlay">
          <div className="ep-cropper-modal">
            <h3>Crop Profile Picture</h3>
            <div className="ep-cropper-container">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="ep-cropper-controls">
              <span>🔍 Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>
            <div className="ep-cropper-actions">
              <button type="button" className="ep-cropper-cancel" onClick={() => setRawImage(null)}>
                Cancel
              </button>
              <button type="button" className="ep-cropper-save" onClick={applyCrop}>
                ✅ Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Modal ── */}
      {showLogoutModal && (
        <div className="ep-logout-overlay">
          <div className="ep-logout-modal">
            <h3>Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="ep-logout-actions">
              <button className="ep-logout-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="ep-logout-confirm" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EditProfile;

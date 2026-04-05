import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import getCroppedImg from "../utils/cropImage";
import "./EditProfile.css";
import Navbar from "../components/common/Navbar";

const API = "http://localhost:5000";

function EditProfile() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState("");
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPx, setCroppedPx] = useState(null);

  // Settings state moved to SettingsModal

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  // Derive role from registration — not editable
  const selectedRole = currentUser.role === "ngo" ? "NGO" : "Artisan";

  useEffect(() => {
    if (!currentUser || currentUser.role === "user") {
      navigate("/register");
      return;
    }

    (async () => {
      try {
        const res = await axios.get(`${API}/profiles/${currentUser._id}`);
        const profile = res.data;
        setValue("name", profile.displayName || currentUser.fullName || "");
        setValue("age", profile.age || "");
        setValue("gender", profile.gender || "");
        setValue("skills", profile.skills || "");
        setValue("location", profile.location || "");
        setValue("about", profile.about || "");
        setValue("organizationName", profile.organizationName || "");
        setValue("organizationId", profile.organizationId || "");
        setValue("verificationDocument", profile.verificationDocument || "");
        setValue("isPrivate", profile.isPrivate ? "true" : "false");
        if (profile.photo) setPreviewPhoto(profile.photo);
      } catch {
        // No profile yet, fall back to defaults.
      }
      setFetching(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    event.target.value = null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPx(null);
      setRawImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedPx(croppedAreaPixels);
  }, []);

  const applyCrop = async () => {
    if (!rawImage) return;

    let area = croppedPx;
    if (!area) {
      const img = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = rawImage;
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
      const base64 = await getCroppedImg(rawImage, area);
      setPreviewPhoto(base64);
      setRawImage(null);
      setError("");
    } catch (err) {
      setError("Crop failed. Please try again.");
      console.error(err);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await axios.post(
        `${API}/profiles`,
        { photo: "" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPreviewPhoto("");
      setSuccess("Profile photo removed.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to remove photo.");
    }
  };

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
          organizationName: data.organizationName,
          organizationId: data.organizationId,
          verificationDocument: data.verificationDocument,
          isPrivate: data.isPrivate === "true" || data.isPrivate === true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/profile/${currentUser._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong saving the profile.");
    }

    setLoading(false);
  };

  // Delete account function moved to SettingsModal
  if (fetching) {
    return (
      <div className="theme-bg">
        <Navbar />
        <div className="ep-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="theme-bg">
      <Navbar />

      <div className="ep-shell">
        <div className="ep-card">
          <h2 className="theme-title">Edit Your Profile</h2>
          <p className="subtitle">Update your cultural journey or upload a fresh photo</p>

          {error && <div className="ep-error">{error}</div>}
          {success && <div className="ep-success">{success}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="ep-form">
            <div className="ep-photo-upload">
              <label>Profile Picture</label>
              <div className="ep-photo-preview-wrap">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="Profile" className="ep-photo-preview" />
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
                    Browse from device
                  </label>
                  {previewPhoto && (
                    <button type="button" className="ep-remove-photo-btn" onClick={handleRemovePhoto}>
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {selectedRole === "NGO" ? (
              <>
                <div className="ep-row">
                  <div className="ep-field">
                    <label>Organization Name *</label>
                    <input type="text" {...register("organizationName", { required: "Name is required" })} />
                    {errors.organizationName && <small>{errors.organizationName.message}</small>}
                  </div>
                  <div className="ep-field">
                    <label>Organization ID *</label>
                    <input type="text" {...register("organizationId", { required: "ID is required" })} />
                    {errors.organizationId && <small>{errors.organizationId.message}</small>}
                  </div>
                </div>

                <div className="ep-field">
                  <label>Verification Document (PDF) *</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    id="ngoDocUploadEp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setValue("verificationDocument", reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <label htmlFor="ngoDocUploadEp" className="ep-upload-btn" style={{ padding: "8px 12px", fontSize: "13px" }}>
                      Browse Files
                    </label>
                    {watch("verificationDocument") && <span style={{fontSize: "13px", color: "var(--brand-700)", fontWeight: "600"}}>Document attached</span>}
                  </div>
                  <input type="hidden" {...register("verificationDocument", { required: "Document is required" })} />
                  {errors.verificationDocument && <small>{errors.verificationDocument.message}</small>}
                </div>
              </>
            ) : (
              <>
                <div className="ep-row">
                  <div className="ep-field">
                    <label>Display Name *</label>
                    <input type="text" {...register("name", { required: "Name is required" })} />
                    {errors.name && <small>{errors.name.message}</small>}
                  </div>
                  <div className="ep-field">
                    <label>Age *</label>
                    <input
                      type="number"
                      {...register("age", {
                        required: "Age is required",
                        min: { value: 12, message: "Must be at least 12" },
                      })}
                    />
                    {errors.age && <small>{errors.age.message}</small>}
                  </div>
                </div>

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
                    <label>Skills / Art Form *</label>
                    <input type="text" {...register("skills", { required: "Skills are required" })} />
                    {errors.skills && <small>{errors.skills.message}</small>}
                  </div>
                </div>
              </>
            )}

            <div className="ep-row">
              <div className="ep-field">
                <label>Role</label>
                <input
                  type="text"
                  value={currentUser.role === "artisan" ? "Artisan" : currentUser.role === "ngo" ? "NGO" : "User"}
                  readOnly
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed", background: "#f5f5f5" }}
                  title="Role cannot be changed after registration"
                />
              </div>

              <div className="ep-field">
                <label>Location *</label>
                <input type="text" {...register("location", { required: "Location is required" })} />
                {errors.location && <small>{errors.location.message}</small>}
              </div>
            </div>

            <div className="ep-field">
              <label>About You / Organization *</label>
              <textarea rows={4} {...register("about", { required: "Please write about yourself" })} />
              {errors.about && <small>{errors.about.message}</small>}
            </div>

            <div className="ep-field">
              <label>Profile Privacy</label>
              <select {...register("isPrivate")} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" }}>
                <option value="false">Public — visible to everyone</option>
                <option value="true">Private — only visible to followers</option>
              </select>
            </div>

            <button type="submit" className="ep-submit" disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Settings have been moved to Navbar Settings dropdown */}
      </div>

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
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </div>
            <div className="ep-cropper-actions">
              <button type="button" className="ep-cropper-cancel" onClick={() => setRawImage(null)}>
                Cancel
              </button>
              <button type="button" className="ep-cropper-save" onClick={applyCrop}>
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal moved to SettingsModal */}
    </div>
  );
}

export default EditProfile;

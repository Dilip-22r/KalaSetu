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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

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
        setValue("userType", profile.userType || (currentUser.role === "artisan" ? "Artisan" : "NGO"));
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
        <aside className="ep-intro">
          <span className="ep-kicker">Shape your identity</span>
          <h2 className="display-serif">Edit the profile people see before they decide to connect with you.</h2>
          <p>
            A strong profile helps collaborators understand what you do, where you are based, and
            why your cultural work matters.
          </p>

          <div className="ep-intro-list">
            <div className="ep-intro-item">
              <span><i className="fi fi-sr-circle-user" /></span>
              <div>
                <strong>Use a clear display name</strong>
                <small>Keep your profile immediately recognisable to artisans, NGOs, and organisers.</small>
              </div>
            </div>
            <div className="ep-intro-item">
              <span><i className="fi fi-sr-palette" /></span>
              <div>
                <strong>Highlight your craft</strong>
                <small>List art forms, focus areas, and skills in language people can search for.</small>
              </div>
            </div>
            <div className="ep-intro-item">
              <span><i className="fi fi-sr-comments" /></span>
              <div>
                <strong>Make collaboration easier</strong>
                <small>Write a short story that helps the right people know how to reach out.</small>
              </div>
            </div>
          </div>
        </aside>

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
                <label>User Type *</label>
                <select {...register("userType", { required: "Please select a type" })}>
                  <option value="">Select type</option>
                  <option>Artisan</option>
                  <option>NGO</option>
                </select>
                {errors.userType && <small>{errors.userType.message}</small>}
              </div>
            </div>

            <div className="ep-field">
              <label>Skills / Art Form *</label>
              <input type="text" {...register("skills", { required: "Skills are required" })} />
              {errors.skills && <small>{errors.skills.message}</small>}
            </div>

            <div className="ep-field">
              <label>Location *</label>
              <input type="text" {...register("location", { required: "Location is required" })} />
              {errors.location && <small>{errors.location.message}</small>}
            </div>

            <div className="ep-field">
              <label>About You *</label>
              <textarea rows={4} {...register("about", { required: "Please write about yourself" })} />
              {errors.about && <small>{errors.about.message}</small>}
            </div>

            <button type="submit" className="ep-submit" disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
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
    </div>
  );
}

export default EditProfile;

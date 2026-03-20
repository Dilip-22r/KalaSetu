import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import getCroppedImg from "../utils/cropImage";
import { useAuthStore } from "../store/useAuthStore";
import "./EditProfile.css";

const API = "http://localhost:5000";

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Cropper states
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!currentUser || currentUser.role === "user") {
      navigate("/register");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/profiles/${currentUser._id}`);
        const profile = res.data;
        // Auto-fill React-Hook-Form fields from MongoDB
        setValue("name", profile.displayName || currentUser.fullName);
        setValue("age", profile.age);
        setValue("gender", profile.gender);
        setValue("skills", profile.skills);
        setValue("location", profile.location);
        setValue("about", profile.about);
        setValue("userType", profile.userType || (currentUser.role === "artisan" ? "Artisan" : "NGO"));
        if (profile.photo) setPreviewPhoto(profile.photo);
      } catch (err) {
        console.log("No profile found");
      }
      setFetching(false);
    };
    fetchProfile();
  }, [currentUser, navigate, setValue]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result); // Launch crop modal with raw image securely
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null; // Reset cache so they can re-click the same photo if abandoned
  };

  const showCroppedImage = async () => {
    try {
      if (!imageToCrop || !croppedAreaPixels) {
        alert("Please adjust the crop area first.");
        return;
      }
      const croppedImageBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedImageBase64) {
        alert("Failed to parse cropped image geometry.");
        return;
      }
      setPreviewPhoto(croppedImageBase64); // Apply the mathematically resized avatar
      setImageToCrop(null); // Clean up cropper gracefully
    } catch (e) {
      alert("Crop engine crashed: " + (e.message || JSON.stringify(e)));
      console.error(e);
    }
  };

  const onFormSubmit = async (data) => {
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
          photo: previewPhoto, // The compressed native base64 string
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

  if (fetching) {
    return <div className="theme-bg"><div className="ep-loading">Loading Profile...</div></div>;
  }

  return (
    <div className="theme-bg">
      <nav className="navbar">
        <h1 className="brand-title" onClick={() => navigate("/home")} style={{cursor:"pointer"}}>KalaSetu</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate(`/profile/${currentUser._id}`)}>Back</button>
          <button onClick={() => setShowLogoutModal(true)}>Logout</button>
        </div>
      </nav>

      <div className="ep-container">
        <div className="ep-card">
          <h2 className="theme-title">Edit Your Profile</h2>
          <p className="subtitle">Update your cultural journey or upload a fresh new photo</p>

          {error && <div className="ep-error">{error}</div>}

          <form onSubmit={handleSubmit(onFormSubmit)} className="ep-form">
            
            {/* Base64 Picture Upload Area */}
            <div className="ep-photo-upload">
              <label>Profile Picture</label>
              <div className="ep-photo-preview-wrap">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="Preview" className="ep-photo-preview" />
                ) : (
                  <div className="ep-photo-placeholder">{currentUser.username?.[0]?.toUpperCase()}</div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  id="profileUpload" 
                  className="ep-file-input" 
                  onChange={handleImageChange} 
                />
                <label htmlFor="profileUpload" className="ep-upload-btn">
                  Browse from device
                </label>
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
                <input type="number" {...register("age", { required: "Age is required", min: { value: 12, message: "Must be at least 12" } })} />
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
              {loading ? "Saving Changes..." : "💾 Save Profile"}
            </button>
          </form>
        </div>
      </div>

      {/* Logout Modal Overlay */}
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

      {/* Profile Photo Cropping Overlay */}
      {imageToCrop && (
        <div className="ep-cropper-overlay">
          <div className="ep-cropper-modal">
            <h3>Crop Profile Picture</h3>
            <div className="ep-cropper-container">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={(_, croppedAreaPx) => setCroppedAreaPixels(croppedAreaPx)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="ep-cropper-controls">
              <label>Zoom</label>
              <input 
                type="range" 
                value={zoom} 
                min={1} 
                max={3} 
                step={0.1} 
                onChange={(e) => setZoom(e.target.value)} 
              />
            </div>
            <div className="ep-cropper-actions">
              <button type="button" className="ep-cropper-cancel" onClick={() => setImageToCrop(null)}>Cancel</button>
              <button type="button" className="ep-cropper-save" onClick={showCroppedImage}>Apply Crop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProfile;

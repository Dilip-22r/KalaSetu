import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import getCroppedImg from "../utils/cropImage";
import Navbar from "../components/common/Navbar";
import API from "../utils/api";
import "./Settings.css";

// ── Sub-Components for Tabs ──────────────────────────────────────────────────

function ProfileTab({ profile, currentUser, token, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(profile?.photo || "");
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPx, setCroppedPx] = useState(null);

  const skillOptions = [
    "Handloom Weaving", "Pottery", "Wood Carving", "Bharatanatyam",
    "Madhubani Painting", "Classical Music", "Storytelling", "Folk Dance", "Other"
  ];
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: profile?.displayName || currentUser?.fullName || "",
      age: profile?.age || "",
      gender: profile?.gender || "",
      skills: profile?.skills ? profile.skills.split(", ").filter(s => skillOptions.includes(s) || s === "Other") : [],
      otherSkill: profile?.skills ? profile.skills.split(", ").find(s => !skillOptions.includes(s)) : "",
      location: profile?.location || "",
      about: profile?.about || "",
      organizationName: profile?.organizationName || "",
      organizationId: profile?.organizationId || "",
      verificationDocument: profile?.verificationDocument || "",
    }
  });

  const selectedRole = currentUser?.role === "ngo" ? "NGO" : "Artisan";
  const isRegularUser = currentUser?.role === "user";
  const selectedSkills = watch("skills") || [];

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setValue("skills", selectedSkills.filter(s => s !== skill), { shouldValidate: true });
    } else {
      setValue("skills", [...selectedSkills, skill], { shouldValidate: true });
    }
  };

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedPx(croppedAreaPixels);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRawImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
      setSaveStatus("");
    } catch (err) {
      setError("Crop failed. Please try again.");
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      let finalSkills = Array.isArray(data.skills) ? [...data.skills] : [];
      if (finalSkills.includes("Other")) {
        finalSkills = finalSkills.filter(s => s !== "Other");
        if (data.otherSkill) finalSkills.push(data.otherSkill);
      }
      
      const res = await axios.post(`${API}/profiles`, {
        ...data,
        age: Number(data.age),
        skills: finalSkills.join(", "),
        displayName: selectedRole === "NGO" ? data.organizationName : data.name,
        photo: previewPhoto,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess("Profile updated successfully!");
      setSaveStatus("Saved!");
      onUpdate(res.data);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
      setSaveStatus("");
    }
    setLoading(false);
  };

  useEffect(() => {
    const subscription = watch(() => {
      setSaveStatus("");
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  if (isRegularUser) {
    return (
      <div className="settings-tab-content">
        <h3 className="settings-tab-title">Profile Information</h3>
        <p className="settings-tab-desc">Update your public identity details.</p>

        {error && <div className="settings-error-msg">{error}</div>}
        {success && <div className="settings-success-msg">{success}</div>}

        <form onSubmit={handleSubmit(async () => {
          setLoading(true);
          setError("");
          try {
            const res = await axios.post(`${API}/profiles`, {
              photo: previewPhoto,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setSuccess("Profile photo updated successfully!");
            setSaveStatus("Saved!");
            onUpdate(res.data);
            setTimeout(() => setSuccess(""), 3000);
          } catch (err) {
            setError(err.response?.data?.message || "Update failed.");
            setSaveStatus("");
          }
          setLoading(false);
        })} className="settings-profile-form">

          <div className="settings-photo-section">
            <div className="settings-photo-preview">
              {previewPhoto ? <img src={previewPhoto} alt="Profile" /> : <div className="photo-placeholder">{currentUser?.username?.[0]}</div>}
            </div>
            <div className="settings-photo-actions">
              <input type="file" id="p-upload" hidden accept="image/*" onChange={handleFileChange} />
              <label htmlFor="p-upload" className="settings-upload-btn">Change Photo</label>
              {previewPhoto && (
                <button type="button" className="settings-remove-btn" onClick={() => { setPreviewPhoto(""); setSaveStatus(""); }}>
                  Remove
                </button>
              )}
            </div>
          </div>

          {rawImage && (
            <div className="settings-cropper-overlay">
              <div className="settings-cropper-modal">
                <h4>Adjust Photo</h4>
                <div className="cropper-container">
                  <Cropper 
                    image={rawImage} 
                    crop={crop} 
                    zoom={zoom} 
                    aspect={1} 
                    onCropChange={setCrop} 
                    onZoomChange={setZoom} 
                    onCropComplete={onCropComplete} 
                  />
                </div>
                <div className="settings-cropper-controls">
                  <span>Zoom</span>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} />
                </div>
                <div className="cropper-actions">
                  <button type="button" onClick={() => setRawImage(null)}>Cancel</button>
                  <button type="button" className="apply-btn" onClick={applyCrop}>Apply Crop</button>
                </div>
              </div>
            </div>
          )}

          <div className="settings-form-grid">
            <div className="settings-field">
              <label>Full Name</label>
              <div className="settings-read-only-box">{currentUser?.fullName}</div>
            </div>
            <div className="settings-field">
              <label>Username</label>
              <div className="settings-read-only-box">@{currentUser?.username}</div>
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit" className={`settings-primary-btn ${saveStatus === "Saved!" ? "saved" : ""}`} disabled={loading}>
              {loading ? "Updating..." : saveStatus === "Saved!" ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="settings-tab-content">
      <h3 className="settings-tab-title">Profile Information</h3>
      <p className="settings-tab-desc">Update your public profile and cultural journey.</p>
      
      {error && <div className="settings-error-msg">{error}</div>}
      {success && <div className="settings-success-msg">{success}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="settings-profile-form">
        <div className="settings-photo-section">
          <div className="settings-photo-preview">
            {previewPhoto ? <img src={previewPhoto} alt="Profile" /> : <div className="photo-placeholder">{currentUser?.username?.[0]}</div>}
          </div>
          <div className="settings-photo-actions">
            <input type="file" id="p-upload" hidden accept="image/*" onChange={handleFileChange} />
            <label htmlFor="p-upload" className="settings-upload-btn">Change Photo</label>
            {previewPhoto && <button type="button" className="settings-remove-btn" onClick={() => { setPreviewPhoto(""); setSaveStatus(""); }}>Remove</button>}
          </div>
        </div>

        <div className="settings-form-grid">
          {selectedRole === "NGO" ? (
            <>
              <div className="settings-field">
                <label>Organization Name</label>
                <input {...register("organizationName", { required: true })} placeholder="Kala Organization" />
              </div>
              <div className="settings-field">
                <label>Organization ID</label>
                <input {...register("organizationId", { required: true })} placeholder="ID-12345" />
              </div>
            </>
          ) : (
            <>
              <div className="settings-field">
                <label>Display Name</label>
                <input {...register("name", { required: true })} placeholder="Your Full Name" />
              </div>
              <div className="settings-field">
                <label>Age</label>
                <input type="number" {...register("age", { required: true, min: 12, valueAsNumber: true })} />
              </div>
              <div className="settings-field">
                <label>Gender</label>
                <select {...register("gender", { required: true })}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="settings-field">
                <label>Skills / Art Form (Select multiple)</label>
                <div className="reg-multi-select" style={{ maxWidth: '100%' }}>
                  <div 
                    className={`reg-multi-select-trigger ${skillsDropdownOpen ? "open" : ""}`}
                    onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                    style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px' }}
                  >
                    <span style={{ fontSize: '14px', color: selectedSkills.length > 0 ? 'var(--text-strong)' : 'var(--text-muted)' }}>
                      {selectedSkills.length > 0
                        ? `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`
                        : "Select your skills..."}
                    </span>
                    <i className={`fi ${skillsDropdownOpen ? "fi-sr-caret-up" : "fi-sr-caret-down"}`} />
                  </div>
                  
                  {skillsDropdownOpen && (
                    <div className="reg-multi-select-dropdown open" style={{ position: 'absolute', width: '100%', zIndex: 10 }}>
                      {skillOptions.map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <div 
                            key={skill} 
                            className={`reg-multi-select-option ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleSkill(skill)}
                          >
                            <div className="reg-multi-cb">
                              {isSelected && <i className="fi fi-br-check" />}
                            </div>
                            <span>{skill}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Hidden select for hook-form */}
                <select multiple hidden {...register("skills", { required: true })}>
                  {skillOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="settings-field">
            <label>Location</label>
            <input {...register("location", { required: true })} placeholder="City, State" />
          </div>

          <div className="settings-field">
            <label>Role</label>
            <input 
              type="text" 
              value={selectedRole} 
              readOnly 
              disabled 
              style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#666' }} 
            />
          </div>
        </div>

        {watch("skills") && watch("skills").includes("Other") && (
          <div className="settings-field">
            <label>Please specify your skill</label>
            <input type="text" {...register("otherSkill", { required: true })} placeholder="Pottery, Weaving..." />
          </div>
        )}

        <div className="settings-field full-width">
          <label>About You / Organization</label>
          <textarea 
            rows={4} 
            {...register("about", { 
              required: "About section is required",
              maxLength: { value: 300, message: "Maximum 300 characters allowed" }
            })} 
            placeholder="Tell the world about your work..." 
          />
          {errors.about && <small className="settings-error-text">{errors.about.message}</small>}
        </div>

        <button type="submit" className={`settings-primary-btn ${saveStatus === "Saved!" ? "saved" : ""}`} disabled={loading}>
          {loading ? "Saving..." : saveStatus === "Saved!" ? "✓ Saved!" : "Save Changes"}
        </button>
      </form>

      {rawImage && (
        <div className="settings-cropper-overlay">
          <div className="settings-cropper-modal">
            <h4>Crop Profile Picture</h4>
            <div className="cropper-container">
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
            <div className="settings-cropper-controls">
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>
            <div className="cropper-actions">
              <button type="button" onClick={() => setRawImage(null)}>Cancel</button>
              <button type="button" className="apply-btn" onClick={applyCrop}>Apply Crop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrivacyTab({ profile, token, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(profile?.isPrivate || false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/profiles`, { isPrivate: !isPrivate }, { headers: { Authorization: `Bearer ${token}` } });
      setIsPrivate(res.data.isPrivate);
      onUpdate(res.data);
    } catch (err) { }
    setLoading(false);
  };

  return (
    <div className="settings-tab-content">
      <h3 className="settings-tab-title">Privacy Settings</h3>
      <p className="settings-tab-desc">Control who can see your profile and activity.</p>
      
      <div className="settings-toggle-card">
        <div className="toggle-info">
          <strong>Private Profile</strong>
          <span>When private, only followers can see your posts and followers list.</span>
        </div>
        <button className={`settings-toggle-btn ${isPrivate ? "active" : ""}`} onClick={handleToggle} disabled={loading}>
          <div className="toggle-knob"></div>
        </button>
      </div>
    </div>
  );
}

function SecurityTab({ token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.put(`${API}/auth/change-password`, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess("Password updated successfully!");
      reset();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    }
    setLoading(false);
  };

  return (
    <div className="settings-tab-content">
      <h3 className="settings-tab-title">Security</h3>
      <p className="settings-tab-desc">Keep your account secure by updating your password regularly.</p>

      {error && <div className="settings-error-msg">{error}</div>}
      {success && <div className="settings-success-msg">{success}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="settings-security-form">
        <div className="settings-field">
          <label>Current Password</label>
          <div className="settings-password-wrapper">
            <input 
              type={showOld ? "text" : "password"} 
              {...register("oldPassword", { required: true })} 
            />
            <button 
              type="button" 
              className="password-toggle-trigger" 
              onClick={() => setShowOld(!showOld)}
            >
              <i className={`fi ${showOld ? "fi-sr-eye-crossed" : "fi-sr-eye"}`} />
            </button>
          </div>
        </div>
        <div className="settings-field">
          <label>New Password</label>
          <div className="settings-password-wrapper">
            <input 
              type={showNew ? "text" : "password"} 
              {...register("newPassword", { required: true, minLength: 6 })} 
            />
            <button 
              type="button" 
              className="password-toggle-trigger" 
              onClick={() => setShowNew(!showNew)}
            >
              <i className={`fi ${showNew ? "fi-sr-eye-crossed" : "fi-sr-eye"}`} />
            </button>
          </div>
        </div>
        <div className="settings-field">
          <label>Confirm New Password</label>
          <div className="settings-password-wrapper">
            <input 
              type={showConfirm ? "text" : "password"} 
              {...register("confirmPassword", { required: true })} 
            />
            <button 
              type="button" 
              className="password-toggle-trigger" 
              onClick={() => setShowConfirm(!showConfirm)}
            >
              <i className={`fi ${showConfirm ? "fi-sr-eye-crossed" : "fi-sr-eye"}`} />
            </button>
          </div>
        </div>
        <button type="submit" className="settings-primary-btn" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

function NotificationTab({ profile, token, onUpdate }) {
  const [retentionOption, setRetentionOption] = useState(profile?.notificationRetentionDays?.toString() || "0");
  const [customDays, setCustomDays] = useState(profile?.notificationRetentionDays || 7);
  const [saveStatus, setSaveStatus] = useState("");

  const handleSave = async () => {
    setSaveStatus("Saving...");
    try {
      const days = retentionOption === "custom" ? parseInt(customDays) || 0 : parseInt(retentionOption);
      const res = await axios.post(`${API}/profiles`, { notificationRetentionDays: days }, { headers: { Authorization: `Bearer ${token}` } });
      onUpdate(res.data);
      setSaveStatus("Saved!");
    } catch {
      setSaveStatus("Error saving.");
    }
  };

  return (
    <div className="settings-tab-content">
      <h3 className="settings-tab-title">Notifications</h3>
      <p className="settings-tab-desc">Auto-delete old notifications to keep your feed clean.</p>

      <div className="settings-field">
        <label>Delete Notifications After</label>
        <select value={retentionOption} onChange={(e) => { setRetentionOption(e.target.value); setSaveStatus(""); }}>
          <option value="0">Never (Keep Forever)</option>
          <option value="1">1 Day</option>
          <option value="7">7 Days</option>
          <option value="30">30 Days</option>
          <option value="custom">Custom (Days)</option>
        </select>
      </div>

      {retentionOption === "custom" && (
        <div className="settings-field">
          <label>Custom Number of Days</label>
          <input type="number" min="1" value={customDays} onChange={(e) => { setCustomDays(e.target.value); setSaveStatus(""); }} />
        </div>
      )}

      <button className={`settings-primary-btn ${saveStatus === "Saved!" ? "saved" : ""}`} onClick={handleSave} disabled={saveStatus === "Saving..."}>
        {saveStatus === "Saving..." ? "Saving..." : saveStatus === "Saved!" ? "✓ Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}

function AccountTab({ token }) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmDelete !== "DELETE") return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/auth/account`, { headers: { Authorization: `Bearer ${token}` }, data: { password } });
      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Deletion failed.");
      setDeleting(false);
    }
  };

  return (
    <div className="settings-tab-content">
      <h3 className="settings-tab-title danger-text">Delete Account</h3>
      <p className="settings-tab-desc">Permanently erase your identity, posts, and data. This cannot be undone.</p>

      {error && <div className="settings-error-msg">{error}</div>}

      <div className="settings-field">
        <label>Password</label>
        <div className="settings-password-wrapper">
          <input 
            type={showPass ? "text" : "password"} 
            placeholder="Confirm your password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="button" 
            className="password-toggle-trigger" 
            onClick={() => setShowPass(!showPass)}
          >
            <i className={`fi ${showPass ? "fi-sr-eye-crossed" : "fi-sr-eye"}`} />
          </button>
        </div>
      </div>
      <div className="settings-field">
        <label>Type <strong>DELETE</strong> to confirm</label>
        <input type="text" placeholder="DELETE" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />
      </div>

      <button className="settings-danger-btn" onClick={handleDelete} disabled={confirmDelete !== "DELETE" || !password || deleting}>
        {deleting ? "Deleting..." : "Permanently Delete Account"}
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { navigate("/signin"); return; }
    (async () => {
      try {
        const res = await axios.get(`${API}/profiles/${currentUser._id}`);
        setProfile(res.data);
      } catch { }
      setLoading(false);
    })();
  }, [currentUser?._id, navigate]);

  if (loading) return <div className="settings-loading-page"><Navbar /><div className="loader">Loading Settings...</div></div>;

  const navItems = [
    { key: "profile", label: "Profile", icon: "fi-sr-user" },
    { key: "privacy", label: "Privacy", icon: "fi-sr-lock" },
    { key: "security", label: "Security", icon: "fi-sr-shield-check" },
    { key: "notifications", label: "Notifications", icon: "fi-sr-bell" },
    { key: "account", label: "Account", icon: "fi-sr-trash", danger: true },
  ].filter(item => {
    if (item.key === "privacy" && currentUser?.role === "user") return false;
    return true;
  });

  const handleUpdate = (newProfile) => setProfile(newProfile);

  return (
    <div className="settings-page-wrapper">
      <Navbar />
      <div className="settings-layout">
        <aside className="settings-sidebar">
          <h2 className="sidebar-brand">Settings</h2>
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.key}
                className={`sidebar-nav-item ${activeTab === item.key ? "active" : ""} ${item.danger ? "danger" : ""}`}
                onClick={() => setSearchParams({ tab: item.key })}
              >
                <i className={`fi ${item.icon}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="settings-main-container">
          <div className="settings-card-glow">
            {activeTab === "profile" && <ProfileTab profile={profile} currentUser={currentUser} token={token} onUpdate={handleUpdate} />}
            {activeTab === "privacy" && currentUser?.role !== "user" && <PrivacyTab profile={profile} token={token} onUpdate={handleUpdate} />}
            {activeTab === "security" && <SecurityTab token={token} />}
            {activeTab === "notifications" && <NotificationTab profile={profile} token={token} onUpdate={handleUpdate} />}
            {activeTab === "account" && <AccountTab token={token} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import "./Settings.css";

import API from "../utils/api";

function Settings() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [activeSection, setActiveSection] = useState("profile");

  // Profile info state
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Notification prefs state
  const [retentionOption, setRetentionOption] = useState("0");
  const [customDays, setCustomDays] = useState(7);
  const [saveStatus, setSaveStatus] = useState("");

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!currentUser) { navigate("/signin"); return; }
    (async () => {
      try {
        const res = await axios.get(`${API}/profiles/${currentUser._id}`);
        setProfile(res.data);
        const retDays = res.data.notificationRetentionDays || 0;
        if ([0, 1, 7, 30].includes(retDays)) {
          setRetentionOption(retDays.toString());
        } else {
          setRetentionOption("custom");
          setCustomDays(retDays);
        }
      } catch { /* no profile yet */ }
      setLoadingProfile(false);
    })();
  }, [currentUser?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePreferences = async () => {
    setSaveStatus("Saving...");
    try {
      const days = retentionOption === "custom" ? parseInt(customDays) || 0 : parseInt(retentionOption);
      await axios.post(`${API}/profiles`, { notificationRetentionDays: days }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaveStatus("Saved!");
      // stays as "Saved!" until user changes a setting
    } catch {
      setSaveStatus("Error saving.");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE" || !deletePassword) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await axios.delete(`${API}/auth/account`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword },
      });
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  if (!currentUser) return null;

  const navItems = [
    { key: "profile",       label: "Profile Information", icon: "fi-sr-user" },
    { key: "notifications", label: "Notifications",       icon: "fi-sr-bell" },
    { key: "delete",        label: "Delete Account",      icon: "fi-sr-trash", danger: true },
  ];

  return (
    <div className="settings-bg">
      <Navbar />
      <div className="settings-container">

        {/* ── Left Sidebar ── */}
        <aside className="settings-sidebar">
          <h2 className="settings-sidebar-title">Settings</h2>
          <nav className="settings-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`settings-nav-item ${activeSection === item.key ? "active" : ""} ${item.danger ? "danger" : ""}`}
                onClick={() => setActiveSection(item.key)}
              >
                <i className={`fi ${item.icon}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="settings-main">

          {/* Profile Information */}
          {activeSection === "profile" && (
            <div className="settings-card">
              <h3 className="settings-section-title">Profile Information</h3>
              {loadingProfile ? (
                <p className="settings-loading">Loading...</p>
              ) : (
                <div className="settings-info-list">
                  <div className="settings-info-row">
                    <span className="settings-info-label">Name:</span>
                    <span>{profile?.displayName || currentUser.fullName || "—"}</span>
                  </div>
                  <div className="settings-info-row">
                    <span className="settings-info-label">Role:</span>
                    <span>{currentUser.role}</span>
                  </div>
                  <div className="settings-info-row">
                    <span className="settings-info-label">Email:</span>
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="settings-info-row">
                    <span className="settings-info-label">About:</span>
                    <span>{profile?.about || "—"}</span>
                  </div>
                  <div className="settings-info-row">
                    <span className="settings-info-label">Location:</span>
                    <span>{profile?.location || "—"}</span>
                  </div>
                  <div className="settings-info-row">
                    <span className="settings-info-label">Type:</span>
                    <span>{profile?.userType || "—"}</span>
                  </div>
                  <button className="settings-edit-btn" onClick={() => navigate("/edit-profile")}>
                    <i className="fi fi-sr-pencil" /> Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="settings-card">
              <h3 className="settings-section-title">Notification Preferences</h3>
              <p className="settings-section-desc">Automatically delete old notifications to keep your feed clean.</p>

              <div className="settings-field">
                <label>Delete Notifications After</label>
                <select
                  className="settings-select"
                  value={retentionOption}
                  onChange={(e) => { setRetentionOption(e.target.value); setSaveStatus(""); }}
                >
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
                  <input
                    type="number"
                    className="settings-input"
                    min="1"
                    value={customDays}
                    onChange={(e) => { setCustomDays(e.target.value); setSaveStatus(""); }}
                    placeholder="e.g. 14"
                  />
                </div>
              )}

              <button className="settings-save-btn" onClick={handleSavePreferences}>
                {saveStatus || "Save Preferences"}
              </button>
            </div>
          )}

          {/* Delete Account */}
          {activeSection === "delete" && (
            <div className="settings-card">
              <h3 className="settings-section-title danger-title">Delete Account</h3>
              <p className="settings-section-desc">
                Once you delete your account, there is no going back. All your data, posts, messages,
                and profile information will be permanently erased. Please be certain.
              </p>

              {deleteError && <div className="settings-error">{deleteError}</div>}

              <div className="settings-field">
                <label>Password</label>
                <input
                  type="password"
                  className="settings-input"
                  placeholder="Enter your current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Type <strong>DELETE</strong> to confirm</label>
                <input
                  type="text"
                  className="settings-input"
                  placeholder="DELETE"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                />
              </div>

              <button
                className="settings-danger-btn"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || !deletePassword || deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete Account"}
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Settings;

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SettingsModal.css";

const API = "http://localhost:5000";

function SettingsModal({ onClose }) {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [fetching, setFetching] = useState(true);
  const [retentionOption, setRetentionOption] = useState("0");
  const [customDays, setCustomDays] = useState(7);
  const [saveStatus, setSaveStatus] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch current notification preferences (requires a profile endpoint logic)
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await axios.get(`${API}/profiles/${currentUser._id}`);
        const profile = res.data;
        const retDays = profile.notificationRetentionDays || 0;
        if ([0, 1, 7, 30].includes(retDays)) {
          setRetentionOption(retDays.toString());
        } else {
          setRetentionOption("custom");
          setCustomDays(retDays);
        }
      } catch {
        // fail silently if profile doesn't exist
      }
      setFetching(false);
    })();
  }, [currentUser?._id]);

  const handleSavePreferences = async () => {
    setSaveStatus("Saving...");
    try {
      const days = retentionOption === "custom" ? parseInt(customDays) || 0 : parseInt(retentionOption);
      await axios.post(
        `${API}/profiles`, // Profile endpoint handles partial updates if logic matches EditProfile
        { notificationRetentionDays: days },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(""), 2000);
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

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sm-header">
          <h3>Settings</h3>
          <button className="sm-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="sm-body">
          {fetching ? (
            <div className="sm-loading">Loading settings...</div>
          ) : (
            <>
              {/* Notification Preferences */}
              <div className="sm-section">
                <h4>Notification Preferences</h4>
                <p className="sm-desc">Automatically delete old notifications to keep your feed clean.</p>
                <div className="sm-field">
                  <label>Delete Notifications After</label>
                  <select
                    className="sm-select"
                    value={retentionOption}
                    onChange={(e) => setRetentionOption(e.target.value)}
                  >
                    <option value="0">Never (Keep Forever)</option>
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="custom">Custom (Days)</option>
                  </select>
                </div>
                
                {retentionOption === "custom" && (
                  <div className="sm-field">
                    <label>Custom Number of Days</label>
                    <input
                      type="number"
                      className="sm-input"
                      min="1"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="e.g. 14"
                    />
                  </div>
                )}

                <button className="sm-save-btn" onClick={handleSavePreferences}>
                  {saveStatus || "Save Preferences"}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="sm-section sm-danger-zone">
                <h4 className="sm-danger-title">Danger Zone</h4>
                <p className="sm-danger-desc">
                  Once you delete your account, there is no going back. All your data, posts, messages, and profile information will be permanently erased.
                </p>
                <button type="button" className="sm-danger-btn" onClick={() => setShowDeleteModal(true)}>
                  Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="sm-delete-overlay">
          <div className="sm-delete-modal">
            <h3>Delete Account</h3>
            <p>This action is permanent and cannot be undone. To verify, please enter your password and type <strong>DELETE</strong> below.</p>
            
            {deleteError && <div className="sm-error">{deleteError}</div>}

            <div className="sm-field">
              <label>Password</label>
              <input
                type="password"
                className="sm-input"
                placeholder="Enter your current password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>

            <div className="sm-field">
              <label>Type DELETE</label>
              <input
                type="text"
                className="sm-input"
                placeholder="DELETE"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>

            <div className="sm-delete-actions">
              <button
                type="button"
                className="sm-btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteConfirmation("");
                  setDeleteError("");
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sm-btn-confirm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || !deletePassword || deleting}
              >
                {deleting ? "Deleting..." : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsModal;

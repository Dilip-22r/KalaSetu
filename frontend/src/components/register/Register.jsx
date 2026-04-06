import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import getCroppedImg from "../../utils/cropImage";
import { useAuthStore } from "../../store/useAuthStore";
import "./Register.css";
import Navbar from "../common/Navbar";

import API from "../../utils/api";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const [step, setStep] = useState(1);

  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPx, setCroppedPx] = useState(null);
  
  const skillOptions = [
    "Handloom Weaving", "Pottery", "Wood Carving", "Bharatanatyam",
    "Madhubani Painting", "Classical Music", "Storytelling", "Folk Dance", "Other"
  ];
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isPrivate: false
    }
  });

  const selectedRole = watch("userType");
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
      setValue("photo", base64);
      setRawImage(null);
      setError("");
    } catch (err) {
      setError("Crop failed. Please try again.");
      console.error(err);
    }
  };

  const buildSkills = (skillsData) => {
    if (!skillsData) return "";
    return Array.isArray(skillsData) ? skillsData.join(", ") : skillsData;
  };

  const handleNextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["userType", "location"]);
    } else if (step === 2) {
      if (selectedRole === "NGO") {
        isValid = await trigger(["organizationName", "verificationDocument", "organizationId"]);
      } else {
        isValid = await trigger(["name", "gender", "skills", "age"]);
      }
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const onFormSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (!storedUser) throw new Error("User not found locally");

      const token = localStorage.getItem("token");
      const roleRes = await axios.put(`${API}/auth/upgrade-role`, {
        userId: storedUser._id,
        newRole: data.userType.toLowerCase(),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newToken = roleRes.data.token;

      const profilePayload = {
        location: data.location,
        about: data.about,
        photo: data.photo || "",
        userType: data.userType,
        isPrivate: data.isPrivate
      };

      if (data.userType === "NGO") {
        profilePayload.organizationName = data.organizationName;
        profilePayload.verificationDocument = data.verificationDocument;
        profilePayload.organizationId = data.organizationId;
        profilePayload.displayName = data.organizationName;
      } else {
        profilePayload.displayName = data.name;
        profilePayload.age = data.age;
        profilePayload.gender = data.gender;

        // Handle "Other" skill
        let finalSkills = Array.isArray(data.skills) ? [...data.skills] : [data.skills];
        if (finalSkills.includes("Other")) {
          finalSkills = finalSkills.filter(s => s !== "Other");
          if (data.otherSkill) finalSkills.push(data.otherSkill);
        }
        profilePayload.skills = finalSkills.join(", ");
      }

      await axios.post(
        `${API}/profiles`,
        profilePayload,
        { headers: { Authorization: `Bearer ${newToken}` } }
      );

      const rawUser = roleRes.data.user;
      const updatedUser = {
        _id: rawUser._id || storedUser._id,
        fullName: rawUser.fullName || storedUser.fullName,
        email: rawUser.email || storedUser.email,
        username: rawUser.username || storedUser.username,
        role: rawUser.role,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("token", newToken);
      setAuthUser(updatedUser);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="theme-bg">
      <Navbar />

      <div className="reg-shell">
        <div className="reg-card">
          <div className="reg-wizard-header">
            <h2 className="theme-title">Join as Artisan or NGO</h2>
            <div className="reg-wizard-steps">
              <div className={`wizard-step ${step >= 1 ? "active" : ""}`}>
                <div className="wizard-icon">1</div>
                <span className="wizard-label">ROLE INFO</span>
              </div>
              <div className={`wizard-line ${step >= 2 ? "active" : ""}`}></div>
              <div className={`wizard-step ${step >= 2 ? "active" : ""}`}>
                <div className="wizard-icon">2</div>
                <span className="wizard-label">DETAILS</span>
              </div>
              <div className={`wizard-line ${step >= 3 ? "active" : ""}`}></div>
              <div className={`wizard-step ${step >= 3 ? "active" : ""}`}>
                <div className="wizard-icon">3</div>
                <span className="wizard-label">ABOUT YOU</span>
              </div>
            </div>
          </div>

          {error && <div className="reg-error">{error}</div>}

          <form onSubmit={handleSubmit(onFormSubmit)} className="reg-form">

            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="wizard-panel">
                <div className="reg-field">
                  <label>Register As *</label>
                  <select {...register("userType", { required: "Please select a role" })}>
                    <option value="">Select role</option>
                    <option value="Artisan">Artisan</option>
                    <option value="NGO">NGO</option>
                  </select>
                  {errors.userType && <small>{errors.userType.message}</small>}
                </div>

                <div className="reg-field">
                  <label>Location *</label>
                  <input
                    type="text"
                    placeholder="City, State"
                    {...register("location", { required: "Location is required" })}
                  />
                  {errors.location && <small>{errors.location.message}</small>}
                </div>
              </div>
            )}

            {/* Step 2: Role-Based Details */}
            {step === 2 && (
              <div className="wizard-panel">
                {selectedRole === "NGO" ? (
                  <>
                    <div className="reg-field">
                      <label>Organization Name *</label>
                      <input
                        type="text"
                        placeholder="Organization name"
                        {...register("organizationName", { required: "Organization name is required" })}
                      />
                      {errors.organizationName && <small>{errors.organizationName.message}</small>}
                    </div>
                    <div className="reg-field">
                      <label>UniqueID *</label>
                      <input
                        type="text"
                        placeholder=""
                        {...register("organizationId", { required: "Organization ID is required" })}
                      />
                      {errors.organizationId && <small>{errors.organizationId.message}</small>}
                    </div>
                    <div className="reg-field">
                      <label>Verification Document (PDF) *</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        id="ngoDocUpload"
                        style={{ display: "none" }}
                        className="hidden-file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setValue("verificationDocumentFile", file.name);
                            const reader = new FileReader();
                            reader.onload = () => setValue("verificationDocument", reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="file-upload-wrapper">
                        <label htmlFor="ngoDocUpload" className="upload-btn">Choose File</label>
                        {!watch("verificationDocument") ? (
                          <span className="file-placeholder">No file chosen</span>
                        ) : null}
                      </div>
                      {watch("verificationDocument") && (
                        <div className="file-selected-text">
                          Selected: {watch("verificationDocumentFile") || "document.pdf"}
                        </div>
                      )}
                      <input type="hidden" {...register("verificationDocument", { required: "Document is required" })} />
                      {errors.verificationDocument && <small>{errors.verificationDocument.message}</small>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="reg-field">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name && <small>{errors.name.message}</small>}
                    </div>

                    <div className="reg-row">
                      <div className="reg-field">
                        <label>Age *</label>
                        <input
                          type="number"
                          placeholder="Your age"
                          {...register("age", {
                            required: "Age is required",
                            min: { value: 12, message: "Must be at least 12" },
                            max: { value: 100, message: "Invalid age" },
                          })}
                        />
                        {errors.age && <small>{errors.age.message}</small>}
                      </div>
                      <div className="reg-field">
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
                    </div>

                    <div className="reg-field">
                      <label>Skills * (Select multiple)</label>
                      <div className="reg-multi-select">
                        <div 
                          className={`reg-multi-select-trigger ${skillsDropdownOpen ? "open" : ""}`}
                          onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                        >
                          <span>
                            {selectedSkills.length > 0
                              ? `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`
                              : "Select your skills..."}
                          </span>
                          <i className={`fi ${skillsDropdownOpen ? "fi-sr-caret-up" : "fi-sr-caret-down"}`} />
                        </div>
                        
                        <div className={`reg-multi-select-dropdown ${skillsDropdownOpen ? "open" : ""}`}>
                          {skillOptions.map((skill) => {
                            const isSelected = selectedSkills.includes(skill);
                            return (
                              <div 
                                key={skill} 
                                className={`reg-multi-select-option ${isSelected ? "selected" : ""}`}
                                onClick={() => toggleSkill(skill)}
                              >
                                <div className="reg-multi-cb">
                                  <i className="fi fi-br-check" />
                                </div>
                                <span>{skill}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Hidden input to maintain hook-form validation */}
                      <select multiple hidden {...register("skills", { required: "Skills are required" })}>
                        {skillOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      {errors.skills && <small>{errors.skills.message}</small>}
                    </div>

                      {watch("skills") && watch("skills").includes("Other") && (
                        <div className="reg-field" style={{ marginTop: "-10px" }}>
                          <label>Please specify your skill *</label>
                          <input type="text" placeholder="Enter your skill" {...register("otherSkill", { required: "Please specify your skill" })} />
                          {errors.otherSkill && <small>{errors.otherSkill.message}</small>}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Profile Details */}
            {step === 3 && (
              <div className="wizard-panel">
                <div className="reg-field">
                  <label>About You *</label>
                  <textarea
                    placeholder=""
                    rows={4}
                    {...register("about", { required: "Please write an about section" })}
                  />
                  {errors.about && <small>{errors.about.message}</small>}
                </div>
                <div className="reg-field">
                  <label>Profile Photo</label>
                  <div className="photo-upload-row">
                    <div className="photo-upload-preview">
                      {watch("photo") ? (
                        <img src={watch("photo")} alt="Preview" className="photo-preview-circle" />
                      ) : (
                        <div className="photo-preview-placeholder">
                          <i className="fi fi-sr-user" />
                        </div>
                      )}
                    </div>
                    <div className="photo-upload-actions">
                      <label htmlFor="profilePhotoUpload" className="photo-upload-btn">Browse from device</label>
                      {watch("photo") && (
                        <button type="button" className="photo-remove-btn" onClick={() => setValue("photo", null)}>Remove</button>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id="profilePhotoUpload"
                    className="hidden-file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCrop({ x: 0, y: 0 });
                          setZoom(1);
                          setCroppedPx(null);
                          setRawImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = null;
                    }}
                  />
                </div>
                <div className="reg-field">
                  <label>Profile Privacy *</label>
                  <select {...register("isPrivate")}>
                    <option value={false}>Public</option>
                    <option value={true}>Private</option>
                  </select>
                </div>
              </div>
            )}

            <div className="reg-actions">
              {step > 1 && (
                <button type="button" className="reg-cancel" onClick={handlePrevStep} disabled={loading}>
                  Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="reg-submit" onClick={handleNextStep}>
                  Next
                </button>
              ) : (
                <button type="submit" className="reg-submit" disabled={loading}>
                  {loading ? "Creating Profile..." : "Complete Setup"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {rawImage && (
        <div className="reg-cropper-overlay">
          <div className="reg-cropper-modal">
            <h3>Crop Profile Picture</h3>
            <div className="reg-cropper-container">
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
            <div className="reg-cropper-controls">
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
            <div className="reg-cropper-actions">
              <button type="button" className="reg-cropper-cancel" onClick={() => setRawImage(null)}>
                Cancel
              </button>
              <button type="button" className="reg-cropper-save" onClick={applyCrop}>
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;

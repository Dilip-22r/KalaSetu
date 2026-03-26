import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "./SignUp.css";
import artformsBg from "../../assets/artforms.png";

function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1 validation before moving to step 2
  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    if (!formData.fullName.trim()) return setError("Full name is required");
    if (!formData.email.trim()) return setError("Email is required");
    if (!formData.email.endsWith("@gmail.com")) return setError("Email must end with @gmail.com");
    setStep(2);
  };

  const handleBack = () => {
    setError("");
    setStep(1);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password.length < 6) return setError("Password must be at least 6 characters");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");

    try {
      await axios.post("http://localhost:5000/auth/signup", {
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: "user",
      });
      alert("Signup successful!");
      navigate("/signin");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="su-root" style={{ backgroundImage: `url(${artformsBg})` }}>

      {/* Overlay */}
      <div className="su-overlay" />

      {/* Navbar */}
      <nav className="su-navbar">
        <h1 className="su-brand">KalaSetu</h1>
        <button className="su-back-btn" onClick={() => navigate("/")}>Back</button>
      </nav>

      {/* Centered card */}
      <div className="su-center">
        <div className="su-card">

          {/* Step indicator */}
          <div className="su-steps">
            <div className={`su-step ${step >= 1 ? "active" : ""}`}>
              <div className="su-step-dot">1</div>
              <span>Basic Info</span>
            </div>
            <div className={`su-step-line ${step === 2 ? "filled" : ""}`} />
            <div className={`su-step ${step === 2 ? "active" : ""}`}>
              <div className="su-step-dot">2</div>
              <span>Account Setup</span>
            </div>
          </div>

          {/* Header */}
          <div className="su-header">
            <h2>{step === 1 ? "Join the Culture" : "Set Up Your Account"}</h2>
            <p>{step === 1 ? "Tell us who you are" : "Create your login credentials"}</p>
          </div>

          {/* Error */}
          {error && <div className="su-error">{error}</div>}

          {/* ΓöÇΓöÇ STEP 1 ΓöÇΓöÇ */}
          {step === 1 && (
            <form onSubmit={handleNext} className="su-form">
              <div className="su-field">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  className="su-input"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="su-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  className="su-input"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="su-btn-primary">
                Next
              </button>

              <p className="su-switch">
                Already have an account?{" "}
                <span onClick={() => navigate("/signin")}>Sign In</span>
              </p>
            </form>
          )}

          {/* ΓöÇΓöÇ STEP 2 ΓöÇΓöÇ */}
          {step === 2 && (
            <form onSubmit={handleSignUp} className="su-form">
              <div className="su-field">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  className="su-input"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="su-field">
                <label>Password</label>
                <div className="su-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="su-input"
                    placeholder="Create password (min 6 chars)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="su-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="su-field">
                <label>Confirm Password</label>
                <div className="su-password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="su-input"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="su-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="su-btn-row">
                <button type="button" className="su-btn-secondary" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="su-btn-primary su-btn-grow">
                  Create Account
                </button>
              </div>

              <p className="su-switch">
                Already have an account?{" "}
                <span onClick={() => navigate("/signin")}>Sign In</span>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default SignUp;

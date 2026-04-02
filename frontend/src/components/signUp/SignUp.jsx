import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SignUp.css";
import artformsBg from "../../assets/artforms.png";
import kalasetuLogo from "../../assets/kalasetu_logo.png";

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
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleNext = (event) => {
    event.preventDefault();
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

  const handleSignUp = async (event) => {
    event.preventDefault();
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
      setSuccess("Account created successfully. Redirecting to sign in...");
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="su-root" style={{ backgroundImage: `url(${artformsBg})` }}>
      <div className="su-overlay" />

      <nav className="su-navbar">
        <div className="su-brand-wrap" onClick={() => navigate("/")}>
          <img src={kalasetuLogo} alt="KalaSetu" className="su-brand-logo" />
          <div className="su-brand-copy">
            <span className="su-brand-kicker">Cultural network</span>
            <h1 className="su-brand display-serif">KalaSetu</h1>
          </div>
        </div>
        <button className="su-back-btn" onClick={() => navigate("/")}>
          Back
        </button>
      </nav>

      <div className="su-center">
        <div className="su-card">
          <div className="su-form-panel">
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

            <div className="su-header">
              <h2>{step === 1 ? "Join KalaSetu" : "Set Up Your Account"}</h2>
              <p>{step === 1 ? "Tell us who you are" : "Create your login credentials"}</p>
            </div>

            {error && <div className="su-error">{error}</div>}
            {success && <div className="su-success">{success}</div>}

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
                  Continue
                </button>

                <p className="su-switch">
                  Already have an account? <span onClick={() => navigate("/signin")}>Sign In</span>
                </p>
              </form>
            )}

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
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="su-eye-btn"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? "Hide" : "Show"}
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
                      onClick={() => setShowConfirmPassword((value) => !value)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
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
                  Already have an account? <span onClick={() => navigate("/signin")}>Sign In</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

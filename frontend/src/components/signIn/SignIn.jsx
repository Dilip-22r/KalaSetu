import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/useAuthStore";
import artformsBg from "../../assets/artforms.png";
import kalasetuLogo from "../../assets/kalasetu_logo.png";
import "./SignIn.css";

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuthUser } = useAuthStore();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name === "password" ? "password" : "email"]: e.target.value,
    });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.email || !formData.password) return setError("All fields are required");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      setAuthUser(response.data.user);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setSuccess("✅ Signed in successfully! Redirecting...");
      setTimeout(() => navigate("/home"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="si-root" style={{ backgroundImage: `url(${artformsBg})` }}>

      <div className="si-overlay" />

      <nav className="si-nav">
        <img src={kalasetuLogo} alt="KalaSetu" className="si-brand-logo" />
        <h1 className="si-brand" onClick={() => navigate("/")}>KalaSetu</h1>
        <button className="si-back" onClick={() => navigate("/")}>Back</button>
      </nav>

      <div className="si-center">
        <div className="si-card">

          <div className="si-card-top">
            <h2>Welcome Back</h2>
            <p>Continue your cultural journey</p>
          </div>

          {error && <div className="si-error">{error}</div>}
          {success && <div className="si-success">{success}</div>}

          <form onSubmit={handleSignIn} className="si-form">
            <div className="si-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                onChange={handleChange}
                required
              />
            </div>

            <div className="si-field">
              <label>Password</label>
              <div className="si-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="si-eye-btn"
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

            <div className="si-row">
              <label className="si-remember">
                <input type="checkbox" /> Remember me
              </label>
              <span className="si-forgot">Forgot password?</span>
            </div>

            <button type="submit" className="si-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="si-switch">
              New to KalaSetu?{" "}
              <span onClick={() => navigate("/signup")}>Create account</span>
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}

export default SignIn;

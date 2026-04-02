import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name === "password" ? "password" : "email"]: event.target.value,
    });
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      setAuthUser(response.data.user);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setSuccess("Signed in successfully. Redirecting...");
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
        <div className="si-brand-wrap" onClick={() => navigate("/")}>
          <img src={kalasetuLogo} alt="KalaSetu" className="si-brand-logo" />
          <div className="si-brand-copy">
            <span className="si-brand-kicker">Cultural network</span>
            <h1 className="si-brand display-serif">KalaSetu</h1>
          </div>
        </div>
        <button className="si-back" onClick={() => navigate("/")}>
          Back
        </button>
      </nav>

      <div className="si-center">
        <div className="si-card">
          <div className="si-form-panel">
            <div className="si-card-top">
              <h2>Sign In</h2>
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
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Hide" : "Show"}
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
                New to KalaSetu? <span onClick={() => navigate("/signup")}>Create account</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;

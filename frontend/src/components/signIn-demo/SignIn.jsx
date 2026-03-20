import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "./SignIn.css";

function SignIn() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.type === "password" ? "password" : "email"]: e.target.value,
    });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.email || !formData.password) {
      return setError("All fields are required");
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      // ✅ Store token & user
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      alert("Signed in successfully!");
      navigate("/home");

    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="theme-bg">
      <nav className="navbar">
        <h1 className="brand-title">KalaSetu</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Back</button>
        </div>
      </nav>

      <div className="container-fluid d-flex justify-content-center">
        <div className="row w-100 justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <div className="card theme-card p-5 shadow-lg">

              <h2 className="theme-title mb-2 text-center">
                Welcome Back
              </h2>

              <p className="subtitle mb-4 text-center">
                Continue your journey with KalaSetu
              </p>

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignIn}>
                <div className="mb-3">
                  <label className="form-label theme-label">
                    Email / Username
                  </label>
                  <input
                    type="email"
                    className="form-control custom-input"
                    placeholder="Enter your email"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label theme-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control custom-input"
                    placeholder="Enter your password"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="remember"
                    />
                    <label
                      className="form-check-label small"
                      htmlFor="remember"
                    >
                      Remember me
                    </label>
                  </div>

                  <span className="theme-link small">
                    Forgot password?
                  </span>
                </div>

                <button className="btn theme-btn w-100 mb-3">
                  Sign In
                </button>

                <p className="small text-muted text-center mb-0">
                  Don’t have an account?{" "}
                  <span
                    className="theme-link fw-semibold"
                    onClick={() => navigate("/signup")}
                  >
                    Create now
                  </span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;

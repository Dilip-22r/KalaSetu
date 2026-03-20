import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "./SignUp.css";

function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    // 1️⃣ Email validation
    if (!formData.email.endsWith("@gmail.com")) {
      return setError("Email must end with @gmail.com");
    }

    // 2️⃣ Password length
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters long");
    }

    // 3️⃣ Confirm password match
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/auth/signup",
        {
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: "user", // default role
        }
      );

      alert("Signup successful!");
      navigate("/signin");

    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
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
          <div className="col-lg-6 col-xl-5">
            <div className="card theme-card shadow-lg">
              <div className="col-12 p-5">

                <h2 className="theme-title mb-2 text-center">
                  Join the Culture
                </h2>
                <p className="subtitle mb-4 text-center">
                  Start your journey with us
                </p>

                {error && (
                  <div className="alert alert-danger text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignUp}>

                  <div className="mb-3">
                    <label className="form-label theme-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className="form-control custom-input"
                      placeholder="Your full name"
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label theme-label">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control custom-input"
                      placeholder="example@gmail.com"
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label theme-label">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      className="form-control custom-input"
                      placeholder="Choose a username"
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
                      name="password"
                      className="form-control custom-input"
                      placeholder="Create password"
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label theme-label">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control custom-input"
                      placeholder="Re-enter password"
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button className="btn theme-btn w-100 mb-3">
                    Create Account
                  </button>

                  <p className="small text-muted text-center">
                    Already have an account?{" "}
                    <span
                      className="theme-link fw-semibold"
                      onClick={() => navigate("/signin")}
                    >
                      Sign In
                    </span>
                  </p>

                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

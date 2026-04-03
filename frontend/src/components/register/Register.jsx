import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import "./Register.css";
import Navbar from "../common/Navbar";

const API = "http://localhost:5000";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuthUser = useAuthStore((state) => state.setAuthUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onFormSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const roleRes = await axios.put(`${API}/auth/upgrade-role`, {
        userId: storedUser._id,
        newRole: data.userType.toLowerCase(),
      });

      const newToken = roleRes.data.token;

      await axios.post(
        `${API}/profiles`,
        {
          displayName: data.name,
          age: data.age,
          gender: data.gender,
          skills: data.skills,
          location: data.location,
          about: data.about,
          photo: data.photo || "",
          userType: data.userType,
        },
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
          <h2 className="theme-title">Join as Artisan or NGO</h2>
          <p className="subtitle">Complete your profile to unlock posting and messaging</p>

          {error && <div className="reg-error">{error}</div>}

          <form onSubmit={handleSubmit(onFormSubmit)} className="reg-form">
            <div className="reg-row">
              <div className="reg-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && <small>{errors.name.message}</small>}
              </div>

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
            </div>

            <div className="reg-row">
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

              <div className="reg-field">
                <label>Register As *</label>
                <select {...register("userType", { required: "Please select a type" })}>
                  <option value="">Select type</option>
                  <option>Artisan</option>
                  <option>NGO</option>
                </select>
                {errors.userType && <small>{errors.userType.message}</small>}
              </div>
            </div>

            <div className="reg-field">
              <label>Skills / Art Form *</label>
              <input
                type="text"
                placeholder="e.g. Handloom weaving, Bharatanatyam, Madhubani painting"
                {...register("skills", { required: "Skills are required" })}
              />
              {errors.skills && <small>{errors.skills.message}</small>}
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

            <div className="reg-field">
              <label>About You *</label>
              <textarea
                placeholder="Tell the community about your cultural journey, your craft, and what inspires you."
                rows={4}
                {...register("about", { required: "Please write something about yourself" })}
              />
              {errors.about && <small>{errors.about.message}</small>}
            </div>

            <div className="reg-field">
              <label>
                Profile Photo URL <span className="opt-label">(optional)</span>
              </label>
              <input type="url" placeholder="https://example.com/your-photo.jpg" {...register("photo")} />
            </div>

            <button type="submit" className="reg-submit" disabled={loading}>
              {loading ? "Creating Profile..." : "Create My Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;

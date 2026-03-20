import { useNavigate } from "react-router-dom";
import "./Landing.css";
import cultureImg from "../../assets/culture.jpeg";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="land-bg">
      <nav className="navbar">
        <h1 className="brand-title">KalaSetu</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate("/signup")}>Sign Up</button>
          <button onClick={() => navigate("/signin")}>Login</button>
          <button onClick={() => {
            document.getElementById("about").scrollIntoView({ behavior: "smooth" });
            }}>About
          </button>
        </div>
      </nav>

      <div className="container">
        {/* LEFT SECTION */}
        <div className="left">
          <h1>Celebrate Culture and <br/>Build Your Journey</h1>

          <button className="primary-btn" onClick={() => 
            navigate("/signin")}>Login
          </button>

          <button className="secondary-btn" onClick={() => 
            navigate("/signup")}>Sign Up</button>

          <p className="terms">By continuing, you agree to our
            <span> Terms</span> and <span> Privacy Policy</span>
          </p>

          <p className="join">New here?{" "}
            <span onClick={() => navigate("/signup")}>Join the community</span>
         </p>
       </div>

        {/* RIGHT SECTION */}
        <div className="right">
          <img src={cultureImg} alt="Indian Cultural Arts"/>
        </div>
      </div>
      {/* ABOUT */}
      <div id="about" className="about-section">
        <h2 className="about-title">About KalaSetu</h2>
        <p className="about-intro">
          KalaSetu is a cultural networking platform connecting artisans and NGOs across India.
          It empowers traditional artists to showcase their skills and preserve heritage in the digital age.
        </p>
        <div className="about-cards">
          <div className="about-card">
            <h3>🎨 Empower Artisans</h3>
            <p>
              Provides a digital space for artisans to showcase their skills,
              promote workshops, and increase visibility.
            </p>
          </div>

          <div className="about-card">
            <h3>🤝 Connect NGOs</h3>
            <p>
              Enables organizations to discover talented artists,
              collaborate on initiatives, and support cultural projects.
            </p>
          </div>

          <div className="about-card">
            <h3>🌏 Preserve Heritage</h3>
            <p>
              Encourages sustainable growth and recognition for India’s
              diverse art forms through a supportive community.
            </p>
          </div>

        </div>
      </div>

    </div>
    
  );
}

export default Landing;

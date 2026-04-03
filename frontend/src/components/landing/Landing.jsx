import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Landing.css";
import kalasetuLogo from "../../assets/kalasetu_logo.png";
import cultureImg from "../../assets/culture.jpeg";

const artSymbols = ["🎨","🪘","🎭","🌸","🏺","🪁","🧵","🪗","🎋","🌺","🎐","🧿","🪔","🥁","🎻","💫"];

function FloatingSymbol({ symbol, style }) {
  return <span className="float-symbol" style={style}>{symbol}</span>;
}

function CountUp({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const MODAL_CONTENT = {
  terms: {
    title: "Terms of Service",
    body: [
      { heading: "1. Acceptance", text: "By creating an account on KalaSetu, you agree to these Terms of Service." },
      { heading: "2. Eligibility", text: "You must be at least 13 years old to use KalaSetu. By registering, you confirm that the information you provide is accurate and complete." },
      { heading: "3. User Conduct", text: "You agree not to post content that is harmful, offensive, or violates any applicable law. KalaSetu reserves the right to remove content or suspend accounts that violate these terms." },
      { heading: "4. Intellectual Property", text: "All content you post remains yours. By posting on KalaSetu, you grant us a non-exclusive license to display it on the platform. You must not post content that infringes on others' intellectual property." },
      { heading: "5. Termination", text: "We reserve the right to suspend or terminate your account at any time for violations of these terms. You may also delete your account at any time." },
      { heading: "6. Changes", text: "We may update these terms from time to time. Continued use of KalaSetu after changes constitutes acceptance of the new terms." },
    ]
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      { heading: "1. Information We Collect", text: "We collect your name, email, username, and profile details you provide during registration and profile setup." },
      { heading: "2. How We Use It", text: "Your information is used to operate the platform, personalise your experience, and enable communication between users. We do not sell your data to third parties." },
      { heading: "3. Data Storage", text: "Your data is stored securely in our database. Passwords are hashed using bcrypt and are never stored in plain text." },
      { heading: "4. Cookies", text: "KalaSetu uses JWT tokens stored in your browser for authentication. We do not use third-party tracking cookies." },
      { heading: "5. Your Rights", text: "You can update or delete your profile information at any time. To request full account deletion, contact us directly." },
      { heading: "6. Contact", text: "For any privacy-related concerns, reach out to us at support@kalasetu.in." },
    ]
  }
};

function PolicyModal({ type, onClose }) {
  const { title, body } = MODAL_CONTENT[type];
  return (
    <div className="l-modal-overlay" onClick={onClose}>
      <div className="l-modal" onClick={e => e.stopPropagation()}>
        <div className="l-modal-header">
          <h3>{title}</h3>
          <button className="l-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="l-modal-body">
          {body.map((section, i) => (
            <div key={i} className="l-modal-section">
              <h4>{section.heading}</h4>
              <p>{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [showTop, setShowTop] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [symbols] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      symbol: artSymbols[i % artSymbols.length],
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        fontSize: `${16 + Math.random() * 28}px`,
        animationDuration: `${6 + Math.random() * 10}s`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: 0.12 + Math.random() * 0.18,
      },
    }))
  );

  return (
    <div className="l-root">
      {/* Floating background symbols */}
      <div className="l-particles">
        {symbols.map((s, i) => <FloatingSymbol key={i} {...s} />)}
      </div>

      {/* Navbar */}
      <nav className="l-nav">
        <div className="l-brand">
          <img src={kalasetuLogo} alt="KalaSetu" className="l-brand-logo" />
          <span className="l-brand-text">KalaSetu</span>
        </div>
        <div className="l-nav-links">
          <button className="l-nav-ghost" onClick={() => document.getElementById("about").scrollIntoView({ behavior: "smooth" })}>
            About
          </button>
          <button className="l-nav-ghost" onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}>
            Features
          </button>
          <button className="l-btn-outline" onClick={() => navigate("/signin")}>
            Sign In
          </button>
          <button className="l-btn-solid" onClick={() => navigate("/signup")}>
            Join Free →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero">
        <div className="l-hero-left">
          <h3 className="l-hero-title">
            Where <span className="l-accent">Art</span> Finds<br />
            Its <span className="l-accent-2">Voice</span>
          </h3>
          <p className="l-hero-sub">
            KalaSetu connects traditional artisans, NGOs, and culture lovers
            across India — preserving heritage, one story at a time.
          </p>
          <div className="l-hero-actions">
            <button className="l-cta-primary" onClick={() => navigate("/signup")}>
              ✨ Create Free Account
            </button>
            <button className="l-cta-secondary" onClick={() => navigate("/signin")}>
              Already a member? Sign in
            </button>
          </div>
          <p className="l-terms">
            By joining, you agree to our <span onClick={() => setModal("terms")}>Terms</span> & <span onClick={() => setModal("privacy")}>Privacy Policy</span>
          </p>
        </div>

        <div className="l-hero-right">
          <img src={cultureImg} alt="Indian Culture" className="l-culture-img" />
        </div>
      </section>

      {/* Stats */}
      <section className="l-stats">
        <div className="l-stat">
          <div className="l-stat-num"><CountUp target={1200} suffix="+" /></div>
          <div className="l-stat-label">Artisans</div>
        </div>
        <div className="l-stat-divider" />
        <div className="l-stat">
          <div className="l-stat-num"><CountUp target={340} suffix="+" /></div>
          <div className="l-stat-label">NGOs</div>
        </div>
        <div className="l-stat-divider" />
        <div className="l-stat">
          <div className="l-stat-num"><CountUp target={28} suffix=" States" /></div>
          <div className="l-stat-label">Covered</div>
        </div>
        <div className="l-stat-divider" />
        <div className="l-stat">
          <div className="l-stat-num"><CountUp target={5000} suffix="+" /></div>
          <div className="l-stat-label">Posts Shared</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="l-features">
        <div className="l-section-tag">Why KalaSetu?</div>
        <h2 className="l-section-title">Everything you need to<br />share your culture</h2>
        <div className="l-features-grid">
          <div className="l-feature-card l-feature-highlight">
            <div className="l-feature-icon">🎨</div>
            <h3>Showcase Your Art</h3>
            <p>Create a rich profile with your skills, location, and cultural story. Let the world discover your craft.</p>
          </div>
          <div className="l-feature-card l-feature-highlight">
            <div className="l-feature-icon">🤝</div>
            <h3>Connect & Collaborate</h3>
            <p>Message artisans, partner with NGOs, and build meaningful relationships that grow your reach.</p>
          </div>
          <div className="l-feature-card l-feature-highlight">
            <div className="l-feature-icon">📢</div>
            <h3>Promote Events</h3>
            <p>Announce workshops, cultural events, and exhibitions to a passionate community that cares.</p>
          </div>
          <div className="l-feature-card l-feature-highlight">
            <div className="l-feature-icon">🔍</div>
            <h3>Discover Creators</h3>
            <p>Search artisans and NGOs by skill, location, or art form. Find inspiration from across India.</p>
          </div>
          <div className="l-feature-card l-feature-highlight">
            <div className="l-feature-icon">🌏</div>
            <h3>Preserve Heritage</h3>
            <p>Every post, every story, every connection helps keep India's traditional art forms alive and thriving.</p>
          </div>
          <div className="l-feature-card l-feature-highlight">
            <div className="l-feature-icon">⭐</div>
            <h3>Free to Join</h3>
            <p>Sign up as a user, then upgrade to Artisan or NGO for free. No hidden fees, ever.</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="l-about">
        <div className="l-about-inner">
          <div className="l-about-text">
            <div className="l-section-tag">Our Mission</div>
            <h2>Bridging tradition<br />with technology</h2>
            <p>
              India has over 3,000 traditional art forms — many on the edge of being forgotten.
              KalaSetu was built to change that. We give artisans a digital stage, help NGOs
              find the right partners, and invite everyone to celebrate India's living heritage.
            </p>
            <button className="l-cta-primary" onClick={() => navigate("/signup")}>
              Join the Movement →
            </button>
          </div>
          <div className="l-about-cards">
            <div className="l-about-card">
              <span>🎨</span>
              <h4>Empower Artisans</h4>
              <p>Showcase skills, promote workshops, and build a digital following.</p>
            </div>
            <div className="l-about-card">
              <span>🤝</span>
              <h4>Connect NGOs</h4>
              <p>Find talented artists, collaborate on initiatives, and amplify impact.</p>
            </div>
            <div className="l-about-card">
              <span>🌏</span>
              <h4>Preserve Heritage</h4>
              <p>Every story shared keeps a tradition alive for the next generation.</p>
            </div>
          </div>
        </div>
      </section>

      {modal && <PolicyModal type={modal} onClose={() => setModal(null)} />}

      {/* Scroll to Top */}
      {showTop && (
        <button className="l-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top">
          ▲
        </button>
      )}

      {/* CTA Banner */}
      <section className="l-cta-banner">
        <div className="l-cta-banner-content">
          <h2>Ready to share your culture?</h2>
          <p>Join thousands of artisans and NGOs already on KalaSetu</p>
          <div className="l-cta-banner-btns">
            <button className="l-btn-white" onClick={() => navigate("/signup")}>
              ✨ Create Free Account
            </button>
            <button className="l-btn-white-outline" onClick={() => navigate("/signin")}>
              Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
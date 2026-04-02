import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";
import kalasetuLogo from "../../assets/kalasetu_logo.png";

const floatingIcons = [
  "fi fi-sr-palette",
  "fi fi-sr-sparkles",
  "fi fi-sr-image",
  "fi fi-sr-comments",
  "fi fi-sr-calendar",
  "fi fi-sr-heart",
];

const artCards = [
  { icon: "fi fi-sr-palette", title: "Madhubani Painting", region: "Bihar, India" },
  { icon: "fi fi-sr-comments", title: "Folk Storytelling", region: "Rajasthan, India" },
  { icon: "fi fi-sr-image", title: "Banarasi Weaving", region: "Varanasi, India" },
  { icon: "fi fi-sr-sparkles", title: "Pottery Craft", region: "Kutch, India" },
  { icon: "fi fi-sr-heart", title: "Kathakali Dance", region: "Kerala, India" },
  { icon: "fi fi-sr-calendar", title: "Festival Workshops", region: "Across India" },
];

const featureCards = [
  {
    icon: "fi fi-sr-palette",
    title: "Showcase Your Art",
    text: "Build a profile that highlights your skills, location, and cultural identity in one place.",
  },
  {
    icon: "fi fi-sr-comments",
    title: "Connect and Collaborate",
    text: "Start conversations with artisans, NGOs, and cultural partners who can help your work grow.",
  },
  {
    icon: "fi fi-sr-calendar",
    title: "Promote Events",
    text: "Share workshops, performances, and community programs with people who care about heritage.",
  },
  {
    icon: "fi fi-sr-search",
    title: "Discover Creators",
    text: "Search by skill, location, or category to find makers and organisations across India.",
  },
  {
    icon: "fi fi-sr-heart",
    title: "Preserve Heritage",
    text: "Every story, collaboration, and post helps keep living traditions visible and valued.",
  },
  {
    icon: "fi fi-sr-sparkles",
    title: "Free to Join",
    text: "Start as a member, then upgrade to Artisan or NGO when you are ready to participate fully.",
  },
];

const missionCards = [
  {
    icon: "fi fi-sr-palette",
    title: "Empower Artisans",
    text: "Give makers a digital stage to present their craft and attract meaningful opportunities.",
  },
  {
    icon: "fi fi-sr-comments",
    title: "Connect NGOs",
    text: "Help organisations find trusted creative partners for outreach, education, and cultural impact.",
  },
  {
    icon: "fi fi-sr-heart",
    title: "Preserve Heritage",
    text: "Turn every profile, post, and collaboration into a record of living Indian culture.",
  },
];

function FloatingSymbol({ iconClass, style }) {
  return (
    <span className="float-symbol" style={style}>
      <i className={iconClass} />
    </span>
  );
}

function CountUp({ target, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const MODAL_CONTENT = {
  terms: {
    title: "Terms of Service",
    body: [
      { heading: "1. Acceptance", text: "By creating an account on KalaSetu, you agree to these Terms of Service." },
      {
        heading: "2. Eligibility",
        text: "You must be at least 13 years old to use KalaSetu and the information you provide must be accurate.",
      },
      {
        heading: "3. User Conduct",
        text: "You agree not to post harmful, offensive, or unlawful content. KalaSetu may remove content that violates these rules.",
      },
      {
        heading: "4. Intellectual Property",
        text: "Your content remains yours. By posting on KalaSetu, you allow us to display it on the platform.",
      },
      {
        heading: "5. Termination",
        text: "We may suspend or terminate accounts that violate these terms. You may also stop using the platform at any time.",
      },
      {
        heading: "6. Changes",
        text: "We may update these terms from time to time. Continued use means you accept the revised version.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      {
        heading: "1. Information We Collect",
        text: "We collect the details you provide during registration and profile creation, such as your name, email, and profile information.",
      },
      {
        heading: "2. How We Use It",
        text: "Your information helps us operate the platform, personalise your experience, and enable trusted communication.",
      },
      {
        heading: "3. Data Storage",
        text: "Your information is stored securely in our database and passwords are hashed before storage.",
      },
      {
        heading: "4. Cookies",
        text: "KalaSetu uses JWT tokens in your browser for authentication and does not rely on third-party tracking cookies.",
      },
      {
        heading: "5. Your Rights",
        text: "You can update your profile information at any time and may request full account deletion if needed.",
      },
      {
        heading: "6. Contact",
        text: "For privacy-related questions, reach out to support@kalasetu.in.",
      },
    ],
  },
};

function PolicyModal({ type, onClose }) {
  const { title, body } = MODAL_CONTENT[type];

  return (
    <div className="l-modal-overlay" onClick={onClose}>
      <div className="l-modal" onClick={(event) => event.stopPropagation()}>
        <div className="l-modal-header">
          <h3 className="display-serif">{title}</h3>
          <button className="l-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="l-modal-body">
          {body.map((section, index) => (
            <div key={index} className="l-modal-section">
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
  const [icons] = useState(() =>
    Array.from({ length: 18 }, (_, index) => ({
      iconClass: floatingIcons[index % floatingIcons.length],
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        fontSize: `${18 + Math.random() * 26}px`,
        animationDuration: `${7 + Math.random() * 9}s`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: 0.09 + Math.random() * 0.12,
      },
    }))
  );

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 320);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="l-root">
      <div className="l-particles">
        {icons.map((icon, index) => (
          <FloatingSymbol key={index} {...icon} />
        ))}
      </div>

      <nav className="l-nav">
        <div className="l-brand">
          <img src={kalasetuLogo} alt="KalaSetu" className="l-brand-logo" />
          <div className="l-brand-copy">
            <span className="l-brand-kicker">Cultural network</span>
            <span className="l-brand-text display-serif">KalaSetu</span>
          </div>
        </div>

        <div className="l-nav-links">
          <button
            className="l-nav-ghost"
            onClick={() => document.getElementById("about").scrollIntoView({ behavior: "smooth" })}
          >
            About
          </button>
          <button
            className="l-nav-ghost"
            onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}
          >
            Features
          </button>
          <button className="l-btn-outline" onClick={() => navigate("/signin")}>
            Sign In
          </button>
          <button className="l-btn-solid" onClick={() => navigate("/signup")}>
            Join Free
          </button>
        </div>
      </nav>

      <section className="l-hero">
        <div className="l-hero-left">
          <span className="l-kicker">Built for artisans, NGOs, and cultural organisers</span>
          <h1 className="l-hero-title display-serif">
            Give Indian culture a digital stage that feels alive, trusted, and collaborative.
          </h1>
          <p className="l-hero-sub">
            KalaSetu helps artisans showcase their work, NGOs find the right collaborators, and
            communities discover the stories behind living traditions.
          </p>

          <div className="l-hero-actions">
            <button className="l-cta-primary" onClick={() => navigate("/signup")}>
              Create Free Account
            </button>
            <button className="l-cta-secondary" onClick={() => navigate("/signin")}>
              Already a member? Sign in
            </button>
          </div>

          <p className="l-terms">
            By joining, you agree to our <span onClick={() => setModal("terms")}>Terms</span> and{" "}
            <span onClick={() => setModal("privacy")}>Privacy Policy</span>.
          </p>
        </div>

        <div className="l-hero-right">
          <div className="l-hero-panel">
            <div className="l-panel-top">
              <span className="l-panel-kicker">Featured cultural practices</span>
              <h2 className="display-serif">A platform shaped around stories, people, and place</h2>
            </div>

            <div className="l-art-grid">
              {artCards.map((card) => (
                <div key={card.title} className="l-art-card">
                  <span className="l-art-icon">
                    <i className={card.icon} />
                  </span>
                  <p>{card.title}</p>
                  <small>{card.region}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="l-stats">
        <div className="l-stat">
          <div className="l-stat-num">
            <CountUp target={1200} suffix="+" />
          </div>
          <div className="l-stat-label">Artisans</div>
        </div>
        <div className="l-stat-divider" />
        <div className="l-stat">
          <div className="l-stat-num">
            <CountUp target={340} suffix="+" />
          </div>
          <div className="l-stat-label">NGOs</div>
        </div>
        <div className="l-stat-divider" />
        <div className="l-stat">
          <div className="l-stat-num">
            <CountUp target={28} suffix=" states" />
          </div>
          <div className="l-stat-label">Regions covered</div>
        </div>
        <div className="l-stat-divider" />
        <div className="l-stat">
          <div className="l-stat-num">
            <CountUp target={5000} suffix="+" />
          </div>
          <div className="l-stat-label">Posts shared</div>
        </div>
      </section>

      <section id="features" className="l-features">
        <div className="l-section-heading">
          <span className="l-section-tag">Why KalaSetu</span>
          <h2 className="l-section-title display-serif">
            Everything needed to present culture with clarity, trust, and reach
          </h2>
        </div>

        <div className="l-features-grid">
          {featureCards.map((card) => (
            <div key={card.title} className="l-feature-card">
              <span className="l-feature-icon">
                <i className={card.icon} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="l-about">
        <div className="l-about-inner">
          <div className="l-about-text">
            <span className="l-section-tag">Our Mission</span>
            <h2 className="display-serif">Bridging tradition with technology, without losing the human story</h2>
            <p>
              India holds thousands of living art forms, yet many are still difficult to discover,
              support, and sustain online. KalaSetu was created to change that with a platform that
              feels rooted in culture, not generic social media.
            </p>
            <button className="l-cta-primary" onClick={() => navigate("/signup")}>
              Join the Movement
            </button>
          </div>

          <div className="l-about-cards">
            {missionCards.map((card) => (
              <div key={card.title} className="l-about-card">
                <span className="l-about-icon">
                  <i className={card.icon} />
                </span>
                <div>
                  <h4>{card.title}</h4>
                  <p>{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-cta-banner">
        <div className="l-cta-banner-content">
          <span className="l-section-tag light">Start your cultural profile</span>
          <h2 className="display-serif">Ready to share your work with a wider community?</h2>
          <p>Join KalaSetu and turn your profile into a space for connection, discovery, and collaboration.</p>
          <div className="l-cta-banner-btns">
            <button className="l-btn-white" onClick={() => navigate("/signup")}>
              Create Free Account
            </button>
            <button className="l-btn-white-outline" onClick={() => navigate("/signin")}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {modal && <PolicyModal type={modal} onClose={() => setModal(null)} />}

      {showTop && (
        <button
          className="l-scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          Top
        </button>
      )}
    </div>
  );
}

export default Landing;

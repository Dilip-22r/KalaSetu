

import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import "./Landing.css";
import kalasetuLogo from "../../assets/kalasetu_logo.png";
import cultureImg from "../../assets/culture.jpeg";
import IntroAnimation from "./Introanimation";
import TiltedCard from "../common/TiltedCard/TiltedCard";
import ClickSpark from "../common/ClickSpark/ClickSpark";
import Footer from "../common/Footer";

const artSymbols = ["🎨", "🪘", "🎭", "🌸", "🏺", "🪁", "🧵", "🪗", "🎋", "🌺", "🎐", "🧿", "🪔", "🥁", "🎻", "💫"];

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



const featuresData = [
  { icon: "🎨", title: "Showcase Your Art", text: "Create a rich profile with your skills, location, and cultural story. Let the world discover your craft." },
  { icon: "🤝", title: "Connect & Collaborate", text: "Message artisans, partner with NGOs, and build meaningful relationships that grow your reach." },
  { icon: "📢", title: "Promote Events", text: "Announce workshops, cultural events, and exhibitions to a passionate community that cares." },
  { icon: "🔍", title: "Discover Creators", text: "Search artisans and NGOs by skill, location, or art form. Find inspiration from across India." },
  { icon: "🌏", title: "Preserve Heritage", text: "Every post, every story, every connection helps keep India's traditional art forms alive and thriving." },
  { icon: "⭐", title: "Free to Join", text: "Sign up as a user, then upgrade to Artisan or NGO for free. No hidden fees, ever." }
];

// Intro animation plays on every page load/reload
let hasPlayedIntro = false;

function Landing() {
  const navigate = useNavigate();
  const [introDone, setIntroDone] = useState(hasPlayedIntro);
  const [showTop, setShowTop] = useState(false);
  const featuresRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const { scrollYProgress } = useScroll({
    target: featuresRef,
    offset: ["start start", "end end"]
  });

  // Direct transform — no spring so it tracks scroll 1:1 without jitter
  // Use [0.05, 0.95] input range so animation is fully done before sticky exits,
  // avoiding dead whitespace zones at start and end
  const x = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "-48%"]);

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

  // show intro first
  if (!introDone) {
    return <IntroAnimation onDone={() => {
      hasPlayedIntro = true;
      setIntroDone(true);
    }} />;
  }

  return (
    <ClickSpark
      sparkColor="#4A8B8F"
      sparkSize={12}
      sparkRadius={18}
      sparkCount={10}
      duration={450}
    >
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
            <button className="l-nav-ghost" onClick={() => { const el = document.getElementById("features"); if (el) { const top = el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top, behavior: "smooth" }); } }}>
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
          </div>

          <div className="l-hero-right">
            <TiltedCard
              imageSrc={cultureImg}
              altText="Indian Culture"
              captionText="KalaSetu"
              containerHeight="400px"
              containerWidth="100%"
              imageHeight="400px"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={true}
            />
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

        {/* Features Scroll Section */}
        <section id="features" ref={featuresRef} className="l-features-scroll-container">
          <div className="l-features-sticky">
            <div className="l-features-header">
              <div className="l-section-tag">WHY KALASETU?</div>
              <h2 className="l-section-title">Everything you need to<br />share your culture</h2>
            </div>
            
            <div className="l-features-track-container">
              <motion.div style={{ x }} className="l-features-track">
                {featuresData.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="l-feature-card"
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.08,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    whileHover={{
                      y: -8,
                      boxShadow: "0 16px 40px rgba(0,0,0,0.1)",
                      borderColor: "rgba(74,139,143,0.35)"
                    }}
                  >
                    <div className="l-feature-icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </motion.div>
                ))}
              </motion.div>
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
              <button className="l-cta-primary" onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}>
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
              <button className="l-btn-white" onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}>
                ✨ Create Free Account
              </button>
              <button className="l-btn-white-outline" onClick={() => navigate("/signin")}>
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* GitHub-Style Footer */}
        <Footer />
      </div>
    </ClickSpark>
  );
}

export default Landing;
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./Footer.css";
import kalasetuLogo from "../../assets/kalasetu_logo.png";

export default function Footer() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <>
      <footer className="ks-compact-footer">
        <div className="ks-compact-container">
          <div className="ks-compact-left" onClick={() => { window.scrollTo(0, 0); navigate("/"); }}>
            <img src={kalasetuLogo} alt="KalaSetu" className="ks-compact-logo" />
            <span className="ks-compact-brand">KalaSetu</span>
            <span className="ks-compact-copy">&copy; {new Date().getFullYear()} Preserving Indian Cultural Heritage</span>
          </div>

          <div className="ks-compact-right">
            <div className="ks-compact-links">
              <button onClick={() => { window.scrollTo(0, 0); navigate("/search"); }}>Artisans</button>
              <button onClick={() => setModal("guidelines")}>Guidelines</button>
              <button onClick={() => setModal("privacy")}>Privacy</button>
              <button onClick={() => setModal("terms")}>Terms</button>
              <button onClick={() => showToast("✉️ Support & Grievance: support@kalasetu.in")}>Contact</button>
            </div>

            <div className="ks-compact-socials">
              <button onClick={() => showToast("📸 Follow our artisan showcases on Instagram: @kalasetu.in")} aria-label="Instagram"><i className="fi fi-sr-camera" /></button>
              <button onClick={() => showToast("📘 Join our NGO partner network on Facebook")} aria-label="Facebook"><i className="fi fi-sr-social-network" /></button>
              <button onClick={() => showToast("▶️ Watch heritage documentary shorts on YouTube")} aria-label="YouTube"><i className="fi fi-sr-play-alt" /></button>
            </div>
          </div>
        </div>
      </footer>

      {modal && createPortal(
        <div className="ks-modal-overlay" onClick={() => setModal(null)}>
          <div className="ks-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ks-modal-header">
              <h2 className="display-serif">
                {modal === "guidelines" ? "Community Guidelines" : modal === "privacy" ? "Privacy Policy" : "Terms of Service"}
              </h2>
              <button className="ks-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="ks-modal-body">
              {modal === "guidelines" && (
                <>
                  <p><strong>1. Respect for Traditional Heritage:</strong> KalaSetu is a sanctuary for authentic Indian arts, crafts, and performing traditions. All members are expected to interact with dignity and respect towards creators.</p>
                  <p><strong>2. Authentic Representation:</strong> Artisans and NGOs must accurately represent their location, heritage art form, and community impact. Misrepresentation or cultural appropriation is strictly prohibited.</p>
                </>
              )}
              {modal === "privacy" && (
                <>
                  <p><strong>Protecting Creator Privacy:</strong> KalaSetu treats the contact information, geographical origin, and financial details of rural artisans and non-profits with paramount security.</p>
                  <p><strong>Data Minimization:</strong> We only collect necessary authentication data to facilitate community discovery and direct secure communications. Your personal data is never sold to marketing aggregators or third parties.</p>
                </>
              )}
              {modal === "terms" && (
                <>
                  <p><strong>Platform Purpose:</strong> KalaSetu operates as a dedicated bridge for cultural preservation and empowerment. By registering as an Artisan, NGO, or enthusiast, you agree to foster non-commercial exploitation and uphold the integrity of our cultural archive.</p>
                  <p><strong>Intellectual Property:</strong> All photos, stories, and artworks posted remain the absolute copyright of the respective creators.</p>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && createPortal(
        <div className="ks-toast">
          <span className="ks-toast-icon">✨</span>
          <span>{toast}</span>
        </div>,
        document.body
      )}
    </>
  );
}

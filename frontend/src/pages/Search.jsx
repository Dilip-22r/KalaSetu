import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Search.css";
import Navbar from "../components/common/Navbar";
import { useAuthStore } from "../store/useAuthStore";

const API = "http://localhost:5000";

function Search() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const user = authUser ?? JSON.parse(localStorage.getItem("user") || "null");

  const [tab, setTab] = useState("creators");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [results, setResults] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await axios.get(`${API}/profiles/creators`, { params });
      const filtered = user ? res.data.filter((profile) => profile.user?._id !== user._id) : res.data;
      setResults(filtered);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [search, typeFilter, user]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.category = typeFilter;
      const res = await axios.get(`${API}/posts`, { params });
      setPosts(res.data);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    if (tab === "creators") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCreators();
      return;
    }
    fetchPosts();
  }, [fetchCreators, fetchPosts, tab]);

  return (
    <div className="search-bg">
      <Navbar />

      <div className="s-container">
        <div className="s-header">
          <h2><i className="fi fi-sr-search" /> Explore KalaSetu</h2>
          <p>Discover artisans, NGOs, and cultural content from across India</p>
        </div>

        <div className="s-tabs">
          <button
            className={tab === "creators" ? "active" : ""}
            onClick={() => {
              setTab("creators");
              setSearch("");
              setTypeFilter("");
            }}
          >
            <i className="fi fi-sr-user" /> Artisans & NGOs
          </button>
          <button
            className={tab === "posts" ? "active" : ""}
            onClick={() => {
              setTab("posts");
              setSearch("");
              setTypeFilter("");
            }}
          >
            <i className="fi fi-sr-image" /> Cultural Posts
          </button>
        </div>

        <div className="s-filters">
          <input
            type="text"
            placeholder={tab === "creators" ? "Search by name, skills, location..." : "Search posts..."}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="s-input"
          />
          {tab === "creators" ? (
            <select className="s-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All Types</option>
              <option value="artisan">Artisan</option>
              <option value="ngo">NGO</option>
            </select>
          ) : (
            <select className="s-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All Categories</option>
              <option value="event">Events</option>
              <option value="artwork">Artwork</option>
              <option value="story">Stories</option>
              <option value="workshop">Workshops</option>
              <option value="announcement">Announcements</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="s-loading">
            <div className="s-spinner"></div>
          </div>
        ) : tab === "creators" ? (
          results.length === 0 ? (
            <div className="s-empty">
              <span><i className="fi fi-sr-search" /></span>
              <p>No creators found</p>
            </div>
          ) : (
            <div className="s-grid">
              {results.map((profile) => (
                <div
                  key={profile._id}
                  className="creator-card"
                  onClick={() => navigate(`/profile/${profile.user?._id}`)}
                >
                  <div className="creator-avatar">
                    {profile.photo ? <img src={profile.photo} alt="" /> : <span>{profile.user?.username?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="creator-info">
                    <h3>{profile.displayName || profile.user?.fullName}</h3>
                    <span className={`s-role ${profile.user?.role}`}>{profile.user?.role}</span>
                    {profile.skills && <p className="creator-skills"><i className="fi fi-sr-palette" /> {profile.skills}</p>}
                    {profile.location && <p className="creator-location"><i className="fi fi-sr-map-marker" /> {profile.location}</p>}
                  </div>
                  <button className="view-btn"><i className="fi fi-sr-circle-user" /> View Profile</button>
                </div>
              ))}
            </div>
          )
        ) : posts.length === 0 ? (
          <div className="s-empty">
            <span><i className="fi fi-sr-image" /></span>
            <p>No posts found</p>
          </div>
        ) : (
          <div className="s-posts">
            {posts.map((post) => (
              <div key={post._id} className="s-post-card">
                {post.image && <img src={post.image} alt="" className="s-post-img" />}
                <div className="s-post-body">
                  <span className="s-post-cat">{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.content}</p>
                  <div className="s-post-meta">
                    <span className="s-post-author" onClick={() => navigate(`/profile/${post.author?._id}`)}>
                      by {post.author?.fullName}
                    </span>
                    <span className="s-post-likes"><i className="fi fi-sr-heart" /> {post.likes?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;

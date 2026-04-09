import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import Landing from "./components/landing/Landing";
import SignUp from "./components/signUp/SignUp";
import SignIn from "./components/signIn/SignIn";
import Home from "./components/home/Home";
import Register from "./components/register/Register";
import Search from "./pages/Search";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import Settings from "./pages/Settings";
import "./App.css";
import "./index.css";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/edit-post/:postId" element={<EditPost />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./components/landing-demo/Landing";
import SignUp from "./components/signUp-demo/SignUp";
import SignIn from "./components/signIn-demo/SignIn";
import Home from "./components/home-demo/Home";
import Register from "./components/register-demo/Register";
import Search from "./pages/Search";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import CreatePost from "./pages/CreatePost";

function App() {
  return (
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;

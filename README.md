# KalaSetu

> *Kala* (Art) + *Setu* (Bridge) — A cultural networking platform bridging artisans, NGOs, and art lovers across India

---

## 📌 Overview

KalaSetu is a full-stack web application that connects traditional artisans and cultural NGOs with a wider audience. Users can explore cultural posts, discover creators, and engage with India's rich artistic heritage. Registered artisans and NGOs gain additional powers — creating posts, promoting events, and messaging each other directly.

---

## ✨ Features

### 🌐 Public / All Users
- Beautiful landing page with About section
- Sign Up & Sign In with JWT-based authentication
- Default role assigned as `user` on registration
- Browse and search cultural posts (by keyword, category)
- Explore artisans and NGOs
- Like posts

### ⭐ Registered Artisans & NGOs
- Full profile page with skills, location, bio, and photo
- Create cultural posts (stories, events, artwork, workshops, announcements)
- Tag posts for better discoverability
- Send and receive direct messages with other creators
- Role badge displayed across the platform

### 👤 Profile System
- Every user gets a profile page automatically (basic info shown even before registration)
- Registered users get a rich profile with all details and their posts
- `user` role sees a prompt to register when clicking Edit Profile
- Artisan/NGO role can navigate to edit their profile

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React (Vite), React Router, Axios   |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB, Mongoose                   |
| Auth      | JWT (JSON Web Tokens), bcryptjs     |
| Styling   | Custom CSS (no UI framework)        |

---

## 📁 Project Structure

```
kalasetu/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification middleware
│   ├── models/
│   │   ├── User.js                # User schema (fullName, email, username, password, role)
│   │   ├── Post.js                # Post schema (title, content, category, tags, image, likes)
│   │   ├── Message.js             # Message schema (sender, receiver, text, read)
│   │   └── Profile.js             # Profile schema (skills, location, about, photo, etc.)
│   ├── routes/
│   │   ├── authRoutes.js          # /auth — signup, login, upgrade-role
│   │   ├── postRoutes.js          # /posts — CRUD, like, search
│   │   ├── messageRoutes.js       # /messages — send, conversations, inbox
│   │   └── profileRoutes.js       # /profiles — create, get, search creators
│   ├── server.js                  # Express app entry point
│   ├── .env.example               # Environment variable template
│   └── package.json
│
└── frontend/
    └── src/
        ├── components/
        │   ├── landing-demo/      # Landing page
        │   ├── signUp-demo/       # Sign Up page
        │   ├── signIn-demo/       # Sign In page
        │   ├── home-demo/         # Dashboard with posts feed
        │   └── register-demo/     # Artisan/NGO registration form
        ├── pages/
        │   ├── Search.jsx         # Explore artisans, NGOs, and posts
        │   ├── Messages.jsx       # Chat interface (artisan/NGO only)
        │   ├── Profile.jsx        # User profile page
        │   └── CreatePost.jsx     # Post creation form (artisan/NGO only)
        ├── App.jsx                # Routes definition
        └── main.jsx               # React entry point
```

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/kalasetu.git
cd kalasetu
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kalasetu
JWT_SECRET=your_super_secret_key_here
```

Start the backend server:

```bash
node server.js
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

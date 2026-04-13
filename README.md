<div align="center">
  <img src="./frontend/src/assets/kalasetu_logo.png" alt="KalaSetu Logo" width="120" />
  <h1>KalaSetu</h1>
  <p><strong>Bridging Tradition and Technology</strong></p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
</div>

---

## 💡 Problem Statement

Traditional artisans struggle to reach a broader audience in a digital-first world. Their work often remains limited to local markets, lacking visibility, fair pricing, and direct customer interaction. At the same time, buyers seeking authentic, handmade products face difficulty discovering genuine creators.

## 🚀 The Solution

**KalaSetu** acts as a digital bridge between artisans and the modern marketplace. It is a cultural networking platform designed to empower creators and preserve India's rich artistic heritage.

It enables:
- **Direct interaction** between creators.
- **Real-time communication** and collaboration.
- A **scalable platform** to showcase and preserve cultural craftsmanship.

By combining technology with tradition, KalaSetu transforms how art is discovered and valued.

---

## ✨ Core Value Propositions

- 🎭 **Direct Marketplace** – Connect artisans with buyers without intermediaries.
- 💬 **Real-time Communication** – Built-in messaging for seamless interaction.
- 🛡️ **Secure & Scalable Backend** – Powered by a robust MERN stack with JWT security.
- 📊 **Cultural Preservation** – A dedicated space for stories, workshops, and traditional art forms.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), Framer Motion, GSAP, Zustand |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB, Mongoose |
| **Security** | JWT, bcryptjs, Helmet, Rate Limiting |
| **Styling** | Custom CSS (Modern Aesthetic) |

---

## 🔌 API Overview

KalaSetu features a modular and secure REST API. Key modules include:

- **Authentication** – Secure login, registration, and role-based access control.
- **Profiles** – Comprehensive artisan and NGO profile management.
- **Messaging** – Real-time direct messaging powered by Socket.io.
- **Content Feed** – Cultural posts with likes, comments, and repost functionality.

📄 *Detailed API documentation is available in [`API.md`](./API.md)*

---

## 🚀 Future Roadmap (Product Ecosystem)

- 🤖 **KalaSetu AI** – AI-based craft recognition and personalized recommendations.
- 🖼️ **Virtual Setu** – Immersive virtual exhibitions and 3D galleries.
- 📱 **Setu Connect** – Advanced collaboration tools for artisans and NGOs.
- 📱 **Setu Mobile** – dedicated mobile application for wider accessibility.
- 🌍 **Global Expansion** – Connecting local artisans with a worldwide audience.

---

## 🌟 Why This Project Matters

KalaSetu is more than a technical project — it is an initiative to preserve and promote cultural heritage through technology. It demonstrates how software engineering can create real-world impact by:
- **Empowering local communities** through digital visibility.
- **Preserving traditional art forms** for future generations.
- **Building scalable digital ecosystems** that prioritize human connection.

---

## 📁 Project Structure

```bash
kalasetu/
├── backend/ # Node.js & Express API
│   ├── models/ # Mongoose Schemas
│   ├── routes/ # API Endpoints
│   └── middleware/ # Security & Validation
└── frontend/ # React (Vite) Application
    ├── src/
    │   ├── components/ # Atomic UI Components
    │   ├── pages/ # Main views & Routing
    │   └── store/ # State Management (Zustand)
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v14+)
- MongoDB (Atlas or Local)

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env based on example
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

<div align="center">
  🚧 <b>Live Demo: https://kala-setu-indol.vercel.app/</b>
</div>

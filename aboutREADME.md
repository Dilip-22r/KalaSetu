# KalaSetu (MainWad) - Comprehensive Technical Documentation

This document serves as the complete technical inventory and architectural overview for the **KalaSetu (MainWad)** application. It catalogs every security, safety, architecture, and advanced feature integrated into the platform.

---

## 🏗 System Architecture Overview

KalaSetu is built on a modern, decoupled **MERN stack** (MongoDB, Express.js, React, Node.js) with real-time capabilities. 

### How Modules Interact
1. **Client (Frontend):** React (Vite) interacts with the user, maintaining global state via **Zustand** stores. It communicates with the backend via RESTful HTTP requests using **Axios** and establishes persistent bidirectional WebSocket connections using **Socket.io-client**.
2. **Server (Backend):** The Node.js/Express backend acts as the core engine. It routes requests through a robust middleware pipeline (security, sanitization, rate limiting) into modular controllers that handle the business logic.
3. **Database Layer:** **Mongoose** serves as the ODM to communicate with a managed **MongoDB Atlas** cluster, enforcing schema validation at the application level before data persistence.
4. **Real-time Layer:** The `Socket.io` server runs concurrently with the HTTP server, managing a centralized mapping of active user sockets to push instant chat messages, online status updates, and notifications.

### Folder Structure Explanation
```text
kalasetu/
├── backend/
│   ├── config/        # Database connection & Swagger/OpenAPI configs
│   ├── controllers/   # Core business logic separated from routes (Auth, Posts, Profiles, etc.)
│   ├── lib/           # Shared libraries (e.g., Socket.io initialization)
│   ├── middleware/    # Security, error handling, rate limiting, and image validation
│   ├── models/        # Mongoose data schemas (User, Post, Message, Report, Transaction, etc.)
│   ├── routes/        # Express route definitions mapping endpoints to controllers
│   ├── server.js      # Entry point (HTTP + WebSocket server binding)
│   └── app.js         # Express app configuration & middleware pipeline
└── frontend/
    ├── src/
    │   ├── assets/    # Static media (images, icons)
    │   ├── components/# Reusable UI components (atomic design)
    │   ├── pages/     # Full-page views mapped to router paths
    │   ├── store/     # Zustand state slices (Auth, Cart, Chat, Feed, Notifications)
    │   └── utils/     # Helpers (Axios interceptors, image cropper)
    ├── vite.config.js # Frontend build and HMR configuration
    └── vercel.json    # Deployment routing configs for Vercel
```

---

## 🛡️ Security Features

The backend implements a comprehensive "Defense in Depth" strategy:

*   **Authentication & Authorization:** 
    *   Stateless authentication using **JSON Web Tokens (JWT)** (`jsonwebtoken`).
    *   Secure password hashing using **bcryptjs**.
    *   Role-based access control checking (Admin/User/Artisan).
*   **API Security & Headers:** 
    *   **Helmet** (`helmet`): Secures Express apps by setting various HTTP headers (X-Frame-Options, Strict-Transport-Security, etc.).
    *   **CORS** (`cors`): Strictly configured Cross-Origin Resource Sharing allowing only specific domains (localhost, Vercel deployments, and explicitly allowed origins via environment).
*   **Sanitization & Validation:**
    *   **Express Mongo Sanitize** (`express-mongo-sanitize`): Prevents NoSQL Injection attacks by stripping MongoDB operators (`$`, `.`) from inputs.
    *   **XSS Protection** (`xss`): Custom middleware recursively sanitizes request bodies, stripping out malicious HTML/scripts to prevent Cross-Site Scripting.
*   **Rate Limiting & Abuse Prevention:**
    *   **Express Rate Limit** (`express-rate-limit`): Global API rate limiter protecting against brute-force and DDoS attacks.
*   **Environment Variable Protection:** 
    *   Secrets managed securely using **dotenv** and completely excluded from version control (`.gitignore`).
*   **Session Management:**
    *   **Express Session** & **Cookie Parser**: Used for tracking non-auth specific state securely (e.g., guest tracking, HTTP-only secure cookies in production).

---

## 🚦 Safety and Monitoring Features

*   **Centralized Error Handling:** A global error handler middleware (`errorHandler.js`) catches unhandled exceptions, logs them with timestamps, and formats safe responses (hiding stack traces in production).
*   **Logging:** Server-side request/error logging mapped to endpoints and methods.
*   **Fail-safe Systems & Data Integrity:** Mongoose strict schemas validate data types, required fields, and uniqueness before writing to the database.
*   **Database Backups:** Entrusted to MongoDB Atlas automated continuous backup systems.

---

## 💻 Frontend Technologies and UI Frameworks

*   **Core Library:** **React 19** for building highly interactive, component-driven user interfaces.
*   **Build Tool:** **Vite**, chosen for its extremely fast Hot Module Replacement (HMR) and optimized rollup production builds.
*   **Routing:** **React Router DOM v7** for seamless client-side navigation.
*   **Styling & UI Aesthetics:** High-end Vanilla CSS utilizing CSS variables, responsive media queries, and modern aesthetic choices (glassmorphism, tailored color palettes).
*   **Animations:** 
    *   **Framer Motion** (`framer-motion`) and **GSAP** (`gsap`) combined to provide rich micro-interactions, page transitions, and fluid dynamic aesthetics.
*   **Forms:** **React Hook Form** for highly performant form validation, minimizing unnecessary re-renders.
*   **Icons:** Integrated with **Flaticon Uicons** (`@flaticon/flaticon-uicons`).

---

## ⚙️ Backend Technologies and APIs

*   **Runtime & Framework:** **Node.js** and **Express.js**.
*   **API Architecture:** RESTful endpoints adhering to strict resource patterns.
*   **OpenAPI Documentation:** Auto-generated interactive API documentation powered by **Swagger UI Express** and **Swagger JSDoc**, available at `/api-docs`.
*   **Network Optimization:** **Compression** (`compression`) middleware implemented to gzip JSON payloads, significantly reducing bandwidth.

---

## 🗄️ Database and Storage Services

*   **Primary Database:** **MongoDB**, a flexible NoSQL database perfectly suited for the dynamic, document-based nature of user profiles, feeds, and real-time chat data.
*   **ODM:** **Mongoose** to enforce structured data modeling.
*   **Storage Handling:** Base64 image uploads are supported (with a safe 12MB body payload limit), processed by the server, and mapped to unique IDs via **uuid**.

---

## ⚡ Real-time Communication Systems

*   **Technology Used:** **Socket.IO** (`socket.io` backend, `socket.io-client` frontend).
*   **Features Implemented:**
    *   Live Online/Offline user tracking (broadcasting active sockets).
    *   Real-time Direct Messaging (Instant delivery between connected peers).
    *   "Seen" Status tracking (Emits specific `mark_seen` and `message_seen` events to dynamically update UI read receipts).
*   **Why it was used:** HTTP polling is inefficient for chat applications. WebSockets provide persistent, low-latency, bidirectional channels critical for a modern messaging experience.

---

## 🧠 State Management Tools

*   **Primary Tool:** **Zustand**.
*   **Architecture:** State is modularized into feature-specific slices:
    *   `useAuthStore.js`: Manages user sessions and JWT tokens.
    *   `useChatStore.js`: Synchronizes active chats and Socket.IO events.
    *   `useFeedStore.js`: Caches and updates the global content feed.
    *   `useCartStore.js` / `useNotificationStore.js`: Handle temporary user data logic.
*   **Why it was used:** Zustand provides a significantly smaller boilerplate overhead than Redux, whilst avoiding the re-rendering bottlenecks associated with the native React Context API.

---

## 📷 Media, Camera, and Processing Systems

*   **Frontend Image Cropping:** **React Easy Crop** (`react-easy-crop`) allows users to natively interact with images (zoom, pan, crop) before uploading avatars or post media.
*   **Backend Image Processing:** **Sharp** (`sharp`), a high-performance Node.js image processing library, is included in the tech stack to compress, resize, and standardize uploaded assets, significantly reducing storage costs and load times.

---

## 🤖 AI/ML Integrations (Current & Roadmap)

*   While the current foundation relies on deterministic routing and validation, the application architecture is prepared for **KalaSetu AI** integration.
*   **Future Integrations:** AI-driven craft recognition, automated content moderation, and personalized product recommendations utilizing advanced machine learning APIs.

---

## ☁️ Cloud Services and Deployment Tools

*   **Frontend Hosting:** **Vercel** - providing global Edge network delivery, CI/CD integration, and serverless routing (configured via `vercel.json`).
*   **Database Cloud:** **MongoDB Atlas** for managed, highly available, clustered database instances.
*   **Analytics:** **Vercel Analytics** (`@vercel/analytics`) integrated into the frontend to track page views, web vitals, and audience engagement metrics.

---

## 🛠️ Dev Tools, Build Tools & Testing

*   **Development Server (Backend):** **Nodemon** for live-reloading during development.
*   **Development Server (Frontend):** **Vite** for sub-second HMR.
*   **Code Quality:** **ESLint** configured for React and modern JavaScript standards to enforce code cleanliness and catch syntax errors prior to build.

---

## 🚀 Performance Optimization Techniques

1.  **Frontend Chunking & Build:** Vite utilizes Rollup under the hood to tree-shake unused code and split bundles efficiently.
2.  **React Hook Form:** Disconnects form inputs from global component state, preventing the entire DOM tree from re-rendering on every keystroke.
3.  **HTTP Compression:** Node.js Gzip compression shrinks JSON API responses.
4.  **Optimistic UI Updates:** State managers update the UI instantly (e.g. liking a post) while the Axios request resolves in the background, providing a perceivable zero-latency experience.

---

## 🔮 Future Scalability Considerations

*   **Microservices Transition:** The current monolithic Node.js backend uses a strict Controller-Route pattern. This decoupling allows specific features (e.g., the Chat/Socket server or Image Processing) to be easily extracted into isolated microservices as traffic scales.
*   **Horizontal Scaling:** Since sessions are primarily JWT-based (stateless), the backend can be horizontally scaled behind a load balancer without sticky session issues.
*   **CDN Integration:** Moving static asset delivery (user uploads) from the backend directly to a Cloud Object Storage (like AWS S3) sitting behind a CDN (Cloudflare/CloudFront) will be the next major scalability leap.

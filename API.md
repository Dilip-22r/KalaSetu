# 🔌 KalaSetu API Documentation

This document provides a detailed breakdown of the RESTful API endpoints powering the KalaSetu platform. All requests and responses are in JSON format.

## 🔑 Authentication (`/auth`)

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/signup` | POST | Register a new user | No |
| `/login` | POST | Authenticate and receive JWT | No |
| `/upgrade-role` | PUT | Upgrade user role to Artisan/NGO | Yes |
| `/change-password` | PUT | Update account password | Yes |
| `/account` | DELETE | Hard delete user account and cascading data | Yes |

---

## 👤 Profiles (`/profiles`)

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/` | POST | Create or update user profile | Yes |
| `/creators` | GET | Search and filter Artisans/NGOs | No |
| `/:userId` | GET | Retrieve a specific profile by user ID | No |
| `/:userId/follow` | PUT | Follow or unfollow a profile | Yes |
| `/:userId/accept-follow`| PUT | Accept a pending follow request | Yes |
| `/:userId/reject-follow`| PUT | Reject a pending follow request | Yes |
| `/:userId/followers` | GET | List followers (access-controlled) | No |
| `/:userId/following` | GET | List following users (access-controlled) | No |

---

## 🎭 Posts & Content (`/posts`)

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/` | GET | Get paginated, block-aware feed | Optional |
| `/` | POST | Create a new cultural post | Yes (Artisan/NGO) |
| `/:id` | GET | Get single post details | Optional |
| `/:id` | PUT | Edit an existing post | Yes (Author) |
| `/:id` | DELETE | Delete a post | Yes (Author) |
| `/:id/like` | PUT | Like or unlike a post | Yes |
| `/:id/repost` | PUT | Repost content to your profile | Yes |
| `/:id/comments` | POST | Add a comment to a post | Yes |

---

## 💬 Messaging (`/messages`)

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/users` | GET | Get list of users for sidebar | Yes |
| `/:id` | GET | Get message history with a specific user | Yes |
| `/send/:id` | POST | Send a direct message (Real-time via Socket.io) | Yes |

---

## 🔔 Notifications (`/notifications`)

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/` | GET | Retrieve user notifications | Yes |
| `/read` | PUT | Mark notifications as read | Yes |
| `/unread-count` | GET | Get count of unread notifications | Yes |

---

## 🛡️ Security & Middleware

- **JWT Authentication**: All protected routes require a `Bearer` token in the `Authorization` header.
- **Rate Limiting**: Critical endpoints (Auth, Uploads) have strict rate limits to prevent abuse.
- **Sanitization**: All inputs are sanitized against NoSQL injection and XSS attacks.
- **Image Validation**: Multipart uploads are validated for file type and size using `sharp`.

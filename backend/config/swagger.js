import swaggerJSDoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KalaSetu API",
      version: "1.0.0",
      description:
        "REST API documentation for KalaSetu — a platform connecting artisans, creators, and art enthusiasts across India.",
      contact: {
        name: "KalaSetu Dev Team",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
      {
        url: "https://kalasetu.onrender.com",
        description: "Production server (Render)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste your JWT token obtained from /auth/login",
        },
      },
      schemas: {
        // ── User ────────────────────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664a1f2e3c2d1a0012345678" },
            fullName: { type: "string", example: "Priya Sharma" },
            email: { type: "string", example: "priya@kalasetu.in" },
            username: { type: "string", example: "priya_artisan" },
            role: { type: "string", enum: ["user", "creator", "admin"], example: "creator" },
            followers: { type: "array", items: { type: "string" } },
            following: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Post ────────────────────────────────────────────────────────────────
        Post: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664a1f2e3c2d1a0087654321" },
            author: { $ref: "#/components/schemas/User" },
            title: { type: "string", example: "Madhubani art workshop in Patna" },
            content: { type: "string", example: "Join us for a 2-day workshop..." },
            category: {
              type: "string",
              enum: ["event", "artwork", "story", "workshop", "announcement"],
              example: "workshop",
            },
            tags: { type: "array", items: { type: "string" }, example: ["madhubani", "painting"] },
            image: { type: "string", example: "data:image/jpeg;base64,..." },
            likes: { type: "array", items: { type: "string" } },
            dislikes: { type: "array", items: { type: "string" } },
            reposts: { type: "array", items: { type: "string" } },
            comments: {
              type: "array",
              items: { $ref: "#/components/schemas/Comment" },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ── Comment ─────────────────────────────────────────────────────────────
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            author: { $ref: "#/components/schemas/User" },
            text: { type: "string", example: "Beautiful work!" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ── Message ─────────────────────────────────────────────────────────────
        Message: {
          type: "object",
          properties: {
            _id: { type: "string" },
            sender: { type: "string" },
            receiver: { type: "string" },
            text: { type: "string", example: "Hello, I loved your work!" },
            image: { type: "string" },
            deletedFor: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ── Notification ────────────────────────────────────────────────────────
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            recipient: { type: "string" },
            type: { type: "string", example: "like" },
            sender: { $ref: "#/components/schemas/User" },
            post: { type: "string" },
            read: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ── Error ───────────────────────────────────────────────────────────────
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Unauthorized" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "../routes/*.js")],
};

export const swaggerSpec = swaggerJSDoc(options);

// Centralized API base URL — reads from Vite environment variable.
// Falls back to localhost to prevent a runtime crash if the variable is missing.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default API_BASE_URL;

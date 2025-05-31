import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App.jsx";
import "./index.css";
import "./styles/mobile.css";
import { inject } from "@vercel/analytics";

// Initialize Vercel analytics
inject();

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

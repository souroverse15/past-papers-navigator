// API Configuration
const API_CONFIG = {
  // Backend server URL - change this for production
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001",

  // PDF proxy endpoint - now served through frontend proxy
  PDF_PROXY_ENDPOINT: "/api/pdf-proxy",

  // PDF.js viewer path - serve from frontend to avoid CORS issues
  PDFJS_VIEWER_PATH: "/pdfjs/web/viewer.html",
};

// Helper function to get PDF viewer URL with proxy
export const getPDFViewerUrl = (pdfUrl) => {
  if (!pdfUrl) return null;

  // Use frontend server for both proxy and viewer to avoid CORS issues
  const proxyUrl = `${API_CONFIG.PDF_PROXY_ENDPOINT}?url=${encodeURIComponent(
    pdfUrl
  )}`;
  return `${API_CONFIG.PDFJS_VIEWER_PATH}?file=${encodeURIComponent(proxyUrl)}`;
};

// Helper function to check if backend is available
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
};

export default API_CONFIG;

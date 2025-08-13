// API Configuration
const API_CONFIG = {
  // Backend server URL - change this for production
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001",

  // PDF proxy endpoint - now served through frontend proxy
  PDF_PROXY_ENDPOINT: "/api/pdf-proxy",

  // PDF.js viewer path - serve from frontend to avoid CORS issues
  PDFJS_VIEWER_PATH: "/pdfjs/web/viewer.html",
  
  // Use native Google Drive viewer instead of PDF.js
  USE_NATIVE_DRIVE_VIEWER: true,
};

// Helper function to get PDF viewer URL with proxy (PDF.js method)
export const getPDFViewerUrlWithPDFJS = (pdfUrl) => {
  if (!pdfUrl) return null;

  // Use frontend server for both proxy and viewer to avoid CORS issues
  const proxyUrl = `${API_CONFIG.PDF_PROXY_ENDPOINT}?url=${encodeURIComponent(
    pdfUrl
  )}`;
  return `${API_CONFIG.PDFJS_VIEWER_PATH}?file=${encodeURIComponent(proxyUrl)}`;
};

// Helper function to get native Google Drive viewer URL
export const getNativeDriveViewerUrl = (pdfUrl) => {
  if (!pdfUrl) return null;
  
  // If it's already a Google Drive preview URL, return as is
  if (pdfUrl.includes("drive.google.com") && pdfUrl.includes("/preview")) {
    return pdfUrl;
  }
  
  // If it's a Google Drive file URL, convert to preview
  if (pdfUrl.includes("drive.google.com/file/d/")) {
    const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  // For non-Google Drive URLs, fall back to PDF.js
  return getPDFViewerUrlWithPDFJS(pdfUrl);
};

// Main function to get PDF viewer URL - can switch between methods
export const getPDFViewerUrl = (pdfUrl) => {
  if (!pdfUrl) return null;
  
  // Use native Google Drive viewer if enabled and it's a Google Drive URL
  if (API_CONFIG.USE_NATIVE_DRIVE_VIEWER && pdfUrl.includes("drive.google.com")) {
    return getNativeDriveViewerUrl(pdfUrl);
  }
  
  // Otherwise use PDF.js
  return getPDFViewerUrlWithPDFJS(pdfUrl);
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

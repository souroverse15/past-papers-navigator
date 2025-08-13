// API Configuration
const API_CONFIG = {
  // Backend server URL - change this for production
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001",

  // PDF proxy endpoint - now served through frontend proxy
  PDF_PROXY_ENDPOINT: "/api/pdf-proxy",

  // PDF.js viewer path - serve from frontend to avoid CORS issues
  PDFJS_VIEWER_PATH: "/pdfjs/web/viewer.html",
  
  // Use Google Docs viewer instead of PDF.js or native preview
  USE_GOOGLE_DOCS_VIEWER: true,
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

// Helper function to get native Google Drive viewer URL (preview mode)
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

// Helper function to get Google Docs viewer URL (better viewer with print functionality)
export const getGoogleDocsViewerUrl = (pdfUrl) => {
  if (!pdfUrl) return null;
  
  // Extract file ID from Google Drive URL
  if (pdfUrl.includes("drive.google.com")) {
    const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      // Use Google Docs viewer with embedded mode
      // This provides a much better PDF viewer with zoom, navigation, etc.
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      return `https://docs.google.com/viewer?url=${encodeURIComponent(directUrl)}&embedded=true`;
    }
  }
  
  // For non-Google Drive URLs, try to use Google Docs viewer if it's a direct PDF URL
  if (pdfUrl.endsWith('.pdf') || pdfUrl.includes('.pdf?')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  }
  
  // Fall back to PDF.js for other cases
  return getPDFViewerUrlWithPDFJS(pdfUrl);
};

// Main function to get PDF viewer URL - can switch between methods
export const getPDFViewerUrl = (pdfUrl) => {
  if (!pdfUrl) return null;
  
  // Use Google Docs viewer if enabled (provides best viewing experience)
  if (API_CONFIG.USE_GOOGLE_DOCS_VIEWER) {
    return getGoogleDocsViewerUrl(pdfUrl);
  }
  
  // Otherwise use native preview or PDF.js
  if (pdfUrl.includes("drive.google.com")) {
    return getNativeDriveViewerUrl(pdfUrl);
  }
  
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

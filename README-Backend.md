# PDF Proxy Backend Server

This backend server solves CORS issues when loading PDFs from Google Drive into PDF.js viewer.

## Features

- **PDF Proxy**: Fetches PDFs from Google Drive and serves them with proper CORS headers
- **PDF.js Integration**: Serves PDF.js viewer with full functionality
- **CORS Support**: Enables cross-origin requests for the frontend
- **Caching**: Implements caching headers for better performance

## Setup & Installation

### 1. Install Dependencies

```bash
npm install express cors
```

### 2. Start the Backend Server

```bash
# Start backend only
npm run server

# Start both frontend and backend
npm run dev:full
```

### 3. Server Endpoints

- **PDF Proxy**: `GET /api/pdf-proxy?url=<pdf_url>`
- **PDF.js Viewer**: `GET /pdfjs/web/viewer.html`
- **Health Check**: `GET /api/health`

## How It Works

1. **Frontend Request**: Frontend requests a PDF through the proxy
2. **URL Conversion**: Server converts Google Drive preview URLs to download URLs
3. **PDF Fetch**: Server fetches the PDF from Google Drive
4. **CORS Headers**: Server adds proper CORS headers
5. **Response**: PDF is served to PDF.js viewer

## Configuration

### Environment Variables

```bash
# .env file
VITE_BACKEND_URL=http://localhost:3001
```

### Production Setup

For production, update the `VITE_BACKEND_URL` in your environment variables to point to your deployed backend server.

## API Usage

### PDF Proxy Endpoint

```javascript
// Example usage
const pdfUrl = "https://drive.google.com/file/d/FILE_ID/preview";
const proxyUrl = `http://localhost:3001/api/pdf-proxy?url=${encodeURIComponent(
  pdfUrl
)}`;

// Use in PDF.js viewer
const viewerUrl = `http://localhost:3001/pdfjs/web/viewer.html?file=${encodeURIComponent(
  proxyUrl
)}`;
```

### Health Check

```bash
curl http://localhost:3001/api/health
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend server is running on port 3001
2. **PDF Not Loading**: Check if the Google Drive URL is accessible
3. **Port Conflicts**: Change the PORT environment variable if 3001 is in use

### Logs

The server logs all PDF proxy requests for debugging:

```
Proxying PDF request for: https://drive.google.com/file/d/...
Following redirect to: https://drive.google.com/uc?export=download&id=...
```

## Development

### File Structure

```
├── server.js              # Main backend server
├── src/config/api.js      # Frontend API configuration
├── public/pdfjs/          # PDF.js library files
└── README-Backend.md      # This file
```

### Scripts

```json
{
  "server": "node server.js",
  "dev:full": "concurrently \"npm run server\" \"npm run dev\""
}
```

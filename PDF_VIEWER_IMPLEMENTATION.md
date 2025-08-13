# PDF Viewer Implementation

## Current Implementation: Google Docs Viewer

The application now uses **Google Docs Viewer** as the primary PDF viewing solution. This provides the same high-quality viewer that appears when you click the "Print" button in Google Drive.

### Why Google Docs Viewer?

1. **Superior User Experience**
   - Professional PDF viewer interface
   - Full zoom controls with percentage display
   - Advanced page navigation
   - Built-in search functionality
   - Clean, distraction-free UI

2. **Better Compatibility**
   - Works consistently with both IAL and IGCSE PDFs
   - No issues with complex PDF structures
   - Handles all PDF encodings properly

3. **Performance Benefits**
   - No server-side proxy needed
   - Direct loading from Google Drive
   - Faster initial load times
   - Reduced server bandwidth usage

## How It Works

### URL Transformation
When a Google Drive file URL is provided:
```
Input:  https://drive.google.com/file/d/{FILE_ID}/preview
Output: https://docs.google.com/viewer?url=https://drive.google.com/uc?export=view&id={FILE_ID}&embedded=true
```

### Configuration

The viewer method can be easily switched in `/src/config/api.js`:

```javascript
const API_CONFIG = {
  // Set to true to use Google Docs viewer (recommended)
  USE_GOOGLE_DOCS_VIEWER: true,
};
```

## Viewer Methods Available

### 1. Google Docs Viewer (Current - Recommended)
- **Function**: `getGoogleDocsViewerUrl()`
- **Pros**: Best UI, full features, works with all PDFs
- **Cons**: Requires internet connection

### 2. Google Drive Preview
- **Function**: `getNativeDriveViewerUrl()`
- **Pros**: Simple, direct embedding
- **Cons**: Limited zoom controls, basic UI

### 3. PDF.js (Fallback)
- **Function**: `getPDFViewerUrlWithPDFJS()`
- **Pros**: Self-hosted, customizable
- **Cons**: Compatibility issues with some PDFs, requires proxy server

## Fallback Mechanism

The application includes automatic fallback:
1. Primary: Google Docs Viewer
2. If error: Retry with Google Docs Viewer
3. For non-Google Drive URLs: PDF.js

## File Locations

- **Configuration**: `/src/config/api.js`
- **Main Implementation**: `/src/components/PaperViewer.jsx`
- **Mobile Implementation**: `/src/components/mobile/MobilePaperViewer.jsx`
- **Exam Mode**: `/src/components/ExamMode.jsx`

## Switching Viewers

To switch back to PDF.js:
1. Edit `/src/config/api.js`
2. Set `USE_GOOGLE_DOCS_VIEWER: false`
3. Ensure the PDF proxy server is running

To use native Google Drive preview:
1. Modify `getPDFViewerUrl()` to return `getNativeDriveViewerUrl()`

## Benefits Over Previous Implementation

| Feature | Before (PDF.js) | Now (Google Docs Viewer) |
|---------|-----------------|--------------------------|
| IGCSE PDFs | ❌ Had issues | ✅ Works perfectly |
| Server Load | High (proxy needed) | Low (direct loading) |
| UI Quality | Basic | Professional |
| Zoom Controls | Manual | Automatic with % |
| Search | Limited | Full-featured |
| Print Quality | Variable | Consistent |

## Notes

- PDF.js files are retained in `/public/pdfjs/` as a fallback option
- The PDF proxy endpoint (`/api/pdf-proxy.js`) is kept for non-Google Drive PDFs
- All components automatically use the configured viewer method
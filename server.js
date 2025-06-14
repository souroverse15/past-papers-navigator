const express = require("express");
const cors = require("cors");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Serve static files from the public directory (for PDF.js)
app.use("/pdfjs", express.static(path.join(__dirname, "public/pdfjs")));

// PDF proxy endpoint
app.get("/api/pdf-proxy", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  try {
    console.log("Proxying PDF request for:", url);

    // Convert Google Drive preview URL to direct download URL
    let downloadUrl = url;
    if (url.includes("drive.google.com") && url.includes("/preview")) {
      // Extract file ID from Google Drive URL
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    // Determine protocol
    const protocol = downloadUrl.startsWith("https:") ? https : http;

    // Make request to fetch the PDF
    const request = protocol.get(downloadUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log("Following redirect to:", redirectUrl);

        const redirectProtocol = redirectUrl.startsWith("https:")
          ? https
          : http;
        const redirectRequest = redirectProtocol.get(
          redirectUrl,
          (redirectResponse) => {
            // Set proper headers for PDF.js
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader(
              "Access-Control-Allow-Methods",
              "GET, POST, PUT, DELETE, OPTIONS"
            );
            res.setHeader(
              "Access-Control-Allow-Headers",
              "Content-Type, Authorization"
            );
            res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

            // Pipe the PDF data to the response
            redirectResponse.pipe(res);
          }
        );

        redirectRequest.on("error", (error) => {
          console.error("Error fetching redirected PDF:", error);
          res.status(500).json({ error: "Failed to fetch PDF from redirect" });
        });

        return;
      }

      // Set proper headers for PDF.js
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

      // Pipe the PDF data to the response
      response.pipe(res);
    });

    request.on("error", (error) => {
      console.error("Error fetching PDF:", error);
      res.status(500).json({ error: "Failed to fetch PDF" });
    });

    request.setTimeout(30000, () => {
      console.error("Request timeout for URL:", url);
      res.status(504).json({ error: "Request timeout" });
    });
  } catch (error) {
    console.error("Error in PDF proxy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "PDF Proxy Server is running" });
});

// Handle preflight requests
app.options("*", cors());

app.listen(PORT, () => {
  console.log(`PDF Proxy Server running on http://localhost:${PORT}`);
  console.log(
    `PDF.js viewer available at http://localhost:${PORT}/pdfjs/web/viewer.html`
  );
});

module.exports = app;

import express from "express";
import cors from "cors";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      "http://localhost:5177",
      "http://localhost:3000",
      "https://past-papers-navigator.vercel.app",
      "https://past-papers-navigator-git-main-souroverse15.vercel.app",
      "https://past-papers-navigator-souroverse15.vercel.app",
      /\.vercel\.app$/,
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

  let responseStarted = false;

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
      // Handle redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const redirectUrl = response.headers.location;
        console.log(
          `Following ${response.statusCode} redirect to:`,
          redirectUrl
        );

        const redirectProtocol = redirectUrl.startsWith("https:")
          ? https
          : http;
        const redirectRequest = redirectProtocol.get(
          redirectUrl,
          (redirectResponse) => {
            // Handle nested redirects
            if (
              [301, 302, 303, 307, 308].includes(redirectResponse.statusCode)
            ) {
              const nestedRedirectUrl = redirectResponse.headers.location;
              console.log(
                `Following nested ${redirectResponse.statusCode} redirect to:`,
                nestedRedirectUrl
              );

              const nestedProtocol = nestedRedirectUrl.startsWith("https:")
                ? https
                : http;
              const nestedRequest = nestedProtocol.get(
                nestedRedirectUrl,
                (nestedResponse) => {
                  if (responseStarted) return;
                  responseStarted = true;

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
                  nestedResponse.pipe(res);
                }
              );

              nestedRequest.on("error", (error) => {
                console.error("Error fetching nested redirected PDF:", error);
                if (!responseStarted) {
                  responseStarted = true;
                  res.status(500).json({
                    error: "Failed to fetch PDF from nested redirect",
                  });
                }
              });

              nestedRequest.setTimeout(30000, () => {
                console.error(
                  "Nested request timeout for URL:",
                  nestedRedirectUrl
                );
                if (!responseStarted) {
                  responseStarted = true;
                  res.status(504).json({ error: "Request timeout" });
                }
                nestedRequest.destroy();
              });

              return;
            }

            if (responseStarted) return;
            responseStarted = true;

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
          if (!responseStarted) {
            responseStarted = true;
            res
              .status(500)
              .json({ error: "Failed to fetch PDF from redirect" });
          }
        });

        redirectRequest.setTimeout(30000, () => {
          console.error("Redirect request timeout for URL:", redirectUrl);
          if (!responseStarted) {
            responseStarted = true;
            res.status(504).json({ error: "Request timeout" });
          }
          redirectRequest.destroy();
        });

        return;
      }

      // Check if response is successful
      if (response.statusCode !== 200) {
        console.error(
          `HTTP ${response.statusCode} error for URL:`,
          downloadUrl
        );
        if (!responseStarted) {
          responseStarted = true;
          res.status(response.statusCode).json({
            error: `Failed to fetch PDF: HTTP ${response.statusCode}`,
          });
        }
        return;
      }

      if (responseStarted) return;
      responseStarted = true;

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
      if (!responseStarted) {
        responseStarted = true;
        res.status(500).json({ error: "Failed to fetch PDF" });
      }
    });

    request.setTimeout(30000, () => {
      console.error("Request timeout for URL:", url);
      if (!responseStarted) {
        responseStarted = true;
        res.status(504).json({ error: "Request timeout" });
      }
      request.destroy();
    });
  } catch (error) {
    console.error("Error in PDF proxy:", error);
    if (!responseStarted) {
      responseStarted = true;
      res.status(500).json({ error: "Internal server error" });
    }
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

export default app;

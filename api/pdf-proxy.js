import https from "https";
import http from "http";

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

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
            if (responseStarted) return;
            responseStarted = true;

            // Set proper headers for PDF.js
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Cache-Control", "public, max-age=3600");

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

        redirectRequest.setTimeout(25000, () => {
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
      res.setHeader("Cache-Control", "public, max-age=3600");

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

    request.setTimeout(25000, () => {
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
}

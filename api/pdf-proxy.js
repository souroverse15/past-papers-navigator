import https from "https";
import http from "http";

export default function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

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
    // Enhanced logging for debugging
    const isIGCSE = url.includes("IGCSE") || req.headers.referer?.includes("IGCSE");
    console.log("PDF Proxy Request:", {
      url: url.substring(0, 100) + "...",
      isIGCSE,
      referer: req.headers.referer,
      userAgent: req.headers["user-agent"]
    });

    // Convert Google Drive preview URL to direct download URL
    let downloadUrl = url;
    if (url.includes("drive.google.com") && url.includes("/preview")) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log(`Converted preview URL to download URL for file ID: ${fileId}`);
      }
    }

    // Determine protocol
    const protocol = downloadUrl.startsWith("https:") ? https : http;

    // Make request to fetch the PDF with custom headers
    const requestOptions = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/pdf,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    };

    const request = protocol.get(downloadUrl, requestOptions, (response) => {
      console.log(`Initial response status: ${response.statusCode} for ${isIGCSE ? 'IGCSE' : 'IAL'} paper`);
      
      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const redirectUrl = response.headers.location;
        console.log(
          `Following ${response.statusCode} redirect to:`,
          redirectUrl?.substring(0, 100) + "..."
        );

        const redirectProtocol = redirectUrl.startsWith("https:")
          ? https
          : http;
        const redirectRequest = redirectProtocol.get(
          redirectUrl,
          requestOptions,
          (redirectResponse) => {
            if (responseStarted) return;
            responseStarted = true;

            console.log(`Redirect response status: ${redirectResponse.statusCode}`);

            // Set proper headers for PDF.js with additional CORS headers
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Cache-Control", "public, max-age=3600");
            res.setHeader("X-Content-Type-Options", "nosniff");
            
            // Add content disposition to help with PDF loading
            const fileName = isIGCSE ? "igcse-paper.pdf" : "ial-paper.pdf";
            res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

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
              .json({ error: "Failed to fetch PDF from redirect", details: error.message });
          }
        });

        redirectRequest.setTimeout(30000, () => {
          console.error("Redirect request timeout for URL:", redirectUrl);
          if (!responseStarted) {
            responseStarted = true;
            res.status(504).json({ error: "Request timeout on redirect" });
          }
          redirectRequest.destroy();
        });

        return;
      }

      // Check if response is successful
      if (response.statusCode !== 200) {
        console.error(
          `HTTP ${response.statusCode} error for URL:`,
          downloadUrl.substring(0, 100) + "..."
        );
        if (!responseStarted) {
          responseStarted = true;
          res.status(response.statusCode).json({
            error: `Failed to fetch PDF: HTTP ${response.statusCode}`,
            isIGCSE
          });
        }
        return;
      }

      if (responseStarted) return;
      responseStarted = true;

      console.log(`Successfully fetching ${isIGCSE ? 'IGCSE' : 'IAL'} PDF`);

      // Set proper headers for PDF.js
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("X-Content-Type-Options", "nosniff");
      
      // Add content disposition
      const fileName = isIGCSE ? "igcse-paper.pdf" : "ial-paper.pdf";
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

      // Pipe the PDF data to the response
      response.pipe(res);
    });

    request.on("error", (error) => {
      console.error("Error fetching PDF:", error);
      if (!responseStarted) {
        responseStarted = true;
        res.status(500).json({ error: "Failed to fetch PDF", details: error.message });
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
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
}

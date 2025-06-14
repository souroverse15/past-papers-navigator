import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    allowedHosts: ["belts-partly-females-happening.trycloudflare.com"],
    proxy: {
      "/api/pdf-proxy": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("Proxying PDF request:", req.url);
          });
        },
      },
    },
  },
});

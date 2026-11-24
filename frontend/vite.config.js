import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves this repository under /Internship-Matching-System/.
  // For Vercel or local builds, keep the site at the domain root.
  base: process.env.GITHUB_PAGES === "true" ? "/Internship-Matching-System/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});

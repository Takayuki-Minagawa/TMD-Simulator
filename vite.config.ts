import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const basePath = process.env.VITE_BASE_PATH ?? "./";

export default defineConfig({
  base: basePath,
  build: {
    // Plotly is loaded lazily in the app; keep it isolated from the entry bundle.
    rollupOptions: {
      output: {
        manualChunks: {
          plotly: ["react-plotly.js", "plotly.js-dist-min"],
        },
      },
    },
    // Avoid noisy warnings for the intentionally lazy, vendor-heavy Plotly chunk.
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [react()],
});

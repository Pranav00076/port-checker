import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite builds the React renderer (the part shown inside the Electron window).
export default defineConfig({
  // Relative paths so the built app also works when loaded from a file.
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});

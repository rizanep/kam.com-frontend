import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path"; // ✅ missing import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic", // ✅ ensures React import isn't required
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

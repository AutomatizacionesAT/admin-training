import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { salaMediaPlugin } from "./scripts/vite-sala-media-plugin";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [salaMediaPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

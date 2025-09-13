import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "vite-plugin-sitemap";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sitemap({
      hostname: "https://pauhenriques.com",
      dynamicRoutes: [
        "/podcast",
        "/tienda",
        "/sobre-mi",
        "/terminos-servicio",
        "/politica-privacidad",
      ],
    }),
  ],
  server: {},
});
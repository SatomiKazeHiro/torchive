import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/ts-api": {
        target: "http://localhost:2333",
        ws: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ts-api/, ""),
      },

      "/api-netease": {
        target: "https://music.163.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-netease/, ""),
      },
    },
  },
});

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
        // API 路由后端通过 setGlobalPrefix('ts-api') 整体挂在前缀下，原样转发；
        // 静态资源（/uploads、/resources）是 main.ts 里的 express middleware，
        // 直接挂在根路径，需要 strip 前缀。
        rewrite: (path) =>
          /^\/ts-api\/(uploads|resources)(\/|$)/.test(path) ? path.replace(/^\/ts-api/, "") : path,
      },

      "/api-netease": {
        target: "https://music.163.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-netease/, ""),
      },
    },
  },
});

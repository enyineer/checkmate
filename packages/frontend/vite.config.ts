import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_BASE_URL || "http://localhost:3000";
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": target,
        "/assets": target,
      },
    },
    build: {
      rollupOptions: {
        external: [
          "react",
          "react-dom",
          "react-dom/client",
          "react-router-dom",
          "@checkmate/frontend-api",
        ],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Monorepo root is 2 levels up from core/frontend
const monorepoRoot = path.resolve(__dirname, "../..");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from monorepo root
  const env = loadEnv(mode, monorepoRoot, "");
  const target = env.VITE_API_BASE_URL || "http://localhost:3000";
  return {
    // Tell Vite to look for .env files in monorepo root
    envDir: monorepoRoot,
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API requests and WebSocket connections to backend
        // Use regex to ensure /api-docs doesn't match (it starts with /api but isn't an API call)
        "^/api/": {
          target,
          ws: true, // Enable WebSocket proxy
        },
        "/assets": target,
      },
    },
    // Ensure react-router-dom and react are pre-bundled together
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
    },
    build: {
      // Use esnext to support top-level await and modern ES features
      target: "esnext",
    },
    resolve: {
      // CRITICAL: Dedupe React packages to ensure single instance in monorepo
      // Without this, each workspace package can bundle its own React copy,
      // causing "useContext is null" errors when react-router-dom components
      // try to use a different React instance's context.
      // See: https://vitejs.dev/config/shared-options#resolve-dedupe
      dedupe: ["react", "react-dom", "react-router-dom", "react/jsx-runtime"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

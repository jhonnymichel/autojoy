import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// Vite scoped to pages folder only
export default defineConfig({
  root: path.resolve(__dirname, "src/main/pages"),
  plugins: [vue()],
  base: "./",
  build: {
    outDir: "dist", // outputs to src/main/pages/dist
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

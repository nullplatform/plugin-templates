import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The bundle is ONE self-contained classic script, dist/plugin.js: the host runs it
// in a sandboxed worker, so nothing may be imported at runtime.
export default defineConfig({
  plugins: [react()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: "src/index.tsx",
      name: "NullplatformPlugin",
      formats: ["iife"],
      fileName: () => "plugin.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});

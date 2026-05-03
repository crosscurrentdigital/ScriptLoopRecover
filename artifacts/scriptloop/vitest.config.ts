import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "dist/**"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html"],
      include: ["src/**/*.{ts,tsx}", "netlify/functions/**/*.ts"],
      exclude: [
        "tests/e2e/**",
        "src/components/ui/**",
        "src/main.tsx",
        "src/db/index.ts",
        "src/hooks/use-mobile.tsx",
        "src/hooks/use-toast.ts",
        "src/index.css",
        "**/*.d.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});

import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const webDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(webDir, "../..");
const srcDir = path.resolve(webDir, "src");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const webPort = Number(env.WEB_PORT ?? process.env.WEB_PORT ?? 5173);

  return {
    plugins: [react()],
    envDir: rootDir,
    define:
      mode === "test"
        ? {
            "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
              "http://localhost:3001",
            ),
          }
        : undefined,
    resolve: {
      alias: {
        "@api": path.resolve(srcDir, "api"),
        "@components": path.resolve(srcDir, "components"),
        "@config": path.resolve(srcDir, "config.ts"),
        "@containers": path.resolve(srcDir, "containers"),
        "@hooks": path.resolve(srcDir, "hooks"),
        "@pages": path.resolve(srcDir, "pages"),
        "@types": path.resolve(srcDir, "types"),
        "@utils": path.resolve(srcDir, "utils"),
      },
    },
    server: {
      port: webPort,
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true,
      testTimeout: 20000,
      coverage: {
        provider: "v8",
        reporter: ["text", "text-summary", "html"],
        include: [
          "src/api/**/*.{ts,tsx}",
          "src/components/**/*.{ts,tsx}",
          "src/containers/**/*.{ts,tsx}",
          "src/hooks/**/*.{ts,tsx}",
          "src/pages/**/*.{ts,tsx}",
          "src/utils/**/*.{ts,tsx}",
        ],
        exclude: [
          "**/*.types.ts",
          "**/index.ts",
          "**/__stories__/**",
          "**/__tests__/**",
        ],
        thresholds: {
          branches: 80,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  };
});

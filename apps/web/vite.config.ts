import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const webPort = Number(env.WEB_PORT ?? process.env.WEB_PORT ?? 5173);

  return {
    plugins: [react()],
    envDir: rootDir,
    server: {
      port: webPort,
    },
  };
});

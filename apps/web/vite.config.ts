import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const webDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(webDir, "../..");
const srcDir = path.resolve(webDir, "src");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const webPort = Number(env.WEB_PORT ?? process.env.WEB_PORT ?? 5173);

  return {
    plugins: [react()],
    envDir: rootDir,
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
  };
});

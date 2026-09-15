import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolvePackageBin } from "./resolve-package-bin.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const healthUrl = process.argv[2];
const timeoutMs = Number(process.argv[3] ?? 60000);

if (!healthUrl) {
  console.error(
    "Использование: node scripts/wait-and-dev-web.mjs <healthUrl> [timeoutMs]",
  );
  process.exit(1);
}

let waitOn;

try {
  waitOn = require("wait-on");
} catch {
  console.error(
    "Пакет «wait-on» не найден. Выполните npm install в корне репозитория.",
  );
  process.exit(1);
}

try {
  await waitOn({
    resources: [healthUrl],
    timeout: timeoutMs,
    interval: 250,
  });
} catch {
  console.error(`API не ответил за ${timeoutMs} мс: ${healthUrl}`);
  process.exit(1);
}

let viteBin;

try {
  viteBin = resolvePackageBin("vite");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const child = spawn(process.execPath, [viteBin], {
  cwd: resolve(root, "apps/web"),
  stdio: "inherit",
  env: process.env,
  shell: false,
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

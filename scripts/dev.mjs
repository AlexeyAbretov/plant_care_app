import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const result = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return result;
}

const env = { ...process.env, ...parseEnvFile(resolve(root, ".env")) };
const port = env.PORT ?? "3001";
const healthUrl = `http://localhost:${port}/api/health`;

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: options.stdio ?? "inherit",
      shell: false,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise(undefined);
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function checkDockerAvailable() {
  return new Promise((resolvePromise) => {
    const child = spawn("docker", ["info"], {
      cwd: root,
      env,
      stdio: ["ignore", "ignore", "pipe"],
      shell: false,
    });

    let stderr = "";

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolvePromise({
        ok: false,
        reason: "not-found",
        stderr: error.message,
      });
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise({ ok: true, reason: null, stderr: "" });
        return;
      }

      resolvePromise({
        ok: false,
        reason: "daemon-unavailable",
        stderr,
      });
    });
  });
}

function printDockerUnavailableMessage({ reason, stderr }) {
  console.error("\nDocker недоступен — не удалось подключиться к Docker daemon.\n");

  if (reason === "not-found") {
    console.error(
      "Команда `docker` не найдена в PATH. Установите Docker и добавьте его в PATH.\n",
    );
  } else if (process.platform === "win32") {
    console.error(
      "На Windows: запустите Docker Desktop и дождитесь статуса Ready, затем повторите команду.\n",
    );
  } else {
    console.error("Убедитесь, что Docker daemon запущен (например, `docker info`).\n");
  }

  console.error("Альтернатива без Docker:");
  console.error("  1. Запустите MongoDB отдельно (локально или удалённо).");
  console.error("  2. Проверьте MONGODB_URI в .env.");
  console.error("  3. Выполните: npm run dev:apps\n");
  console.error("Подробнее: README.md (раздел «Запуск (dev)») и AGENTS.md.\n");

  const details = stderr.trim();
  if (details) {
    console.error("Детали Docker CLI:");
    console.error(details);
    console.error("");
  }
}

async function ensureDockerAvailable() {
  const result = await checkDockerAvailable();
  if (!result.ok) {
    printDockerUnavailableMessage(result);
    process.exit(1);
  }
}

const mode = process.argv[2] ?? "full";

try {
  if (mode === "mongo") {
    await ensureDockerAvailable();
    await run("docker", ["compose", "up", "-d"]);
  } else if (mode === "apps") {
    await run("npx", [
      "concurrently",
      "-n",
      "api,web",
      "-c",
      "blue,green",
      "npm run dev -w @plant-care/api",
      "npm run dev -w @plant-care/web",
    ]);
  } else {
    await ensureDockerAvailable();
    await run("docker", ["compose", "up", "-d"]);
    await run("npx", [
      "concurrently",
      "-n",
      "api,web",
      "-c",
      "blue,green",
      "npm run dev -w @plant-care/api",
      `wait-on ${healthUrl} -t 60000 && npm run dev -w @plant-care/web`,
    ]);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

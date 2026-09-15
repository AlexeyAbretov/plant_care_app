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

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: "inherit",
      shell: true,
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

const mode = process.argv[2] ?? "full";

try {
  if (mode === "mongo") {
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

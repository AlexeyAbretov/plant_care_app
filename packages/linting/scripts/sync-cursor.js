import { cpSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(packageRoot, "cursor");
const targetRoot = join(process.cwd(), ".cursor", "rules");

function copyEntries(source, target) {
  mkdirSync(target, { recursive: true });

  for (const name of readdirSync(source)) {
    const from = join(source, name);
    const to = join(target, name);

    if (statSync(from).isDirectory()) {
      copyEntries(from, to);
      continue;
    }

    cpSync(from, to);
    console.log(to);
  }
}

copyEntries(sourceRoot, targetRoot);
console.log(
  "Synced @llm/linting cursor rules. Project-only files in .cursor/rules were left in place.",
);

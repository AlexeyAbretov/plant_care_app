import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

export function resolvePackageBin(packageName, binKey = packageName) {
  let pkgJsonPath;

  try {
    pkgJsonPath = require.resolve(`${packageName}/package.json`);
  } catch {
    throw new Error(
      `Пакет «${packageName}» не найден. Выполните npm install в корне репозитория.`,
    );
  }

  const pkg = require(pkgJsonPath);
  const binEntry = pkg.bin?.[binKey] ?? pkg.bin;

  if (!binEntry) {
    throw new Error(`В пакете «${packageName}» не найден bin «${binKey}».`);
  }

  const relativePath =
    typeof binEntry === "string" ? binEntry : binEntry[binKey];

  return join(dirname(pkgJsonPath), relativePath);
}

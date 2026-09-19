import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CatalogValidationError, assertCatalogRelease } from "../src/data/programs/schema.ts";

try {
  const catalogPath = fileURLToPath(
    new URL("../src/data/programs/catalog.json", import.meta.url),
  );
  let rawCatalog: unknown;
  try {
    rawCatalog = JSON.parse(await readFile(catalogPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`catalog.json: unable to read or parse catalog: ${message}\n`);
    process.exitCode = 1;
    rawCatalog = undefined;
  }
  if (rawCatalog === undefined) process.exit();
  const catalog = assertCatalogRelease(rawCatalog);
  process.stdout.write(
    `Catalog ${catalog.datasetVersion} is valid: ${catalog.programs.length} programs, ${catalog.subjects.length} subjects.\n`,
  );
} catch (error) {
  if (error instanceof CatalogValidationError) {
    process.stderr.write(`${error.message}\n`);
    error.issues.forEach((issue) => {
      process.stderr.write(`  ${issue.path || "catalog"}: ${issue.message}\n`);
    });
    process.exitCode = 1;
  } else {
    throw error;
  }
}

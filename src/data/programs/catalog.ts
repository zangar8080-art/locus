import rawCatalog from "./catalog.json" with { type: "json" };
import { assertCatalogRelease, type ProgramCatalog } from "./schema.ts";

let cachedCatalog: ProgramCatalog | undefined;

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
};

export const loadProgramCatalog = (): ProgramCatalog => {
  cachedCatalog ??= deepFreeze(assertCatalogRelease(rawCatalog));
  return cachedCatalog;
};

import initSqlJs from "sql.js";
import mappingSql from "./drug_name_mapping.sql?raw";
import { buildDrugRegistryDraftSql } from "./localDrafts";
import registrySql from "./registry.sql?raw";

export type SqlJsFactory = typeof initSqlJs;
type SqlJsModule = Awaited<ReturnType<SqlJsFactory>>;
export type SqlDatabase = InstanceType<SqlJsModule["Database"]>;

const browserSqlWasmPath = "/sql-wasm.wasm";

let databasePromise: Promise<SqlDatabase> | null = null;

function resolveNodeWasmPath() {
  const wasmFile = new URL("../../../node_modules/sql.js/dist/sql-wasm.wasm", import.meta.url);
  const pathname = decodeURIComponent(wasmFile.pathname);
  return /^\/[A-Za-z]:\//.test(pathname) ? pathname.slice(1) : pathname;
}

function resolveSqlJsFactory(candidate: unknown): SqlJsFactory {
  if (typeof candidate === "function") {
    return candidate as SqlJsFactory;
  }

  if (candidate && typeof candidate === "object") {
    const record = candidate as Record<string, unknown>;
    for (const value of [record.default, record.Module, record["module.exports"]]) {
      if (typeof value === "function") {
        return value as SqlJsFactory;
      }
    }
  }

  throw new TypeError("Failed to resolve sql.js init factory");
}

async function loadSqlJsModule() {
  const initFactory = resolveSqlJsFactory(initSqlJs);

  if (typeof window === "undefined") {
    const nodeFsModuleSpecifier = "node:fs/promises";
    const { readFile } = await import(/* @vite-ignore */ nodeFsModuleSpecifier);
    const wasmBinary = await readFile(resolveNodeWasmPath());
    return initFactory({ wasmBinary });
  }

  const response = await fetch(browserSqlWasmPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load sql.js wasm: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(`sql.js wasm returned HTML instead of binary from ${browserSqlWasmPath}`);
  }

  const wasmBinary = new Uint8Array(await response.arrayBuffer());
  return initFactory({ wasmBinary });
}

function buildSeedSql() {
  return [registrySql, mappingSql, buildDrugRegistryDraftSql()].filter(Boolean).join("\n");
}

export async function getDrugRegistryDatabase() {
  if (!databasePromise) {
    databasePromise = loadSqlJsModule()
      .then((sql) => {
        const database = new sql.Database();
        database.run(buildSeedSql());
        return database;
      })
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
}

export function resetDrugRegistryDatabase() {
  databasePromise = null;
}

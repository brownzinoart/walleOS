#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);

const providerFlagIndex = argv.findIndex(
  (arg) => arg === "--provider" || arg.startsWith("--provider="),
);
let provider = process.env["EMBEDDING_PROVIDER"] ?? "gemini";

if (providerFlagIndex !== -1) {
  const flag = argv[providerFlagIndex];
  if (flag.includes("=")) {
    provider = flag.split("=")[1] ?? provider;
  } else {
    provider = argv[providerFlagIndex + 1] ?? provider;
  }
}

provider = provider.trim().toLowerCase();

if (provider !== "gemini") {
  console.error(`Unsupported embedding provider "${provider}". Use "gemini".`);
  process.exit(1);
}

const env = {
  ...process.env,
  EMBEDDING_PROVIDER: provider,
};

if (provider === "gemini" && !env["GEMINI_API_KEY"]) {
  console.error(
    "GEMINI_API_KEY must be set to use the Gemini embedding provider.",
  );
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(scriptDir, "..", "server");

const filteredArgs = argv.filter((_, index) => {
  if (index === providerFlagIndex) return false;
  if (
    providerFlagIndex !== -1 &&
    index === providerFlagIndex + 1 &&
    argv[providerFlagIndex] === "--provider"
  ) {
    return false;
  }
  return true;
});

const child = spawn("npm", ["run", "ingest:force", ...filteredArgs], {
  cwd: serverDir,
  env,
  stdio: "inherit",
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

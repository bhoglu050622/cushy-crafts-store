#!/usr/bin/env node
/**
 * Updates repo config to use a new Supabase project.
 * Run from repo root: node scripts/setup-new-supabase.js
 *
 * Either pass values via env:
 *   NEW_SUPABASE_PROJECT_ID=xxx NEW_SUPABASE_URL=https://xxx.supabase.co NEW_SUPABASE_ANON_KEY=eyJ... node scripts/setup-new-supabase.js
 * Or run without env and you'll be prompted.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.resolve(__dirname, "..");

function ask(rl, question, envKey) {
  const env = process.env[envKey];
  if (env) return Promise.resolve(env);
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve((answer || "").trim()));
  });
}

function updateEnv(projectId, projectUrl, anonKey) {
  const envPath = path.join(ROOT, ".env");
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  const updates = [
    { key: "VITE_SUPABASE_PROJECT_ID", value: projectId },
    { key: "VITE_SUPABASE_URL", value: projectUrl },
    { key: "VITE_SUPABASE_PUBLISHABLE_KEY", value: anonKey },
  ];

  for (const { key, value } of updates) {
    const regex = new RegExp(`^(${key})=.*`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content = content.trimEnd() + (content ? "\n" : "") + `${key}="${value}"\n`;
    }
  }

  fs.writeFileSync(envPath, content, "utf8");
  console.log("Updated .env");
}

function updateConfigToml(projectId) {
  const configPath = path.join(ROOT, "supabase", "config.toml");
  let content = fs.readFileSync(configPath, "utf8");
  content = content.replace(/^project_id\s*=\s*"[^"]*"/m, `project_id = "${projectId}"`);
  fs.writeFileSync(configPath, content, "utf8");
  console.log("Updated supabase/config.toml");
}

function updateWranglerToml(projectUrl) {
  const wranglerPath = path.join(ROOT, "supabase-proxy", "wrangler.toml");
  if (!fs.existsSync(wranglerPath)) return;
  let content = fs.readFileSync(wranglerPath, "utf8");
  content = content.replace(
    /SUPABASE_URL\s*=\s*"[^"]*"/,
    `SUPABASE_URL = "${projectUrl}"`
  );
  fs.writeFileSync(wranglerPath, content, "utf8");
  console.log("Updated supabase-proxy/wrangler.toml");
}

async function main() {
  const projectId =
    process.env.NEW_SUPABASE_PROJECT_ID ||
    process.env.VITE_SUPABASE_PROJECT_ID;
  const projectUrl =
    process.env.NEW_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.NEW_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (projectId && projectUrl && anonKey) {
    updateEnv(projectId, projectUrl, anonKey);
    updateConfigToml(projectId);
    updateWranglerToml(projectUrl);
    console.log("\nDone. Next: npx supabase link --project-ref " + projectId + " && npx supabase db push && npx supabase functions deploy");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const id = await ask(
    rl,
    "New Supabase Project ID (e.g. abcdefghijklmnop): ",
    "NEW_SUPABASE_PROJECT_ID"
  );
  const url = await ask(
    rl,
    "New Supabase Project URL (e.g. https://abcdefghijklmnop.supabase.co): ",
    "NEW_SUPABASE_URL"
  );
  const key = await ask(
    rl,
    "New Supabase anon/public key (long JWT): ",
    "NEW_SUPABASE_ANON_KEY"
  );
  rl.close();

  if (!id || !url || !key) {
    console.error("Project ID, URL, and anon key are required.");
    process.exit(1);
  }

  updateEnv(id, url, key);
  updateConfigToml(id);
  updateWranglerToml(url);
  console.log("\nDone. Next: npx supabase link --project-ref " + id + " && npx supabase db push && npx supabase functions deploy");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Bundles the extension into dist/ with esbuild. Usage: node build.mjs [--watch | --store]
// --store: omit the manifest "key" (the Chrome Web Store rejects it) and write gather-extension.zip.
import { build, context } from "esbuild";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash, createPublicKey } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeIcons } from "./scripts/icons.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");
const store = process.argv.includes("--store");

function readEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8").split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
  );
}
const own = readEnv(join(root, ".env"));
const web = readEnv(join(root, "../web/.env.local"));
const env = {
  SUPABASE_URL: process.env.SUPABASE_URL ?? own.SUPABASE_URL ?? web.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? own.SUPABASE_ANON_KEY ?? web.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  WEB_URL: process.env.WEB_URL ?? own.WEB_URL ?? "http://localhost:3000",
};
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn("! SUPABASE_URL / SUPABASE_ANON_KEY not set. Copy .env.example to .env. Building with placeholders.");
  env.SUPABASE_URL ??= "https://example.supabase.co";
  env.SUPABASE_ANON_KEY ??= "missing-anon-key";
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, "public"), dist, { recursive: true });
writeIcons(join(dist, "icons"));

// Stable extension ID: embed the public key from key.pem (run `pnpm keygen` once).
const manifest = JSON.parse(readFileSync(join(root, "public/manifest.json"), "utf8"));
const pem = join(root, "key.pem");
if (store) {
  console.log("Store build: manifest key omitted. The Web Store assigns the extension ID.");
} else if (existsSync(pem)) {
  const der = createPublicKey(readFileSync(pem)).export({ type: "spki", format: "der" });
  manifest.key = der.toString("base64");
  const id = [...createHash("sha256").update(der).digest("hex").slice(0, 32)]
    .map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  console.log(`Extension ID: ${id}`);
  console.log(`OAuth redirect URL (add to Supabase): https://${id}.chromiumapp.org/`);
} else {
  console.warn("! key.pem missing: extension ID will vary per install. Run `pnpm --filter extension keygen`.");
}
writeFileSync(join(dist, "manifest.json"), JSON.stringify(manifest, null, 2));

const common = {
  bundle: true,
  target: "chrome105",
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  define: {
    __SUPABASE_URL__: JSON.stringify(env.SUPABASE_URL),
    __SUPABASE_ANON_KEY__: JSON.stringify(env.SUPABASE_ANON_KEY),
    __WEB_URL__: JSON.stringify(env.WEB_URL),
  },
  logLevel: "info",
};
const configs = [
  { ...common, entryPoints: [join(root, "src/background.ts")], outfile: join(dist, "background.js"), format: "esm" },
  { ...common, entryPoints: [join(root, "src/content.ts")], outfile: join(dist, "content.js"), format: "iife" },
  { ...common, entryPoints: [join(root, "src/popup.ts")], outfile: join(dist, "popup.js"), format: "iife" },
];

if (watch) {
  for (const c of configs) await (await context(c)).watch();
  console.log("Watching for changes…");
} else {
  await Promise.all(configs.map((c) => build(c)));
  console.log(`Built to ${dist}. Load it via chrome://extensions > Load unpacked.`);
}

if (store) {
  const { execFileSync } = await import("node:child_process");
  const zip = join(root, "gather-extension.zip");
  rmSync(zip, { force: true });
  if (process.platform === "win32") {
    execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${dist}\*' -DestinationPath '${zip}'`]);
  } else {
    execFileSync("zip", ["-r", "-q", zip, "."], { cwd: dist });
  }
  console.log(`Store package: ${zip}`);
}

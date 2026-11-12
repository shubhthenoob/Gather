// Generates key.pem so the unpacked extension keeps a fixed ID (needed for the OAuth redirect URL).
import { generateKeyPairSync } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "key.pem");
if (existsSync(file)) {
  console.log("key.pem already exists; leaving it alone.");
  process.exit(0);
}
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
writeFileSync(file, privateKey.export({ type: "pkcs8", format: "pem" }));
console.log("Wrote key.pem. Keep it private and out of git. Run `pnpm build` to see the extension ID.");

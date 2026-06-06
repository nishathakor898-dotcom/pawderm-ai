import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

const rootFiles = await readdir(root);
const files = [
  ...rootFiles.filter((file) => file.endsWith(".html")),
  "styles.css",
  "app.js",
  "content.js",
  "content-defaults.js",
  "assets",
  "vendor",
];

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await cp(join(root, file), join(dist, file), { recursive: true });
}

console.log("Built PawDerm AI to dist/");

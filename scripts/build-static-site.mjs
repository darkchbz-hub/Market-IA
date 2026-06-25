import { execSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rootDir = path.resolve(currentDir, "..");
const frontendDir = path.join(rootDir, "frontend");
const frontendDistDir = path.join(frontendDir, "dist");
const frontendNodeModulesDir = path.join(frontendDir, "node_modules");
const htmlUploadDir = path.join(rootDir, "html-upload");
const rootAssetsDir = path.join(rootDir, "assets");
const htmlUploadAssetsDir = path.join(htmlUploadDir, "assets");

function run(command, cwd) {
  console.log(`> ${command}`);
  execSync(command, {
    cwd,
    stdio: "inherit"
  });
}

function ensureExists(targetPath, label) {
  if (!existsSync(targetPath)) {
    throw new Error(`${label} no existe: ${targetPath}`);
  }
}

function replaceDirectory(sourceDir, destinationDir) {
  rmSync(destinationDir, { recursive: true, force: true });
  mkdirSync(path.dirname(destinationDir), { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true });
}

if (process.env.CI === "true" || process.env.CF_PAGES === "1" || !existsSync(frontendNodeModulesDir)) {
  run("npm ci", frontendDir);
} else {
  console.log("> frontend node_modules existente, se omite npm ci local");
}

run("npm run build", frontendDir);

ensureExists(frontendDistDir, "La carpeta dist del frontend");
ensureExists(path.join(frontendDistDir, "index.html"), "El index compilado");
ensureExists(path.join(frontendDistDir, "assets"), "Los assets compilados");
ensureExists(path.join(htmlUploadDir, "_redirects"), "El archivo _redirects");

copyFileSync(path.join(frontendDistDir, "index.html"), path.join(rootDir, "index.html"));
copyFileSync(path.join(frontendDistDir, "index.html"), path.join(htmlUploadDir, "index.html"));

replaceDirectory(path.join(frontendDistDir, "assets"), rootAssetsDir);
replaceDirectory(path.join(frontendDistDir, "assets"), htmlUploadAssetsDir);

copyFileSync(path.join(htmlUploadDir, "_redirects"), path.join(rootDir, "_redirects"));

console.log("Sitio estatico sincronizado en raiz y html-upload.");

import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";

dotenv.config();

const { Client } = pkg;
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const schemaPath = path.resolve(currentDir, "../src/db/schema.sql");
const seedPath = path.resolve(currentDir, "../src/db/seed.sql");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no esta definida.");
  }

  const [schemaSql, seedSql] = await Promise.all([fs.readFile(schemaPath, "utf8"), fs.readFile(seedPath, "utf8")]);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("render.com") ? { rejectUnauthorized: false } : false
  });

  await client.connect();

  try {
    await client.query(schemaSql);
    await client.query(seedSql);
    console.log("Base de datos inicializada correctamente.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

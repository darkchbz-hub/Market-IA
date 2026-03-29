import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();
const jsonParser = express.json({ limit: "2mb" });
const rawStripeParser = express.raw({ type: "application/json" });
const allowedOrigins = new Set(env.clientUrls);
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const htmlUploadDir = path.resolve(currentDir, "../../html-upload");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === "null" || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origen no permitido por CORS."));
    },
    credentials: true
  })
);
app.use(helmet());
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/payments/webhook/stripe")) {
    return rawStripeParser(req, res, next);
  }

  return jsonParser(req, res, next);
});
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "marketzone-backend" });
});

app.use(express.static(htmlUploadDir));
app.use("/site", express.static(htmlUploadDir));
app.use("/api", apiRouter);
app.use(errorHandler);

import dotenv from "dotenv";

dotenv.config();

function parseClientUrls() {
  const rawValue =
    process.env.CLIENT_URLS ||
    process.env.CLIENT_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://localhost:5173";

  return [...new Set(rawValue.split(",").map((value) => value.trim()).filter(Boolean))];
}

const clientUrls = parseClientUrls();

export const env = {
  port: Number(process.env.PORT || 4000),
  clientUrl: clientUrls[0] || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173",
  clientUrls,
  serverUrl:
    process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${Number(process.env.PORT || 4000)}`,
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "replace-this-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  paypalEnv: process.env.PAYPAL_ENV || "sandbox",
  mercadopagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
  adminEmail: process.env.ADMIN_EMAIL || "admin@marketzone.mx"
};

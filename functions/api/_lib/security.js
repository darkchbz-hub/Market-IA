const encoder = new TextEncoder();
const decoder = new TextDecoder();
const tokenLifetimeSeconds = 60 * 60 * 24 * 30;

function bytesToBase64Url(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(input) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function derivePasswordHash(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    key,
    256
  );

  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const iterations = 100000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, iterations);

  return `pbkdf2_sha256$${iterations}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, iterationsText, saltText, expectedHash] = String(storedHash || "").split("$");

  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !saltText || !expectedHash) {
    return false;
  }

  const iterations = Number(iterationsText);

  if (!Number.isFinite(iterations) || iterations < 50000 || iterations > 100000) {
    return false;
  }

  const salt = base64UrlToBytes(saltText);
  const hash = await derivePasswordHash(password, salt, iterations);

  return constantTimeEqual(bytesToBase64Url(hash), expectedHash);
}

export async function signToken(payload, secret) {
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        ...payload,
        exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds
      })
    )
  );
  const key = await importHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  const signature = bytesToBase64Url(new Uint8Array(signatureBuffer));

  return `${header}.${body}.${signature}`;
}

export async function verifyToken(token, secret) {
  const [header, body, signature] = String(token || "").split(".");

  if (!header || !body || !signature) {
    throw new Error("Token invalido.");
  }

  const key = await importHmacKey(secret);
  const isValid = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), encoder.encode(`${header}.${body}`));

  if (!isValid) {
    throw new Error("Token invalido.");
  }

  const payload = JSON.parse(decoder.decode(base64UrlToBytes(body)));

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Tu sesion ya vencio.");
  }

  return payload;
}

export function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

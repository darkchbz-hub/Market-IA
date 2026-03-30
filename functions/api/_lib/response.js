const defaultHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=UTF-8"
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...defaultHeaders,
      ...headers
    }
  });
}

export function empty(status = 204, headers = {}) {
  return new Response(null, {
    status,
    headers: {
      ...defaultHeaders,
      ...headers
    }
  });
}

export function error(message, status = 400, details) {
  const payload = { message };

  if (details !== undefined) {
    payload.details = details;
  }

  return json(payload, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("El cuerpo de la solicitud no es JSON valido.");
  }
}

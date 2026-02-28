/**
 * Supabase proxy worker – forwards all requests to your Supabase project.
 * Use this worker URL as VITE_SUPABASE_URL so clients in India (Jio) can reach Supabase
 * without resolving *.supabase.co (which is blocked at DNS level).
 */

function getSupabaseOrigin(env) {
  const url = env?.SUPABASE_URL || "";
  if (!url) throw new Error("SUPABASE_URL not set in Worker vars (wrangler.toml [vars] or dashboard)");
  return url.replace(/\/$/, "");
}

function corsHeaders(origin, env) {
  const allowed = env?.ALLOWED_ORIGINS;
  const allowOrigin =
    allowed && origin && allowed.split(",").some((o) => o.trim() === origin)
      ? origin
      : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, apikey, Content-Type, Accept, Range",
    "Access-Control-Max-Age": "86400",
  };
}

function copyForwardHeaders(request, forWebSocket = false) {
  const headers = new Headers();
  const skip = new Set([
    "host",
    "connection",
    "cf-connecting-ip",
    "cf-ray",
    "cf-visitor",
    ...(forWebSocket ? [] : ["upgrade", "sec-websocket-key", "sec-websocket-version", "sec-websocket-extensions", "sec-websocket-protocol"]),
  ]);
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!skip.has(lower)) headers.set(key, value);
  });
  return headers;
}

async function handleWebSocket(request, upstreamOrigin, env) {
  const url = new URL(request.url);
  const upstreamUrl = `${upstreamOrigin}${url.pathname}${url.search}`;
  const headers = copyForwardHeaders(request, true);
  headers.set("Host", new URL(upstreamOrigin).host);

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    redirect: "manual",
  });

  if (upstreamResponse.status !== 101 || !upstreamResponse.webSocket) {
    return new Response("WebSocket upgrade failed", {
      status: upstreamResponse.status || 502,
    });
  }

  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  const upstream = upstreamResponse.webSocket;
  upstream.accept();

  function relay(from, to) {
    from.addEventListener("message", (e) => {
      try {
        to.send(e.data);
      } catch (_) {}
    });
    from.addEventListener("close", () => {
      try {
        to.close();
      } catch (_) {}
    });
    from.addEventListener("error", () => {
      try {
        to.close(1011, "Relay error");
      } catch (_) {}
    });
  }

  relay(server, upstream);
  relay(upstream, server);

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function handleRequest(request, upstreamOrigin, env) {
  const url = new URL(request.url);
  const upstreamUrl = `${upstreamOrigin}${url.pathname}${url.search}`;
  const headers = copyForwardHeaders(request);
  headers.set("Host", new URL(upstreamOrigin).host);

  const res = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(res.headers);
  const origin = request.headers.get("Origin");
  Object.entries(corsHeaders(origin, env)).forEach(([k, v]) =>
    responseHeaders.set(k, v)
  );

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        headers: corsHeaders(origin, env),
      });
    }

    const upstreamOrigin = getSupabaseOrigin(env);
    const upgrade = request.headers.get("Upgrade");

    if (upgrade && upgrade.toLowerCase() === "websocket") {
      return handleWebSocket(request, upstreamOrigin, env);
    }

    return handleRequest(request, upstreamOrigin, env);
  },
};

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    if (type.includes("text/html")) {
      let html = await response.text();

      // Keep the HTML shell deterministic. Older deployments accumulated
      // several calculation/recommendation patches over time; remove any
      // copies they may have embedded and inject exactly one copy of each
      // required extension. The final calculation lock is authoritative.
      const injected = [
        "meatfest-additions.js",
        "porkbelly-fix.js",
        "protein-order-fix.js",
        "side-order-fix.js",
        "recommendation-fix.js",
        "meatfest-calculation-fix.js",
        "meatfest-calculation-lock.js",
      ];
      for (const name of injected) {
        const re = new RegExp(`<script\\s+src=[\"']\\/${name}(?:\\?[^\"']*)?[\"']\\s*><\\/script>`, "gi");
        html = html.replace(re, "");
      }

      const scripts = [
        '<script src="/meatfest-additions.js?v=3"></script>',
        '<script src="/porkbelly-fix.js?v=4"></script>',
        '<script src="/protein-order-fix.js?v=3"></script>',
        '<script src="/side-order-fix.js?v=3"></script>',
        '<script src="/recommendation-fix.js?v=5"></script>',
        '<script src="/meatfest-calculation-lock.js?v=3"></script>',
      ].join("");

      html = html.replace("</body>", `${scripts}</body>`);

      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.delete("ETag");
      headers.delete("Content-Length");
      return new Response(html, { status: response.status, headers });
    }

    // Assets involved in application behavior must not be served from a
    // stale browser/edge cache. This also keeps multiple simultaneous testers
    // on the same deployed calculation code.
    if (type.includes("javascript") || new URL(request.url).pathname.endsWith(".js")) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.delete("ETag");
      headers.delete("Content-Length");
      return new Response(response.body, { status: response.status, headers });
    }

    return response;
  },
};

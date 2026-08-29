export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    if (type.includes("text/html")) {
      let html = await response.text();

      // One authoritative runtime calculation layer. Legacy patch scripts are
      // stripped so an old override cannot silently take control again.
      const stale = [
        "meatfest-additions.js",
        "family-fix.js",
        "porkbelly-fix.js",
        "protein-order-fix.js",
        "side-order-fix.js",
        "recommendation-fix.js",
        "meatfest-calculation-lock.js",
        "meatfest-calculation-fix.js",
        "turkey-fix.js",
        "app.js",
      ];
      for (const name of stale) {
        const re = new RegExp(`<script\\s+src=[\"']\\/${name}(?:\\?[^\"']*)?[\"']\\s*><\\/script>`, "gi");
        html = html.replace(re, "");
      }

      html = html.replace("</body>", '<script src="/meatfest-final.js?v=2.2.7"></script></body>');

      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.delete("ETag");
      headers.delete("Content-Length");
      return new Response(html, { status: response.status, headers });
    }

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

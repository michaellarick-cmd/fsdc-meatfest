export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    if (type.includes("text/html")) {
      let html = await response.text();

      // The HTML contains the stable base UI/calculation. Only these two
      // runtime extensions are authoritative: additions adds supported
      // proteins/sides; final owns the visible Meatfest calculation.
      const stale = [
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

      const scripts = [
        '<script src="/meatfest-additions.js?v=clean1"></script>',
        '<script src="/meatfest-final.js?v=clean1"></script>',
      ].join("");
      html = html.replace("</body>", `${scripts}</body>`);

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

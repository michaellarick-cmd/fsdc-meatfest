export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    if (type.includes("text/html")) {
      let html = await response.text();

      // The public HTML contains legacy inline bootstrap code. Remove that
      // block and let the application boot from one clean source of truth.
      html = html.replace(/<script>\s*const meats=\{[\s\S]*?<\/script>/i, "");

      // Remove any legacy injected scripts that may also be present in the
      // asset so they cannot overwrite the authoritative calculation pass.
      const legacy = [
        "meatfest-additions.js","porkbelly-fix.js","protein-order-fix.js",
        "side-order-fix.js","recommendation-fix.js","meatfest-calculation-lock.js",
        "meatfest-calculation-fix.js","meatfest-render-repair.js","prime-rib-fix.js",
        "meatfest-final.js"
      ];
      for (const name of legacy) {
        const re = new RegExp(`<script\\s+src=[\"']\\/${name}(?:\\?[^\"']*)?[\"']\\s*><\\/script>`, "gi");
        html = html.replace(re, "");
      }

      // One application boot + one authoritative Meatfest calculation pass.
      const scripts = [
        '<script src="/app.js?v=9"></script>',
        '<script src="/meatfest-final.js?v=5"></script>'
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

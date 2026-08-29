export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    // HTML is assembled by the Worker so every new browser session receives
    // the current fix chain. JavaScript is explicitly non-cacheable so a
    // previous deployment cannot survive in one user's browser while another
    // user receives the current deployment.
    if (type.includes("text/html")) {
      let html = await response.text();
      const recommendationScript = '<script src="/recommendation-fix.js?v=4"></script>';
      const calculationScript = '<script src="/meatfest-calculation-fix.js?v=4"></script>';
      const calculationLockScript = '<script src="/meatfest-calculation-lock.js?v=2"></script>';

      if (!html.includes("/meatfest-additions.js")) {
        html = html.replace("</body>", `<script src="/meatfest-additions.js?v=2"></script><script src="/porkbelly-fix.js?v=3"></script><script src="/protein-order-fix.js?v=2"></script><script src="/side-order-fix.js?v=2"></script>${recommendationScript}${calculationScript}</body>`);
      } else if (!html.includes("/porkbelly-fix.js")) {
        html = html.replace("</body>", `<script src="/porkbelly-fix.js?v=3"></script><script src="/protein-order-fix.js?v=2"></script><script src="/side-order-fix.js?v=2"></script>${recommendationScript}${calculationScript}</body>`);
      } else if (!html.includes("/protein-order-fix.js")) {
        html = html.replace("</body>", `<script src="/protein-order-fix.js?v=2"></script><script src="/side-order-fix.js?v=2"></script>${recommendationScript}${calculationScript}</body>`);
      } else if (!html.includes("/side-order-fix.js")) {
        html = html.replace("</body>", `<script src="/side-order-fix.js?v=2"></script>${recommendationScript}${calculationScript}</body>`);
      } else if (!html.includes("/recommendation-fix.js")) {
        html = html.replace("</body>", `${recommendationScript}${calculationScript}</body>`);
      } else if (!html.includes("/meatfest-calculation-fix.js")) {
        html = html.replace("</body>", `${calculationScript}</body>`);
      }

      // Always append the final calculation lock LAST.
      html = html.replace("</body>", `${calculationLockScript}</body>`);
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.delete("ETag");
      headers.delete("Content-Length");
      return new Response(html, { status: response.status, headers });
    }

    // JavaScript must never be served from a stale browser/edge cache. This
    // is critical because the app has had multiple calculation fix scripts;
    // users must not receive different versions of those scripts concurrently.
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

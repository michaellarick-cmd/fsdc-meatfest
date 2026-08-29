export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) return response;
    let html = await response.text();
    const recommendationScript = '<script src="/recommendation-fix.js?v=3"></script>';
    const calculationScript = '<script src="/meatfest-calculation-fix.js?v=3"></script>';
    const calculationLockScript = '<script src="/meatfest-calculation-lock.js?v=1"></script>';
    if (!html.includes("/meatfest-additions.js")) {
      html = html.replace("</body>", `<script src="/meatfest-additions.js?v=1"></script><script src="/porkbelly-fix.js?v=2"></script><script src="/protein-order-fix.js?v=1"></script><script src="/side-order-fix.js?v=1"></script>${recommendationScript}${calculationScript}</body>`);
    } else if (!html.includes("/porkbelly-fix.js")) {
      html = html.replace("</body>", `<script src="/porkbelly-fix.js?v=2"></script><script src="/protein-order-fix.js?v=1"></script><script src="/side-order-fix.js?v=1"></script>${recommendationScript}${calculationScript}</body>`);
    } else if (!html.includes("/protein-order-fix.js")) {
      html = html.replace("</body>", `<script src="/protein-order-fix.js?v=1"></script><script src="/side-order-fix.js?v=1"></script>${recommendationScript}${calculationScript}</body>`);
    } else if (!html.includes("/side-order-fix.js")) {
      html = html.replace("</body>", `<script src="/side-order-fix.js?v=1"></script>${recommendationScript}${calculationScript}</body>`);
    } else if (!html.includes("/recommendation-fix.js")) {
      html = html.replace("</body>", `${recommendationScript}${calculationScript}</body>`);
    } else if (!html.includes("/meatfest-calculation-fix.js")) {
      html = html.replace("</body>", `${calculationScript}</body>`);
    }
    // Always append the final calculation lock LAST. This is intentional:
    // app.js contains the legacy calc(), and any earlier fix can be loaded
    // before it or be cached. The lock is the single authoritative path.
    html = html.replace("</body>", `${calculationLockScript}</body>`);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.delete("ETag");
    headers.delete("Content-Length");
    return new Response(html, { status: response.status, headers });
  },
};

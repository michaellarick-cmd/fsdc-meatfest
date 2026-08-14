export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) return response;
    let html = await response.text();
    if (!html.includes("/meatfest-additions.js")) {
      html = html.replace("</body>", "<script src=\"/meatfest-additions.js?v=1\"></script><script src=\"/porkbelly-fix.js?v=2\"></script><script src=\"/protein-order-fix.js?v=1\"></script></body>");
    } else if (!html.includes("/porkbelly-fix.js")) {
      html = html.replace("</body>", "<script src=\"/porkbelly-fix.js?v=2\"></script><script src=\"/protein-order-fix.js?v=1\"></script></body>");
    } else if (!html.includes("/protein-order-fix.js")) {
      html = html.replace("</body>", "<script src=\"/protein-order-fix.js?v=1\"></script></body>");
    }
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.delete("ETag");
    headers.delete("Content-Length");
    return new Response(html, { status: response.status, headers });
  },
};

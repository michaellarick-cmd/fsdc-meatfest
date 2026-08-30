export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    // Keep the live-facing total label correct even when an older cached
    // index.html is served by the asset layer. The value is purchase weight,
    // not an unrounded raw-meat requirement.
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const html = await response.text();
        const fixed = html
          .replaceAll("TOTAL RAW MEAT TO BUY", "TOTAL PURCHASE WEIGHT")
          .replaceAll("TOTAL RAW MEAT</span>", "TOTAL PURCHASE WEIGHT</span>");
        const headers = new Headers(response.headers);
        headers.set("cache-control", "no-store, max-age=0");
        return new Response(fixed, { status: response.status, statusText: response.statusText, headers });
      }
    }

    return response;
  },
};

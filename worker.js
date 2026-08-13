export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";
    if (type.includes("text/html")) {
      const html = await response.text();
      const injected = html.replace("</body>", '<script src="/family-fix.js"></script></body>');
      return new Response(injected, { status: response.status, headers: response.headers });
    }
    return response;
  },
};

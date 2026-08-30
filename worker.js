export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    if (type.includes("text/html")) {
      const html = await response.text();
      const enhanced = html
        .replace('</head>', '<link rel="stylesheet" href="/side-cleanup.css?v=1"></head>')
        .replace('</body>', '<script src="/side-cleanup.js?v=1"></script></body>');
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.delete("ETag");
      headers.delete("Content-Length");
      return new Response(enhanced, { status: response.status, headers });
    }

    if (type.includes("javascript")) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.delete("ETag");
      headers.delete("Content-Length");
      return new Response(response.body, { status: response.status, headers });
    }

    return response;
  },
};

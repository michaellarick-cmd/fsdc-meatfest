export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    if (type.includes("text/html")) {
      let html = await response.text();

      // The source index currently contains an inline V2 data/override block
      // followed by app.js. Both declare top-level const/let bindings with
      // the same names, which causes app.js to fail parsing and leaves the
      // protein cards blank. Keep app.js as the single application runtime.
      html = html.replace(/<script>\s*const meats=\{[\s\S]*?<\/script>/i, "");

      const injected = [
        "meatfest-additions.js",
        "porkbelly-fix.js",
        "protein-order-fix.js",
        "side-order-fix.js",
        "recommendation-fix.js",
        "meatfest-calculation-lock.js",
        "prime-rib-fix.js",
        "meatfest-calculation-fix.js",
        "meatfest-render-repair.js",
      ];
      for (const name of injected) {
        const re = new RegExp(`<script\\s+src=[\"']\\/${name}(?:\\?[^\"']*)?[\"']\\s*><\\/script>`, "gi");
        html = html.replace(re, "");
      }

      const scripts = [
        '<script src="/app.js?v=6"></script>',
        '<script>\n'
          + 'try {\n'
          + '  if (typeof meats !== "undefined") {\n'
          + '    meats.chicken.options.whole.unitWeight = 5;\n'
          + '    meats.chicken.options.whole.note = "Meatfest planning unit: about 5 lb per whole chicken.";\n'
          + '    meats.prime.options = {\n'
          + '      boneless: {label:"Boneless Prime Rib — Recommended",yield:.75,unitWeight:5,unit:"boneless roast",mode:"units",note:"Boneless is the recommended Meatfest purchase: efficient to portion and carve."},\n'
          + '      bone: {label:"Bone-in Standing Rib Roast",yield:.60,unitWeight:5,unit:"bone-in roast",mode:"units",note:"Choose bone-in when presentation or cooking preference warrants it; lower edible yield is reflected in the calculation."}\n'
          + '    };\n'
          + '    meats.prime.default = "boneless";\n'
          + '  }\n'
          + '  if (typeof renderMeats === "function") renderMeats();\n'
          + '  if (typeof renderSideCards === "function") renderSideCards();\n'
          + '  if (typeof calc === "function") calc();\n'
          + '} catch (e) { console.error("Meatfest boot repair failed", e); }\n'
          + '</script>',
        '<script src="/meatfest-additions.js?v=4"></script>',
        '<script src="/porkbelly-fix.js?v=4"></script>',
        '<script src="/protein-order-fix.js?v=3"></script>',
        '<script src="/side-order-fix.js?v=3"></script>',
        '<script src="/recommendation-fix.js?v=5"></script>',
        '<script src="/meatfest-calculation-lock.js?v=4"></script>',
        '<script src="/meatfest-render-repair.js?v=2"></script>',
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

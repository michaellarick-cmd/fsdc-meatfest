const SIDES_MARKER = "/* FSDC-NEW-SIDES-INTEGRATED */";
const TURKEY_MARKER = "/* FSDC-TURKEY-INTEGRATED */";

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    // JavaScript is a separate asset from index.html.  Side definitions must
    // be integrated into app.js itself; injecting them into HTML does not
    // reach app.js's lexical `const sides` / `sideOrder` scope.
    if (type.includes("javascript")) {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/app.js")) {
        let js = await response.text();
        if (!js.includes(SIDES_MARKER)) {
          const sideDefinitions = `\n${SIDES_MARKER}\nsides.greenbeans={name:"Green Beans",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};\nsides.potatosalad={name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};\nsides.asparagus={name:"Asparagus",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};\nsides.pastasalad={name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic cold BBQ side; practical make-ahead option."};\n`;
          js = js.replace('};\nlet selectedSides=new Set();', '};' + sideDefinitions + 'let selectedSides=new Set();');
          js = js.replace('const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","corn","cornbread","rolls"];', 'const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","greenbeans","potatosalad","asparagus","pastasalad","corn","cornbread","rolls"];');
        }
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        headers.delete("ETag");
        headers.delete("Content-Length");
        return new Response(js, { status: response.status, headers });
      }

      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.delete("ETag");
      headers.delete("Content-Length");
      return new Response(response.body, { status: response.status, headers });
    }

    if (!type.includes("text/html")) return response;

    let html = await response.text();

    // Turkey is intentionally integrated into the same HTML transform used
    // by the existing application, preserving the meat-engine implementation.
    if (!html.includes(TURKEY_MARKER)) {
      const turkeyDefinition = '\n' + TURKEY_MARKER + '\n' + 'meats.turkey={name:"Turkey",default:"whole",options:{whole:{label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units"},breast:{label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units"},legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units"}}};';
      html = html.replace('const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs"];', turkeyDefinition + '\nconst order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs","turkey"];');
    }

    // Side definitions are no longer injected here. They belong in app.js,
    // where the actual side calculation/rendering scope lives.
    html = html
      .replace('</head>', '<link rel="stylesheet" href="/side-cleanup.css?v=2"></head>')
      .replace('</body>', '<script src="/side-cleanup.js?v=2"></script></body>');

    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.delete("ETag");
    headers.delete("Content-Length");
    return new Response(html, { status: response.status, headers });
  },
};

const SIDES_MARKER = "/* FSDC-NEW-SIDES-INTEGRATED */";
const TURKEY_MARKER = "/* FSDC-TURKEY-INTEGRATED */";
const RECOMMENDATION_MARKER = "/* FSDC-SIDE-RECOMMENDATIONS-V2 */";

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";

    // Side definitions and recommendation rules must be integrated into
    // app.js itself because its side data/functions are lexical scope.
    if (type.includes("javascript")) {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/app.js")) {
        let js = await response.text();

        if (!js.includes(SIDES_MARKER)) {
          const sideDefinitions = `\n${SIDES_MARKER}\nsides.greenbeans={name:"Green Beans",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};\nsides.potatosalad={name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};\nsides.asparagus={name:"Asparagus",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};\nsides.pastasalad={name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic cold BBQ side; practical make-ahead option."};\n`;
          js = js.replace('};\nlet selectedSides=new Set();', '};' + sideDefinitions + 'let selectedSides=new Set();');
          js = js.replace('const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","corn","cornbread","rolls"];', 'const sideOrder=["asparagus","beans","broccoli","cauli","collards","corn","cucumber","greenbeans","kraut","mac","pastasalad","potatosalad","slaw","cornbread","rolls"];');
        }

        if (!js.includes(TURKEY_MARKER)) {
          const turkeyDefinition = `\n${TURKEY_MARKER}\nmeats.turkey={name:"Turkey",default:"whole",options:{whole:{label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units"},breast:{label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units"},legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units"}}};\n`;
          js = js.replace('\n};\n\n/*\n * Current recommendation engine', '\n};' + turkeyDefinition + '\n/*\n * Current recommendation engine');
          js = js.replace('const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs"];', 'const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs","turkey"];');
        }

        if (!js.includes(RECOMMENDATION_MARKER)) {
          // Turkey intentionally inherits every chicken/poultry recommendation.
          js = js.replace('if(k==="hog") tags.add("whole_hog");', 'if(k==="hog") tags.add("whole_hog");\n    if(k==="turkey"){ tags.add("turkey"); tags.add("chicken_pulled"); tags.add("chicken_quarters"); tags.add("chicken_thighs"); }');

          // Prime rib: classic vegetable pairings.
          js = js.replace('case "kraut":\n      return active.has("brats");', 'case "kraut":\n      return active.has("brats");\n    case "greenbeans":\n      return hasAnyTag(["prime_rib"]);\n    case "asparagus":\n      return hasAnyTag(["prime_rib"]);\n    case "potatosalad":\n      return active.size>0;\n    case "pastasalad":\n      return active.size>0;');

          js = js.replace('const sideOrder=["asparagus","beans","broccoli","cauli","collards","corn","cucumber","greenbeans","kraut","mac","pastasalad","potatosalad","slaw","cornbread","rolls"];', 'const sideOrder=["asparagus","beans","broccoli","cauli","collards","corn","cucumber","greenbeans","kraut","mac","pastasalad","potatosalad","slaw","cornbread","rolls"];');
          js = js.replace('function sideRecommendation(id){', `${RECOMMENDATION_MARKER}\nfunction sideRecommendation(id){`);
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

    // side-cleanup only polishes presentation; calculation/recommendation
    // integration stays in app.js scope via the transform above.
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
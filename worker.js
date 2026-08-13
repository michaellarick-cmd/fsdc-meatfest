const SIDES_MARKER = "/* FSDC-NEW-SIDES-INTEGRATED */";
const TURKEY_MARKER = "/* FSDC-TURKEY-INTEGRATED */";

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) return response;

    let html = await response.text();

    if (!html.includes(TURKEY_MARKER)) {
      const turkeyDefinition = '\n' + TURKEY_MARKER + '\n' + 'meats.turkey={name:"Turkey",default:"whole",options:{whole:{label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units"},breast:{label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units"},legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units"}}};';
      html = html.replace('const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs"];', turkeyDefinition + '\nconst order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs","turkey"];');
    }

    if (!html.includes(SIDES_MARKER)) {
      const newSides = '\n' + SIDES_MARKER + '\n' +
        'sides.greenbeans={name:"Green Beans",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};' +
        'sides.asparagus={name:"Asparagus",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};' +
        'sides.potatosalad={name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};' +
        'sides.pastasalad={name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};';
      html = html.replace('let selectedSides=new Set();', newSides + '\nlet selectedSides=new Set();');
      html = html.replace('const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","corn","cornbread","rolls"];', 'const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","greenbeans","asparagus","potatosalad","pastasalad","corn","cornbread","rolls"];');
    }

    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.delete("ETag");
    headers.delete("Content-Length");
    return new Response(html, { status: response.status, headers });
  },
};

const TURKEY_MARKER = "/* FSDC-TURKEY-INTEGRATED */";

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) return response;

    let html = await response.text();

    if (!html.includes(TURKEY_MARKER)) {
      const turkeyDefinition = '\n' + TURKEY_MARKER + '\n' +
        'meats.turkey={name:"Turkey",default:"whole",options:{' +
        'whole:{label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units",note:"Whole-bird purchase; practical bird sizes are used and leftovers are planned."},' +
        'breast:{label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units",note:"Bone-in turkey breast; practical for Texas-style smoked turkey and smaller gatherings."},' +
        'legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units",note:"Individual BBQ turkey legs; purchase by the leg rather than by bulk weight."}' +
        '}};';

      html = html.replace(
        'const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs"];',
        turkeyDefinition + '\nconst order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs","turkey"];'
      );

      const turkeyFamilyFunction = '\nfunction turkeyFamilyPurchase(o,bought){' +
        'const form=choices.turkey||"whole";' +
        'const lb=x=>Math.ceil((x-1e-9)*10)/10;' +
        'if(form==="whole"){const w=Math.max(8,Math.ceil((bought-1e-9)/2)*2);return {units:1,buyWeight:w,buy:"ASK FOR ~"+lb(w)+" lb whole turkey",note:"Family-size whole bird; a smaller turkey is practical for a small BBQ and excess is planned leftovers."};}' +
        'if(form==="breast"){const w=Math.max(3,Math.ceil((bought-1e-9)*2)/2);return {units:1,buyWeight:w,buy:"ASK FOR ~"+lb(w)+" lb turkey breast",note:"Turkey breast is a practical alternative when a whole bird is unavailable or not wanted."};}' +
        'const legWeight=.75,legs=Math.max(1,Math.ceil((bought-1e-9)/legWeight)),w=legs*legWeight;' +
        'return {units:legs,buyWeight:w,buy:"BUY "+legs+" turkey leg"+(legs===1?"":"s")+" (~"+lb(w)+" lb total)",note:"BBQ turkey legs are planned and purchased as individual legs."};' +
        '}\n';

      html = html.replace('function calc(){', turkeyFamilyFunction + 'function calc(){');
      const familyCall = 'const fp=familyPurchase(k,o,bought);';
      const turkeyCall = 'const fp=familyPurchase(k,o,bought)||(k==="turkey"?turkeyFamilyPurchase(o,bought):null);';
      html = html.split(familyCall).join(turkeyCall);
    }

    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.delete("ETag");
    headers.delete("Content-Length");
    return new Response(html, { status: response.status, headers });
  },
};

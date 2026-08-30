const ASSET_VERSION="7cc54fe";

export default {
  async fetch(request, env) {
    const response=await env.ASSETS.fetch(request);
    const contentType=response.headers.get("content-type")||"";
    if(request.method!=="GET"||!contentType.includes("text/html"))return response;
    const html=await response.text();
    const rewritten=html.replaceAll("?v=2.2.9",`?v=${ASSET_VERSION}`);
    const headers=new Headers(response.headers);
    headers.set("Cache-Control","no-store, max-age=0");
    return new Response(rewritten,{status:response.status,statusText:response.statusText,headers});
  },
};

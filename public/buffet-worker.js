/* FSDC Meatfest — worker bridge for the buffet planning engine. */
self.window=self;
importScripts('/buffet-engine.js?v=worker');

const B=self.BuffetEngine;
if(!B||typeof B.plan!=='function')throw new Error('BuffetEngine.plan is unavailable in buffet worker');

self.onmessage=event=>{
  const {id,input}=event.data||{};
  try{
    const plan=B.plan(input||{});
    self.postMessage({id,plan,result:plan});
  }catch(error){
    self.postMessage({id,error:String(error?.stack||error)});
  }
};

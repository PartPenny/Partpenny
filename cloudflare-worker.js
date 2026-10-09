// PartPenny V3.3 — Cloudflare Worker (free tier)
// First source: Eskimo Auto & Truck Parts public remanufactured engine catalog.
// The catalog publishes CAD engine prices, NOT verified stock or US landed costs.
const ALLOWED_ORIGIN = 'https://partpenny.github.io';
const CATALOG = 'https://www.eskimoautoandtruckparts.com/api/public/engines.json';
const SELLER = 'https://www.eskimoautoandtruckparts.com/remanufactured-engines';
function respond(body, status=200) {
  return new Response(JSON.stringify(body), {status, headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Access-Control-Allow-Origin':ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods':'GET, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Cache-Control':'no-store'
  }});
}
function pick(obj, keys) {for(const key of keys){const v=obj?.[key];if(v!==undefined&&v!==null&&v!=='')return v;}return null;}
function text(v){return String(v??'').toLowerCase().trim();}
function money(v){if(typeof v==='number')return Number.isFinite(v)?v:null;if(typeof v==='string'){const n=Number(v.replace(/[$,\s]/g,''));return Number.isFinite(n)?n:null;}return null;}
function rowsFrom(j){for(const key of ['engines','products','items','results','data','catalog']){if(Array.isArray(j?.[key]))return j[key];}return Array.isArray(j)?j:[];}
export default {async fetch(request){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if(request.method!=='GET')return respond({error:'Method not allowed'},405);
  const url=new URL(request.url);
  if(url.pathname==='/')return respond({application:'PartPenny',status:'online',version:'3.4',message:'Search API online; Putco and Eskimo catalog integrations enabled'});
  if(url.pathname!=='/api/search')return respond({error:'Endpoint not found'},404);
  const year=url.searchParams.get('year')?.trim();const make=url.searchParams.get('make')?.trim();const model=url.searchParams.get('model')?.trim();const part=url.searchParams.get('part')?.trim();
  if(!year||!make||!model||!part)return respond({error:'Vehicle and part required'},400);
  const base={vehicle:{year,make,model},requestedPart:part,results:[],listings:[],sourcesChecked:0,candidates:[]};
  const condition=text(url.searchParams.get('condition'));
  const enginePart=/\b(engine|motor|long block|short block)\b/i.test(part);
  const tasks=[];
  if(enginePart && (!condition || condition==='remanufactured')) tasks.push((async()=>{
    const r=await fetch(CATALOG+'?limit=500&offset=0',{headers:{Accept:'application/json'},cf:{cacheTtl:900,cacheEverything:true}});
    if(!r.ok)throw Error('Eskimo HTTP '+r.status);
    const j=await r.json();const found=[];
    for(const item of rowsFrom(j)){
      const title=pick(item,['title','name','product_name','description','engine','part_number']);
      const fit=pick(item,['fitment','application','applications','vehicle','vehicles','fits']);
      const hay=text([title,typeof fit==='string'?fit:JSON.stringify(fit??'')].join(' '));
      if(!hay.includes(text(make))||!hay.includes(text(model)))continue;
      if(fit&&/\b(19|20)\d{2}\b/.test(hay)&&!hay.includes(year))continue;
      const price=money(pick(item,['price_cad','priceCAD','online_price','sale_price','price']));
      if(price===null||price<=0)continue;
      const rawUrl=pick(item,['url','product_url','link']);let link=SELLER;
      if(typeof rawUrl==='string'){try{const u=new URL(rawUrl,'https://www.eskimoautoandtruckparts.com');if(u.protocol==='https:'&&u.hostname.endsWith('eskimoautoandtruckparts.com'))link=u.toString();}catch{}}
      found.push({title:String(title||'Remanufactured engine').slice(0,180),priceCAD:price,price,currency:'CAD',url:link,condition:'remanufactured',seller:'Eskimo Auto & Truck Parts',availability:'unverified',fitment:'unverified',fitmentNote:'Seller must confirm year, engine and fitment',shippingNote:'Shipping, taxes and core charge not verified'});
    }
    return {source:'Eskimo',found:found.sort((a,b)=>a.price-b.price).slice(0,30),morePagesAvailable:!!j?.pagination?.next};
  })());
  if(!condition || condition==='new') tasks.push((async()=>{
    // Putco publishes this endpoint specifically for third-party AI/product integrations.
    // Search by part only; never present results as compatible without YMM evidence.
    const api='https://www.putco.com/ai/search-products?q='+encodeURIComponent(part.slice(0,80))+'&country=us';
    const r=await fetch(api,{headers:{Accept:'application/json'},cf:{cacheTtl:600,cacheEverything:true}});
    if(!r.ok)throw Error('Putco HTTP '+r.status);
    const j=await r.json();const found=[];
    for(const item of Array.isArray(j?.results)?j.results:[]){
      if(text(item.condition)!=='new')continue;
      const apps=Array.isArray(item.ymm_applications)?item.ymm_applications:[];
      const matching=apps.filter(a=>Number(year)>=Number(a.start_year)&&Number(year)<=Number(a.end_year)&&text(a.make)===text(make)&&text(a.model).replace(/[^a-z0-9]/g,'')===text(model).replace(/[^a-z0-9]/g,''));
      if(!matching.length)continue;
      const cost=money(item.sale_price)||money(item.price);
      if(!cost||cost<=0)continue;
      let link;try{link=new URL(item.url);if(link.protocol!=='https:'||!['putco.com','www.putco.com'].includes(link.hostname))continue;}catch{continue;}
      const options=[...new Set(matching.map(a=>String(a.options||'').trim()).filter(Boolean))];
      const restrictions=options.length?options.join(' / '):'Check configuration and package options';
      found.push({title:String(item.title||'Putco product').slice(0,180),price:cost,currency:'USD',url:link.toString(),condition:'new',seller:'Putco',availability:item.availability==='in_stock'?'reported_in_stock':'unverified',fitment:'year_make_model_match',fitmentNote:restrictions,shippingNote:'Taxes, checkout shipping and final fitment must be confirmed',sku:item.sku||item.item_id||null});
    }
    return {source:'Putco',found,morePagesAvailable:!!j?.pagination?.total_found&&j.pagination.total_found>j.pagination.returned};
  })());
  const settled=await Promise.allSettled(tasks);
  const candidates=[],checked=[],failed=[];let morePagesAvailable=false;
  for(const x of settled){if(x.status==='fulfilled'){checked.push(x.value.source);candidates.push(...x.value.found);morePagesAvailable ||= x.value.morePagesAvailable;}else failed.push(String(x.reason?.message||'Source error'));}
  // Different currencies cannot be compared as if equal; order USD then CAD separately.
  candidates.sort((a,b)=>a.currency.localeCompare(b.currency)*-1||a.price-b.price);
  return respond({...base,status:checked.length?'catalog_checked':tasks.length?'source_unavailable':'unsupported_condition',sourcesChecked:checked.length,sources:checked,sourceErrors:failed,candidates:candidates.slice(0,60),morePagesAvailable,catalogCurrency:'mixed',catalogScope:'Putco new accessories and Eskimo remanufactured engines; limited search pages',message:checked.length?'Published product prices, not delivered totals. Confirm fitment, package restrictions, stock, shipping, core charges and taxes with each seller.':'No connected source returned prices for this part and condition. Use retailer search links.'});
}};

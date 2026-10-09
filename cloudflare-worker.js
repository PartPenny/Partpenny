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
  if(url.pathname==='/')return respond({application:'PartPenny',status:'online',version:'3.3',message:'Search API online; public engine catalog integration enabled'});
  if(url.pathname!=='/api/search')return respond({error:'Endpoint not found'},404);
  const year=url.searchParams.get('year')?.trim();const make=url.searchParams.get('make')?.trim();const model=url.searchParams.get('model')?.trim();const part=url.searchParams.get('part')?.trim();
  if(!year||!make||!model||!part)return respond({error:'Vehicle and part required'},400);
  const base={vehicle:{year,make,model},requestedPart:part,results:[],listings:[],sourcesChecked:0,candidates:[]};
  if(!/\b(engine|motor|long block|short block)\b/i.test(part))return respond({...base,status:'unsupported_part',message:'Only remanufactured engine catalog data is connected. Other parts have no live price source.'});
  if(url.searchParams.get('condition')==='new'||url.searchParams.get('condition')==='used')return respond({...base,status:'unsupported_condition',message:'Source contains remanufactured engines only.'});
  try{
    const r=await fetch(CATALOG+'?limit=500&offset=0',{headers:{Accept:'application/json'},cf:{cacheTtl:900,cacheEverything:true}});
    if(!r.ok)throw Error('Catalog HTTP '+r.status);
    const j=await r.json();const rows=rowsFrom(j);const candidates=[];
    // Conservative match: the make and model must be present in a catalog item's
    // explicit description/fitment. Year must also appear when year data is given.
    for(const item of rows){
      const title=pick(item,['title','name','product_name','description','engine','part_number']);
      const fit=pick(item,['fitment','application','applications','vehicle','vehicles','fits']);
      const hay=text([title,typeof fit==='string'?fit:JSON.stringify(fit??'')].join(' '));
      if(!hay.includes(text(make))||!hay.includes(text(model)))continue;
      if(fit&&/\b(19|20)\d{2}\b/.test(hay)&&!hay.includes(year))continue;
      const price=money(pick(item,['price_cad','priceCAD','online_price','sale_price','price']));
      if(price===null||price<=0)continue;
      const rawUrl=pick(item,['url','product_url','link']);let link=SELLER;
      if(typeof rawUrl==='string'){try{const u=new URL(rawUrl,'https://www.eskimoautoandtruckparts.com');if(u.protocol==='https:'&&u.hostname.endsWith('eskimoautoandtruckparts.com'))link=u.toString();}catch{}}
      candidates.push({title:String(title||'Remanufactured engine').slice(0,180),priceCAD:price,url:link,condition:'remanufactured',currency:'CAD',availability:'unverified',fitment:'unverified'});
    }
    candidates.sort((a,b)=>a.priceCAD-b.priceCAD);
    return respond({...base,status:'catalog_checked',sourcesChecked:1,candidates:candidates.slice(0,30),catalogCurrency:'CAD',catalogScope:'Remanufactured engines; first 500 records only',morePagesAvailable:!!j?.pagination?.next,message:'Catalog prices are reference-only; stock, compatibility, shipping, core deposit and taxes are not confirmed.'});
  }catch(e){return respond({...base,status:'source_unavailable',message:'Engine catalog temporarily unavailable; no prices verified.'});}
}};

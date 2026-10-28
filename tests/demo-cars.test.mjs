import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
const src = stripTypeScriptTypes(await readFile(new URL('../lib/demo-cars.ts',import.meta.url),'utf8'));
const {createDemoCars,seedDemoCatalog,upgradeDemoPhotos,DEMO_SEED_KEY}=await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
test('50 unique demo cars cover all 24 makes and nine body types without real contact details',async()=>{
 const cars=createDemoCars();assert.equal(cars.length,50);assert.equal(new Set(cars.map(c=>c.id)).size,50);
 assert.equal(new Set(cars.map(c=>c.brand)).size,24);assert.equal(new Set(cars.map(c=>c.category)).size,9);
 for(const c of cars){assert.equal(c.isDemo,true);assert.equal(c.status,'running');assert.equal(c.sellerPhone,'');assert.ok(c.price>0);assert.ok(c.km>0);assert.deepEqual(c.offers,[]);assert.ok(!c.purchase);await readFile(new URL(`../public${c.image}`,import.meta.url));}
});
test('seeding preserves existing listings, avoids duplicates, and respects subsequent deletions',()=>{
 const existing={id:'real-1',title:'Existing car'};const edited={...createDemoCars()[0],price:123};
 const data=new Map([['abc_cars_shared_v2',JSON.stringify([existing,edited])]]);
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 seedDemoCatalog(storage);let cars=JSON.parse(data.get('abc_cars_shared_v2'));assert.equal(cars.length,51);assert.deepEqual(cars[0],existing);assert.equal(cars.find(c=>c.id===edited.id).price,123);
 cars=cars.filter(c=>c.id!=='demo-car-002');data.set('abc_cars_shared_v2',JSON.stringify(cars));seedDemoCatalog(storage);assert.equal(JSON.parse(data.get('abc_cars_shared_v2')).length,50);assert.equal(data.get(DEMO_SEED_KEY),'1');
});
test('invalid stored catalogue is preserved instead of overwritten',()=>{
 let raw='corrupted';const storage={getItem:()=>raw,setItem:(_k,v)=>{raw=v}};assert.throws(()=>seedDemoCatalog({...storage,getItem:k=>k===DEMO_SEED_KEY?null:raw}));assert.equal(raw,'corrupted');
});

test('reference photos upgrade legacy defaults without changing edits, custom photos, or deleted listings',()=>{
 const old={...createDemoCars()[0],image:'/images/demo-cars/mpv.svg',images:['/images/demo-cars/mpv.svg'],price:123,description:'My own notes'};
 const custom={...createDemoCars()[1],image:'/images/demo-cars/mpv.svg',images:['https://example.com/own.jpg']};
 const real={id:'real-1',image:'/images/demo-cars/mpv.svg',isDemo:false};
 const data=new Map([[DEMO_SEED_KEY,'1'],['abc_cars_shared_v2',JSON.stringify([old,custom,real])]]);
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 seedDemoCatalog(storage);const next=JSON.parse(data.get('abc_cars_shared_v2'));
 assert.equal(next.length,3);assert.match(next[0].image,/demo-car-001\.jpg$/);assert.deepEqual(next[0].images,[next[0].image]);assert.equal(next[0].price,123);assert.equal(next[0].description,'My own notes');assert.ok(next[0].photoCredit.author);assert.deepEqual(next[1],custom);assert.deepEqual(next[2],real);
 const before=data.get('abc_cars_shared_v2');upgradeDemoPhotos(storage);assert.equal(data.get('abc_cars_shared_v2'),before);
});

test('all 50 model photos have attribution and a matching source manifest',async()=>{
 const sources=JSON.parse(await readFile(new URL('../public/images/demo-cars/photo-sources.json',import.meta.url),'utf8'));
 assert.equal(sources.length,50);
 for(const c of createDemoCars()){
  const s=sources.find(s=>s.id===c.id);assert.equal(s.brand,c.brand);assert.equal(s.model,c.model);assert.ok(c.photoCredit.author);assert.equal(c.photoCredit.source,s.source);assert.match(c.photoCredit.source,/^https:\/\/commons.wikimedia.org\//);assert.match(c.photoCredit.licenseUrl,/^https:\/\/(creativecommons.org|commons.wikimedia.org)\//);
  const photo=await readFile(new URL(`../public${c.image}`,import.meta.url));assert.equal(photo[0],0xff);assert.equal(photo[1],0xd8);
 }
});

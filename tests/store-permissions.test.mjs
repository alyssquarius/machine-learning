// Execute the actual store methods with minimal hook scaffolding and in-memory
// localStorage. This verifies mutations, not React layout or real payments.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import swc from 'next/dist/build/swc/index.js';
const moduleURL = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const hooksURL = moduleURL(`export const createContext=()=>({Provider:'provider'});export const useRef=x=>({current:x});export const useState=x=>[typeof x==='function'?x():x,()=>{}];export const useMemo=f=>f();export const useCallback=f=>f;export const useEffect=()=>{};export const createElement=(_tag,props)=>props.value;`);
let source = await readFile(new URL('../components/store-provider.tsx', import.meta.url), 'utf8');
source = source.replace('"react"', JSON.stringify(hooksURL));
for (const name of ['cities', 'format', 'roles', 'car-photos']) {
  let contents = stripTypeScriptTypes(await readFile(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8'));
  if(name === 'car-photos') contents = contents.replace("'./format'", JSON.stringify(moduleURL(stripTypeScriptTypes(await readFile(new URL('../lib/format.ts',import.meta.url),'utf8')))));
  source = source.replace(`"@/lib/${name}"`, JSON.stringify(moduleURL(contents)));
}
await swc.loadBindings();
const transformed = await swc.transform(source, { filename:'store-provider.tsx', jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'classic'}},target:'es2022'}, module:{type:'es6'} });
const { StoreProvider } = await import(moduleURL(transformed.code));
function store() {
  const data = new Map();
  globalThis.localStorage = { getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i]??null,get length(){return data.size} };
  globalThis.window = Object.assign(new EventTarget(), { localStorage:globalThis.localStorage });
  return StoreProvider({children:null});
}
const listing = { title:'Test vehicle', price:150000000, year:2023, status:'running', category:'SUV' };
test('guest and buyer cannot create a listing through the store API',()=>{
  const s=store();assert.equal(s.add(listing),null);s.setOwner('buyer','buyer');assert.equal(s.add(listing),null);
});
test('dealer ownership is enforced on actual edit, delete, status and duplicate methods',()=>{
  const s=store();s.setOwner('dealer-a','dealer');const a=s.add({...listing,sellerId:'forged-owner'});assert.equal(a.sellerId,'dealer-a');
  s.setOwner('dealer-b','dealer');const b=s.add({...listing,title:'Other vehicle'});assert.equal(s.inventory().length,1);assert.equal(s.inventory()[0].id,b.id);
  assert.equal(s.edit(a.id,listing),null);assert.equal(s.update(a.id,{price:1}),null);assert.equal(s.remove(a.id),false);assert.equal(s.setStatus(a.id,'done'),null);assert.equal(s.duplicate(a.id),null);
  s.setOwner('admin','admin');assert.equal(s.inventory().length,2);assert.ok(s.edit(a.id,listing));
});
test('offers made by a buyer reach the listing owner; another dealer cannot decide them',()=>{
  const s=store();s.setOwner('dealer-a','dealer');const a=s.add(listing);s.setOwner('buyer','buyer');const offer=s.makeOffer(a.id,140000000,'Test offer');assert.ok(offer);
  s.setOwner('dealer-b','dealer');assert.equal(s.decideOffer(a.id,offer.id,true),null);
  s.setOwner('dealer-a','dealer');assert.equal(s.offersFor(a.id).length,1);assert.equal(s.decideOffer(a.id,offer.id,true).status,'accepted');assert.equal(s.get(a.id).status,'done');
  assert.equal(s.setStatus(a.id,'running'),null,'a completed purchase cannot be reopened as an unsold listing');
});
test('guest purchase and offers are denied, while a signed-in buyer can complete a simulation',()=>{
  const s=store();s.setOwner('dealer','dealer');const a=s.add(listing);s.setOwner('','guest');assert.equal(s.buy(a.id),null);assert.equal(s.makeOffer(a.id,140000000),null);s.setOwner('buyer','buyer');assert.ok(s.buy(a.id,{name:'Test buyer',phone:'0800000000'}));assert.equal(s.buy(a.id),null);
});
test('buyer favourites retain their count and unrelated accounts do not inherit sale notifications',()=>{
  const s=store();s.setOwner('dealer','dealer');const a=s.add(listing);s.setOwner('buyer','buyer');s.toggleFav(a.id);assert.equal(s.stats().favCount,1);assert.ok(s.buy(a.id,{name:'Test buyer',phone:'0800000000'}));s.setOwner('unrelated','buyer');assert.equal(s.history().filter(h=>h.type==='beli').length,0);
});
test.after(()=>{delete globalThis.localStorage;delete globalThis.window;});

test('listing galleries preserve cover, cap at ten and survive edits and duplication',()=>{
 const s=store();s.setOwner('dealer','dealer');
 const images=Array.from({length:12},(_,i)=>`https://example.com/car-${i}.jpg`);
 const c=s.add({...listing,images});assert.equal(c.images.length,10);assert.equal(c.image,images[0]);
 const edited=s.edit(c.id,{...listing,images:[images[3],images[2]]});assert.deepEqual(edited.images,[images[3],images[2]]);assert.equal(edited.image,images[3]);
 const copy=s.duplicate(c.id);assert.deepEqual(copy.images,edited.images);
 const changed=s.update(c.id,{images:['javascript:alert(1)',images[2],images[2],images[1]]});assert.deepEqual(changed.images,[images[2],images[1]]);assert.equal(changed.image,images[2]);
});

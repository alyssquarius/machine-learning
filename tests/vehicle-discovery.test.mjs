import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
const source = stripTypeScriptTypes(
  await readFile(new URL("../lib/vehicle-discovery.ts", import.meta.url), "utf8"),
);
const { vehicleBrand, vehicleModel, matchesDiscovery } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const avanza = { title: "Toyota Avanza 1.5 G", category: "MPV", price: 180000000, km: 20000 };
const city = { title: "Honda City RS", category: "Sedan", price: 250000000, km: 40000 };
const ev = { title: "BYD Dolphin", category: "Listrik", price: 300000000, km: 15000 };
test("legacy listings infer brand/model without matching partial brand names", () => {
  assert.equal(vehicleBrand(avanza), "Toyota");
  assert.equal(vehicleModel(avanza), "Avanza");
  assert.equal(vehicleBrand({ ...avanza, title: "toyotaku Avanza" }), "Lainnya");
  assert.equal(vehicleBrand({ ...avanza, title: "All New Honda BR-V" }), "Honda");
  assert.equal(vehicleModel({ ...avanza, title: "Mercedes Benz C200" }), "C200");
  assert.equal(
    vehicleModel({ ...avanza, title: "Mercedes Benz C200", brand: "Mercedes-Benz", model: "C200" }),
    "C200",
  );
});
test("explicit brand and model take precedence; unknown model is not invented", () => {
  assert.equal(vehicleBrand({ ...avanza, brand: "honda" }), "Honda");
  assert.equal(vehicleModel({ ...avanza, model: "Grand Avanza" }), "Grand Avanza");
  assert.equal(vehicleModel({ ...avanza, title: "Mobil keluarga", brand: "Toyota" }), "");
  assert.equal(vehicleBrand({ ...avanza, brand: "Brand Lokal" }), "Brand Lokal");
});
test("group criteria reflect actual category, inclusive budget and recorded kilometre bounds", () => {
  assert.equal(matchesDiscovery(avanza, { group: "family" }), true);
  assert.equal(matchesDiscovery(city, { group: "family" }), false);
  assert.equal(matchesDiscovery({ ...avanza, price: 200000000 }, { group: "budget" }), true);
  assert.equal(matchesDiscovery({ ...avanza, price: 200000001 }, { group: "budget" }), false);
  assert.equal(matchesDiscovery({ ...avanza, km: 0 }, { group: "low-km" }), false);
  assert.equal(matchesDiscovery({ ...avanza, km: 30000 }, { group: "low-km" }), true);
  assert.equal(matchesDiscovery(city, { group: "low-km" }), false);
  assert.equal(matchesDiscovery(ev, { group: "electric" }), true);
  assert.equal(matchesDiscovery(avanza, { group: "electric" }), false);
});
test("brand, model and group intersect without modifying source inventory", () => {
  const cars = [avanza, city, ev];
  assert.deepEqual(
    cars.filter((c) => matchesDiscovery(c, { brand: "Toyota", model: "Avanza", group: "family" })),
    [avanza],
  );
  assert.equal(
    cars.filter((c) => matchesDiscovery(c, { brand: "Honda", group: "budget" })).length,
    0,
  );
  assert.equal(cars.length, 3);
  assert.equal(matchesDiscovery(avanza, { brand: "all", model: "all", group: "all" }), true);
});

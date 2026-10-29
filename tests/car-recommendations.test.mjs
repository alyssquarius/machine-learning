import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
const source = stripTypeScriptTypes(
  await readFile(new URL("../lib/car-recommendations.ts", import.meta.url), "utf8"),
);
const { readCarViews, incrementCarView, recommendCars } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const cars = [
  { id: "a", category: "MPV" },
  { id: "b", category: "MPV" },
  { id: "c", category: "SUV" },
  { id: "d", category: "Sedan" },
];
test("empty activity provides varied suggestions without asserting popularity", () => {
  const result = recommendCars(cars, {}, []);
  assert.equal(result.hasActivity, false);
  assert.deepEqual(
    result.cars.map((c) => c.id),
    ["a", "c", "d"],
  );
});
test("actual favourites precede recorded views and unobserved cars are not labelled as interests", () => {
  const result = recommendCars(cars, { a: 4, c: 2 }, ["d"]);
  assert.equal(result.hasActivity, true);
  assert.deepEqual(
    result.cars.map((c) => c.id),
    ["d", "a", "c"],
  );
  assert.deepEqual(
    recommendCars(cars, { a: 1 }, []).cars.map((c) => c.id),
    ["a"],
  );
  assert.deepEqual(
    cars.map((c) => c.id),
    ["a", "b", "c", "d"],
  );
});
test("invalid counts are discarded and stale cars cannot create popularity signals", () => {
  assert.deepEqual(readCarViews('{"a":-4,"b":"8","c":3}'), { c: 3 });
  assert.deepEqual(readCarViews("invalid"), {});
  assert.equal(recommendCars(cars, { missing: 999 }, ["missing"]).hasActivity, false);
});
test("recording a view increments once per call and bounds stored history", () => {
  const views = incrementCarView({ a: 2 }, "a");
  assert.equal(views.a, 3);
  assert.equal(
    Object.keys(
      incrementCarView(
        Object.fromEntries(Array.from({ length: 200 }, (_, i) => [String(i), 1])),
        "new",
      ),
    ).length,
    200,
  );
  assert.equal(incrementCarView({ a: 10000 }, "a").a, 10000);
});

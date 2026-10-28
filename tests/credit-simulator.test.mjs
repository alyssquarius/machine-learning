import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";

const source = stripTypeScriptTypes(
  await readFile(new URL("../lib/market.ts", import.meta.url), "utf8"),
);
const { checkoutCalc } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("credit estimate includes down payment, flat annual interest and monthly rounding", () => {
  assert.deepEqual(checkoutCalc(200000000, 30, 60, 8), {
    dp: 60000000,
    principal: 140000000,
    total: 196000000,
    installment: 3266667,
  });
});
test("zero interest and a fully paid principal do not add financing costs", () => {
  assert.deepEqual(checkoutCalc(120000000, 10, 12, 0), {
    dp: 12000000,
    principal: 108000000,
    total: 108000000,
    installment: 9000000,
  });
  assert.equal(checkoutCalc(120000000, 100, 12, 8).installment, 0);
});

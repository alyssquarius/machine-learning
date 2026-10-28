import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
const source = stripTypeScriptTypes(
  await readFile(new URL("../lib/roles.ts", import.meta.url), "utf8"),
);
const { getPermissions, canPerformAction } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

for (const role of ["admin", "buyer", "guest"]) {
  test(`${role}: create listing, dashboard, buy and offer permissions match the role`, () => {
    const p = getPermissions(role);
    const seller = role === "admin";
    assert.equal(p.canCreateListing, seller);
    assert.equal(p.canAccessDashboard, seller);
    assert.equal(p.canBuyCar, role !== "guest");
    assert.equal(p.canMakeOffer, role !== "guest");
  });
}
test("dealer cannot edit, delete, accept or reject offers on another seller listing", () => {
  for (const action of [
    "canEditOwnListing",
    "canDeleteOwnListing",
    "canAcceptOffer",
    "canRejectOffer",
  ]) {
    assert.equal(canPerformAction("dealer", action, { isOwner: false }), false);
    assert.equal(canPerformAction("dealer", action), false);
    assert.equal(canPerformAction("dealer", action, { isOwner: true }), false);
  }
});
test("admin can manage listings and offers across owners", () => {
  for (const action of [
    "canEditOwnListing",
    "canDeleteOwnListing",
    "canAcceptOffer",
    "canRejectOffer",
  ]) {
    assert.equal(canPerformAction("admin", action, { isOwner: false }), true);
  }
});
test("buyers and guests cannot gain seller privileges through ownership alone", () => {
  for (const role of ["buyer", "guest"]) {
    for (const action of [
      "canEditOwnListing",
      "canDeleteOwnListing",
      "canAcceptOffer",
      "canRejectOffer",
    ]) {
      assert.equal(canPerformAction(role, action, { isOwner: true }), false);
    }
  }
});
test("unknown roles default to guest and cannot manage users", () => {
  assert.equal(getPermissions("unexpected").canCreateListing, false);
  assert.equal(canPerformAction("dealer", "canEditUsers", { targetRole: "buyer" }), false);
  assert.equal(canPerformAction("admin", "canEditUsers", { targetRole: "admin" }), false);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import swc from "next/dist/build/swc/index.js";

const url = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const hooks = url(`
let slots=[],index=0;
export const reset=()=>{slots=[];index=0};
export const render=fn=>{index=0;return fn()};
export const createContext=()=>({Provider:'provider'});
export const useState=initial=>{const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=value]};
export const useRef=initial=>{const i=index++;return slots[i]??(slots[i]={current:initial})};
export const useCallback=fn=>fn;
export const createElement=(type,props,...children)=>({type,props:{...props,children}});
`);
const toastModule = url(
  "export const messages=[];export const useToast=()=>({toast:message=>messages.push(message)});",
);
let source = await readFile(new URL("../components/confirm-action.tsx", import.meta.url), "utf8");
source = source
  .replace('"react"', JSON.stringify(hooks))
  .replace('"./dialog"', JSON.stringify(url("export const Dialog='dialog';")))
  .replace('"./toast"', JSON.stringify(toastModule));
await swc.loadBindings();
const compiled = await swc.transform(source, {
  filename: "confirm-action.tsx",
  jsc: {
    parser: { syntax: "typescript", tsx: true },
    transform: { react: { runtime: "classic" } },
    target: "es2022",
  },
  module: { type: "es6" },
});
const { ConfirmActionProvider } = await import(url(compiled.code));
const { render, reset } = await import(hooks);
const { messages } = await import(toastModule);
const view = () => render(() => ConfirmActionProvider({ children: null }));
const nodes = (tree) =>
  !tree || typeof tree !== "object"
    ? []
    : [tree, ...(tree.props?.children || []).flat(Infinity).flatMap(nodes)];
const button = (tree, label) =>
  nodes(tree).find((node) => node.type === "button" && node.props.children.includes(label));
function open(action) {
  reset();
  messages.length = 0;
  view().props.value({
    title: "Hapus listing?",
    description: "Listing akan dihapus.",
    confirmLabel: "Hapus listing",
    success: "Listing dihapus.",
    action,
  });
  return view();
}

test("opening and cancelling a delete never executes the action", () => {
  let calls = 0;
  const tree = open(() => {
    calls++;
  });
  assert.equal(calls, 0);
  assert.ok(nodes(tree).some((n) => n.type === "dialog"));
  button(tree, "Batal").props.onClick();
  assert.equal(calls, 0);
  assert.equal(
    nodes(view()).some((n) => n.type === "dialog"),
    false,
  );
  assert.deepEqual(messages, []);
});
test("confirmed deletion runs once, blocks repeated clicks and reports success after completion", async () => {
  let calls = 0,
    resolve;
  const tree = open(() => {
    calls++;
    return new Promise((done) => {
      resolve = done;
    });
  });
  const execute = button(tree, "Hapus listing").props.onClick;
  const pending = execute();
  await execute();
  assert.equal(calls, 1);
  assert.equal(button(view(), "Batal").props.disabled, true);
  assert.deepEqual(messages, []);
  resolve();
  await pending;
  assert.deepEqual(messages, ["Listing dihapus."]);
  assert.equal(
    nodes(view()).some((n) => n.type === "dialog"),
    false,
  );
});
test("failed deletion stays open with a visible error and no success message", async () => {
  const tree = open(() => {
    throw new Error("Penyimpanan penuh");
  });
  await button(tree, "Hapus listing").props.onClick();
  const next = view();
  assert.ok(
    nodes(next).some(
      (n) => n.props.role === "alert" && n.props.children.includes("Penyimpanan penuh"),
    ),
  );
  assert.equal(button(next, "Hapus listing").props.disabled, false);
  assert.deepEqual(messages, []);
});

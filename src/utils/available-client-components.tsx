// A map of supported design system components.
// These are compiled React Client Components esported as named export
// eg export const Counter = () => {...}
export const clientComponents = {
  Counter: createTestClientComponent("__client.Counter"),
};
function createTestClientComponent(id: string) {
  function Component() {}
  Component.$$typeof = Symbol.for("react.client.reference");
  Component.$$id = id;
  Component.$$path = "/g/test.js";
  return Component;
}

var x = Object.defineProperty;
var h = (t, e, r) => e in t ? x(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var o = (t, e, r) => h(t, typeof e != "symbol" ? e + "" : e, r);
import { r as u, b as m } from "./vendor-shared-Czuro2GD.js";
function p(t) {
  return {
    id: t,
    T: void 0,
    toString() {
      return `ApiRef(${t})`;
    }
  };
}
const f = u.createContext(void 0);
class I {
  constructor() {
    o(this, "registry", /* @__PURE__ */ new Map());
  }
  register(e, r) {
    return this.registry.set(e.id, r), this;
  }
  registerFactory(e, r) {
    const s = r(this.registry);
    return this.registry.set(e.id, s), this;
  }
  build() {
    return this.registry;
  }
}
const O = ({
  registry: t,
  children: e
}) => m.createElement(
  f.Provider,
  { value: t },
  e
);
function b(t) {
  const e = u.useContext(f);
  if (!e)
    throw new Error("useApi must be used within an ApiProvider");
  const r = e.get(t.id);
  if (!r)
    throw new Error(`No implementation found for API '${t.id}'`);
  return r;
}
const F = p("core.logger"), N = p("core.fetch"), $ = p("core.permission"), k = p("core.rpc");
function C(t) {
  return t;
}
class y {
  constructor() {
    o(this, "plugins", []);
    o(this, "extensions", /* @__PURE__ */ new Map());
  }
  register(e) {
    if (console.log(`🔌 Registering frontend plugin: ${e.name}`), this.plugins.push(e), e.extensions)
      for (const r of e.extensions)
        this.extensions.has(r.slotId) || this.extensions.set(r.slotId, []), this.extensions.get(r.slotId).push(r);
  }
  getPlugins() {
    return this.plugins;
  }
  getExtensions(e) {
    return this.extensions.get(e) || [];
  }
  getAllRoutes() {
    return this.plugins.flatMap((e) => e.routes || []);
  }
  reset() {
    this.plugins = [], this.extensions.clear();
  }
}
const R = new y();
var g = { exports: {} }, c = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var _ = u, v = Symbol.for("react.element"), A = Symbol.for("react.fragment"), E = Object.prototype.hasOwnProperty, w = _.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, j = { key: !0, ref: !0, __self: !0, __source: !0 };
function d(t, e, r) {
  var s, i = {}, l = null, a = null;
  r !== void 0 && (l = "" + r), e.key !== void 0 && (l = "" + e.key), e.ref !== void 0 && (a = e.ref);
  for (s in e) E.call(e, s) && !j.hasOwnProperty(s) && (i[s] = e[s]);
  if (t && t.defaultProps) for (s in e = t.defaultProps, e) i[s] === void 0 && (i[s] = e[s]);
  return { $$typeof: v, type: t, key: l, ref: a, props: i, _owner: w.current };
}
c.Fragment = A;
c.jsx = d;
c.jsxs = d;
g.exports = c;
var n = g.exports;
const L = ({
  id: t,
  context: e
}) => {
  const r = R.getExtensions(t);
  return r.length === 0 ? /* @__PURE__ */ n.jsx(n.Fragment, {}) : /* @__PURE__ */ n.jsx(n.Fragment, { children: r.map((s) => /* @__PURE__ */ n.jsx(s.component, { ...e }, s.id)) });
};
function T(t, e = /* @__PURE__ */ n.jsx("div", { children: "Loading..." })) {
  const r = (s) => /* @__PURE__ */ n.jsx(u.Suspense, { fallback: e, children: /* @__PURE__ */ n.jsx(t, { ...s }) });
  return r.displayName = `Suspense(${t.displayName || t.name || "Component"})`, r;
}
export {
  O as ApiProvider,
  I as ApiRegistryBuilder,
  L as ExtensionSlot,
  p as createApiRef,
  C as createFrontendPlugin,
  N as fetchApiRef,
  F as loggerApiRef,
  $ as permissionApiRef,
  R as pluginRegistry,
  k as rpcApiRef,
  b as useApi,
  T as wrapInSuspense
};

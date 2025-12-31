import { r as R, R as Tn, g as Wr, c as An, a as Mn } from "./vendor-shared-Czuro2GD.js";
import { r as In } from "./vendor-shared-BUhb5ASH.js";
var Kr = { exports: {} }, lr = { exports: {} };
/**
 * @remix-run/router v1.23.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function te() {
  return te = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var n in r)
        Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
    }
    return e;
  }, te.apply(this, arguments);
}
var ue;
(function(e) {
  e.Pop = "POP", e.Push = "PUSH", e.Replace = "REPLACE";
})(ue || (ue = {}));
const Cr = "popstate";
function pr(e) {
  e === void 0 && (e = {});
  let {
    initialEntries: t = ["/"],
    initialIndex: r,
    v5Compat: n = !1
  } = e, o;
  o = t.map((f, S) => v(f, typeof f == "string" ? null : f.state, S === 0 ? "default" : void 0));
  let a = i(r ?? o.length - 1), l = ue.Pop, c = null;
  function i(f) {
    return Math.min(Math.max(f, 0), o.length - 1);
  }
  function g() {
    return o[a];
  }
  function v(f, S, P) {
    S === void 0 && (S = null);
    let C = Ze(o ? g().pathname : "/", f, S, P);
    return ke(C.pathname.charAt(0) === "/", "relative pathnames are not supported in memory history: " + JSON.stringify(f)), C;
  }
  function h(f) {
    return typeof f == "string" ? f : Be(f);
  }
  return {
    get index() {
      return a;
    },
    get action() {
      return l;
    },
    get location() {
      return g();
    },
    createHref: h,
    createURL(f) {
      return new URL(h(f), "http://localhost");
    },
    encodeLocation(f) {
      let S = typeof f == "string" ? Oe(f) : f;
      return {
        pathname: S.pathname || "",
        search: S.search || "",
        hash: S.hash || ""
      };
    },
    push(f, S) {
      l = ue.Push;
      let P = v(f, S);
      a += 1, o.splice(a, o.length, P), n && c && c({
        action: l,
        location: P,
        delta: 1
      });
    },
    replace(f, S) {
      l = ue.Replace;
      let P = v(f, S);
      o[a] = P, n && c && c({
        action: l,
        location: P,
        delta: 0
      });
    },
    go(f) {
      l = ue.Pop;
      let S = i(a + f), P = o[S];
      a = S, c && c({
        action: l,
        location: P,
        delta: f
      });
    },
    listen(f) {
      return c = f, () => {
        c = null;
      };
    }
  };
}
function kn(e) {
  e === void 0 && (e = {});
  function t(n, o) {
    let {
      pathname: a,
      search: l,
      hash: c
    } = n.location;
    return Ze(
      "",
      {
        pathname: a,
        search: l,
        hash: c
      },
      // state defaults to `null` because `window.history.state` does
      o.state && o.state.usr || null,
      o.state && o.state.key || "default"
    );
  }
  function r(n, o) {
    return typeof o == "string" ? o : Be(o);
  }
  return Vr(t, r, null, e);
}
function Bn(e) {
  e === void 0 && (e = {});
  function t(o, a) {
    let {
      pathname: l = "/",
      search: c = "",
      hash: i = ""
    } = Oe(o.location.hash.substr(1));
    return !l.startsWith("/") && !l.startsWith(".") && (l = "/" + l), Ze(
      "",
      {
        pathname: l,
        search: c,
        hash: i
      },
      // state defaults to `null` because `window.history.state` does
      a.state && a.state.usr || null,
      a.state && a.state.key || "default"
    );
  }
  function r(o, a) {
    let l = o.document.querySelector("base"), c = "";
    if (l && l.getAttribute("href")) {
      let i = o.location.href, g = i.indexOf("#");
      c = g === -1 ? i : i.slice(0, g);
    }
    return c + "#" + (typeof a == "string" ? a : Be(a));
  }
  function n(o, a) {
    ke(o.pathname.charAt(0) === "/", "relative pathnames are not supported in hash history.push(" + JSON.stringify(a) + ")");
  }
  return Vr(t, r, n, e);
}
function W(e, t) {
  if (e === !1 || e === null || typeof e > "u")
    throw new Error(t);
}
function ke(e, t) {
  if (!e) {
    typeof console < "u" && console.warn(t);
    try {
      throw new Error(t);
    } catch {
    }
  }
}
function Hn() {
  return Math.random().toString(36).substr(2, 8);
}
function Lr(e, t) {
  return {
    usr: e.state,
    key: e.key,
    idx: t
  };
}
function Ze(e, t, r, n) {
  return r === void 0 && (r = null), te({
    pathname: typeof e == "string" ? e : e.pathname,
    search: "",
    hash: ""
  }, typeof t == "string" ? Oe(t) : t, {
    state: r,
    // TODO: This could be cleaned up.  push/replace should probably just take
    // full Locations now and avoid the need to run through this flow at all
    // But that's a pretty big refactor to the current test suite so going to
    // keep as is for the time being and just let any incoming keys take precedence
    key: t && t.key || n || Hn()
  });
}
function Be(e) {
  let {
    pathname: t = "/",
    search: r = "",
    hash: n = ""
  } = e;
  return r && r !== "?" && (t += r.charAt(0) === "?" ? r : "?" + r), n && n !== "#" && (t += n.charAt(0) === "#" ? n : "#" + n), t;
}
function Oe(e) {
  let t = {};
  if (e) {
    let r = e.indexOf("#");
    r >= 0 && (t.hash = e.substr(r), e = e.substr(0, r));
    let n = e.indexOf("?");
    n >= 0 && (t.search = e.substr(n), e = e.substr(0, n)), e && (t.pathname = e);
  }
  return t;
}
function Vr(e, t, r, n) {
  n === void 0 && (n = {});
  let {
    window: o = document.defaultView,
    v5Compat: a = !1
  } = n, l = o.history, c = ue.Pop, i = null, g = v();
  g == null && (g = 0, l.replaceState(te({}, l.state, {
    idx: g
  }), ""));
  function v() {
    return (l.state || {
      idx: null
    }).idx;
  }
  function h() {
    c = ue.Pop;
    let C = v(), V = C == null ? null : C - g;
    g = C, i && i({
      action: c,
      location: P.location,
      delta: V
    });
  }
  function x(C, V) {
    c = ue.Push;
    let N = Ze(P.location, C, V);
    r && r(N, C), g = v() + 1;
    let z = Lr(N, g), O = P.createHref(N);
    try {
      l.pushState(z, "", O);
    } catch (re) {
      if (re instanceof DOMException && re.name === "DataCloneError")
        throw re;
      o.location.assign(O);
    }
    a && i && i({
      action: c,
      location: P.location,
      delta: 1
    });
  }
  function f(C, V) {
    c = ue.Replace;
    let N = Ze(P.location, C, V);
    r && r(N, C), g = v();
    let z = Lr(N, g), O = P.createHref(N);
    l.replaceState(z, "", O), a && i && i({
      action: c,
      location: P.location,
      delta: 0
    });
  }
  function S(C) {
    let V = o.location.origin !== "null" ? o.location.origin : o.location.href, N = typeof C == "string" ? C : Be(C);
    return N = N.replace(/ $/, "%20"), W(V, "No window.location.(origin|href) available to create URL for href: " + N), new URL(N, V);
  }
  let P = {
    get action() {
      return c;
    },
    get location() {
      return e(o, l);
    },
    listen(C) {
      if (i)
        throw new Error("A history only accepts one active listener");
      return o.addEventListener(Cr, h), i = C, () => {
        o.removeEventListener(Cr, h), i = null;
      };
    },
    createHref(C) {
      return t(o, C);
    },
    createURL: S,
    encodeLocation(C) {
      let V = S(C);
      return {
        pathname: V.pathname,
        search: V.search,
        hash: V.hash
      };
    },
    push: x,
    replace: f,
    go(C) {
      return l.go(C);
    }
  };
  return P;
}
var ee;
(function(e) {
  e.data = "data", e.deferred = "deferred", e.redirect = "redirect", e.error = "error";
})(ee || (ee = {}));
const zn = /* @__PURE__ */ new Set(["lazy", "caseSensitive", "path", "id", "index", "children"]);
function Wn(e) {
  return e.index === !0;
}
function Dt(e, t, r, n) {
  return r === void 0 && (r = []), n === void 0 && (n = {}), e.map((o, a) => {
    let l = [...r, String(a)], c = typeof o.id == "string" ? o.id : l.join("-");
    if (W(o.index !== !0 || !o.children, "Cannot specify children on an index route"), W(!n[c], 'Found a route id collision on id "' + c + `".  Route id's must be globally unique within Data Router usages`), Wn(o)) {
      let i = te({}, o, t(o), {
        id: c
      });
      return n[c] = i, i;
    } else {
      let i = te({}, o, t(o), {
        id: c,
        children: void 0
      });
      return n[c] = i, o.children && (i.children = Dt(o.children, t, l, n)), i;
    }
  });
}
function Ie(e, t, r) {
  return r === void 0 && (r = "/"), Xt(e, t, r, !1);
}
function Xt(e, t, r, n) {
  let o = typeof t == "string" ? Oe(t) : t, a = ut(o.pathname || "/", r);
  if (a == null)
    return null;
  let l = $r(e);
  Kn(l);
  let c = null;
  for (let i = 0; c == null && i < l.length; ++i) {
    let g = vr(a);
    c = qn(l[i], g, n);
  }
  return c;
}
function mr(e, t) {
  let {
    route: r,
    pathname: n,
    params: o
  } = e;
  return {
    id: r.id,
    pathname: n,
    params: o,
    data: t[r.id],
    handle: r.handle
  };
}
function $r(e, t, r, n) {
  t === void 0 && (t = []), r === void 0 && (r = []), n === void 0 && (n = "");
  let o = (a, l, c) => {
    let i = {
      relativePath: c === void 0 ? a.path || "" : c,
      caseSensitive: a.caseSensitive === !0,
      childrenIndex: l,
      route: a
    };
    i.relativePath.startsWith("/") && (W(i.relativePath.startsWith(n), 'Absolute route path "' + i.relativePath + '" nested under path ' + ('"' + n + '" is not valid. An absolute child route path ') + "must start with the combined path of all its parent routes."), i.relativePath = i.relativePath.slice(n.length));
    let g = Je([n, i.relativePath]), v = r.concat(i);
    a.children && a.children.length > 0 && (W(
      // Our types know better, but runtime JS may not!
      // @ts-expect-error
      a.index !== !0,
      "Index routes must not have child routes. Please remove " + ('all child routes from route path "' + g + '".')
    ), $r(a.children, t, v, g)), !(a.path == null && !a.index) && t.push({
      path: g,
      score: Qn(g, a.index),
      routesMeta: v
    });
  };
  return e.forEach((a, l) => {
    var c;
    if (a.path === "" || !((c = a.path) != null && c.includes("?")))
      o(a, l);
    else
      for (let i of Jr(a.path))
        o(a, l, i);
  }), t;
}
function Jr(e) {
  let t = e.split("/");
  if (t.length === 0) return [];
  let [r, ...n] = t, o = r.endsWith("?"), a = r.replace(/\?$/, "");
  if (n.length === 0)
    return o ? [a, ""] : [a];
  let l = Jr(n.join("/")), c = [];
  return c.push(...l.map((i) => i === "" ? a : [a, i].join("/"))), o && c.push(...l), c.map((i) => e.startsWith("/") && i === "" ? "/" : i);
}
function Kn(e) {
  e.sort((t, r) => t.score !== r.score ? r.score - t.score : Zn(t.routesMeta.map((n) => n.childrenIndex), r.routesMeta.map((n) => n.childrenIndex)));
}
const Vn = /^:[\w-]+$/, $n = 3, Jn = 2, Yn = 1, Gn = 10, Xn = -2, _r = (e) => e === "*";
function Qn(e, t) {
  let r = e.split("/"), n = r.length;
  return r.some(_r) && (n += Xn), t && (n += Jn), r.filter((o) => !_r(o)).reduce((o, a) => o + (Vn.test(a) ? $n : a === "" ? Yn : Gn), n);
}
function Zn(e, t) {
  return e.length === t.length && e.slice(0, -1).every((n, o) => n === t[o]) ? (
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    e[e.length - 1] - t[t.length - 1]
  ) : (
    // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0
  );
}
function qn(e, t, r) {
  r === void 0 && (r = !1);
  let {
    routesMeta: n
  } = e, o = {}, a = "/", l = [];
  for (let c = 0; c < n.length; ++c) {
    let i = n[c], g = c === n.length - 1, v = a === "/" ? t : t.slice(a.length) || "/", h = Tt({
      path: i.relativePath,
      caseSensitive: i.caseSensitive,
      end: g
    }, v), x = i.route;
    if (!h && g && r && !n[n.length - 1].route.index && (h = Tt({
      path: i.relativePath,
      caseSensitive: i.caseSensitive,
      end: !1
    }, v)), !h)
      return null;
    Object.assign(o, h.params), l.push({
      // TODO: Can this as be avoided?
      params: o,
      pathname: Je([a, h.pathname]),
      pathnameBase: Xr(Je([a, h.pathnameBase])),
      route: x
    }), h.pathnameBase !== "/" && (a = Je([a, h.pathnameBase]));
  }
  return l;
}
function Yr(e, t) {
  t === void 0 && (t = {});
  let r = e;
  r.endsWith("*") && r !== "*" && !r.endsWith("/*") && (ke(!1, 'Route path "' + r + '" will be treated as if it were ' + ('"' + r.replace(/\*$/, "/*") + '" because the `*` character must ') + "always follow a `/` in the pattern. To get rid of this warning, " + ('please change the route path to "' + r.replace(/\*$/, "/*") + '".')), r = r.replace(/\*$/, "/*"));
  const n = r.startsWith("/") ? "/" : "", o = (l) => l == null ? "" : typeof l == "string" ? l : String(l), a = r.split(/\/+/).map((l, c, i) => {
    if (c === i.length - 1 && l === "*")
      return o(t["*"]);
    const v = l.match(/^:([\w-]+)(\??)$/);
    if (v) {
      const [, h, x] = v;
      let f = t[h];
      return W(x === "?" || f != null, 'Missing ":' + h + '" param'), o(f);
    }
    return l.replace(/\?$/g, "");
  }).filter((l) => !!l);
  return n + a.join("/");
}
function Tt(e, t) {
  typeof e == "string" && (e = {
    path: e,
    caseSensitive: !1,
    end: !0
  });
  let [r, n] = ea(e.path, e.caseSensitive, e.end), o = t.match(r);
  if (!o) return null;
  let a = o[0], l = a.replace(/(.)\/+$/, "$1"), c = o.slice(1);
  return {
    params: n.reduce((g, v, h) => {
      let {
        paramName: x,
        isOptional: f
      } = v;
      if (x === "*") {
        let P = c[h] || "";
        l = a.slice(0, a.length - P.length).replace(/(.)\/+$/, "$1");
      }
      const S = c[h];
      return f && !S ? g[x] = void 0 : g[x] = (S || "").replace(/%2F/g, "/"), g;
    }, {}),
    pathname: a,
    pathnameBase: l,
    pattern: e
  };
}
function ea(e, t, r) {
  t === void 0 && (t = !1), r === void 0 && (r = !0), ke(e === "*" || !e.endsWith("*") || e.endsWith("/*"), 'Route path "' + e + '" will be treated as if it were ' + ('"' + e.replace(/\*$/, "/*") + '" because the `*` character must ') + "always follow a `/` in the pattern. To get rid of this warning, " + ('please change the route path to "' + e.replace(/\*$/, "/*") + '".'));
  let n = [], o = "^" + e.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (l, c, i) => (n.push({
    paramName: c,
    isOptional: i != null
  }), i ? "/?([^\\/]+)?" : "/([^\\/]+)"));
  return e.endsWith("*") ? (n.push({
    paramName: "*"
  }), o += e === "*" || e === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : r ? o += "\\/*$" : e !== "" && e !== "/" && (o += "(?:(?=\\/|$))"), [new RegExp(o, t ? void 0 : "i"), n];
}
function vr(e) {
  try {
    return e.split("/").map((t) => decodeURIComponent(t).replace(/\//g, "%2F")).join("/");
  } catch (t) {
    return ke(!1, 'The URL path "' + e + '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' + ("encoding (" + t + ").")), e;
  }
}
function ut(e, t) {
  if (t === "/") return e;
  if (!e.toLowerCase().startsWith(t.toLowerCase()))
    return null;
  let r = t.endsWith("/") ? t.length - 1 : t.length, n = e.charAt(r);
  return n && n !== "/" ? null : e.slice(r) || "/";
}
const ta = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i, ra = (e) => ta.test(e);
function gr(e, t) {
  t === void 0 && (t = "/");
  let {
    pathname: r,
    search: n = "",
    hash: o = ""
  } = typeof e == "string" ? Oe(e) : e, a;
  if (r)
    if (ra(r))
      a = r;
    else {
      if (r.includes("//")) {
        let l = r;
        r = r.replace(/\/\/+/g, "/"), ke(!1, "Pathnames cannot have embedded double slashes - normalizing " + (l + " -> " + r));
      }
      r.startsWith("/") ? a = Or(r.substring(1), "/") : a = Or(r, t);
    }
  else
    a = t;
  return {
    pathname: a,
    search: aa(n),
    hash: oa(o)
  };
}
function Or(e, t) {
  let r = t.replace(/\/+$/, "").split("/");
  return e.split("/").forEach((o) => {
    o === ".." ? r.length > 1 && r.pop() : o !== "." && r.push(o);
  }), r.length > 1 ? r.join("/") : "/";
}
function or(e, t, r, n) {
  return "Cannot include a '" + e + "' character in a manually specified " + ("`to." + t + "` field [" + JSON.stringify(n) + "].  Please separate it out to the ") + ("`to." + r + "` field. Alternatively you may provide the full path as ") + 'a string in <Link to="..."> and the router will parse it for you.';
}
function Gr(e) {
  return e.filter((t, r) => r === 0 || t.route.path && t.route.path.length > 0);
}
function It(e, t) {
  let r = Gr(e);
  return t ? r.map((n, o) => o === r.length - 1 ? n.pathname : n.pathnameBase) : r.map((n) => n.pathnameBase);
}
function kt(e, t, r, n) {
  n === void 0 && (n = !1);
  let o;
  typeof e == "string" ? o = Oe(e) : (o = te({}, e), W(!o.pathname || !o.pathname.includes("?"), or("?", "pathname", "search", o)), W(!o.pathname || !o.pathname.includes("#"), or("#", "pathname", "hash", o)), W(!o.search || !o.search.includes("#"), or("#", "search", "hash", o)));
  let a = e === "" || o.pathname === "", l = a ? "/" : o.pathname, c;
  if (l == null)
    c = r;
  else {
    let h = t.length - 1;
    if (!n && l.startsWith("..")) {
      let x = l.split("/");
      for (; x[0] === ".."; )
        x.shift(), h -= 1;
      o.pathname = x.join("/");
    }
    c = h >= 0 ? t[h] : "/";
  }
  let i = gr(o, c), g = l && l !== "/" && l.endsWith("/"), v = (a || l === ".") && r.endsWith("/");
  return !i.pathname.endsWith("/") && (g || v) && (i.pathname += "/"), i;
}
function na(e) {
  return e === "" || e.pathname === "" ? "/" : typeof e == "string" ? Oe(e).pathname : e.pathname;
}
const Je = (e) => e.join("/").replace(/\/\/+/g, "/"), Xr = (e) => e.replace(/\/+$/, "").replace(/^\/*/, "/"), aa = (e) => !e || e === "?" ? "" : e.startsWith("?") ? e : "?" + e, oa = (e) => !e || e === "#" ? "" : e.startsWith("#") ? e : "#" + e, Qr = function(t, r) {
  r === void 0 && (r = {});
  let n = typeof r == "number" ? {
    status: r
  } : r, o = new Headers(n.headers);
  return o.has("Content-Type") || o.set("Content-Type", "application/json; charset=utf-8"), new Response(JSON.stringify(t), te({}, n, {
    headers: o
  }));
};
class ia {
  constructor(t, r) {
    this.type = "DataWithResponseInit", this.data = t, this.init = r || null;
  }
}
function la(e, t) {
  return new ia(e, typeof t == "number" ? {
    status: t
  } : t);
}
class At extends Error {
}
class Zr {
  constructor(t, r) {
    this.pendingKeysSet = /* @__PURE__ */ new Set(), this.subscribers = /* @__PURE__ */ new Set(), this.deferredKeys = [], W(t && typeof t == "object" && !Array.isArray(t), "defer() only accepts plain objects");
    let n;
    this.abortPromise = new Promise((a, l) => n = l), this.controller = new AbortController();
    let o = () => n(new At("Deferred data aborted"));
    this.unlistenAbortSignal = () => this.controller.signal.removeEventListener("abort", o), this.controller.signal.addEventListener("abort", o), this.data = Object.entries(t).reduce((a, l) => {
      let [c, i] = l;
      return Object.assign(a, {
        [c]: this.trackPromise(c, i)
      });
    }, {}), this.done && this.unlistenAbortSignal(), this.init = r;
  }
  trackPromise(t, r) {
    if (!(r instanceof Promise))
      return r;
    this.deferredKeys.push(t), this.pendingKeysSet.add(t);
    let n = Promise.race([r, this.abortPromise]).then((o) => this.onSettle(n, t, void 0, o), (o) => this.onSettle(n, t, o));
    return n.catch(() => {
    }), Object.defineProperty(n, "_tracked", {
      get: () => !0
    }), n;
  }
  onSettle(t, r, n, o) {
    if (this.controller.signal.aborted && n instanceof At)
      return this.unlistenAbortSignal(), Object.defineProperty(t, "_error", {
        get: () => n
      }), Promise.reject(n);
    if (this.pendingKeysSet.delete(r), this.done && this.unlistenAbortSignal(), n === void 0 && o === void 0) {
      let a = new Error('Deferred data for key "' + r + '" resolved/rejected with `undefined`, you must resolve/reject with a value or `null`.');
      return Object.defineProperty(t, "_error", {
        get: () => a
      }), this.emit(!1, r), Promise.reject(a);
    }
    return o === void 0 ? (Object.defineProperty(t, "_error", {
      get: () => n
    }), this.emit(!1, r), Promise.reject(n)) : (Object.defineProperty(t, "_data", {
      get: () => o
    }), this.emit(!1, r), o);
  }
  emit(t, r) {
    this.subscribers.forEach((n) => n(t, r));
  }
  subscribe(t) {
    return this.subscribers.add(t), () => this.subscribers.delete(t);
  }
  cancel() {
    this.controller.abort(), this.pendingKeysSet.forEach((t, r) => this.pendingKeysSet.delete(r)), this.emit(!0);
  }
  async resolveData(t) {
    let r = !1;
    if (!this.done) {
      let n = () => this.cancel();
      t.addEventListener("abort", n), r = await new Promise((o) => {
        this.subscribe((a) => {
          t.removeEventListener("abort", n), (a || this.done) && o(a);
        });
      });
    }
    return r;
  }
  get done() {
    return this.pendingKeysSet.size === 0;
  }
  get unwrappedData() {
    return W(this.data !== null && this.done, "Can only unwrap data on initialized and settled deferreds"), Object.entries(this.data).reduce((t, r) => {
      let [n, o] = r;
      return Object.assign(t, {
        [n]: ua(o)
      });
    }, {});
  }
  get pendingKeys() {
    return Array.from(this.pendingKeysSet);
  }
}
function sa(e) {
  return e instanceof Promise && e._tracked === !0;
}
function ua(e) {
  if (!sa(e))
    return e;
  if (e._error)
    throw e._error;
  return e._data;
}
const qr = function(t, r) {
  r === void 0 && (r = {});
  let n = typeof r == "number" ? {
    status: r
  } : r;
  return new Zr(t, n);
}, rr = function(t, r) {
  r === void 0 && (r = 302);
  let n = r;
  typeof n == "number" ? n = {
    status: n
  } : typeof n.status > "u" && (n.status = 302);
  let o = new Headers(n.headers);
  return o.set("Location", t), new Response(null, te({}, n, {
    headers: o
  }));
}, en = (e, t) => {
  let r = rr(e, t);
  return r.headers.set("X-Remix-Reload-Document", "true"), r;
}, tn = (e, t) => {
  let r = rr(e, t);
  return r.headers.set("X-Remix-Replace", "true"), r;
};
class Zt {
  constructor(t, r, n, o) {
    o === void 0 && (o = !1), this.status = t, this.statusText = r || "", this.internal = o, n instanceof Error ? (this.data = n.toString(), this.error = n) : this.data = n;
  }
}
function qe(e) {
  return e != null && typeof e.status == "number" && typeof e.statusText == "string" && typeof e.internal == "boolean" && "data" in e;
}
const rn = ["post", "put", "patch", "delete"], ca = new Set(rn), da = ["get", ...rn], fa = new Set(da), ha = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]), pa = /* @__PURE__ */ new Set([307, 308]), Qt = {
  state: "idle",
  location: void 0,
  formMethod: void 0,
  formAction: void 0,
  formEncType: void 0,
  formData: void 0,
  json: void 0,
  text: void 0
}, nn = {
  state: "idle",
  data: void 0,
  formMethod: void 0,
  formAction: void 0,
  formEncType: void 0,
  formData: void 0,
  json: void 0,
  text: void 0
}, mt = {
  state: "unblocked",
  proceed: void 0,
  reset: void 0,
  location: void 0
}, yr = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i, an = (e) => ({
  hasErrorBoundary: !!e.hasErrorBoundary
}), on = "remix-router-transitions";
function ln(e) {
  const t = e.window ? e.window : typeof window < "u" ? window : void 0, r = typeof t < "u" && typeof t.document < "u" && typeof t.document.createElement < "u", n = !r;
  W(e.routes.length > 0, "You must provide a non-empty routes array to createRouter");
  let o;
  if (e.mapRouteProperties)
    o = e.mapRouteProperties;
  else if (e.detectErrorBoundary) {
    let s = e.detectErrorBoundary;
    o = (u) => ({
      hasErrorBoundary: s(u)
    });
  } else
    o = an;
  let a = {}, l = Dt(e.routes, o, void 0, a), c, i = e.basename || "/", g = e.dataStrategy || dn, v = e.patchRoutesOnNavigation, h = te({
    v7_fetcherPersist: !1,
    v7_normalizeFormMethod: !1,
    v7_partialHydration: !1,
    v7_prependBasename: !1,
    v7_relativeSplatPath: !1,
    v7_skipActionErrorRevalidation: !1
  }, e.future), x = null, f = /* @__PURE__ */ new Set(), S = null, P = null, C = null, V = e.hydrationData != null, N = Ie(l, e.history.location, i), z = !1, O = null;
  if (N == null && !v) {
    let s = he(404, {
      pathname: e.history.location.pathname
    }), {
      matches: u,
      route: p
    } = qt(l);
    N = u, O = {
      [p.id]: s
    };
  }
  N && !e.hydrationData && Et(N, l, e.history.location.pathname).active && (N = null);
  let re;
  if (N)
    if (N.some((s) => s.route.lazy))
      re = !1;
    else if (!N.some((s) => s.route.loader))
      re = !0;
    else if (h.v7_partialHydration) {
      let s = e.hydrationData ? e.hydrationData.loaderData : null, u = e.hydrationData ? e.hydrationData.errors : null;
      if (u) {
        let p = N.findIndex((E) => u[E.route.id] !== void 0);
        re = N.slice(0, p + 1).every((E) => !cr(E.route, s, u));
      } else
        re = N.every((p) => !cr(p.route, s, u));
    } else
      re = e.hydrationData != null;
  else if (re = !1, N = [], h.v7_partialHydration) {
    let s = Et(null, l, e.history.location.pathname);
    s.active && s.matches && (z = !0, N = s.matches);
  }
  let le, d = {
    historyAction: e.history.action,
    location: e.history.location,
    matches: N,
    initialized: re,
    navigation: Qt,
    // Don't restore on initial updateState() if we were SSR'd
    restoreScrollPosition: e.hydrationData != null ? !1 : null,
    preventScrollReset: !1,
    revalidation: "idle",
    loaderData: e.hydrationData && e.hydrationData.loaderData || {},
    actionData: e.hydrationData && e.hydrationData.actionData || null,
    errors: e.hydrationData && e.hydrationData.errors || O,
    fetchers: /* @__PURE__ */ new Map(),
    blockers: /* @__PURE__ */ new Map()
  }, J = ue.Pop, ie = !1, Z, ne = !1, we = /* @__PURE__ */ new Map(), Le = null, Ue = !1, Ye = !1, gt = [], yt = /* @__PURE__ */ new Set(), ge = /* @__PURE__ */ new Map(), bt = 0, et = -1, tt = /* @__PURE__ */ new Map(), je = /* @__PURE__ */ new Set(), Ne = /* @__PURE__ */ new Map(), ze = /* @__PURE__ */ new Map(), Pe = /* @__PURE__ */ new Set(), Ae = /* @__PURE__ */ new Map(), We = /* @__PURE__ */ new Map(), wt;
  function zt() {
    if (x = e.history.listen((s) => {
      let {
        action: u,
        location: p,
        delta: E
      } = s;
      if (wt) {
        wt(), wt = void 0;
        return;
      }
      ke(We.size === 0 || E != null, "You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL.");
      let L = fe({
        currentLocation: d.location,
        nextLocation: p,
        historyAction: u
      });
      if (L && E != null) {
        let B = new Promise((K) => {
          wt = K;
        });
        e.history.go(E * -1), Ge(L, {
          state: "blocked",
          location: p,
          proceed() {
            Ge(L, {
              state: "proceeding",
              proceed: void 0,
              reset: void 0,
              location: p
            }), B.then(() => e.history.go(E));
          },
          reset() {
            let K = new Map(d.blockers);
            K.set(L, mt), be({
              blockers: K
            });
          }
        });
        return;
      }
      return m(u, p);
    }), r) {
      La(t, we);
      let s = () => _a(t, we);
      t.addEventListener("pagehide", s), Le = () => t.removeEventListener("pagehide", s);
    }
    return d.initialized || m(ue.Pop, d.location, {
      initialHydration: !0
    }), le;
  }
  function _t() {
    x && x(), Le && Le(), f.clear(), Z && Z.abort(), d.fetchers.forEach((s, u) => Ee(u)), d.blockers.forEach((s, u) => at(u));
  }
  function Wt(s) {
    return f.add(s), () => f.delete(s);
  }
  function be(s, u) {
    u === void 0 && (u = {}), d = te({}, d, s);
    let p = [], E = [];
    h.v7_fetcherPersist && d.fetchers.forEach((L, B) => {
      L.state === "idle" && (Pe.has(B) ? E.push(B) : p.push(B));
    }), Pe.forEach((L) => {
      !d.fetchers.has(L) && !ge.has(L) && E.push(L);
    }), [...f].forEach((L) => L(d, {
      deletedFetchers: E,
      viewTransitionOpts: u.viewTransitionOpts,
      flushSync: u.flushSync === !0
    })), h.v7_fetcherPersist ? (p.forEach((L) => d.fetchers.delete(L)), E.forEach((L) => Ee(L))) : E.forEach((L) => Pe.delete(L));
  }
  function Me(s, u, p) {
    var E, L;
    let {
      flushSync: B
    } = p === void 0 ? {} : p, K = d.actionData != null && d.navigation.formMethod != null && Te(d.navigation.formMethod) && d.navigation.state === "loading" && ((E = s.state) == null ? void 0 : E._isRedirect) !== !0, M;
    u.actionData ? Object.keys(u.actionData).length > 0 ? M = u.actionData : M = null : K ? M = d.actionData : M = null;
    let I = u.loaderData ? kr(d.loaderData, u.loaderData, u.matches || [], u.errors) : d.loaderData, T = d.blockers;
    T.size > 0 && (T = new Map(T), T.forEach((q, Re) => T.set(Re, mt)));
    let k = ie === !0 || d.navigation.formMethod != null && Te(d.navigation.formMethod) && ((L = s.state) == null ? void 0 : L._isRedirect) !== !0;
    c && (l = c, c = void 0), Ue || J === ue.Pop || (J === ue.Push ? e.history.push(s, s.state) : J === ue.Replace && e.history.replace(s, s.state));
    let X;
    if (J === ue.Pop) {
      let q = we.get(d.location.pathname);
      q && q.has(s.pathname) ? X = {
        currentLocation: d.location,
        nextLocation: s
      } : we.has(s.pathname) && (X = {
        currentLocation: s,
        nextLocation: d.location
      });
    } else if (ne) {
      let q = we.get(d.location.pathname);
      q ? q.add(s.pathname) : (q = /* @__PURE__ */ new Set([s.pathname]), we.set(d.location.pathname, q)), X = {
        currentLocation: d.location,
        nextLocation: s
      };
    }
    be(te({}, u, {
      actionData: M,
      loaderData: I,
      historyAction: J,
      location: s,
      initialized: !0,
      navigation: Qt,
      revalidation: "idle",
      restoreScrollPosition: Ve(s, u.matches || d.matches),
      preventScrollReset: k,
      blockers: T
    }), {
      viewTransitionOpts: X,
      flushSync: B === !0
    }), J = ue.Pop, ie = !1, ne = !1, Ue = !1, Ye = !1, gt = [];
  }
  async function Ot(s, u) {
    if (typeof s == "number") {
      e.history.go(s);
      return;
    }
    let p = sr(d.location, d.matches, i, h.v7_prependBasename, s, h.v7_relativeSplatPath, u == null ? void 0 : u.fromRouteId, u == null ? void 0 : u.relative), {
      path: E,
      submission: L,
      error: B
    } = jr(h.v7_normalizeFormMethod, !1, p, u), K = d.location, M = Ze(d.location, E, u && u.state);
    M = te({}, M, e.history.encodeLocation(M));
    let I = u && u.replace != null ? u.replace : void 0, T = ue.Push;
    I === !0 ? T = ue.Replace : I === !1 || L != null && Te(L.formMethod) && L.formAction === d.location.pathname + d.location.search && (T = ue.Replace);
    let k = u && "preventScrollReset" in u ? u.preventScrollReset === !0 : void 0, X = (u && u.flushSync) === !0, q = fe({
      currentLocation: K,
      nextLocation: M,
      historyAction: T
    });
    if (q) {
      Ge(q, {
        state: "blocked",
        location: M,
        proceed() {
          Ge(q, {
            state: "proceeding",
            proceed: void 0,
            reset: void 0,
            location: M
          }), Ot(s, u);
        },
        reset() {
          let Re = new Map(d.blockers);
          Re.set(q, mt), be({
            blockers: Re
          });
        }
      });
      return;
    }
    return await m(T, M, {
      submission: L,
      // Send through the formData serialization error if we have one so we can
      // render at the right error boundary after we match routes
      pendingError: B,
      preventScrollReset: k,
      replace: u && u.replace,
      enableViewTransition: u && u.viewTransition,
      flushSync: X
    });
  }
  function Kt() {
    if (Y(), be({
      revalidation: "loading"
    }), d.navigation.state !== "submitting") {
      if (d.navigation.state === "idle") {
        m(d.historyAction, d.location, {
          startUninterruptedRevalidation: !0
        });
        return;
      }
      m(J || d.historyAction, d.navigation.location, {
        overrideNavigation: d.navigation,
        // Proxy through any rending view transition
        enableViewTransition: ne === !0
      });
    }
  }
  async function m(s, u, p) {
    Z && Z.abort(), Z = null, J = s, Ue = (p && p.startUninterruptedRevalidation) === !0, nr(d.location, d.matches), ie = (p && p.preventScrollReset) === !0, ne = (p && p.enableViewTransition) === !0;
    let E = c || l, L = p && p.overrideNavigation, B = p != null && p.initialHydration && d.matches && d.matches.length > 0 && !z ? (
      // `matchRoutes()` has already been called if we're in here via `router.initialize()`
      d.matches
    ) : Ie(E, u, i), K = (p && p.flushSync) === !0;
    if (B && d.initialized && !Ye && Ea(d.location, u) && !(p && p.submission && Te(p.submission.formMethod))) {
      Me(u, {
        matches: B
      }, {
        flushSync: K
      });
      return;
    }
    let M = Et(B, E, u.pathname);
    if (M.active && M.matches && (B = M.matches), !B) {
      let {
        error: ce,
        notFoundMatches: oe,
        route: me
      } = De(u.pathname);
      Me(u, {
        matches: oe,
        loaderData: {},
        errors: {
          [me.id]: ce
        }
      }, {
        flushSync: K
      });
      return;
    }
    Z = new AbortController();
    let I = xt(e.history, u, Z.signal, p && p.submission), T;
    if (p && p.pendingError)
      T = [it(B).route.id, {
        type: ee.error,
        error: p.pendingError
      }];
    else if (p && p.submission && Te(p.submission.formMethod)) {
      let ce = await b(I, u, p.submission, B, M.active, {
        replace: p.replace,
        flushSync: K
      });
      if (ce.shortCircuited)
        return;
      if (ce.pendingActionResult) {
        let [oe, me] = ce.pendingActionResult;
        if (Se(me) && qe(me.error) && me.error.status === 404) {
          Z = null, Me(u, {
            matches: ce.matches,
            loaderData: {},
            errors: {
              [oe]: me.error
            }
          });
          return;
        }
      }
      B = ce.matches || B, T = ce.pendingActionResult, L = ir(u, p.submission), K = !1, M.active = !1, I = xt(e.history, I.url, I.signal);
    }
    let {
      shortCircuited: k,
      matches: X,
      loaderData: q,
      errors: Re
    } = await y(I, u, B, M.active, L, p && p.submission, p && p.fetcherSubmission, p && p.replace, p && p.initialHydration === !0, K, T);
    k || (Z = null, Me(u, te({
      matches: X || B
    }, Br(T), {
      loaderData: q,
      errors: Re
    })));
  }
  async function b(s, u, p, E, L, B) {
    B === void 0 && (B = {}), Y();
    let K = Da(u, p);
    if (be({
      navigation: K
    }, {
      flushSync: B.flushSync === !0
    }), L) {
      let T = await $t(E, u.pathname, s.signal);
      if (T.type === "aborted")
        return {
          shortCircuited: !0
        };
      if (T.type === "error") {
        let k = it(T.partialMatches).route.id;
        return {
          matches: T.partialMatches,
          pendingActionResult: [k, {
            type: ee.error,
            error: T.error
          }]
        };
      } else if (T.matches)
        E = T.matches;
      else {
        let {
          notFoundMatches: k,
          error: X,
          route: q
        } = De(u.pathname);
        return {
          matches: k,
          pendingActionResult: [q.id, {
            type: ee.error,
            error: X
          }]
        };
      }
    }
    let M, I = vt(E, u);
    if (!I.route.action && !I.route.lazy)
      M = {
        type: ee.error,
        error: he(405, {
          method: s.method,
          pathname: u.pathname,
          routeId: I.route.id
        })
      };
    else if (M = (await _("action", d, s, [I], E, null))[I.route.id], s.signal.aborted)
      return {
        shortCircuited: !0
      };
    if (st(M)) {
      let T;
      return B && B.replace != null ? T = B.replace : T = Ar(M.response.headers.get("Location"), new URL(s.url), i) === d.location.pathname + d.location.search, await j(s, M, !0, {
        submission: p,
        replace: T
      }), {
        shortCircuited: !0
      };
    }
    if (Qe(M))
      throw he(400, {
        type: "defer-action"
      });
    if (Se(M)) {
      let T = it(E, I.route.id);
      return (B && B.replace) !== !0 && (J = ue.Push), {
        matches: E,
        pendingActionResult: [T.route.id, M]
      };
    }
    return {
      matches: E,
      pendingActionResult: [I.route.id, M]
    };
  }
  async function y(s, u, p, E, L, B, K, M, I, T, k) {
    let X = L || ir(u, B), q = B || K || Hr(X), Re = !Ue && (!h.v7_partialHydration || !I);
    if (E) {
      if (Re) {
        let ve = w(k);
        be(te({
          navigation: X
        }, ve !== void 0 ? {
          actionData: ve
        } : {}), {
          flushSync: T
        });
      }
      let ae = await $t(p, u.pathname, s.signal);
      if (ae.type === "aborted")
        return {
          shortCircuited: !0
        };
      if (ae.type === "error") {
        let ve = it(ae.partialMatches).route.id;
        return {
          matches: ae.partialMatches,
          loaderData: {},
          errors: {
            [ve]: ae.error
          }
        };
      } else if (ae.matches)
        p = ae.matches;
      else {
        let {
          error: ve,
          notFoundMatches: St,
          route: Nt
        } = De(u.pathname);
        return {
          matches: St,
          loaderData: {},
          errors: {
            [Nt.id]: ve
          }
        };
      }
    }
    let ce = c || l, [oe, me] = Nr(e.history, d, p, q, u, h.v7_partialHydration && I === !0, h.v7_skipActionErrorRevalidation, Ye, gt, yt, Pe, Ne, je, ce, i, k);
    if (Ce((ae) => !(p && p.some((ve) => ve.route.id === ae)) || oe && oe.some((ve) => ve.route.id === ae)), et = ++bt, oe.length === 0 && me.length === 0) {
      let ae = pe();
      return Me(u, te({
        matches: p,
        loaderData: {},
        // Commit pending error if we're short circuiting
        errors: k && Se(k[1]) ? {
          [k[0]]: k[1].error
        } : null
      }, Br(k), ae ? {
        fetchers: new Map(d.fetchers)
      } : {}), {
        flushSync: T
      }), {
        shortCircuited: !0
      };
    }
    if (Re) {
      let ae = {};
      if (!E) {
        ae.navigation = X;
        let ve = w(k);
        ve !== void 0 && (ae.actionData = ve);
      }
      me.length > 0 && (ae.fetchers = D(me)), be(ae, {
        flushSync: T
      });
    }
    me.forEach((ae) => {
      $(ae.key), ae.controller && ge.set(ae.key, ae.controller);
    });
    let Rt = () => me.forEach((ae) => $(ae.key));
    Z && Z.signal.addEventListener("abort", Rt);
    let {
      loaderResults: Ut,
      fetcherResults: Xe
    } = await F(d, p, oe, me, s);
    if (s.signal.aborted)
      return {
        shortCircuited: !0
      };
    Z && Z.signal.removeEventListener("abort", Rt), me.forEach((ae) => ge.delete(ae.key));
    let $e = Gt(Ut);
    if ($e)
      return await j(s, $e.result, !0, {
        replace: M
      }), {
        shortCircuited: !0
      };
    if ($e = Gt(Xe), $e)
      return je.add($e.key), await j(s, $e.result, !0, {
        replace: M
      }), {
        shortCircuited: !0
      };
    let {
      loaderData: ar,
      errors: jt
    } = Ir(d, p, Ut, k, me, Xe, Ae);
    Ae.forEach((ae, ve) => {
      ae.subscribe((St) => {
        (St || ae.done) && Ae.delete(ve);
      });
    }), h.v7_partialHydration && I && d.errors && (jt = te({}, d.errors, jt));
    let pt = pe(), Jt = rt(et), Yt = pt || Jt || me.length > 0;
    return te({
      matches: p,
      loaderData: ar,
      errors: jt
    }, Yt ? {
      fetchers: new Map(d.fetchers)
    } : {});
  }
  function w(s) {
    if (s && !Se(s[1]))
      return {
        [s[0]]: s[1].data
      };
    if (d.actionData)
      return Object.keys(d.actionData).length === 0 ? null : d.actionData;
  }
  function D(s) {
    return s.forEach((u) => {
      let p = d.fetchers.get(u.key), E = Ft(void 0, p ? p.data : void 0);
      d.fetchers.set(u.key, E);
    }), new Map(d.fetchers);
  }
  function A(s, u, p, E) {
    if (n)
      throw new Error("router.fetch() was called during the server render, but it shouldn't be. You are likely calling a useFetcher() method in the body of your component. Try moving it to a useEffect or a callback.");
    $(s);
    let L = (E && E.flushSync) === !0, B = c || l, K = sr(d.location, d.matches, i, h.v7_prependBasename, p, h.v7_relativeSplatPath, u, E == null ? void 0 : E.relative), M = Ie(B, K, i), I = Et(M, B, K);
    if (I.active && I.matches && (M = I.matches), !M) {
      Q(s, u, he(404, {
        pathname: K
      }), {
        flushSync: L
      });
      return;
    }
    let {
      path: T,
      submission: k,
      error: X
    } = jr(h.v7_normalizeFormMethod, !0, K, E);
    if (X) {
      Q(s, u, X, {
        flushSync: L
      });
      return;
    }
    let q = vt(M, T), Re = (E && E.preventScrollReset) === !0;
    if (k && Te(k.formMethod)) {
      U(s, u, T, q, M, I.active, L, Re, k);
      return;
    }
    Ne.set(s, {
      routeId: u,
      path: T
    }), H(s, u, T, q, M, I.active, L, Re, k);
  }
  async function U(s, u, p, E, L, B, K, M, I) {
    Y(), Ne.delete(s);
    function T(ye) {
      if (!ye.route.action && !ye.route.lazy) {
        let Pt = he(405, {
          method: I.formMethod,
          pathname: p,
          routeId: u
        });
        return Q(s, u, Pt, {
          flushSync: K
        }), !0;
      }
      return !1;
    }
    if (!B && T(E))
      return;
    let k = d.fetchers.get(s);
    G(s, Ca(I, k), {
      flushSync: K
    });
    let X = new AbortController(), q = xt(e.history, p, X.signal, I);
    if (B) {
      let ye = await $t(L, new URL(q.url).pathname, q.signal, s);
      if (ye.type === "aborted")
        return;
      if (ye.type === "error") {
        Q(s, u, ye.error, {
          flushSync: K
        });
        return;
      } else if (ye.matches) {
        if (L = ye.matches, E = vt(L, p), T(E))
          return;
      } else {
        Q(s, u, he(404, {
          pathname: p
        }), {
          flushSync: K
        });
        return;
      }
    }
    ge.set(s, X);
    let Re = bt, oe = (await _("action", d, q, [E], L, s))[E.route.id];
    if (q.signal.aborted) {
      ge.get(s) === X && ge.delete(s);
      return;
    }
    if (h.v7_fetcherPersist && Pe.has(s)) {
      if (st(oe) || Se(oe)) {
        G(s, ot(void 0));
        return;
      }
    } else {
      if (st(oe))
        if (ge.delete(s), et > Re) {
          G(s, ot(void 0));
          return;
        } else
          return je.add(s), G(s, Ft(I)), j(q, oe, !1, {
            fetcherSubmission: I,
            preventScrollReset: M
          });
      if (Se(oe)) {
        Q(s, u, oe.error);
        return;
      }
    }
    if (Qe(oe))
      throw he(400, {
        type: "defer-action"
      });
    let me = d.navigation.location || d.location, Rt = xt(e.history, me, X.signal), Ut = c || l, Xe = d.navigation.state !== "idle" ? Ie(Ut, d.navigation.location, i) : d.matches;
    W(Xe, "Didn't find any matches after fetcher action");
    let $e = ++bt;
    tt.set(s, $e);
    let ar = Ft(I, oe.data);
    d.fetchers.set(s, ar);
    let [jt, pt] = Nr(e.history, d, Xe, I, me, !1, h.v7_skipActionErrorRevalidation, Ye, gt, yt, Pe, Ne, je, Ut, i, [E.route.id, oe]);
    pt.filter((ye) => ye.key !== s).forEach((ye) => {
      let Pt = ye.key, Dr = d.fetchers.get(Pt), Fn = Ft(void 0, Dr ? Dr.data : void 0);
      d.fetchers.set(Pt, Fn), $(Pt), ye.controller && ge.set(Pt, ye.controller);
    }), be({
      fetchers: new Map(d.fetchers)
    });
    let Jt = () => pt.forEach((ye) => $(ye.key));
    X.signal.addEventListener("abort", Jt);
    let {
      loaderResults: Yt,
      fetcherResults: ae
    } = await F(d, Xe, jt, pt, Rt);
    if (X.signal.aborted)
      return;
    X.signal.removeEventListener("abort", Jt), tt.delete(s), ge.delete(s), pt.forEach((ye) => ge.delete(ye.key));
    let ve = Gt(Yt);
    if (ve)
      return j(Rt, ve.result, !1, {
        preventScrollReset: M
      });
    if (ve = Gt(ae), ve)
      return je.add(ve.key), j(Rt, ve.result, !1, {
        preventScrollReset: M
      });
    let {
      loaderData: St,
      errors: Nt
    } = Ir(d, Xe, Yt, void 0, pt, ae, Ae);
    if (d.fetchers.has(s)) {
      let ye = ot(oe.data);
      d.fetchers.set(s, ye);
    }
    rt($e), d.navigation.state === "loading" && $e > et ? (W(J, "Expected pending action"), Z && Z.abort(), Me(d.navigation.location, {
      matches: Xe,
      loaderData: St,
      errors: Nt,
      fetchers: new Map(d.fetchers)
    })) : (be({
      errors: Nt,
      loaderData: kr(d.loaderData, St, Xe, Nt),
      fetchers: new Map(d.fetchers)
    }), Ye = !1);
  }
  async function H(s, u, p, E, L, B, K, M, I) {
    let T = d.fetchers.get(s);
    G(s, Ft(I, T ? T.data : void 0), {
      flushSync: K
    });
    let k = new AbortController(), X = xt(e.history, p, k.signal);
    if (B) {
      let oe = await $t(L, new URL(X.url).pathname, X.signal, s);
      if (oe.type === "aborted")
        return;
      if (oe.type === "error") {
        Q(s, u, oe.error, {
          flushSync: K
        });
        return;
      } else if (oe.matches)
        L = oe.matches, E = vt(L, p);
      else {
        Q(s, u, he(404, {
          pathname: p
        }), {
          flushSync: K
        });
        return;
      }
    }
    ge.set(s, k);
    let q = bt, ce = (await _("loader", d, X, [E], L, s))[E.route.id];
    if (Qe(ce) && (ce = await br(ce, X.signal, !0) || ce), ge.get(s) === k && ge.delete(s), !X.signal.aborted) {
      if (Pe.has(s)) {
        G(s, ot(void 0));
        return;
      }
      if (st(ce))
        if (et > q) {
          G(s, ot(void 0));
          return;
        } else {
          je.add(s), await j(X, ce, !1, {
            preventScrollReset: M
          });
          return;
        }
      if (Se(ce)) {
        Q(s, u, ce.error);
        return;
      }
      W(!Qe(ce), "Unhandled fetcher deferred data"), G(s, ot(ce.data));
    }
  }
  async function j(s, u, p, E) {
    let {
      submission: L,
      fetcherSubmission: B,
      preventScrollReset: K,
      replace: M
    } = E === void 0 ? {} : E;
    u.response.headers.has("X-Remix-Revalidate") && (Ye = !0);
    let I = u.response.headers.get("Location");
    W(I, "Expected a Location header on the redirect Response"), I = Ar(I, new URL(s.url), i);
    let T = Ze(d.location, I, {
      _isRedirect: !0
    });
    if (r) {
      let oe = !1;
      if (u.response.headers.has("X-Remix-Reload-Document"))
        oe = !0;
      else if (yr.test(I)) {
        const me = e.history.createURL(I);
        oe = // Hard reload if it's an absolute URL to a new origin
        me.origin !== t.location.origin || // Hard reload if it's an absolute URL that does not match our basename
        ut(me.pathname, i) == null;
      }
      if (oe) {
        M ? t.location.replace(I) : t.location.assign(I);
        return;
      }
    }
    Z = null;
    let k = M === !0 || u.response.headers.has("X-Remix-Replace") ? ue.Replace : ue.Push, {
      formMethod: X,
      formAction: q,
      formEncType: Re
    } = d.navigation;
    !L && !B && X && q && Re && (L = Hr(d.navigation));
    let ce = L || B;
    if (pa.has(u.response.status) && ce && Te(ce.formMethod))
      await m(k, T, {
        submission: te({}, ce, {
          formAction: I
        }),
        // Preserve these flags across redirects
        preventScrollReset: K || ie,
        enableViewTransition: p ? ne : void 0
      });
    else {
      let oe = ir(T, L);
      await m(k, T, {
        overrideNavigation: oe,
        // Send fetcher submissions through for shouldRevalidate
        fetcherSubmission: B,
        // Preserve these flags across redirects
        preventScrollReset: K || ie,
        enableViewTransition: p ? ne : void 0
      });
    }
  }
  async function _(s, u, p, E, L, B) {
    let K, M = {};
    try {
      K = await fn(g, s, u, p, E, L, B, a, o);
    } catch (I) {
      return E.forEach((T) => {
        M[T.route.id] = {
          type: ee.error,
          error: I
        };
      }), M;
    }
    for (let [I, T] of Object.entries(K))
      if (gn(T)) {
        let k = T.result;
        M[I] = {
          type: ee.redirect,
          response: pn(k, p, I, L, i, h.v7_relativeSplatPath)
        };
      } else
        M[I] = await hn(T);
    return M;
  }
  async function F(s, u, p, E, L) {
    let B = s.matches, K = _("loader", s, L, p, u, null), M = Promise.all(E.map(async (k) => {
      if (k.matches && k.match && k.controller) {
        let q = (await _("loader", s, xt(e.history, k.path, k.controller.signal), [k.match], k.matches, k.key))[k.match.route.id];
        return {
          [k.key]: q
        };
      } else
        return Promise.resolve({
          [k.key]: {
            type: ee.error,
            error: he(404, {
              pathname: k.path
            })
          }
        });
    })), I = await K, T = (await M).reduce((k, X) => Object.assign(k, X), {});
    return await Promise.all([Pa(u, I, L.signal, B, s.loaderData), xa(u, T, E)]), {
      loaderResults: I,
      fetcherResults: T
    };
  }
  function Y() {
    Ye = !0, gt.push(...Ce()), Ne.forEach((s, u) => {
      ge.has(u) && yt.add(u), $(u);
    });
  }
  function G(s, u, p) {
    p === void 0 && (p = {}), d.fetchers.set(s, u), be({
      fetchers: new Map(d.fetchers)
    }, {
      flushSync: (p && p.flushSync) === !0
    });
  }
  function Q(s, u, p, E) {
    E === void 0 && (E = {});
    let L = it(d.matches, u);
    Ee(s), be({
      errors: {
        [L.route.id]: p
      },
      fetchers: new Map(d.fetchers)
    }, {
      flushSync: (E && E.flushSync) === !0
    });
  }
  function de(s) {
    return ze.set(s, (ze.get(s) || 0) + 1), Pe.has(s) && Pe.delete(s), d.fetchers.get(s) || nn;
  }
  function Ee(s) {
    let u = d.fetchers.get(s);
    ge.has(s) && !(u && u.state === "loading" && tt.has(s)) && $(s), Ne.delete(s), tt.delete(s), je.delete(s), h.v7_fetcherPersist && Pe.delete(s), yt.delete(s), d.fetchers.delete(s);
  }
  function xe(s) {
    let u = (ze.get(s) || 0) - 1;
    u <= 0 ? (ze.delete(s), Pe.add(s), h.v7_fetcherPersist || Ee(s)) : ze.set(s, u), be({
      fetchers: new Map(d.fetchers)
    });
  }
  function $(s) {
    let u = ge.get(s);
    u && (u.abort(), ge.delete(s));
  }
  function se(s) {
    for (let u of s) {
      let p = de(u), E = ot(p.data);
      d.fetchers.set(u, E);
    }
  }
  function pe() {
    let s = [], u = !1;
    for (let p of je) {
      let E = d.fetchers.get(p);
      W(E, "Expected fetcher: " + p), E.state === "loading" && (je.delete(p), s.push(p), u = !0);
    }
    return se(s), u;
  }
  function rt(s) {
    let u = [];
    for (let [p, E] of tt)
      if (E < s) {
        let L = d.fetchers.get(p);
        W(L, "Expected fetcher: " + p), L.state === "loading" && ($(p), tt.delete(p), u.push(p));
      }
    return se(u), u.length > 0;
  }
  function nt(s, u) {
    let p = d.blockers.get(s) || mt;
    return We.get(s) !== u && We.set(s, u), p;
  }
  function at(s) {
    d.blockers.delete(s), We.delete(s);
  }
  function Ge(s, u) {
    let p = d.blockers.get(s) || mt;
    W(p.state === "unblocked" && u.state === "blocked" || p.state === "blocked" && u.state === "blocked" || p.state === "blocked" && u.state === "proceeding" || p.state === "blocked" && u.state === "unblocked" || p.state === "proceeding" && u.state === "unblocked", "Invalid blocker state transition: " + p.state + " -> " + u.state);
    let E = new Map(d.blockers);
    E.set(s, u), be({
      blockers: E
    });
  }
  function fe(s) {
    let {
      currentLocation: u,
      nextLocation: p,
      historyAction: E
    } = s;
    if (We.size === 0)
      return;
    We.size > 1 && ke(!1, "A router only supports one blocker at a time");
    let L = Array.from(We.entries()), [B, K] = L[L.length - 1], M = d.blockers.get(B);
    if (!(M && M.state === "proceeding") && K({
      currentLocation: u,
      nextLocation: p,
      historyAction: E
    }))
      return B;
  }
  function De(s) {
    let u = he(404, {
      pathname: s
    }), p = c || l, {
      matches: E,
      route: L
    } = qt(p);
    return Ce(), {
      notFoundMatches: E,
      route: L,
      error: u
    };
  }
  function Ce(s) {
    let u = [];
    return Ae.forEach((p, E) => {
      (!s || s(E)) && (p.cancel(), u.push(E), Ae.delete(E));
    }), u;
  }
  function Vt(s, u, p) {
    if (S = s, C = u, P = p || null, !V && d.navigation === Qt) {
      V = !0;
      let E = Ve(d.location, d.matches);
      E != null && be({
        restoreScrollPosition: E
      });
    }
    return () => {
      S = null, C = null, P = null;
    };
  }
  function Ke(s, u) {
    return P && P(s, u.map((E) => mr(E, d.loaderData))) || s.key;
  }
  function nr(s, u) {
    if (S && C) {
      let p = Ke(s, u);
      S[p] = C();
    }
  }
  function Ve(s, u) {
    if (S) {
      let p = Ke(s, u), E = S[p];
      if (typeof E == "number")
        return E;
    }
    return null;
  }
  function Et(s, u, p) {
    if (v)
      if (s) {
        if (Object.keys(s[0].params).length > 0)
          return {
            active: !0,
            matches: Xt(u, p, i, !0)
          };
      } else
        return {
          active: !0,
          matches: Xt(u, p, i, !0) || []
        };
    return {
      active: !1,
      matches: null
    };
  }
  async function $t(s, u, p, E) {
    if (!v)
      return {
        type: "success",
        matches: s
      };
    let L = s;
    for (; ; ) {
      let B = c == null, K = c || l, M = a;
      try {
        await v({
          signal: p,
          path: u,
          matches: L,
          fetcherKey: E,
          patch: (k, X) => {
            p.aborted || Tr(k, X, K, M, o);
          }
        });
      } catch (k) {
        return {
          type: "error",
          error: k,
          partialMatches: L
        };
      } finally {
        B && !p.aborted && (l = [...l]);
      }
      if (p.aborted)
        return {
          type: "aborted"
        };
      let I = Ie(K, u, i);
      if (I)
        return {
          type: "success",
          matches: I
        };
      let T = Xt(K, u, i, !0);
      if (!T || L.length === T.length && L.every((k, X) => k.route.id === T[X].route.id))
        return {
          type: "success",
          matches: null
        };
      L = T;
    }
  }
  function jn(s) {
    a = {}, c = Dt(s, o, void 0, a);
  }
  function Nn(s, u) {
    let p = c == null;
    Tr(s, u, c || l, a, o), p && (l = [...l], be({}));
  }
  return le = {
    get basename() {
      return i;
    },
    get future() {
      return h;
    },
    get state() {
      return d;
    },
    get routes() {
      return l;
    },
    get window() {
      return t;
    },
    initialize: zt,
    subscribe: Wt,
    enableScrollRestoration: Vt,
    navigate: Ot,
    fetch: A,
    revalidate: Kt,
    // Passthrough to history-aware createHref used by useHref so we get proper
    // hash-aware URLs in DOM paths
    createHref: (s) => e.history.createHref(s),
    encodeLocation: (s) => e.history.encodeLocation(s),
    getFetcher: de,
    deleteFetcher: xe,
    dispose: _t,
    getBlocker: nt,
    deleteBlocker: at,
    patchRoutes: Nn,
    _internalFetchControllers: ge,
    _internalActiveDeferreds: Ae,
    // TODO: Remove setRoutes, it's temporary to avoid dealing with
    // updating the tree while validating the update algorithm.
    _internalSetRoutes: jn
  }, le;
}
const sn = Symbol("deferred");
function ma(e, t) {
  W(e.length > 0, "You must provide a non-empty routes array to createStaticHandler");
  let r = {}, n = (t ? t.basename : null) || "/", o;
  if (t != null && t.mapRouteProperties)
    o = t.mapRouteProperties;
  else if (t != null && t.detectErrorBoundary) {
    let f = t.detectErrorBoundary;
    o = (S) => ({
      hasErrorBoundary: f(S)
    });
  } else
    o = an;
  let a = te({
    v7_relativeSplatPath: !1,
    v7_throwAbortReason: !1
  }, t ? t.future : null), l = Dt(e, o, void 0, r);
  async function c(f, S) {
    let {
      requestContext: P,
      skipLoaderErrorBubbling: C,
      dataStrategy: V
    } = S === void 0 ? {} : S, N = new URL(f.url), z = f.method, O = Ze("", Be(N), null, "default"), re = Ie(l, O, n);
    if (!hr(z) && z !== "HEAD") {
      let d = he(405, {
        method: z
      }), {
        matches: J,
        route: ie
      } = qt(l);
      return {
        basename: n,
        location: O,
        matches: J,
        loaderData: {},
        actionData: null,
        errors: {
          [ie.id]: d
        },
        statusCode: d.status,
        loaderHeaders: {},
        actionHeaders: {},
        activeDeferreds: null
      };
    } else if (!re) {
      let d = he(404, {
        pathname: O.pathname
      }), {
        matches: J,
        route: ie
      } = qt(l);
      return {
        basename: n,
        location: O,
        matches: J,
        loaderData: {},
        actionData: null,
        errors: {
          [ie.id]: d
        },
        statusCode: d.status,
        loaderHeaders: {},
        actionHeaders: {},
        activeDeferreds: null
      };
    }
    let le = await g(f, O, re, P, V || null, C === !0, null);
    return lt(le) ? le : te({
      location: O,
      basename: n
    }, le);
  }
  async function i(f, S) {
    let {
      routeId: P,
      requestContext: C,
      dataStrategy: V
    } = S === void 0 ? {} : S, N = new URL(f.url), z = f.method, O = Ze("", Be(N), null, "default"), re = Ie(l, O, n);
    if (!hr(z) && z !== "HEAD" && z !== "OPTIONS")
      throw he(405, {
        method: z
      });
    if (!re)
      throw he(404, {
        pathname: O.pathname
      });
    let le = P ? re.find((Z) => Z.route.id === P) : vt(re, O);
    if (P && !le)
      throw he(403, {
        pathname: O.pathname,
        routeId: P
      });
    if (!le)
      throw he(404, {
        pathname: O.pathname
      });
    let d = await g(f, O, re, C, V || null, !1, le);
    if (lt(d))
      return d;
    let J = d.errors ? Object.values(d.errors)[0] : void 0;
    if (J !== void 0)
      throw J;
    if (d.actionData)
      return Object.values(d.actionData)[0];
    if (d.loaderData) {
      var ie;
      let Z = Object.values(d.loaderData)[0];
      return (ie = d.activeDeferreds) != null && ie[le.route.id] && (Z[sn] = d.activeDeferreds[le.route.id]), Z;
    }
  }
  async function g(f, S, P, C, V, N, z) {
    W(f.signal, "query()/queryRoute() requests must contain an AbortController signal");
    try {
      if (Te(f.method.toLowerCase()))
        return await v(f, P, z || vt(P, S), C, V, N, z != null);
      let O = await h(f, P, C, V, N, z);
      return lt(O) ? O : te({}, O, {
        actionData: null,
        actionHeaders: {}
      });
    } catch (O) {
      if (Ra(O) && lt(O.result)) {
        if (O.type === ee.error)
          throw O.result;
        return O.result;
      }
      if (Sa(O))
        return O;
      throw O;
    }
  }
  async function v(f, S, P, C, V, N, z) {
    let O;
    if (!P.route.action && !P.route.lazy) {
      let d = he(405, {
        method: f.method,
        pathname: new URL(f.url).pathname,
        routeId: P.route.id
      });
      if (z)
        throw d;
      O = {
        type: ee.error,
        error: d
      };
    } else
      O = (await x("action", f, [P], S, z, C, V))[P.route.id], f.signal.aborted && Ur(f, z, a);
    if (st(O))
      throw new Response(null, {
        status: O.response.status,
        headers: {
          Location: O.response.headers.get("Location")
        }
      });
    if (Qe(O)) {
      let d = he(400, {
        type: "defer-action"
      });
      if (z)
        throw d;
      O = {
        type: ee.error,
        error: d
      };
    }
    if (z) {
      if (Se(O))
        throw O.error;
      return {
        matches: [P],
        loaderData: {},
        actionData: {
          [P.route.id]: O.data
        },
        errors: null,
        // Note: statusCode + headers are unused here since queryRoute will
        // return the raw Response or value
        statusCode: 200,
        loaderHeaders: {},
        actionHeaders: {},
        activeDeferreds: null
      };
    }
    let re = new Request(f.url, {
      headers: f.headers,
      redirect: f.redirect,
      signal: f.signal
    });
    if (Se(O)) {
      let d = N ? P : it(S, P.route.id), J = await h(re, S, C, V, N, null, [d.route.id, O]);
      return te({}, J, {
        statusCode: qe(O.error) ? O.error.status : O.statusCode != null ? O.statusCode : 500,
        actionData: null,
        actionHeaders: te({}, O.headers ? {
          [P.route.id]: O.headers
        } : {})
      });
    }
    let le = await h(re, S, C, V, N, null);
    return te({}, le, {
      actionData: {
        [P.route.id]: O.data
      }
    }, O.statusCode ? {
      statusCode: O.statusCode
    } : {}, {
      actionHeaders: O.headers ? {
        [P.route.id]: O.headers
      } : {}
    });
  }
  async function h(f, S, P, C, V, N, z) {
    let O = N != null;
    if (O && !(N != null && N.route.loader) && !(N != null && N.route.lazy))
      throw he(400, {
        method: f.method,
        pathname: new URL(f.url).pathname,
        routeId: N == null ? void 0 : N.route.id
      });
    let le = (N ? [N] : z && Se(z[1]) ? ur(S, z[0]) : S).filter((ne) => ne.route.loader || ne.route.lazy);
    if (le.length === 0)
      return {
        matches: S,
        // Add a null for all matched routes for proper revalidation on the client
        loaderData: S.reduce((ne, we) => Object.assign(ne, {
          [we.route.id]: null
        }), {}),
        errors: z && Se(z[1]) ? {
          [z[0]]: z[1].error
        } : null,
        statusCode: 200,
        loaderHeaders: {},
        activeDeferreds: null
      };
    let d = await x("loader", f, le, S, O, P, C);
    f.signal.aborted && Ur(f, O, a);
    let J = /* @__PURE__ */ new Map(), ie = mn(S, d, z, J, V), Z = new Set(le.map((ne) => ne.route.id));
    return S.forEach((ne) => {
      Z.has(ne.route.id) || (ie.loaderData[ne.route.id] = null);
    }), te({}, ie, {
      matches: S,
      activeDeferreds: J.size > 0 ? Object.fromEntries(J.entries()) : null
    });
  }
  async function x(f, S, P, C, V, N, z) {
    let O = await fn(z || dn, f, null, S, P, C, null, r, o, N), re = {};
    return await Promise.all(C.map(async (le) => {
      if (!(le.route.id in O))
        return;
      let d = O[le.route.id];
      if (gn(d)) {
        let J = d.result;
        throw pn(J, S, le.route.id, C, n, a.v7_relativeSplatPath);
      }
      if (lt(d.result) && V)
        throw d;
      re[le.route.id] = await hn(d);
    })), re;
  }
  return {
    dataRoutes: l,
    query: c,
    queryRoute: i
  };
}
function va(e, t, r) {
  return te({}, t, {
    statusCode: qe(r) ? r.status : 500,
    errors: {
      [t._deepestRenderedBoundaryId || e[0].id]: r
    }
  });
}
function Ur(e, t, r) {
  if (r.v7_throwAbortReason && e.signal.reason !== void 0)
    throw e.signal.reason;
  let n = t ? "queryRoute" : "query";
  throw new Error(n + "() call aborted: " + e.method + " " + e.url);
}
function ga(e) {
  return e != null && ("formData" in e && e.formData != null || "body" in e && e.body !== void 0);
}
function sr(e, t, r, n, o, a, l, c) {
  let i, g;
  if (l) {
    i = [];
    for (let h of t)
      if (i.push(h), h.route.id === l) {
        g = h;
        break;
      }
  } else
    i = t, g = t[t.length - 1];
  let v = kt(o || ".", It(i, a), ut(e.pathname, r) || e.pathname, c === "path");
  if (o == null && (v.search = e.search, v.hash = e.hash), (o == null || o === "" || o === ".") && g) {
    let h = wr(v.search);
    if (g.route.index && !h)
      v.search = v.search ? v.search.replace(/^\?/, "?index&") : "?index";
    else if (!g.route.index && h) {
      let x = new URLSearchParams(v.search), f = x.getAll("index");
      x.delete("index"), f.filter((P) => P).forEach((P) => x.append("index", P));
      let S = x.toString();
      v.search = S ? "?" + S : "";
    }
  }
  return n && r !== "/" && (v.pathname = v.pathname === "/" ? r : Je([r, v.pathname])), Be(v);
}
function jr(e, t, r, n) {
  if (!n || !ga(n))
    return {
      path: r
    };
  if (n.formMethod && !hr(n.formMethod))
    return {
      path: r,
      error: he(405, {
        method: n.formMethod
      })
    };
  let o = () => ({
    path: r,
    error: he(400, {
      type: "invalid-body"
    })
  }), a = n.formMethod || "get", l = e ? a.toUpperCase() : a.toLowerCase(), c = vn(r);
  if (n.body !== void 0) {
    if (n.formEncType === "text/plain") {
      if (!Te(l))
        return o();
      let x = typeof n.body == "string" ? n.body : n.body instanceof FormData || n.body instanceof URLSearchParams ? (
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#plain-text-form-data
        Array.from(n.body.entries()).reduce((f, S) => {
          let [P, C] = S;
          return "" + f + P + "=" + C + `
`;
        }, "")
      ) : String(n.body);
      return {
        path: r,
        submission: {
          formMethod: l,
          formAction: c,
          formEncType: n.formEncType,
          formData: void 0,
          json: void 0,
          text: x
        }
      };
    } else if (n.formEncType === "application/json") {
      if (!Te(l))
        return o();
      try {
        let x = typeof n.body == "string" ? JSON.parse(n.body) : n.body;
        return {
          path: r,
          submission: {
            formMethod: l,
            formAction: c,
            formEncType: n.formEncType,
            formData: void 0,
            json: x,
            text: void 0
          }
        };
      } catch {
        return o();
      }
    }
  }
  W(typeof FormData == "function", "FormData is not available in this environment");
  let i, g;
  if (n.formData)
    i = dr(n.formData), g = n.formData;
  else if (n.body instanceof FormData)
    i = dr(n.body), g = n.body;
  else if (n.body instanceof URLSearchParams)
    i = n.body, g = Mr(i);
  else if (n.body == null)
    i = new URLSearchParams(), g = new FormData();
  else
    try {
      i = new URLSearchParams(n.body), g = Mr(i);
    } catch {
      return o();
    }
  let v = {
    formMethod: l,
    formAction: c,
    formEncType: n && n.formEncType || "application/x-www-form-urlencoded",
    formData: g,
    json: void 0,
    text: void 0
  };
  if (Te(v.formMethod))
    return {
      path: r,
      submission: v
    };
  let h = Oe(r);
  return t && h.search && wr(h.search) && i.append("index", ""), h.search = "?" + i, {
    path: Be(h),
    submission: v
  };
}
function ur(e, t, r) {
  r === void 0 && (r = !1);
  let n = e.findIndex((o) => o.route.id === t);
  return n >= 0 ? e.slice(0, r ? n + 1 : n) : e;
}
function Nr(e, t, r, n, o, a, l, c, i, g, v, h, x, f, S, P) {
  let C = P ? Se(P[1]) ? P[1].error : P[1].data : void 0, V = e.createURL(t.location), N = e.createURL(o), z = r;
  a && t.errors ? z = ur(r, Object.keys(t.errors)[0], !0) : P && Se(P[1]) && (z = ur(r, P[0]));
  let O = P ? P[1].statusCode : void 0, re = l && O && O >= 400, le = z.filter((J, ie) => {
    let {
      route: Z
    } = J;
    if (Z.lazy)
      return !0;
    if (Z.loader == null)
      return !1;
    if (a)
      return cr(Z, t.loaderData, t.errors);
    if (ya(t.loaderData, t.matches[ie], J) || i.some((Le) => Le === J.route.id))
      return !0;
    let ne = t.matches[ie], we = J;
    return Fr(J, te({
      currentUrl: V,
      currentParams: ne.params,
      nextUrl: N,
      nextParams: we.params
    }, n, {
      actionResult: C,
      actionStatus: O,
      defaultShouldRevalidate: re ? !1 : (
        // Forced revalidation due to submission, useRevalidator, or X-Remix-Revalidate
        c || V.pathname + V.search === N.pathname + N.search || // Search params affect all loaders
        V.search !== N.search || un(ne, we)
      )
    }));
  }), d = [];
  return h.forEach((J, ie) => {
    if (a || !r.some((Ue) => Ue.route.id === J.routeId) || v.has(ie))
      return;
    let Z = Ie(f, J.path, S);
    if (!Z) {
      d.push({
        key: ie,
        routeId: J.routeId,
        path: J.path,
        matches: null,
        match: null,
        controller: null
      });
      return;
    }
    let ne = t.fetchers.get(ie), we = vt(Z, J.path), Le = !1;
    x.has(ie) ? Le = !1 : g.has(ie) ? (g.delete(ie), Le = !0) : ne && ne.state !== "idle" && ne.data === void 0 ? Le = c : Le = Fr(we, te({
      currentUrl: V,
      currentParams: t.matches[t.matches.length - 1].params,
      nextUrl: N,
      nextParams: r[r.length - 1].params
    }, n, {
      actionResult: C,
      actionStatus: O,
      defaultShouldRevalidate: re ? !1 : c
    })), Le && d.push({
      key: ie,
      routeId: J.routeId,
      path: J.path,
      matches: Z,
      match: we,
      controller: new AbortController()
    });
  }), [le, d];
}
function cr(e, t, r) {
  if (e.lazy)
    return !0;
  if (!e.loader)
    return !1;
  let n = t != null && t[e.id] !== void 0, o = r != null && r[e.id] !== void 0;
  return !n && o ? !1 : typeof e.loader == "function" && e.loader.hydrate === !0 ? !0 : !n && !o;
}
function ya(e, t, r) {
  let n = (
    // [a] -> [a, b]
    !t || // [a, b] -> [a, c]
    r.route.id !== t.route.id
  ), o = e[r.route.id] === void 0;
  return n || o;
}
function un(e, t) {
  let r = e.route.path;
  return (
    // param change for this match, /users/123 -> /users/456
    e.pathname !== t.pathname || // splat param changed, which is not present in match.path
    // e.g. /files/images/avatar.jpg -> files/finances.xls
    r != null && r.endsWith("*") && e.params["*"] !== t.params["*"]
  );
}
function Fr(e, t) {
  if (e.route.shouldRevalidate) {
    let r = e.route.shouldRevalidate(t);
    if (typeof r == "boolean")
      return r;
  }
  return t.defaultShouldRevalidate;
}
function Tr(e, t, r, n, o) {
  var a;
  let l;
  if (e) {
    let g = n[e];
    W(g, "No route found to patch children into: routeId = " + e), g.children || (g.children = []), l = g.children;
  } else
    l = r;
  let c = t.filter((g) => !l.some((v) => cn(g, v))), i = Dt(c, o, [e || "_", "patch", String(((a = l) == null ? void 0 : a.length) || "0")], n);
  l.push(...i);
}
function cn(e, t) {
  return "id" in e && "id" in t && e.id === t.id ? !0 : e.index === t.index && e.path === t.path && e.caseSensitive === t.caseSensitive ? (!e.children || e.children.length === 0) && (!t.children || t.children.length === 0) ? !0 : e.children.every((r, n) => {
    var o;
    return (o = t.children) == null ? void 0 : o.some((a) => cn(r, a));
  }) : !1;
}
async function ba(e, t, r) {
  if (!e.lazy)
    return;
  let n = await e.lazy();
  if (!e.lazy)
    return;
  let o = r[e.id];
  W(o, "No route found in manifest");
  let a = {};
  for (let l in n) {
    let i = o[l] !== void 0 && // This property isn't static since it should always be updated based
    // on the route updates
    l !== "hasErrorBoundary";
    ke(!i, 'Route "' + o.id + '" has a static property "' + l + '" defined but its lazy function is also returning a value for this property. ' + ('The lazy route property "' + l + '" will be ignored.')), !i && !zn.has(l) && (a[l] = n[l]);
  }
  Object.assign(o, a), Object.assign(o, te({}, t(o), {
    lazy: void 0
  }));
}
async function dn(e) {
  let {
    matches: t
  } = e, r = t.filter((o) => o.shouldLoad);
  return (await Promise.all(r.map((o) => o.resolve()))).reduce((o, a, l) => Object.assign(o, {
    [r[l].route.id]: a
  }), {});
}
async function fn(e, t, r, n, o, a, l, c, i, g) {
  let v = a.map((f) => f.route.lazy ? ba(f.route, i, c) : void 0), h = a.map((f, S) => {
    let P = v[S], C = o.some((N) => N.route.id === f.route.id);
    return te({}, f, {
      shouldLoad: C,
      resolve: async (N) => (N && n.method === "GET" && (f.route.lazy || f.route.loader) && (C = !0), C ? wa(t, n, f, P, N, g) : Promise.resolve({
        type: ee.data,
        result: void 0
      }))
    });
  }), x = await e({
    matches: h,
    request: n,
    params: a[0].params,
    fetcherKey: l,
    context: g
  });
  try {
    await Promise.all(v);
  } catch {
  }
  return x;
}
async function wa(e, t, r, n, o, a) {
  let l, c, i = (g) => {
    let v, h = new Promise((S, P) => v = P);
    c = () => v(), t.signal.addEventListener("abort", c);
    let x = (S) => typeof g != "function" ? Promise.reject(new Error("You cannot call the handler for a route which defines a boolean " + ('"' + e + '" [routeId: ' + r.route.id + "]"))) : g({
      request: t,
      params: r.params,
      context: a
    }, ...S !== void 0 ? [S] : []), f = (async () => {
      try {
        return {
          type: "data",
          result: await (o ? o((P) => x(P)) : x())
        };
      } catch (S) {
        return {
          type: "error",
          result: S
        };
      }
    })();
    return Promise.race([f, h]);
  };
  try {
    let g = r.route[e];
    if (n)
      if (g) {
        let v, [h] = await Promise.all([
          // If the handler throws, don't let it immediately bubble out,
          // since we need to let the lazy() execution finish so we know if this
          // route has a boundary that can handle the error
          i(g).catch((x) => {
            v = x;
          }),
          n
        ]);
        if (v !== void 0)
          throw v;
        l = h;
      } else if (await n, g = r.route[e], g)
        l = await i(g);
      else if (e === "action") {
        let v = new URL(t.url), h = v.pathname + v.search;
        throw he(405, {
          method: t.method,
          pathname: h,
          routeId: r.route.id
        });
      } else
        return {
          type: ee.data,
          result: void 0
        };
    else if (g)
      l = await i(g);
    else {
      let v = new URL(t.url), h = v.pathname + v.search;
      throw he(404, {
        pathname: h
      });
    }
    W(l.result !== void 0, "You defined " + (e === "action" ? "an action" : "a loader") + " for route " + ('"' + r.route.id + "\" but didn't return anything from your `" + e + "` ") + "function. Please return a value or `null`.");
  } catch (g) {
    return {
      type: ee.error,
      result: g
    };
  } finally {
    c && t.signal.removeEventListener("abort", c);
  }
  return l;
}
async function hn(e) {
  let {
    result: t,
    type: r
  } = e;
  if (lt(t)) {
    let h;
    try {
      let x = t.headers.get("Content-Type");
      x && /\bapplication\/json\b/.test(x) ? t.body == null ? h = null : h = await t.json() : h = await t.text();
    } catch (x) {
      return {
        type: ee.error,
        error: x
      };
    }
    return r === ee.error ? {
      type: ee.error,
      error: new Zt(t.status, t.statusText, h),
      statusCode: t.status,
      headers: t.headers
    } : {
      type: ee.data,
      data: h,
      statusCode: t.status,
      headers: t.headers
    };
  }
  if (r === ee.error) {
    if (fr(t)) {
      var n, o;
      if (t.data instanceof Error) {
        var a, l;
        return {
          type: ee.error,
          error: t.data,
          statusCode: (a = t.init) == null ? void 0 : a.status,
          headers: (l = t.init) != null && l.headers ? new Headers(t.init.headers) : void 0
        };
      }
      return {
        type: ee.error,
        error: new Zt(((n = t.init) == null ? void 0 : n.status) || 500, void 0, t.data),
        statusCode: qe(t) ? t.status : void 0,
        headers: (o = t.init) != null && o.headers ? new Headers(t.init.headers) : void 0
      };
    }
    return {
      type: ee.error,
      error: t,
      statusCode: qe(t) ? t.status : void 0
    };
  }
  if (yn(t)) {
    var c, i;
    return {
      type: ee.deferred,
      deferredData: t,
      statusCode: (c = t.init) == null ? void 0 : c.status,
      headers: ((i = t.init) == null ? void 0 : i.headers) && new Headers(t.init.headers)
    };
  }
  if (fr(t)) {
    var g, v;
    return {
      type: ee.data,
      data: t.data,
      statusCode: (g = t.init) == null ? void 0 : g.status,
      headers: (v = t.init) != null && v.headers ? new Headers(t.init.headers) : void 0
    };
  }
  return {
    type: ee.data,
    data: t
  };
}
function pn(e, t, r, n, o, a) {
  let l = e.headers.get("Location");
  if (W(l, "Redirects returned/thrown from loaders/actions must have a Location header"), !yr.test(l)) {
    let c = n.slice(0, n.findIndex((i) => i.route.id === r) + 1);
    l = sr(new URL(t.url), c, o, !0, l, a), e.headers.set("Location", l);
  }
  return e;
}
function Ar(e, t, r) {
  if (yr.test(e)) {
    let n = e, o = n.startsWith("//") ? new URL(t.protocol + n) : new URL(n), a = ut(o.pathname, r) != null;
    if (o.origin === t.origin && a)
      return o.pathname + o.search + o.hash;
  }
  return e;
}
function xt(e, t, r, n) {
  let o = e.createURL(vn(t)).toString(), a = {
    signal: r
  };
  if (n && Te(n.formMethod)) {
    let {
      formMethod: l,
      formEncType: c
    } = n;
    a.method = l.toUpperCase(), c === "application/json" ? (a.headers = new Headers({
      "Content-Type": c
    }), a.body = JSON.stringify(n.json)) : c === "text/plain" ? a.body = n.text : c === "application/x-www-form-urlencoded" && n.formData ? a.body = dr(n.formData) : a.body = n.formData;
  }
  return new Request(o, a);
}
function dr(e) {
  let t = new URLSearchParams();
  for (let [r, n] of e.entries())
    t.append(r, typeof n == "string" ? n : n.name);
  return t;
}
function Mr(e) {
  let t = new FormData();
  for (let [r, n] of e.entries())
    t.append(r, n);
  return t;
}
function mn(e, t, r, n, o) {
  let a = {}, l = null, c, i = !1, g = {}, v = r && Se(r[1]) ? r[1].error : void 0;
  return e.forEach((h) => {
    if (!(h.route.id in t))
      return;
    let x = h.route.id, f = t[x];
    if (W(!st(f), "Cannot handle redirect results in processLoaderData"), Se(f)) {
      let S = f.error;
      if (v !== void 0 && (S = v, v = void 0), l = l || {}, o)
        l[x] = S;
      else {
        let P = it(e, x);
        l[P.route.id] == null && (l[P.route.id] = S);
      }
      a[x] = void 0, i || (i = !0, c = qe(f.error) ? f.error.status : 500), f.headers && (g[x] = f.headers);
    } else
      Qe(f) ? (n.set(x, f.deferredData), a[x] = f.deferredData.data, f.statusCode != null && f.statusCode !== 200 && !i && (c = f.statusCode), f.headers && (g[x] = f.headers)) : (a[x] = f.data, f.statusCode && f.statusCode !== 200 && !i && (c = f.statusCode), f.headers && (g[x] = f.headers));
  }), v !== void 0 && r && (l = {
    [r[0]]: v
  }, a[r[0]] = void 0), {
    loaderData: a,
    errors: l,
    statusCode: c || 200,
    loaderHeaders: g
  };
}
function Ir(e, t, r, n, o, a, l) {
  let {
    loaderData: c,
    errors: i
  } = mn(
    t,
    r,
    n,
    l,
    !1
    // This method is only called client side so we always want to bubble
  );
  return o.forEach((g) => {
    let {
      key: v,
      match: h,
      controller: x
    } = g, f = a[v];
    if (W(f, "Did not find corresponding fetcher result"), !(x && x.signal.aborted))
      if (Se(f)) {
        let S = it(e.matches, h == null ? void 0 : h.route.id);
        i && i[S.route.id] || (i = te({}, i, {
          [S.route.id]: f.error
        })), e.fetchers.delete(v);
      } else if (st(f))
        W(!1, "Unhandled fetcher revalidation redirect");
      else if (Qe(f))
        W(!1, "Unhandled fetcher deferred data");
      else {
        let S = ot(f.data);
        e.fetchers.set(v, S);
      }
  }), {
    loaderData: c,
    errors: i
  };
}
function kr(e, t, r, n) {
  let o = te({}, t);
  for (let a of r) {
    let l = a.route.id;
    if (t.hasOwnProperty(l) ? t[l] !== void 0 && (o[l] = t[l]) : e[l] !== void 0 && a.route.loader && (o[l] = e[l]), n && n.hasOwnProperty(l))
      break;
  }
  return o;
}
function Br(e) {
  return e ? Se(e[1]) ? {
    // Clear out prior actionData on errors
    actionData: {}
  } : {
    actionData: {
      [e[0]]: e[1].data
    }
  } : {};
}
function it(e, t) {
  return (t ? e.slice(0, e.findIndex((n) => n.route.id === t) + 1) : [...e]).reverse().find((n) => n.route.hasErrorBoundary === !0) || e[0];
}
function qt(e) {
  let t = e.length === 1 ? e[0] : e.find((r) => r.index || !r.path || r.path === "/") || {
    id: "__shim-error-route__"
  };
  return {
    matches: [{
      params: {},
      pathname: "",
      pathnameBase: "",
      route: t
    }],
    route: t
  };
}
function he(e, t) {
  let {
    pathname: r,
    routeId: n,
    method: o,
    type: a,
    message: l
  } = t === void 0 ? {} : t, c = "Unknown Server Error", i = "Unknown @remix-run/router error";
  return e === 400 ? (c = "Bad Request", o && r && n ? i = "You made a " + o + ' request to "' + r + '" but ' + ('did not provide a `loader` for route "' + n + '", ') + "so there is no way to handle the request." : a === "defer-action" ? i = "defer() is not supported in actions" : a === "invalid-body" && (i = "Unable to encode submission body")) : e === 403 ? (c = "Forbidden", i = 'Route "' + n + '" does not match URL "' + r + '"') : e === 404 ? (c = "Not Found", i = 'No route matches URL "' + r + '"') : e === 405 && (c = "Method Not Allowed", o && r && n ? i = "You made a " + o.toUpperCase() + ' request to "' + r + '" but ' + ('did not provide an `action` for route "' + n + '", ') + "so there is no way to handle the request." : o && (i = 'Invalid request method "' + o.toUpperCase() + '"')), new Zt(e || 500, c, new Error(i), !0);
}
function Gt(e) {
  let t = Object.entries(e);
  for (let r = t.length - 1; r >= 0; r--) {
    let [n, o] = t[r];
    if (st(o))
      return {
        key: n,
        result: o
      };
  }
}
function vn(e) {
  let t = typeof e == "string" ? Oe(e) : e;
  return Be(te({}, t, {
    hash: ""
  }));
}
function Ea(e, t) {
  return e.pathname !== t.pathname || e.search !== t.search ? !1 : e.hash === "" ? t.hash !== "" : e.hash === t.hash ? !0 : t.hash !== "";
}
function Ra(e) {
  return e != null && typeof e == "object" && "type" in e && "result" in e && (e.type === ee.data || e.type === ee.error);
}
function gn(e) {
  return lt(e.result) && ha.has(e.result.status);
}
function Qe(e) {
  return e.type === ee.deferred;
}
function Se(e) {
  return e.type === ee.error;
}
function st(e) {
  return (e && e.type) === ee.redirect;
}
function fr(e) {
  return typeof e == "object" && e != null && "type" in e && "data" in e && "init" in e && e.type === "DataWithResponseInit";
}
function yn(e) {
  let t = e;
  return t && typeof t == "object" && typeof t.data == "object" && typeof t.subscribe == "function" && typeof t.cancel == "function" && typeof t.resolveData == "function";
}
function lt(e) {
  return e != null && typeof e.status == "number" && typeof e.statusText == "string" && typeof e.headers == "object" && typeof e.body < "u";
}
function Sa(e) {
  if (!lt(e))
    return !1;
  let t = e.status, r = e.headers.get("Location");
  return t >= 300 && t <= 399 && r != null;
}
function hr(e) {
  return fa.has(e.toLowerCase());
}
function Te(e) {
  return ca.has(e.toLowerCase());
}
async function Pa(e, t, r, n, o) {
  let a = Object.entries(t);
  for (let l = 0; l < a.length; l++) {
    let [c, i] = a[l], g = e.find((x) => (x == null ? void 0 : x.route.id) === c);
    if (!g)
      continue;
    let v = n.find((x) => x.route.id === g.route.id), h = v != null && !un(v, g) && (o && o[g.route.id]) !== void 0;
    Qe(i) && h && await br(i, r, !1).then((x) => {
      x && (t[c] = x);
    });
  }
}
async function xa(e, t, r) {
  for (let n = 0; n < r.length; n++) {
    let {
      key: o,
      routeId: a,
      controller: l
    } = r[n], c = t[o];
    e.find((g) => (g == null ? void 0 : g.route.id) === a) && Qe(c) && (W(l, "Expected an AbortController for revalidating fetcher deferred result"), await br(c, l.signal, !0).then((g) => {
      g && (t[o] = g);
    }));
  }
}
async function br(e, t, r) {
  if (r === void 0 && (r = !1), !await e.deferredData.resolveData(t)) {
    if (r)
      try {
        return {
          type: ee.data,
          data: e.deferredData.unwrappedData
        };
      } catch (o) {
        return {
          type: ee.error,
          error: o
        };
      }
    return {
      type: ee.data,
      data: e.deferredData.data
    };
  }
}
function wr(e) {
  return new URLSearchParams(e).getAll("index").some((t) => t === "");
}
function vt(e, t) {
  let r = typeof t == "string" ? Oe(t).search : t.search;
  if (e[e.length - 1].route.index && wr(r || ""))
    return e[e.length - 1];
  let n = Gr(e);
  return n[n.length - 1];
}
function Hr(e) {
  let {
    formMethod: t,
    formAction: r,
    formEncType: n,
    text: o,
    formData: a,
    json: l
  } = e;
  if (!(!t || !r || !n)) {
    if (o != null)
      return {
        formMethod: t,
        formAction: r,
        formEncType: n,
        formData: void 0,
        json: void 0,
        text: o
      };
    if (a != null)
      return {
        formMethod: t,
        formAction: r,
        formEncType: n,
        formData: a,
        json: void 0,
        text: void 0
      };
    if (l !== void 0)
      return {
        formMethod: t,
        formAction: r,
        formEncType: n,
        formData: void 0,
        json: l,
        text: void 0
      };
  }
}
function ir(e, t) {
  return t ? {
    state: "loading",
    location: e,
    formMethod: t.formMethod,
    formAction: t.formAction,
    formEncType: t.formEncType,
    formData: t.formData,
    json: t.json,
    text: t.text
  } : {
    state: "loading",
    location: e,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0
  };
}
function Da(e, t) {
  return {
    state: "submitting",
    location: e,
    formMethod: t.formMethod,
    formAction: t.formAction,
    formEncType: t.formEncType,
    formData: t.formData,
    json: t.json,
    text: t.text
  };
}
function Ft(e, t) {
  return e ? {
    state: "loading",
    formMethod: e.formMethod,
    formAction: e.formAction,
    formEncType: e.formEncType,
    formData: e.formData,
    json: e.json,
    text: e.text,
    data: t
  } : {
    state: "loading",
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
    data: t
  };
}
function Ca(e, t) {
  return {
    state: "submitting",
    formMethod: e.formMethod,
    formAction: e.formAction,
    formEncType: e.formEncType,
    formData: e.formData,
    json: e.json,
    text: e.text,
    data: t ? t.data : void 0
  };
}
function ot(e) {
  return {
    state: "idle",
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
    data: e
  };
}
function La(e, t) {
  try {
    let r = e.sessionStorage.getItem(on);
    if (r) {
      let n = JSON.parse(r);
      for (let [o, a] of Object.entries(n || {}))
        a && Array.isArray(a) && t.set(o, new Set(a || []));
    }
  } catch {
  }
}
function _a(e, t) {
  if (t.size > 0) {
    let r = {};
    for (let [n, o] of t)
      r[n] = [...o];
    try {
      e.sessionStorage.setItem(on, JSON.stringify(r));
    } catch (n) {
      ke(!1, "Failed to save applied view transitions in sessionStorage (" + n + ").");
    }
  }
}
const Oa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AbortedDeferredError: At,
  get Action() {
    return ue;
  },
  IDLE_BLOCKER: mt,
  IDLE_FETCHER: nn,
  IDLE_NAVIGATION: Qt,
  UNSAFE_DEFERRED_SYMBOL: sn,
  UNSAFE_DeferredData: Zr,
  UNSAFE_ErrorResponseImpl: Zt,
  UNSAFE_convertRouteMatchToUiMatch: mr,
  UNSAFE_convertRoutesToDataRoutes: Dt,
  UNSAFE_decodePath: vr,
  UNSAFE_getResolveToMatches: It,
  UNSAFE_invariant: W,
  UNSAFE_warning: ke,
  createBrowserHistory: kn,
  createHashHistory: Bn,
  createMemoryHistory: pr,
  createPath: Be,
  createRouter: ln,
  createStaticHandler: ma,
  data: la,
  defer: qr,
  generatePath: Yr,
  getStaticContextFromError: va,
  getToPathname: na,
  isDataWithResponseInit: fr,
  isDeferredData: yn,
  isRouteErrorResponse: qe,
  joinPaths: Je,
  json: Qr,
  matchPath: Tt,
  matchRoutes: Ie,
  normalizePathname: Xr,
  parsePath: Oe,
  redirect: rr,
  redirectDocument: en,
  replace: tn,
  resolvePath: gr,
  resolveTo: kt,
  stripBasename: ut
}, Symbol.toStringTag, { value: "Module" }));
/**
 * React Router v6.30.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function ct() {
  return ct = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var n in r)
        Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
    }
    return e;
  }, ct.apply(this, arguments);
}
const Bt = /* @__PURE__ */ R.createContext(null), Er = /* @__PURE__ */ R.createContext(null), er = /* @__PURE__ */ R.createContext(null), dt = /* @__PURE__ */ R.createContext(null), Ct = /* @__PURE__ */ R.createContext(null), He = /* @__PURE__ */ R.createContext({
  outlet: null,
  matches: [],
  isDataRoute: !1
}), bn = /* @__PURE__ */ R.createContext(null);
function Ua(e, t) {
  let {
    relative: r
  } = t === void 0 ? {} : t;
  ft() || W(!1);
  let {
    basename: n,
    navigator: o
  } = R.useContext(dt), {
    hash: a,
    pathname: l,
    search: c
  } = Pn(e, {
    relative: r
  }), i = l;
  return n !== "/" && (i = l === "/" ? n : Je([n, l])), o.createHref({
    pathname: i,
    search: c,
    hash: a
  });
}
function ft() {
  return R.useContext(Ct) != null;
}
function Lt() {
  return ft() || W(!1), R.useContext(Ct).location;
}
function ja() {
  return R.useContext(Ct).navigationType;
}
function Na(e) {
  ft() || W(!1);
  let {
    pathname: t
  } = Lt();
  return R.useMemo(() => Tt(e, vr(t)), [t, e]);
}
function wn(e) {
  R.useContext(dt).static || R.useLayoutEffect(e);
}
function En() {
  let {
    isDataRoute: e
  } = R.useContext(He);
  return e ? Za() : Fa();
}
function Fa() {
  ft() || W(!1);
  let e = R.useContext(Bt), {
    basename: t,
    future: r,
    navigator: n
  } = R.useContext(dt), {
    matches: o
  } = R.useContext(He), {
    pathname: a
  } = Lt(), l = JSON.stringify(It(o, r.v7_relativeSplatPath)), c = R.useRef(!1);
  return wn(() => {
    c.current = !0;
  }), R.useCallback(function(g, v) {
    if (v === void 0 && (v = {}), !c.current) return;
    if (typeof g == "number") {
      n.go(g);
      return;
    }
    let h = kt(g, JSON.parse(l), a, v.relative === "path");
    e == null && t !== "/" && (h.pathname = h.pathname === "/" ? t : Je([t, h.pathname])), (v.replace ? n.replace : n.push)(h, v.state, v);
  }, [t, n, l, a, e]);
}
const Rn = /* @__PURE__ */ R.createContext(null);
function Ta() {
  return R.useContext(Rn);
}
function Sn(e) {
  let t = R.useContext(He).outlet;
  return t && /* @__PURE__ */ R.createElement(Rn.Provider, {
    value: e
  }, t);
}
function Aa() {
  let {
    matches: e
  } = R.useContext(He), t = e[e.length - 1];
  return t ? t.params : {};
}
function Pn(e, t) {
  let {
    relative: r
  } = t === void 0 ? {} : t, {
    future: n
  } = R.useContext(dt), {
    matches: o
  } = R.useContext(He), {
    pathname: a
  } = Lt(), l = JSON.stringify(It(o, n.v7_relativeSplatPath));
  return R.useMemo(() => kt(e, JSON.parse(l), a, r === "path"), [e, l, a, r]);
}
function xn(e, t) {
  return Rr(e, t);
}
function Rr(e, t, r, n) {
  ft() || W(!1);
  let {
    navigator: o
  } = R.useContext(dt), {
    matches: a
  } = R.useContext(He), l = a[a.length - 1], c = l ? l.params : {};
  l && l.pathname;
  let i = l ? l.pathnameBase : "/";
  l && l.route;
  let g = Lt(), v;
  if (t) {
    var h;
    let C = typeof t == "string" ? Oe(t) : t;
    i === "/" || (h = C.pathname) != null && h.startsWith(i) || W(!1), v = C;
  } else
    v = g;
  let x = v.pathname || "/", f = x;
  if (i !== "/") {
    let C = i.replace(/^\//, "").split("/");
    f = "/" + x.replace(/^\//, "").split("/").slice(C.length).join("/");
  }
  let S = Ie(e, {
    pathname: f
  }), P = Dn(S && S.map((C) => Object.assign({}, C, {
    params: Object.assign({}, c, C.params),
    pathname: Je([
      i,
      // Re-encode pathnames that were decoded inside matchRoutes
      o.encodeLocation ? o.encodeLocation(C.pathname).pathname : C.pathname
    ]),
    pathnameBase: C.pathnameBase === "/" ? i : Je([
      i,
      // Re-encode pathnames that were decoded inside matchRoutes
      o.encodeLocation ? o.encodeLocation(C.pathnameBase).pathname : C.pathnameBase
    ])
  })), a, r, n);
  return t && P ? /* @__PURE__ */ R.createElement(Ct.Provider, {
    value: {
      location: ct({
        pathname: "/",
        search: "",
        hash: "",
        state: null,
        key: "default"
      }, v),
      navigationType: ue.Pop
    }
  }, P) : P;
}
function Ma() {
  let e = Ln(), t = qe(e) ? e.status + " " + e.statusText : e instanceof Error ? e.message : JSON.stringify(e), r = e instanceof Error ? e.stack : null, o = {
    padding: "0.5rem",
    backgroundColor: "rgba(200,200,200, 0.5)"
  };
  return /* @__PURE__ */ R.createElement(R.Fragment, null, /* @__PURE__ */ R.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ R.createElement("h3", {
    style: {
      fontStyle: "italic"
    }
  }, t), r ? /* @__PURE__ */ R.createElement("pre", {
    style: o
  }, r) : null, null);
}
const Ia = /* @__PURE__ */ R.createElement(Ma, null);
class ka extends R.Component {
  constructor(t) {
    super(t), this.state = {
      location: t.location,
      revalidation: t.revalidation,
      error: t.error
    };
  }
  static getDerivedStateFromError(t) {
    return {
      error: t
    };
  }
  static getDerivedStateFromProps(t, r) {
    return r.location !== t.location || r.revalidation !== "idle" && t.revalidation === "idle" ? {
      error: t.error,
      location: t.location,
      revalidation: t.revalidation
    } : {
      error: t.error !== void 0 ? t.error : r.error,
      location: r.location,
      revalidation: t.revalidation || r.revalidation
    };
  }
  componentDidCatch(t, r) {
    console.error("React Router caught the following error during render", t, r);
  }
  render() {
    return this.state.error !== void 0 ? /* @__PURE__ */ R.createElement(He.Provider, {
      value: this.props.routeContext
    }, /* @__PURE__ */ R.createElement(bn.Provider, {
      value: this.state.error,
      children: this.props.component
    })) : this.props.children;
  }
}
function Ba(e) {
  let {
    routeContext: t,
    match: r,
    children: n
  } = e, o = R.useContext(Bt);
  return o && o.static && o.staticContext && (r.route.errorElement || r.route.ErrorBoundary) && (o.staticContext._deepestRenderedBoundaryId = r.route.id), /* @__PURE__ */ R.createElement(He.Provider, {
    value: t
  }, n);
}
function Dn(e, t, r, n) {
  var o;
  if (t === void 0 && (t = []), r === void 0 && (r = null), n === void 0 && (n = null), e == null) {
    var a;
    if (!r)
      return null;
    if (r.errors)
      e = r.matches;
    else if ((a = n) != null && a.v7_partialHydration && t.length === 0 && !r.initialized && r.matches.length > 0)
      e = r.matches;
    else
      return null;
  }
  let l = e, c = (o = r) == null ? void 0 : o.errors;
  if (c != null) {
    let v = l.findIndex((h) => h.route.id && (c == null ? void 0 : c[h.route.id]) !== void 0);
    v >= 0 || W(!1), l = l.slice(0, Math.min(l.length, v + 1));
  }
  let i = !1, g = -1;
  if (r && n && n.v7_partialHydration)
    for (let v = 0; v < l.length; v++) {
      let h = l[v];
      if ((h.route.HydrateFallback || h.route.hydrateFallbackElement) && (g = v), h.route.id) {
        let {
          loaderData: x,
          errors: f
        } = r, S = h.route.loader && x[h.route.id] === void 0 && (!f || f[h.route.id] === void 0);
        if (h.route.lazy || S) {
          i = !0, g >= 0 ? l = l.slice(0, g + 1) : l = [l[0]];
          break;
        }
      }
    }
  return l.reduceRight((v, h, x) => {
    let f, S = !1, P = null, C = null;
    r && (f = c && h.route.id ? c[h.route.id] : void 0, P = h.route.errorElement || Ia, i && (g < 0 && x === 0 ? (qa("route-fallback"), S = !0, C = null) : g === x && (S = !0, C = h.route.hydrateFallbackElement || null)));
    let V = t.concat(l.slice(0, x + 1)), N = () => {
      let z;
      return f ? z = P : S ? z = C : h.route.Component ? z = /* @__PURE__ */ R.createElement(h.route.Component, null) : h.route.element ? z = h.route.element : z = v, /* @__PURE__ */ R.createElement(Ba, {
        match: h,
        routeContext: {
          outlet: v,
          matches: V,
          isDataRoute: r != null
        },
        children: z
      });
    };
    return r && (h.route.ErrorBoundary || h.route.errorElement || x === 0) ? /* @__PURE__ */ R.createElement(ka, {
      location: r.location,
      revalidation: r.revalidation,
      component: P,
      error: f,
      children: N(),
      routeContext: {
        outlet: null,
        matches: V,
        isDataRoute: !0
      }
    }) : N();
  }, null);
}
var Cn = /* @__PURE__ */ function(e) {
  return e.UseBlocker = "useBlocker", e.UseRevalidator = "useRevalidator", e.UseNavigateStable = "useNavigate", e;
}(Cn || {}), _e = /* @__PURE__ */ function(e) {
  return e.UseBlocker = "useBlocker", e.UseLoaderData = "useLoaderData", e.UseActionData = "useActionData", e.UseRouteError = "useRouteError", e.UseNavigation = "useNavigation", e.UseRouteLoaderData = "useRouteLoaderData", e.UseMatches = "useMatches", e.UseRevalidator = "useRevalidator", e.UseNavigateStable = "useNavigate", e.UseRouteId = "useRouteId", e;
}(_e || {});
function Sr(e) {
  let t = R.useContext(Bt);
  return t || W(!1), t;
}
function ht(e) {
  let t = R.useContext(Er);
  return t || W(!1), t;
}
function Ha(e) {
  let t = R.useContext(He);
  return t || W(!1), t;
}
function Ht(e) {
  let t = Ha(), r = t.matches[t.matches.length - 1];
  return r.route.id || W(!1), r.route.id;
}
function za() {
  return Ht(_e.UseRouteId);
}
function Wa() {
  return ht(_e.UseNavigation).navigation;
}
function Ka() {
  let e = Sr(), t = ht(_e.UseRevalidator);
  return R.useMemo(() => ({
    revalidate: e.router.revalidate,
    state: t.revalidation
  }), [e.router.revalidate, t.revalidation]);
}
function Va() {
  let {
    matches: e,
    loaderData: t
  } = ht(_e.UseMatches);
  return R.useMemo(() => e.map((r) => mr(r, t)), [e, t]);
}
function $a() {
  let e = ht(_e.UseLoaderData), t = Ht(_e.UseLoaderData);
  if (e.errors && e.errors[t] != null) {
    console.error("You cannot `useLoaderData` in an errorElement (routeId: " + t + ")");
    return;
  }
  return e.loaderData[t];
}
function Ja(e) {
  return ht(_e.UseRouteLoaderData).loaderData[e];
}
function Ya() {
  let e = ht(_e.UseActionData), t = Ht(_e.UseLoaderData);
  return e.actionData ? e.actionData[t] : void 0;
}
function Ln() {
  var e;
  let t = R.useContext(bn), r = ht(_e.UseRouteError), n = Ht(_e.UseRouteError);
  return t !== void 0 ? t : (e = r.errors) == null ? void 0 : e[n];
}
function _n() {
  let e = R.useContext(er);
  return e == null ? void 0 : e._data;
}
function Ga() {
  let e = R.useContext(er);
  return e == null ? void 0 : e._error;
}
let Xa = 0;
function Qa(e) {
  let {
    router: t,
    basename: r
  } = Sr(Cn.UseBlocker), n = ht(_e.UseBlocker), [o, a] = R.useState(""), l = R.useCallback((c) => {
    if (typeof e != "function")
      return !!e;
    if (r === "/")
      return e(c);
    let {
      currentLocation: i,
      nextLocation: g,
      historyAction: v
    } = c;
    return e({
      currentLocation: ct({}, i, {
        pathname: ut(i.pathname, r) || i.pathname
      }),
      nextLocation: ct({}, g, {
        pathname: ut(g.pathname, r) || g.pathname
      }),
      historyAction: v
    });
  }, [r, e]);
  return R.useEffect(() => {
    let c = String(++Xa);
    return a(c), () => t.deleteBlocker(c);
  }, [t]), R.useEffect(() => {
    o !== "" && t.getBlocker(o, l);
  }, [t, o, l]), o && n.blockers.has(o) ? n.blockers.get(o) : mt;
}
function Za() {
  let {
    router: e
  } = Sr(), t = Ht(_e.UseNavigateStable), r = R.useRef(!1);
  return wn(() => {
    r.current = !0;
  }), R.useCallback(function(o, a) {
    a === void 0 && (a = {}), r.current && (typeof o == "number" ? e.navigate(o) : e.navigate(o, ct({
      fromRouteId: t
    }, a)));
  }, [e, t]);
}
const zr = {};
function qa(e, t, r) {
  zr[e] || (zr[e] = !0);
}
function Pr(e, t) {
  e == null || e.v7_startTransition, (e == null ? void 0 : e.v7_relativeSplatPath) === void 0 && (!t || t.v7_relativeSplatPath), t && (t.v7_fetcherPersist, t.v7_normalizeFormMethod, t.v7_partialHydration, t.v7_skipActionErrorRevalidation);
}
const eo = "startTransition", tr = Tn[eo];
function to(e) {
  let {
    fallbackElement: t,
    router: r,
    future: n
  } = e, [o, a] = R.useState(r.state), {
    v7_startTransition: l
  } = n || {}, c = R.useCallback((h) => {
    l && tr ? tr(() => a(h)) : a(h);
  }, [a, l]);
  R.useLayoutEffect(() => r.subscribe(c), [r, c]), R.useEffect(() => {
  }, []);
  let i = R.useMemo(() => ({
    createHref: r.createHref,
    encodeLocation: r.encodeLocation,
    go: (h) => r.navigate(h),
    push: (h, x, f) => r.navigate(h, {
      state: x,
      preventScrollReset: f == null ? void 0 : f.preventScrollReset
    }),
    replace: (h, x, f) => r.navigate(h, {
      replace: !0,
      state: x,
      preventScrollReset: f == null ? void 0 : f.preventScrollReset
    })
  }), [r]), g = r.basename || "/", v = R.useMemo(() => ({
    router: r,
    navigator: i,
    static: !1,
    basename: g
  }), [r, i, g]);
  return R.useEffect(() => Pr(n, r.future), [r, n]), /* @__PURE__ */ R.createElement(R.Fragment, null, /* @__PURE__ */ R.createElement(Bt.Provider, {
    value: v
  }, /* @__PURE__ */ R.createElement(Er.Provider, {
    value: o
  }, /* @__PURE__ */ R.createElement(xr, {
    basename: g,
    location: o.location,
    navigationType: o.historyAction,
    navigator: i,
    future: {
      v7_relativeSplatPath: r.future.v7_relativeSplatPath
    }
  }, o.initialized || r.future.v7_partialHydration ? /* @__PURE__ */ R.createElement(ro, {
    routes: r.routes,
    future: r.future,
    state: o
  }) : t))), null);
}
function ro(e) {
  let {
    routes: t,
    future: r,
    state: n
  } = e;
  return Rr(t, void 0, n, r);
}
function no(e) {
  let {
    basename: t,
    children: r,
    initialEntries: n,
    initialIndex: o,
    future: a
  } = e, l = R.useRef();
  l.current == null && (l.current = pr({
    initialEntries: n,
    initialIndex: o,
    v5Compat: !0
  }));
  let c = l.current, [i, g] = R.useState({
    action: c.action,
    location: c.location
  }), {
    v7_startTransition: v
  } = a || {}, h = R.useCallback((x) => {
    v && tr ? tr(() => g(x)) : g(x);
  }, [g, v]);
  return R.useLayoutEffect(() => c.listen(h), [c, h]), R.useEffect(() => Pr(a), [a]), /* @__PURE__ */ R.createElement(xr, {
    basename: t,
    children: r,
    location: i.location,
    navigationType: i.action,
    navigator: c,
    future: a
  });
}
function ao(e) {
  let {
    to: t,
    replace: r,
    state: n,
    relative: o
  } = e;
  ft() || W(!1);
  let {
    future: a,
    static: l
  } = R.useContext(dt), {
    matches: c
  } = R.useContext(He), {
    pathname: i
  } = Lt(), g = En(), v = kt(t, It(c, a.v7_relativeSplatPath), i, o === "path"), h = JSON.stringify(v);
  return R.useEffect(() => g(JSON.parse(h), {
    replace: r,
    state: n,
    relative: o
  }), [g, h, o, r, n]), null;
}
function oo(e) {
  return Sn(e.context);
}
function On(e) {
  W(!1);
}
function xr(e) {
  let {
    basename: t = "/",
    children: r = null,
    location: n,
    navigationType: o = ue.Pop,
    navigator: a,
    static: l = !1,
    future: c
  } = e;
  ft() && W(!1);
  let i = t.replace(/^\/*/, "/"), g = R.useMemo(() => ({
    basename: i,
    navigator: a,
    static: l,
    future: ct({
      v7_relativeSplatPath: !1
    }, c)
  }), [i, c, a, l]);
  typeof n == "string" && (n = Oe(n));
  let {
    pathname: v = "/",
    search: h = "",
    hash: x = "",
    state: f = null,
    key: S = "default"
  } = n, P = R.useMemo(() => {
    let C = ut(v, i);
    return C == null ? null : {
      location: {
        pathname: C,
        search: h,
        hash: x,
        state: f,
        key: S
      },
      navigationType: o
    };
  }, [i, v, h, x, f, S, o]);
  return P == null ? null : /* @__PURE__ */ R.createElement(dt.Provider, {
    value: g
  }, /* @__PURE__ */ R.createElement(Ct.Provider, {
    children: r,
    value: P
  }));
}
function io(e) {
  let {
    children: t,
    location: r
  } = e;
  return xn(Mt(t), r);
}
function lo(e) {
  let {
    children: t,
    errorElement: r,
    resolve: n
  } = e;
  return /* @__PURE__ */ R.createElement(uo, {
    resolve: n,
    errorElement: r
  }, /* @__PURE__ */ R.createElement(co, null, t));
}
var Fe = /* @__PURE__ */ function(e) {
  return e[e.pending = 0] = "pending", e[e.success = 1] = "success", e[e.error = 2] = "error", e;
}(Fe || {});
const so = new Promise(() => {
});
class uo extends R.Component {
  constructor(t) {
    super(t), this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(t) {
    return {
      error: t
    };
  }
  componentDidCatch(t, r) {
    console.error("<Await> caught the following error during render", t, r);
  }
  render() {
    let {
      children: t,
      errorElement: r,
      resolve: n
    } = this.props, o = null, a = Fe.pending;
    if (!(n instanceof Promise))
      a = Fe.success, o = Promise.resolve(), Object.defineProperty(o, "_tracked", {
        get: () => !0
      }), Object.defineProperty(o, "_data", {
        get: () => n
      });
    else if (this.state.error) {
      a = Fe.error;
      let l = this.state.error;
      o = Promise.reject().catch(() => {
      }), Object.defineProperty(o, "_tracked", {
        get: () => !0
      }), Object.defineProperty(o, "_error", {
        get: () => l
      });
    } else n._tracked ? (o = n, a = "_error" in o ? Fe.error : "_data" in o ? Fe.success : Fe.pending) : (a = Fe.pending, Object.defineProperty(n, "_tracked", {
      get: () => !0
    }), o = n.then((l) => Object.defineProperty(n, "_data", {
      get: () => l
    }), (l) => Object.defineProperty(n, "_error", {
      get: () => l
    })));
    if (a === Fe.error && o._error instanceof At)
      throw so;
    if (a === Fe.error && !r)
      throw o._error;
    if (a === Fe.error)
      return /* @__PURE__ */ R.createElement(er.Provider, {
        value: o,
        children: r
      });
    if (a === Fe.success)
      return /* @__PURE__ */ R.createElement(er.Provider, {
        value: o,
        children: t
      });
    throw o;
  }
}
function co(e) {
  let {
    children: t
  } = e, r = _n(), n = typeof t == "function" ? t(r) : t;
  return /* @__PURE__ */ R.createElement(R.Fragment, null, n);
}
function Mt(e, t) {
  t === void 0 && (t = []);
  let r = [];
  return R.Children.forEach(e, (n, o) => {
    if (!/* @__PURE__ */ R.isValidElement(n))
      return;
    let a = [...t, o];
    if (n.type === R.Fragment) {
      r.push.apply(r, Mt(n.props.children, a));
      return;
    }
    n.type !== On && W(!1), !n.props.index || !n.props.children || W(!1);
    let l = {
      id: n.props.id || a.join("-"),
      caseSensitive: n.props.caseSensitive,
      element: n.props.element,
      Component: n.props.Component,
      index: n.props.index,
      path: n.props.path,
      loader: n.props.loader,
      action: n.props.action,
      errorElement: n.props.errorElement,
      ErrorBoundary: n.props.ErrorBoundary,
      hasErrorBoundary: n.props.ErrorBoundary != null || n.props.errorElement != null,
      shouldRevalidate: n.props.shouldRevalidate,
      handle: n.props.handle,
      lazy: n.props.lazy
    };
    n.props.children && (l.children = Mt(n.props.children, a)), r.push(l);
  }), r;
}
function fo(e) {
  return Dn(e);
}
function Un(e) {
  let t = {
    // Note: this check also occurs in createRoutesFromChildren so update
    // there if you change this -- please and thank you!
    hasErrorBoundary: e.ErrorBoundary != null || e.errorElement != null
  };
  return e.Component && Object.assign(t, {
    element: /* @__PURE__ */ R.createElement(e.Component),
    Component: void 0
  }), e.HydrateFallback && Object.assign(t, {
    hydrateFallbackElement: /* @__PURE__ */ R.createElement(e.HydrateFallback),
    HydrateFallback: void 0
  }), e.ErrorBoundary && Object.assign(t, {
    errorElement: /* @__PURE__ */ R.createElement(e.ErrorBoundary),
    ErrorBoundary: void 0
  }), t;
}
function ho(e, t) {
  return ln({
    basename: t == null ? void 0 : t.basename,
    future: ct({}, t == null ? void 0 : t.future, {
      v7_prependBasename: !0
    }),
    history: pr({
      initialEntries: t == null ? void 0 : t.initialEntries,
      initialIndex: t == null ? void 0 : t.initialIndex
    }),
    hydrationData: t == null ? void 0 : t.hydrationData,
    routes: e,
    mapRouteProperties: Un,
    dataStrategy: t == null ? void 0 : t.dataStrategy,
    patchRoutesOnNavigation: t == null ? void 0 : t.patchRoutesOnNavigation
  }).initialize();
}
const po = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AbortedDeferredError: At,
  Await: lo,
  MemoryRouter: no,
  Navigate: ao,
  get NavigationType() {
    return ue;
  },
  Outlet: oo,
  Route: On,
  Router: xr,
  RouterProvider: to,
  Routes: io,
  UNSAFE_DataRouterContext: Bt,
  UNSAFE_DataRouterStateContext: Er,
  UNSAFE_LocationContext: Ct,
  UNSAFE_NavigationContext: dt,
  UNSAFE_RouteContext: He,
  UNSAFE_logV6DeprecationWarnings: Pr,
  UNSAFE_mapRouteProperties: Un,
  UNSAFE_useRouteId: za,
  UNSAFE_useRoutesImpl: Rr,
  createMemoryRouter: ho,
  createPath: Be,
  createRoutesFromChildren: Mt,
  createRoutesFromElements: Mt,
  defer: qr,
  generatePath: Yr,
  isRouteErrorResponse: qe,
  json: Qr,
  matchPath: Tt,
  matchRoutes: Ie,
  parsePath: Oe,
  redirect: rr,
  redirectDocument: en,
  renderMatches: fo,
  replace: tn,
  resolvePath: gr,
  useActionData: Ya,
  useAsyncError: Ga,
  useAsyncValue: _n,
  useBlocker: Qa,
  useHref: Ua,
  useInRouterContext: ft,
  useLoaderData: $a,
  useLocation: Lt,
  useMatch: Na,
  useMatches: Va,
  useNavigate: En,
  useNavigation: Wa,
  useNavigationType: ja,
  useOutlet: Sn,
  useOutletContext: Ta,
  useParams: Aa,
  useResolvedPath: Pn,
  useRevalidator: Ka,
  useRouteError: Ln,
  useRouteLoaderData: Ja,
  useRoutes: xn
}, Symbol.toStringTag, { value: "Module" })), mo = /* @__PURE__ */ Wr(po), vo = /* @__PURE__ */ Wr(Oa);
/**
 * React Router DOM v6.30.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
(function(e, t) {
  (function(r, n) {
    n(t, R, In, mo, vo);
  })(An, function(r, n, o, a, l) {
    function c(m) {
      if (m && m.__esModule) return m;
      var b = /* @__PURE__ */ Object.create(null);
      return m && Object.keys(m).forEach(function(y) {
        if (y !== "default") {
          var w = Object.getOwnPropertyDescriptor(m, y);
          Object.defineProperty(b, y, w.get ? w : { enumerable: !0, get: function() {
            return m[y];
          } });
        }
      }), b.default = m, Object.freeze(b);
    }
    var i = c(n), g = c(o);
    function v() {
      return v = Object.assign ? Object.assign.bind() : function(m) {
        for (var b = 1; b < arguments.length; b++) {
          var y = arguments[b];
          for (var w in y) Object.prototype.hasOwnProperty.call(y, w) && (m[w] = y[w]);
        }
        return m;
      }, v.apply(this, arguments);
    }
    function h(m, b) {
      if (m == null) return {};
      var y, w, D = {}, A = Object.keys(m);
      for (w = 0; w < A.length; w++) y = A[w], b.indexOf(y) >= 0 || (D[y] = m[y]);
      return D;
    }
    const x = "get", f = "application/x-www-form-urlencoded";
    function S(m) {
      return m != null && typeof m.tagName == "string";
    }
    function P(m) {
      return m === void 0 && (m = ""), new URLSearchParams(typeof m == "string" || Array.isArray(m) || m instanceof URLSearchParams ? m : Object.keys(m).reduce((b, y) => {
        let w = m[y];
        return b.concat(Array.isArray(w) ? w.map((D) => [y, D]) : [[y, w]]);
      }, []));
    }
    let C = null;
    const V = /* @__PURE__ */ new Set(["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]);
    function N(m) {
      return m == null || V.has(m) ? m : null;
    }
    function z(m, b) {
      let y, w, D, A, U;
      if (S(H = m) && H.tagName.toLowerCase() === "form") {
        let j = m.getAttribute("action");
        w = j ? l.stripBasename(j, b) : null, y = m.getAttribute("method") || x, D = N(m.getAttribute("enctype")) || f, A = new FormData(m);
      } else if (function(j) {
        return S(j) && j.tagName.toLowerCase() === "button";
      }(m) || function(j) {
        return S(j) && j.tagName.toLowerCase() === "input";
      }(m) && (m.type === "submit" || m.type === "image")) {
        let j = m.form;
        if (j == null) throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');
        let _ = m.getAttribute("formaction") || j.getAttribute("action");
        if (w = _ ? l.stripBasename(_, b) : null, y = m.getAttribute("formmethod") || j.getAttribute("method") || x, D = N(m.getAttribute("formenctype")) || N(j.getAttribute("enctype")) || f, A = new FormData(j, m), !function() {
          if (C === null) try {
            new FormData(document.createElement("form"), 0), C = !1;
          } catch {
            C = !0;
          }
          return C;
        }()) {
          let { name: F, type: Y, value: G } = m;
          if (Y === "image") {
            let Q = F ? F + "." : "";
            A.append(Q + "x", "0"), A.append(Q + "y", "0");
          } else F && A.append(F, G);
        }
      } else {
        if (S(m)) throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
        y = x, w = null, D = f, U = m;
      }
      var H;
      return A && D === "text/plain" && (U = A, A = void 0), { action: w, method: y.toLowerCase(), encType: D, formData: A, body: U };
    }
    const O = ["onClick", "relative", "reloadDocument", "replace", "state", "target", "to", "preventScrollReset", "viewTransition"], re = ["aria-current", "caseSensitive", "className", "end", "style", "to", "viewTransition", "children"], le = ["fetcherKey", "navigate", "reloadDocument", "replace", "state", "method", "action", "onSubmit", "relative", "preventScrollReset", "viewTransition"];
    try {
      window.__reactRouterVersion = "6";
    } catch {
    }
    function d() {
      var m;
      let b = (m = window) == null ? void 0 : m.__staticRouterHydrationData;
      return b && b.errors && (b = v({}, b, { errors: J(b.errors) })), b;
    }
    function J(m) {
      if (!m) return null;
      let b = Object.entries(m), y = {};
      for (let [w, D] of b) if (D && D.__type === "RouteErrorResponse") y[w] = new l.UNSAFE_ErrorResponseImpl(D.status, D.statusText, D.data, D.internal === !0);
      else if (D && D.__type === "Error") {
        if (D.__subType) {
          let A = window[D.__subType];
          if (typeof A == "function") try {
            let U = new A(D.message);
            U.stack = "", y[w] = U;
          } catch {
          }
        }
        if (y[w] == null) {
          let A = new Error(D.message);
          A.stack = "", y[w] = A;
        }
      } else y[w] = D;
      return y;
    }
    const ie = i.createContext({ isTransitioning: !1 }), Z = i.createContext(/* @__PURE__ */ new Map()), ne = i.startTransition, we = g.flushSync, Le = i.useId;
    function Ue(m) {
      we ? we(m) : m();
    }
    class Ye {
      constructor() {
        this.status = "pending", this.promise = new Promise((b, y) => {
          this.resolve = (w) => {
            this.status === "pending" && (this.status = "resolved", b(w));
          }, this.reject = (w) => {
            this.status === "pending" && (this.status = "rejected", y(w));
          };
        });
      }
    }
    const gt = i.memo(yt);
    function yt(m) {
      let { routes: b, future: y, state: w } = m;
      return a.UNSAFE_useRoutesImpl(b, void 0, w, y);
    }
    const ge = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, bt = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i, et = i.forwardRef(function(m, b) {
      let y, { onClick: w, relative: D, reloadDocument: A, replace: U, state: H, target: j, to: _, preventScrollReset: F, viewTransition: Y } = m, G = h(m, O), { basename: Q } = i.useContext(a.UNSAFE_NavigationContext), de = !1;
      if (typeof _ == "string" && bt.test(_) && (y = _, ge)) try {
        let $ = new URL(window.location.href), se = _.startsWith("//") ? new URL($.protocol + _) : new URL(_), pe = l.stripBasename(se.pathname, Q);
        se.origin === $.origin && pe != null ? _ = pe + se.search + se.hash : de = !0;
      } catch {
      }
      let Ee = a.useHref(_, { relative: D }), xe = We(_, { replace: U, state: H, target: j, preventScrollReset: F, relative: D, viewTransition: Y });
      return i.createElement("a", v({}, G, { href: y || Ee, onClick: de || A ? w : function($) {
        w && w($), $.defaultPrevented || xe($);
      }, ref: b, target: j }));
    }), tt = i.forwardRef(function(m, b) {
      let { "aria-current": y = "page", caseSensitive: w = !1, className: D = "", end: A = !1, style: U, to: H, viewTransition: j, children: _ } = m, F = h(m, re), Y = a.useResolvedPath(H, { relative: F.relative }), G = a.useLocation(), Q = i.useContext(a.UNSAFE_DataRouterStateContext), { navigator: de, basename: Ee } = i.useContext(a.UNSAFE_NavigationContext), xe = Q != null && Kt(Y) && j === !0, $ = de.encodeLocation ? de.encodeLocation(Y).pathname : Y.pathname, se = G.pathname, pe = Q && Q.navigation && Q.navigation.location ? Q.navigation.location.pathname : null;
      w || (se = se.toLowerCase(), pe = pe ? pe.toLowerCase() : null, $ = $.toLowerCase()), pe && Ee && (pe = l.stripBasename(pe, Ee) || pe);
      const rt = $ !== "/" && $.endsWith("/") ? $.length - 1 : $.length;
      let nt, at = se === $ || !A && se.startsWith($) && se.charAt(rt) === "/", Ge = pe != null && (pe === $ || !A && pe.startsWith($) && pe.charAt($.length) === "/"), fe = { isActive: at, isPending: Ge, isTransitioning: xe }, De = at ? y : void 0;
      nt = typeof D == "function" ? D(fe) : [D, at ? "active" : null, Ge ? "pending" : null, xe ? "transitioning" : null].filter(Boolean).join(" ");
      let Ce = typeof U == "function" ? U(fe) : U;
      return i.createElement(et, v({}, F, { "aria-current": De, className: nt, ref: b, style: Ce, to: H, viewTransition: j }), typeof _ == "function" ? _(fe) : _);
    }), je = i.forwardRef((m, b) => {
      let { fetcherKey: y, navigate: w, reloadDocument: D, replace: A, state: U, method: H = x, action: j, onSubmit: _, relative: F, preventScrollReset: Y, viewTransition: G } = m, Q = h(m, le), de = _t(), Ee = Wt(j, { relative: F }), xe = H.toLowerCase() === "get" ? "get" : "post";
      return i.createElement("form", v({ ref: b, method: xe, action: Ee, onSubmit: D ? _ : ($) => {
        if (_ && _($), $.defaultPrevented) return;
        $.preventDefault();
        let se = $.nativeEvent.submitter, pe = (se == null ? void 0 : se.getAttribute("formmethod")) || H;
        de(se || $.currentTarget, { fetcherKey: y, method: pe, navigate: w, replace: A, state: U, relative: F, preventScrollReset: Y, viewTransition: G });
      } }, Q));
    });
    var Ne = function(m) {
      return m.UseScrollRestoration = "useScrollRestoration", m.UseSubmit = "useSubmit", m.UseSubmitFetcher = "useSubmitFetcher", m.UseFetcher = "useFetcher", m.useViewTransitionState = "useViewTransitionState", m;
    }(Ne || {}), ze = function(m) {
      return m.UseFetcher = "useFetcher", m.UseFetchers = "useFetchers", m.UseScrollRestoration = "useScrollRestoration", m;
    }(ze || {});
    function Pe(m) {
      let b = i.useContext(a.UNSAFE_DataRouterContext);
      return b || l.UNSAFE_invariant(!1), b;
    }
    function Ae(m) {
      let b = i.useContext(a.UNSAFE_DataRouterStateContext);
      return b || l.UNSAFE_invariant(!1), b;
    }
    function We(m, b) {
      let { target: y, replace: w, state: D, preventScrollReset: A, relative: U, viewTransition: H } = b === void 0 ? {} : b, j = a.useNavigate(), _ = a.useLocation(), F = a.useResolvedPath(m, { relative: U });
      return i.useCallback((Y) => {
        if (function(G, Q) {
          return !(G.button !== 0 || Q && Q !== "_self" || function(de) {
            return !!(de.metaKey || de.altKey || de.ctrlKey || de.shiftKey);
          }(G));
        }(Y, y)) {
          Y.preventDefault();
          let G = w !== void 0 ? w : a.createPath(_) === a.createPath(F);
          j(m, { replace: G, state: D, preventScrollReset: A, relative: U, viewTransition: H });
        }
      }, [_, j, F, w, D, y, m, A, U, H]);
    }
    let wt = 0, zt = () => "__" + String(++wt) + "__";
    function _t() {
      let { router: m } = Pe(Ne.UseSubmit), { basename: b } = i.useContext(a.UNSAFE_NavigationContext), y = a.UNSAFE_useRouteId();
      return i.useCallback(function(w, D) {
        D === void 0 && (D = {}), function() {
          if (typeof document > "u") throw new Error("You are calling submit during the server render. Try calling submit within a `useEffect` or callback instead.");
        }();
        let { action: A, method: U, encType: H, formData: j, body: _ } = z(w, b);
        if (D.navigate === !1) {
          let F = D.fetcherKey || zt();
          m.fetch(F, y, D.action || A, { preventScrollReset: D.preventScrollReset, formData: j, body: _, formMethod: D.method || U, formEncType: D.encType || H, flushSync: D.flushSync });
        } else m.navigate(D.action || A, { preventScrollReset: D.preventScrollReset, formData: j, body: _, formMethod: D.method || U, formEncType: D.encType || H, replace: D.replace, state: D.state, fromRouteId: y, flushSync: D.flushSync, viewTransition: D.viewTransition });
      }, [m, b, y]);
    }
    function Wt(m, b) {
      let { relative: y } = b === void 0 ? {} : b, { basename: w } = i.useContext(a.UNSAFE_NavigationContext), D = i.useContext(a.UNSAFE_RouteContext);
      D || l.UNSAFE_invariant(!1);
      let [A] = D.matches.slice(-1), U = v({}, a.useResolvedPath(m || ".", { relative: y })), H = a.useLocation();
      if (m == null) {
        U.search = H.search;
        let j = new URLSearchParams(U.search), _ = j.getAll("index");
        if (_.some((F) => F === "")) {
          j.delete("index"), _.filter((Y) => Y).forEach((Y) => j.append("index", Y));
          let F = j.toString();
          U.search = F ? "?" + F : "";
        }
      }
      return m && m !== "." || !A.route.index || (U.search = U.search ? U.search.replace(/^\?/, "?index&") : "?index"), w !== "/" && (U.pathname = U.pathname === "/" ? w : l.joinPaths([w, U.pathname])), a.createPath(U);
    }
    const be = "react-router-scroll-positions";
    let Me = {};
    function Ot(m) {
      let { getKey: b, storageKey: y } = m === void 0 ? {} : m, { router: w } = Pe(Ne.UseScrollRestoration), { restoreScrollPosition: D, preventScrollReset: A } = Ae(ze.UseScrollRestoration), { basename: U } = i.useContext(a.UNSAFE_NavigationContext), H = a.useLocation(), j = a.useMatches(), _ = a.useNavigation();
      i.useEffect(() => (window.history.scrollRestoration = "manual", () => {
        window.history.scrollRestoration = "auto";
      }), []), function(F, Y) {
        let { capture: G } = {};
        i.useEffect(() => {
          let Q = G != null ? { capture: G } : void 0;
          return window.addEventListener("pagehide", F, Q), () => {
            window.removeEventListener("pagehide", F, Q);
          };
        }, [F, G]);
      }(i.useCallback(() => {
        if (_.state === "idle") {
          let F = (b ? b(H, j) : null) || H.key;
          Me[F] = window.scrollY;
        }
        try {
          sessionStorage.setItem(y || be, JSON.stringify(Me));
        } catch {
        }
        window.history.scrollRestoration = "auto";
      }, [y, b, _.state, H, j])), typeof document < "u" && (i.useLayoutEffect(() => {
        try {
          let F = sessionStorage.getItem(y || be);
          F && (Me = JSON.parse(F));
        } catch {
        }
      }, [y]), i.useLayoutEffect(() => {
        let F = b && U !== "/" ? (G, Q) => b(v({}, G, { pathname: l.stripBasename(G.pathname, U) || G.pathname }), Q) : b, Y = w == null ? void 0 : w.enableScrollRestoration(Me, () => window.scrollY, F);
        return () => Y && Y();
      }, [w, U, b]), i.useLayoutEffect(() => {
        if (D !== !1) if (typeof D != "number") {
          if (H.hash) {
            let F = document.getElementById(decodeURIComponent(H.hash.slice(1)));
            if (F) return void F.scrollIntoView();
          }
          A !== !0 && window.scrollTo(0, 0);
        } else window.scrollTo(0, D);
      }, [H, D, A]));
    }
    function Kt(m, b) {
      b === void 0 && (b = {});
      let y = i.useContext(ie);
      y == null && l.UNSAFE_invariant(!1);
      let { basename: w } = Pe(Ne.useViewTransitionState), D = a.useResolvedPath(m, { relative: b.relative });
      if (!y.isTransitioning) return !1;
      let A = l.stripBasename(y.currentLocation.pathname, w) || y.currentLocation.pathname, U = l.stripBasename(y.nextLocation.pathname, w) || y.nextLocation.pathname;
      return l.matchPath(D.pathname, U) != null || l.matchPath(D.pathname, A) != null;
    }
    Object.defineProperty(r, "AbortedDeferredError", { enumerable: !0, get: function() {
      return a.AbortedDeferredError;
    } }), Object.defineProperty(r, "Await", { enumerable: !0, get: function() {
      return a.Await;
    } }), Object.defineProperty(r, "MemoryRouter", { enumerable: !0, get: function() {
      return a.MemoryRouter;
    } }), Object.defineProperty(r, "Navigate", { enumerable: !0, get: function() {
      return a.Navigate;
    } }), Object.defineProperty(r, "NavigationType", { enumerable: !0, get: function() {
      return a.NavigationType;
    } }), Object.defineProperty(r, "Outlet", { enumerable: !0, get: function() {
      return a.Outlet;
    } }), Object.defineProperty(r, "Route", { enumerable: !0, get: function() {
      return a.Route;
    } }), Object.defineProperty(r, "Router", { enumerable: !0, get: function() {
      return a.Router;
    } }), Object.defineProperty(r, "Routes", { enumerable: !0, get: function() {
      return a.Routes;
    } }), Object.defineProperty(r, "UNSAFE_DataRouterContext", { enumerable: !0, get: function() {
      return a.UNSAFE_DataRouterContext;
    } }), Object.defineProperty(r, "UNSAFE_DataRouterStateContext", { enumerable: !0, get: function() {
      return a.UNSAFE_DataRouterStateContext;
    } }), Object.defineProperty(r, "UNSAFE_LocationContext", { enumerable: !0, get: function() {
      return a.UNSAFE_LocationContext;
    } }), Object.defineProperty(r, "UNSAFE_NavigationContext", { enumerable: !0, get: function() {
      return a.UNSAFE_NavigationContext;
    } }), Object.defineProperty(r, "UNSAFE_RouteContext", { enumerable: !0, get: function() {
      return a.UNSAFE_RouteContext;
    } }), Object.defineProperty(r, "UNSAFE_useRouteId", { enumerable: !0, get: function() {
      return a.UNSAFE_useRouteId;
    } }), Object.defineProperty(r, "createMemoryRouter", { enumerable: !0, get: function() {
      return a.createMemoryRouter;
    } }), Object.defineProperty(r, "createPath", { enumerable: !0, get: function() {
      return a.createPath;
    } }), Object.defineProperty(r, "createRoutesFromChildren", { enumerable: !0, get: function() {
      return a.createRoutesFromChildren;
    } }), Object.defineProperty(r, "createRoutesFromElements", { enumerable: !0, get: function() {
      return a.createRoutesFromElements;
    } }), Object.defineProperty(r, "defer", { enumerable: !0, get: function() {
      return a.defer;
    } }), Object.defineProperty(r, "generatePath", { enumerable: !0, get: function() {
      return a.generatePath;
    } }), Object.defineProperty(r, "isRouteErrorResponse", { enumerable: !0, get: function() {
      return a.isRouteErrorResponse;
    } }), Object.defineProperty(r, "json", { enumerable: !0, get: function() {
      return a.json;
    } }), Object.defineProperty(r, "matchPath", { enumerable: !0, get: function() {
      return a.matchPath;
    } }), Object.defineProperty(r, "matchRoutes", { enumerable: !0, get: function() {
      return a.matchRoutes;
    } }), Object.defineProperty(r, "parsePath", { enumerable: !0, get: function() {
      return a.parsePath;
    } }), Object.defineProperty(r, "redirect", { enumerable: !0, get: function() {
      return a.redirect;
    } }), Object.defineProperty(r, "redirectDocument", { enumerable: !0, get: function() {
      return a.redirectDocument;
    } }), Object.defineProperty(r, "renderMatches", { enumerable: !0, get: function() {
      return a.renderMatches;
    } }), Object.defineProperty(r, "replace", { enumerable: !0, get: function() {
      return a.replace;
    } }), Object.defineProperty(r, "resolvePath", { enumerable: !0, get: function() {
      return a.resolvePath;
    } }), Object.defineProperty(r, "useActionData", { enumerable: !0, get: function() {
      return a.useActionData;
    } }), Object.defineProperty(r, "useAsyncError", { enumerable: !0, get: function() {
      return a.useAsyncError;
    } }), Object.defineProperty(r, "useAsyncValue", { enumerable: !0, get: function() {
      return a.useAsyncValue;
    } }), Object.defineProperty(r, "useBlocker", { enumerable: !0, get: function() {
      return a.useBlocker;
    } }), Object.defineProperty(r, "useHref", { enumerable: !0, get: function() {
      return a.useHref;
    } }), Object.defineProperty(r, "useInRouterContext", { enumerable: !0, get: function() {
      return a.useInRouterContext;
    } }), Object.defineProperty(r, "useLoaderData", { enumerable: !0, get: function() {
      return a.useLoaderData;
    } }), Object.defineProperty(r, "useLocation", { enumerable: !0, get: function() {
      return a.useLocation;
    } }), Object.defineProperty(r, "useMatch", { enumerable: !0, get: function() {
      return a.useMatch;
    } }), Object.defineProperty(r, "useMatches", { enumerable: !0, get: function() {
      return a.useMatches;
    } }), Object.defineProperty(r, "useNavigate", { enumerable: !0, get: function() {
      return a.useNavigate;
    } }), Object.defineProperty(r, "useNavigation", { enumerable: !0, get: function() {
      return a.useNavigation;
    } }), Object.defineProperty(r, "useNavigationType", { enumerable: !0, get: function() {
      return a.useNavigationType;
    } }), Object.defineProperty(r, "useOutlet", { enumerable: !0, get: function() {
      return a.useOutlet;
    } }), Object.defineProperty(r, "useOutletContext", { enumerable: !0, get: function() {
      return a.useOutletContext;
    } }), Object.defineProperty(r, "useParams", { enumerable: !0, get: function() {
      return a.useParams;
    } }), Object.defineProperty(r, "useResolvedPath", { enumerable: !0, get: function() {
      return a.useResolvedPath;
    } }), Object.defineProperty(r, "useRevalidator", { enumerable: !0, get: function() {
      return a.useRevalidator;
    } }), Object.defineProperty(r, "useRouteError", { enumerable: !0, get: function() {
      return a.useRouteError;
    } }), Object.defineProperty(r, "useRouteLoaderData", { enumerable: !0, get: function() {
      return a.useRouteLoaderData;
    } }), Object.defineProperty(r, "useRoutes", { enumerable: !0, get: function() {
      return a.useRoutes;
    } }), Object.defineProperty(r, "UNSAFE_ErrorResponseImpl", { enumerable: !0, get: function() {
      return l.UNSAFE_ErrorResponseImpl;
    } }), r.BrowserRouter = function(m) {
      let { basename: b, children: y, future: w, window: D } = m, A = i.useRef();
      A.current == null && (A.current = l.createBrowserHistory({ window: D, v5Compat: !0 }));
      let U = A.current, [H, j] = i.useState({ action: U.action, location: U.location }), { v7_startTransition: _ } = w || {}, F = i.useCallback((Y) => {
        _ && ne ? ne(() => j(Y)) : j(Y);
      }, [j, _]);
      return i.useLayoutEffect(() => U.listen(F), [U, F]), i.useEffect(() => a.UNSAFE_logV6DeprecationWarnings(w), [w]), i.createElement(a.Router, { basename: b, children: y, location: H.location, navigationType: H.action, navigator: U, future: w });
    }, r.Form = je, r.HashRouter = function(m) {
      let { basename: b, children: y, future: w, window: D } = m, A = i.useRef();
      A.current == null && (A.current = l.createHashHistory({ window: D, v5Compat: !0 }));
      let U = A.current, [H, j] = i.useState({ action: U.action, location: U.location }), { v7_startTransition: _ } = w || {}, F = i.useCallback((Y) => {
        _ && ne ? ne(() => j(Y)) : j(Y);
      }, [j, _]);
      return i.useLayoutEffect(() => U.listen(F), [U, F]), i.useEffect(() => a.UNSAFE_logV6DeprecationWarnings(w), [w]), i.createElement(a.Router, { basename: b, children: y, location: H.location, navigationType: H.action, navigator: U, future: w });
    }, r.Link = et, r.NavLink = tt, r.RouterProvider = function(m) {
      let { fallbackElement: b, router: y, future: w } = m, [D, A] = i.useState(y.state), [U, H] = i.useState(), [j, _] = i.useState({ isTransitioning: !1 }), [F, Y] = i.useState(), [G, Q] = i.useState(), [de, Ee] = i.useState(), xe = i.useRef(/* @__PURE__ */ new Map()), { v7_startTransition: $ } = w || {}, se = i.useCallback((fe) => {
        $ ? function(De) {
          ne ? ne(De) : De();
        }(fe) : fe();
      }, [$]), pe = i.useCallback((fe, De) => {
        let { deletedFetchers: Ce, flushSync: Vt, viewTransitionOpts: Ke } = De;
        fe.fetchers.forEach((Ve, Et) => {
          Ve.data !== void 0 && xe.current.set(Et, Ve.data);
        }), Ce.forEach((Ve) => xe.current.delete(Ve));
        let nr = y.window == null || y.window.document == null || typeof y.window.document.startViewTransition != "function";
        if (Ke && !nr) {
          if (Vt) {
            Ue(() => {
              G && (F && F.resolve(), G.skipTransition()), _({ isTransitioning: !0, flushSync: !0, currentLocation: Ke.currentLocation, nextLocation: Ke.nextLocation });
            });
            let Ve = y.window.document.startViewTransition(() => {
              Ue(() => A(fe));
            });
            return Ve.finished.finally(() => {
              Ue(() => {
                Y(void 0), Q(void 0), H(void 0), _({ isTransitioning: !1 });
              });
            }), void Ue(() => Q(Ve));
          }
          G ? (F && F.resolve(), G.skipTransition(), Ee({ state: fe, currentLocation: Ke.currentLocation, nextLocation: Ke.nextLocation })) : (H(fe), _({ isTransitioning: !0, flushSync: !1, currentLocation: Ke.currentLocation, nextLocation: Ke.nextLocation }));
        } else Vt ? Ue(() => A(fe)) : se(() => A(fe));
      }, [y.window, G, F, xe, se]);
      i.useLayoutEffect(() => y.subscribe(pe), [y, pe]), i.useEffect(() => {
        j.isTransitioning && !j.flushSync && Y(new Ye());
      }, [j]), i.useEffect(() => {
        if (F && U && y.window) {
          let fe = U, De = F.promise, Ce = y.window.document.startViewTransition(async () => {
            se(() => A(fe)), await De;
          });
          Ce.finished.finally(() => {
            Y(void 0), Q(void 0), H(void 0), _({ isTransitioning: !1 });
          }), Q(Ce);
        }
      }, [se, U, F, y.window]), i.useEffect(() => {
        F && U && D.location.key === U.location.key && F.resolve();
      }, [F, G, D.location, U]), i.useEffect(() => {
        !j.isTransitioning && de && (H(de.state), _({ isTransitioning: !0, flushSync: !1, currentLocation: de.currentLocation, nextLocation: de.nextLocation }), Ee(void 0));
      }, [j.isTransitioning, de]), i.useEffect(() => {
      }, []);
      let rt = i.useMemo(() => ({ createHref: y.createHref, encodeLocation: y.encodeLocation, go: (fe) => y.navigate(fe), push: (fe, De, Ce) => y.navigate(fe, { state: De, preventScrollReset: Ce == null ? void 0 : Ce.preventScrollReset }), replace: (fe, De, Ce) => y.navigate(fe, { replace: !0, state: De, preventScrollReset: Ce == null ? void 0 : Ce.preventScrollReset }) }), [y]), nt = y.basename || "/", at = i.useMemo(() => ({ router: y, navigator: rt, static: !1, basename: nt }), [y, rt, nt]), Ge = i.useMemo(() => ({ v7_relativeSplatPath: y.future.v7_relativeSplatPath }), [y.future.v7_relativeSplatPath]);
      return i.useEffect(() => a.UNSAFE_logV6DeprecationWarnings(w, y.future), [w, y.future]), i.createElement(i.Fragment, null, i.createElement(a.UNSAFE_DataRouterContext.Provider, { value: at }, i.createElement(a.UNSAFE_DataRouterStateContext.Provider, { value: D }, i.createElement(Z.Provider, { value: xe.current }, i.createElement(ie.Provider, { value: j }, i.createElement(a.Router, { basename: nt, location: D.location, navigationType: D.historyAction, navigator: rt, future: Ge }, D.initialized || y.future.v7_partialHydration ? i.createElement(gt, { routes: y.routes, future: y.future, state: D }) : b))))), null);
    }, r.ScrollRestoration = function(m) {
      let { getKey: b, storageKey: y } = m;
      return Ot({ getKey: b, storageKey: y }), null;
    }, r.UNSAFE_FetchersContext = Z, r.UNSAFE_ViewTransitionContext = ie, r.UNSAFE_useScrollRestoration = Ot, r.createBrowserRouter = function(m, b) {
      return l.createRouter({ basename: b == null ? void 0 : b.basename, future: v({}, b == null ? void 0 : b.future, { v7_prependBasename: !0 }), history: l.createBrowserHistory({ window: b == null ? void 0 : b.window }), hydrationData: (b == null ? void 0 : b.hydrationData) || d(), routes: m, mapRouteProperties: a.UNSAFE_mapRouteProperties, dataStrategy: b == null ? void 0 : b.dataStrategy, patchRoutesOnNavigation: b == null ? void 0 : b.patchRoutesOnNavigation, window: b == null ? void 0 : b.window }).initialize();
    }, r.createHashRouter = function(m, b) {
      return l.createRouter({ basename: b == null ? void 0 : b.basename, future: v({}, b == null ? void 0 : b.future, { v7_prependBasename: !0 }), history: l.createHashHistory({ window: b == null ? void 0 : b.window }), hydrationData: (b == null ? void 0 : b.hydrationData) || d(), routes: m, mapRouteProperties: a.UNSAFE_mapRouteProperties, dataStrategy: b == null ? void 0 : b.dataStrategy, patchRoutesOnNavigation: b == null ? void 0 : b.patchRoutesOnNavigation, window: b == null ? void 0 : b.window }).initialize();
    }, r.createSearchParams = P, r.unstable_HistoryRouter = function(m) {
      let { basename: b, children: y, future: w, history: D } = m, [A, U] = i.useState({ action: D.action, location: D.location }), { v7_startTransition: H } = w || {}, j = i.useCallback((_) => {
        H && ne ? ne(() => U(_)) : U(_);
      }, [U, H]);
      return i.useLayoutEffect(() => D.listen(j), [D, j]), i.useEffect(() => a.UNSAFE_logV6DeprecationWarnings(w), [w]), i.createElement(a.Router, { basename: b, children: y, location: A.location, navigationType: A.action, navigator: D, future: w });
    }, r.unstable_usePrompt = function(m) {
      let { when: b, message: y } = m, w = a.useBlocker(b);
      i.useEffect(() => {
        w.state === "blocked" && (window.confirm(y) ? setTimeout(w.proceed, 0) : w.reset());
      }, [w, y]), i.useEffect(() => {
        w.state !== "blocked" || b || w.reset();
      }, [w, b]);
    }, r.useBeforeUnload = function(m, b) {
      let { capture: y } = b || {};
      i.useEffect(() => {
        let w = y != null ? { capture: y } : void 0;
        return window.addEventListener("beforeunload", m, w), () => {
          window.removeEventListener("beforeunload", m, w);
        };
      }, [m, y]);
    }, r.useFetcher = function(m) {
      var b;
      let { key: y } = m === void 0 ? {} : m, { router: w } = Pe(Ne.UseFetcher), D = Ae(ze.UseFetcher), A = i.useContext(Z), U = i.useContext(a.UNSAFE_RouteContext), H = (b = U.matches[U.matches.length - 1]) == null ? void 0 : b.route.id;
      A || l.UNSAFE_invariant(!1), U || l.UNSAFE_invariant(!1), H == null && l.UNSAFE_invariant(!1);
      let j = Le ? Le() : "", [_, F] = i.useState(y || j);
      y && y !== _ ? F(y) : _ || F(zt()), i.useEffect(() => (w.getFetcher(_), () => {
        w.deleteFetcher(_);
      }), [w, _]);
      let Y = i.useCallback(($, se) => {
        H || l.UNSAFE_invariant(!1), w.fetch(_, H, $, se);
      }, [_, H, w]), G = _t(), Q = i.useCallback(($, se) => {
        G($, v({}, se, { navigate: !1, fetcherKey: _ }));
      }, [_, G]), de = i.useMemo(() => i.forwardRef(($, se) => i.createElement(je, v({}, $, { navigate: !1, fetcherKey: _, ref: se }))), [_]), Ee = D.fetchers.get(_) || l.IDLE_FETCHER, xe = A.get(_);
      return i.useMemo(() => v({ Form: de, submit: Q, load: Y }, Ee, { data: xe }), [de, Q, Y, Ee, xe]);
    }, r.useFetchers = function() {
      let m = Ae(ze.UseFetchers);
      return Array.from(m.fetchers.entries()).map((b) => {
        let [y, w] = b;
        return v({}, w, { key: y });
      });
    }, r.useFormAction = Wt, r.useLinkClickHandler = We, r.useSearchParams = function(m) {
      let b = i.useRef(P(m)), y = i.useRef(!1), w = a.useLocation(), D = i.useMemo(() => function(H, j) {
        let _ = P(H);
        return j && j.forEach((F, Y) => {
          _.has(Y) || j.getAll(Y).forEach((G) => {
            _.append(Y, G);
          });
        }), _;
      }(w.search, y.current ? null : b.current), [w.search]), A = a.useNavigate(), U = i.useCallback((H, j) => {
        const _ = P(typeof H == "function" ? H(D) : H);
        y.current = !0, A("?" + _, j);
      }, [A, D]);
      return [D, U];
    }, r.useSubmit = _t, r.useViewTransitionState = Kt, Object.defineProperty(r, "__esModule", { value: !0 });
  });
})(lr, lr.exports);
var go = lr.exports;
/**
 * React Router DOM v6.30.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
Kr.exports = go;
var yo = Kr.exports;
const Eo = /* @__PURE__ */ Mn(yo);
export {
  Eo as default
};

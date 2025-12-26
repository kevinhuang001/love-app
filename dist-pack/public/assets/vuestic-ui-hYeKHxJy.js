import {
  w as z,
  h as Re,
  T as Er,
  c as U,
  i as Dr,
  a as i,
  g as qe,
  b as Lt,
  p as Ot,
  n as pe,
  d as Y,
  r as D,
  s as su,
  e as mt,
  u as s,
  f as Nt,
  j as iu,
  k as G,
  l as Yt,
  o as C,
  m as V,
  q as _,
  t as E,
  F as be,
  v as Te,
  x as fe,
  y as H,
  z as pt,
  A as J,
  B as ie,
  C as R,
  D as Ie,
  E as re,
  G as Me,
  H as et,
  I as St,
  J as ut,
  K as Ye,
  L as ue,
  M as Fr,
  S as uu,
  N as Wa,
  O as cu,
  P as Mr,
  Q as we,
  R as Bt,
  U as Ka,
  V as se,
  W as ne,
  X as Po,
  Y as Ga,
  Z as Tt,
  _ as Nr,
  $ as dt,
  a0 as du,
  a1 as wt,
  a2 as Rr,
  a3 as yo,
  a4 as Ao,
  a5 as st,
  a6 as zr,
  a7 as vu,
  a8 as Hr,
  a9 as pu,
} from './vue-vendor-CS4KimFI.js'
import { Y as fu, Z as mu, _ as gu, $ as yu, a0 as bu } from './vendor-Qzk3SZgC.js'
const sl = {
    light: {
      primary: '#154EC1',
      secondary: '#767C88',
      success: '#3D9209',
      info: '#158DE3',
      danger: '#E42222',
      warning: '#FFD43A',
      backgroundPrimary: '#f6f6f6',
      backgroundSecondary: '#FFFFFF',
      backgroundElement: '#ECF0F1',
      backgroundBorder: '#DEE5F2',
      textPrimary: '#262824',
      textInverted: '#FFFFFF',
      shadow: 'rgba(0, 0, 0, 0.12)',
      focus: '#49A8FF',
      transparent: 'rgba(0, 0, 0, 0)',
    },
    dark: {
      primary: '#3472F0',
      secondary: '#767C88',
      success: '#66BE33',
      info: '#3EAAF8',
      danger: '#F34030',
      warning: '#FFD952',
      backgroundPrimary: '#050A10',
      backgroundSecondary: '#1F262F',
      backgroundElement: '#131A22',
      backgroundBorder: '#3D4C58',
      textPrimary: '#F1F1F1',
      textInverted: '#0B121A',
      shadow: 'rgba(255, 255, 255, 0.12)',
      focus: '#49A8FF',
      transparent: 'rgba(0, 0, 0, 0)',
    },
  },
  jr = Symbol('vaBreakpoint'),
  hu = { xs: 0, sm: 640, md: 1024, lg: 1440, xl: 1920 },
  Cu = () => ({ enabled: !0, bodyClass: !0, thresholds: hu }),
  iS = (e) => e,
  fn = (e, t = null) => z(() => [e], t),
  il = (e) => (typeof e == 'string' ? Re(Er, e) : Dr(e) ? e : U(e)),
  Su = (e, t = null) =>
    Object.keys(e).reduce((a, o) => {
      const n = e[o]
      return ((a[o] = typeof n == 'function' ? n : fn(n, t)), a)
    }, {}),
  $u = (e) => {
    const t = e.render || e.ssrRender
    if (!t) return
    const a = t.name === '_sfc_render' || t.name === '_sfc_ssrRender'
    return function (...o) {
      const n = o[0],
        l = n.$.slots,
        r = new Proxy(n, {
          get(d, c) {
            return c === '$slots' ? Su(l) : d[c]
          },
        }),
        u = a ? void 0 : r
      return t.call(u, r, ...o.slice(1))
    }
  },
  At = (e, t) =>
    Object.keys(e)
      .filter((a) => !t.includes(a))
      .reduce((a, o) => ((a[o] = e[o]), a), {}),
  mn = 'child:',
  Ur = '$va:childComponents',
  Wr = (e) =>
    Object.keys(e).reduce((t, a) => {
      const o = `${mn}${a}`
      return ((t[o] = { type: Object, required: !1, default: void 0 }), t)
    }, {}),
  Kr = (e) => {
    const t = i(() =>
      Object.keys(e).reduce((o, n) => {
        if (n.startsWith(mn)) {
          const l = n.slice(mn.length)
          o[l] = e[n]
        }
        return o
      }, {}),
    )
    Ot(Ur, t)
  },
  Bn = () => {
    var e
    const t = (e = qe()) == null ? void 0 : e.attrs['va-child']
    if (!t) return null
    const a = Lt(Ur)
    return a != null && a.value ? i(() => a.value[t]) : null
  },
  ku = /([a-z0-9])([A-Z])/g,
  wu = (e) => e.replace(ku, '$1-$2').toLowerCase(),
  _u = (e, t) => (t in e ? e[t] : e[wu(t)]),
  Vu = (e, t) => {
    const a = e.props,
      o = Bn()
    return new Proxy(a, {
      get: (n, l) => {
        var r, u
        if (typeof l != 'string') return n[l]
        const d = (r = o == null ? void 0 : o.value) == null ? void 0 : r[l]
        if (d !== void 0) return d
        const c = e.vnode.props || {},
          v = n[l]
        if (_u(c, l) !== void 0) return v
        const f = (u = t.value) == null ? void 0 : u[l]
        return f !== void 0 ? f : v
      },
    })
  },
  Bu = (e, t) => {
    const a = e.attrs
    return new Proxy(a, {
      get: (o, n) => {
        var l
        if (typeof n != 'string') return o[n]
        if (n === 'class') return pe([t.value.class, a.class])
        if (n === 'style') return Y([t.value.style, a.style])
        const r = (l = t.value) == null ? void 0 : l[n]
        return r !== void 0 ? r : o[n]
      },
      ownKeys(o) {
        return [...new Set([...Object.keys(a), ...Object.keys(t.value)])]
      },
      getOwnPropertyDescriptor(o, n) {
        return Reflect.getOwnPropertyDescriptor(t.value, n) ?? Reflect.getOwnPropertyDescriptor(a, n)
      },
    })
  },
  Zo = 'slot:',
  Tu = (e, t) => {
    const a = e.slots,
      o = Bn(),
      n = i(() =>
        Object.keys(t.value).reduce((l, r) => (r.startsWith(Zo) && (l[r.slice(Zo.length)] = t.value[r]), l), {}),
      )
    return new Proxy(a, {
      get: (l, r) => {
        var u, d
        if (typeof r != 'string') return l[r]
        const c = `${Zo}${r}`,
          v = (u = o == null ? void 0 : o.value) == null ? void 0 : u[c]
        if (v !== void 0) return fn(il(v))
        const p = l[r]
        if (p !== void 0) return p
        const f = (d = n.value) == null ? void 0 : d[r]
        return f !== void 0 ? fn(il(f)) : p
      },
      ownKeys(l) {
        return [...new Set([...Object.keys(a), ...Object.keys(n.value)])]
      },
      getOwnPropertyDescriptor(l, r) {
        return Reflect.getOwnPropertyDescriptor(n.value, r) ?? Reflect.getOwnPropertyDescriptor(a, r)
      },
    })
  },
  Gr = 'VaLocalConfig',
  Iu = i(() => [])
function Tn() {
  return Lt(Gr, Iu)
}
function qr(e) {
  Ot(Gr, e)
}
function Pu(e) {
  const t = Tn(),
    a = i(() => [...t.value, e.value])
  qr(a)
}
const Au = [null, void 0, ''],
  Lu = [null, void 0],
  ft = (e) => Au.includes(e),
  ul = (e) => !ft(e),
  Qo = (e) => Lu.includes(e),
  Ou = typeof process < 'u' ? process : {},
  xu = Ou.env || {},
  Eu = xu.NODE_ENV || '',
  Pa = typeof __DEV__ < 'u' ? __DEV__ : !['prod', 'production'].includes(Eu),
  De = (...e) => (Pa && console.warn(...e), !1),
  Du = (e) => {
    throw new Error(`[Vuestic] ${e}`)
  }
let gn = null,
  Na = null
const $o = (e) => {
    ;((Na == null ? void 0 : Na._instance) === null && (Na = null),
      !(e === null && Na === null) && ((Na = gn), (gn = e)))
  },
  In = () => gn,
  Yr = (e, t = void 0) => {
    var a
    const o = (a = In()) == null ? void 0 : a._context.provides[e]
    return qe()
      ? Lt(e, t)
      : (o ??
          Du(
            "You're using Vuestic composable outside Vue app. Since you registered Vuestic in multiple apps, composables can not be used outside setup function anymore.",
          ))
  },
  sa = (e) => e !== null && typeof e == 'object',
  la = (e) =>
    e === null || typeof e != 'object'
      ? e
      : Array.isArray(e)
        ? e.map(la)
        : e instanceof Date
          ? new Date(e.getTime())
          : e instanceof RegExp
            ? new RegExp(e.source, e.flags)
            : e instanceof Map
              ? new Map(Array.from(e.entries()).map(([t, a]) => [t, la(a)]))
              : e instanceof Set
                ? new Set(Array.from(e.values()).map(la))
                : sa(e)
                  ? Object.keys(e).reduce((t, a) => ((t[a] = la(e[a])), t), {})
                  : e,
  en = (e) => e && typeof e == 'object' && !Array.isArray(e),
  ia = (e, t) => (
    en(e) || (e = {}),
    Object.keys(t).forEach((a) => {
      const o = e[a],
        n = t[a]
      n instanceof RegExp || n instanceof Date
        ? (e[a] = n)
        : en(o) && en(n)
          ? (e[a] = ia(Object.create(Object.getPrototypeOf(o), Object.getOwnPropertyDescriptors(o)), n))
          : (e[a] = n)
    }),
    e
  ),
  Fu = (...e) => e.reduce((t, a) => ia(t, a), {}),
  Mu = [
    { prefix: 'bg', property: 'background-color' },
    { prefix: 'text', property: ['color', 'fill'] },
  ],
  Nu = () => Mu,
  Xr = (e) => ({
    ...e,
    get variables() {
      return this.presets[this.currentPresetName]
    },
    set variables(t) {
      this.presets[this.currentPresetName] = t
    },
  }),
  Ru = () => Xr({ threshold: 150, presets: { light: sl.light, dark: sl.dark }, currentPresetName: 'light' }),
  zu = (e) => e,
  Hu = zu([
    { name: 'va-unsorted', to: 'swap_vert' },
    { name: 'va-sort-asc', to: 'va-arrow-up' },
    { name: 'va-sort-desc', to: 'va-arrow-down' },
    { name: 'va-arrow-first', to: 'mi-first_page' },
    { name: 'va-arrow-last', to: 'mi-last_page' },
    { name: 'va-arrow-right', to: 'mi-chevron_right' },
    { name: 'va-arrow-left', to: 'mi-chevron_left' },
    { name: 'va-arrow-down', to: 'mi-expand_more' },
    { name: 'va-arrow-up', to: 'mi-expand_less' },
    { name: 'va-calendar', to: 'mi-calendar_today' },
    { name: 'va-delete', to: 'mi-delete_outline' },
    { name: 'va-check', to: 'mi-check' },
    { name: 'va-check-circle', to: 'mi-check_circle' },
    { name: 'va-warning', to: 'mi-warning' },
    { name: 'va-clear', to: 'mi-highlight_off' },
    { name: 'va-close', to: 'mi-close' },
    { name: 'va-loading', to: 'mi-loop' },
    { name: 'va-plus', to: 'mi-add' },
    { name: 'va-minus', to: 'mi-remove' },
  ]),
  ju = [
    { name: 'mi-{icon}', class: 'material-icons', resolve: ({ icon: e }) => ({ content: e }) },
    { name: '{icon}', class: 'material-icons', resolve: ({ icon: e }) => ({ content: e }) },
  ],
  Uu = (e) => ((e.aliases = e.aliases || []), (e.fonts = e.fonts || []), [...e.aliases, ...Hu, ...e.fonts, ...ju]),
  Wu = () => Uu({}),
  Ku = () => ({
    VaIcon: { sizesConfig: { defaultSize: 18, sizes: { small: 14, medium: 18, large: 24 } } },
    VaRating: { sizesConfig: { defaultSize: 18, sizes: { small: 14, medium: 18, large: 24 } } },
    all: {},
    presets: {
      VaButton: {
        default: {
          backgroundOpacity: 1,
          hoverBehavior: 'mask',
          hoverOpacity: 0.15,
          pressedBehavior: 'mask',
          pressedOpacity: 0.13,
        },
        primary: {
          backgroundOpacity: 0.1,
          hoverBehavior: 'opacity',
          hoverOpacity: 0.07,
          pressedBehavior: 'opacity',
          pressedOpacity: 0.13,
        },
        secondary: {
          backgroundOpacity: 0,
          hoverBehavior: 'opacity',
          hoverOpacity: 0.07,
          pressedBehavior: 'opacity',
          pressedOpacity: 0.13,
        },
        plain: { plain: !0, hoverBehavior: 'mask', hoverOpacity: 0.15, pressedBehavior: 'mask', pressedOpacity: 0.13 },
        plainOpacity: {
          plain: !0,
          textOpacity: 0.6,
          hoverBehavior: 'opacity',
          hoverOpacity: 1,
          pressedBehavior: 'opacity',
          pressedOpacity: 0.9,
        },
      },
      VaInputWrapper: {
        solid: { background: 'backgroundElement' },
        bordered: { class: 'va-input-wrapper--bordered', background: 'backgroundElement' },
      },
      VaCheckbox: { solid: { style: '--va-checkbox-background: var(--va-background-element)' } },
      VaRadio: { solid: { style: '--va-radio-background: var(--va-background-element)' } },
      VaMenu: { context: { cursor: !0, placement: 'right-start', trigger: 'right-click' } },
    },
  }),
  Gu = () => ({
    search: 'Search',
    noOptions: 'Items not found',
    ok: 'OK',
    cancel: 'Cancel',
    uploadFile: 'Upload file',
    undo: 'Undo',
    dropzone: 'Drop files here to upload',
    fileDeleted: 'File deleted',
    closeAlert: 'close alert',
    backToTop: 'back to top',
    toggleDropdown: 'toggle dropdown',
    carousel: 'carousel',
    goPreviousSlide: 'go previous slide',
    goNextSlide: 'go next slide',
    goSlide: 'go slide {index}',
    slideOf: 'slide {index} of {length}',
    close: 'close',
    openColorPicker: 'open color picker',
    colorSelection: 'color selection',
    colorName: 'color {color}',
    decreaseCounter: 'decrease counter',
    increaseCounter: 'increase counter',
    selectAllRows: 'select all rows',
    sortColumnBy: 'sort column by {name}',
    selectRowByIndex: 'select row {index}',
    resetDate: 'reset date',
    nextPeriod: 'next period',
    switchView: 'switch view',
    previousPeriod: 'previous period',
    removeFile: 'remove file',
    reset: 'reset',
    pagination: 'pagination',
    goToTheFirstPage: 'go to the first page',
    goToPreviousPage: 'go to the previous page',
    goToSpecificPage: 'go to the {page} page',
    goToSpecificPageInput: 'enter the page number to go',
    goNextPage: 'go next page',
    goLastPage: 'go last page',
    currentRating: 'current rating {value} of {max}',
    voteRating: 'vote rating {value} of {max}',
    optionsFilter: 'options filter',
    splitPanels: 'split panels',
    movePaginationLeft: 'move pagination left',
    movePaginationRight: 'move pagination right',
    resetTime: 'reset time',
    closeToast: 'close toast',
    selectedOption: 'Selected option',
    noSelectedOption: 'Option is not selected',
    breadcrumbs: 'breadcrumbs',
    counterValue: 'counter value',
    selectedDate: 'selected date',
    selectedTime: 'selected time',
    progressState: 'progress state',
    color: 'color',
    next: 'Next',
    back: 'Previous',
    finish: 'Finish',
    step: 'step',
    progress: 'progress',
    loading: 'Loading',
    sliderValue: 'Current slider value is {value}',
    switch: 'Switch',
    inputField: 'Input field',
    fileTypeIncorrect: 'File type is incorrect',
    select: 'Select an option',
  }),
  Lo = Symbol('GLOBAL_CONFIG'),
  qu = () => ({
    colors: Ru(),
    icons: Wu(),
    components: Ku(),
    breakpoint: Cu(),
    i18n: Gu(),
    colorsClasses: Nu(),
    routerComponent: void 0,
  }),
  Jr = (e = {}) => {
    const t = D(ia(qu(), e))
    return {
      getGlobalConfig: () => t.value,
      setGlobalConfig: (l) => {
        const r = typeof l == 'function' ? l(t.value) : l
        t.value = la(r)
      },
      mergeGlobalConfig: (l) => {
        const r = typeof l == 'function' ? l(t.value) : l
        t.value = ia(la(t.value), r)
      },
      globalConfig: t,
    }
  },
  Yu = (e) => {
    var t, a
    const o =
      ((t = qe()) == null ? void 0 : t.appContext.provides) || ((a = In()) == null ? void 0 : a._context.provides)
    if (!o) throw new Error('Vue app not found for provide')
    return ((o[Lo] = e), e)
  }
function xt() {
  let e = Yr(Lo)
  return (e || ((e = Jr()), Yu(e)), e)
}
const Xu = (e) => 'preset' in e,
  cl = (e) => (Xu(e) ? e.preset : void 0),
  Ju = (e, t) => {
    const a = Tn(),
      { globalConfig: o } = xt(),
      n = e.name,
      l = (u) =>
        (u instanceof Array ? u : [u]).reduce((d, c) => {
          var v, p, f
          const g =
            (f = (p = (v = o.value.components) == null ? void 0 : v.presets) == null ? void 0 : p[n]) == null
              ? void 0
              : f[c]
          if (!g) return d
          const y = cl(g)
          return { ...d, ...(y ? l(y) : void 0), ...g }
        }, {}),
      r = Bn()
    return i(() => {
      var u, d
      const c = {
          ...((u = o.value.components) == null ? void 0 : u.all),
          ...((d = o.value.components) == null ? void 0 : d[n]),
        },
        v = a.value.reduce((g, y) => {
          const m = y[n]
          return m ? { ...g, ...m } : g
        }, {}),
        p = [t, r == null ? void 0 : r.value, v, c].filter(ul).map(cl).filter(ul).at(0),
        f = p ? l(p) : void 0
      return { ...c, ...v, ...f }
    })
  },
  Zu = (e) => (t, a) => {
    var o
    const n = qe(),
      l = Ju(e, t),
      r = i(() => At(l.value, Object.keys(t))),
      u = Vu(n, l),
      d = Bu(n, r),
      c = Tu(n, l)
    ;((n.props = u), (n.attrs = d), (n.slots = c))
    const v = (o = e.setup) == null ? void 0 : o.call(e, su(u), { ...a, attrs: d, slots: c })
    return (typeof v == 'object' && !n.exposed && a.expose(v), v)
  },
  yn = (e) => {
    const t = Zu(e),
      a = $u(e)
    return new Proxy(e, {
      get(o, n) {
        return n in e
          ? n === 'setup'
            ? t
            : n === 'render' || n === 'ssrRender'
              ? a
              : Reflect.get(o, n)
          : Reflect.get(o, n)
      },
    })
  },
  bn = '__c',
  Qu = (e) => ((e[bn] = yn(e[bn])), e),
  Rt = (e) => ('setup' in e ? yn(e) : bn in e ? Qu(e) : ((e.setup = () => ({})), yn(e))),
  Q = Rt,
  ec = { defaultSize: 48, sizes: { small: 32, medium: 48, large: 64 } },
  tc = { defaultSize: 1, sizes: { small: 0.75, medium: 1, large: 1.25 } },
  pa = {
    size: { type: [String, Number], default: '', validator: (e) => typeof e == 'string' || typeof e == 'number' },
    sizesConfig: { type: Object, default: () => ec },
    fontSizesConfig: { type: Object, default: () => tc },
  },
  ac = /(?<fontSize>\d+)(?<extension>px|rem)/i,
  dl = (e) => e / 16 - 0.5,
  vl = (e) => (typeof e == 'number' ? `${e}px` : String(e)),
  oc = (e) => 'sizesConfig' in e,
  nc = (e) => {
    const t = 'size'
    return i(() => {
      let a = e[t]
      if (oc(e)) {
        const { defaultSize: o, sizes: n } = e.sizesConfig
        if ((ft(a) && (a = o), n)) {
          const l = n[a]
          if (l) return vl(l)
        }
      }
      return vl(a)
    })
  },
  fa = (e, t = ((a) => ((a = qe()) == null ? void 0 : a.type.name))()) => {
    const { getGlobalConfig: a } = xt(),
      o = i(() => {
        var u, d
        return t ? ((d = (u = a().components) == null ? void 0 : u[t]) == null ? void 0 : d.sizesConfig) : void 0
      }),
      n = i(() => {
        var u, d, c
        const { defaultSize: v, sizes: p } = e.sizesConfig,
          f = (u = o.value) == null ? void 0 : u.defaultSize
        if (!e.size) return `${v || f}px`
        if (typeof e.size == 'string') {
          const g = (c = (d = o.value) == null ? void 0 : d.sizes) == null ? void 0 : c[e.size],
            y = p[e.size]
          return y ? `${y}px` : g ? `${g}px` : e.size
        }
        return `${e.size}px`
      }),
      l = i(() => {
        const { defaultSize: u, sizes: d } = e.fontSizesConfig
        if (!e.size) return u
        if (typeof e.size == 'string') {
          if (e.size in d) return d[e.size]
          const c = e.size.match(ac)
          if (!c || !c.groups) throw new Error('Size prop should be either valid string or number')
          const { extension: v, fontSize: p } = c.groups
          return v === 'rem' ? +p : dl(+p)
        }
        return dl(e.size)
      }),
      r = i(() => `${l.value}rem`)
    return { sizeComputed: n, fontSizeComputed: r, fontSizeInRem: l }
  },
  me = { preset: { type: [String, Array], default: void 0 } },
  lc = (e, t) => t.test(e),
  Zr = (e, t) => {
    if (typeof t != 'string' && t.global) return [...e.matchAll(t)].map((o) => o.slice(1))
    const a = e.match(t) || []
    return a ? (a.length > 1 ? a.slice(1) : a) : []
  },
  Qr = /{[^}]*}/g,
  es = (e) => e.replace(Qr, '(.*)'),
  rc = (e) => (e.match(Qr) || []).map((t) => t.replace(/{|}/g, '')),
  sc = (e, t) => Zr(e, es(t)),
  ic = (e, t) => {
    const a = rc(t),
      o = sc(e, t)
    return a.reduce((n, l, r) => ({ ...n, [l]: o[r] }), {})
  },
  uc = (e, t) => (e.match(t) || [])[0] === e,
  cc = (e, t) => {
    const a = es(t)
    return uc(e, new RegExp(a))
  },
  ts = (e) => typeof e.name == 'string',
  as = (e) => e.name instanceof RegExp,
  dc = (e, t) => (ts(t) ? cc(e, t.name) : as(t) ? lc(e, t.name) : !1),
  vc = (e, t) => {
    const a = ic(e, t.name)
    return t.resolve && t.resolve(a)
  },
  pc = (e, t) => {
    if (t.name.global) throw new Error(`Bad icon config with name ${t.name}. Please, don't use global regex as name.`)
    const a = Zr(e, t.name)
    return t.resolveFromRegex && t.resolveFromRegex(...a)
  },
  fc = (e, t) => {
    if (ts(t)) return vc(e, t)
    if (as(t)) return pc(e, t)
    throw Error('Unknown icon config')
  },
  mc = (e, t, a = []) => {
    const o = t.find((n) => (a.includes(n.name.toString()) ? !1 : dc(e, n)))
    if (!o) throw new Error(`Can not find icon config from ${e}. Please provide default config.`)
    return o
  },
  os = (e, t, a = []) => {
    if (!e) return
    const o = mc(e, t, a),
      n = ia(fc(e, o), o)
    return ((a = [...a, o.name.toString()]), ia(os(n.to, t, a), n))
  },
  gc = (e) => {
    const t = ['name', 'to', 'resolve', 'resolveFromRegex'],
      a = e
    return (
      t.forEach((o) => {
        delete a[o]
      }),
      a
    )
  },
  yc = (e, t) => {
    const a = os(e, t)
    return a === void 0 ? {} : gc(a)
  },
  bc = () => {
    const { globalConfig: e } = xt()
    return { getIcon: (t) => yc(t, e.value.icons) }
  },
  Et = (e) => e,
  ns = Symbol('VaAppCachePlugin'),
  ls = Et(() => ({
    install(e) {
      const t = { colorContrast: {} }
      e.provide(ns, t)
    },
  })),
  hc = () => {
    const e = Yr(ns)
    return e || { colorContrast: {} }
  },
  Pn = (e) => {
    const t = typeof e == 'function' ? i(e) : i(e),
      a = new Proxy(t, {
        get(o, n, l) {
          if (typeof t.value == 'object') return s(Reflect.get(t.value, n, l))
        },
        set(o, n, l) {
          return (mt(t.value[n]) && !mt(l) ? (t.value[n].value = l) : (t.value[n] = l), !0)
        },
        deleteProperty(o, n) {
          return Reflect.deleteProperty(t.value, n)
        },
        has(o, n) {
          return typeof t.value != 'object' ? !1 : Reflect.has(t.value, n)
        },
        ownKeys() {
          return typeof t.value != 'object' ? [] : Object.keys(t.value)
        },
        getOwnPropertyDescriptor() {
          return { enumerable: !0, configurable: !0 }
        },
      })
    return Nt(a)
  },
  rs = (e) => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase(),
  Cc = /[A-Z0-9]*(?:[^\-_|A-Z|\s.])*/gm,
  An = (e) => {
    var t
    return (
      ((t = e.match(Cc)) == null
        ? void 0
        : t
            .map((a) => a.trim().split(/([0-9]+)|([a-zA-Z]+)/g))
            .flat()
            .filter(Boolean)) || []
    )
  },
  qa = (e) =>
    An(e)
      .map((t) => t.toLowerCase())
      .join('-'),
  Sc = (e) =>
    An(e)
      .map((t, a) => (a === 0 ? t.toLowerCase() : rs(t)))
      .join(''),
  pl = (e) => An(e).map(rs).join(' '),
  ss = /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6,8})$/,
  is = /^rgba?\(([\d.]+, ?){2}[\d.]+(, ?[\d.]+)?\)$/,
  us = /hsla?\([\d.]+(deg|rad|turn|grad)?(,?\s?[\d.]+%?){2}(,?\s?(\/\s?)?[\d.]+%?)?\)/,
  $c = (e) => ss.test(e) || is.test(e) || us.test(e),
  Ln = (e) => (typeof e != 'object' || e === null ? !1 : 'h' in e && 's' in e && 'l' in e),
  On = (e) => (typeof e != 'object' || e === null ? !1 : 'r' in e && 'g' in e && 'b' in e),
  cs = (e) => {
    if (!ss.test(e)) return null
    const t = e.replace('#', ''),
      a = t.length < 6,
      [o, n, l, r] = a ? t.split('').map((u) => parseInt(u + u, 16)) : t.match(/.{2}/g).map((u) => parseInt(u, 16))
    return { r: o, g: n, b: l, a: r ?? 1 }
  },
  ds = (e) => {
    if (!is.test(e)) return null
    const [t, a, o, n = 1] = e.match(/[\d.]+/g).map(Number)
    return { r: t, g: a, b: o, a: n }
  },
  vs = (e) => {
    if (!us.test(e)) return null
    const [t, a, o, n = '1'] = e.match(/[\d.]+%?/g)
    return {
      h: Number(t),
      s: Number(a.replace('%', '')),
      l: Number(o.replace('%', '')),
      a: n.endsWith('%') ? Number(n.replace('%', '')) / 100 : Number(n),
    }
  },
  fl = (e) => {
    const t = e.r / 255,
      a = e.g / 255,
      o = e.b / 255,
      n = Math.max(t, a, o),
      l = Math.min(t, a, o)
    let r = 0,
      u = 0
    const d = (n + l) / 2
    if (n !== l) {
      const c = n - l
      switch (((u = d > 0.5 ? c / (2 - n - l) : c / (n + l)), n)) {
        case t:
          r = (a - o) / c + (a < o ? 6 : 0)
          break
        case a:
          r = (o - t) / c + 2
          break
        case o:
          r = (t - a) / c + 4
          break
      }
      r *= 60
    }
    return { h: Math.round(r), s: Math.round(u * 100), l: Math.round(d * 100), a: e.a }
  },
  tn = (e, t, a) => (
    a < 0 && (a += 1),
    a > 1 && (a -= 1),
    a < 1 / 6 ? e + (t - e) * 6 * a : a < 1 / 2 ? t : a < 2 / 3 ? e + (t - e) * (2 / 3 - a) * 6 : e
  ),
  ml = (e) => {
    const t = e.h / 360,
      a = e.s / 100,
      o = e.l / 100,
      n = o < 0.5 ? o * (1 + a) : o + a - o * a,
      l = 2 * o - n,
      r = tn(l, n, t + 1 / 3),
      u = tn(l, n, t),
      d = tn(l, n, t - 1 / 3)
    return { r: Math.round(r * 255), g: Math.round(u * 255), b: Math.round(d * 255), a: e.a }
  },
  Za = (e) => {
    if (Ln(e)) return { ...e }
    if (On(e)) return fl(e)
    const t = cs(e) ?? ds(e)
    if (t) return fl(t)
    const a = vs(e)
    if (a) return a
    throw new Error(`Color ${e} is not valid. Please, provide valid color.`)
  },
  xn = ({ h: e, s: t, l: a, a: o }) => `hsla(${e},${t}%,${a}%,${o ?? 1})`,
  Ya = (e) => {
    if (On(e)) return { ...e }
    if (Ln(e)) return ml(e)
    const t = vs(e)
    if (t) return ml(t)
    const a = cs(e) ?? ds(e)
    if (a) return a
    throw new Error(`Color ${e} is not valid. Please, provide valid color.`)
  },
  Ha = ({ r: e, g: t, b: a, a: o }) => (o === 1 ? `rgb(${e},${t},${a})` : `rgba(${e},${t},${a},${o ?? 1})`),
  kc = (e) => {
    if (Ln(e)) return xn(e)
    if (On(e)) return Ha(e)
    if (typeof e == 'string') return e
    throw new Error(`Color ${e} is not valid. Please, provide valid color.`)
  },
  wc = (e, { h: t, s: a, l: o, a: n }) => {
    const l = Za(e)
    return (
      (l.a = l.a ?? 1),
      (l.h = t ?? l.h),
      (l.s = a ?? l.s),
      (l.l = o ?? l.l),
      (l.a = n ?? l.a),
      l.h < 0 && (l.h = 360 + l.h),
      l.h > 360 && (l.h = l.h - 360),
      (l.s = Math.max(0, Math.min(100, l.s))),
      (l.l = Math.max(0, Math.min(100, l.l))),
      (l.a = Math.max(0, Math.min(1, l.a))),
      l
    )
  },
  _c = (e, { h: t, s: a, l: o, a: n }) => {
    const l = Za(e)
    return (
      (l.a = l.a ?? 1),
      (l.h += t ?? 0),
      (l.s += a ?? 0),
      (l.l += o ?? 0),
      (l.a += n ?? 0),
      l.h < 0 && (l.h = 360 + l.h),
      l.h > 360 && (l.h = l.h - 360),
      (l.s = Math.max(0, Math.min(100, l.s))),
      (l.l = Math.max(0, Math.min(100, l.l))),
      (l.a = Math.max(0, Math.min(1, l.a))),
      l
    )
  },
  Vc = (e) => /var\(--.+\)/.test(e),
  ko = (e) => `--va-${qa(e)}`,
  gl = (e) => Sc(e),
  ma = (e, t) => {
    const { r: a, g: o, b: n } = Ya(e)
    return Ha({ r: a, g: o, b: n, a: t })
  },
  yl = (e) => {
    const { r: t, g: a, b: o } = Ya(e)
    return Math.sqrt(t * t * 0.241 + a * a * 0.691 + o * o * 0.068)
  },
  ps = (e, t = 0.4) => ma(e, t),
  Bc = (e, t = 0.4) => ma(e, t),
  fs = (e, t = 0.2) => ma(e, t),
  ms = (e, t = 0.3) => ma(e, t),
  na = (e, t) => xn(_c(Za(e), t)),
  Tc = (e, t) => xn(wc(Za(e), t)),
  Ic = (e) => {
    const t = Za(e)
    if (t.s < 10) return na(t, { h: 2, s: 5, l: 10 })
    if (t.s < 30) return na(t, { s: -14, l: 11 })
    if ((t.h >= 0 && t.h < 44) || t.h >= 285) return na(t, { h: 11, s: 27, l: 8 })
    if (t.h >= 44 && t.h < 85) return na(t, { h: 3, l: 9 })
    if (t.h >= 85 && t.h < 165) return na(t, { h: 16, l: 14 })
    if (t.h >= 165 && t.h < 285) return na(t, { h: -15, s: 3, l: 2 })
    throw new Error("This method should handle all colors. But it didn't for some reason.")
  },
  En = (e) => `linear-gradient(to right, ${Ic(e)}, ${kc(e)})`,
  Pc = (e, t, a) => {
    const o = ma(t, a)
    return `linear-gradient(0deg, ${o}, ${o}), ${e}`
  },
  Ac = (e, t) => {
    const a = Ya(e),
      o = Ya(t),
      n = o.a
    return Ha(
      n === 1
        ? o
        : n === 0
          ? a
          : {
              r: Math.round(a.r * (1 - n) + o.r * n),
              g: Math.round(a.g * (1 - n) + o.g * n),
              b: Math.round(a.b * (1 - n) + o.b * n),
              a: a.a,
            },
    )
  },
  Lc = (e) => (e ? (e === 'transparent' ? !0 : Ya(e).a <= 0.1) : !1),
  Dn = { color: { type: String, default: '' } },
  Ce = () => {
    const e = xt()
    if (!e) throw new Error('useColors must be used in setup function or Vuestic GlobalConfigPlugin is not registered!')
    const { globalConfig: t } = e,
      a = Pn({
        get: () => t.value.colors.presets[t.value.colors.currentPresetName],
        set: (b) => {
          o(b)
        },
      }),
      o = (b) => {
        t.value.colors.presets[t.value.colors.currentPresetName] = { ...t.value.colors.variables, ...b }
      },
      n = () => a,
      l = (b, h, $) => {
        if ((h || (h = a.primary), b === 'transparent')) return '#ffffff00'
        if (b === 'currentColor') return b
        if (b != null && b.startsWith('on')) {
          const w = b.slice(2)
          if (a[gl(w)]) return l(f(l(w)), void 0, $)
        }
        b || (b = l(h))
        const S = a[b] || a[gl(b)]
        return S
          ? $
            ? `var(${ko(b)})`
            : S
          : $c(b) || ($ && Vc(b))
            ? b
            : (De(`'${b}' is not a proper color! Use HEX or default color themes
      names (https://vuestic.dev/en/styles/colors#default-color-themes)`),
              l(h))
      },
      r = (b) =>
        i({
          get() {
            return l(b)
          },
          set(h) {
            o({ [b]: h })
          },
        }),
      u = (b, h = 'va') =>
        Object.keys(b)
          .filter(($) => b[$] !== void 0)
          .reduce(
            ($, S) => (
              ($[`--${h}-${qa(S)}`] = l(b[S], void 0, !0)),
              ($[`--${h}-on-${qa(S)}`] = l(f(l(b[S])), void 0, !0)),
              $
            ),
            {},
          ),
      d = hc(),
      c = (b) =>
        typeof b != 'string' ? yl(b) : (d.colorContrast[b] || (d.colorContrast[b] = yl(b)), d.colorContrast[b]),
      v = i(() => (c(l('textPrimary')) > 255 / 2 ? 'textInverted' : 'textPrimary')),
      p = i(() => (c(l('textPrimary')) > 255 / 2 ? 'textPrimary' : 'textInverted')),
      f = (b, h, $) => {
        const S = `on${iu(String(b))}`
        return a[S] ? a[S] : ((h = h || v.value), ($ = $ || p.value), c(b) > t.value.colors.threshold ? h : $)
      },
      g = i({
        get: () => t.value.colors.currentPresetName,
        set: (b) => {
          m(b)
        },
      }),
      y = i(() => t.value.colors.presets),
      m = (b) => {
        if (((t.value.colors.currentPresetName = b), !t.value.colors.presets[b]))
          return De(`Preset ${b} does not exist`)
      }
    return {
      colors: a,
      currentPresetName: g,
      presets: y,
      applyPreset: m,
      setColors: o,
      getColors: n,
      getColor: l,
      getComputedColor: r,
      getBoxShadowColor: ps,
      getBoxShadowColorFromBg: Bc,
      getHoverColor: fs,
      getFocusColor: ms,
      getGradientBackground: En,
      getTextColor: f,
      shiftHSLAColor: na,
      setHSLAColor: Tc,
      colorsToCSSVariable: u,
      colorToRgba: ma,
      getStateMaskGradientBackground: Pc,
    }
  },
  gs = G({
    name: 'VaIcon',
    __name: 'VaIcon',
    props: {
      ...pa,
      ...me,
      name: { type: String, default: '' },
      tag: { type: String },
      component: { type: Object },
      color: { type: String },
      rotation: { type: [String, Number] },
      spin: { type: [String, Boolean] },
      flip: { type: String, default: 'off', validator: (e) => ['off', 'horizontal', 'vertical', 'both'].includes(e) },
    },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        { sizeComputed: o } = fa(t),
        { getIcon: n } = bc(),
        l = i(() => n(t.name)),
        r = i(() => t.component || t.tag || l.value.component || l.value.tag || 'i'),
        u = Yt(),
        d = i(() => ({ ...l.value.attrs, ...At(u, ['class']) })),
        c = (m) => {
          if (!(m === void 0 || m === !1)) return m === 'counter-clockwise' ? 'va-icon--spin-reverse' : 'va-icon--spin'
        },
        v = i(() => [l.value.class, c(t.spin ?? l.value.spin)]),
        p = i(() => {
          const m = t.rotation ? `rotate(${t.rotation}deg)` : '',
            b = t.flip === 'vertical' || t.flip === 'both' ? -1 : 1,
            h = t.flip === 'horizontal' || t.flip === 'both' ? -1 : 1
          return `${t.flip === 'off' ? '' : `scale(${b}, ${h})`} ${m}`.trim()
        }),
        f = i(() => ({
          transform: p.value,
          cursor: u.onClick ? 'pointer' : null,
          color: t.color ? a(t.color, void 0, !0) : l.value.color,
          fontSize: o.value,
          height: o.value,
          lineHeight: o.value,
        })),
        g = i(() => u.tabindex ?? -1),
        y = i(() => u.role !== 'button' || g.value < 0)
      return (m, b) => (
        C(),
        U(
          pt(r.value),
          H({ class: ['va-icon', v.value], style: f.value, 'aria-hidden': y.value, notranslate: '' }, d.value),
          {
            default: z(() => [
              V(m.$slots, 'default', {}, () => [
                l.value.content ? (C(), _(be, { key: 0 }, [Te(fe(l.value.content), 1)], 64)) : E('', !0),
              ]),
            ]),
            _: 3,
          },
          16,
          ['class', 'style', 'aria-hidden'],
        )
      )
    },
  }),
  Oe = Q(gs),
  Oc = () => {
    const e = qe(),
      t = e == null ? void 0 : e.appContext.app,
      { globalProperties: a } = t.config
    return ('$vaGlobalVariable' in a || (a.$vaGlobalVariable = Nt({})), a.$vaGlobalVariable)
  },
  ys = (e, t) => {
    const a = Oc()
    return (
      e in a || (a[e] = t),
      i({
        get: () => a[e],
        set: (o) => {
          a[e] = o
        },
      })
    )
  },
  Dt = () => {
    const e = qe(),
      t = ys('uuidCounter', 0)
    return ((e.$vaUuid = e.$vaUuid || `va-${t.value++}`), `va-${t.value}`)
  },
  xc = (e) => {
    const a = `message-list-${Dt()}`,
      o = i(() => ({ id: a, role: 'alert' })),
      n = i(
        () =>
          !!(
            (typeof e.modelValue == 'string' && e.modelValue.length > 0) ||
            (Array.isArray(e.modelValue) && e.modelValue.length > 0)
          ),
      ),
      l = i(() => ({ 'aria-describedby': n.value ? a : void 0, 'aria-invalid': e.hasError }))
    return { messageListAttributes: o, childAttributes: l }
  },
  Pe = (e) => {
    const t = qe().props
    return i(() => {
      const o = t == null ? void 0 : t[e]
      return o === void 0 ? o : Number(o)
    })
  },
  Ec = { class: 'va-message-list__list' },
  Dc = G({
    name: 'VaMessageList',
    inheritAttrs: !1,
    __name: 'VaMessageList',
    props: {
      modelValue: { type: [String, Array], default: '' },
      limit: { type: [Number, String], default: 1 },
      color: { type: String },
      hasError: { type: Boolean, default: !1 },
    },
    setup(e, { expose: t }) {
      const a = e,
        { getColor: o } = Ce(),
        { childAttributes: n, messageListAttributes: l } = xc(a),
        r = Pe('limit'),
        u = i(() =>
          a.modelValue ? (Array.isArray(a.modelValue) ? a.modelValue.slice(0, r.value) : [a.modelValue]) : [],
        ),
        d = i(() => (a.color ? { color: o(a.color) } : {}))
      return (
        t({ messages: u }),
        (c, v) => (
          C(),
          _(
            be,
            null,
            [
              V(c.$slots, 'default', J(ie({ ariaAttributes: s(n), messages: u.value, attrs: c.$attrs }))),
              V(c.$slots, 'messages', J(ie({ ariaAttributes: s(l), messages: u.value })), () => [
                u.value.length > 0
                  ? (C(),
                    _(
                      'div',
                      H({ key: 0, class: 'va-message-list', style: d.value }, s(l)),
                      [
                        R('ul', Ec, [
                          (C(!0),
                          _(
                            be,
                            null,
                            Ie(
                              u.value,
                              (p, f) => (
                                C(),
                                _('li', { key: f, class: 'va-message-list__message' }, [
                                  V(c.$slots, 'message', J(ie({ messages: u.value, message: p })), () => [
                                    e.hasError
                                      ? (C(),
                                        U(s(Oe), {
                                          key: 0,
                                          class: 'va-message-list__icon',
                                          name: 'va-warning',
                                          size: 16,
                                        }))
                                      : E('', !0),
                                    Te(fe(p), 1),
                                  ]),
                                ])
                              ),
                            ),
                            128,
                          )),
                        ]),
                      ],
                      16,
                    ))
                  : E('', !0),
              ]),
            ],
            64,
          )
        )
      )
    },
  }),
  Oo = Q(Dc)
function ua(e, t, a, o) {
  const n = qe(),
    l = i(() => {
      const d = t[e]
      return n != null && n.vnode.props ? e in n.vnode.props && n.vnode.props[e] !== void 0 : d !== void 0
    })
  if (o === void 0)
    return [
      i({
        set(d) {
          a(`update:${e}`, d)
        },
        get() {
          return t[e]
        },
      }),
    ]
  const r = t[e],
    u = D(r === void 0 ? o : r)
  return (
    re(
      () => t[e],
      (d) => {
        d !== void 0 && (u.value = d)
      },
    ),
    [
      i({
        set(d) {
          ;((u.value = d), a(`update:${e}`, d))
        },
        get() {
          return l.value ? t[e] : u.value
        },
      }),
    ]
  )
}
const Fc = (e) => typeof e == 'object' && '_setter' in e,
  Mc = (e, t) => {
    if (!Fc(e)) return
    const a = e._setter
    e._setter = (o) => {
      ;(t(o), a(o))
    }
  },
  Xa = (e) => typeof e == 'function',
  wo = (e) => typeof e == 'string',
  bs = Symbol('FormService'),
  hs = (e) => {
    const t = Lt(bs, null)
    if (!t)
      return {
        forceDirty: D(!1),
        forceHideErrorMessages: D(!1),
        forceHideErrors: D(!1),
        forceHideLoading: D(!1),
        fields: i(() => []),
        registerField: () => {},
        unregisterField: () => {},
        immediate: i(() => !1),
      }
    const a = Dt()
    return (
      Me(() => {
        t.registerField(a, e)
      }),
      et(() => {
        t.unregisterField(a)
      }),
      t
    )
  },
  bl = (e = [], t = null) => (wo(e) && (e = [e]), e.map((a) => (Xa(a) ? a(t) : a))),
  zt = {
    name: { type: String, default: void 0 },
    rules: { type: Array, default: () => [] },
    dirty: { type: Boolean, default: !1 },
    error: { type: Boolean, default: void 0 },
    errorMessages: { type: [Array, String], default: void 0 },
    errorCount: { type: [String, Number], default: 1 },
    success: { type: Boolean, default: !1 },
    messages: { type: [Array, String], default: () => [] },
    immediateValidation: { type: Boolean, default: !1 },
    modelValue: {},
  },
  Xt = ['update:error', 'update:errorMessages', 'update:dirty'],
  uo = (e) => typeof e == 'object' && typeof e.then == 'function',
  Nc = (e, t, a) => {
    const o = D(t.dirty || !1)
    return (
      Mc(e, () => {
        ;((o.value = !0), a('update:dirty', !0))
      }),
      re(
        e,
        (n, l) => {
          n === l && (o.value = !0)
        },
        { deep: !0 },
      ),
      re(
        () => t.dirty,
        (n) => {
          o.value !== n && (o.value = n)
        },
      ),
      { isDirty: o }
    )
  },
  Rc = () => {
    const e = D(!1)
    return {
      isTouched: e,
      onBlur: () => {
        e.value = !0
      },
    }
  },
  zc = (e) => {
    let t = !0
    return (...a) => {
      if (!t) return
      t = !1
      const o = e(...a)
      return (
        Ye(() => {
          t = !0
        }),
        o
      )
    }
  },
  Ht = (e, t, a) => {
    const { reset: o, focus: n } = a,
      [l] = ua('error', e, t, !1),
      [r] = ua('errorMessages', e, t, []),
      u = D(!1),
      { isTouched: d, onBlur: c } = Rc(),
      v = i(() => ({
        'aria-invalid': l.value,
        'aria-errormessage': typeof r.value == 'string' ? r.value : r.value.join(', '),
      })),
      p = () => {
        ;((r.value = []), (l.value = !1), (m.value = !1), (d.value = !1), (u.value = !1))
      },
      f = (T) => {
        let O = !1,
          M = []
        return (
          T.forEach((ae) => {
            wo(ae) ? ((M = [...M, ae]), (O = !0)) : ae === !1 && (O = !0)
          }),
          (r.value = M),
          (l.value = O),
          !O
        )
      },
      g = async () => {
        if (!e.rules || !e.rules.length) return !0
        const T = bl(e.rules.flat(), a.value.value),
          O = T.filter((ae) => uo(ae)),
          M = T.filter((ae) => !uo(ae))
        return O.length
          ? ((u.value = !0),
            Promise.all(O)
              .then((ae) => f([...M, ...ae]))
              .finally(() => {
                u.value = !1
              }))
          : f(M)
      },
      y = zc(() => {
        if (!e.rules || !e.rules.length) return !0
        const T = e.rules.flat(),
          O = bl(T, a.value.value),
          M = O.filter((B) => uo(B)),
          ae = O.filter((B) => !uo(B)),
          oe = ae.some((B) => (wo(B) ? B : B === !1))
        return M.length && !oe
          ? ((u.value = !0),
            Promise.all(M).then((B) => {
              ;(f([...ae, ...B]), (u.value = !1))
            }),
            oe)
          : f(ae)
      })
    St(() => y())
    const { isDirty: m } = Nc(a.value, e, t),
      {
        forceHideErrors: b,
        forceHideLoading: h,
        forceHideErrorMessages: $,
        forceDirty: S,
        immediate: w,
      } = hs({
        isTouched: d,
        isDirty: m,
        isValid: i(() => !l.value),
        isLoading: u,
        errorMessages: r,
        validate: y,
        validateAsync: g,
        resetValidation: p,
        focus: n,
        reset: () => {
          ;(o(), p(), y())
        },
        value: i(() => a.value || e.modelValue),
        name: ut(e, 'name'),
      }),
      I = i(() => e.immediateValidation || w.value)
    let A = !0
    const k = (T) => {
      ;((A = !1),
        T(),
        Ye(() => {
          A = !0
        }))
    }
    return (
      re(
        a.value,
        () => {
          if (A) return y()
        },
        { immediate: I.value },
      ),
      {
        isDirty: m,
        isValid: i(() => !l.value),
        isError: l,
        isTouched: d,
        isLoading: i({
          get: () => (b.value ? !1 : I.value || d.value || m.value || S.value ? u.value : !1),
          set(T) {
            u.value = T
          },
        }),
        computedError: i(() => (b.value ? !1 : I.value || d.value || m.value || S.value ? l.value : !1)),
        computedErrorMessages: i(() => ($.value ? [] : r.value)),
        listeners: { onBlur: c },
        validate: y,
        resetValidation: p,
        withoutValidation: k,
        validationAriaAttributes: v,
      }
    )
  },
  Hc = { class: 'va-message-list-wrapper' },
  xo = G({
    name: 'VaMessageListWrapper',
    __name: 'VaMessageListWrapper',
    props: { ...zt },
    setup(e) {
      const t = e,
        a = i(() => (t.error ? 'danger' : t.success ? 'success' : '')),
        o = ut(t, 'error'),
        n = i(() => (t.error ? t.errorMessages : t.messages)),
        l = i(() => (t.error ? Number(t.errorCount) : 99))
      return (r, u) => (
        C(),
        _('div', Hc, [
          ue(
            s(Oo),
            {
              color: a.value,
              limit: l.value,
              'has-error': o.value,
              'model-value': n.value,
              'inherit-slots': ['message'],
            },
            { default: z((d) => [V(r.$slots, 'default', J(ie(d)))]), _: 3 },
            8,
            ['color', 'limit', 'has-error', 'model-value'],
          ),
        ])
      )
    },
  }),
  jc = (e) => {
    const { globalConfig: t, mergeGlobalConfig: a, setGlobalConfig: o, getGlobalConfig: n } = xt(),
      l = i(() => {
        var r
        const u = la(t.value),
          d = { ...u, colors: Xr(u.colors) },
          c = ia(d, e.value)
        return (
          (r = e.value.colors) != null &&
            r.variables &&
            Object.keys(e.value.colors.variables).forEach((v) => {
              c.colors.variables[v] = e.value.colors.variables[v]
            }),
          c
        )
      })
    return (Ot(Lo, { mergeGlobalConfig: a, setGlobalConfig: o, getGlobalConfig: n, globalConfig: l }), l)
  },
  ja = (e, t) => {
    if (!e) return null
    if (!('type' in e) || e.type === Er || typeof e == 'string') return Re('div', t, e)
    if (e.type === Fr) return e
    if ('$el' in e) return ja(e.$el, t)
    if (e.type === uu) return Re(e.ssContent, t)
    if (e.type === Wa) {
      if (e.children === null) return e
      const a = ja(e.children[0], t)
      return (a && (e.children[0] = Re(a, t)), e)
    }
    if (e.type === be)
      return e.children === null
        ? e
        : e.children.length === 1
          ? Re(be, e.props, [ja(e.children[0], t)])
          : Re('div', t, e)
    if (typeof e.type.render == 'function') {
      const a = Re(e, t)
      if (Array.isArray(a.children) && a.children.length > 1) return Re('div', t, a.children)
    }
    return Re(e, t)
  },
  hl = (e, t = {}, a = {}) => {
    const o = e == null ? void 0 : e(t)
    if (!o) return null
    const n = o.filter((l) => l.type !== Fr)
    return n.length === 0
      ? null
      : n.length === 1
        ? ja(n[0], a)
        : Re('div', { ...a, class: pe([a.class, 'va-headless-wrapper']) }, o)
  },
  Cs = (e, t = {}, a = {}) => {
    const o = e == null ? void 0 : e(t)
    return o ? o.map((n) => ja(n, a)) : null
  },
  Uc = G({
    name: 'VaCssVarsRenderer',
    inheritAttrs: !1,
    setup(e, { slots: t, attrs: a }) {
      const { colorsToCSSVariable: o, colors: n } = Ce(),
        l = i(() => o(n))
      return () => Re(be, a, Cs(t.default, {}, { style: l.value }) || void 0)
    },
  }),
  Qa = G({
    name: 'VaConfig',
    inheritAttrs: !1,
    __name: 'VaConfig',
    props: {
      ...me,
      components: { type: Object, default: () => ({}) },
      colors: { type: Object },
      i18n: { type: Object },
    },
    setup(e) {
      const t = e,
        a = Tn(),
        o = i(() => [...a.value, t.components])
      ;(qr(o),
        jc(
          i(() => {
            const l = {}
            return (t.colors && (l.colors = t.colors), t.i18n && (l.i18n = t.i18n), l)
          }),
        ))
      const n = i(() => !!t.colors)
      return (l, r) =>
        n.value
          ? (C(), U(s(Uc), J(H({ key: 0 }, l.$attrs)), { default: z(() => [V(l.$slots, 'default')]), _: 3 }, 16))
          : V(l.$slots, 'default', { key: 1 })
    },
  }),
  Wc = { class: 'va-separator', 'aria-hidden': 'true' },
  Kc = G({
    name: 'VaSeparator',
    __name: 'VaSeparator',
    setup(e) {
      return (t, a) => (C(), _('div', Wc))
    },
  }),
  Gc = { class: 'va-spacer', 'aria-hidden': 'true' },
  qc = G({
    name: 'VaSpacer',
    __name: 'VaSpacer',
    setup(e) {
      return (t, a) => (C(), _('div', Gc))
    },
  }),
  Yc = (e) => {
    if (!e) return 0
    const t = e.offsetWidth - e.clientWidth,
      a = e.offsetHeight - e.clientHeight
    return Math.max(t, a)
  },
  Xc = (e) => {
    const t = D({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 })
    let a, o
    const n = () => {
      e.value && (t.value = e.value.getBoundingClientRect())
    }
    return (
      Me(() => {
        ;((a = new ResizeObserver(n)),
          (o = new MutationObserver(n)),
          e.value && a.observe(e.value),
          e.value && o.observe(e.value, { attributes: !0, childList: !0, subtree: !0 }),
          window.addEventListener('resize', n),
          window.addEventListener('scroll', n),
          n())
      }),
      et(() => {
        ;(a == null || a.disconnect(),
          o == null || o.disconnect(),
          window.removeEventListener('resize', n),
          window.removeEventListener('scroll', n),
          (a = void 0),
          (o = void 0))
      }),
      t
    )
  },
  ga = () => typeof window > 'u',
  Fn = () => !ga(),
  Ss = () => (typeof window > 'u' ? void 0 : window),
  Jc = {},
  It = () => (ga() ? (typeof globalThis > 'u' ? Jc : globalThis) : window),
  $s = (e) => {
    const t = i(Fn),
      a = D(null)
    return (
      re(
        t,
        () => {
          t.value && (a.value = e())
        },
        { immediate: !0 },
      ),
      a
    )
  },
  Eo = () => $s(() => window),
  Xe = (e) => {
    if (e && typeof e == 'object' && ((e = s(e)), !!e)) return typeof e.$el < 'u' ? e.$el : e
  },
  hn = (e, ...t) => {
    if (!(!e || typeof e != 'object')) {
      if ('addEventListener' in e && typeof e.addEventListener == 'function') {
        e.addEventListener(...t)
        return
      }
      'parentElement' in e && hn(e.parentElement, ...t)
    }
  },
  Cn = (e, ...t) => {
    if (!(!e || typeof e != 'object')) {
      if ('removeEventListener' in e && typeof e.removeEventListener == 'function') {
        e.removeEventListener(...t)
        return
      }
      'parentElement' in e && Cn(e.parentElement, ...t)
    }
  },
  We = (e, t, a) => {
    const o = a && typeof a != 'boolean' ? a : Eo(),
      n = typeof a == 'boolean' ? a : !1
    re(
      o,
      (l, r) => {
        Array.isArray(e)
          ? e.forEach((u) => {
              ;(hn(Xe(s(l)), u, t, n), Cn(Xe(s(r)), u, t, n))
            })
          : (hn(Xe(s(l)), e, t, n), Cn(Xe(s(r)), e, t, n))
      },
      { immediate: !0 },
    )
  },
  Cl = (e) => {
    if (Array.isArray(e)) return e.map(s)
    const t = s(e)
    return Array.isArray(t) ? t : [t]
  },
  ca = (e, t) => {
    let a
    const o = (n) => {
      n.forEach((l) => {
        const r = s(l)
        if (r) {
          if (!(r instanceof Element))
            throw (
              console.error('Vuestic: Trying to observe non-HTMLElement', { target: r, array: e }),
              new Error('Vuestic: Unable to observe non-HTMLElement')
            )
          r && (a == null || a.observe(r))
        }
      })
    }
    return (
      re(e, (n) => {
        ;(a == null || a.disconnect(), o(Cl(n)))
      }),
      Me(() => {
        ;((a = new ResizeObserver(t)), o(Cl(e)))
      }),
      et(() => (a == null ? void 0 : a.disconnect())),
      a
    )
  },
  Zc = G({
    __name: 'VaStickyScrollbar',
    props: { el: {}, direction: { default: 'horizontal' }, offset: { default: 0 } },
    setup(e) {
      const t = e,
        a = D(null),
        o = Pe('offset'),
        n = i(() => {
          var v
          return t.el ? t.el : (((v = a.value) == null ? void 0 : v.parentNode) ?? null)
        }),
        l = Xc(n),
        r = i(() => {
          const v = n.value
          if (!v) return {}
          const p = v,
            f = Yc(p),
            { bottom: g, left: y, right: m, top: b } = l.value
          return t.direction === 'vertical'
            ? y > window.innerWidth
              ? { display: 'none' }
              : m < window.innerWidth
                ? { display: 'none' }
                : {
                    position: 'fixed',
                    top: `${b}px`,
                    right: 0,
                    height: `${p.clientHeight}px`,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }
            : b > window.innerHeight
              ? { display: 'none' }
              : g < window.innerHeight
                ? { display: 'none' }
                : {
                    position: 'fixed',
                    top: `${Math.min(g, window.innerHeight) - f - Number(o.value)}px`,
                    width: `${p.clientWidth}px`,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                  }
        })
      ;(We(
        'scroll',
        (v) => {
          var p, f
          a.value &&
            (t.direction === 'horizontal'
              ? (p = n.value) == null || p.scrollTo({ left: a.value.scrollLeft })
              : (f = n.value) == null || f.scrollTo({ top: a.value.scrollTop }))
        },
        a,
      ),
        We(
          'scroll',
          (v) => {
            var p, f, g, y
            if (a.value)
              if (t.direction === 'horizontal') {
                if (((p = n.value) == null ? void 0 : p.scrollLeft) === a.value.scrollLeft) return
                a.value.scrollTo({ left: (f = n.value) == null ? void 0 : f.scrollLeft })
              } else {
                if (((g = n.value) == null ? void 0 : g.scrollTop) === a.value.scrollTop) return
                a.value.scrollTo({ top: (y = n.value) == null ? void 0 : y.scrollTop })
              }
          },
          n,
        ))
      const u = D(0),
        d = D(0)
      ca(
        i(() => (n.value ? [...n.value.children] : [])),
        () => {
          ;((u.value = n.value.scrollWidth), (d.value = n.value.scrollHeight))
        },
      )
      const c = i(() =>
        t.direction === 'vertical'
          ? { width: '1px', height: `${d.value}px` }
          : { height: '1px', width: `${u.value}px` },
      )
      return (v, p) => (
        C(),
        _('div', { style: Y(r.value), ref_key: 'currentEl', ref: a }, [R('div', { style: Y(c.value) }, null, 4)], 4)
      )
    },
  }),
  eo = () => {
    const e = D(!1)
    return (
      Me(() => {
        e.value = !0
      }),
      et(() => {
        e.value = !1
      }),
      e
    )
  },
  Qc = ['xs', 'sm', 'md', 'lg', 'xl', 'smUp', 'mdUp', 'lgUp', 'smDown', 'mdDown', 'lgDown'],
  ed = Qc.reduce((e, t) => ((e[t] = !1), e), {}),
  uS = () => {
    const e = Lt(jr, {}),
      t = eo(),
      { globalConfig: a } = xt(),
      o = i(() => {
        const l = a.value.breakpoint
        return (l || De('useBreakpoint: breakpointConfig is not defined!'), l ?? {})
      }),
      n = i(() =>
        o.value.enabled
          ? { width: void 0, height: void 0, current: void 0, thresholds: o.value.thresholds, ...ed }
          : {},
      )
    return Pn(() => (t.value ? e : n.value))
  },
  _o = (e) => {
    const t = qe()
    let a = () => {}
    const o = cu(
      (n, l) => (
        (a = l),
        {
          get() {
            var r
            return (n(), (r = t.proxy) == null ? void 0 : r.$refs[e])
          },
          set(r) {},
        }
      ),
    )
    return (Me(a), Mr(a), o)
  },
  cS = (e) => {
    const t = typeof e == 'string' ? _o(e) : typeof e > 'u' ? D() : e
    return {
      formRef: t,
      isValid: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.isValid) || !1
      }),
      immediate: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.immediate) || !1
      }),
      isLoading: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.isLoading) || !1
      }),
      isDirty: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.isDirty) || !1
      }),
      isTouched: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.isTouched) || !1
      }),
      fields: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.fields) ?? []
      }),
      fieldsNamed: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.fieldsNamed) ?? []
      }),
      fieldNames: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.fieldNames) ?? []
      }),
      formData: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.formData) ?? {}
      }),
      errorMessages: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.errorMessages) || []
      }),
      errorMessagesNamed: i(() => {
        var a
        return ((a = t.value) == null ? void 0 : a.errorMessagesNamed) || {}
      }),
      validate: () => {
        var a
        return (a = t.value) == null ? void 0 : a.validate()
      },
      validateAsync: () => {
        var a
        return (a = t.value) == null ? void 0 : a.validateAsync()
      },
      reset: () => {
        var a
        return (a = t.value) == null ? void 0 : a.reset()
      },
      resetValidation: () => {
        var a
        return (a = t.value) == null ? void 0 : a.resetValidation()
      },
      focus: () => {
        var a
        return (a = t.value) == null ? void 0 : a.focus()
      },
      focusInvalidField: () => {
        var a
        return (a = t.value) == null ? void 0 : a.focusInvalidField()
      },
    }
  },
  ks = (e) => {
    let t
    return (
      e.startsWith('rgba')
        ? (t = e.substring(5, e.length - 1).split(','))
        : (t = e.substring(4, e.length - 1).split(',')),
      (t[0] = Number(t[0])),
      (t[1] = Number(t[1])),
      (t[2] = Number(t[2])),
      t[3] === void 0 ? (t[3] = 1) : (t[3] = Number(t[3])),
      t
    )
  },
  Sl = (e) =>
    '#' +
    (e[0] | 256).toString(16).slice(1) +
    (e[1] | 256).toString(16).slice(1) +
    (e[2] | 256).toString(16).slice(1) +
    ((e[3] * 255) | 256).toString(16).slice(1),
  td = (e) => {
    const t = []
    let a = e
    for (; a; ) {
      if (!(a instanceof HTMLElement) || !a) return t
      const { backgroundColor: o, willChange: n } = window.getComputedStyle(a),
        l = n.includes('background'),
        r = ks(o)
      if (r[3] === 1 && !l) return (t.push(a), t)
      ;((r[3] !== 0 || l) && t.push(a), (a = a.parentElement))
    }
    return t
  },
  $l = 'va-background-watcher',
  ad = (e, t) => (
    (e.className = $l + ' ' + e.className),
    e.addEventListener('transitionend', (a) => {
      a.target === e && t()
    }),
    () => {
      ;((e.className = e.className.replace($l, '')), e.removeEventListener('transitionend', t))
    }
  ),
  od = (e, t) => {
    const a = e.map((o) => ad(o, t))
    return () => {
      a.forEach((o) => o())
    }
  },
  nd = (e, t) => {
    const a = t[3]
    if (a === 1) return t
    if (a === 0) return e
    const o = Math.round(e[0] * (1 - a) + t[0] * a),
      n = Math.round(e[1] * (1 - a) + t[1] * a),
      l = Math.round(e[2] * (1 - a) + t[2] * a)
    return [o, n, l, 1]
  },
  kl = (e) => {
    let t = [0, 0, 0, 0]
    for (let a = e.length - 1; a >= 0; a--) t = nd(t, ks(window.getComputedStyle(e[a]).backgroundColor))
    return t
  },
  ws = (e) => {
    const t = D('#000000')
    let a = () => {}
    return (
      St(() => {
        if ((a(), e.value)) {
          const o = td(e.value)
          ;((a = od(o, () => {
            t.value = Sl(kl(o))
          })),
            (t.value = Sl(kl(o))))
        }
      }),
      t
    )
  },
  _s = (e) => e.config.globalProperties,
  qt = (e, t, a) => {
    const o = _s(e)
    o[t] = a
  },
  ld = (e, t) => _s(e)[t],
  Vs = Et((e = {}) => ({
    install(t) {
      const a = Jr(e)
      ;(e != null &&
        e.componentsAll &&
        console.warn(
          'Global config -> `componentsAll` was moved to Global config -> components.all. Please replace this to make it work. More info here: https://github.com/epicmaxco/vuestic-ui/issues/1967',
        ),
        t.provide(Lo, a),
        qt(t, '$vaConfig', a))
    },
  })),
  Mn = (e, t) => {
    if (ga()) return
    let a = document.getElementById(e)
    a
      ? (a.innerHTML = t())
      : ((a = document.createElement('style')),
        a.setAttribute('type', 'text/css'),
        a.setAttribute('id', e),
        (a.innerHTML = t()),
        document.head.append(a))
  },
  rd = (e) => {
    var t
    ;(t = document.getElementById(e)) == null || t.remove()
  },
  wl = (e, t) => `${ko(e)}: ${t};
`,
  an = 'data-va-app',
  _l = (e) => `va-color-variables-${e}`,
  sd = (e, t) => {
    const { colors: a, getTextColor: o, getColor: n, currentPresetName: l } = Ce(),
      r = (g = a) => {
        if (!g) return
        const y = Object.keys(g),
          m = y.map((h) => `${ko(h)}: ${g[h]}`).join(';'),
          b = y.map((h) => `${ko(`on-${h}`)}: ${n(o(g[h]))}`).join(';')
        return `${m};${b}`
      },
      u = (g = a, y = ':root, :host') => {
        const m = Object.keys(g)
        let b = `${y} {
`
        return (
          m.forEach((h) => {
            b += wl(h, g[h])
          }),
          m.forEach((h) => {
            b += wl(`on-${h}`, n(o(g[h])))
          }),
          (b += `}
`),
          b
        )
      },
      d = i(() => e._uid),
      c = i(() => ':root, :host'),
      v = (g) => {
        if (!g || ga()) return
        const y = u(g, c.value)
        Mn(_l(d.value), () => y)
      }
    function p() {
      return { [an]: d.value }
    }
    const f = e.mount
    return (
      (e.mount = function (...g) {
        const y = f.apply(this, g),
          m = e._container,
          b = m.getAttribute(an)
        return (b && b !== d.value.toString() && rd(_l(b)), m.setAttribute(an, d.value.toString()), y)
      }),
      re(
        a,
        (g) => {
          v(g)
        },
        { immediate: !0, deep: !0 },
      ),
      {
        colors: a,
        currentPresetName: l,
        getAppStylesRootAttribute: p,
        renderCSSVariables: r,
        updateColors: v,
        renderCSSVariablesStyleContent: u,
      }
    )
  },
  Bs = Et((e) => ({
    install(t) {
      qt(t, '$vaColorConfig', sd(t))
    },
  }))
let id = 0
const on = (e = 4) =>
    Math.random()
      .toString(36)
      .substring(2, e + 2),
  Ts = () => `${on(8)}-${on(4)}-${on(4)}-${++id}`
function ud() {
  const e = Nt({ width: void 0, height: void 0 }),
    t = () => {
      ;((e.width = window == null ? void 0 : window.innerWidth),
        (e.height = window == null ? void 0 : window.innerHeight))
    },
    a = i(Fn)
  return (
    re(
      a,
      (o) => {
        o && t()
      },
      { immediate: !0 },
    ),
    We('resize', t, !0),
    { windowSizes: e }
  )
}
const ya = () => $s(() => document),
  cd = (e) => {
    var t
    const a = (t = ld(e, '$vaConfig')) == null ? void 0 : t.globalConfig
    if (!a) return (De('createBreakpointConfigPlugin: globalConfig is not defined!'), {})
    const o = i(() => {
      const f = a.value.breakpoint
      return (f || De('createBreakpointConfigPlugin: breakpointConfig is not defined!'), f ?? {})
    })
    if (!o.value.enabled) return {}
    if (!o.value.thresholds || !Object.values(o.value.thresholds).length)
      return (De('createBreakpointConfigPlugin: there are no defined thresholds!'), {})
    const { windowSizes: n } = ud(),
      l = i(Fn),
      r = i(() => {
        if (!(!l.value || !n.width))
          return Object.entries(o.value.thresholds).reduce((f, [g, y]) => (n.width >= y && (f = g), f), 'xs')
      }),
      u = i(() => Object.keys(o.value.thresholds).reduce((f, g) => ((f[g] = `va-screen-${g}`), f), {})),
      d = () => {
        let f = ''
        return (
          Object.values(o.value.thresholds).forEach((g, y) => {
            ;((f += `@media screen and (min-width: ${g}px) {`),
              (f += `:root { --va-media-ratio: ${(y + 1) * 0.2} }`),
              (f += `}
`))
          }),
          f
        )
      },
      c = i(Ts)
    Mn(`va-helpers-media-${c.value}`, d)
    const v = ya()
    re(
      r,
      (f) => {
        !f ||
          !o.value.bodyClass ||
          !v.value ||
          (v.value.body.classList.forEach((g) => {
            Object.values(u.value).includes(g) && v.value.body.classList.remove(g)
          }),
          v.value.body.classList.add(u.value[f]))
      },
      { immediate: !0 },
    )
    const p = i(() => {
      const f = r.value === 'xs',
        g = r.value === 'sm',
        y = r.value === 'md',
        m = r.value === 'lg',
        b = r.value === 'xl'
      return {
        xs: f,
        sm: g,
        md: y,
        lg: m,
        xl: b,
        smUp: g || y || m || b,
        mdUp: y || m || b,
        lgUp: m || b,
        smDown: f || g,
        mdDown: f || g || y,
        lgDown: f || g || y || m,
      }
    })
    return Pn(() => ({
      width: n.width,
      height: n.height,
      current: r.value,
      thresholds: o.value.thresholds,
      ...p.value,
    }))
  },
  dd = Et(() => ({
    install(e) {
      const t = cd(e)
      ;(e.provide(jr, t), qt(e, '$vaBreakpoint', t))
    },
  })),
  vd = 5,
  aa = D([]),
  pd = (e) => {
    var t
    return ((t = e.component) == null ? void 0 : t.props) || {}
  },
  fd = (e) => (e.el ? e.el.offsetHeight + vd : 0),
  md = (e) => {
    const t = qe(),
      a = i(() => {
        const o = aa.value.findIndex((n) => n === t.vnode)
        return o === -1
          ? 0
          : aa.value.slice(o + 1).reduce((n, l) => {
              const { position: r } = pd(l),
                { position: u } = e
              return u === r ? fd(l) + n : n
            }, 0)
      })
    return (
      Me(() => {
        aa.value.unshift(t.vnode)
      }),
      et(() => {
        aa.value = aa.value.filter((o) => o !== t.vnode)
      }),
      {
        yOffset: a,
        updateYOffset: () => {
          aa.value = aa.value.filter((o) => o !== t.vnode)
        },
      }
    )
  },
  gd = () => {
    let e
    return { start: (...o) => ((e = window.setTimeout(...o)), e), clear: () => e && window.clearTimeout(e) }
  },
  yd = (e) => e.startsWith('$t:'),
  ye = (e) => ({ type: String, default: e }),
  Vl = (e, t) => (
    t &&
      Object.keys(t).forEach((a) => {
        e = e.replace(`{${a}}`, String(t[a]))
      }),
    e
  ),
  He = () => {
    const { globalConfig: e } = xt(),
      t = i(() => e.value.i18n)
    function a(n, l) {
      var r
      const u = (r = qe()) == null ? void 0 : r.appContext.config.globalProperties.$t
      if (typeof u == 'function') {
        const c = u(`vuestic.${n}`, l)
        if (c) return c
      }
      const d = t.value[n]
      return d ? Vl(d, l) || n : (De(`${n} not found in VuesticUI i18n config`), n)
    }
    function o(n, l) {
      return n ? (yd(n) ? a(n.slice(3), l) : Vl(n, l) || n) : ''
    }
    return { tp: o, t: a }
  },
  tt = (e, t = !1) => {
    const { props: a } = qe(),
      { getColor: o, getTextColor: n } = Ce()
    return {
      textColorComputed: i(() => {
        if (a.textColor) return o(a.textColor)
        const r = e ? s(e) : a.color
        if (!r) return 'currentColor'
        const u = o(r)
        return Lc(u) ? 'currentColor' : s(t) ? u : o(n(u))
      }),
    }
  },
  bd = ['role', 'aria-live'],
  hd = { class: 'va-toast__group' },
  Cd = ['textContent'],
  Sd = { class: 'va-toast__content' },
  $d = ['innerHTML'],
  kd = ['textContent'],
  wd = { key: 1, class: 'va-toast__content' },
  _d = G({
    name: 'VaToast',
    __name: 'VaToast',
    props: {
      ...me,
      title: { type: String, default: '' },
      offsetY: { type: [Number, String], default: 16 },
      offsetX: { type: [Number, String], default: 16 },
      message: { type: [String, Function], default: '' },
      dangerouslyUseHtmlString: { type: Boolean, default: !1 },
      icon: { type: String, default: 'close' },
      customClass: { type: String, default: '' },
      duration: { type: [Number, String], default: 5e3 },
      color: { type: String, default: 'primary' },
      closeable: { type: Boolean, default: !0 },
      onClose: { type: Function },
      onClick: { type: Function },
      multiLine: { type: Boolean, default: !1 },
      position: {
        type: String,
        default: 'top-right',
        validator: (e) =>
          ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'].includes(e),
      },
      render: { type: Function },
      ariaCloseLabel: ye('$t:close'),
      role: { type: String, default: void 0 },
      inline: { type: Boolean, default: !1 },
    },
    emits: ['on-click', 'on-close'],
    setup(e, { emit: t }) {
      const a = G({
          name: 'VaToastRenderer',
          props: { render: { type: Function, required: !0 } },
          setup: (oe) => () => oe.render(),
        }),
        { tp: o } = He(),
        n = e,
        l = t,
        r = we(),
        { getColor: u } = Ce(),
        { textColorComputed: d } = tt(i(() => u(n.color))),
        c = Pe('offsetY'),
        v = Pe('offsetX'),
        p = Pe('duration'),
        f = D(!1),
        { yOffset: g, updateYOffset: y } = md(n),
        m = i(() => ({
          vertical: n.position.includes('top') ? 'top' : 'bottom',
          horizontal: n.position.includes('center') ? 'center' : n.position.includes('right') ? 'right' : 'left',
        })),
        b = () => {
          const oe = m.value.vertical,
            B = m.value.horizontal
          return B === 'center'
            ? { [oe]: `${c.value + g.value}px`, left: '50%', '--va-toast-x-shift': '-50%' }
            : { [oe]: `${c.value + g.value}px`, [B]: `${v.value}px` }
        },
        h = i(() => [
          n.customClass,
          n.multiLine ? 'va-toast--multiline' : '',
          n.inline ? 'va-toast--inline' : '',
          [`va-toast--${n.position}`],
        ]),
        $ = i(() => ({ ...b(), backgroundColor: u(n.color), color: d.value })),
        S = i(() => (n.role === 'status' ? 'polite' : 'assertive')),
        w = i(() => (typeof n.message == 'function' ? n.message() : n.message)),
        I = () => {
          var oe, B
          ;((oe = r.value) == null || oe.removeEventListener('transitionend', I), (B = r.value) == null || B.remove())
        },
        A = () => {
          typeof n.onClick == 'function' ? n.onClick() : l('on-click')
        },
        k = () => {
          ;((f.value = !1), y())
        },
        T = () => {
          ;(typeof n.onClose == 'function' ? n.onClose() : l('on-close'), I())
        },
        O = gd(),
        M = O.clear,
        ae = () => {
          p.value > 0 && O.start(() => f.value && k(), p.value)
        }
      return (
        Me(() => {
          ;((f.value = !0), ae())
        }),
        (oe, B) => (
          C(),
          U(
            Po,
            { name: 'va-toast-fade', onAfterLeave: T },
            {
              default: z(() => [
                Bt(
                  R(
                    'div',
                    {
                      ref_key: 'rootElement',
                      ref: r,
                      role: (oe.$props.role ?? oe.$props.closeable) ? 'alertdialog' : 'alert',
                      'aria-live': S.value,
                      'aria-atomic': 'true',
                      class: pe(['va-toast', h.value]),
                      style: Y($.value),
                      onMouseenter: B[0] || (B[0] = (...K) => s(M) && s(M)(...K)),
                      onMouseleave: ae,
                      onClick: A,
                    },
                    [
                      R('div', hd, [
                        oe.$props.title
                          ? (C(),
                            _(
                              'h2',
                              { key: 0, class: 'va-toast__title', textContent: fe(oe.$props.title) },
                              null,
                              8,
                              Cd,
                            ))
                          : E('', !0),
                        Bt(
                          R(
                            'div',
                            Sd,
                            [
                              oe.$props.dangerouslyUseHtmlString
                                ? (C(), _('div', { key: 0, innerHTML: w.value }, null, 8, $d))
                                : (C(), _('p', { key: 1, textContent: fe(w.value) }, null, 8, kd)),
                            ],
                            512,
                          ),
                          [[Ka, oe.$props.message]],
                        ),
                        oe.$props.render
                          ? (C(), _('div', wd, [ue(s(a), { render: oe.$props.render }, null, 8, ['render'])]))
                          : E('', !0),
                        oe.$props.closeable
                          ? (C(),
                            U(
                              gs,
                              {
                                key: 2,
                                class: 'va-toast__close-icon',
                                role: 'button',
                                'aria-label': s(o)(oe.$props.ariaCloseLabel),
                                tabindex: '0',
                                size: '1rem',
                                name: oe.$props.icon,
                                onClick: ne(k, ['stop']),
                                onKeydown: se(ne(k, ['stop']), ['enter']),
                              },
                              null,
                              8,
                              ['aria-label', 'name', 'onKeydown'],
                            ))
                          : E('', !0),
                      ]),
                    ],
                    46,
                    bd,
                  ),
                  [[Ka, f.value]],
                ),
              ]),
              _: 1,
            },
          )
        )
      )
    },
  }),
  Is = Rt(_d)
let Ja = 1
It().vaToastInstances = []
const Nn = (e) => {
    var t
    return ((t = e.component) == null ? void 0 : t.props) || {}
  },
  Vd = (e, t) => {
    if (!e) return
    if (!It().vaToastInstances.length) {
      Ja = 1
      return
    }
    It().vaToastInstances.findIndex((o) => o === e) < 0 ||
      (t(),
      (It().vaToastInstances = It().vaToastInstances.reduce((o, n, l) => (n === e ? o : [...o, n]), [])),
      It().vaToastInstances.length || (Ja = 1))
  },
  Bd = (e, t) => {
    ;(e && (Ga(null, e), e.remove()), (e = null))
  },
  Td = (e, { props: t, children: a, element: o, appContext: n } = {}) => {
    let l = o,
      r
    return (
      (r = ue(
        e,
        {
          ...t,
          onClose: () => {
            ;(Vd(r, () => Bd(l)), t != null && t.onClose && t.onClose())
          },
        },
        a,
      )),
      n && (r.appContext = n),
      l ? Ga(r, l) : typeof document < 'u' && Ga(r, (l = document.createElement('div'))),
      { vNode: r, el: l }
    )
  },
  Ps = (e) => {
    if (!It().vaToastInstances.length) {
      Ja = 1
      return
    }
    It().vaToastInstances.forEach((t) => {
      ;(e && t.appContext !== e) || Nn(t).onClose()
    })
  },
  Sn = (e) => {
    const t = It().vaToastInstances.find((a) => {
      var o
      return ((o = a.el) == null ? void 0 : o.id) === e
    })
    t && Nn(t).onClose()
  },
  Id = (e) => (typeof e == 'string' ? { message: e } : e),
  As = (e, t) => {
    const { vNode: a, el: o } = Td(Is, { appContext: t, props: Id(e) }),
      n = Nn(a)
    return o && a.el && n
      ? (document.body.appendChild(o.childNodes[0]),
        (a.el.id = 'notification_' + Ja),
        (Ja += 1),
        It().vaToastInstances.push(a),
        a.el.id)
      : null
  },
  Pd = (e) => ({
    init(t) {
      return As(t, e == null ? void 0 : e._context)
    },
    close(t) {
      Sn(t)
    },
    closeAll(t = !1) {
      Ps(t || e == null ? void 0 : e._context)
    },
  }),
  Ad = Et(() => ({
    install(e) {
      qt(e, '$vaToast', Pd(e))
    },
  })),
  Bl = {
    closeDropdown() {
      let e = this
      for (; (e = e.$parent); )
        if (e.$options.name === 'VaDropdown') {
          e.hide()
          break
        }
    },
  },
  Ld = Et(() => ({
    install(e) {
      ;(qt(e, '$closeDropdown', Bl.closeDropdown), qt(e, '$vaDropdown', Bl))
    },
  })),
  Od = (e, t, a) => {
    const o = qe()
    if (!o) throw new Error('`useButtonBackground` hook must be used only inside of setup function!')
    const n = o.props,
      { getColor: l, getGradientBackground: r } = Ce(),
      u = i(() => (n.plain ? 'transparent' : n.gradient ? r(e.value) : e.value)),
      d = i(() => !n.plain && a.value),
      c = i(() => !n.plain && t.value),
      v = i(() =>
        c.value && n.pressedBehavior === 'opacity'
          ? n.pressedOpacity
          : d.value && n.hoverBehavior === 'opacity'
            ? Number(n.hoverOpacity)
            : Number(n.backgroundOpacity),
      ),
      p = i(() => d.value && n.hoverBehavior === 'mask'),
      f = i(() => c.value && n.pressedBehavior === 'mask'),
      g = i(() => (f.value ? n.pressedOpacity : p.value ? Number(n.hoverOpacity) : 0)),
      y = i(() => (f.value ? l(n.pressedMaskColor) : p.value ? l(n.hoverMaskColor) : 'transparent'))
    return { backgroundColor: u, backgroundColorOpacity: v, backgroundMaskOpacity: g, backgroundMaskColor: y }
  },
  ba = {
    tag: { type: String, default: 'span' },
    to: { type: [String, Object], default: void 0 },
    replace: { type: Boolean, default: void 0 },
    append: { type: Boolean, default: void 0 },
    exact: { type: Boolean, default: void 0 },
    activeClass: { type: String, default: void 0 },
    exactActiveClass: { type: String, default: void 0 },
    href: { type: String, default: void 0 },
    target: { type: String, default: void 0 },
    disabled: { type: Boolean, default: !1 },
  },
  Jt = (e) => {
    const t = qe(),
      a = i(() => (t == null ? void 0 : t.appContext.config.globalProperties)),
      o = i(() => {
        var p
        return (p = a.value) == null ? void 0 : p.$router
      }),
      n = i(() => {
        var p
        return (p = a.value) == null ? void 0 : p.$route
      }),
      { getGlobalConfig: l } = xt(),
      r = i(() => {
        if (e.disabled) return e.tag
        if (e.href && !e.to) return 'a'
        const p = l()
        return p.routerComponent && e.to
          ? p.routerComponent
          : e.to && o.value !== void 0
            ? 'router-link'
            : e.to && o.value === void 0
              ? 'a'
              : e.tag || 'div'
      }),
      u = i(() => (e.disabled ? !1 : !!(e.href || e.to))),
      d = i(() =>
        u.value
          ? r.value === 'a'
            ? { target: e.target, href: v.value }
            : {
                target: e.target,
                to: e.to,
                replace: e.replace,
                append: e.append,
                activeClass: e.activeClass,
                exact: e.exact,
                exactActiveClass: e.exactActiveClass,
              }
          : {},
      ),
      c = i(() => {
        if (!o.value || !e.to) return !1
        const p = o.value.resolve(e.to).href,
          f = o.value.currentRoute.value.path
        return p.replace('#', '') === f.replace('#', '')
      }),
      v = i(() => {
        var p
        return e.href
          ? e.href
          : n.value === void 0 && e.to
            ? e.to
            : e.to
              ? (p = o.value) == null
                ? void 0
                : p.resolve(e.to, n.value).href
              : void 0
      })
    return { isLinkTag: u, tagComputed: r, hrefComputed: v, isActiveRouterLink: c, linkAttributesComputed: d }
  },
  xd = (e) => {
    const { linkAttributesComputed: t, isLinkTag: a } = Jt(e),
      o = i(() => (a.value ? void 0 : e.type)),
      n = i(() => {
        const l = { 'aria-disabled': !!e.disabled, disabled: !!e.disabled }
        return a.value ? l : { type: o.value, tabindex: e.loading || e.disabled ? -1 : 0, ...l }
      })
    return i(() => ({ ...t.value, ...n.value }))
  },
  Ed = (e) => {
    var t, a, o
    if (ga()) return e
    if (e > 0) {
      const n = (t = window == null ? void 0 : window.navigator) == null ? void 0 : t.userAgent,
        l =
          n &&
          /^((?!chrome|android).)*safari/i.test(
            (a = window == null ? void 0 : window.navigator) == null ? void 0 : a.userAgent,
          ),
        r =
          n && /(version.)15|16/i.test((o = window == null ? void 0 : window.navigator) == null ? void 0 : o.userAgent)
      if (l && !r) return e < 1 ? 1 - e : e
    }
    return e
  },
  Dd = (e, t, a, o) => {
    const n = qe()
    if (!n) throw new Error('`useButtonTextColor` hook must be used only inside of setup function!')
    const l = n.props,
      { getColor: r, colorToRgba: u, getStateMaskGradientBackground: d } = Ce(),
      c = i(() => ({
        background: 'transparent',
        color: e.value,
        '-webkit-background-clip': 'text',
        'background-clip': 'text',
        opacity: g.value,
      })),
      v = (y, m, b) => {
        const h = r(y)
        let $
        return (
          b === 'opacity'
            ? ($ = { color: u(e.value, m) })
            : ($ = { background: d(t.value, h, m), color: m < 1 ? u(e.value, Ed(m)) : h }),
          { ...c.value, ...$ }
        )
      },
      p = i(() => v(l.hoverMaskColor, Number(l.hoverOpacity), l.hoverBehavior)),
      f = i(() => v(l.pressedMaskColor, l.pressedOpacity, l.pressedBehavior)),
      g = i(() => {
        if (!l.disabled) return l.textOpacity === 1 || (o.value && !a.value) ? 1 : a.value ? 0.9 : l.textOpacity
      })
    return i(() => {
      const y = { color: e.value, background: 'transparent' }
      return (
        l.plain && Object.assign(y, c.value, { background: e.value }),
        l.plain ? (a.value ? f.value : o.value ? p.value : y) : y
      )
    })
  },
  da = (e, t, a) => Math.min(Math.max(e, t), a),
  Fd = { class: 'va-progress-circle__wrapper', viewBox: '0 0 40 40' },
  Md = ['r', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset'],
  Nd = G({
    name: 'VaProgressCircle',
    __name: 'VaProgressCircle',
    props: {
      ...pa,
      ...me,
      modelValue: { type: [Number, String], default: 0 },
      indeterminate: { type: Boolean, default: !1 },
      thickness: { type: [Number, String], default: 0.06 },
      color: { type: String, default: 'primary' },
      ariaLabel: ye('$t:progressState'),
    },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        { sizeComputed: o } = fa(t),
        n = i(() => (da(Number(t.thickness), 0, 1) / 2) * 100),
        l = i(() => 20 - (20 * n.value) / 100),
        r = i(() => 2 * Math.PI * l.value),
        u = i(() => r.value * (1 - da(Number(t.modelValue), 0, 100) / 100)),
        d = i(() => a(t.color, void 0, !0)),
        { tp: c } = He(),
        v = i(() => ({ color: d.value })),
        p = i(() => ({ width: o.value, height: o.value })),
        f = i(() => ({ 'va-progress-circle--indeterminate': t.indeterminate })),
        g = i(() => ({
          role: 'progressbar',
          'aria-label': c(t.ariaLabel),
          'aria-valuenow': t.indeterminate ? void 0 : t.modelValue,
        }))
      return (y, m) => (
        C(),
        _(
          'div',
          H({ class: ['va-progress-circle', f.value], style: p.value }, g.value),
          [
            (C(),
            _('svg', Fd, [
              R(
                'circle',
                {
                  class: 'va-progress-circle__overlay',
                  cx: '50%',
                  cy: '50%',
                  r: l.value,
                  fill: 'none',
                  stroke: d.value,
                  'stroke-width': n.value + '%',
                  'stroke-dasharray': r.value,
                  'stroke-dashoffset': u.value,
                },
                null,
                8,
                Md,
              ),
            ])),
            y.$slots.default
              ? (C(),
                _('div', { key: 0, style: Y(v.value), class: 'va-progress-circle__info' }, [V(y.$slots, 'default')], 4))
              : E('', !0),
          ],
          16,
        )
      )
    },
  }),
  Aa = Q(Nd),
  Ge = (e, t) =>
    Object.keys(e)
      .filter((a) => t.includes(a))
      .reduce((a, o) => ((a[o] = e[o]), a), {}),
  Rd = {
    hoverBehavior: { type: String, default: 'mask', validator: (e) => ['opacity', 'mask'].includes(e) },
    hoverOpacity: { type: [Number, String], default: 0.15 },
    hoverMaskColor: { type: String, default: 'textInverted' },
  },
  zd = {
    pressedBehavior: { type: String, default: 'mask', validator: (e) => ['opacity', 'mask'].includes(e) },
    pressedOpacity: { type: Number, default: 0.13 },
    pressedMaskColor: { type: String, default: 'textPrimary' },
  },
  to = { loading: { type: Boolean, default: !1 } },
  Ls = (e) => e instanceof HTMLElement,
  Pt = (e) => {
    !e || !Ls(e) || (e.focus(), e.dispatchEvent(new FocusEvent('focus', { bubbles: !0 })))
  },
  Do = (e) => {
    !e || !Ls(e) || (e.blur(), e.dispatchEvent(new Event('blur', { bubbles: !0 })))
  },
  $n = (e) => {
    if (e.tabIndex !== -1) {
      Pt(e)
      return
    }
    const t = e.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    t && Pt(t)
  },
  kn = (e, t, a = {}) => {
    ;(Me(() => window.addEventListener(e, t, { capture: !0, ...a })),
      et(() => window.removeEventListener(e, t, { capture: !0, ...a })))
  },
  Os = () => {
    const e = we(),
      t = () => {
        e.value = document.activeElement
      }
    return (Me(t), kn('focus', t), kn('blur', t), e)
  },
  Fo = ['focus', 'blur']
function jt(e, t) {
  const a = Os(),
    o = i({
      get: () => (ft(a.value) || ft(e == null ? void 0 : e.value) ? !1 : a.value === (e == null ? void 0 : e.value)),
      set: (d) => {
        d ? r() : u()
      },
    }),
    n = (d) => {
      t == null || t('focus', d)
    },
    l = (d) => {
      t == null || t('blur', d)
    },
    r = () => {
      e != null && e.value && Pt(Xe(e == null ? void 0 : e.value))
    },
    u = () => {
      e != null && e.value && Do(Xe(e == null ? void 0 : e.value))
    }
  return (We('focus', n, e), We('blur', l, e), { isFocused: o, onFocus: n, onBlur: l, focus: r, blur: u })
}
const La = (e) => {
  if (mt(e))
    return i({
      get() {
        return Xe(e.value)
      },
      set(a) {
        e.value = a
      },
    })
  if (e) {
    const a = _o(e)
    return i({
      get() {
        return Xe(a.value)
      },
      set(o) {
        a.value = o
      },
    })
  }
  const t = we()
  return i({
    set(a) {
      t.value = Xe(a)
    },
    get() {
      return t.value
    },
  })
}
function ao(e, t) {
  const a = D(!1),
    o = () => {
      ;(t != null && t.value) || (a.value = !0)
    },
    n = () => {
      a.value = !1
    }
  t &&
    re(t, (r) => {
      r && (a.value = !1)
    })
  const l = La(e)
  return (We('mouseenter', o, l), We('mouseleave', n, l), { isHovered: a, onMouseEnter: o, onMouseLeave: n })
}
function Hd(e) {
  const t = D(!1),
    a = () => {
      t.value = !0
    },
    o = () => {
      t.value = !1
    },
    n = La(e)
  return (
    We(['mousedown', 'touchstart', 'dragstart'], a, n),
    We(['mouseup', 'mouseleave', 'touchend', 'touchcancel', 'drop', 'dragend'], o, !0),
    { isPressed: t, onMouseDown: a, onMouseUp: o }
  )
}
const xs = (e, t = !0) => {
    var a
    if (Dr(e)) return !0
    if (!e || (t && (!Xa(e) || !((a = e()) != null && a.length)))) return !1
    const o = t ? e() : e
    return Array.isArray(o)
      ? o.some((n) => (Array.isArray(n.children) ? xs(n.children, !1) : n.children || n.props))
      : !!o.children
  },
  jd = (e = 'default') => {
    const { slots: t } = qe()
    return i(() => xs(t[e]))
  },
  Fe = (e, t) => {
    Pa && !e && console.warn('You must pass the @param "prefix" to the useBem hook!')
    const a = i(() => (typeof t == 'function' ? t() : s(t))),
      o = i(() => Object.entries(s(a)).reduce((r, [u, d]) => (d && (r[`${e}--${qa(u)}`] = !0), r), {})),
      n = i(() => Object.keys(o.value)),
      l = i(() => n.value.join(' '))
    return new Proxy(
      {},
      {
        ownKeys() {
          return Reflect.ownKeys(o.value)
        },
        getOwnPropertyDescriptor(r, u) {
          return Reflect.getOwnPropertyDescriptor(o.value, u)
        },
        get(r, u, d) {
          switch (u) {
            case 'asArray':
              return n
            case 'asString':
              return l
            case 'asObject':
              return o
            default:
              return Reflect.get(o.value, u, d)
          }
        },
      },
    )
  },
  Ud = G({
    name: 'VaButton',
    __name: 'VaButton',
    props: {
      ...me,
      ...pa,
      ...Rd,
      ...zd,
      ...to,
      ...ba,
      tag: { type: String, default: 'button' },
      type: { type: String, default: 'button' },
      block: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
      textColor: { type: String, default: '' },
      textOpacity: { type: [Number, String], default: 1 },
      backgroundOpacity: { type: [Number, String], default: 1 },
      borderColor: { type: String, default: '' },
      gradient: { type: Boolean, default: !1 },
      plain: { type: Boolean, default: !1 },
      round: { type: Boolean, default: !1 },
      size: { type: String, default: 'medium', validator: (e) => ['small', 'medium', 'large'].includes(e) },
      icon: { type: String, default: '' },
      iconRight: { type: String, default: '' },
      iconColor: { type: String, default: '' },
    },
    setup(e, { expose: t }) {
      const a = e,
        { getColor: o } = Ce(),
        n = i(() => o(a.color)),
        { sizeComputed: l } = fa(a),
        r = i(() => {
          const x = /([0-9]*)(px)/.exec(l.value)
          return x ? `${+x[1] / 2}${x[2]}` : l.value
        }),
        { tagComputed: u } = Jt(a),
        d = xd(a),
        { disabled: c } = Tt(a),
        v = we(),
        { focus: p, blur: f } = jt(v),
        { isHovered: g } = ao(v, c),
        { isPressed: y } = Hd(v),
        m = i(() => (a.iconColor ? o(a.iconColor) : O.value)),
        b = i(() => ({ color: m.value, size: a.size })),
        h = i(() => ({ 'va-button__content--loading': a.loading })),
        $ = jd(),
        S = i(() => !!((a.iconRight && !a.icon) || (!a.iconRight && a.icon))),
        w = i(() => !$.value && S.value),
        I = Pe('textOpacity'),
        A = Pe('backgroundOpacity'),
        k = Fe('va-button', () => ({
          ...Ge(a, ['disabled', 'block', 'loading', 'round', 'plain']),
          small: a.size === 'small',
          normal: !a.size || a.size === 'medium',
          large: a.size === 'large',
          opacity: I.value < 1,
          bordered: !!a.borderColor,
          iconOnly: w.value,
          leftIcon: !w.value && !!a.icon && !a.iconRight,
          rightIcon: !w.value && !a.icon && !!a.iconRight,
        })),
        T = i(() => a.plain || A.value < 0.5),
        { textColorComputed: O } = tt(n, T),
        {
          backgroundColor: M,
          backgroundColorOpacity: ae,
          backgroundMaskOpacity: oe,
          backgroundMaskColor: B,
        } = Od(n, y, g),
        K = Dd(O, n, y, g),
        L = i(() => ({ borderColor: a.borderColor ? o(a.borderColor) : 'transparent', ...K.value }))
      return (
        t({ focus: p, blur: f }),
        (x, N) => (
          C(),
          U(
            pt(s(u)),
            H(
              {
                ref_key: 'button',
                ref: v,
                class: ['va-button', s(k)],
                style: [
                  L.value,
                  `--va-background-color: ${String(s(M))};--va-background-color-opacity: ${String(s(ae))};--va-background-mask-color: ${String(s(B))};--va-background-mask-opacity: ${String(s(oe))}`,
                ],
              },
              s(d),
            ),
            {
              default: z(() => [
                R(
                  'span',
                  { class: pe(['va-button__content', h.value]) },
                  [
                    V(x.$slots, 'prepend', J(ie({ icon: e.icon, iconAttributes: b.value })), () => [
                      e.icon
                        ? (C(),
                          U(s(Oe), H({ key: 0, class: 'va-button__left-icon', name: e.icon }, b.value), null, 16, [
                            'name',
                          ]))
                        : E('', !0),
                    ]),
                    V(x.$slots, 'default'),
                    V(x.$slots, 'append', J(ie({ icon: e.iconRight, iconAttributes: b.value })), () => [
                      e.iconRight
                        ? (C(),
                          U(
                            s(Oe),
                            H({ key: 0, class: 'va-button__right-icon', name: e.iconRight }, b.value),
                            null,
                            16,
                            ['name'],
                          ))
                        : E('', !0),
                    ]),
                  ],
                  2,
                ),
                x.loading
                  ? V(x.$slots, 'loading', J(H({ key: 0 }, { size: r.value, color: s(O) })), () => [
                      ue(
                        s(Aa),
                        { class: 'va-button__loader', size: r.value, color: s(O), thickness: 0.15, indeterminate: '' },
                        null,
                        8,
                        ['size', 'color'],
                      ),
                    ])
                  : E('', !0),
              ]),
              _: 3,
            },
            16,
            ['class', 'style'],
          )
        )
      )
    },
  }),
  xe = Q(Ud),
  Es = () => {
    const e = qe()
    return e.appContext.app ? `${e.appContext.app._uid}_${e.uid}` : String(e.uid)
  },
  Ra = [],
  Wd = (e, t) => {
    const a = Es(),
      o = ya(),
      n = () => {
        var r
        Ra.includes(a) ||
          (Ra.push(a), (r = o.value) == null || r.body.classList.add('va-modal-overlay-background--blurred'))
      },
      l = () => {
        var r
        const u = Ra.indexOf(a)
        u !== -1 &&
          (Ra.splice(u, 1),
          Ra.length === 0 && ((r = o.value) == null || r.body.classList.remove('va-modal-overlay-background--blurred')))
      }
    ;(St(() => {
      e.value && (t.value ? n() : l())
    }),
      et(l))
  },
  Kd = () => Ts(),
  ka = Nr([]),
  Ds = (e) => {
    const t = Kd(),
      a = () => {
        ka.includes(t) || ka.push(t)
      },
      o = () => {
        const u = ka.findIndex((d) => d === t)
        u !== -1 && ka.splice(u, 1)
      },
      n = i(() => {
        const u = ka.findIndex((d) => d === t)
        return u === -1 ? -1 : u + 1
      }),
      l = i(() => n.value === ka.length - 1),
      r = i(() => n.value === 0)
    return (
      Me(() => {
        e.value && a()
      }),
      et(() => {
        o()
      }),
      re(e, (u) => {
        u ? a() : o()
      }),
      { zIndex: n, isTop: l, isLowest: r, register: a, unregister: o }
    )
  },
  Vo = Symbol('NOT_PROVIDED'),
  Gd = (e, t) => {
    const a = qe()
    return i(() => {
      if (!(a != null && a.vnode.props)) return Vo
      const o = t[e]
      return e in a.vnode.props ? o : Vo
    })
  },
  Qe = { stateful: { type: Boolean, default: !1 }, modelValue: { type: void 0 } },
  Fs = (e = !1) => ({ stateful: { type: Boolean, default: e } }),
  lt = ['update:modelValue'],
  Ke = (e, t, a = 'modelValue', o = {}) => {
    const { eventName: n, defaultValue: l } = o,
      r = n || `update:${a.toString()}`,
      u = Gd(a, e),
      d = 'defaultValue' in o,
      c = D(u.value === Vo ? (d ? l : e[a]) : u.value)
    let v
    const p = () => {
      v = re(
        () => e[a],
        (g) => {
          c.value = g
        },
      )
    }
    re(
      () => e.stateful,
      (g) => {
        g ? p() : v == null || v()
      },
      { immediate: !0 },
    )
    const f = i({
      get: () => (e.stateful ? c.value : e[a]),
      set: (g) => {
        ;(e.stateful && (c.value = g), t(r, g))
      },
    })
    return (
      Object.defineProperty(f, 'stateful', { get: () => e.stateful }),
      Object.defineProperty(f, 'userProvided', { get: () => u.value !== Vo }),
      { valueComputed: f }
    )
  },
  qd = ':where(a, button, input, textarea, select):not([disabled]), *[tabindex]',
  Ms = () => {
    const e = ya(),
      t = Eo(),
      a = ys('trapInEl', null)
    let o = [],
      n = null,
      l = null
    const r = (g) => {
        var y
        return ((y = a.value) == null ? void 0 : y.contains(g.target)) || !1
      },
      u = () => {
        n == null || n.focus()
      },
      d = () => {
        l == null || l.focus()
      },
      c = (g) => {
        var y, m
        const b = g.code === 'Tab',
          h = g.shiftKey
        if (b) {
          if (!r(g)) {
            ;(g.preventDefault(), h ? d() : u())
            return
          }
          if (((y = e.value) == null ? void 0 : y.activeElement) === l && !h) {
            ;(g.preventDefault(), u())
            return
          }
          ;((m = e.value) == null ? void 0 : m.activeElement) === n && h && (g.preventDefault(), d())
        }
      },
      v = (g) => {
        ;((a.value = g), f(), p())
      },
      p = () => {
        var g
        a.value &&
          ((o = Array.from(a.value.querySelectorAll(qd))),
          (n = o[0]),
          (l = o[o.length - 1]),
          (g = t.value) == null || g.addEventListener('keydown', c))
      },
      f = () => {
        var g
        ;((o = []), (n = null), (l = null), (g = t.value) == null || g.removeEventListener('keydown', c))
      }
    return { trapFocus: p, freeFocus: f, trapFocusIn: v }
  },
  za = Nr([]),
  Yd = () => {
    const e = Dt(),
      t = i(() => za.findIndex(({ id: u }) => u === String(e))),
      a = () => {
        t.value === -1 && za.push({ id: String(e) })
      },
      o = () => {
        t.value !== -1 && za.splice(t.value, 1)
      },
      n = i(() => t.value !== -1 && t.value === za.length - 1),
      l = i(() => t.value === 0),
      r = i(() => za.length > 1)
    return {
      modalId: e,
      modalLevel: t,
      registerModal: a,
      unregisterModal: o,
      isTopLevelModal: n,
      isLowestLevelModal: l,
      isMoreThenOneModalOpen: r,
    }
  },
  Ns = 'data-va-teleported-from',
  Rs = 'data-va-teleported',
  Rn = (e) => {
    if (!e) return null
    const t = e.getAttribute(Rs)
    return t === null ? Rn(e.parentElement) : document.querySelector(`[${Ns}="${t}"]`)
  },
  zs = () => {
    var e, t
    const a = Es(),
      o = qe(),
      n = o == null ? void 0 : o.vnode.scopeId
    return {
      teleportFromAttrs: { [Ns]: a },
      teleportedAttrs: {
        [Rs]: a,
        ...(n ? { [n]: '' } : void 0),
        ...((t = (e = o == null ? void 0 : o.appContext.config) == null ? void 0 : e.globalProperties) == null
          ? void 0
          : t.$vaColorConfig.getAppStylesRootAttribute()),
      },
      findTeleportedFrom: Rn,
    }
  },
  nn = (e, t) => (t ? (t.parentElement === e ? !0 : e.contains(t)) : !1),
  Xd = (e) => (Array.isArray(e) ? e : [e]),
  Mo = (e, t) => {
    kn('mousedown', (a) => {
      const o = a.target
      if (a.target.shadowRoot) return
      const n = Rn(o)
      Xd(e).some((r) => {
        const u = Xe(s(r))
        return u ? (n ? nn(u, o) || nn(u, n) : nn(u, o)) : !1
      }) || t(o)
    })
  },
  Jd = ['aria-labelledby'],
  Zd = { key: 2, class: 'va-modal__inner' },
  Qd = { class: 'va-modal__header' },
  ev = { key: 0, class: 'va-modal__message' },
  tv = { key: 1, class: 'va-modal__message' },
  av = { key: 2, class: 'va-modal__footer' },
  ov = { key: 3, class: 'va-modal__footer' },
  nv = G({
    name: 'ModalElement',
    inheritAttrs: !1,
    props: { ...me, isTransition: { type: Boolean, default: !0 } },
    setup:
      (e, { slots: t, attrs: a }) =>
      () => {
        var o
        return e.isTransition ? Re(Po, { ...a }, t) : (o = t.default) == null ? void 0 : o.call(t, a)
      },
  }),
  lv = G({
    name: 'VaModal',
    inheritAttrs: !1,
    __name: 'VaModal',
    props: {
      ...Wr({ cancelButton: xe, okButton: xe, closeButton: Oe }),
      ...Qe,
      modelValue: { type: Boolean, default: !1 },
      attachElement: { type: String, default: 'body' },
      allowBodyScroll: { type: Boolean, default: !1 },
      disableAttachment: { type: Boolean, default: !1 },
      title: { type: String, default: '' },
      message: { type: String, default: '' },
      okText: ye('$t:ok'),
      cancelText: ye('$t:cancel'),
      hideDefaultActions: { type: Boolean, default: !1 },
      fullscreen: { type: Boolean, default: !1 },
      closeButton: { type: Boolean, default: !1 },
      mobileFullscreen: { type: Boolean, default: !0 },
      noDismiss: { type: Boolean, default: !1 },
      noOutsideDismiss: { type: Boolean, default: !1 },
      noEscDismiss: { type: Boolean, default: !1 },
      maxWidth: { type: String, default: '' },
      maxHeight: { type: String, default: '' },
      anchorClass: { type: String },
      size: { type: String, default: 'medium' },
      sizesConfig: {
        type: Object,
        default: () => ({ defaultSize: 'medium', sizes: { small: 576, medium: 768, large: 992, auto: 'max-content' } }),
      },
      fixedLayout: { type: Boolean, default: !1 },
      withoutTransitions: { type: Boolean, default: !1 },
      overlay: { type: Boolean, default: !0 },
      overlayOpacity: { type: [Number, String], default: 0.6 },
      showNestedOverlay: { type: Boolean, default: !1 },
      blur: { type: Boolean, default: !1 },
      zIndex: { type: [Number, String], default: void 0 },
      backgroundColor: { type: String, default: 'background-secondary' },
      noPadding: { type: Boolean, default: !1 },
      beforeClose: { type: Function },
      beforeOk: { type: Function },
      beforeCancel: { type: Function },
      ariaCloseLabel: ye('$t:close'),
    },
    emits: [...lt, 'cancel', 'ok', 'before-open', 'open', 'before-close', 'close', 'click-outside'],
    setup(e, { expose: t, emit: a }) {
      const o = e
      Kr(o)
      const n = a,
        l = we(),
        r = we(),
        { trapFocusIn: u, freeFocus: d } = Ms(),
        { registerModal: c, unregisterModal: v, isTopLevelModal: p, isLowestLevelModal: f } = Yd(),
        { getColor: g } = Ce(),
        { textColorComputed: y } = tt(ut(o, 'backgroundColor')),
        { valueComputed: m } = Ke(o, n),
        b = i(() => ({
          'va-modal--fullscreen': o.fullscreen,
          'va-modal--mobile-fullscreen': o.mobileFullscreen,
          'va-modal--fixed-layout': o.fixedLayout,
          'va-modal--no-padding': o.noPadding,
        })),
        { zIndex: h } = Ds(m),
        $ = i(() => (o.zIndex ? Number(o.zIndex) : h.value)),
        S = nc(o),
        w = i(() => ({
          maxWidth: o.maxWidth || S.value,
          maxHeight: o.maxHeight,
          color: y.value,
          background: g(o.backgroundColor),
        })),
        I = i(() => ({ 'va-modal__overlay--lowest': f.value, 'va-modal__overlay--top': p.value })),
        A = () =>
          o.showNestedOverlay && !f.value
            ? 'var(--va-modal-overlay-nested-opacity)'
            : 'var(--va-modal-overlay-opacity)',
        k = i(() => {
          if (o.overlay)
            return p.value || o.showNestedOverlay
              ? { 'background-color': 'var(--va-modal-overlay-color)', opacity: A() }
              : ''
        }),
        T = () => {
          m.value = !0
        },
        O = (j) => {
          const Se = () => {
            ;((m.value = !1), j == null || j())
          }
          o.beforeClose ? o.beforeClose(Se) : Se()
        },
        M = () => {
          m.value = !m.value
        },
        ae = () => {
          const j = () => {
            O(() => n('cancel'))
          }
          o.beforeCancel ? o.beforeCancel(j) : j()
        },
        oe = () => {
          const j = () => {
            O(() => n('ok'))
          }
          o.beforeOk ? o.beforeOk(j) : j()
        },
        B = () => {
          Ye(() => {
            r.value && u(r.value)
          })
        },
        K = (j) => n('before-open', j),
        L = (j) => n('open', j),
        x = (j) => n('before-close', j),
        N = (j) => n('close', j),
        P = (j) => {
          setTimeout(() => {
            j.code === 'Escape' && !o.noEscDismiss && !o.noDismiss && p.value && ae()
          })
        }
      Mo([r], () => {
        !m.value || o.noOutsideDismiss || o.noDismiss || !p.value || (n('click-outside'), ae())
      })
      const te = Eo()
      ;(St(() => {
        var j, Se
        m.value
          ? (j = te.value) == null || j.addEventListener('keyup', P)
          : (Se = te.value) == null || Se.removeEventListener('keyup', P)
      }),
        Wd(ut(o, 'blur'), m))
      const X = ya(),
        ce = (j) => {
          !X.value ||
            o.allowBodyScroll ||
            (j === 'hidden'
              ? X.value.body.classList.add('va-modal-open')
              : X.value.body.classList.remove('va-modal-open'))
        },
        ke = () => {
          ;(c(), ce('hidden'))
        },
        de = () => {
          ;(f.value && (d(), ce('')), v())
        }
      ;(re(m, (j) => {
        j ? ke() : de()
      }),
        Me(() => {
          ;(m.value && ke(), p.value && B())
        }),
        et(() => {
          de()
        }),
        re(
          p,
          (j) => {
            j && B()
          },
          { immediate: !0 },
        ),
        t({
          show: T,
          hide: O,
          toggle: M,
          cancel: ae,
          ok: oe,
          onBeforeEnterTransition: K,
          onAfterEnterTransition: L,
          onBeforeLeaveTransition: x,
          onAfterLeaveTransition: N,
          listenKeyUp: P,
        }))
      const { tp: F } = He(),
        { teleportFromAttrs: le, teleportedAttrs: ve } = zs(),
        W = { show: T, hide: O, toggle: M, cancel: ae, ok: oe }
      return (j, Se) => (
        C(),
        _(
          'div',
          { ref_key: 'rootElement', ref: l, class: pe(['va-modal-entry', j.$props.anchorClass]) },
          [
            j.$slots.anchor
              ? (C(), _('div', H({ key: 0, class: 'va-modal__anchor' }, s(le)), [V(j.$slots, 'anchor', J(ie(W)))], 16))
              : E('', !0),
            (C(),
            U(
              Wa,
              { to: e.attachElement, disabled: j.$props.disableAttachment },
              [
                ue(
                  s(nv),
                  H(
                    {
                      name: 'va-modal',
                      isTransition: !j.$props.withoutTransitions,
                      duration: 300,
                      style: { zIndex: $.value },
                      appear: '',
                    },
                    { ...j.$attrs, ...s(ve) },
                    { onBeforeEnter: K, onAfterEnter: L, onBeforeLeave: x, onAfterLeave: N },
                  ),
                  {
                    default: z(() => [
                      s(m)
                        ? (C(),
                          _(
                            'div',
                            {
                              key: 0,
                              'aria-labelledby': e.title,
                              class: pe([b.value, 'va-modal']),
                              role: 'dialog',
                              'aria-modal': 'true',
                            },
                            [
                              j.$props.overlay
                                ? (C(),
                                  _(
                                    'div',
                                    { key: 0, class: pe(['va-modal__overlay', I.value]), style: Y(k.value) },
                                    null,
                                    6,
                                  ))
                                : E('', !0),
                              R(
                                'div',
                                { ref_key: 'modalDialog', ref: r, class: 'va-modal__dialog', style: Y([w.value]) },
                                [
                                  j.$props.fullscreen || j.$props.closeButton
                                    ? (C(),
                                      U(
                                        s(Oe),
                                        {
                                          key: 0,
                                          'va-child': 'closeButton',
                                          class: pe([
                                            { 'va-modal__close--fullscreen': j.$props.fullscreen },
                                            'va-modal__close',
                                          ]),
                                          'aria-label': s(F)(j.$props.ariaCloseLabel),
                                          role: 'button',
                                          tabindex: '0',
                                          name: 'va-close',
                                          onClick: ae,
                                          onKeydown: [se(ae, ['space']), se(ae, ['enter'])],
                                        },
                                        null,
                                        8,
                                        ['class', 'aria-label'],
                                      ))
                                    : E('', !0),
                                  j.$slots.content
                                    ? V(j.$slots, 'content', J(H({ key: 1 }, W)))
                                    : (C(),
                                      _('div', Zd, [
                                        R('div', Qd, [
                                          V(j.$slots, 'header', J(ie(W)), () => [
                                            e.title
                                              ? (C(),
                                                _(
                                                  'div',
                                                  {
                                                    key: 0,
                                                    class: 'va-modal__title',
                                                    style: Y({ color: s(g)('primary') }),
                                                  },
                                                  fe(j.$props.title),
                                                  5,
                                                ))
                                              : E('', !0),
                                          ]),
                                        ]),
                                        j.$props.message ? (C(), _('div', ev, fe(j.$props.message), 1)) : E('', !0),
                                        j.$slots.default
                                          ? (C(), _('div', tv, [V(j.$slots, 'default', J(ie(W)))]))
                                          : E('', !0),
                                        (j.$props.cancelText || j.$props.okText) && !j.$props.hideDefaultActions
                                          ? (C(),
                                            _('div', av, [
                                              j.$props.cancelText
                                                ? (C(),
                                                  U(
                                                    s(xe),
                                                    {
                                                      key: 0,
                                                      'va-child': 'cancelButton',
                                                      preset: 'secondary',
                                                      color: 'secondary',
                                                      class: 'va-modal__default-cancel-button',
                                                      onClick: ae,
                                                    },
                                                    { default: z(() => [Te(fe(s(F)(j.$props.cancelText)), 1)]), _: 1 },
                                                  ))
                                                : E('', !0),
                                              ue(
                                                s(xe),
                                                { 'va-child': 'okButton', onClick: oe },
                                                { default: z(() => [Te(fe(s(F)(j.$props.okText)), 1)]), _: 1 },
                                              ),
                                            ]))
                                          : E('', !0),
                                        j.$slots.footer
                                          ? (C(), _('div', ov, [V(j.$slots, 'footer', J(ie(W)))]))
                                          : E('', !0),
                                      ])),
                                ],
                                4,
                              ),
                            ],
                            10,
                            Jd,
                          ))
                        : E('', !0),
                    ]),
                    _: 3,
                  },
                  16,
                  ['isTransition', 'style'],
                ),
              ],
              8,
              ['to', 'disabled'],
            )),
          ],
          2,
        )
      )
    },
  }),
  zn = Q(lv),
  rv = (e) => {
    var t
    return ((t = e.component) == null ? void 0 : t.props) || {}
  },
  Tl = (e, t) => {
    ;(e && (Ga(null, e), e.remove()), (e = null))
  },
  sv = (e, { props: t, appContext: a } = {}) => {
    const o = document == null ? void 0 : document.createElement('div')
    let n
    const l = (u) => {
        var d
        ;((d = t == null ? void 0 : t.onClose) == null || d.call(t, u), Tl(o))
      },
      r = (u) => {
        var d
        ;((d = t == null ? void 0 : t['onUpdate:modelValue']) == null || d.call(t, u),
          t != null &&
            t.withoutTransitions &&
            !u &&
            Ye(() => {
              Tl(o)
            }))
      }
    return (
      (n = Re(e, {
        ...t,
        stateful: (t == null ? void 0 : t.stateful) ?? !0,
        modelValue: !0,
        onClose: l,
        'onUpdate:modelValue': r,
      })),
      a && (n.appContext = a),
      o && Ga(n, o),
      { vNode: n, el: o }
    )
  },
  iv = (e) => (typeof e == 'string' ? { message: e } : e),
  _a = (e, t) => {
    const { vNode: a, el: o } = sv(zn, { appContext: t, props: iv(e) })
    return (o && a.el && rv(a) && document.body.appendChild(o.childNodes[0]), a)
  },
  uv = (e) => ({
    init(t) {
      return _a(t, e == null ? void 0 : e._context)
    },
    confirm(t) {
      return typeof t == 'string'
        ? new Promise((a) => {
            _a(
              {
                message: t,
                onOk() {
                  a(!0)
                },
                onCancel() {
                  a(!1)
                },
              },
              e == null ? void 0 : e._context,
            )
          })
        : new Promise((a) => {
            _a(
              {
                ...t,
                onOk() {
                  var o
                  ;((o = t == null ? void 0 : t.onOk) == null || o.call(t), a(!0))
                },
                onCancel() {
                  var o
                  ;((o = t == null ? void 0 : t.onCancel) == null || o.call(t), a(!1))
                },
              },
              e == null ? void 0 : e._context,
            )
          })
    },
  }),
  cv = Et(() => ({
    install(e) {
      qt(e, '$vaModal', uv(e))
    },
  })),
  Hs = (e, t) => {
    const a = Object.entries(t)
    return e.reduce((o, n) => o.concat(a.map(([l, r]) => ({ ...n, postfix: n.postfix ?? l, value: n.value ?? r }))), [])
  },
  js = (e) =>
    e.reduce((t, a) => {
      const o = [a.property]
        .flat()
        .map((n) => `${n}: ${a.value};`)
        .join('')
      return ((t += `.va-${a.prefix}--${a.postfix} { ${o} }`), t)
    }, ''),
  Il = (e, t) => {
    const a = Hs(e, t)
    Mn('va-color-helpers', () => js(a))
  },
  dv = () => {
    if (ga()) return
    const { globalConfig: e } = xt()
    return (
      re(
        () => e.value.colorsClasses,
        (t) => {
          t.length && Il(t, e.value.colors.variables)
        },
        { immediate: !0, deep: !0 },
      ),
      re(
        () => e.value.colors.variables,
        (t) => {
          t && Il(e.value.colorsClasses, t)
        },
        { immediate: !0, deep: !0 },
      ),
      {
        renderColorHelpers: () => {
          const t = Hs(e.value.colorsClasses, e.value.colors.variables)
          return js(t)
        },
      }
    )
  },
  vv = Et(() => ({
    install(e) {
      qt(e, '$vaColorsClasses', dv())
    },
  })),
  Us = Symbol('AccordionService'),
  pv = (e, t) => {
    const a = D([]),
      o = () => {
        const c = Math.max(a.value.length, t.value.length)
        return Array.from({ length: c }, (v, p) => t.value[p] ?? !1)
      },
      n = (c) => t.value[a.value.indexOf(c)] ?? !1,
      l = () => {
        t.value = o()
      }
    return (
      Ot(Us, {
        registerItem: (c) => {
          ;(a.value.push(c), l())
        },
        unregisterItem: (c) => {
          ;((a.value = a.value.filter((v) => v !== c)), Ye(l))
        },
        getItemValue: n,
        setItemValue: (c, v) => {
          const p = a.value.indexOf(c)
          if (p === -1) {
            De('Accordion item is not registered yet')
            return
          }
          e.multiple ? (t.value[p] = v) : (t.value = o().map((f, g) => (g === p ? v : !1)))
        },
        props: i(() => e),
      }),
      { items: a }
    )
  },
  fv = () => {
    const e = Lt(Us, void 0)
    if (!e) return { accordionProps: D({}) }
    const t = {}
    return (
      e.registerItem(t),
      et(() => e.unregisterItem(t)),
      {
        accordionItemValue: i({ get: () => e.getItemValue(t), set: (o) => e.setItemValue(t, o) }),
        accordionProps: e.props,
      }
    )
  },
  mv = { class: 'va-accordion' },
  gv = G({
    name: 'VaAccordion',
    __name: 'VaAccordion',
    props: {
      ...Qe,
      ...me,
      modelValue: { type: Array, default: () => [] },
      multiple: { type: Boolean, default: !1 },
      inset: { type: Boolean, default: !1 },
      stateful: { type: Boolean, default: !0 },
      popout: { type: Boolean, default: !1 },
    },
    emits: [...lt],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { valueComputed: l } = Ke(o, n, 'modelValue'),
        { items: r } = pv(o, l)
      return (t({ collapses: r, value: l }), (c, v) => (C(), _('div', mv, [V(c.$slots, 'default')])))
    },
  }),
  yv = Q(gv),
  bv = () => {},
  Ws = (e, t) => {
    let a = 0
    return function (...o) {
      const n = Date.now()
      n - a < t || (e.apply(this, o), (a = n))
    }
  }
function Ks() {
  return document.documentElement.clientHeight || window.innerHeight || document.body.clientHeight
}
function Pl({ coordinates: e, offsetTop: t, offsetBottom: a, target: o }) {
  let n = !1,
    l = !1
  const r = Ks()
  if (t != null && r)
    if (o === window) n = e.top <= t
    else {
      const { top: u } = o.getBoundingClientRect()
      n = e.top - u <= t
    }
  if (a != null && r)
    if (o === window) l = e.bottom >= r - a
    else {
      const { bottom: u } = o.getBoundingClientRect()
      l = u - e.bottom <= a
    }
  return { isTopAffixed: n, isBottomAffixed: l }
}
function hv(e, t) {
  return e.isTopAffixed !== t.isTopAffixed || e.isBottomAffixed !== t.isBottomAffixed
}
function Al(e, t) {
  const { target: a, element: o, offsetTop: n, offsetBottom: l, setState: r, getState: u, initialPosition: d } = t
  if (!o) return
  const c = !e,
    v = o.getBoundingClientRect(),
    p = { offsetBottom: l, offsetTop: n, target: a },
    f = Pl(c && d ? { coordinates: d, ...p } : { coordinates: v, ...p }),
    g = u()
  hv(g, f) ? r({ ...f, width: v.width }) : g.width !== v.width && r({ ...g, width: v.width })
}
function Cv(e) {
  return e === 'scroll'
}
function Sv(e, { handler: t, useCapture: a = Cv, wait: o = 50 }) {
  const n = e.map((l) => {
    const r = Ws((u) => t(l, u), o)
    return (window.addEventListener(l, r, a(l)), () => window.removeEventListener(l, r, a(l)))
  })
  return () => n.forEach((l) => l())
}
const $v = G({
    name: 'VaAffix',
    __name: 'VaAffix',
    props: {
      ...me,
      offsetTop: { type: [Number, String], default: void 0 },
      offsetBottom: { type: [Number, String], default: void 0 },
      target: { type: [Object, Function], default: Ss },
    },
    emits: ['change'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        l = () => (typeof a.target == 'function' ? a.target() : a.target),
        r = i(() => u.value.isTopAffixed || u.value.isBottomAffixed),
        u = D({ isTopAffixed: !1, isBottomAffixed: !1 }),
        d = () => u.value,
        c = (w) => {
          ;((u.value = w), o('change', r))
        },
        v = Pe('offsetTop'),
        p = Pe('offsetBottom'),
        f = () => {
          const w = l()
          if (!w) return 0
          if (v.value !== void 0) {
            if (!(w instanceof Window)) {
              const { top: I } = w.getBoundingClientRect()
              return I + v.value
            }
            return v.value
          }
        },
        g = () => {
          const w = l()
          if (!w) return 0
          if (p.value !== void 0) {
            if (!(w instanceof Window)) {
              const { bottom: I } = w.getBoundingClientRect(),
                { borderTopWidth: A, borderBottomWidth: k } = getComputedStyle(w),
                { offsetHeight: T, clientHeight: O } = w,
                M = T - O - parseInt(A) - parseInt(k)
              return Ks() - (I - p.value) + M
            }
            return p.value
          }
        },
        y = (w) => {
          const I = w()
          return I === void 0 ? void 0 : `${I}px`
        },
        m = i(() => [{ 'va-affix--affixed': r }]),
        b = i(() => ({
          top: u.value.isTopAffixed ? y(f) : void 0,
          bottom: u.value.isBottomAffixed ? y(g) : void 0,
          width: `${u.value.width}px`,
        })),
        h = D(),
        $ = (w, I) => {
          const A = {
            ...a,
            offsetTop: v.value,
            offsetBottom: p.value,
            initialPosition: h.value,
            element: n.value,
            target: l(),
            setState: c,
            getState: d,
          }
          if (!w || w === 'resize') Al(w, A)
          else if (I && I.target) {
            const k = l()
            k === I.target || k instanceof Window ? Al(w, A) : c({ isBottomAffixed: !1, isTopAffixed: !1 })
          }
        }
      let S = bv
      return (
        Me(() => {
          var w
          ;((h.value = (w = n.value) == null ? void 0 : w.getBoundingClientRect()),
            (S = Sv(['scroll', 'resize'], { handler: $ })),
            Ye(() => {
              $(null)
            }))
        }),
        et(S),
        (w, I) => (
          C(),
          _(
            'div',
            { ref_key: 'element', ref: n, class: 'va-affix' },
            [
              R('div', { style: Y({ visibility: r.value ? 'hidden' : 'inherit' }) }, [V(w.$slots, 'default')], 4),
              r.value
                ? (C(), _('div', { key: 0, class: pe(m.value), style: Y(b.value) }, [V(w.$slots, 'default')], 6))
                : E('', !0),
            ],
            512,
          )
        )
      )
    },
  }),
  kv = Q($v),
  Gs = (e) => {
    const { textColorComputed: t } = tt(e)
    return t
  },
  Hn = (e) => {
    if (e) return e
    const t = qe(),
      a = we()
    return (
      Me(() => {
        a.value = t.proxy.$el ?? void 0
      }),
      Mr(() => {
        a.value = t.proxy.$el ?? void 0
      }),
      et(() => {
        a.value = t.proxy.$el ?? void 0
      }),
      a
    )
  },
  wv = (e) => {
    const { getColor: t } = Ce(),
      a = i(() => !!(e.outline || e.border)),
      { textColorComputed: o } = tt(ut(e, 'color'), a),
      n = i(() => t(e.color)),
      l = i(() => {
        let v = n.value,
          p = 'none'
        return (
          e.outline && (v = 'transparent'),
          e.border && ((v = 'var(--va-background-primary)'), (p = 'var(--va-alert-box-shadow)')),
          {
            border: e.outline ? `1px solid ${n.value}` : '',
            padding: e.dense ? 'var(--va-alert-padding-y-dense) var(--va-alert-padding-x)' : '',
            backgroundColor: v,
            boxShadow: p,
          }
        )
      }),
      r = Gs(ws(Hn())),
      u = i(() => ({ alignItems: e.center ? 'center' : '', color: e.border || e.outline ? r.value : o.value })),
      d = i(() => ({ color: o.value })),
      c = i(() => ({ backgroundColor: e.borderColor ? t(e.borderColor) : n.value }))
    return { alertStyle: l, contentStyle: u, titleStyle: d, borderStyle: c }
  },
  _v = { key: 1, class: 'va-alert__close' },
  Vv = ['aria-label'],
  Bv = G({
    name: 'VaAlert',
    __name: 'VaAlert',
    props: {
      ...Qe,
      ...me,
      modelValue: { type: Boolean, default: !0 },
      stateful: { type: Boolean, default: !0 },
      color: { type: String, default: 'primary' },
      textColor: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      icon: { type: String, default: '' },
      closeText: { type: String, default: '' },
      closeIcon: { type: String, default: 'close' },
      closeable: { type: Boolean, default: !1 },
      dense: { type: Boolean, default: !1 },
      outline: { type: Boolean, default: !1 },
      center: { type: Boolean, default: !1 },
      borderColor: { type: String, default: '' },
      border: { type: String, default: '', validator: (e) => ['top', 'right', 'bottom', 'left', ''].includes(e) },
    },
    emits: [...lt],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { contentStyle: l, titleStyle: r, alertStyle: u, borderStyle: d } = wv(o),
        { valueComputed: c } = Ke(o, n),
        v = () => {
          c.value = !1
        },
        p = () => {
          c.value = !0
        },
        f = dt(),
        g = i(() => o.icon || f.icon),
        y = i(() => o.title || f.title),
        m = i(() => `va-alert__border--${o.border}`),
        { t: b } = He()
      return (
        t({ hide: v, show: p }),
        (h, $) => (
          C(),
          U(
            Po,
            { name: 'fade' },
            {
              default: z(() => [
                s(c)
                  ? (C(),
                    _(
                      'div',
                      { key: 0, class: 'va-alert', style: Y(s(u)), role: 'alert' },
                      [
                        R('div', { style: Y(s(d)), class: pe([m.value, 'va-alert__border']) }, null, 6),
                        g.value
                          ? (C(),
                            _(
                              'div',
                              { key: 0, style: Y(s(l)), class: 'va-alert__icon', 'aria-hidden': 'true' },
                              [V(h.$slots, 'icon', {}, () => [ue(s(Oe), { name: e.icon }, null, 8, ['name'])])],
                              4,
                            ))
                          : E('', !0),
                        R(
                          'div',
                          { style: Y(s(l)), class: 'va-alert__content' },
                          [
                            y.value
                              ? (C(),
                                _(
                                  'div',
                                  { key: 0, style: Y(s(r)), class: 'va-alert__title' },
                                  [V(h.$slots, 'title', {}, () => [Te(fe(e.title), 1)])],
                                  4,
                                ))
                              : E('', !0),
                            R('span', null, [V(h.$slots, 'default', {}, () => [Te(fe(h.$props.description), 1)])]),
                          ],
                          4,
                        ),
                        e.closeable
                          ? (C(),
                            _('div', _v, [
                              R(
                                'div',
                                {
                                  role: 'button',
                                  class: 'va-alert__close--closeable',
                                  tabindex: '0',
                                  'aria-label': e.closeText || s(b)('closeAlert'),
                                  style: Y(s(l)),
                                  onClick: v,
                                  onKeydown: [se(v, ['space']), se(v, ['enter'])],
                                },
                                [
                                  V(h.$slots, 'close', {}, () => [
                                    e.closeText
                                      ? E('', !0)
                                      : (C(), U(s(Oe), { key: 0, name: e.closeIcon }, null, 8, ['name'])),
                                    Te(' ' + fe(e.closeText), 1),
                                  ]),
                                ],
                                44,
                                Vv,
                              ),
                            ]))
                          : E('', !0),
                      ],
                      4,
                    ))
                  : E('', !0),
              ]),
              _: 3,
            },
          )
        )
      )
    },
  }),
  Tv = Q(Bv),
  qs = {
    hideOnScroll: { type: Boolean, default: !1 },
    fixed: { type: Boolean, default: !1 },
    bottom: { type: Boolean, default: !1 },
  }
function Ys(e, t) {
  const a = i(() => (t.value ? !!e.hideOnScroll : !1)),
    o = i(() => {
      if (!(!e.bottom && !a.value))
        return e.bottom && a.value
          ? 'translateY(100%)'
          : e.bottom
            ? e.fixed
              ? 'translateY(-100%)'
              : 'translateY(0)'
            : 'translateY(-100%)'
    }),
    n = i(() => (e.fixed ? 'fixed' : a.value ? 'absolute' : void 0))
  return {
    fixedBarStyleComputed: i(() => {
      const r = {
        top: e.bottom && (a.value || e.fixed) ? '100%' : void 0,
        transform: e.hideOnScroll || e.fixed ? o.value : void 0,
      }
      return (n.value && Object.assign(r, { position: n.value }), r)
    }),
  }
}
function Iv(e) {
  if (!e) throw new Error('No target was provided for `useScroll` hook!')
  return typeof e == 'string' ? document.querySelector(e) : e
}
function Xs(e, t) {
  const a = we()
  let o
  const n = D(!1),
    l = D(0),
    r = (u) => {
      const d = u.target,
        c = u.target instanceof Window ? d.scrollY : d.scrollTop
      ;((n.value = l.value < c), (l.value = c))
    }
  return (
    Me(() => {
      ;((o = e ? window : Iv(t || a.value)), o == null || o.addEventListener('scroll', r, e))
    }),
    et(() => {
      o == null || o.removeEventListener('scroll', r)
    }),
    { scrollRoot: a, isScrolledDown: n }
  )
}
const Pv = G({
    name: 'VaAppBar',
    __name: 'VaAppBar',
    props: {
      ...qs,
      ...me,
      gradient: { type: Boolean, default: !1 },
      target: { type: [Object, String], default: '' },
      shadowOnScroll: { type: Boolean, default: !1 },
      shadowColor: { type: String, default: '' },
      color: { type: String, default: 'primary' },
    },
    setup(e) {
      const t = e,
        { scrollRoot: a, isScrolledDown: o } = Xs(t.fixed, t.target),
        { fixedBarStyleComputed: n } = Ys(t, o),
        { getColor: l, getGradientBackground: r, getBoxShadowColor: u } = Ce(),
        d = i(() => l(t.color)),
        { textColorComputed: c } = tt(ut(t, 'color')),
        v = i(() => (o.value ? !!t.shadowOnScroll : !1)),
        p = i(() => l(t.shadowColor, d.value)),
        f = i(() => {
          const y = u(t.shadowColor ? p.value : d.value)
          return v.value ? `var(--va-app-bar-shadow) ${y}` : ''
        }),
        g = i(() => ({ ...n.value, background: t.gradient ? r(d.value) : d.value, boxShadow: f.value, color: c.value }))
      return (y, m) => (
        C(),
        _(
          'header',
          { ref_key: 'scrollRoot', ref: a, role: 'toolbar', class: 'va-app-bar', style: Y(g.value) },
          [V(y.$slots, 'default')],
          4,
        )
      )
    },
  }),
  Av = Q(Pv),
  Lv = G({
    name: 'VaAspectRatio',
    __name: 'VaAspectRatio',
    props: {
      ...me,
      ratio: { type: [Number, String], default: 'auto' },
      contentHeight: { type: [Number, String], default: 1 },
      contentWidth: { type: [Number, String], default: 1 },
      maxWidth: { type: [Number, String], default: 0, validator: (e) => Number(e) >= 0 },
    },
    setup(e) {
      const t = e,
        a = Pe('contentHeight'),
        o = Pe('contentWidth'),
        n = i(() =>
          t.ratio === 'auto' && t.contentHeight === 1 && t.contentWidth === 1
            ? 0
            : isNaN(+t.ratio)
              ? o.value / a.value
              : t.ratio,
        ),
        l = i(() => {
          if (n.value) return { paddingBottom: `${(1 / n.value) * 100}%` }
        }),
        r = i(() => (t.maxWidth ? `${t.maxWidth}px` : void 0))
      return (u, d) => (
        C(),
        _(
          'div',
          { class: 'va-aspect-ratio', style: Y(`--va-max-width-computed: ${String(r.value)}`) },
          [l.value ? (C(), _('div', { key: 0, style: Y(l.value) }, null, 4)) : E('', !0), V(u.$slots, 'default')],
          4,
        )
      )
    },
  }),
  Js = Q(Lv),
  Ov = G({
    name: 'VaFallback',
    props: {
      fallbackSrc: { type: String },
      fallbackText: { type: String },
      fallbackIcon: { type: String },
      fallbackRender: { type: Function },
    },
    components: { VaIcon: Oe },
    emits: ['fallback'],
    setup(e, { emit: t }) {
      return (
        Me(() => {
          t('fallback')
        }),
        e.fallbackIcon
          ? () => Re(Oe, { name: e.fallbackIcon })
          : e.fallbackSrc
            ? () => Re('img', { src: e.fallbackSrc })
            : e.fallbackRender
              ? () => {
                  var a
                  return Re((a = e.fallbackRender) == null ? void 0 : a.call(e))
                }
              : () => Re('span', e.fallbackText)
      )
    },
  }),
  Va = Q(Ov)
function Zs(e) {
  switch (!0) {
    case Array.isArray(e):
      return e.reduce((t, a) => ({ ...t, [a]: null }), {})
    case typeof e == 'object' && e !== null:
      return e
    default:
      return {}
  }
}
function Bo(e, t, a = 'props') {
  const { mixins: o, extends: n } = t
  ;(n && Bo(e, n, a), o && o.forEach((r) => Bo(e, r, a)))
  const l = Zs(t[a])
  for (const r in l) e[r] = l[r]
}
function xv(e) {
  return e.options ? e.options : e.__vccOpts || e.__b ? { ...e.__vccOpts, ...e.__b } : e
}
function Ev(e, t = 'props') {
  const a = e.mixins ?? [],
    o = e.extends ?? [],
    n = {}
  Bo(n, o, t)
  for (let l = 0; l < a.length; l++) Bo(n, a[l], t)
  return (Object.assign(n, Zs(e[t])), n)
}
const Dv = (e) => Ev(xv(e))
function Ee(e, t) {
  const a = Dv(e)
  return t
    ? Object.keys(a).reduce(
        (o, n) => (t.includes(n) || a[n] === void 0 || (o[n] = typeof a[n] == 'string' ? {} : a[n]), o),
        {},
      )
    : a
}
function ra(e) {
  return [...new Set(e.emits)]
}
const ze = (e) => {
    const { props: t } = qe()
    return i(() => Object.keys(e).reduce((a, o) => ((a[o] = t[o]), a), {}))
  },
  Fv = ['src', 'alt'],
  Ll = Ee(Va),
  Mv = G({
    name: 'VaAvatar',
    __name: 'VaAvatar',
    props: {
      ...to,
      ...pa,
      ...me,
      ...Ll,
      color: { type: String, default: 'primary' },
      textColor: { type: String },
      square: { type: Boolean, default: !1 },
      fontSize: { type: String, default: '' },
      src: { type: String, default: null },
      icon: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    emits: ['error', 'fallback'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { getColor: l } = Ce(),
        r = i(() => l(o.color)),
        u = i(() => {
          if (!(o.loading || (o.src && !g.value))) return r.value
        }),
        { sizeComputed: d, fontSizeComputed: c } = fa(o, 'VaAvatar'),
        { textColorComputed: v } = tt(u),
        p = i(() => ({ fontSize: o.fontSize || c.value })),
        f = Fe('va-avatar', () => ({ ...Ge(o, ['square']) })),
        g = D(!1),
        y = (h) => {
          ;((g.value = !0), n('error', h))
        }
      re(
        () => o.src,
        () => {
          g.value = !1
        },
      )
      const m = i(() => ({ hasError: g.value, onError: y })),
        b = ze(Ll)
      return (
        t({ hasLoadError: g }),
        (h, $) => (
          C(),
          _(
            'div',
            {
              class: pe(['va-avatar', s(f)]),
              style: Y([
                p.value,
                `--va-background-color-computed: ${String(u.value)};--va-text-color-computed: ${String(s(v))};--va-size-computed: ${String(s(d))}`,
              ]),
            },
            [
              h.$props.loading
                ? (C(), U(s(Aa), { key: 0, size: s(d), color: r.value, indeterminate: '' }, null, 8, ['size', 'color']))
                : V(h.$slots, 'default', J(H({ key: 1 }, m.value)), () => [
                    h.$props.src && !g.value
                      ? (C(), _('img', { key: 0, src: h.$props.src, alt: h.$props.alt, onError: y }, null, 40, Fv))
                      : g.value && h.$props.src
                        ? V(h.$slots, 'fallback', { key: 1 }, () => [
                            ue(s(Va), H(s(b), { onFallback: $[0] || ($[0] = (S) => h.$emit('fallback')) }), null, 16),
                          ])
                        : h.$props.icon
                          ? (C(), U(s(Oe), { key: 2, name: h.$props.icon }, null, 8, ['name']))
                          : V(h.$slots, 'fallback', { key: 3 }, () => [
                              ue(s(Va), H(s(b), { onFallback: $[1] || ($[1] = (S) => h.$emit('fallback')) }), null, 16),
                            ]),
                  ]),
            ],
            6,
          )
        )
      )
    },
  }),
  To = Q(Mv),
  Ol = Ee(To),
  Nv = G({
    name: 'VaAvatarGroup',
    __name: 'VaAvatarGroup',
    props: {
      ...pa,
      ...me,
      ...Ol,
      max: { type: [Number, String], default: 0 },
      vertical: { type: Boolean, default: !1 },
      options: { type: Array, default: () => [] },
      restColor: { type: String, default: 'secondary' },
    },
    setup(e) {
      const t = e,
        a = Pe('max'),
        o = Fe('va-avatar-group', () => ({ ...Ge(t, ['vertical']) })),
        n = i(() => (a.value && a.value <= t.options.length ? t.options.slice(0, a.value) : t.options)),
        l = i(() => {
          const v = t.options.length > 0,
            p = n.value.length < t.options.length,
            f = t.options.length - (a.value || 0)
          return v && p ? f : 0
        }),
        { sizeComputed: r, fontSizeComputed: u } = fa(t, 'VaAvatarGroup'),
        d = ze(Ol),
        c = i(() => ({ ...d.value, fontSize: u.value, size: r.value }))
      return (v, p) => (
        C(),
        _(
          'div',
          { class: pe(['va-avatar-group', s(o)]), role: 'list' },
          [
            (C(!0),
            _(
              be,
              null,
              Ie(
                n.value,
                (f, g) => (C(), U(s(To), H({ key: g }, { ...c.value, ...f }, { role: 'listitem' }), null, 16)),
              ),
              128,
            )),
            l.value > 0
              ? V(v.$slots, 'rest', J(H({ key: 0 }, c.value)), () => [
                  ue(
                    s(To),
                    H(c.value, { color: e.restColor, class: 'va-avatar-group__rest', role: 'listitem' }),
                    { default: z(() => [Te(' +' + fe(l.value), 1)]), _: 1 },
                    16,
                    ['color'],
                  ),
                ])
              : E('', !0),
          ],
          2,
        )
      )
    },
  }),
  Rv = Q(Nv),
  zv = ['aria-label', 'onKeydown'],
  Hv = G({
    name: 'VaBacktop',
    __name: 'VaBacktop',
    props: {
      ...me,
      target: { type: [Object, String], default: void 0 },
      visibilityHeight: { type: [Number, String], default: 300 },
      speed: { type: [Number, String], default: 50 },
      verticalOffset: { type: String, default: '1rem' },
      horizontalOffset: { type: String, default: '1rem' },
      color: { type: String, default: '' },
      horizontalPosition: { type: String, default: 'right', validator: (e) => ['right', 'left'].includes(e) },
      verticalPosition: { type: String, default: 'bottom', validator: (e) => ['bottom', 'top'].includes(e) },
      ariaLabel: ye('$t:backToTop'),
    },
    setup(e) {
      const t = e,
        a = D(0),
        o = i(() => ({ [t.verticalPosition]: t.verticalOffset, [t.horizontalPosition]: t.horizontalOffset }))
      let n
      const l = Pe('visibilityHeight'),
        r = Pe('speed'),
        u = () => {
          if (!t.target) return window
          if (typeof t.target == 'string') {
            const m = document.querySelector(t.target)
            return m || (De(`Target element [${t.target}] is not found, falling back to window.`), window)
          }
          return t.target
        },
        d = D(!1),
        c = D(0),
        v = () => {
          if (!d.value) {
            if (((d.value = !0), n instanceof Window)) {
              window.scrollTo({ top: 0, behavior: 'smooth' })
              return
            }
            c.value = window.setInterval(() => {
              if (n instanceof Element)
                if (n.scrollTop === 0) (clearInterval(c.value), (d.value = !1))
                else {
                  const m = Math.floor(n.scrollTop - r.value)
                  n.scrollTo(0, m)
                }
            }, 15)
          }
        },
        p = () => {
          a.value = n instanceof Window ? n.scrollY : n.scrollTop
        },
        f = ga(),
        g = i(() => (f ? !1 : a.value > l.value))
      f ||
        (Me(() => {
          ;((n = u()), n.addEventListener('scroll', p, !0))
        }),
        et(() => (n == null ? void 0 : n.removeEventListener('scroll', p))))
      const { tp: y } = He()
      return (m, b) =>
        g.value
          ? (C(),
            _(
              'div',
              {
                key: 0,
                class: 'va-backtop',
                role: 'button',
                'aria-label': s(y)(m.$props.ariaLabel),
                tabindex: '1',
                style: Y(o.value),
                onClick: v,
                onKeydown: se(ne(v, ['stop']), ['enter']),
              },
              [
                V(m.$slots, 'default', {}, () => [
                  ue(s(xe), { 'aria-hidden': 'true', icon: 'va-arrow-up', color: e.color }, null, 8, ['color']),
                ]),
              ],
              44,
              zv,
            ))
          : E('', !0)
    },
  }),
  jv = Q(Hv),
  Qs = ['top', 'bottom'],
  ei = ['left', 'right'],
  Uv = [...Qs, ...ei],
  Wv = ['start', 'end', 'center'],
  Kv = Uv.reduce((e, t) => (e.push(t), Wv.forEach((a) => e.push(`${t}-${a}`)), e), ['auto']),
  Gv = Qs.reduce(
    (e, t) => (
      ei.forEach((a) => {
        ;(e.push(`${t}-${a}`), e.push(`${a}-${t}`))
      }),
      e
    ),
    [],
  ),
  ti = [...Kv, ...Gv],
  qv = {
    'top-left': 'top-start',
    'left-top': 'top-start',
    'top-right': 'top-end',
    'right-top': 'top-end',
    'bottom-left': 'bottom-start',
    'left-bottom': 'bottom-start',
    'bottom-right': 'bottom-end',
    'right-bottom': 'bottom-end',
  },
  ai = { placement: { type: String, default: 'auto', validator: (e) => ti.includes(e) } },
  oi = (e) => {
    const t = i(() => (qv[e.placement] || e.placement).split('-')),
      a = i(() => {
        const n = t.value[0]
        return n === 'auto' ? 'bottom' : n
      }),
      o = i(() => t.value[1] || 'center')
    return { position: a, align: o }
  },
  ni = () => {
    const e = (o) => (typeof o == 'string' ? !isNaN(+o) || o.endsWith('px') || o.endsWith('rem') : !1)
    return {
      isParsableMeasure: e,
      isParsablePositiveMeasure: (o) => (typeof o == 'number' ? o >= 0 : e(o) && parseInt(o) >= 0),
      parseSizeValue: (o, n = 16) => {
        const l = s(o)
        if (typeof l == 'string') {
          const r = parseInt(l)
          return isNaN(r) ? 0 : l.endsWith('rem') ? r * s(n) : r
        }
        return l
      },
    }
  },
  { isParsableMeasure: xl, parseSizeValue: El } = ni(),
  Yv = {
    overlap: { type: Boolean, default: !1 },
    placement: { type: String, default: 'top-end', validator: (e) => ti.includes(e) },
    offset: {
      type: [Number, String, Array],
      default: 0,
      validator: (e) => (Array.isArray(e) ? e.every(xl) : typeof e == 'string' ? xl(e) : !isNaN(e)),
    },
  },
  Xv = (e, t) => {
    if (!t.value) return {}
    const { position: a, align: o } = oi(e),
      n = i(() => ({ start: e.overlap ? '-50%' : '-100%', center: '-50%', end: e.overlap ? '-50%' : '0%' })[o.value]),
      l = i(() => {
        if (!e.offset) return {}
        const d = ['left', 'right'].includes(a.value) ? 'top' : 'left',
          c = d === 'top' ? 'left' : 'top'
        if (Array.isArray(e.offset)) {
          const [p, f] = e.offset.map(El)
          return { [`margin-${d}`]: `${p}px`, [`margin-${c}`]: `${f}px` }
        }
        const v = El(e.offset)
        return { [`margin-${c}`]: `${v}px` }
      }),
      r = i(() => {
        const d = ['left', 'right'].includes(a.value) ? 'top' : 'left',
          c = d === 'top' ? 'left' : 'top'
        let v = '0%'
        return (
          c === 'top' && a.value === 'bottom' && (v = '100%'),
          c === 'left' && a.value === 'right' && (v = '100%'),
          { start: { [d]: '0%', [c]: v }, center: { [d]: '50%', [c]: v }, end: { [d]: '100%', [c]: v } }[o.value]
        )
      }),
      u = i(() => {
        const d = {
            top: { x: n.value, y: e.overlap ? '-50%' : '-100%' },
            bottom: { x: n.value, y: e.overlap ? '-50%' : '0%' },
            left: { x: e.overlap ? '-50%' : '-100%', y: n.value },
            right: { x: e.overlap ? '-50%' : '0%', y: n.value },
          },
          { x: c, y: v } = d[a.value]
        return { transform: `translate(${c}, ${v})` }
      })
    return i(() => ({ ...r.value, ...u.value, ...l.value }))
  },
  Jv = { props: 'prop', attrs: 'prop', slots: 'slot' },
  Zv = (e, t = ['props', 'attrs']) => {
    if (!Pa) return
    const a = qe()
    if (!a) throw new Error('`useDeprecated` hook must be used only inside of setup function!')
    const o = a.type.name,
      n = s(e)
    t.every((l) => {
      var r
      const u = Jv[l],
        d = (c) => console.warn(`The '${c}' ${u} (${o} component) is deprecated! Please, check the documentation.`)
      if (l === 'props') {
        const c = ((r = a.propsOptions) == null ? void 0 : r[0]) || {},
          v = a.props || {}
        return (
          n.forEach((p) => {
            c[p] && v[p] !== c[p].default && d(p)
          }),
          !0
        )
      }
      return (
        Object.keys({ ...a[l] }).forEach((c) => {
          n.includes(c) && d(c)
        }),
        !0
      )
    })
  },
  Qv = ['aria-labelledby'],
  ep = { class: 'va-badge__text' },
  tp = G({
    name: 'VaBadge',
    __name: 'VaBadge',
    props: {
      ...me,
      ...Yv,
      color: { type: String, default: 'danger' },
      textColor: { type: String },
      text: { type: [String, Number], default: '' },
      multiLine: { type: Boolean, default: !1 },
      visibleEmpty: { type: Boolean, default: !1 },
      dot: { type: Boolean, default: !1 },
      transparent: { type: Boolean, default: !1 },
    },
    setup(e) {
      const t = e
      Zv(['transparent'])
      const a = dt(),
        o = i(() => !(t.text || t.visibleEmpty || t.dot || a.text)),
        n = i(() => !!(a.default || t.dot)),
        l = Fe('va-badge', () => ({
          ...Ge(t, ['visibleEmpty', 'dot', 'multiLine']),
          empty: o.value,
          floating: n.value,
        })),
        { getColor: r } = Ce(),
        u = i(() => r(t.color)),
        { textColorComputed: d } = tt(u),
        c = Xv(t, n),
        v = i(() => ({
          color: d.value,
          borderColor: u.value,
          backgroundColor: u.value,
          opacity: t.transparent ? 0.5 : 1,
          ...s(c),
        })),
        p = i(() => (t.text ? String(t.text) : void 0))
      return (f, g) => (
        C(),
        _(
          'div',
          { class: pe(['va-badge', s(l)]), role: 'status', 'aria-labelledby': p.value },
          [
            R(
              'span',
              { class: 'va-badge__text-wrapper', style: Y(v.value) },
              [R('span', ep, [V(f.$slots, 'text', {}, () => [Te(fe(e.text), 1)])])],
              4,
            ),
            V(f.$slots, 'default'),
          ],
          10,
          Qv,
        )
      )
    },
  }),
  li = Q(tp),
  Dl = (e, t) => Object.prototype.hasOwnProperty.call(e, t),
  Fl = (e) => (e && typeof e == 'function' ? e() : e),
  ri = { align: { type: String, default: 'left' }, vertical: { type: Boolean, default: !1 } },
  ap = { left: 'flex-start', center: 'center', right: 'flex-end', between: 'space-between', around: 'space-around' },
  op = { left: 'flex-start', center: 'center', right: 'flex-end', stretch: 'stretch' },
  np = (e, t) => (t ? 'center' : e ? ap[e] : 'flex-start'),
  lp = (e, t) => (t ? op[e] : 'center')
function si(e) {
  return {
    alignComputed: i(() => ({
      display: 'flex',
      flexDirection: e.vertical ? 'column' : 'row',
      justifyContent: np(e.align, e.vertical),
      alignItems: lp(e.align, e.vertical),
    })),
  }
}
const rp = G({
    name: 'VaBreadcrumbs',
    props: {
      ...ri,
      ...me,
      separator: { type: String, default: '/' },
      color: { type: String, default: null },
      disabledColor: { type: String, default: 'secondary' },
      activeColor: { type: String, default: null },
      separatorColor: { type: String, default: null },
      ariaLabel: ye('$t:breadcrumbs'),
    },
    setup(e, { slots: t }) {
      const { alignComputed: a } = si(e),
        { getColor: o } = Ce(),
        n = i(() => (e.separatorColor ? o(e.separatorColor) : null)),
        l = i(() => (e.color ? o(e.color) : null)),
        r = i(() => (e.activeColor ? o(e.activeColor) : null)),
        u = (g, y) => {
          const m = y && y.type === be && y.children ? y.children : [y]
          return [
            ...g,
            ...m.filter((b) => {
              var h, $
              return !!(
                ($ = (h = b == null ? void 0 : b.type) == null ? void 0 : h.name) != null &&
                $.match(/VaBreadcrumbsItem$/)
              )
            }),
          ]
        },
        d = () => {
          const g = Fl(t.separator) || [e.separator]
          return Re('span', { 'aria-hidden': !0, class: ['va-breadcrumbs__separator'], style: [{ color: n.value }] }, g)
        },
        c = (g) => {
          const y = g == null ? void 0 : g.props
          return !y || !Dl(y, 'disabled') ? !1 : y.disabled === '' ? !0 : !!y.disabled
        },
        v = D(!0),
        p = () => {
          const g = Fl(t.default)
          if (!g) return
          const y = g.reduce(u, []) || [],
            m = y.length,
            b = (w) => w === m - 1,
            h = (w) => {
              const I = w == null ? void 0 : w.props
              return !I || !Dl(I, 'to') ? !1 : !!(I.to && !I.disabled)
            },
            $ = (w, I) =>
              Re(
                'span',
                {
                  class: ['va-breadcrumbs__item', { 'va-breadcrumbs__item--disabled': c(w) }],
                  'aria-current': b(I) && h(w) ? 'location' : !1,
                  style: { color: c(w) ? o(e.disabledColor) : b(I) ? r.value : l.value },
                },
                [w],
              ),
            S = []
          return (
            m &&
              y.forEach((w, I) => {
                ;(v.value && !h(w) && (v.value = !1), S.push($(w, I)), b(I) || S.push(d()))
              }),
            S
          )
        },
        { tp: f } = He()
      return () =>
        Re(
          'div',
          {
            class: 'va-breadcrumbs',
            style: a.value,
            role: v.value ? 'navigation' : void 0,
            'aria-label': v.value ? f(e.ariaLabel) : void 0,
          },
          p(),
        )
    },
  }),
  sp = G({
    name: 'VaBreadcrumbsItem',
    __name: 'VaBreadcrumbsItem',
    props: { ...ba, disabled: { type: Boolean, default: !1 }, label: { type: String, default: '' } },
    setup(e) {
      const t = e,
        { tagComputed: a, hrefComputed: o, isLinkTag: n } = Jt(t),
        l = i(() => ({ 'va-breadcrumb-item--link': n.value }))
      return (r, u) => (
        C(),
        U(
          pt(s(a)),
          {
            class: pe(['va-breadcrumb-item', l.value]),
            'active-class': r.$props.activeClass,
            href: s(o),
            to: r.$props.to,
            target: r.$props.target,
            replace: r.$props.replace,
            append: r.$props.append,
            exact: r.$props.exact,
            'exact-active-class': r.$props.exactActiveClass,
          },
          { default: z(() => [V(r.$slots, 'default', {}, () => [Te(fe(e.label), 1)])]), _: 3 },
          8,
          ['class', 'active-class', 'href', 'to', 'target', 'replace', 'append', 'exact', 'exact-active-class'],
        )
      )
    },
  }),
  ip = Q(sp),
  up = Q(rp),
  Ml = At(Ee(xe), ['block', 'gradient']),
  cp = G({
    name: 'VaButtonGroup',
    __name: 'VaButtonGroup',
    props: { ...Ml, ...me, grow: { type: Boolean, default: !1 }, gradient: { type: Boolean, default: !1 } },
    setup(e) {
      const t = e,
        { getColor: a, getGradientBackground: o } = Ce(),
        n = i(() => a(t.color)),
        { textColorComputed: l } = tt(n),
        r = ze(Ml),
        u = i(() => ({ VaButton: { ...r.value, ...(t.gradient && { color: '#00000000', textColor: l.value }) } })),
        d = Fe('va-button-group', () => ({
          square: !t.round,
          grow: t.grow,
          small: t.size === 'small',
          large: t.size === 'large',
        })),
        c = i(() => (t.gradient ? o(n.value) : 'transparent'))
      return (v, p) => (
        C(),
        _(
          'div',
          { class: pe(['va-button-group', s(d)]), style: Y(`--va-background-color: ${String(c.value)}`) },
          [ue(s(Qa), { components: u.value }, { default: z(() => [V(v.$slots, 'default')]), _: 3 }, 8, ['components'])],
          6,
        )
      )
    },
  }),
  No = Q(cp),
  jn = (e, t) => {
    let a = null
    const o = function (...n) {
      ;(a && clearTimeout(a),
        (a = setTimeout(() => {
          ;((a = null), e.apply(this, n))
        }, t)))
    }
    return (
      (o.cancel = () => {
        ;(a && clearTimeout(a), (a = null))
      }),
      o
    )
  },
  Nl = (e) => {
    let t = null
    const a = () =>
      jn(() => {
        ;(t == null || t(), (t = null))
      }, s(e))
    let o = a()
    return (
      mt(e) &&
        re(e, () => {
          o = a()
        }),
      {
        debounced: (n) => {
          ;((t = n), o())
        },
        cancel: () => o.cancel(),
      }
    )
  },
  Rl = (e) => {
    const t = e.target
    return !(!(t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') || t.attributes.getNamedItem('readonly'))
  },
  dp = (e) => Array.isArray(e),
  vp = (e, t, a, o) => {
    const n = (p) => (
        (p = p.replace(/-/g, '').toLowerCase()),
        p === 'space' ? ' ' : p === 'rightclick' ? 'contextmenu' : p
      ),
      l = i(() => (dp(o.trigger) ? o.trigger.map((p) => n(p)) : [n(o.trigger)]))
    ;(We(
      'keydown',
      (p) => {
        o.disabled ||
          (p.key === 'Escape' && e.value && ((e.value = !1), p.preventDefault()),
          !Rl(p) && l.value.includes(n(p.key)) && ((e.value = !e.value), p.preventDefault()))
      },
      t,
    ),
      We(
        'keydown',
        (p) => {
          o.disabled || (p.key === 'Escape' && e.value && ((e.value = !1), p.preventDefault()))
        },
        a,
      ),
      We(
        ['click', 'contextmenu', 'dblclick'],
        (p) => {
          o.disabled ||
            Rl(p) ||
            (l.value.includes(n(p.type)) &&
              (p.preventDefault(),
              e.value && o.closeOnAnchorClick
                ? ((e.value = !1),
                  o.cursor &&
                    setTimeout(() => {
                      e.value = !0
                    }, 16))
                : (e.value = !0)))
        },
        t,
      ),
      We(
        ['click', 'contextmenu', 'dblclick'],
        (p) => {
          o.closeOnContentClick && (e.value = !1)
        },
        a,
      ))
    const { debounced: r, cancel: u } = Nl(Pe('hoverOverTimeout')),
      { debounced: d, cancel: c } = Nl(Pe('hoverOutTimeout')),
      v = (p) => {
        if (!o.disabled && l.value.includes('hover'))
          if (p.type === 'mouseleave') {
            if ((u(), !o.isContentHoverable)) {
              e.value = !1
              return
            }
            d(() => {
              e.value = !1
            })
          } else
            (c(),
              r(() => {
                e.value = !0
              }))
      }
    ;(We(['mouseleave', 'mouseenter'], v, t), We(['mouseleave', 'mouseenter'], v, a))
  },
  pp = (e) => {
    const t = D(),
      a = ya(),
      o = eo()
    return {
      anchorRef: i({
        set(l) {
          t.value = Xe(l)
        },
        get() {
          var l, r, u
          return (
            o.value,
            typeof e.anchor == 'string'
              ? (((l = a.value) == null ? void 0 : l.querySelector(e.anchor)) ?? t.value)
              : typeof e.anchor == 'object'
                ? e.anchor
                : e.anchorSelector
                  ? (((r = a.value) == null ? void 0 : r.querySelector(e.anchorSelector)) ?? t.value)
                  : e.innerAnchorSelector && t.value
                    ? (((u = t.value) == null ? void 0 : u.querySelector(e.innerAnchorSelector)) ?? t.value)
                    : t.value
          )
        },
      }),
    }
  },
  fp = (e, t) => {
    const a = Nt({ x: 0, y: 0 })
    return (
      We(
        ['mousemove', 'mousedown', 'mouseup'],
        (o) => {
          var n
          if (!t.value) return
          const { x: l, y: r } = ((n = e.value) == null ? void 0 : n.getBoundingClientRect()) ?? { x: 0, y: 0 }
          ;((a.x = o.clientX - l), (a.y = o.clientY - r))
        },
        e,
      ),
      i(() => ({
        getBoundingClientRect() {
          var o
          const { x: n, y: l } = ((o = e.value) == null ? void 0 : o.getBoundingClientRect()) ?? { x: 0, y: 0 },
            r = a.x + n,
            u = a.y + l
          return { width: 0, height: 0, x: r, y: u, top: u, right: r, bottom: u, left: r }
        },
        contextElement: e.value,
      }))
    )
  },
  mp = (e, t, a, o) => {
    const n = i(() => {
        const { position: c, align: v } = oi({ placement: o.value.placement })
        return `${c.value}-${v.value}`
      }),
      l = i(() => {
        const c = o.value.offset,
          v = { mainAxis: 0, crossAxis: 0 }
        return (
          Array.isArray(c) && ((v.mainAxis = c[0]), (v.crossAxis = c[1])),
          typeof c == 'number' && (v.mainAxis = c),
          v
        )
      }),
      r = i(() => {
        const { autoPlacement: c, stickToEdges: v, keepAnchorWidth: p, verticalScrollOnOverflow: f } = o.value,
          g = [fu(l.value)]
        return (
          c && g.push(mu({ boundary: a.value })),
          v && g.push(gu()),
          (p || f) &&
            g.push(
              yu({
                apply({ elements: y, availableHeight: m }) {
                  if (p) {
                    const h = y.reference.getBoundingClientRect().width
                    Object.assign(y.floating.style, { maxWidth: `${h}px`, minWidth: `${h}px` })
                  }
                  f && Object.assign(y.floating.style, { maxHeight: `${m}px` })
                },
              }),
            ),
          g
        )
      }),
      { floatingStyles: u, isPositioned: d } =
        typeof document > 'u'
          ? { floatingStyles: {}, isPositioned: D(!1) }
          : du(e, t, { placement: n, whileElementsMounted: bu, middleware: r, transform: !0 })
    return { floatingStyles: i(() => (d.value ? u.value : { position: 'fixed' })), isPositioned: d }
  },
  gp = (e, t) => (!t || t instanceof Window ? !1 : t.parentElement === e ? !0 : e.contains(t)),
  yp = (e) => (Array.isArray(e) ? e : [e]),
  bp = (e, t, a = {}) => {
    let o = !1
    ;(a.onlyKeyboard &&
      We(
        'mousedown',
        (n) => {
          ;((o = !0),
            setTimeout(() => {
              o = !1
            }, 200))
        },
        !0,
      ),
      We(
        'focus',
        (n) => {
          if (a.onlyKeyboard && o) return
          const l = n.target
          if (n.target.shadowRoot) return
          yp(e).some((u) => {
            const d = Xe(s(u))
            return d && gp(d, l)
          }) || t(l)
        },
        !0,
      ))
  },
  ln = (e) =>
    i(() =>
      typeof (e == null ? void 0 : e.value) == 'string'
        ? document == null
          ? void 0
          : document.querySelector(e.value)
        : Xe(e == null ? void 0 : e.value),
    ),
  hp = G({
    name: 'VaDropdown',
    props: {
      ...ai,
      ...Fs(!0),
      modelValue: { type: Boolean, default: !1 },
      anchor: { type: [String, Object], default: void 0 },
      anchorSelector: { type: String, default: '' },
      innerAnchorSelector: { type: String, default: '' },
      trigger: { type: [String, Array], default: () => ['click', 'space', 'enter', 'arrow-down', 'arrow-up'] },
      disabled: { type: Boolean },
      readonly: { type: Boolean },
      closeOnClickOutside: { type: Boolean, default: !0 },
      closeOnFocusOutside: { type: Boolean, default: !0 },
      closeOnAnchorClick: { type: Boolean, default: !0 },
      closeOnContentClick: { type: Boolean, default: !0 },
      hoverOverTimeout: { type: [Number, String], default: 30 },
      hoverOutTimeout: { type: [Number, String], default: 200 },
      isContentHoverable: { type: Boolean, default: !0 },
      offset: { type: [Array, Number], default: 0 },
      keepAnchorWidth: { type: Boolean, default: !1 },
      verticalScrollOnOverflow: { type: Boolean, default: !0 },
      cursor: { type: [Boolean, Object], default: !1 },
      autoPlacement: { type: Boolean, default: !0 },
      stickToEdges: { type: Boolean, default: !1 },
      target: { type: [String, Object], default: void 0 },
      teleport: { type: [String, Object], default: void 0 },
      keyboardNavigation: { type: Boolean, default: !0 },
      ariaLabel: ye('$t:toggleDropdown'),
      role: { type: String, default: 'button' },
      contentClass: { type: String, default: '' },
    },
    emits: [
      ...lt,
      'anchor-click',
      'anchor-right-click',
      'content-click',
      'click-outside',
      'focus-outside',
      'close',
      'open',
      'anchor-dblclick',
    ],
    setup(e, { emit: t }) {
      const { valueComputed: a } = Ke(e, t, 'modelValue')
      re(a, (S) => {
        t(S ? 'open' : 'close')
      })
      const o = eo(),
        { anchorRef: n } = pp(e),
        l = fp(
          n,
          i(() => !!e.cursor),
        ),
        r = La('floating'),
        u = ln(D('body')),
        d = ln(i(() => e.target)),
        c = ln(i(() => e.teleport)),
        v = Fe('va-dropdown', () => Ge(e, ['disabled'])),
        p = i(() => {
          if (c.value) return c.value
          if (d.value) return d.value
          if (n.value) {
            const S = n.value.getRootNode()
            if (S instanceof ShadowRoot) {
              const w = [...S.children].find((I) => I.tagName !== 'STYLE')
              if (w) return w
            }
          }
          return u.value
        }),
        f = i(() => o.value && a.value)
      vp(a, n, r, e)
      const g = (S, w, I) => {
        ;(t(S, I), w && (a.value = !1))
      }
      ;(Mo([n, r], () => {
        e.closeOnClickOutside && a.value && g('click-outside', e.closeOnClickOutside)
      }),
        bp(
          [r],
          () => {
            e.closeOnFocusOutside && a.value && g('focus-outside', e.closeOnFocusOutside)
          },
          { onlyKeyboard: !0 },
        ))
      const y = i(() => (typeof e.cursor == 'object' ? e.cursor : e.cursor ? l.value : n.value)),
        { floatingStyles: m } = mp(
          y,
          r,
          d,
          i(() => ({
            placement: e.placement,
            offset: e.offset,
            autoPlacement: e.autoPlacement,
            stickToEdges: e.stickToEdges,
            keepAnchorWidth: e.keepAnchorWidth,
            verticalScrollOnOverflow: e.verticalScrollOnOverflow,
          })),
        ),
        b = () => {
          a.value = !1
        },
        h = () => {
          a.value = !0
        },
        { zIndex: $ } = Ds(a)
      return (
        re(a, (S) => {
          if (e.keyboardNavigation)
            if (S)
              Ye(() => {
                const w = Xe(r.value)
                w && $n(w)
              })
            else {
              if (!n.value) return
              $n(n.value)
            }
        }),
        {
          ...He(),
          ...zs(),
          anchorRef: n,
          anchorClass: v,
          floating: r,
          floatingStyles: m,
          showFloating: f,
          teleportTarget: p,
          isMounted: o,
          valueComputed: a,
          hide: b,
          show: h,
          zIndex: $,
        }
      )
    },
    render() {
      const e = {
          isOpened: this.valueComputed,
          hide: this.hide,
          show: this.show,
          toggle: () => (this.valueComputed ? this.hide() : this.show()),
          getAnchorWidth: () => {
            var o
            return ((o = this.anchorRef) == null ? void 0 : o.offsetWidth) + 'px'
          },
          getAnchorHeight: () => {
            var o
            return ((o = this.anchorRef) == null ? void 0 : o.offsetHeight) + 'px'
          },
        },
        t =
          this.showFloating &&
          hl(this.$slots.default, e, {
            ref: 'floating',
            class: ['va-dropdown__content-wrapper', this.$props.contentClass],
            style: [this.floatingStyles, { zIndex: this.zIndex }],
            ...this.teleportedAttrs,
          }),
        a = hl(this.$slots.anchor, e, {
          ref: 'anchorRef',
          role: this.$props.role,
          class: ['va-dropdown', ...this.anchorClass.asArray.value],
          style: { position: 'relative' },
          'aria-label': this.tp(this.$props.ariaLabel),
          'aria-disabled': this.$props.disabled,
          'aria-expanded': this.$props.role && this.$props.role !== 'none' ? !!this.showFloating : void 0,
          ...this.teleportFromAttrs,
          ...this.$attrs,
        })
      if (typeof this.$props.cursor == 'object' && t)
        return Re(Wa, { to: this.teleportTarget, disabled: this.$props.disabled }, [t])
      if (!this.$props.anchorSelector && !a) {
        De('VaDropdown: #anchor slot is missing')
        return
      }
      if (this.showFloating && !t) {
        De('VaDropdown: default slot is missing')
        return
      }
      return Re(be, {}, [a, t && Re(Wa, { to: this.teleportTarget, disabled: this.$props.disabled }, [t])])
    },
  }),
  Ct = Q(hp),
  Cp = G({
    name: 'VaDropdownContent',
    __name: 'VaDropdownContent',
    props: {
      noPadding: { type: Boolean, default: !1 },
      background: { type: String, default: 'background-secondary' },
      textColor: { type: String },
    },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        { textColorComputed: o } = tt(ut(t, 'background')),
        n = i(() => ({ background: a(t.background, void 0, !0), color: o.value, padding: t.noPadding ? 0 : void 0 }))
      return (l, r) => (
        C(),
        _('div', { class: 'va-dropdown__content', style: Y(n.value), role: 'listbox' }, [V(l.$slots, 'default')], 4)
      )
    },
  }),
  va = Q(Cp),
  zl = (e) => (typeof e == 'object' ? e.listen : e),
  rn = (e) => (typeof e == 'object' ? e.emit : e),
  ha = (e) => {
    const t = () => e.map(rn),
      a = (l) => `on${l.charAt(0).toUpperCase() + l.slice(1)}`
    return {
      createListeners: (l) => e.reduce((r, u) => ({ ...r, [a(zl(u))]: (...d) => l(rn(u), ...d) }), {}),
      createVOnListeners: (l) => e.reduce((r, u) => ({ ...r, [zl(u)]: (...d) => l(rn(u), ...d) }), {}),
      createEmits: t,
    }
  },
  { createEmits: Sp, createVOnListeners: $p } = ha(['click']),
  { createEmits: kp, createVOnListeners: wp } = ha([{ listen: 'click', emit: 'main-button-click' }]),
  sn = At(Ee(xe), ['iconRight', 'block']),
  Hl = Ee(Ct),
  _p = G({
    name: 'VaButtonDropdown',
    __name: 'VaButtonDropdown',
    props: {
      ...me,
      ...sn,
      ...Hl,
      ...Qe,
      ...ai,
      modelValue: { type: Boolean, default: !1 },
      stateful: { type: Boolean, default: !0 },
      icon: { type: String, default: 'va-arrow-down' },
      openedIcon: { type: String, default: 'va-arrow-up' },
      hideIcon: { type: Boolean, default: !1 },
      leftIcon: { type: Boolean, default: !1 },
      iconColor: { type: String, default: '' },
      disabled: { type: Boolean, default: !1 },
      disableButton: { type: Boolean, default: !1 },
      disableDropdown: { type: Boolean, default: !1 },
      offset: { type: [Number, Array], default: 2 },
      keepAnchorWidth: { type: Boolean, default: !1 },
      closeOnContentClick: { type: Boolean, default: !0 },
      split: { type: Boolean },
      splitTo: { type: String, default: '' },
      splitHref: { type: String, default: '' },
      loading: { type: Boolean, default: !1 },
      label: { type: String },
      ariaLabel: ye('$t:toggleDropdown'),
    },
    emits: ['update:modelValue', ...Sp(), ...kp()],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { valueComputed: l } = Ke(o, n),
        r = i(() => (l.value ? o.openedIcon : o.icon)),
        u = dt(),
        d = i(() => (o.hideIcon ? {} : { [(o.label || u.label) && !o.leftIcon ? 'icon-right' : 'icon']: r.value })),
        c = i(() => {
          const $ = ['to', 'href', 'loading', 'icon'],
            S = [
              'plain',
              'textOpacity',
              'backgroundOpacity',
              'hoverOpacity',
              'hoverBehavior',
              'hoverOpacity',
              'pressedOpacity',
              'pressedBehavior',
              'pressedOpacity',
            ]
          return o.preset ? Object.keys(At(sn, [...$, ...S])) : Object.keys(At(sn, $))
        }),
        v = i(() =>
          Object.entries(o)
            .filter(([$, S]) => c.value.includes($))
            .reduce(($, [S, w]) => (Object.assign($, { [S]: w }), $), {}),
        ),
        p = i(() => ({ to: o.splitTo, href: o.splitHref, loading: o.loading })),
        f = () => {
          l.value = !1
        },
        g = ze(Hl),
        y = $p(n),
        m = wp(n),
        { t: b, tp: h } = He()
      return (
        t({ hideDropdown: f }),
        ($, S) =>
          $.$props.split
            ? (C(),
              U(
                s(No),
                H({ key: 1 }, v.value, { class: ['va-button-dropdown', 'va-button-dropdown--split'] }),
                {
                  default: z(() => [
                    $.$props.leftIcon
                      ? E('', !0)
                      : (C(),
                        U(
                          s(xe),
                          H({ key: 0, disabled: $.$props.disabled || $.$props.disableButton }, p.value, wt(s(m))),
                          { default: z(() => [V($.$slots, 'label', {}, () => [Te(fe(e.label), 1)])]), _: 3 },
                          16,
                          ['disabled'],
                        )),
                    ue(
                      s(Ct),
                      H(s(g), {
                        modelValue: s(l),
                        'onUpdate:modelValue': S[1] || (S[1] = (w) => (mt(l) ? (l.value = w) : null)),
                        disabled: $.$props.disabled || $.$props.disableDropdown,
                      }),
                      {
                        anchor: z(() => [
                          ue(
                            s(xe),
                            H(
                              {
                                'aria-label': $.$props.ariaLabel || s(b)('toggleDropdown'),
                                disabled: $.$props.disabled || $.$props.disableDropdown,
                                icon: r.value,
                                'icon-color': $.$props.iconColor,
                              },
                              wt(s(y)),
                              { onKeydown: se(ne(f, ['prevent']), ['esc']) },
                            ),
                            null,
                            16,
                            ['aria-label', 'disabled', 'icon', 'icon-color', 'onKeydown'],
                          ),
                        ]),
                        default: z(() => [ue(s(va), null, { default: z(() => [V($.$slots, 'default')]), _: 3 })]),
                        _: 3,
                      },
                      16,
                      ['modelValue', 'disabled'],
                    ),
                    $.$props.leftIcon
                      ? (C(),
                        U(
                          s(xe),
                          H({ key: 1, disabled: $.$props.disabled || $.$props.disableButton }, p.value, wt(s(m))),
                          { default: z(() => [V($.$slots, 'label', {}, () => [Te(fe(e.label), 1)])]), _: 3 },
                          16,
                          ['disabled'],
                        ))
                      : E('', !0),
                  ]),
                  _: 3,
                },
                16,
              ))
            : (C(),
              U(
                s(Ct),
                H({ key: 0 }, s(g), {
                  modelValue: s(l),
                  'onUpdate:modelValue': S[0] || (S[0] = (w) => (mt(l) ? (l.value = w) : null)),
                  disabled: $.$props.disabled || $.$props.disableDropdown,
                  class: ['va-button-dropdown'],
                }),
                {
                  anchor: z(() => [
                    ue(
                      s(xe),
                      H({ 'aria-label': s(h)($.$props.ariaLabel) }, { ...d.value, ...v.value }, wt(s(y))),
                      { default: z(() => [V($.$slots, 'label', {}, () => [Te(fe(e.label), 1)])]), _: 3 },
                      16,
                      ['aria-label'],
                    ),
                  ]),
                  default: z(() => [
                    V($.$slots, 'content', {}, () => [
                      ue(s(va), null, { default: z(() => [V($.$slots, 'default')]), _: 3 }),
                    ]),
                  ]),
                  _: 3,
                },
                16,
                ['modelValue', 'disabled'],
              ))
      )
    },
  }),
  Vp = Q(_p),
  ii = (e, t) => {
    if (t.length === 0) return e
    const a = e[t[0]]
    return sa(a) ? ii(a, t.slice(1)) : t.length === 1 ? a : void 0
  },
  Un = (e, t) => (t in e ? e[t] : ((t = t.replace(/^\./, '')), ii(e, t.split('.')))),
  ui = (e, t) => {
    if (!(ft(e) || typeof e != 'object' || Array.isArray(e)))
      return t ? (typeof t == 'string' ? Un(e, t) : typeof t == 'function' ? t(e) : e) : e
  },
  Oa = {
    options: { type: Array, default: () => [] },
    textBy: { type: [String, Function], default: 'text' },
    valueBy: { type: [String, Function], default: '' },
    trackBy: { type: [String, Function], default: '' },
    disabledBy: { type: [String, Function], default: 'disabled' },
    groupBy: { type: [String, Function], default: 'group' },
  }
function xa(e) {
  const t = (d) => {
      const c = e.options
      for (let v = 0; v < c.length; v++) if (u(c[v]) === d) return c[v]
      return d
    },
    a = (d, c) => (sa(d) ? ui(d, c) : d),
    o = (d) => (e.trackBy ? a(d, e.trackBy) : u(d)),
    n = (d) => (sa(d) ? a(d, e.disabledBy) : !1),
    l = (d) => {
      const c = a(d, e.textBy)
      return ['number', 'boolean'].includes(typeof c) ? String(c) : c
    },
    r = (d) => {
      if (sa(d)) return a(d, e.groupBy)
    },
    u = (d) => a(d, e.valueBy)
  return { tryResolveByValue: t, getValue: u, getText: l, getDisabled: n, getTrackBy: o, getGroupBy: r }
}
const jl = Ee(No),
  Bp = G({
    name: 'VaButtonToggle',
    __name: 'VaButtonToggle',
    props: {
      ...jl,
      ...me,
      ...Oa,
      modelValue: { type: [String, Number, Boolean, Object], default: '' },
      options: { type: Array, required: !0 },
      activeButtonTextColor: { type: String },
      toggleColor: { type: String, default: '' },
      textBy: { type: [String, Function], default: 'label' },
      valueBy: { type: [String, Function], default: 'value' },
    },
    emits: ['update:modelValue'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { getText: n, getTrackBy: l } = xa(a),
        { getColor: r, shiftHSLAColor: u } = Ce(),
        d = i(() => r(a.color)),
        c = (b) => l(b) === a.modelValue,
        v = i(() => (a.toggleColor ? r(a.toggleColor) : u(d.value, { l: a.plain ? -16 : -6 }))),
        p = i(() => (!a.preset || a.preset === 'default' ? {} : { backgroundOpacity: a.pressedOpacity })),
        f = i(() => ({ color: v.value, textColor: a.activeButtonTextColor, ...p.value })),
        g = (b = {}) => {
          const h = { icon: b.icon, iconRight: b.iconRight }
          return c(b) ? { ...(c(b) && f.value), ...h } : h
        },
        y = ze(jl),
        m = (b) => o('update:modelValue', l(b))
      return (b, h) => (
        C(),
        U(
          s(No),
          H({ class: 'va-button-toggle' }, s(y)),
          {
            default: z(() => [
              (C(!0),
              _(
                be,
                null,
                Ie(
                  e.options,
                  ($) => (
                    C(),
                    U(
                      s(xe),
                      H({ key: s(l)($), 'aria-pressed': c($) }, g($), { onClick: (S) => m($) }),
                      { default: z(() => [Te(fe(s(n)($)), 1)]), _: 2 },
                      1040,
                      ['aria-pressed', 'onClick'],
                    )
                  ),
                ),
                128,
              )),
            ]),
            _: 1,
          },
          16,
        )
      )
    },
  }),
  Tp = Q(Bp),
  Ip = G({
    name: 'VaCard',
    __name: 'VaCard',
    props: {
      ...ba,
      ...me,
      tag: { type: String, default: 'div' },
      square: { type: Boolean, default: !1 },
      outlined: { type: Boolean, default: !1 },
      bordered: { type: Boolean, default: !0 },
      disabled: { type: Boolean, default: !1 },
      href: { type: String, default: '' },
      target: { type: String, default: '' },
      stripe: { type: Boolean, default: !1 },
      stripeColor: { type: String, default: '' },
      gradient: { type: Boolean, default: !1 },
      textColor: { type: String },
      color: { type: String, default: 'background-secondary' },
    },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        { isLinkTag: o, tagComputed: n, hrefComputed: l } = Jt(t),
        { textColorComputed: r } = tt(i(() => a(t.color))),
        u = i(() => a(t.stripeColor)),
        d = Fe('va-card', () => ({
          ...Ge(t, ['square', 'outlined', 'disabled', 'stripe']),
          noBorder: !t.bordered,
          link: o.value,
        })),
        c = i(() => ({ background: t.gradient && t.color ? En(a(t.color)) : a(t.color), color: r.value }))
      return (v, p) => (
        C(),
        U(
          pt(s(n)),
          {
            class: pe(['va-card', s(d)]),
            style: Y([c.value, `--va-stripe-color-computed: ${String(u.value)}`]),
            href: s(l),
            target: e.target,
            to: v.to,
            replace: v.replace,
            exact: v.exact,
            'active-class': v.activeClass,
            'exact-active-class': v.exactActiveClass,
          },
          { default: z(() => [V(v.$slots, 'default')]), _: 3 },
          8,
          ['class', 'style', 'href', 'target', 'to', 'replace', 'exact', 'active-class', 'exact-active-class'],
        )
      )
    },
  }),
  Pp = { class: 'va-card__content' },
  Ap = G({
    name: 'VaCardContent',
    __name: 'VaCardContent',
    setup(e) {
      return (t, a) => (C(), _('div', Pp, [V(t.$slots, 'default')]))
    },
  }),
  Lp = G({
    name: 'VaCardTitle',
    __name: 'VaCardTitle',
    props: { ...me, textColor: { type: String } },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        o = i(() => ({ color: t.textColor ? a(t.textColor) : '' }))
      return (n, l) => (
        C(),
        _(
          'div',
          { class: 'va-card-title va-card__title', style: Y(o.value) },
          [V(n.$slots, 'default', {}, void 0, !0)],
          4,
        )
      )
    },
  }),
  Ca = (e, t) => {
    const a = e.__vccOpts || e
    for (const [o, n] of t) a[o] = n
    return a
  },
  Op = Ca(Lp, [['__scopeId', 'data-v-5cd66b25']]),
  xp = G({
    name: 'VaCardActions',
    __name: 'VaCardActions',
    props: { ...ri, ...me },
    setup(e) {
      const t = e,
        { alignComputed: a } = si(t),
        o = Fe('va-card__actions', () => ({ ...Ge(t, ['vertical']) }))
      return (n, l) => (
        C(),
        _('div', { class: pe(['va-card__actions', s(o)]), style: Y(s(a)) }, [V(n.$slots, 'default')], 6)
      )
    },
  }),
  Ep = G({
    name: 'VaCardBlock',
    __name: 'VaCardBlock',
    props: { horizontal: { type: Boolean, default: !1 } },
    setup(e) {
      const t = e,
        a = i(() => ({ 'va-card-block--horizontal': t.horizontal }))
      return (o, n) => (C(), _('div', { class: pe(['va-card-block', a.value]) }, [V(o.$slots, 'default')], 2))
    },
  }),
  Dp = Q(Ap),
  Fp = Q(Op),
  Mp = Q(xp),
  Np = Q(Ep),
  Rp = Q(Ip),
  zp = (e, t) => {
    const a = (d) => {
        t.value = d
      },
      o = () => {
        if (e.infinite && t.value <= 0) {
          t.value = e.items.length - 1
          return
        }
        t.value -= 1
      },
      n = () => {
        if (e.infinite && t.value >= e.items.length - 1) {
          t.value = 0
          return
        }
        t.value += 1
      },
      l = i(() => e.items.length > 1),
      r = i(() => t.value > 0 || e.infinite),
      u = i(() => t.value < e.items.length - 1 || e.infinite)
    return { doShowPrevButton: r, doShowNextButton: u, doShowDirectionButtons: l, goTo: a, prev: o, next: n }
  },
  Hp = (e, t) => {
    let a = -1
    const o = () => {
      e.autoscroll &&
        (clearInterval(a),
        (a = setInterval(() => {
          ;((t.value += 1), t.value >= e.items.length && (t.value = 0))
        }, e.autoscrollInterval)))
    }
    let n
    const l = () => {
        e.autoscroll &&
          (clearInterval(a),
          (n = setTimeout(() => {
            ;(o(), clearTimeout(n))
          }, e.autoscrollPauseDuration)))
      },
      r = () => {
        ;(clearInterval(a), clearTimeout(n))
      }
    ;(Me(() => o()), et(() => r()))
    const u =
        (g) =>
        (...y) => {
          ;(l(), g(...y))
        },
      d = D({ transition: void 0 }),
      c = D(0),
      v = i(() =>
        e.effect === 'fade'
          ? { ...d.value, transition: 'none' }
          : e.vertical
            ? { ...d.value, transform: `translateY(${c.value * -100}%)` }
            : { ...d.value, transform: `translateX(${c.value * -100}%)` },
      ),
      p = {
        isAnimating: !1,
        speed: 0.3,
        order: [],
        move(g, y) {
          const m = e.items.length - 1,
            b = e.items.length
          ;(y === 0 && g === m
            ? (this.order.push({ to: b }), this.order.push({ to: 0, animate: !1 }))
            : y === m && g === 0
              ? (this.order.push({ to: b, animate: !1 }), this.order.push({ to: y }))
              : this.order.push({ to: y }),
            this.isAnimating || this.runAnimation())
        },
        runAnimation() {
          this.isAnimating = !0
          const g = this.order.shift()
          if (!g) {
            this.isAnimating = !1
            return
          }
          ;((c.value = g == null ? void 0 : g.to),
            g.animate || g.animate === void 0
              ? ((d.value.transition = `all ${this.speed}s linear`),
                setTimeout(() => {
                  this.runAnimation()
                }, this.speed * 1e3))
              : ((d.value.transition = 'none'),
                setTimeout(() => {
                  this.runAnimation()
                }, 16)))
        },
      }
    re(t, (g, y) => {
      p.move(y, g)
    })
    const f = i(() =>
      e.effect === 'fade' ? [e.items[t.value]] : e.infinite || e.autoscroll ? [...e.items, e.items[0]] : e.items,
    )
    return { start: o, pause: l, stop: r, withPause: u, computedSlidesStyle: v, slides: f }
  },
  jp = () => {
    const { setHSLAColor: e, getColor: t } = Ce()
    return {
      computedColor: i(() => e(t('background-element'), { a: 0.7 })),
      computedHoverColor: i(() => e(t('primary'), { a: 0.7 })),
      computedActiveColor: i(() => t('primary')),
    }
  },
  Up = {
    src: { type: String, required: !0 },
    alt: { type: String, default: '' },
    title: { type: String, default: '' },
    sizes: { type: String, default: '' },
    srcset: { type: String, default: '' },
    draggable: { type: Boolean, default: !0 },
    loading: { type: String },
    crossorigin: { type: String },
    decoding: { type: String },
    fetchpriority: { type: String, default: 'auto' },
    referrerpolicy: { type: String },
  },
  Wp = (e) =>
    i(() =>
      Ge(e, [
        'src',
        'alt',
        'title',
        'sizes',
        'srcset',
        'loading',
        'referrerpolicy',
        'fetchpriority',
        'decoding',
        'crossorigin',
        'draggable',
      ]),
    ),
  ci = (e, t = D({}), a = D([]), o = !0) => {
    const n = D(),
      l = () => {
        var v
        ;(v = n.value) == null || v.disconnect()
      },
      r = (v) => {
        var p
        const f = Xe(s(v))
        f && ((p = n.value) == null || p.observe(f))
      },
      u = (v) => {
        v.forEach(r)
      },
      d = () => {
        n.value = new IntersectionObserver(e, t.value)
      },
      c = i(() => !o || !(typeof window < 'u' && 'IntersectionObserver' in window))
    return (
      re(
        [a, t],
        ([v]) => {
          c.value || (l(), v && (d(), Array.isArray(v) ? u(v) : r(v)))
        },
        { immediate: !0 },
      ),
      et(l),
      { isIntersectionDisabled: c }
    )
  },
  Kp = ['aria-busy'],
  Gp = { key: 0, class: 'va-image__overlay' },
  qp = { key: 1, class: 'va-image__error' },
  Yp = { key: 2, class: 'va-image__loader' },
  Xp = { key: 3, class: 'va-image__placeholder' },
  Jp = ['src'],
  Ul = Ee(Va),
  Zp = G({
    name: 'VaImage',
    __name: 'VaImage',
    props: {
      ...me,
      ...Up,
      ...Ul,
      ratio: {
        type: [Number, String],
        default: 'auto',
        validator: (e) => (typeof e == 'number' ? e > 0 : e === 'auto'),
      },
      fit: { type: String, default: 'cover' },
      maxWidth: { type: [Number, String], default: 0, validator: (e) => Number(e) >= 0 },
      lazy: { type: Boolean, default: !1 },
      placeholderSrc: { type: String, default: '' },
    },
    emits: ['loaded', 'error', 'fallback'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = D(),
        l = D(),
        r = D(),
        u = i(() => r.value || a.src),
        d = D(1),
        c = D(1),
        v = D(!1),
        p = D(!1),
        f = () => {
          var X
          ;((v.value = !0),
            h.value &&
              ((v.value = !1), (r.value = (X = l.value) == null ? void 0 : X.currentSrc), A(), o('loaded', u.value)))
        },
        g = (X) => {
          ;((p.value = !0), (v.value = !1), o('error', X || u.value))
        },
        y = D(!1),
        m = (X, ce) => {
          X.forEach((ke) => {
            ke.isIntersecting && ((y.value = !0), w(), ce.disconnect())
          })
        },
        { isIntersectionDisabled: b } = ci(m, void 0, n, a.lazy),
        h = i(() => b.value || y.value),
        $ = eo(),
        S = i(() => !a.lazy || (a.lazy && $.value && h.value)),
        w = () => {
          !a.src ||
            (v.value && b.value) ||
            !h.value ||
            ((v.value = !0),
            (p.value = !1),
            Ye(() => {
              var X
              if ((X = l.value) != null && X.complete) {
                if (!l.value.naturalWidth) {
                  g()
                  return
                }
                f()
              }
            }))
        }
      let I
      const A = () => {
        ;(clearTimeout(I), v.value && (I = window.setTimeout(A, 100)))
        const { naturalHeight: X, naturalWidth: ce } = l.value || {}
        X && ce && ((d.value = X), (c.value = ce))
      }
      ;(Rr(w), et(() => clearTimeout(I)), re(() => a.src, w))
      const k = dt(),
        T = i(() => {
          var X
          return ((X = k == null ? void 0 : k.placeholder) == null ? void 0 : X.call(k)) || a.placeholderSrc
        }),
        O = i(() => {
          var X
          return v.value && !((X = k == null ? void 0 : k.loader) != null && X.call(k))
        }),
        M = i(() => {
          var X
          return p.value && !((X = k == null ? void 0 : k.error) != null && X.call(k)) && !P.value
        }),
        ae = i(() => (O.value || M.value) && T.value),
        oe = i(() => !(v.value || p.value)),
        B = Wp(a),
        K = i(() => ({ ...Ge(a, ['ratio', 'maxWidth']), contentWidth: d.value, contentHeight: c.value })),
        L = ze(Ul),
        x = (X) => !!Object.values(X || {}).filter((ce) => ce).length,
        N = i(() => {
          var X, ce, ke, de
          return x(
            (de =
              (ke = (ce = (X = xt()) == null ? void 0 : X.globalConfig) == null ? void 0 : ce.value) == null
                ? void 0
                : ke.components) == null
              ? void 0
              : de.VaFallback,
          )
        }),
        P = i(() => x(L.value) || N.value),
        te = i(() => a.fit)
      return (X, ce) => (
        C(),
        U(
          s(Js),
          H({ ref_key: 'root', ref: n, class: 'va-image' }, K.value, {
            style: `--va-fit-computed: ${String(te.value)}`,
          }),
          {
            default: z(() => [
              Bt(
                R(
                  'picture',
                  { class: 'va-image__content', 'aria-busy': v.value },
                  [
                    X.$slots.sources ? V(X.$slots, 'sources', { key: 0 }) : E('', !0),
                    S.value
                      ? (C(),
                        _('img', H({ key: 1, ref_key: 'image', ref: l }, s(B), { onError: g, onLoad: f }), null, 16))
                      : E('', !0),
                  ],
                  8,
                  Kp,
                ),
                [[Ka, oe.value]],
              ),
              X.$slots.default && oe.value ? (C(), _('div', Gp, [V(X.$slots, 'default')])) : E('', !0),
              p.value && (X.$slots.error || P.value)
                ? (C(),
                  _('div', qp, [
                    V(X.$slots, 'error', {}, () => [
                      ue(s(Va), H(s(L), { onFallback: ce[0] || (ce[0] = (ke) => X.$emit('fallback')) }), null, 16),
                    ]),
                  ]))
                : E('', !0),
              v.value && X.$slots.loader ? (C(), _('div', Yp, [V(X.$slots, 'loader')])) : E('', !0),
              ae.value
                ? (C(),
                  _('div', Xp, [
                    V(X.$slots, 'placeholder', {}, () => [
                      X.$props.placeholderSrc
                        ? (C(), _('img', { key: 0, src: X.$props.placeholderSrc, alt: '' }, null, 8, Jp))
                        : E('', !0),
                    ]),
                  ]))
                : E('', !0),
            ]),
            _: 3,
          },
          16,
          ['style'],
        )
      )
    },
  }),
  Wn = Q(Zp),
  Qp = G({
    name: 'VaHover',
    __name: 'VaHover',
    props: { ...Fs(!0), ...me, disabled: { type: Boolean, default: !1 }, modelValue: { type: Boolean, default: !1 } },
    emits: [...lt],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { valueComputed: n } = Ke(a, o),
        l = () => {
          a.disabled || (n.value = !0)
        },
        r = () => {
          a.disabled || (n.value = !1)
        }
      return (u, d) => (
        C(),
        _(
          'div',
          { class: 'va-hover', onMouseenter: l, onMouseleave: r },
          [V(u.$slots, 'default', J(ie({ hover: s(n) })))],
          32,
        )
      )
    },
  }),
  bo = Q(Qp),
  ef = ['mousedown', 'mousemove'],
  tf = ['touchstart', 'touchmove'],
  Kn = { vertical: ['', 'all', 'vertical'], horizontal: ['', 'all', 'horizontal'] },
  af = [...Kn.vertical, 'up', 'down'],
  of = [...Kn.horizontal, 'left', 'right'],
  nf = {
    swipable: { type: Boolean, default: !1 },
    swipeDistance: { type: Number, default: 75 },
    swipeDirection: { type: String, default: 'all' },
  },
  lf = (e, t, a) => {
    const o = D(!1),
      n = Nt({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }),
      l = Nt({ start: 0, end: 0 }),
      r = (y, m) => {
        let b
        if ((ef.includes(y.type) && (b = y), tf.includes(y.type))) {
          const h = y
          b = h.changedTouches[h.changedTouches.length - 1]
        }
        b && ((n[m].x = b.pageX), (n[m].y = b.pageY), (l[m] = new Date().getTime()))
      },
      u = (y) => {
        !e.swipable || o.value || ((o.value = !0), r(y, 'start'))
      },
      d = (y) => {
        o.value && r(y, 'end')
      },
      c = () => {
        ;(['start', 'end'].forEach((y) => {
          ;((n[y].x = 0), (n[y].y = 0), (l[y] = 0))
        }),
          (o.value = !1))
      },
      v = Nt({ vertical: !1, horizontal: !1 })
    St(() => {
      ;((v.horizontal = of.includes(e.swipeDirection)), (v.vertical = af.includes(e.swipeDirection)))
    })
    const p = (y) =>
        v[y === 'x' ? 'horizontal' : 'vertical'] && n.start[y] && n.end[y] ? Math.trunc(n.start[y] - n.end[y]) : 0,
      f = (y, m) => (m === e.swipeDirection || Kn[y].includes(e.swipeDirection) ? m : ''),
      g = Nt({ direction: '', duration: 0 })
    return (
      re(
        n,
        () => {
          const y = p('x'),
            m = p('y')
          if ((y || m) && [y, m].some((b) => Math.abs(b) >= e.swipeDistance)) {
            if (Math.abs(y) >= Math.abs(m) && v.horizontal) {
              const b = y > 0 ? 'left' : 'right'
              g.direction = f('horizontal', b)
            } else if (Math.abs(y) < Math.abs(m) && v.vertical) {
              const b = m > 0 ? 'down' : 'up'
              g.direction = f('vertical', b)
            }
            ;((g.duration = l.end - l.start), c())
          }
        },
        { deep: !0 },
      ),
      re(g, () => a(g), { deep: !0 }),
      e.swipable &&
        (We(['touchstart', 'mousedown'], u, t),
        We(['touchmove', 'mousemove'], d, t),
        We(['touchcancel', 'mouseup', 'touchend', 'mouseleave'], c, t)),
      { swipeState: g }
    )
  },
  rf = ['aria-label'],
  sf = { key: 1, class: 'va-carousel__indicators' },
  uf = { class: 'va-carousel__content' },
  cf = ['aria-hidden', 'aria-current', 'aria-label'],
  Wl = Ee(Wn, ['src', 'alt']),
  df = G({
    name: 'VaCarousel',
    __name: 'VaCarousel',
    props: {
      ...nf,
      ...Qe,
      ...me,
      ...Wl,
      stateful: { type: Boolean, default: !0 },
      modelValue: { type: Number, default: 0 },
      items: { type: Array, required: !0 },
      autoscroll: { type: Boolean, default: !1 },
      autoscrollInterval: { type: [Number, String], default: 5e3 },
      autoscrollPauseDuration: { type: [Number, String], default: 2e3 },
      infinite: { type: Boolean, default: !0 },
      fadeKeyframe: { type: String, default: 'va-carousel-fade-appear 1s' },
      arrows: { type: Boolean, default: !0 },
      indicators: { type: Boolean, default: !0 },
      indicatorTrigger: { type: String, default: 'click', validator: (e) => ['click', 'hover', 'none'].includes(e) },
      vertical: { type: Boolean, default: !1 },
      height: { type: String, default: '300px' },
      effect: { type: String, default: 'transition', validator: (e) => ['fade', 'transition'].includes(e) },
      color: { type: String, default: 'primary' },
      ratio: { type: [Number, String] },
      ariaLabel: ye('$t:carousel'),
      ariaPreviousLabel: ye('$t:goPreviousSlide'),
      ariaNextLabel: ye('$t:goNextSlide'),
      ariaGoToSlideLabel: ye('$t:goSlide'),
      ariaSlideOfLabel: ye('$t:slideOf'),
    },
    emits: [...lt],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { valueComputed: l } = Ke(o, n, 'modelValue'),
        r = Pe('autoscrollInterval'),
        u = Pe('autoscrollPauseDuration'),
        d = Pe('ratio'),
        { goTo: c, next: v, prev: p, doShowNextButton: f, doShowPrevButton: g, doShowDirectionButtons: y } = zp(o, l),
        {
          withPause: m,
          computedSlidesStyle: b,
          slides: h,
        } = Hp(
          {
            items: o.items,
            autoscrollInterval: r.value,
            autoscrollPauseDuration: u.value,
            autoscroll: o.autoscroll,
            infinite: o.infinite,
            effect: o.effect,
            vertical: o.vertical,
            fadeKeyframe: o.fadeKeyframe,
          },
          l,
        ),
        $ = i(() => o.items.length && o.items.every((x) => !!x && typeof x == 'object' && !!(x != null && x.src))),
        S = (x) => x === l.value,
        w = i(() => ({ animation: o.effect === 'fade' ? 'fadeKeyframe' : void 0 })),
        I = we()
      lf(o, I, (x) => {
        switch (x.direction) {
          case 'right':
          case 'up':
            g.value && p()
            break
          case 'left':
          case 'down':
            f.value && v()
        }
      })
      const k = (x) =>
          o.indicatorTrigger === 'hover'
            ? { onmouseover: () => c(x) }
            : o.indicatorTrigger === 'click'
              ? { onclick: () => c(x) }
              : {},
        { tp: T } = He(),
        { computedActiveColor: O, computedColor: M, computedHoverColor: ae } = jp(),
        oe = ze(Wl),
        B = m(c),
        K = m(p),
        L = m(v)
      return (
        t({ currentSlide: l, goTo: c, next: v, prev: p, goToWithPause: B, prevWithPause: K, nextWithPause: L }),
        (x, N) => (
          C(),
          _(
            'div',
            {
              class: pe([
                'va-carousel',
                { 'va-carousel--vertical': x.$props.vertical, [`va-carousel--${x.$props.effect}`]: !0 },
              ]),
              style: Y({ height: s(d) ? 'auto' : e.height }),
              role: 'region',
              'aria-label': s(T)(x.$props.ariaLabel),
            },
            [
              x.$props.arrows && s(y)
                ? (C(),
                  _(
                    be,
                    { key: 0 },
                    [
                      s(g)
                        ? (C(),
                          _(
                            'div',
                            {
                              key: 0,
                              class: 'va-carousel__arrow va-carousel__arrow--left',
                              onClick: N[0] || (N[0] = (...P) => s(K) && s(K)(...P)),
                              onKeydown:
                                N[1] ||
                                (N[1] = se(
                                  ne((...P) => s(K) && s(K)(...P), ['stop']),
                                  ['enter'],
                                )),
                            },
                            [
                              V(x.$slots, 'prev-arrow', {}, () => [
                                ue(
                                  s(bo),
                                  { stateful: '' },
                                  {
                                    default: z(({ hover: P }) => [
                                      ue(
                                        s(xe),
                                        {
                                          color: P ? s(ae) : s(M),
                                          icon: e.vertical ? 'va-arrow-up' : 'va-arrow-left',
                                          'aria-label': s(T)(x.$props.ariaPreviousLabel),
                                        },
                                        null,
                                        8,
                                        ['color', 'icon', 'aria-label'],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ),
                              ]),
                            ],
                            32,
                          ))
                        : E('', !0),
                      s(f)
                        ? (C(),
                          _(
                            'div',
                            {
                              key: 1,
                              class: 'va-carousel__arrow va-carousel__arrow--right',
                              onClick: N[2] || (N[2] = (...P) => s(L) && s(L)(...P)),
                              onKeydown:
                                N[3] ||
                                (N[3] = se(
                                  ne((...P) => s(L) && s(L)(...P), ['stop']),
                                  ['enter'],
                                )),
                            },
                            [
                              V(x.$slots, 'next-arrow', {}, () => [
                                ue(
                                  s(bo),
                                  { stateful: '' },
                                  {
                                    default: z(({ hover: P }) => [
                                      ue(
                                        s(xe),
                                        {
                                          color: P ? s(ae) : s(M),
                                          icon: e.vertical ? 'va-arrow-down' : 'va-arrow-right',
                                          'aria-label': s(T)(x.$props.ariaNextLabel),
                                        },
                                        null,
                                        8,
                                        ['color', 'icon', 'aria-label'],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ),
                              ]),
                            ],
                            32,
                          ))
                        : E('', !0),
                    ],
                    64,
                  ))
                : E('', !0),
              x.$props.indicators
                ? (C(),
                  _('div', sf, [
                    (C(!0),
                    _(
                      be,
                      null,
                      Ie(
                        x.$props.items,
                        (P, te) => (
                          C(),
                          _(
                            'div',
                            H(
                              {
                                class: ['va-carousel__indicator', { 'va-carousel__indicator--active': S(te) }],
                                key: te,
                              },
                              k(te),
                            ),
                            [
                              V(
                                x.$slots,
                                'indicator',
                                J(ie({ item: P, index: te, goTo: s(B), isActive: S(te) })),
                                () => [
                                  ue(
                                    s(bo),
                                    { stateful: '' },
                                    {
                                      default: z(({ hover: X }) => [
                                        ue(
                                          s(xe),
                                          {
                                            'aria-label': s(T)(x.$props.ariaGoToSlideLabel, { index: te + 1 }),
                                            round: '',
                                            color: S(te) ? s(O) : X ? s(ae) : s(M),
                                          },
                                          { default: z(() => [Te(fe(te + 1), 1)]), _: 2 },
                                          1032,
                                          ['aria-label', 'color'],
                                        ),
                                      ]),
                                      _: 2,
                                    },
                                    1024,
                                  ),
                                ],
                              ),
                            ],
                            16,
                          )
                        ),
                      ),
                      128,
                    )),
                  ]))
                : E('', !0),
              R('div', uf, [
                R(
                  'div',
                  { ref_key: 'slidesContainer', ref: I, class: 'va-carousel__slides', style: Y(s(b)), role: 'list' },
                  [
                    (C(!0),
                    _(
                      be,
                      null,
                      Ie(
                        s(h),
                        (P, te) => (
                          C(),
                          _(
                            'div',
                            {
                              key: P,
                              role: 'listitem',
                              class: 'va-carousel__slide',
                              style: Y(w.value),
                              'aria-hidden': !S(te),
                              'aria-current': S(te),
                              'aria-label': s(T)(x.$props.ariaSlideOfLabel, { index: te + 1, length: s(h).length }),
                            },
                            [
                              V(x.$slots, 'default', J(ie({ item: P, index: te, goTo: s(B), isActive: S(te) })), () => [
                                ue(
                                  s(Wn),
                                  H(s(oe), { src: $.value ? P.src : P, alt: $.value ? P.alt : '', draggable: !1 }),
                                  null,
                                  16,
                                  ['src', 'alt'],
                                ),
                              ]),
                            ],
                            12,
                            cf,
                          )
                        ),
                      ),
                      128,
                    )),
                  ],
                  4,
                ),
              ]),
            ],
            14,
            rf,
          )
        )
      )
    },
  }),
  vf = Q(df),
  Gn = {
    ...Qe,
    ...to,
    ...zt,
    arrayValue: { type: [String, Boolean, Object, Number], default: null },
    label: { type: String, default: '' },
    leftLabel: { type: Boolean, default: !1 },
    trueValue: { type: null, default: !0 },
    falseValue: { type: null, default: !1 },
    indeterminate: { type: Boolean, default: !1 },
    indeterminateValue: { type: null, default: null },
    disabled: { type: Boolean, default: !1 },
    readonly: { type: Boolean, default: !1 },
  },
  Ro = [...Xt, 'update:modelValue', 'focus', 'blur'],
  pf = (e) => {
    const t = [e.falseValue, e.trueValue]
    if ((e.indeterminate && t.push(e.indeterminateValue), new Set(t).size !== t.length))
      throw new Error(
        'falseValue, trueValue, indeterminateValue props should have strictly different values, which is not the case.',
      )
  },
  qn = (e, t, { input: a, label: o, container: n }) => {
    pf(e)
    const l = () =>
        f(() => {
          ;(t('update:modelValue', !1), g())
        }),
      r = () => {
        var M
        ;(M = Xe(a.value)) == null || M.focus()
      },
      { valueComputed: u } = Ke(e, t),
      {
        computedError: d,
        computedErrorMessages: c,
        validationAriaAttributes: v,
        listeners: p,
        withoutValidation: f,
        resetValidation: g,
        isDirty: y,
        isTouched: m,
        isError: b,
        isLoading: h,
        isValid: $,
      } = Ht(e, t, { reset: l, focus: r, value: u }),
      { isFocused: S } = jt(),
      w = (M) => {
        ;(t('blur', M), (S.value = !1), p.onBlur())
      },
      I = (M) => {
        ;((S.value = !0), t('focus', M))
      },
      A = i(() => e.indeterminate && u.value === e.indeterminateValue),
      k = i(() => e.arrayValue !== void 0 && e.arrayValue !== null),
      T = i(() => {
        var M
        return k.value ? ((M = e.modelValue) == null ? void 0 : M.includes(e.arrayValue)) : u.value === e.trueValue
      })
    return {
      isDirty: y,
      isTouched: m,
      isError: b,
      isLoading: h,
      isValid: $,
      isChecked: T,
      isIndeterminate: A,
      onBlur: w,
      onFocus: I,
      toggleSelection: () => {
        if (!(e.readonly || e.disabled || e.loading)) {
          if (k.value) {
            e.modelValue
              ? Array.isArray(e.modelValue)
                ? e.modelValue.includes(e.arrayValue)
                  ? t(
                      'update:modelValue',
                      e.modelValue.filter((M) => M !== e.arrayValue),
                    )
                  : t('update:modelValue', e.modelValue.concat(e.arrayValue))
                : t('update:modelValue', e.modelValue === e.arrayValue ? [] : [e.modelValue, e.arrayValue])
              : t('update:modelValue', [e.arrayValue])
            return
          }
          if (e.indeterminate) {
            A.value ? (u.value = e.trueValue) : T.value ? (u.value = e.falseValue) : (u.value = e.indeterminateValue)
            return
          }
          T.value ? (u.value = e.falseValue) : (u.value = e.trueValue)
        }
      },
      reset: l,
      focus: r,
      computedError: d,
      computedErrorMessages: c,
      validationAriaAttributes: v,
    }
  }
var Kl
function Ea() {
  const e = D(!1)
  let t = !1
  return {
    hasKeyboardFocus: e,
    keyboardFocusListeners: {
      mousedown: () => {
        t = !0
      },
      focus: () => {
        ;(t || (e.value = !0), (t = !1))
      },
      blur: () => {
        ;((e.value = !1), (t = !1))
      },
    },
  }
}
let wn = !1
;(Kl = Ss()) == null ||
  Kl.addEventListener('mousedown', () => {
    ;((wn = !0),
      setTimeout(() => {
        wn = !1
      }, 300))
  })
function ff() {
  const e = D(!1)
  return {
    hasKeyboardFocus: e,
    keyboardFocusListeners: {
      focus: () => {
        wn || (e.value = !0)
      },
      blur: () => {
        e.value = !1
      },
    },
  }
}
const mf = ['id', 'indeterminate', 'value', 'checked'],
  gf = ['for'],
  Gl = [Boolean, Array, String, Object],
  yf = G({
    name: 'VaCheckbox',
    __name: 'VaCheckbox',
    props: {
      ...Gn,
      ...me,
      modelValue: { type: Gl, default: !1 },
      color: { type: String, default: 'primary' },
      checkedIcon: { type: String, default: 'va-check' },
      indeterminate: { type: Boolean, default: !1 },
      indeterminateValue: { type: Gl, default: null },
      indeterminateIcon: { type: String, default: 'remove' },
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      ariaLabel: { type: String, default: void 0 },
      vertical: { type: Boolean, default: !1 },
    },
    emits: Ro,
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = { container: we(), input: we(), label: we() },
        {
          isChecked: r,
          computedError: u,
          isIndeterminate: d,
          computedErrorMessages: c,
          validationAriaAttributes: v,
          toggleSelection: p,
          onBlur: f,
          onFocus: g,
          isDirty: y,
          isTouched: m,
          isError: b,
          isLoading: h,
          isValid: $,
        } = qn(o, n, l),
        { getColor: S } = Ce(),
        { hasKeyboardFocus: w, keyboardFocusListeners: I } = Ea(),
        { textColorComputed: A } = tt(i(() => S(o.color))),
        k = i(() => r.value || d.value),
        T = i(() => ({
          'va-checkbox--selected': r.value,
          'va-checkbox--readonly': o.readonly,
          'va-checkbox--disabled': o.disabled,
          'va-checkbox--indeterminate': o.indeterminate,
          'va-checkbox--error': u.value,
          'va-checkbox--left-label': o.leftLabel,
          'va-checkbox--on-keyboard-focus': w.value,
        })),
        O = () => {
          switch (!0) {
            case !o.label:
              return ''
            case o.vertical:
              return 'var(--va-checkbox-vertical-padding)'
            case !!o.arrayValue:
              return 'var(--va-checkbox-horizontal-padding)'
            case o.leftLabel:
              return 'var(--va-checkbox-right-padding)'
            default:
              return 'var(--va-checkbox-left-padding)'
          }
        },
        M = i(() => ({ color: u.value ? S('danger') : o.success ? S('success') : '', padding: O() })),
        ae = i(() => {
          const P = { background: k.value ? S(o.color) : '', borderColor: k.value ? S(o.color) : '' }
          return (u.value && (P.borderColor = S('danger')), o.success && (P.borderColor = S('success')), P)
        }),
        oe = i(() => (o.indeterminate && d.value ? o.indeterminateIcon : o.checkedIcon)),
        B = Dt(),
        K = i(() => o.id || String(B)),
        L = i(() => o.name || String(B)),
        x = i(() => ({
          name: L.value,
          disabled: o.disabled,
          readonly: o.readonly,
          tabindex: o.disabled ? -1 : 0,
          'aria-label': o.ariaLabel,
          'aria-disabled': o.disabled,
          'aria-readOnly': o.readonly,
          'aria-checked': k.value,
          ...v.value,
        })),
        N = i(() => (o.vertical ? '--va-checkbox-display-flex' : 'var(--va-checkbox-display)'))
      return (
        t({ toggleSelection: p, isDirty: y, isTouched: m, isError: b, isLoading: h, isValid: $ }),
        (P, te) => (
          C(),
          U(
            s(xo),
            {
              class: pe(['va-checkbox', T.value]),
              disabled: P.disabled,
              success: P.success,
              messages: P.messages,
              error: s(u),
              'error-messages': s(c),
              'error-count': P.errorCount,
              style: Y(`--va-display-val: ${String(N.value)}`),
            },
            {
              default: z(() => [
                R(
                  'div',
                  {
                    ref: 'container',
                    class: 'va-checkbox__input-container',
                    onClick: te[6] || (te[6] = (...X) => s(p) && s(p)(...X)),
                    onBlur: te[7] || (te[7] = (...X) => s(f) && s(f)(...X)),
                  },
                  [
                    R(
                      'div',
                      {
                        class: 'va-checkbox__square',
                        style: Y(ae.value),
                        onSelectstart: te[4] || (te[4] = ne(() => {}, ['prevent'])),
                      },
                      [
                        R(
                          'input',
                          H(
                            {
                              ref: 'input',
                              type: 'checkbox',
                              class: 'va-checkbox__input',
                              id: K.value,
                              indeterminate: e.indeterminate,
                              value: P.label,
                              checked: k.value,
                            },
                            x.value,
                            wt(s(I), !0),
                            {
                              onFocus: te[0] || (te[0] = (...X) => s(g) && s(g)(...X)),
                              onBlur: te[1] || (te[1] = (...X) => s(f) && s(f)(...X)),
                              onClick: te[2] || (te[2] = ne(() => {}, ['stop', 'prevent'])),
                              onKeypress: te[3] || (te[3] = ne((...X) => s(p) && s(p)(...X), ['prevent'])),
                            },
                          ),
                          null,
                          16,
                          mf,
                        ),
                        k.value
                          ? (C(),
                            U(s(Oe), { key: 0, class: 'va-checkbox__icon', name: oe.value, color: s(A) }, null, 8, [
                              'name',
                              'color',
                            ]))
                          : E('', !0),
                      ],
                      36,
                    ),
                    P.label || P.$slots.label
                      ? (C(),
                        _(
                          'label',
                          {
                            key: 0,
                            ref: 'label',
                            class: 'va-checkbox__label',
                            for: K.value,
                            style: Y(M.value),
                            onBlur: te[5] || (te[5] = (...X) => s(f) && s(f)(...X)),
                          },
                          [V(P.$slots, 'label', {}, () => [Te(fe(P.label), 1)])],
                          44,
                          gf,
                        ))
                      : E('', !0),
                  ],
                  544,
                ),
              ]),
              _: 3,
            },
            8,
            ['class', 'disabled', 'success', 'messages', 'error', 'error-messages', 'error-count', 'style'],
          )
        )
      )
    },
  }),
  oo = Q(yf),
  bf = { class: 'va-chip__content' },
  hf = G({
    name: 'VaChip',
    __name: 'VaChip',
    props: {
      ...ba,
      ...Dn,
      ...Qe,
      ...me,
      modelValue: { type: Boolean, default: !0 },
      closeable: { type: Boolean, default: !1 },
      outline: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      readonly: { type: Boolean, default: !1 },
      square: { type: Boolean, default: !1 },
      shadow: { type: Boolean, default: !1 },
      flat: { type: Boolean, default: !1 },
      icon: { type: String, default: '' },
      tag: { type: String, default: 'span' },
      size: { type: String, default: 'medium', validator: (e) => ['small', 'medium', 'large'].includes(e) },
      ariaCloseLabel: ye('$t:close'),
    },
    emits: [...lt, 'focus'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { getColor: l } = Ce(),
        r = i(() => l(o.color)),
        u = i(() => (o.outline ? r.value : '')),
        d = i(() => !!(o.outline || o.flat)),
        { textColorComputed: c } = tt(r, d),
        { hasKeyboardFocus: v, keyboardFocusListeners: p } = Ea(),
        f = i(() => {
          if (!(!o.shadow || o.flat || o.outline || o.disabled || v.value)) return `0 0.125rem 0.19rem 0 ${ps(r.value)}`
        }),
        { valueComputed: g } = Ke(o, n),
        { tagComputed: y, hrefComputed: m } = Jt(o),
        { isHovered: b, onMouseEnter: h, onMouseLeave: $ } = ao(),
        S = () => {
          o.disabled || (g.value = !1)
        },
        w = i(() => o.size),
        I = i(() => (o.disabled ? -1 : 0)),
        A = Fe('va-chip', () => ({
          ...Ge(o, ['disabled', 'readonly', 'square']),
          small: o.size === 'small',
          large: o.size === 'large',
        })),
        k = i(() => {
          const O = { color: c.value, borderColor: u.value, background: '', boxShadow: f.value }
          return (
            o.outline || o.flat
              ? v.value
                ? (O.background = ms(r.value))
                : !o.readonly && b.value && (O.background = fs(r.value))
              : (O.background = r.value),
            O
          )
        }),
        { tp: T } = He()
      return (
        t({ close: S }),
        (O, M) =>
          s(g)
            ? (C(),
              U(
                pt(s(y)),
                {
                  key: 0,
                  class: pe(['va-chip', s(A)]),
                  href: s(m),
                  target: O.target,
                  to: O.to,
                  replace: O.replace,
                  exact: O.exact,
                  'active-class': O.activeClass,
                  'exact-active-class': O.exactActiveClass,
                  style: Y(k.value),
                },
                {
                  default: z(() => [
                    R(
                      'span',
                      H(
                        {
                          class: 'va-chip__inner',
                          onFocus: M[0] || (M[0] = (ae) => O.$emit('focus')),
                          onMouseenter: M[1] || (M[1] = (...ae) => s(h) && s(h)(...ae)),
                          onMouseleave: M[2] || (M[2] = (...ae) => s($) && s($)(...ae)),
                        },
                        wt(s(p), !0),
                      ),
                      [
                        e.icon
                          ? (C(),
                            U(s(Oe), { key: 0, class: 'va-chip__icon', name: e.icon, size: w.value }, null, 8, [
                              'name',
                              'size',
                            ]))
                          : E('', !0),
                        R('span', bf, [V(O.$slots, 'default')]),
                        e.closeable
                          ? (C(),
                            U(
                              s(Oe),
                              {
                                key: 1,
                                role: 'button',
                                name: 'va-close',
                                class: 'va-chip__close-icon',
                                'aria-label': s(T)(O.$props.ariaCloseLabel),
                                tabindex: I.value,
                                size: w.value,
                                onClick: ne(S, ['stop']),
                                onKeydown: [se(ne(S, ['stop']), ['enter']), se(ne(S, ['stop']), ['space'])],
                              },
                              null,
                              8,
                              ['aria-label', 'tabindex', 'size', 'onKeydown'],
                            ))
                          : E('', !0),
                      ],
                      16,
                    ),
                  ]),
                  _: 3,
                },
                8,
                ['href', 'target', 'to', 'replace', 'exact', 'active-class', 'exact-active-class', 'class', 'style'],
              ))
            : E('', !0)
      )
    },
  }),
  Cf = Q(hf),
  Sf = { class: 'va-collapse__header__text' },
  $f = ['id', 'aria-labelledby'],
  kf = { class: 'va-collapse__content' },
  wf = G({
    name: 'VaCollapse',
    __name: 'VaCollapse',
    props: {
      ...me,
      ...Qe,
      modelValue: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      header: { type: String, default: '' },
      icon: { type: String, default: '' },
      color: { type: String, default: void 0 },
      bodyColor: { type: String, default: void 0 },
      textColor: { type: String, default: '' },
      bodyTextColor: { type: String, default: '' },
      iconColor: { type: String, default: 'secondary' },
      colorAll: { type: Boolean, default: !1 },
      stateful: { type: Boolean, default: !0 },
    },
    emits: ['update:modelValue', ...Ro],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        { valueComputed: r } = Ke(o, n, 'modelValue'),
        { getColor: u, getTextColor: d, setHSLAColor: c } = Ce(),
        { accordionProps: v, accordionItemValue: p } = fv(),
        f = i({
          get() {
            return r.userProvided || ft(p) ? r.value : p.value
          },
          set(L) {
            ;(ft(p) || (p.value = L), (r.value = L))
          },
        })
      r.userProvided && !ft(p) && (p.value = r.value)
      const g = D()
      ca([l], ([L]) => {
        g.value = L.contentRect.height ?? 0
      })
      const y = i(() => (f.value ? g.value : 0)),
        m = () => {
          const L = (y.value / 1e3) * 0.2
          return `${L > 0.2 ? L : 0.2}s`
        },
        b = i(() => (o.bodyColor ? u(o.bodyColor) : o.color && o.colorAll ? c(u(o.color), { a: 0.07 }) : void 0)),
        h = i(() => (o.color ? u(o.color) : void 0)),
        $ = Dt(),
        S = i(() => `header-${$}`),
        w = i(() => `panel-${$}`),
        I = i(() => (o.disabled ? -1 : 0)),
        A = i(() => ({
          id: S.value,
          tabindex: I.value,
          'aria-controls': w.value,
          'aria-expanded': f.value,
          'aria-disabled': o.disabled,
          role: 'button',
        })),
        k = D(!1)
      re(y, (L, x) => {
        x !== void 0 && k.value !== !0 && (k.value = !0)
      })
      const T = (L) => {
          L.propertyName === 'height' && L.target === L.currentTarget && (k.value = !1)
        },
        O = Fe('va-collapse', () => ({
          ...Ge(o, ['disabled']),
          expanded: f.value,
          active: f.value,
          popout: !!(v.value.popout && f.value),
          inset: !!(v.value.inset && f.value),
          'height-changing': k.value,
          'colored-body': !!b.value,
          'colored-header': !!h.value,
        })),
        M = () => {
          o.disabled || (f.value = !f.value)
        },
        { textColorComputed: ae } = tt(h),
        oe = i(() => ({ color: ae.value, backgroundColor: h.value })),
        B = i(() => !!(f.value || k.value)),
        K = i(() => ({
          height: `${y.value}px`,
          transitionDuration: m(),
          background: f.value ? b.value : '',
          color: o.bodyTextColor ? u(o.bodyTextColor) : b.value ? u(d(b.value)) : 'currentColor',
        }))
      return (
        t({ toggle: M }),
        (L, x) => (
          C(),
          _(
            'div',
            { class: pe(['va-collapse', s(O)]) },
            [
              R(
                'div',
                { class: 'va-collapse__header-wrapper', onClick: M, onKeydown: [se(M, ['enter']), se(M, ['space'])] },
                [
                  V(
                    L.$slots,
                    'header',
                    J(
                      ie({
                        value: f.value,
                        bind: A.value,
                        attributes: A.value,
                        attrs: A.value,
                        iconAttrs: {
                          class: [
                            'va-collapse__expand-icon',
                            f.value ? 'a-collapse__expand-icon--expanded' : 'a-collapse__expand-icon--collapsed',
                          ],
                        },
                        text: e.header,
                      }),
                    ),
                    () => [
                      R(
                        'div',
                        H(A.value, { class: 'va-collapse__header', style: oe.value }),
                        [
                          e.icon
                            ? (C(),
                              U(s(Oe), { key: 0, class: 'va-collapse__header__icon', name: e.icon }, null, 8, ['name']))
                            : E('', !0),
                          V(L.$slots, 'header-content', J(ie({ header: e.header })), () => [
                            R('div', Sf, fe(e.header), 1),
                          ]),
                          V(L.$slots, 'expand-icon', {}, () => [
                            ue(
                              s(Oe),
                              {
                                class: pe([
                                  'va-collapse__expand-icon',
                                  f.value
                                    ? 'va-collapse__expand-icon--expanded'
                                    : 'va-collapse__expand-icon--collapsed',
                                ]),
                                name: 'va-arrow-down',
                              },
                              null,
                              8,
                              ['class'],
                            ),
                          ]),
                        ],
                        16,
                      ),
                    ],
                  ),
                ],
                32,
              ),
              R(
                'div',
                {
                  class: pe([
                    'va-collapse__body-wrapper',
                    { 'va-collapse__body-wrapper--bordered': !L.$slots.body && !L.$slots.header },
                  ]),
                  style: Y(K.value),
                  onTransitionend: T,
                },
                [
                  B.value
                    ? (C(),
                      _(
                        'div',
                        {
                          key: 0,
                          class: 'va-collapse__body',
                          ref_key: 'body',
                          ref: l,
                          role: 'region',
                          id: w.value,
                          'aria-labelledby': S.value,
                        },
                        [
                          V(L.$slots, 'body', {}, () => [
                            R('div', kf, [V(L.$slots, 'default', {}, () => [V(L.$slots, 'content')])]),
                          ]),
                        ],
                        8,
                        $f,
                      ))
                    : E('', !0),
                ],
                38,
              ),
            ],
            2,
          )
        )
      )
    },
  }),
  _f = Q(wf),
  Vf = G({
    name: 'VaColorIndicator',
    __name: 'VaColorIndicator',
    props: {
      ...Qe,
      ...me,
      modelValue: { type: Boolean, default: null },
      color: { type: String, default: '' },
      square: { type: Boolean, default: !1 },
      size: { type: String, default: '1rem' },
    },
    emits: [...lt],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { valueComputed: n } = Ke(a, o),
        { getColor: l } = Ce(),
        { hasKeyboardFocus: r, keyboardFocusListeners: u } = Ea(),
        d = i(() => l(a.color)),
        c = i(() => (a.square ? '0px' : '50%')),
        v = i(() => ({ backgroundColor: d.value, height: a.size, width: a.size })),
        p = i(() => ({ 'va-color-indicator--selected': n.value, 'va-color-indicator--on-keyboard-focus': r.value })),
        f = () => {
          n.value = !n.value
        }
      return (g, y) => (
        C(),
        _(
          'div',
          H(
            {
              class: ['va-color-indicator', p.value],
              style: [v.value, `--va-border-radius-computed: ${String(c.value)}`],
              onClick: f,
              onKeydown: [se(f, ['enter']), se(f, ['space'])],
            },
            wt(s(u), !0),
          ),
          [R('div', { class: 'va-color-indicator__core', style: Y(v.value) }, null, 4)],
          16,
        )
      )
    },
  }),
  Yn = Q(Vf),
  Bf = { key: 0, class: 'va-input-label__required-mark' },
  di = G({
    name: 'VaInputLabel',
    __name: 'VaInputLabel',
    props: {
      label: { type: String, default: '' },
      requiredMark: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
    },
    setup(e) {
      const { getColor: t } = Ce()
      return (a, o) => (
        C(),
        _(
          'label',
          { 'aria-hidden': 'true', class: 'va-input-label', style: Y({ color: s(t)(a.$props.color, void 0, !0) }) },
          [
            V(
              a.$slots,
              'default',
              J(ie({ label: e.label, requiredMark: e.requiredMark, color: s(t)(a.$props.color) })),
              () => [Te(fe(e.label) + ' ', 1), e.requiredMark ? (C(), _('span', Bf, ' * ')) : E('', !0)],
            ),
          ],
          4,
        )
      )
    },
  }),
  Tf = {
    label: { type: String, default: '' },
    inputAriaLabel: ye('$t:inputField'),
    inputAriaLabelledby: { type: String },
    inputAriaDescribedby: { type: String },
  },
  If = (e) => {
    const t = Dt(),
      a = `input-label-${t}`,
      o = `input-character-count-${t}`,
      n = i(() => ({
        'aria-label': e.label !== '' ? e.label : e.inputAriaLabel,
        'aria-labelledby': e.inputAriaLabelledby ? e.inputAriaLabelledby : a,
        'aria-describedby': e.inputAriaDescribedby ? e.inputAriaDescribedby : o,
      }))
    return { labelId: a, characterCountId: o, ariaAttributes: n }
  },
  Pf = (e) =>
    G({
      name: 'ProxySlots',
      props: { inheritSlots: { type: Array, required: !0 } },
      render() {
        var t
        const a = ((t = this.$parent) == null ? void 0 : t.$slots) || {},
          n = (this.$props.inheritSlots || Object.keys(a)).reduce((l, r) => (a[r] && (l[r] = a[r]), l), {})
        return Re(e, this.$attrs, { ...n, ...this.$slots })
      },
    }),
  Zt = { disabled: { type: Boolean, default: !1 }, readonly: { type: Boolean, default: !1 } },
  vi = (e, t) => ({
    computedClasses: Fe(
      e,
      i(() => Ge(t, ['disabled', 'readonly'])),
    ),
  }),
  Xn = (e) => {
    const t = Os(),
      a = Hn(e ? La(e) : void 0)
    let o = null
    const n = i({
      get() {
        var l
        if (!t.value) return !1
        if (t.value === a.value) return !0
        const r = (l = a.value) == null ? void 0 : l.contains(t.value)
        return (r && (o = t.value), r)
      },
      set(l) {
        var r
        let u = o ?? a.value
        ;(((r = a.value) != null && r.contains(u)) || (u = a.value), l ? u == null || u.focus() : u == null || u.blur())
      },
    })
    return Object.assign(n, {
      focusIfNothingIfFocused: () => {
        t.value === document.body && (n.value = !0)
      },
      focusPreviousElement: () => {
        o ? o.focus() : document.body.focus()
      },
    })
  },
  ql = Ee(di),
  Af = G({
    name: 'VaInputWrapper',
    components: { VaMessageList: Pf(Oo), VaIcon: Oe, VaInputLabel: di },
    props: {
      ...me,
      ...Tf,
      ...Zt,
      ...zt,
      ...ql,
      modelValue: { type: null, default: '' },
      counter: { type: Boolean },
      maxLength: { type: [Number, String], default: void 0 },
      label: { type: String, default: '' },
      placeholder: { type: String, default: '' },
      color: { type: String, default: 'primary' },
      background: { type: String },
      success: { type: Boolean, default: !1 },
      loading: { type: Boolean, default: !1 },
      requiredMark: { type: Boolean, default: !1 },
      innerLabel: { type: Boolean, default: !1 },
    },
    emits: [
      'click',
      'click-prepend',
      'click-append',
      'click-prepend-inner',
      'click-append-inner',
      'click-field',
      'update:modelValue',
    ],
    setup(e, { emit: t, slots: a }) {
      const { getColor: o } = Ce(),
        [n] = ua('modelValue', e, t, ''),
        l = D(),
        r = Xn(),
        u = i(() => (e.counter && typeof n.value == 'string' ? n.value.length : void 0)),
        d = Fe('va-input-wrapper', () => ({
          ...Ge(e, ['success', 'error', 'disabled', 'readonly']),
          focused: !!r.value,
          labeled: !!(e.label || a.label),
          labeledInner: !!(e.label || a.label) && e.innerLabel,
        })),
        c = i(() => o(e.color)),
        v = i(() => (e.background ? o(e.background) : '#ffffff00')),
        p = i(() => (e.error ? e.errorMessages : e.messages)),
        { textColorComputed: f } = tt(v),
        g = Pe('maxLength'),
        y = i(() => (e.error ? 'danger' : e.success ? 'success' : '')),
        m = i(() => (e.error ? Number(e.errorCount) : 99)),
        b = i(() => u.value !== void 0),
        h = i(() => (g.value !== void 0 ? `${u.value}/${g.value}` : u.value)),
        { labelId: $, characterCountId: S, ariaAttributes: w } = If(e),
        I = ze(ql)
      return {
        inputRef: l,
        focus: () => {
          r.value = !0
        },
        blur: () => {
          r.value = !1
        },
        labelId: $,
        characterCountId: S,
        ariaAttributes: w,
        vModel: n,
        counterValue: u,
        vaInputLabelProps: I,
        wrapperClass: d,
        textColorComputed: f,
        isCounterVisible: b,
        counterComputed: h,
        colorComputed: c,
        backgroundComputed: v,
        messagesColor: y,
        messagesComputed: p,
        errorLimit: m,
      }
    },
  }),
  Lf = { class: 'va-input-wrapper__fieldset va-input-wrapper__size-keeper' },
  Of = { class: 'va-input-wrapper__container' },
  xf = { class: 'va-input-wrapper__text' },
  Ef = ['placeholder', 'readonly', 'disabled'],
  Df = ['id'],
  Ff = { class: 'va-input-wrapper__counter' }
function Mf(e, t, a, o, n, l) {
  const r = yo('VaInputLabel'),
    u = yo('va-icon'),
    d = yo('va-message-list')
  return (
    C(),
    _(
      'div',
      {
        class: pe(['va-input-wrapper', e.wrapperClass]),
        onClick: t[6] || (t[6] = (c) => e.$emit('click', c)),
        style: Y(
          `--va-background-computed: ${String(e.backgroundComputed)};--va-color-computed: ${String(e.colorComputed)};--va-text-color-computed: ${String(e.textColorComputed)}`,
        ),
      },
      [
        R('fieldset', Lf, [
          ue(
            d,
            {
              color: e.messagesColor,
              'model-value': e.messagesComputed,
              limit: e.errorLimit,
              'inherit-slots': ['message', 'messages'],
            },
            {
              default: z(({ ariaAttributes: c }) => [
                (e.$props.label || e.$slots.label) && !e.$props.innerLabel
                  ? (C(),
                    U(
                      r,
                      H(
                        { key: 0, class: 'va-input-wrapper__label va-input-wrapper__label--outer' },
                        e.vaInputLabelProps,
                        { id: e.labelId },
                      ),
                      { default: z((v) => [V(e.$slots, 'label', J(ie(v)))]), _: 3 },
                      16,
                      ['id'],
                    ))
                  : E('', !0),
                R('div', Of, [
                  e.$slots.prepend
                    ? (C(),
                      _(
                        'div',
                        {
                          key: 0,
                          class: 'va-input-wrapper__prepend-inner',
                          onClick: t[0] || (t[0] = (v) => e.$emit('click-prepend')),
                        },
                        [V(e.$slots, 'prepend')],
                      ))
                    : E('', !0),
                  R(
                    'div',
                    { onClick: t[4] || (t[4] = (v) => e.$emit('click-field', v)), class: 'va-input-wrapper__field' },
                    [
                      e.$slots.prependInner
                        ? (C(),
                          _(
                            'div',
                            {
                              key: 0,
                              class: 'va-input-wrapper__prepend-inner',
                              ref: 'container',
                              onClick: t[1] || (t[1] = (v) => e.$emit('click-prepend-inner', v)),
                            },
                            [V(e.$slots, 'prependInner')],
                            512,
                          ))
                        : E('', !0),
                      R('div', xf, [
                        (e.$props.label || e.$slots.label) && e.$props.innerLabel
                          ? (C(),
                            U(
                              r,
                              H(
                                { key: 0, class: 'va-input-wrapper__label va-input-wrapper__label--inner' },
                                e.vaInputLabelProps,
                                { id: e.labelId },
                              ),
                              { default: z((v) => [V(e.$slots, 'label', J(ie(v)))]), _: 3 },
                              16,
                              ['id'],
                            ))
                          : E('', !0),
                        V(
                          e.$slots,
                          'default',
                          J(ie({ ariaAttributes: { ...c, ...e.ariaAttributes }, value: e.vModel })),
                          () => [
                            Bt(
                              R(
                                'input',
                                H(
                                  { ...c, ...e.ariaAttributes },
                                  {
                                    'onUpdate:modelValue': t[2] || (t[2] = (v) => (e.vModel = v)),
                                    ref: 'inputRef',
                                    placeholder: e.$props.placeholder,
                                    readonly: e.$props.readonly,
                                    disabled: e.$props.disabled,
                                  },
                                ),
                                null,
                                16,
                                Ef,
                              ),
                              [[Ao, e.vModel]],
                            ),
                          ],
                        ),
                      ]),
                      e.success
                        ? (C(),
                          U(u, {
                            key: 1,
                            color: 'success',
                            name: 'va-check-circle',
                            class: 'va-input-wrapper__icon va-input-wrapper__icon--success',
                          }))
                        : E('', !0),
                      e.error
                        ? (C(),
                          U(u, {
                            key: 2,
                            color: 'danger',
                            name: 'va-warning',
                            class: 'va-input-wrapper__icon va-input-wrapper__icon--error',
                          }))
                        : E('', !0),
                      e.$props.loading
                        ? (C(),
                          U(
                            u,
                            {
                              key: 3,
                              color: e.$props.color,
                              name: 'va-loading',
                              spin: 'counter-clockwise',
                              class: 'va-input-wrapper__icon va-input-wrapper__icon--loading',
                            },
                            null,
                            8,
                            ['color'],
                          ))
                        : E('', !0),
                      V(e.$slots, 'icon'),
                      e.$slots.appendInner
                        ? (C(),
                          _(
                            'div',
                            {
                              key: 4,
                              class: 'va-input-wrapper__append-inner',
                              onClick: t[3] || (t[3] = (v) => e.$emit('click-append-inner', v)),
                            },
                            [V(e.$slots, 'appendInner')],
                          ))
                        : E('', !0),
                    ],
                  ),
                  e.$slots.append
                    ? (C(),
                      _(
                        'div',
                        {
                          key: 1,
                          class: 'va-input-wrapper__append-inner',
                          onClick: t[5] || (t[5] = (v) => e.$emit('click-append')),
                        },
                        [V(e.$slots, 'append')],
                      ))
                    : E('', !0),
                ]),
                e.isCounterVisible
                  ? (C(),
                    _(
                      'div',
                      { key: 1, class: 'va-input-wrapper__counter-wrapper', id: e.characterCountId },
                      [
                        V(
                          e.$slots,
                          'counter',
                          J(ie({ valueLength: e.counterValue, maxLength: e.$props.maxLength })),
                          () => [R('div', Ff, fe(e.counterComputed), 1)],
                        ),
                      ],
                      8,
                      Df,
                    ))
                  : E('', !0),
              ]),
              _: 3,
            },
            8,
            ['color', 'model-value', 'limit'],
          ),
        ]),
      ],
      6,
    )
  )
}
const Nf = Ca(Af, [['render', Mf]]),
  gt = Q(Nf),
  Rf =
    (...e) =>
    (...t) =>
      e.forEach((a) => a(...t)),
  zf = { autofocus: { type: Boolean, default: !1 } },
  Hf = (e, t) => {
    const a = () => {
        Pt(Xe(e.value))
      },
      o = () => {
        Do(Xe(e.value))
      }
    return (
      Me(() => {
        t.autofocus && a()
      }),
      { focus: a, blur: o }
    )
  },
  no = {
    clearable: { type: Boolean, default: !1 },
    clearableIcon: { type: String, default: 'va-clear' },
    clearValue: { type: String, default: '' },
  },
  zo = ['clear'],
  Ho = (e, t, a, o) => {
    const { isFocused: n, onFocus: l, onBlur: r } = jt(a),
      u = [null, void 0, e.clearValue],
      d = i(() => e.clearable && !e.disabled && !e.readonly && !u.includes(t.value)),
      c = i(() =>
        n != null && n.value
          ? e.color || 'primary'
          : o != null && o.value
            ? 'danger'
            : e.success
              ? 'success'
              : 'secondary',
      ),
      v = i(() => ({ name: e.clearableIcon, color: c.value, size: 'medium', tabindex: d.value ? 0 : -1 }))
    return { canBeCleared: d, clearIconColor: c, clearIconProps: v, onFocus: l, onBlur: r }
  },
  jf = (e) => {
    if (!Pa) return
    const t = qe()
    if (!t) throw new Error('`useDeprecated` hook must be used only inside of setup function!')
    e.forEach((a) => {
      const o = a()
      typeof o == 'string' && De(`(${t.type.name} component) ${o}`)
    })
  },
  Yl = Ee(gt),
  { createEmits: Uf, createListeners: Wf } = ha(['change', 'keyup', 'keypress', 'keydown', 'focus', 'blur', 'input']),
  { createEmits: Kf, createListeners: Gf } = ha([
    'click',
    'click-prepend',
    'click-append',
    'click-prepend-inner',
    'click-append-inner',
  ]),
  qf = G({
    name: 'VaInput',
    __name: 'VaInput',
    props: {
      ...Yl,
      ...Zt,
      ...zf,
      ...zt,
      ...no,
      ...me,
      ...Qe,
      placeholder: { type: String, default: '' },
      tabindex: { type: [String, Number], default: 0 },
      modelValue: { type: [Number, String, null], default: '' },
      type: { type: String, default: 'text' },
      inputClass: { type: String, default: '' },
      pattern: { type: String },
      inputmode: { type: String, default: 'text' },
      counter: { type: Boolean, default: !1 },
      autocomplete: { type: String },
      ariaResetLabel: ye('$t:reset'),
      strictBindInputValue: { type: Boolean, default: !1 },
    },
    emits: ['update:modelValue', ...Xt, ...zo, ...Uf(), ...Kf(), ...lt],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a
      jf([() => o.type !== 'textarea' || 'Use VaTextarea component instead of VaInput with type="textarea"'])
      const l = we(),
        { valueComputed: r } = Ke(o, n, 'modelValue'),
        u = () =>
          I(() => {
            ;((r.value = o.clearValue), n('clear'), A())
          }),
        { focus: d, blur: c } = Hf(l, o),
        v = dt(),
        p = i(() => {
          const ce = ['icon']
          return Object.keys(v).filter((ke) => !ce.includes(ke))
        }),
        { tp: f } = He(),
        {
          isValid: g,
          isTouched: y,
          isDirty: m,
          computedError: b,
          computedErrorMessages: h,
          listeners: { onBlur: $ },
          validationAriaAttributes: S,
          isLoading: w,
          withoutValidation: I,
          resetValidation: A,
        } = Ht(o, n, { reset: u, focus: d, value: r }),
        { modelValue: k } = Tt(o),
        { canBeCleared: T, clearIconProps: O } = Ho(o, k, l, b),
        M = Wf(n),
        ae = { ...M, onBlur: Rf($, M.onBlur) },
        oe = (ce) => {
          if (!o.strictBindInputValue) return
          const ke = l.value
          if (!ke) return
          const de = ke.selectionStart || 0,
            F = ke.selectionEnd || 0
          ;(ke.value !== ce && (ke.value = String(ce)), ke.setSelectionRange(de, F))
        }
      ;(re(
        r,
        (ce) => {
          oe(String(ce))
        },
        { immediate: !0 },
      ),
        We(
          'input',
          () => {
            oe(String(r.value))
          },
          l,
        ))
      const B = i(() => (o.disabled ? -1 : o.tabindex)),
        K = Yt(),
        L = i(() => ({
          'aria-label': o.inputAriaLabel || o.label,
          'aria-labelledby': o.inputAriaLabelledby,
          'aria-required': o.requiredMark,
          tabindex: B.value,
          class: o.inputClass,
          'aria-disabled': o.disabled,
          'aria-readonly': o.readonly,
          ...S.value,
        })),
        x = i(() => ({
          ...L.value,
          ...Ge(o, ['type', 'disabled', 'readonly', 'placeholder', 'pattern', 'inputmode', 'name', 'autocomplete']),
          ...Ge(K, ['minlength', 'minlength']),
        })),
        N = i(() => (o.counter && typeof r.value == 'string' ? r.value.length : void 0)),
        P = (ce) => {
          !ce.target ||
            !('tagName' in ce.target) ||
            ce.target.tagName === 'INPUT' ||
            ce.target.tagName === 'TEXTAREA' ||
            d()
        },
        te = ze(Yl),
        X = Gf(n)
      return (
        t({
          isValid: g,
          isDirty: m,
          isTouched: y,
          isLoading: w,
          computedError: b,
          computedErrorMessages: h,
          reset: u,
          focus: d,
          blur: c,
          value: r,
          withoutValidation: I,
          resetValidation: A,
        }),
        (ce, ke) => (
          C(),
          U(
            s(gt),
            H(
              { ...s(X), ...s(te) },
              {
                class: ['va-input', ce.$attrs.class],
                style: ce.$attrs.style,
                loading: ce.$props.loading || s(w),
                error: s(b),
                'error-messages': s(h),
                'error-count': ce.errorCount,
                'counter-value': N.value,
                onClick: P,
              },
            ),
            st(
              {
                icon: z((de) => [
                  s(T)
                    ? (C(),
                      U(
                        s(Oe),
                        H({ key: 0, role: 'button', 'aria-label': s(f)(ce.$props.ariaResetLabel) }, s(O), {
                          onClick: ne(u, ['stop']),
                          onKeydown: [se(ne(u, ['stop']), ['enter']), se(ne(u, ['stop']), ['space'])],
                        }),
                        null,
                        16,
                        ['aria-label', 'onKeydown'],
                      ))
                    : E('', !0),
                  V(ce.$slots, 'icon', J(ie(de))),
                ]),
                default: z(() => [
                  ce.$slots.content
                    ? E('', !0)
                    : Bt(
                        (C(),
                        _(
                          'input',
                          H(
                            { key: 0, ref_key: 'input', ref: l, class: 'va-input__content__input' },
                            { ...x.value, ...ae },
                            { 'onUpdate:modelValue': ke[0] || (ke[0] = (de) => (mt(r) ? (r.value = de) : null)) },
                          ),
                          null,
                          16,
                        )),
                        [[Ao, s(r)]],
                      ),
                ]),
                _: 2,
              },
              [Ie(p.value, (de) => ({ name: de, fn: z((F) => [V(ce.$slots, de, J(ie(F)))]) }))],
            ),
            1040,
            ['class', 'style', 'loading', 'error', 'error-messages', 'error-count', 'counter-value'],
          )
        )
      )
    },
  }),
  Jn = Q(qf),
  Yf = { class: 'va-color-input' },
  Xl = Ee(Jn),
  Xf = G({
    name: 'VaColorInput',
    __name: 'VaColorInput',
    props: {
      ...Xl,
      ...Qe,
      ...me,
      modelValue: { type: String, default: null },
      disabled: { type: Boolean, default: !1 },
      indicator: { type: String, default: 'dot', validator: (e) => ['dot', 'square'].includes(e) },
      ariaOpenColorPickerLabel: ye('$t:openColorPicker'),
    },
    emits: [...lt],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        { valueComputed: l } = Ke(a, o),
        r = () => {
          var p
          return !a.disabled && ((p = n.value) == null ? void 0 : p.click())
        },
        u = i(() => (a.disabled ? -1 : 0)),
        d = i({ get: () => a.modelValue, set: Ws((p) => o('update:modelValue', p), 500) }),
        c = ze(Xl),
        { tp: v } = He()
      return (p, f) => (
        C(),
        _('div', Yf, [
          ue(
            s(Jn),
            H(s(c), {
              modelValue: s(l),
              'onUpdate:modelValue': f[0] || (f[0] = (g) => (mt(l) ? (l.value = g) : null)),
              class: 'va-color-input__input',
              tabindex: u.value,
            }),
            {
              appendInner: z(() => [
                ue(
                  s(Yn),
                  {
                    class: 'va-color-input__dot',
                    role: 'button',
                    'aria-label': s(v)(p.$props.ariaOpenColorPickerLabel),
                    'aria-disabled': p.$props.disabled,
                    tabindex: u.value,
                    color: s(l),
                    indicator: p.$props.indicator,
                    size: '16px',
                    onClick: r,
                    onKeydown: [se(r, ['space']), se(r, ['enter'])],
                  },
                  null,
                  8,
                  ['aria-label', 'aria-disabled', 'tabindex', 'color', 'indicator'],
                ),
              ]),
              _: 1,
            },
            16,
            ['modelValue', 'tabindex'],
          ),
          Bt(
            R(
              'input',
              {
                ref_key: 'colorPicker',
                ref: n,
                type: 'color',
                class: 'va-color-input__hidden-input',
                'aria-hidden': 'true',
                tabindex: '-1',
                'onUpdate:modelValue': f[1] || (f[1] = (g) => (d.value = g)),
              },
              null,
              512,
            ),
            [[zr, d.value]],
          ),
        ])
      )
    },
  }),
  Jf = Q(Xf),
  Zf = ['aria-label'],
  Qf = G({
    name: 'VaColorPalette',
    __name: 'VaColorPalette',
    props: {
      ...Qe,
      ...me,
      modelValue: { type: String, default: null },
      palette: { type: Array, default: () => [] },
      indicator: { type: String, default: 'dot', validator: (e) => ['dot', 'square'].includes(e) },
      ariaLabel: ye('$t:colorSelection'),
      ariaIndicatorLabel: ye('$t:color'),
    },
    emits: [...lt],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { valueComputed: n } = Ke(a, o),
        l = (u) => n.value === u,
        { tp: r } = He()
      return (u, d) => (
        C(),
        _(
          'ul',
          { class: 'va-color-palette', role: 'listbox', 'aria-label': s(r)(u.$props.ariaLabel) },
          [
            (C(!0),
            _(
              be,
              null,
              Ie(
                e.palette,
                (c, v) => (
                  C(),
                  U(
                    s(Yn),
                    {
                      key: v,
                      role: 'option',
                      'aria-label': s(r)(u.$props.ariaIndicatorLabel, { color: c }),
                      'aria-selected': l(c),
                      tabindex: '0',
                      modelValue: l(c),
                      color: c,
                      square: e.indicator === 'square',
                      'onUpdate:modelValue': (p) => (n.value = c),
                    },
                    null,
                    8,
                    ['aria-label', 'aria-selected', 'modelValue', 'color', 'square', 'onUpdate:modelValue'],
                  )
                ),
              ),
              128,
            )),
          ],
          8,
          Zf,
        )
      )
    },
  }),
  em = Q(Qf),
  tm = { name: 'VaContent' },
  am = { class: 'va-typography-block' }
function om(e, t, a, o, n, l) {
  return (C(), _('div', am, [V(e.$slots, 'default')]))
}
const nm = Ca(tm, [['render', om]]),
  lm = Q(nm),
  _n = (e) => (typeof e == 'number' ? `${e}px` : e)
function rm(e) {
  re(
    [() => e.step, () => e.min, () => e.max],
    () => {
      const a = Number(e.modelValue),
        o = Number(e.max),
        n = Number(e.min),
        l = Number(e.step)
      if (Number.isNaN(a)) {
        De('The value is not a number or cannot be reduced to a number.')
        return
      }
      ;(n && o && n > o && De(`The maximum value (${o}) can not be less than the minimum value (${n}).`),
        n && a < n && De(`The value of the counter (${a}) can not be less than the minimum value (${n}).`),
        o && a > o && De(`The value of the counter (${a}) can not be greater than the maximum value (${o}).`),
        n &&
          o &&
          l > o - n &&
          De(
            `The value of the step (${l}) can not be greater than the difference (${o - n}) between maximum value (${o}) and minimum value (${n}).`,
          ))
    },
    { immediate: !0 },
  )
}
const pi = (e) => Number(e.toPrecision(13)),
  sm = (e, t) => {
    const a = pi(e % t)
    return a === 0 || a === t
  }
function Jl(e, t) {
  let a = -1,
    o = -1
  const n = () => {
      var u
      ;((u = t.onStart) == null || u.call(t),
        clearTimeout(a),
        (a = setTimeout(
          () => {
            o = setInterval(() => {
              var d
              return (d = t.onUpdate) == null ? void 0 : d.call(t)
            }, t.interval || 100)
          },
          s(t.delay) || 500,
        )))
    },
    l = () => {
      var u
      ;(clearTimeout(a), clearInterval(o), (u = t.onEnd) == null || u.call(t))
    },
    r = La(e)
  ;(We(['mousedown', 'touchstart', 'dragstart'], n, r),
    We(['mouseup', 'mouseleave', 'touchend', 'touchcancel', 'drop', 'dragend', 'blur'], l, !0))
}
const im = ['value', 'aria-live'],
  { createEmits: um, createListeners: cm } = ha(['change']),
  { createEmits: dm, createListeners: vm } = ha([
    { listen: 'click-prepend', emit: 'click:decrease-button' },
    { listen: 'click-append', emit: 'click:increase-button' },
    { listen: 'click-prepend-inner', emit: 'click:decrease-icon' },
    { listen: 'click-append-inner', emit: 'click:increase-icon' },
  ]),
  Zl = Ee(gt),
  pm = G({
    name: 'VaCounter',
    inheritAttrs: !1,
    __name: 'VaCounter',
    props: {
      ...Zt,
      ...Qe,
      ...me,
      ...no,
      ...Zl,
      modelValue: { type: [String, Number], default: 0 },
      manualInput: { type: Boolean, default: !1 },
      min: { type: [Number, String] },
      max: { type: [Number, String] },
      step: { type: [Number, String], default: 1 },
      color: { type: String, default: 'primary' },
      increaseIcon: { type: String, default: 'va-plus' },
      decreaseIcon: { type: String, default: 'va-minus' },
      buttons: { type: Boolean, default: !1 },
      flat: { type: Boolean, default: !0 },
      rounded: { type: Boolean, default: !1 },
      margins: { type: [String, Number], default: '4px' },
      longPressDelay: { type: [Number, String], default: 500 },
      ariaLabel: ye('$t:counterValue'),
      ariaDecreaseLabel: ye('$t:decreaseCounter'),
      ariaIncreaseLabel: ye('$t:increaseCounter'),
    },
    emits: ['update:modelValue', ...Xt, ...um(), ...dm(), ...Fo],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        { min: r = D(void 0), max: u = D(void 0), step: d } = Tt(o),
        c = Pe('longPressDelay'),
        { isFocused: v, focus: p, blur: f } = jt(l, n),
        { valueComputed: g } = Ke(o, n)
      function y($e) {
        return parseFloat(Number($e).toFixed(10))
      }
      const m = i({
          get() {
            return g.value
          },
          set($e) {
            g.value = y($e)
          },
        }),
        b = () =>
          S(() => {
            ;(n('update:modelValue', o.clearValue), n('clear'), w())
          }),
        {
          computedError: h,
          computedErrorMessages: $,
          withoutValidation: S,
          resetValidation: w,
          listeners: I,
          isDirty: A,
          isTouched: k,
        } = Ht(o, n, { reset: b, focus: p, value: m }),
        T = ({ target: $e }) => {
          m.value = Number($e == null ? void 0 : $e.value)
        },
        O = ({ target: $e }) => {
          ae(Number($e == null ? void 0 : $e.value))
        },
        M = ($e) =>
          typeof r.value > 'u' || !Number(d.value)
            ? $e
            : pi(Number(r.value) + Number(d.value) * ((Number($e) - Number(r.value)) / Number(d.value))),
        ae = ($e) => {
          if (typeof r.value < 'u' && $e < Number(r.value)) {
            m.value = Number(r.value)
            return
          }
          if (typeof u.value < 'u' && $e > Number(u.value)) {
            m.value = M(Number(u.value))
            return
          }
          m.value = M($e)
        },
        oe = i(() => (ft(r.value) ? !1 : Number(m.value) <= Number(r.value))),
        B = i(() =>
          ft(u.value)
            ? !1
            : d.value
              ? Number(m.value) > Number(u.value) - Number(d.value)
              : Number(m.value) >= Number(u.value),
        ),
        K = i(() => (o.disabled ? -1 : 0)),
        L = i(() => oe.value || o.disabled || o.readonly),
        x = i(() => B.value || o.disabled || o.readonly),
        N = () => {
          L.value || ae(Number(m.value) - Number(d.value))
        },
        P = () => {
          x.value || ae(Number(m.value) + Number(d.value))
        }
      ;(Jl(_o('decreaseButtonRef'), { onUpdate: N, delay: c }), Jl(_o('increaseButtonRef'), { onUpdate: P, delay: c }))
      const { getColor: te } = Ce(),
        X = i(() => te(o.color)),
        ce = i(() => ({
          class: { 'va-counter__icon--inactive': L.value },
          color: X.value,
          icon: o.decreaseIcon,
          plain: !0,
          disabled: L.value,
          readonly: o.readonly,
          tabindex: -1,
          'aria-label': j(o.ariaDecreaseLabel),
          ...(!L.value && { onClick: N }),
        })),
        ke = i(() => ({
          class: { 'va-counter__icon--inactive': x.value },
          color: X.value,
          icon: o.increaseIcon,
          plain: !0,
          disabled: x.value,
          readonly: o.readonly,
          tabindex: -1,
          'aria-label': j(o.ariaIncreaseLabel),
          ...(!x.value && { onClick: P }),
        })),
        de = i(() => (typeof o.margins == 'string' ? parseFloat(o.margins) : o.margins) === 0),
        F = () => (v.value ? o.color : 'background-border'),
        le = i(() => ({
          ...Ge(o, ['color']),
          round: o.rounded,
          preset: o.flat ? 'secondary' : '',
          borderColor: o.flat ? F() : '',
        })),
        ve = i(() => ({
          ...le.value,
          icon: o.decreaseIcon,
          disabled: L.value,
          'aria-label': j(o.ariaDecreaseLabel),
          ...(!L.value && { onClick: N }),
        })),
        W = i(() => ({
          ...le.value,
          icon: o.increaseIcon,
          disabled: x.value,
          'aria-label': j(o.ariaIncreaseLabel),
          ...(!x.value && { onClick: P }),
        })),
        { tp: j } = He(),
        Se = Yt(),
        ge = dt(),
        Ae = i(() => ({
          tabindex: K.value,
          'aria-label': j(o.ariaLabel),
          'aria-valuemin': Number(r.value),
          'aria-valuemax': Number(u.value),
          ...At(Se, ['class', 'style']),
          ...Ge(o, ['disabled', 'min', 'max', 'step']),
          readonly: o.readonly || !o.manualInput,
        })),
        je = i(() =>
          [
            Se.class,
            { 'va-counter--input-square': de.value },
            { 'va-counter--content-slot': ge.content && o.buttons },
          ].filter(Boolean),
        ),
        ot = i(() => ({ ...(Se.style || {}) })),
        ct = i(() => _n(o.margins))
      rm(o)
      const it = vm(n),
        Le = cm(n),
        Ve = ze(Zl)
      return (
        t({ isDirty: A, isTouched: k, focus: p, blur: f, decreaseCount: N, increaseCount: P, reset: b }),
        ($e, _e) => (
          C(),
          U(
            s(gt),
            H(
              { class: 'va-counter' },
              { ...s(it), ...s(Ve), ...s(I) },
              {
                class: je.value,
                style: ot.value,
                focused: s(v),
                error: s(h),
                'error-messages': s($),
                onKeydown: [
                  se(ne(P, ['prevent']), ['up']),
                  se(ne(P, ['prevent']), ['right']),
                  se(ne(N, ['prevent']), ['down']),
                  se(ne(N, ['prevent']), ['left']),
                ],
              },
            ),
            st(
              {
                default: z(() => [
                  $e.$slots.content
                    ? E('', !0)
                    : (C(),
                      _(
                        'input',
                        H(
                          {
                            key: 0,
                            ref_key: 'input',
                            ref: l,
                            class: 'va-input__content__input',
                            type: 'number',
                            inputmode: 'decimal',
                          },
                          { ...Ae.value, ...s(Le) },
                          {
                            value: m.value,
                            'aria-live': $e.$props.disabled ? 'off' : 'polite',
                            onInput: T,
                            onChange: O,
                          },
                        ),
                        null,
                        16,
                        im,
                      )),
                ]),
                _: 2,
              },
              [
                $e.$props.buttons
                  ? {
                      name: 'prepend',
                      fn: z((at) => [
                        R(
                          'div',
                          {
                            class: 'va-counter__prepend-wrapper',
                            style: Y({ marginRight: ct.value }),
                            onMousedown: _e[0] || (_e[0] = ne((...vt) => s(p) && s(p)(...vt), ['prevent'])),
                          },
                          [
                            V($e.$slots, 'decreaseAction', J(ie({ ...at, decreaseCount: N })), () => [
                              ue(
                                s(xe),
                                H({ class: 'va-counter__button-decrease' }, ve.value, { ref: 'decreaseButtonRef' }),
                                null,
                                16,
                              ),
                            ]),
                          ],
                          36,
                        ),
                      ]),
                      key: '0',
                    }
                  : {
                      name: 'prependInner',
                      fn: z((at) => [
                        R(
                          'div',
                          {
                            class: 'va-counter__prepend-inner',
                            onMousedown: _e[1] || (_e[1] = ne((...vt) => s(p) && s(p)(...vt), ['prevent'])),
                          },
                          [
                            V($e.$slots, 'decreaseAction', J(ie({ ...at, decreaseCount: N })), () => [
                              ue(s(xe), H(ce.value, { ref: 'decreaseButtonRef' }), null, 16),
                            ]),
                          ],
                          32,
                        ),
                      ]),
                      key: '1',
                    },
                $e.$props.buttons
                  ? {
                      name: 'append',
                      fn: z((at) => [
                        R(
                          'div',
                          {
                            class: 'va-counter__append-wrapper',
                            style: Y({ marginLeft: ct.value }),
                            onMousedown: _e[2] || (_e[2] = ne((...vt) => s(p) && s(p)(...vt), ['prevent'])),
                          },
                          [
                            V($e.$slots, 'increaseAction', J(ie({ ...at, increaseCount: P })), () => [
                              ue(
                                s(xe),
                                H({ class: 'va-counter__button-increase' }, W.value, { ref: 'increaseButtonRef' }),
                                null,
                                16,
                              ),
                            ]),
                          ],
                          36,
                        ),
                      ]),
                      key: '2',
                    }
                  : {
                      name: 'appendInner',
                      fn: z((at) => [
                        R(
                          'div',
                          {
                            class: 'va-counter__append-inner',
                            onMousedown: _e[3] || (_e[3] = ne((...vt) => s(p) && s(p)(...vt), ['prevent'])),
                          },
                          [
                            V($e.$slots, 'increaseAction', J(ie({ ...at, increaseCount: P })), () => [
                              ue(s(xe), H(ke.value, { ref: 'increaseButtonRef' }), null, 16),
                            ]),
                          ],
                          32,
                        ),
                      ]),
                      key: '3',
                    },
                $e.$slots.content
                  ? {
                      name: 'default',
                      fn: z((at) => [
                        R(
                          'div',
                          { ref_key: 'input', ref: l, tabindex: '0', class: 'va-counter__content-wrapper' },
                          [V($e.$slots, 'content', J(ie({ ...at, value: Number(m.value) })))],
                          512,
                        ),
                      ]),
                      key: '4',
                    }
                  : void 0,
              ],
            ),
            1040,
            ['class', 'style', 'focused', 'error', 'error-messages', 'onKeydown'],
          )
        )
      )
    },
  }),
  fm = Q(pm),
  fi = { currentPage: { type: Number } },
  mi = () => ({ items: { type: Array, default: () => [] } }),
  gi = { selectable: { type: Boolean, default: !1 } },
  yi = { itemsTrackBy: { type: [String, Function], default: '' } },
  bi = (e) => {
    const t = e.length === 2 || e.length === 3,
      a = e.every((n) => ['asc', 'desc', null].includes(n)),
      o = e.length === new Set(e).size
    return t && a && o
  },
  mm = {
    ...mi(),
    columns: { type: Array, default: () => [] },
    sortingOptions: { type: Array, default: () => ['asc', 'desc', null], validator: bi },
  },
  hi = (e, t, a) => {
    const o = typeof e == 'string' ? { key: e } : e,
      n = o.sortingOptions ? bi(o.sortingOptions) : !0
    return (
      n ||
        De(
          `The "sortingOptions" array in the column with "${o.key}" key is invalid. For this column, the "sortingOptions" value is taken as for the table: ${JSON.stringify(a.sortingOptions)}.`,
        ),
      {
        source: e,
        initialIndex: t,
        key: o.key,
        name: o.name || o.key,
        label: o.label || pl(o.key),
        thTitle: o.thTitle || o.headerTitle || o.label || pl(o.key),
        sortable: o.sortable || !1,
        sortingFn: o.sortingFn,
        displayFormatFn: o.displayFormatFn,
        sortingOptions: (n && o.sortingOptions) || a.sortingOptions,
        thAlign: o.thAlign || o.alignHead || 'left',
        thVerticalAlign: o.thVerticalAlign || o.verticalAlignHead || 'middle',
        tdAlign: o.tdAlign || o.align || 'left',
        tdVerticalAlign: o.tdVerticalAlign || o.verticalAlign || 'middle',
        width: o.width,
        tdClass: o.tdClass || o.classes,
        thClass: o.thClass || o.headerClasses,
        tdStyle: o.tdStyle || o.style,
        thStyle: o.thStyle || o.headerStyle,
      }
    )
  },
  gm = (e) => Object.keys(Fu({}, ...e.items)).map((t, a) => hi(t, a, e)),
  ym = (e) => e.columns.map((t, a) => hi(t, a, e)),
  bm = (e) => ({ columnsComputed: i(() => (e.columns.length === 0 ? gm(e) : ym(e))) }),
  Da = { delay: { type: Number, default: 0, validator: (e) => e >= 0 } }
function hm(e, t) {
  const a = ut(t, 'delay') ?? 0,
    o = D(!0)
  let n
  return function (...l) {
    const r = () => e.apply(this, l)
    return s(a) ? (o.value && ((o.value = !1), setTimeout(() => (o.value = !0), s(a)), (n = r())), n) : r()
  }
}
function Zn(e, t) {
  const a = ut(t, 'delay') ?? 0
  if (!s(a)) return e
  const o = D(!0),
    n = D(),
    l = D(),
    r = D()
  return (
    re(
      e,
      () => {
        n.value = e.value
        const u = setTimeout(() => {
          r.value = n.value
        }, s(a))
        o.value
          ? ((o.value = !1),
            (r.value = e.value),
            (l.value = e.value),
            clearTimeout(u),
            setTimeout(() => (o.value = !0), s(a)))
          : (r.value = l.value)
      },
      { immediate: !0 },
    ),
    r
  )
}
const Cm = { ...Da, ...fi, perPage: { type: Number } },
  Sm = (e, t) => {
    const a = i(() => {
      if (!t.perPage || t.perPage < 0) return e.value
      if (!t.currentPage || t.currentPage < 0) return e.value.slice(0, t.perPage)
      const n = t.perPage * (t.currentPage - 1)
      return e.value.slice(n, n + t.perPage)
    })
    return { paginatedRows: Zn(a, t) }
  },
  Ci = (e, t) => (typeof t == 'function' ? t(e) : Un(e, t) || e),
  $m = () => ({ ...mi(), ...yi }),
  km = (e, t, a, o) => {
    var n
    const l = Un(a, o.key)
    return {
      rowIndex: e,
      rowKey: t,
      rowData: a,
      column: o,
      source: l,
      value: ((n = l == null ? void 0 : l.toString) == null ? void 0 : n.call(l)) || '',
    }
  },
  wm = (e, t, a, o) => {
    const n = Ci(e, a)
    return { initialIndex: t, itemKey: n, source: e, cells: o.map((l) => km(t, n, e, l)), rowData: e }
  },
  _m = (e, t) => {
    const a = D({})
    return {
      rowsComputed: i(() =>
        t.items.map((n, l) => ({
          ...wm(n, l, t.itemsTrackBy, e.value),
          toggleRowDetails: (r) => {
            typeof r == 'boolean' ? (a.value[l] = r) : (a.value[l] = !a.value[l])
          },
          isExpandableRowVisible: !!a.value[l],
        })),
      ),
    }
  },
  Vm = { ...gi, ...yi, modelValue: { type: Array }, selectMode: { type: String, default: 'multiple' } },
  Bm = (e, t, a) => {
    const o = D([]),
      n = i({
        get() {
          return t.modelValue === void 0 ? o.value : t.modelValue
        },
        set(k) {
          ;(t.modelValue === void 0 && (o.value = k), a('update:modelValue', k))
        },
      }),
      l = D(-1)
    ;(re(
      () => t.selectMode,
      (k, T) => {
        k === 'single' && T === 'multiple' && ((n.value = []), b(-1))
      },
    ),
      re(e, () => {
        b(-1)
      }),
      re(
        n,
        (k, T = []) => {
          a('selectionChange', { currentSelectedItems: k, previousSelectedItems: T })
        },
        { immediate: !0 },
      ))
    const r = (k) => Ci(k, t.itemsTrackBy),
      u = i(() => !e.value.some(({ source: k }) => n.value.includes(r(k)))),
      d = i(() => (e.value.length === 0 ? !1 : e.value.every(({ source: k }) => n.value.includes(r(k))))),
      c = i(() => !u.value && !d.value)
    function v(k) {
      return n.value.includes(r(k.source))
    }
    function p() {
      n.value = [...new Set([...n.value, ...e.value.map((k) => r(k.source))])]
    }
    function f() {
      const k = e.value.map((T) => r(T.source))
      n.value = n.value.filter((T) => !k.includes(T))
    }
    function g(k) {
      n.value = [...n.value, r(k.source)]
    }
    function y(k) {
      n.value = [r(k.source)]
    }
    function m(k) {
      const T = n.value.findIndex((O) => O === r(k.source))
      n.value = [...n.value.slice(0, T), ...n.value.slice(T + 1)]
    }
    function b(k) {
      if (k === -1) l.value = -1
      else {
        const T = e.value.find((O) => O.initialIndex === k)
        T ? (l.value = e.value.indexOf(T)) : (l.value = -1)
      }
    }
    function h(k) {
      let T, O
      return (
        v(e.value[l.value])
          ? ((T = Math.min(l.value, k)), (O = Math.max(l.value, k)))
          : ((T = Math.min(l.value + 1, k)), (O = Math.max(l.value - 1, k))),
        e.value.slice(T, O + 1)
      )
    }
    function $(k) {
      const T = k.map((M) => r(M.source))
      if (u.value) {
        n.value = T
        return
      }
      if (T.every((M) => n.value.includes(M))) {
        n.value = n.value.filter((M) => !T.includes(M))
        return
      }
      n.value = [...new Set([...n.value, ...T])]
    }
    function S(k) {
      t.selectable &&
        (v(k)
          ? (m(k), t.selectMode === 'single' ? b(-1) : b(k.initialIndex))
          : (t.selectMode === 'single' ? y(k) : g(k), b(k.initialIndex)))
    }
    function w(k) {
      t.selectable && S(k)
    }
    function I(k) {
      if (!t.selectable) return
      if (t.selectMode === 'single' || l.value === -1) return S(k)
      const T = e.value.indexOf(k)
      ;($(h(T)), b(-1))
    }
    function A() {
      ;(d.value ? f() : p(), b(-1))
    }
    return {
      ctrlSelectRow: w,
      shiftSelectRows: I,
      toggleRowSelection: S,
      toggleBulkSelection: A,
      isRowSelected: v,
      noRowsSelected: u,
      severalRowsSelected: c,
      allRowsSelected: d,
    }
  },
  Ft = '--va-data-table',
  Si = (e) => typeof e == 'function',
  $i = {
    ...gi,
    selectedColor: { type: String, default: 'primary' },
    allowFooterSorting: { type: Boolean, default: !1 },
    stickyHeader: { type: Boolean, default: !1 },
    stickyFooter: { type: Boolean, default: !1 },
    height: { type: [String, Number] },
  },
  Tm = (e) => (Si(e) ? e() : e),
  Im = (e) => (Si(e) ? e() : e),
  ki = (e) => {
    const { getColor: t, getFocusColor: a, getHoverColor: o } = Ce(),
      n = i(() => t(e.selectedColor))
    return {
      CSSVariables: i(() => ({
        hoverColor: o(n.value),
        selectedColor: e.selectable ? a(n.value) : void 0,
        tableHeight: e.height ? _n(e.height) : 'var(--va-data-table-height)',
        theadBg: e.stickyHeader
          ? 'var(--va-data-table-thead-background, var(--va-data-table-header-background))'
          : 'var(--va-data-table-thead-background)',
        tfootBg: e.stickyFooter
          ? 'var(--va-data-table-tfoot-background, var(--va-data-table-header-background))'
          : 'var(--va-data-table-tfoot-background)',
      })),
      getHeaderCSSVariables: (c) => ({
        [`${Ft}-width`]: c.width && _n(c.width),
        [`${Ft}-align`]: c.thAlign,
        [`${Ft}-vertical-align`]: c.thVerticalAlign,
        [`${Ft}-cursor`]: c.sortable ? 'pointer' : 'default',
      }),
      getCellCSSVariables: (c) => ({
        [`${Ft}-align`]: c.column.tdAlign,
        [`${Ft}-vertical-align`]: c.column.tdVerticalAlign,
      }),
      getFooterCSSVariables: (c) => ({
        [`${Ft}-align`]: c.thAlign,
        [`${Ft}-vertical-align`]: c.thVerticalAlign,
        [`${Ft}-cursor`]: e.allowFooterSorting && c.sortable ? 'pointer' : 'default',
      }),
      getClass: Tm,
      getStyle: Im,
    }
  },
  Ql = (e) => typeof e == 'function',
  er = (e) => e !== null && typeof e == 'object',
  Pm = { rowBind: { type: null }, cellBind: { type: null } },
  Am = (e) => ({
    getRowBind: (o) => (Ql(e.rowBind) ? e.rowBind(o.source, o.initialIndex) : er(e.rowBind) ? e.rowBind : {}),
    getCellBind: (o, n) =>
      Ql(e.cellBind) ? e.cellBind(o.source, n.source, o.column, n.initialIndex) : er(e.cellBind) ? e.cellBind : {},
  }),
  Lm = { ...fi, animated: { type: Boolean, default: !0 } },
  Om = (e, t) => {
    const a = D('shuffle'),
      o = i(() => (e.animated ? `table-transition-${a.value}` : '')),
      n = D(t.value.length),
      l = i(() => t.value.length !== n.value)
    return (
      re(t, (r, u) => {
        const d = !!(r.length && u.length)
        ;((a.value = r.length > 50 || (l.value && d) ? 'fade' : 'shuffle'), (n.value = r.length))
      }),
      re(
        () => e.currentPage,
        () => {
          l.value || (a.value = 'shuffle')
        },
      ),
      o
    )
  },
  xm = { ...Da, filter: { type: String, default: '' }, filterMethod: { type: Function } },
  Em = (e, t, a) => {
    const o = i(() =>
        !e.value.length || (t.filter === '' && !t.filterMethod)
          ? e.value
          : e.value.filter((l) =>
              l.cells.some((r) =>
                typeof t.filterMethod == 'function'
                  ? t.filterMethod(r.source, r)
                  : new RegExp(t.filter, 'i').test(r.value),
              ),
            ),
      ),
      n = Zn(o, t)
    return (
      re(n, () => {
        a('filtered', { items: n.value.map((l) => l.source), itemsIndexes: n.value.map((l) => l.initialIndex) })
      }),
      o.value.length !== e.value.length &&
        a('filtered', { items: o.value.map((l) => l.source), itemsIndexes: o.value.map((l) => l.initialIndex) }),
      { filteredRows: n }
    )
  },
  Dm = {
    ...Da,
    sortBy: { type: String },
    columnSorted: { type: Object },
    sortingOrder: { type: [String, null] },
    disableClientSideSorting: { type: Boolean, default: !1 },
  },
  Fm = (e, t, a, o) => {
    const n = D(''),
      l = i({
        get() {
          return a.sortBy === void 0 ? n.value : a.sortBy
        },
        set(y) {
          ;(a.sortBy === void 0 && (n.value = y), o('update:sortBy', y))
        },
      }),
      r = D(null),
      u = i({
        get() {
          return a.sortingOrder === void 0 ? r.value : a.sortingOrder
        },
        set(y) {
          ;(a.sortingOrder === void 0 && (r.value = y), o('update:sortingOrder', y))
        },
      }),
      d = (y, m) => {
        if (typeof y == 'string' && typeof m == 'string') return y.localeCompare(m)
        if (typeof y == 'number' && typeof m == 'number') return y - m
        const b = parseFloat(y),
          h = parseFloat(m)
        return !isNaN(b) && !isNaN(h) ? b - h : isNaN(b) ? (isNaN(h) ? 0 : 1) : -1
      },
      c = i(() => {
        if (a.disableClientSideSorting || t.value.length <= 1) return t.value
        const y = e.value.findIndex(({ name: h, sortable: $ }) => l.value === h && $),
          m = e.value[y]
        if (!m) return t.value
        const b = u.value === 'desc' ? -1 : 1
        return [...t.value].sort((h, $) => {
          if (u.value === null) return h.initialIndex - $.initialIndex
          {
            const S = h.cells[y].source,
              w = $.cells[y].source
            return b * (typeof m.sortingFn == 'function' ? m.sortingFn(S, w) : d(S, w))
          }
        })
      })
    re(c, () => {
      o('sorted', {
        sortBy: l.value,
        sortingOrder: u.value,
        items: c.value.map((y) => y.source),
        itemsIndexes: c.value.map((y) => y.initialIndex),
      })
    })
    const v = (y, m) => {
      const b = m.findIndex((h) => h === y)
      return b !== -1 ? m[(b + 1) % m.length] : m[0]
    }
    function p(y) {
      let m
      ;(y.name === l.value ? (m = v(u.value, y.sortingOptions)) : ((l.value = y.name), (m = y.sortingOptions[0])),
        (u.value = m),
        o('columnSorted', { columnName: y.name, value: m, column: y }))
    }
    const f = hm(p, a),
      g = i(() => (u.value === 'asc' ? 'va-sort-asc' : u.value === 'desc' ? 'va-sort-desc' : 'va-unsorted'))
    return { sortBySync: l, sortingOrderSync: u, toggleSorting: f, sortedRows: c, sortingOrderIconName: g }
  },
  Mm = (e) => {
    const t = s(e)
    return Xe(t)
  },
  ho = () => {
    const e = we()
    return i({
      get() {
        return Mm(e)
      },
      set(t) {
        e.value = t
      },
    })
  },
  Nm = {
    scrollTopMargin: { type: [Number, String], default: 0 },
    scrollBottomMargin: { type: [Number, String], default: 0 },
  },
  Rm = ['scroll:top', 'scroll:bottom'],
  zm = (e, t) => {
    var a
    const o = (a = qe()) == null ? void 0 : a.vnode.props,
      n = (o == null ? void 0 : o['onScroll:top']) !== void 0,
      l = (o == null ? void 0 : o['onScroll:bottom']) !== void 0,
      r = ho(),
      u = ho(),
      d = ho(),
      c = Pe('scrollTopMargin'),
      v = Pe('scrollBottomMargin'),
      p = i(() => !!r.value),
      f = (m) => {
        m.forEach((b) => {
          b.isIntersecting && (b.target === u.value ? t('scroll:top') : t('scroll:bottom'))
        })
      },
      g = i(() => {
        const m = []
        return (p.value && (u.value && m.push(u.value), d.value && m.push(d.value)), m)
      }),
      y = i(() => ({ root: r.value, rootMargin: `${c.value ?? 0}px 0px ${v.value ?? 0}px 0px` }))
    return (
      ci(f, y, g),
      { scrollContainer: r, topTrigger: u, bottomTrigger: d, doRenderTopTrigger: n, doRenderBottomTrigger: l }
    )
  },
  Hm = { class: 'va-data-table__table-tr' },
  jm = { key: 0, scope: 'col', class: 'va-data-table__table-th va-data-table__table-cell-select' },
  Um = ['title', 'onClick', 'onKeydown'],
  Wm = { class: 'va-data-table__table-th-wrapper' },
  Km = { key: 0 },
  Gm = G({
    name: 'VaDataTableThRow',
    __name: 'VaDataTableThRow',
    props: {
      ...$i,
      selectMode: { type: String, default: 'multiple' },
      allRowsSelected: { type: Boolean, default: !1 },
      severalRowsSelected: { type: Boolean, default: !1 },
      columns: { type: Array, required: !0 },
      isFooter: { type: Boolean, default: !1 },
      sortBySync: { type: String, required: !0 },
      sortingOrderIconName: { type: String, required: !0 },
      sortingOrderSync: { type: String, default: null },
      ariaSelectAllRowsLabel: ye('$t:selectAllRows'),
      ariaSortColumnByLabel: ye('$t:sortColumnBy'),
    },
    emits: ['toggleBulkSelection', 'toggleSorting'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { tp: n } = He(),
        { getFooterCSSVariables: l, getHeaderCSSVariables: r, getClass: u, getStyle: d } = ki(a),
        c = (m) => {
          const b =
              a.sortingOrderSync && a.sortBySync === m.name
                ? a.sortingOrderSync === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none',
            h = m.sortable ? n(a.ariaSortColumnByLabel, { name: m.label }) : void 0
          return { 'aria-sort': b, 'aria-label': h }
        },
        v = (m) => {
          ;(a.isFooter && !a.allowFooterSorting) || !m.sortable || o('toggleSorting', m)
        },
        p = () => o('toggleBulkSelection'),
        f = (m) => [m.width ? { minWidth: m.width, maxWidth: m.width } : {}, a.isFooter ? l(m) : r(m), d(m.thStyle)],
        g = i(() => (a.isFooter ? 'footer' : 'header')),
        y = i(() => a.selectMode === 'multiple')
      return (m, b) => (
        C(),
        _('tr', Hm, [
          m.$props.selectable
            ? (C(),
              _('th', jm, [
                y.value
                  ? (C(),
                    U(
                      s(oo),
                      {
                        key: 0,
                        class: 'va-data-table__table-cell-checkbox',
                        'model-value': m.$props.severalRowsSelected ? 'idl' : m.$props.allRowsSelected,
                        'aria-label': s(n)(m.$props.ariaSelectAllRowsLabel),
                        'true-value': !0,
                        'false-value': !1,
                        color: m.$props.selectedColor,
                        'indeterminate-value': 'idl',
                        indeterminate: '',
                        'onUpdate:modelValue': p,
                      },
                      null,
                      8,
                      ['model-value', 'aria-label', 'color'],
                    ))
                  : E('', !0),
              ]))
            : E('', !0),
          (C(!0),
          _(
            be,
            null,
            Ie(
              e.columns,
              (h) => (
                C(),
                _(
                  'th',
                  H(
                    {
                      key: h.name,
                      scope: 'col',
                      class: ['va-data-table__table-th', s(u)(h.thClass)],
                      title: h.thTitle,
                      style: f(h),
                    },
                    c(h),
                    {
                      onClick: ne(($) => v(h), ['exact']),
                      onKeydown: se(
                        ne(($) => v(h), ['stop']),
                        ['enter'],
                      ),
                    },
                  ),
                  [
                    R('div', Wm, [
                      `${g.value}(${h.name})` in m.$slots
                        ? (C(),
                          _('span', Km, [V(m.$slots, `${g.value}(${h.name})`, J(ie({ label: h.label, key: h.key })))]))
                        : V(m.$slots, g.value, J(H({ key: 1 }, { label: h.label, key: h.key })), () => [
                            R('span', null, fe(h.label), 1),
                          ]),
                      h.sortable
                        ? (C(),
                          U(
                            s(Oe),
                            {
                              key: 2,
                              class: pe([
                                'va-data-table__table-th-sorting-icon',
                                { active: e.sortBySync === h.name && e.sortingOrderSync !== null },
                              ]),
                              size: 'small',
                              role: h.sortable ? 'button' : void 0,
                              tabindex: h.sortable ? 0 : -1,
                              name: e.sortingOrderIconName,
                              onSelectstart: ne(() => {}, ['prevent']),
                            },
                            null,
                            8,
                            ['class', 'role', 'tabindex', 'name'],
                          ))
                        : E('', !0),
                    ]),
                  ],
                  16,
                  Um,
                )
              ),
            ),
            128,
          )),
        ])
      )
    },
  }),
  Vn = Q(Gm),
  { isParsablePositiveMeasure: qm, parseSizeValue: tr } = ni(),
  ar = (e, t) => {
    const a = qm(e)
    return (
      !a && De(`[va-virtual-scroller] ${t} should be number or parsable int greater or equal to 0. Provided: ${e}.`),
      a
    )
  },
  Ym = {
    horizontal: { type: Boolean, default: !1 },
    itemSize: { type: [Number, String], default: 0, validator: (e) => ar(e, 'itemSize') },
    wrapperSize: { type: [Number, String], default: 100, validator: (e) => e === 'auto' || ar(e, 'wrapperSize') },
  },
  Xm = (e, t) => {
    const a = we(),
      o = we(),
      n = i(() => (e.horizontal ? 'clientWidth' : 'clientHeight')),
      l = i(() => {
        var g
        return e.wrapperSize === 'auto' ? ((g = o.value) == null ? void 0 : g[n.value]) || 0 : tr(e.wrapperSize, r)
      }),
      r = D(16)
    We(
      'resize',
      () => {
        ;((r.value = parseFloat(getComputedStyle(document.documentElement).fontSize)), c())
      },
      !0,
    )
    const d = D(0),
      c = () => {
        if (!a.value) return
        const g = [],
          m = a.value.children.length
        for (let b = 0; b < m; b++) {
          const h = a.value.children.item(b)
          h && g.push(h[n.value])
        }
        d.value = m ? Math.trunc(g.reduce((b, h) => b + h, 0) / (m - 1)) : 0
      },
      v = qe()
    ;(Me(() => {
      var g, y
      ;(a.value ||
        (a.value = (y = (g = v == null ? void 0 : v.parent) == null ? void 0 : g.refs) == null ? void 0 : y.list),
        c())
    }),
      re(t, c),
      re(l, c))
    let p = 0
    const f = i(() => {
      const g = tr(e.itemSize, r),
        y = Math.max(g, d.value, 1)
      return Math.abs((p / y) * 100 - 100) > 5 || p === 0 ? ((p = y), y) : p
    })
    return { list: a, wrapper: o, itemSize: f, wrapperSize: l }
  },
  Jm = { trackBy: { type: [String, Number, Function], default: '' } },
  Zm = (e) => ({
    getKey: (a, o, n) => {
      if (e.trackBy && a && typeof a == 'object' && !Xa(e.trackBy)) {
        const l = Array.isArray(a)
        let r
        if ((l && !isNaN(+e.trackBy) && (r = a[+e.trackBy]), l || (r = a[e.trackBy]), r || r === 0)) return r
        De(`${l ? 'Index' : 'Key'} '${e.trackBy}' wasn't found in provided ${l ? 'array' : 'object'}: `, a)
      }
      return Xa(e.trackBy) ? e.trackBy(a) : n
    },
  }),
  Qm = G({
    name: 'VaVirtualScroller',
    __name: 'VaVirtualScroller',
    props: {
      ...Jm,
      ...Ym,
      items: { type: Array, default: () => [] },
      bench: { type: [Number, String], default: 10, validator: (e) => Number(e) >= 0 },
      disabled: { type: Boolean, default: !1 },
      table: { type: Boolean, default: !1 },
    },
    emits: ['scroll:bottom'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = D(0),
        r = Pe('bench'),
        u = i(() => (o.horizontal ? 'scrollLeft' : 'scrollTop')),
        d = () => {
          v.value && (l.value = v.value[u.value])
        }
      o.disabled || We('scroll', d, !0)
      const { list: c, wrapper: v, itemSize: p, wrapperSize: f } = Xm(o, l),
        { getKey: g } = Zm(o),
        y = (B, K, L) => g(B, K, L)
      re(l, (B) => {
        B + f.value === k.value && n('scroll:bottom')
      })
      const m = i(() => Math.max(0, Math.floor(l.value / p.value) - r.value)),
        b = i(() => {
          var B
          return (B = o.items) != null && B.length
            ? o.disabled
              ? o.items.length
              : Math.min(o.items.length - m.value, Math.ceil(f.value / p.value) + r.value * 2)
            : 0
        }),
        h = i(() => m.value + b.value),
        $ = i(() => {
          var B
          return (B = o.items) != null && B.length ? o.items.slice(m.value, h.value) : []
        }),
        S = i(() => (o.horizontal ? 'width' : 'height')),
        w = i(() => o.table && o.disabled),
        I = i(() => ({ [S.value]: w.value || !f.value ? void 0 : `${f.value}px` })),
        A = Fe('va-virtual-scroller', () => ({ ...Ge(o, ['horizontal']) })),
        k = i(() => {
          var B
          return (((B = o.items) == null ? void 0 : B.length) ?? 0) * p.value
        }),
        T = i(() => ({ [S.value]: w.value ? void 0 : `${k.value}px` })),
        O = i(() => m.value * p.value),
        M = i(() => ({ transform: `translate${o.horizontal ? 'X' : 'Y'}(${O.value}px)` })),
        ae = i(() => (o.horizontal ? 'left' : 'top'))
      return (
        t({
          scrollToAttribute: ae,
          virtualScrollTo: (B) => {
            var K
            ;(!B && B !== 0) || (K = v.value) == null || K.scrollTo({ [ae.value]: B * p.value })
          },
        }),
        (B, K) => (
          C(),
          _(
            'div',
            { ref_key: 'wrapper', ref: v, class: pe(['va-virtual-scroller', s(A)]), style: Y(I.value) },
            [
              V(
                B.$slots,
                'content',
                J(
                  ie({
                    containerStyleComputed: T.value,
                    listStyleComputed: M.value,
                    renderBuffer: $.value,
                    uniqueKey: y,
                    currentListOffset: O.value,
                  }),
                ),
                () => [
                  R(
                    'div',
                    { class: 'va-virtual-scroller__container', style: Y(T.value) },
                    [
                      R(
                        'div',
                        {
                          ref_key: 'list',
                          ref: c,
                          role: 'list',
                          class: 'va-virtual-scroller__list',
                          style: Y(M.value),
                        },
                        [
                          (C(!0),
                          _(
                            be,
                            null,
                            Ie($.value, (L, x) =>
                              V(B.$slots, 'default', J(H({ key: y(L, x) }, { item: L, index: m.value + x }))),
                            ),
                            128,
                          )),
                        ],
                        4,
                      ),
                    ],
                    4,
                  ),
                ],
              ),
            ],
            6,
          )
        )
      )
    },
  }),
  jo = Q(Qm),
  eg = { key: 0, class: 'va-inner-loading__overlay', 'aria-hidden': 'true' },
  tg = G({
    name: 'VaInnerLoading',
    __name: 'VaInnerLoading',
    props: {
      ...to,
      ...me,
      color: { type: String },
      icon: { type: String, default: 'va-loading' },
      size: { type: [Number, String], default: 30 },
    },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        o = i(() => a(t.color)),
        n = i(() => ({ 'va-inner-loading--active': t.loading })),
        l = i(() => ({ 'aria-busy': t.loading }))
      return (r, u) => (
        C(),
        _(
          'div',
          H({ class: ['va-inner-loading', n.value], 'aria-live': 'polite' }, l.value),
          [
            V(r.$slots, 'default'),
            r.$props.loading
              ? (C(),
                _('div', eg, [
                  V(r.$slots, 'loading', {}, () => [
                    ue(
                      s(Oe),
                      {
                        class: 'va-inner-loading__spinner',
                        spin: 'counter-clockwise',
                        color: o.value,
                        size: r.$props.size,
                        name: r.$props.icon,
                      },
                      null,
                      8,
                      ['color', 'size', 'name'],
                    ),
                  ]),
                ]))
              : E('', !0),
          ],
          16,
        )
      )
    },
  }),
  wi = Q(tg),
  ag = { key: 0 },
  og = { ref: 'list', class: 'va-data-table__table-tbody' },
  ng = { key: 'showNoDataHtml', class: 'va-data-table__table-tr' },
  lg = { class: 'va-data-table__table-td no-data', colspan: '99999' },
  rg = ['innerHTML'],
  sg = { key: 'showNoDataFilteredHtml', class: 'va-data-table__table-tr' },
  ig = { class: 'va-data-table__table-td no-data', colspan: '99999' },
  ug = ['innerHTML'],
  cg = ['onClick', 'onDblclick', 'onContextmenu'],
  dg = { key: 0, class: 'va-data-table__grid-column-header' },
  vg = { key: 0, class: 'va-data-table__table-tr' },
  or = Ee(jo, ['items', 'trackBy', 'horizontal', 'disabled', 'table']),
  nr = Ee(Vn),
  pg = G({
    name: 'VaDataTable',
    inheritAttrs: !1,
    __name: 'VaDataTable',
    props: {
      ...me,
      ...or,
      ...Lm,
      ...Pm,
      ...Nm,
      ...Dm,
      ...$i,
      ...mm,
      ...xm,
      ...Cm,
      ...$m(),
      ...Vm,
      ...Da,
      ...Ge(nr, ['ariaSelectAllRowsLabel', 'ariaSortColumnByLabel']),
      hoverable: { type: Boolean, default: !1 },
      clickable: { type: Boolean, default: !1 },
      loading: { type: Boolean, default: !1 },
      loadingColor: { type: String, default: 'primary' },
      noDataHtml: { type: String, default: 'No items' },
      noDataFilteredHtml: { type: String, default: 'No items match the provided filtering condition' },
      hideDefaultHeader: { type: Boolean, default: !1 },
      footerClone: { type: Boolean, default: !1 },
      striped: { type: Boolean, default: !1 },
      virtualScroller: { type: Boolean, default: !1 },
      virtualTrackBy: { type: [String, Number], default: 'initialIndex' },
      grid: { type: Boolean, default: !1 },
      gridColumns: { type: [Number, String], default: 0 },
      wrapperSize: { type: [Number, String], default: 'auto' },
      ariaSelectRowLabel: ye('$t:selectRowByIndex'),
    },
    emits: [
      'update:modelValue',
      'update:sortBy',
      'update:sortingOrder',
      'filtered',
      'sorted',
      'selectionChange',
      'row:click',
      'row:dblclick',
      'row:contextmenu',
      'columnSorted',
      ...Rm,
    ],
    setup(e, { emit: t }) {
      const { tp: a } = He(),
        o = e,
        n = t,
        { columnsComputed: l } = bm(o),
        { rowsComputed: r } = _m(l, o),
        { filteredRows: u } = Em(r, o, n),
        {
          sortBySync: d,
          sortingOrderSync: c,
          toggleSorting: v,
          sortedRows: p,
          sortingOrderIconName: f,
        } = Fm(l, u, o, n),
        { paginatedRows: g } = Sm(p, o),
        {
          ctrlSelectRow: y,
          shiftSelectRows: m,
          toggleBulkSelection: b,
          isRowSelected: h,
          severalRowsSelected: $,
          allRowsSelected: S,
          toggleRowSelection: w,
        } = Bm(g, o, n),
        { CSSVariables: I, getCellCSSVariables: A, getClass: k, getStyle: T } = ki(o),
        { getRowBind: O, getCellBind: M } = Am(o),
        ae = Om(o, g),
        oe = i(() => o.items.length === 0),
        B = i(() => g.value.length === 0),
        K = (ge, Ae, je) => {
          ;(n(ge, { event: Ae, item: je.source, itemIndex: je.initialIndex, row: je }), o.selectable && o.grid && w(je))
        },
        L = i(() => ({
          ...At(P, ['class', 'style']),
          class: Ge(o, ['striped', 'selectable', 'hoverable', 'clickable']),
        })),
        x = ze(or),
        N = i(() => ({
          ...x.value,
          items: g.value,
          trackBy: o.virtualTrackBy,
          disabled: !o.virtualScroller,
          table: !0,
        })),
        P = Yt(),
        te = i(() => ({
          class: [
            { 'va-data-table--sticky': o.stickyHeader || o.stickyFooter },
            { 'va-data-table--scroll': !!o.height },
            { 'va-data-table--virtual-scroller': W.value },
            { 'va-data-table--grid': o.grid },
            P.class,
          ],
          style: [P.style],
          ...N.value,
        })),
        X = ze(nr),
        ce = i(() => ({
          ...X.value,
          columns: l.value,
          sortingOrderIconName: f.value,
          severalRowsSelected: $.value,
          sortingOrderSync: c.value,
          allRowsSelected: S.value,
          sortBySync: d.value,
        })),
        {
          scrollContainer: ke,
          topTrigger: de,
          bottomTrigger: F,
          doRenderTopTrigger: le,
          doRenderBottomTrigger: ve,
        } = zm(o, n),
        W = i(() => o.virtualScroller && !o.grid),
        j = i(() => o.gridColumns || 'var(--va-data-table-grid-tbody-columns)'),
        Se = (ge, Ae) => (Ae.displayFormatFn ? Ae.displayFormatFn(ge.value) : ge.value)
      return (ge, Ae) => (
        C(),
        U(
          s(jo),
          H({ class: 'va-data-table' }, te.value, {
            ref_key: 'scrollContainer',
            ref: ke,
            style: `--va-css-variables-selected-color: ${String(s(I).selectedColor)};--va-css-variables-hover-color: ${String(s(I).hoverColor)};--va-css-variables-table-height: ${String(s(I).tableHeight)};--va-css-variables-thead-bg: ${String(s(I).theadBg)};--va-css-variables-tfoot-bg: ${String(s(I).tfootBg)};--va-grid-columns-count: ${String(j.value)}`,
          }),
          {
            content: z(
              ({
                uniqueKey: je,
                renderBuffer: ot,
                currentListOffset: ct,
                listStyleComputed: it,
                containerStyleComputed: Le,
              }) => [
                ue(
                  s(wi),
                  { 'aria-live': 'polite', style: Y(Le), loading: e.loading, color: e.loadingColor },
                  {
                    default: z(() => [
                      s(le)
                        ? (C(),
                          _(
                            'div',
                            { key: 0, ref_key: 'topTrigger', ref: de, class: 'va-data-table__scroll-trigger' },
                            null,
                            512,
                          ))
                        : E('', !0),
                      R(
                        'table',
                        H({ class: 'va-data-table__table', style: it }, L.value),
                        [
                          'colgroup' in ge.$slots
                            ? (C(), _('colgroup', ag, [V(ge.$slots, 'colgroup', J(ie(s(l))))]))
                            : E('', !0),
                          R(
                            'thead',
                            {
                              class: pe([
                                'va-data-table__table-thead',
                                { 'va-data-table__table-thead--sticky': ge.$props.stickyHeader },
                              ]),
                              style: Y({ top: W.value && ge.$props.stickyHeader ? `-${ct}px` : void 0 }),
                            },
                            [
                              V(ge.$slots, 'headerPrepend'),
                              V(ge.$slots, 'header', {}, () => [
                                e.hideDefaultHeader
                                  ? E('', !0)
                                  : (C(),
                                    U(
                                      s(Vn),
                                      H({ key: 0 }, ce.value, { onToggleBulkSelection: s(b), onToggleSorting: s(v) }),
                                      st({ _: 2 }, [
                                        Ie(ge.$slots, (Ve, $e) => ({
                                          name: $e,
                                          fn: z((_e) => [V(ge.$slots, $e, J(ie(_e)))]),
                                        })),
                                      ]),
                                      1040,
                                      ['onToggleBulkSelection', 'onToggleSorting'],
                                    )),
                              ]),
                              V(ge.$slots, 'headerAppend'),
                            ],
                            6,
                          ),
                          R(
                            'tbody',
                            og,
                            [
                              V(ge.$slots, 'bodyPrepend'),
                              ue(
                                vu,
                                {
                                  name: W.value ? '' : s(ae),
                                  css: !ge.$props.virtualScroller,
                                  appear: !ge.$props.virtualScroller,
                                },
                                {
                                  default: z(() => [
                                    oe.value
                                      ? (C(),
                                        _('tr', ng, [
                                          R('td', lg, [
                                            V(ge.$slots, 'no-data', {}, () => [
                                              R('div', { innerHTML: e.noDataHtml }, null, 8, rg),
                                            ]),
                                          ]),
                                        ]))
                                      : B.value
                                        ? (C(),
                                          _('tr', sg, [
                                            R('td', ig, [
                                              V(ge.$slots, 'no-filtered-data', {}, () => [
                                                V(ge.$slots, 'no-data', {}, () => [
                                                  R('div', { innerHTML: e.noDataFilteredHtml }, null, 8, ug),
                                                ]),
                                              ]),
                                            ]),
                                          ]))
                                        : E('', !0),
                                    (C(!0),
                                    _(
                                      be,
                                      null,
                                      Ie(
                                        ot,
                                        (Ve, $e) => (
                                          C(),
                                          _(
                                            be,
                                            { key: `table-row_${je(Ve, $e)}` },
                                            [
                                              R(
                                                'tr',
                                                H(
                                                  {
                                                    class: [
                                                      'va-data-table__table-tr',
                                                      [
                                                        {
                                                          selected: s(h)(Ve),
                                                          'va-data-table__table-tr--expanded':
                                                            Ve.isExpandableRowVisible,
                                                        },
                                                      ],
                                                    ],
                                                  },
                                                  s(O)(Ve),
                                                  {
                                                    onClick: (_e) => K('row:click', _e, Ve),
                                                    onDblclick: (_e) => K('row:dblclick', _e, Ve),
                                                    onContextmenu: (_e) => K('row:contextmenu', _e, Ve),
                                                  },
                                                ),
                                                [
                                                  ge.selectable && !ge.$props.grid
                                                    ? (C(),
                                                      _(
                                                        'td',
                                                        {
                                                          class:
                                                            'va-data-table__table-td va-data-table__table-cell-select',
                                                          key: `selectable_${je(Ve, $e)}`,
                                                          onSelectstart: Ae[0] || (Ae[0] = ne(() => {}, ['prevent'])),
                                                        },
                                                        [
                                                          ue(
                                                            s(oo),
                                                            {
                                                              class: 'va-data-table__table-cell-checkbox',
                                                              'model-value': s(h)(Ve),
                                                              color: ge.selectedColor,
                                                              'aria-label': s(a)(ge.$props.ariaSelectRowLabel, {
                                                                index: Ve.initialIndex,
                                                              }),
                                                              onClick: [
                                                                ne((_e) => s(m)(Ve), ['shift', 'exact', 'stop']),
                                                                ne((_e) => s(y)(Ve), ['ctrl', 'exact', 'stop']),
                                                                ne((_e) => s(y)(Ve), ['exact', 'stop']),
                                                              ],
                                                            },
                                                            null,
                                                            8,
                                                            ['model-value', 'color', 'aria-label', 'onClick'],
                                                          ),
                                                        ],
                                                        32,
                                                      ))
                                                    : E('', !0),
                                                  (C(!0),
                                                  _(
                                                    be,
                                                    null,
                                                    Ie(
                                                      Ve.cells,
                                                      (_e, at) => (
                                                        C(),
                                                        _(
                                                          'td',
                                                          H(
                                                            {
                                                              key: `table-cell_${_e.column.name + _e.rowIndex}`,
                                                              class: [
                                                                'va-data-table__table-td',
                                                                s(k)(_e.column.tdClass),
                                                              ],
                                                              style: [
                                                                _e.column.width
                                                                  ? {
                                                                      minWidth: _e.column.width,
                                                                      maxWidth: _e.column.width,
                                                                    }
                                                                  : {},
                                                                s(A)(_e),
                                                                s(T)(_e.column.tdStyle),
                                                              ],
                                                            },
                                                            s(M)(_e, Ve),
                                                          ),
                                                          [
                                                            `cell(${_e.column.name})` in ge.$slots
                                                              ? V(
                                                                  ge.$slots,
                                                                  `cell(${_e.column.name})`,
                                                                  J(
                                                                    H(
                                                                      { key: 0 },
                                                                      {
                                                                        ..._e,
                                                                        row: Ve,
                                                                        isExpanded: Ve.isExpandableRowVisible,
                                                                      },
                                                                    ),
                                                                  ),
                                                                )
                                                              : V(
                                                                  ge.$slots,
                                                                  'cell',
                                                                  J(H({ key: 1 }, { cell: _e, row: Ve })),
                                                                  () => [
                                                                    ge.$props.grid
                                                                      ? (C(), _('span', dg, fe(s(l)[at].label), 1))
                                                                      : E('', !0),
                                                                    Te(' ' + fe(Se(_e, s(l)[at])), 1),
                                                                  ],
                                                                ),
                                                          ],
                                                          16,
                                                        )
                                                      ),
                                                    ),
                                                    128,
                                                  )),
                                                ],
                                                16,
                                                cg,
                                              ),
                                              Ve.isExpandableRowVisible
                                                ? (C(),
                                                  _('tr', vg, [
                                                    (C(),
                                                    _(
                                                      'td',
                                                      {
                                                        class: 'va-data-table__table-expanded-content',
                                                        colspan: '99999',
                                                        key: je(Ve, $e),
                                                      },
                                                      [V(ge.$slots, 'expandableRow', J(ie(Ve)))],
                                                    )),
                                                  ]))
                                                : E('', !0),
                                            ],
                                            64,
                                          )
                                        ),
                                      ),
                                      128,
                                    )),
                                  ]),
                                  _: 2,
                                },
                                1032,
                                ['name', 'css', 'appear'],
                              ),
                              V(ge.$slots, 'bodyAppend'),
                            ],
                            512,
                          ),
                          ['footer', 'footerPrepend', 'footerAppend'].some((Ve) => ge.$slots[Ve]) ||
                          (e.footerClone && !ge.$props.grid)
                            ? (C(),
                              _(
                                'tfoot',
                                {
                                  key: 1,
                                  class: pe([
                                    'va-data-table__table-tfoot',
                                    { 'va-data-table__table-tfoot--sticky': ge.$props.stickyFooter },
                                  ]),
                                  style: Y({ bottom: W.value && ge.$props.stickyFooter ? `${ct}px` : void 0 }),
                                },
                                [
                                  V(ge.$slots, 'footerPrepend'),
                                  V(ge.$slots, 'footer', {}, () => [
                                    e.hideDefaultHeader
                                      ? E('', !0)
                                      : (C(),
                                        U(
                                          s(Vn),
                                          H({ key: 0 }, ce.value, {
                                            'is-footer': '',
                                            onToggleBulkSelection: s(b),
                                            onToggleSorting: s(v),
                                          }),
                                          st({ _: 2 }, [
                                            Ie(ge.$slots, (Ve, $e) => ({
                                              name: $e,
                                              fn: z((_e) => [V(ge.$slots, $e, J(ie(_e)))]),
                                            })),
                                          ]),
                                          1040,
                                          ['onToggleBulkSelection', 'onToggleSorting'],
                                        )),
                                  ]),
                                  V(ge.$slots, 'footerAppend'),
                                ],
                                6,
                              ))
                            : E('', !0),
                        ],
                        16,
                      ),
                      s(ve)
                        ? (C(),
                          _(
                            'div',
                            { key: 1, ref_key: 'bottomTrigger', ref: F, class: 'va-data-table__scroll-trigger' },
                            null,
                            512,
                          ))
                        : E('', !0),
                    ]),
                    _: 2,
                  },
                  1032,
                  ['style', 'loading', 'color'],
                ),
              ],
            ),
            _: 3,
          },
          16,
          ['style'],
        )
      )
    },
  }),
  fg = Q(pg),
  lr = (e) => (e === null ? !1 : typeof e == 'object' && ('start' in e || 'end' in e)),
  mg = (e, t) => {
    const a = D(e.value),
      o = i({
        get: () => a.value,
        set: (l) => {
          if ((t.value && (e.value = l), !l)) {
            e.value = l
            return
          }
          ;(lr(l) ? l.end !== null && (e.value = l) : (e.value = l), (a.value = l))
        },
      })
    return (
      re(e, (l) => {
        a.value = l
      }),
      {
        valueComputed: o,
        reset: () => {
          a.value && lr(a.value) && (a.value = e.value)
        },
      }
    )
  },
  Ua = (e) => Object.prototype.toString.call(e) === '[object Date]',
  rr = (e) => new Date(Date.parse(e)),
  sr = (e) => Ua(e) && !isNaN(e.getTime()),
  gg = (e) => {
    const t = (r) => {
        const u = r.split(e.delimiter)
        return u.length < 2
          ? !1
          : u.every((d) => {
              const c = (e.parseDate || rr)(d)
              return sr(c)
            })
      },
      a = (r) => r.includes(e.rangeDelimiter),
      o = D(!0),
      n = (r) => {
        const u = r.split('.'),
          d = (u == null ? void 0 : u.length) === 3 ? u.reverse().join('-') : r,
          c = (e.parseDate || rr)(d)
        return ((o.value = sr(c)), c)
      }
    return {
      parseDateInputValue: (r) => {
        if (((o.value = !0), e.parse)) return e.parse(r, o)
        if (t(r)) return r.split(e.delimiter).map(n)
        if (a(r)) {
          const [u, d] = r.split(e.rangeDelimiter).map(n)
          return { start: u, end: d }
        }
        return n(r)
      },
      isValid: o,
    }
  },
  yg = (e) => {
    const t = Date.parse(e)
    return !isNaN(t) && !e.includes(' ')
  },
  bg = (e) => e.endsWith('GMT'),
  hg = (e) => {
    const t = new Date(e)
    return !isNaN(t.getTime())
  },
  Cg = (e, t) => (bg(t) ? e.toUTCString() : yg(t) ? e.toISOString() : hg(t) ? e.toString() : null),
  un = (e) => (e === null ? !1 : typeof e == 'object' && ('start' in e || 'end' in e)),
  cn = (e) => (e === null ? !1 : Array.isArray(e)),
  ir = (e) => (e === null ? !1 : typeof e == 'string' || typeof e == 'number' || e instanceof Date),
  Sg = (e, t, a, o, n) => {
    const l = (v, p) => {
        if (n) return n(p)
        if (typeof v == 'string') {
          const f = Cg(p, v)
          return f || o(p)
        }
        return typeof v == 'number' ? p.getTime() : p
      },
      r = (v) => (v instanceof Date ? v : new Date(v)),
      u = i(() =>
        e.value === null || e.value === void 0
          ? null
          : typeof e.value == 'string'
            ? a(e.value)
            : typeof e.value == 'number'
              ? new Date(e.value)
              : e.value,
      ),
      d = i({
        get: () => {
          if (u.value === null || u.value === void 0) return null
          if (cn(u.value)) return u.value.map(r)
          if (un(u.value)) {
            const { start: v, end: p } = u.value
            return { start: v ? r(v) : null, end: p ? r(p) : null }
          }
          return r(u.value)
        },
        set(v) {
          var p, f
          if (v == null) {
            e.value = v
            return
          }
          if (cn(v) && (cn(e.value) || Qo(e.value))) {
            const g = e.value
            e.value = v.map((y, m) => l((g == null ? void 0 : g[m]) || (g == null ? void 0 : g[0]), y))
            return
          }
          if (un(v) && (un(e.value) || Qo(e.value))) {
            const { start: g, end: y } = v
            e.value = {
              start: g ? l((p = e.value) == null ? void 0 : p.start, g) : null,
              end: y ? l((f = e.value) == null ? void 0 : f.start, y) : null,
            }
            return
          }
          if (ir(v) && (ir(e.value) || Qo(e.value))) {
            e.value = l(e.value, v)
            return
          }
          throw new Error('Input date is not the same as date from props')
        },
      })
    return {
      text: i({
        get: () => (d.value === null || d.value === void 0 ? '' : o(d.value)),
        set: (v) => {
          e.value = a(v)
        },
      }),
      normalized: d,
    }
  },
  $g = (e, t) => (e == null ? void 0 : e.toDateString()) === (t == null ? void 0 : t.toDateString()),
  _i = (e, t) => (e == null ? void 0 : e.getFullYear()) === (t == null ? void 0 : t.getFullYear()),
  kg = (e, t) => _i(e, t) && (e == null ? void 0 : e.getMonth()) === (t == null ? void 0 : t.getMonth()),
  wg = (e) => {
    const t = new Date()
    return (t.setFullYear(e), t)
  },
  Ba = (e) => (e === null ? !1 : typeof e == 'object' && ('start' in e || 'end' in e)),
  Uo = (e) => Ua(e),
  Wo = (e) => Array.isArray(e),
  Vi = 0,
  Bi = 11,
  _g = (e) => (e.month === Bi ? { ...e, year: e.year + 1, month: Vi } : { ...e, month: e.month + 1 }),
  Vg = (e) => (e.month === Vi ? { ...e, year: e.year - 1, month: Bi } : { ...e, month: e.month - 1 }),
  Bg = (e) =>
    Ua(e) ? e : Ua(e == null ? void 0 : e.start) ? e.start : Array.isArray(e) && Ua(e[0]) ? e[0] : new Date(),
  Ti = (e, t, a) => {
    const o = Bg(e.modelValue),
      n = { type: 'day', year: o.getFullYear(), month: o.getMonth(), ...a },
      l = D(n),
      r = i({
        get() {
          return { ...l.value, ...e.view }
        },
        set(c) {
          ;((l.value = c), t('update:view', c))
        },
      })
    return {
      syncView: r,
      next: () => {
        r.value.type === 'day'
          ? (r.value = _g(r.value))
          : r.value.type === 'month' && (r.value = { ...r.value, year: r.value.year + 1 })
      },
      prev: () => {
        r.value.type === 'day'
          ? (r.value = Vg(r.value))
          : r.value.type === 'month' && (r.value = { ...r.value, year: r.value.year - 1 })
      },
    }
  },
  Tg = ['onKeypress'],
  Qn = G({
    name: 'VaDatePickerCell',
    __name: 'VaDatePickerCell',
    props: {
      otherMonth: { type: Boolean, default: !1 },
      today: { type: Boolean, default: !1 },
      inRange: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      selected: { type: Boolean, default: !1 },
      weekend: { type: Boolean, default: !1 },
      hidden: { type: Boolean, default: !1 },
      focused: { type: Boolean, default: !1 },
      highlightWeekend: { type: Boolean, default: !1 },
      highlightToday: { type: Boolean, default: !1 },
      readonly: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
    },
    emits: ['click'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = () => {
          a.disabled || o('click')
        },
        { getColor: l } = Ce(),
        r = i(() => l(a.color)),
        { textColorComputed: u } = tt(r)
      return (d, c) =>
        e.hidden
          ? (C(),
            _(
              'div',
              {
                key: 0,
                class: 'va-date-picker-cell va-date-picker-cell_clear',
                style: Y(`--va-bg: ${String(r.value)};--va-text-color-computed: ${String(s(u))}`),
              },
              null,
              4,
            ))
          : (C(),
            _(
              'div',
              {
                key: 1,
                class: pe([
                  'va-date-picker-cell',
                  {
                    'va-date-picker-cell_other-month': e.otherMonth,
                    'va-date-picker-cell_today': e.highlightToday && e.today,
                    'va-date-picker-cell_in-range': e.inRange,
                    'va-date-picker-cell_disabled': e.disabled,
                    'va-date-picker-cell_highlighted-weekend': e.highlightWeekend && e.weekend,
                    'va-date-picker-cell_selected': e.selected,
                    'va-date-picker-cell_focused': e.focused,
                    'va-date-picker-cell_readonly': e.readonly,
                  },
                ]),
                onClick: n,
                onKeypress: se(ne(n, ['prevent', 'stop']), ['space', 'enter']),
                style: Y(`--va-bg: ${String(r.value)};--va-text-color-computed: ${String(s(u))}`),
              },
              [V(d.$slots, 'default')],
              46,
              Tg,
            ))
    },
  })
function ur(e) {
  return e === void 0
}
const el = ({ rowSize: e, start: t, end: a, onSelected: o, onFocusIndex: n }) => {
    const l = D(-1)
    let r = !1
    return {
      focusedCellIndex: l,
      containerAttributes: {
        onFocus: () => {
          if (r) return
          r = !1
          const f = n === void 0 ? s(t) || 0 : s(n)
          l.value = f
        },
        onKeydown: (f) => {
          if (
            (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter', 'Space'].includes(f.key) &&
              (f.preventDefault(), f.stopPropagation()),
            f.key === 'Enter' || f.key === 'Space')
          ) {
            if (o === void 0) return
            o(l.value)
            return
          }
          ;(f.key === 'ArrowRight' && (l.value += 1),
            f.key === 'ArrowLeft' && (l.value -= 1),
            f.key === 'ArrowDown' && (l.value += e),
            f.key === 'ArrowUp' && (l.value -= e),
            !ur(t) && l.value < s(t) && (l.value = s(t)),
            !ur(a) && l.value > s(a) - 1 && (l.value = s(a) - 1))
        },
        onBlur: () => {
          ;((r = !1), (l.value = -1))
        },
        onMousedown: () => {
          r = !0
        },
        tabindex: 0,
      },
    }
  },
  Ig = (e, t) => {
    if (t === 'single') return e
    if (t === 'range') return { start: e, end: null }
    if (t === 'multiple') return [e]
    if (t === 'auto') return e
    throw new Error('Unknown mode')
  },
  Co = (e, t) => {
    throw Error(`Incorrect modelValue for mode ${t}. Got ${JSON.stringify(e)}`)
  },
  Pg = (e) => (Uo(e) ? 'single' : Ba(e) ? 'range' : Wo(e) ? 'multiple' : Co(e, 'auto')),
  cr = (e) => (e.start && e.end && e.start > e.end ? { start: e.end, end: e.start } : e),
  Ag = (e, t, a) => ({
    updateModelValue: (n) => {
      if (!e.modelValue) {
        t('update:modelValue', Ig(n, e.mode))
        return
      }
      const l = e.mode === 'auto' ? Pg(e.modelValue) : e.mode
      if (l === 'single') {
        if (!Uo(e.modelValue)) return Co(e.modelValue, l)
        t('update:modelValue', n)
      } else if (l === 'range') {
        if (!Ba(e.modelValue)) return Co(e.modelValue, l)
        if (e.modelValue.end && a(e.modelValue.end, n))
          return t('update:modelValue', { start: e.modelValue.start, end: null })
        if (e.modelValue.start && a(e.modelValue.start, n))
          return t('update:modelValue', { start: null, end: e.modelValue.end })
        if (e.modelValue.end === null) return t('update:modelValue', cr({ start: e.modelValue.start, end: n }))
        if (e.modelValue.start === null) return t('update:modelValue', cr({ end: e.modelValue.end, start: n }))
        t('update:modelValue', { start: n, end: null })
      } else if (l === 'multiple') {
        if (!Wo(e.modelValue)) return Co(e.modelValue, l)
        !!e.modelValue.find((u) => a(u, n))
          ? t(
              'update:modelValue',
              e.modelValue.filter((u) => !a(u, n)),
            )
          : t(
              'update:modelValue',
              [...e.modelValue, n].sort((u, d) => u.getTime() - d.getTime()),
            )
      }
    },
  }),
  Lg = (e) => ({ month: kg, day: $g, year: _i })[e],
  tl = (e, t, a, o) => {
    const n = Lg(e),
      l = a.allowedDays || a.allowedMonths || a.allowedYears,
      r = (y) => (l === void 0 ? !1 : !l(y)),
      u = D(-1),
      d = i(() => t.value[u.value]),
      { updateModelValue: c } = Ag(a, o, n),
      v = (y) => {
        a.readonly || r(y) || (c(y), o(`click:${e}`, y))
      },
      p = (y) => n(new Date(), y),
      f = (y) =>
        a.modelValue
          ? Uo(a.modelValue)
            ? n(a.modelValue, y)
            : Wo(a.modelValue)
              ? !!a.modelValue.find((m) => n(m, y))
              : Ba(a.modelValue)
                ? n(a.modelValue.start, y) || n(a.modelValue.end, y)
                : !1
          : !1,
      g = (y) => {
        if (!a.modelValue || !Ba(a.modelValue)) return !1
        if (a.modelValue.start && a.modelValue.end) return a.modelValue.start < y && a.modelValue.end > y
        const m = a.modelValue.start || a.modelValue.end
        return m && d.value ? (m < y ? d.value >= y : d.value <= y) : !1
      }
    return (
      re(d, (y) => {
        o(`hover:${e}`, y)
      }),
      { hoveredIndex: u, hoveredValue: d, onClick: v, isToday: p, isSelected: f, isInRange: g }
    )
  },
  dn = (e, t) => new Date(e, t + 1, 0).getDate(),
  Og = (e, t) => new Date(e, t, 1).getDay(),
  vn = (e) => Array.from(Array(e).keys()).map((t) => t + 1),
  xg = (e, t) => {
    const o = (v) => {
        var p
        return !t || !((p = t.firstWeekday) != null && p.value)
          ? v
          : t.firstWeekday.value.toLowerCase() === 'monday'
            ? v === 0
              ? 6
              : v - 1
            : v
      },
      n = i(() => o(Og(e.value.year, e.value.month))),
      l = () => {
        if (n.value === 0) return []
        const v = dn(e.value.year, e.value.month - 1)
        return vn(v)
          .slice(-n.value)
          .map((f) => new Date(e.value.year, e.value.month - 1, f))
      },
      r = () => vn(dn(e.value.year, e.value.month)).map((p) => new Date(e.value.year, e.value.month, p)),
      u = i(() => [...l(), ...r()]),
      d = i(() => u.value.length)
    return {
      calendarDates: i(() => {
        const v = u.value,
          p = 7 * 6 - v.length,
          f = dn(e.value.year, e.value.month + 1),
          g = vn(f)
        return [...v, ...g.slice(0, p).map((y) => new Date(e.value.year, e.value.month + 1, y))]
      }),
      currentMonthStartIndex: n,
      currentMonthEndIndex: d,
    }
  },
  Eg = ['onMouseenter'],
  Dg = { class: 'va-date-picker-cell__day' },
  co = G({
    name: 'VaDayPicker',
    __name: 'VaDayPicker',
    props: {
      monthNames: { type: Array, required: !0 },
      weekdayNames: { type: Array, required: !0 },
      firstWeekday: { type: String, default: 'Sunday' },
      hideWeekDays: { type: Boolean, default: !1 },
      view: { type: Object, default: () => ({ type: 'day' }) },
      modelValue: { type: [Date, Array, Object] },
      mode: { type: String, default: 'auto' },
      showOtherMonths: { type: Boolean, default: !1 },
      allowedDays: { type: Function },
      weekends: { type: Function },
      highlightWeekend: { type: Boolean, default: !1 },
      highlightToday: { type: Boolean, default: !1 },
      readonly: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
    },
    emits: ['update:modelValue', 'hover:day', 'click:day'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { firstWeekday: n, weekdayNames: l, view: r } = Tt(a),
        { calendarDates: u, currentMonthStartIndex: d, currentMonthEndIndex: c } = xg(r, { firstWeekday: n }),
        v = i(() => (n.value.toLowerCase() === 'sunday' ? l.value : [...l.value.slice(1), l.value[0]])),
        { hoveredIndex: p, onClick: f, isToday: g, isSelected: y, isInRange: m } = tl('day', u, a, o),
        b = i(() => (a.showOtherMonths ? 0 : d.value)),
        h = i(() => (a.showOtherMonths ? u.value.length : c.value)),
        { focusedCellIndex: $, containerAttributes: S } = el({
          rowSize: 7,
          start: b,
          end: h,
          onSelected: (k) => f(u.value[k]),
        })
      ;(re($, (k) => {
        p.value = k
      }),
        re(p, (k) => {
          $.value = k
        }))
      const w = (k) => a.view.month !== k.getMonth(),
        I = (k) => (a.allowedDays === void 0 ? !1 : !a.allowedDays(k)),
        A = (k) => (a.weekends === void 0 ? k.getDay() === 6 || k.getDay() === 0 : a.weekends(k))
      return (k, T) => (
        C(),
        _(
          'div',
          H({ class: 'va-day-picker' }, s(S)),
          [
            e.hideWeekDays
              ? E('', !0)
              : (C(!0),
                _(
                  be,
                  { key: 0 },
                  Ie(
                    v.value,
                    (O) => (
                      C(),
                      _('div', { key: O, class: 'va-day-picker__weekday' }, [
                        V(k.$slots, 'weekday', {}, () => [Te(fe(O), 1)]),
                      ])
                    ),
                  ),
                  128,
                )),
            (C(!0),
            _(
              be,
              null,
              Ie(
                s(u),
                (O, M) => (
                  C(),
                  _(
                    'div',
                    {
                      class: 'va-day-picker__calendar__day-wrapper',
                      key: M,
                      onMouseenter: (ae) => (p.value = M),
                      onMouseleave: T[0] || (T[0] = (ae) => (p.value = -1)),
                    },
                    [
                      ue(
                        Qn,
                        {
                          hidden: w(O) && !e.showOtherMonths,
                          today: s(g)(O),
                          selected: s(y)(O),
                          'in-range': s(m)(O),
                          'other-month': w(O),
                          weekend: A(O),
                          disabled: I(O),
                          focused: s(p) === M,
                          'highlight-today': e.highlightToday,
                          'highlight-weekend': e.highlightWeekend,
                          readonly: k.$props.readonly,
                          color: e.color,
                          onClick: (ae) => {
                            ;(s(f)(O), ($.value = M))
                          },
                        },
                        {
                          default: z(() => [
                            R('span', Dg, [V(k.$slots, 'day', J(ie({ date: O })), () => [Te(fe(O.getDate()), 1)])]),
                          ]),
                          _: 2,
                        },
                        1032,
                        [
                          'hidden',
                          'today',
                          'selected',
                          'in-range',
                          'other-month',
                          'weekend',
                          'disabled',
                          'focused',
                          'highlight-today',
                          'highlight-weekend',
                          'readonly',
                          'color',
                          'onClick',
                        ],
                      ),
                    ],
                    40,
                    Eg,
                  )
                ),
              ),
              128,
            )),
          ],
          16,
        )
      )
    },
  }),
  Fg = { key: 0, class: 'va-date-picker-header va-date-picker__header' },
  Mg = { class: 'va-date-picker__header__text' },
  Ng = { class: 'va-date-picker__header__month' },
  vo = G({
    name: 'VaDatePickerHeader',
    __name: 'VaDatePickerHeader',
    props: {
      monthNames: { type: Array, required: !0 },
      view: { type: Object },
      color: { type: String },
      disabled: { type: Boolean, default: !1 },
      ariaNextPeriodLabel: ye('$t:nextPeriod'),
      ariaPreviousPeriodLabel: ye('$t:previousPeriod'),
      ariaSwitchViewLabel: ye('$t:switchView'),
    },
    emits: ['update:view'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { syncView: n, prev: l, next: r } = Ti(a, o),
        u = () => {
          n.value.type === 'day'
            ? (n.value = { ...n.value, type: 'month' })
            : n.value.type === 'month' && (n.value = { ...n.value, type: 'year' })
        },
        d = (p) => {
          n.value = p
        },
        c = Gs(ws(Hn())),
        { tp: v } = He()
      return (p, f) =>
        s(n).type !== 'year'
          ? (C(),
            _('div', Fg, [
              V(p.$slots, 'buttonPrev', J(ie({ onClick: s(l) })), () => [
                ue(
                  s(xe),
                  {
                    'va-child': 'prevButton',
                    disabled: p.$props.disabled,
                    icon: 'va-arrow-left',
                    preset: 'plain',
                    size: 'small',
                    color: e.color,
                    textColor: s(c),
                    'aria-label': s(v)(p.$props.ariaPreviousPeriodLabel),
                    round: '',
                    onClick: s(l),
                  },
                  null,
                  8,
                  ['disabled', 'color', 'textColor', 'aria-label', 'onClick'],
                ),
              ]),
              R('div', Mg, [
                V(
                  p.$slots,
                  'header',
                  J(
                    ie({
                      year: s(n).year,
                      month: s(n).month,
                      monthNames: e.monthNames,
                      view: s(n),
                      changeView: d,
                      switchView: u,
                    }),
                  ),
                  () => [
                    ue(
                      s(xe),
                      {
                        'va-child': 'middleButton',
                        disabled: p.$props.disabled,
                        preset: 'plain',
                        size: 'small',
                        color: e.color,
                        textColor: s(c),
                        'aria-label': s(v)(p.$props.ariaSwitchViewLabel),
                        onClick: u,
                      },
                      {
                        default: z(() => [
                          V(p.$slots, 'year', J(ie({ year: s(n).year })), () => [Te(fe(s(n).year), 1)]),
                          s(n).type === 'day'
                            ? V(p.$slots, 'month', J(H({ key: 0 }, { month: s(n).month })), () => [
                                R('span', Ng, fe(e.monthNames[s(n).month]), 1),
                              ])
                            : E('', !0),
                        ]),
                        _: 3,
                      },
                      8,
                      ['disabled', 'color', 'textColor', 'aria-label'],
                    ),
                  ],
                ),
              ]),
              V(p.$slots, 'buttonNext', J(ie({ onClick: s(r) })), () => [
                ue(
                  s(xe),
                  {
                    'va-child': 'nextButton',
                    disabled: p.$props.disabled,
                    icon: 'va-arrow-right',
                    preset: 'plain',
                    size: 'small',
                    color: e.color,
                    textColor: s(c),
                    'aria-label': s(v)(p.$props.ariaNextPeriodLabel),
                    onClick: s(r),
                    round: '',
                  },
                  null,
                  8,
                  ['disabled', 'color', 'textColor', 'aria-label', 'onClick'],
                ),
              ]),
            ]))
          : E('', !0)
    },
  }),
  Rg = ['onMouseenter'],
  po = G({
    name: 'VaMonthPicker',
    __name: 'VaMonthPicker',
    props: {
      modelValue: { type: [Date, Array, Object] },
      monthNames: { type: Array, required: !0 },
      view: { type: Object, default: () => ({ type: 'month' }) },
      allowedMonths: { type: Function, default: void 0 },
      highlightToday: { type: Boolean, default: !0 },
      mode: { type: String, default: 'auto' },
      readonly: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
    },
    emits: ['update:modelValue', 'hover:month', 'click:month'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { view: n } = Tt(a),
        l = i(() => Array.from(Array(12).keys()).map((y) => new Date(n.value.year, y))),
        { hoveredIndex: r, onClick: u, isToday: d, isSelected: c, isInRange: v } = tl('month', l, a, o),
        p = (y) => (a.allowedMonths === void 0 ? !1 : !a.allowedMonths(y)),
        { focusedCellIndex: f, containerAttributes: g } = el({
          rowSize: 3,
          start: 0,
          end: l.value.length,
          onSelected: (y) => u(l.value[y]),
        })
      return (
        re(f, (y) => {
          r.value = y
        }),
        re(r, (y) => {
          f.value = y
        }),
        (y, m) => (
          C(),
          _(
            'div',
            H({ class: 'va-month-picker' }, s(g)),
            [
              (C(!0),
              _(
                be,
                null,
                Ie(
                  l.value,
                  (b, h) => (
                    C(),
                    _(
                      'div',
                      {
                        key: h,
                        class: 'va-month-picker__month-wrapper',
                        onMouseenter: ($) => (r.value = h),
                        onMouseleave: m[0] || (m[0] = ($) => (r.value = -1)),
                      },
                      [
                        ue(
                          Qn,
                          {
                            'in-range': !!s(v)(b),
                            selected: !!s(c)(b),
                            disabled: !!p(b),
                            today: !!s(d)(b),
                            focused: s(r) === h,
                            'highlight-today': e.highlightToday,
                            readonly: y.$props.readonly,
                            color: e.color,
                            onClick: ($) => {
                              ;(s(u)(b), (f.value = h))
                            },
                          },
                          {
                            default: z(() => [
                              V(y.$slots, 'month', J(ie({ monthIndex: h, month: e.monthNames[h] })), () => [
                                Te(fe(e.monthNames[h]), 1),
                              ]),
                            ]),
                            _: 2,
                          },
                          1032,
                          [
                            'in-range',
                            'selected',
                            'disabled',
                            'today',
                            'focused',
                            'highlight-today',
                            'readonly',
                            'color',
                            'onClick',
                          ],
                        ),
                      ],
                      40,
                      Rg,
                    )
                  ),
                ),
                128,
              )),
            ],
            16,
          )
        )
      )
    },
  }),
  fo = G({
    name: 'VaYearPicker',
    __name: 'VaYearPicker',
    props: {
      modelValue: { type: [Date, Array, Object] },
      allowedYears: { type: Function, default: void 0 },
      highlightToday: { type: Boolean, default: !0 },
      startYear: { type: [Number, String], default: 1970 },
      mode: { type: String, default: 'auto' },
      view: { type: Object, default: () => ({ type: 'year' }) },
      endYear: { type: [Number, String], default: () => new Date().getFullYear() + 50 },
      readonly: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
    },
    emits: ['update:modelValue', 'hover:year', 'click:year'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        { view: l } = Tt(a),
        r = (w, I) => {
          const A = I - w + 1
          return Array.from(Array(A).keys()).map((k) => wg(w + k))
        },
        u = Pe('startYear'),
        d = Pe('endYear'),
        c = i(() => r(u.value, d.value)),
        v = (w) => {
          if (!n.value) return
          const I = n.value.scrollHeight,
            A = n.value.offsetHeight,
            k = (I / c.value.length) * w,
            T = I / c.value.length,
            O = k - n.value.scrollTop
          O < 0 ? n.value.scrollTo({ top: k }) : O > A && n.value.scrollTo({ top: k - A + T })
        },
        p = (w) => {
          if (!n.value) return
          const I = n.value.scrollHeight,
            A = n.value.offsetHeight,
            k = (I / c.value.length) * w
          n.value.scrollTo({ top: k - A / 2 })
        }
      Me(() => {
        const w = c.value.findIndex((I) => I.getFullYear() === l.value.year)
        p(w)
      })
      const { hoveredIndex: f, onClick: g, isToday: y, isSelected: m, isInRange: b } = tl('year', c, a, o),
        h = (w) => (a.allowedYears === void 0 ? !1 : !a.allowedYears(w)),
        { focusedCellIndex: $, containerAttributes: S } = el({
          rowSize: 1,
          start: 0,
          end: c.value.length,
          onFocusIndex: i(() => c.value.findIndex((w) => w.getFullYear() === l.value.year)),
          onSelected: (w) => g(c.value[w]),
        })
      return (
        re($, (w) => w !== -1 && v(w)),
        re($, (w) => {
          f.value = w
        }),
        re(f, (w) => {
          $.value = w
        }),
        (w, I) => (
          C(),
          _(
            'div',
            H({ ref_key: 'rootNode', ref: n, class: 'va-year-picker' }, s(S), {
              onKeydown:
                I[1] ||
                (I[1] = se(
                  ne(() => {}, ['prevent']),
                  ['space'],
                )),
            }),
            [
              (C(!0),
              _(
                be,
                null,
                Ie(
                  c.value,
                  (A, k) => (
                    C(),
                    U(
                      Qn,
                      {
                        key: A.toString(),
                        'in-range': s(b)(A),
                        selected: s(m)(A),
                        disabled: h(A),
                        today: s(y)(A),
                        focused: s($) === k,
                        'highlight-today': e.highlightToday,
                        readonly: w.$props.readonly,
                        color: e.color,
                        onClick: (T) => {
                          ;(s(g)(A), ($.value = k))
                        },
                        onMouseenter: (T) => (f.value = k),
                        onMouseleave: I[0] || (I[0] = (T) => (f.value = -1)),
                      },
                      { default: z(() => [Te(fe(A.getFullYear()), 1)]), _: 2 },
                      1032,
                      [
                        'in-range',
                        'selected',
                        'disabled',
                        'today',
                        'focused',
                        'highlight-today',
                        'readonly',
                        'color',
                        'onClick',
                        'onMouseenter',
                      ],
                    )
                  ),
                ),
                128,
              )),
            ],
            16,
          )
        )
      )
    },
  }),
  zg = { class: 'va-date-picker__picker-wrapper' },
  Hg = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  jg = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
  Io = G({
    name: 'VaDatePicker',
    __name: 'VaDatePicker',
    props: {
      ...Wr({ prevButton: xe, nextButton: xe, middleButton: xe }),
      ...Qe,
      ...me,
      ...Ee(vo),
      ...Ee(co),
      ...Ee(po),
      ...Ee(fo),
      modelValue: { type: [Date, Array, Object] },
      monthNames: { type: Array, default: Hg },
      weekdayNames: { type: Array, default: jg },
      view: { type: Object },
      type: { type: String, default: 'day' },
      readonly: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      color: { type: String, default: void 0 },
      weekendsColor: { type: String, default: void 0 },
    },
    emits: [...lt, ...ra(vo), ...ra(fo), ...ra(co), ...ra(po)],
    setup(e, { expose: t, emit: a }) {
      const o = e
      Kr(o)
      const n = a,
        l = D(),
        { valueComputed: r } = Ke(o, n),
        { syncView: u } = Ti(o, n, { type: o.type }),
        d = i(() => ({ 'va-date-picker_without-week-days': o.hideWeekDays, 'va-date-picker_disabled': o.disabled })),
        c = (A) => {
          o.readonly || (o.type === 'day' && (r.value = A))
        },
        v = (A) => {
          n('click:month', A)
          const k = A.getFullYear(),
            T = A.getMonth()
          o.type !== 'month' && (u.value = { type: 'day', year: k, month: T })
        },
        p = (A) => {
          o.type === 'month' && (r.value = A)
        },
        f = (A) => {
          n('click:year', A)
          const k = A.getFullYear()
          o.type !== 'year' && (u.value = { type: 'month', year: k, month: u.value.month })
        },
        g = (A) => {
          o.type === 'year' && (r.value = A)
        },
        { colorsToCSSVariable: y } = Ce(),
        m = i(() => ({ ...y({ color: o.color, 'weekends-color': o.weekendsColor }, 'va-date-picker') })),
        b = () => {
          var A
          return (A = l.value) == null ? void 0 : A.$el.focus()
        }
      re(u, (A, k) => {
        A.type !== k.type && Ye(b)
      })
      const h = (A) => o.readonly && o.type === A,
        $ = ze(Ee(co)),
        S = ze(Ee(vo)),
        w = ze(Ee(po)),
        I = ze(Ee(fo))
      return (
        t({ focus: b, focusCurrentPicker: b }),
        (A, k) => (
          C(),
          _(
            'div',
            { class: pe(['va-date-picker', d.value]), style: Y(m.value) },
            [
              ue(
                vo,
                H(s(S), { view: s(u), 'onUpdate:view': k[0] || (k[0] = (T) => (mt(u) ? (u.value = T) : null)) }),
                st({ _: 2 }, [Ie(A.$slots, (T, O) => ({ name: O, fn: z((M) => [V(A.$slots, O, J(ie(M)))]) }))]),
                1040,
                ['view'],
              ),
              R('div', zg, [
                s(u).type === 'day'
                  ? (C(),
                    U(
                      co,
                      H({ key: 0, ref_key: 'currentPicker', ref: l }, s($), {
                        'model-value': s(r),
                        view: s(u),
                        readonly: A.$props.disabled || h('day'),
                        'onUpdate:modelValue': c,
                        'onHover:day': k[1] || (k[1] = (T) => A.$emit('hover:day', T)),
                        'onClick:day': k[2] || (k[2] = (T) => A.$emit('click:day', T)),
                      }),
                      st({ _: 2 }, [Ie(A.$slots, (T, O) => ({ name: O, fn: z((M) => [V(A.$slots, O, J(ie(M)))]) }))]),
                      1040,
                      ['model-value', 'view', 'readonly'],
                    ))
                  : E('', !0),
                s(u).type === 'month'
                  ? (C(),
                    U(
                      po,
                      H({ key: 1, ref_key: 'currentPicker', ref: l }, s(w), {
                        view: s(u),
                        'model-value': s(r),
                        readonly: A.$props.disabled || h('month'),
                        'onUpdate:modelValue': p,
                        'onHover:month': k[3] || (k[3] = (T) => A.$emit('hover:month', T)),
                        'onClick:month': v,
                      }),
                      st({ _: 2 }, [Ie(A.$slots, (T, O) => ({ name: O, fn: z((M) => [V(A.$slots, O, J(ie(M)))]) }))]),
                      1040,
                      ['view', 'model-value', 'readonly'],
                    ))
                  : E('', !0),
                s(u).type === 'year'
                  ? (C(),
                    U(
                      fo,
                      H({ key: 2, ref_key: 'currentPicker', ref: l }, s(I), {
                        view: s(u),
                        'model-value': s(r),
                        readonly: A.$props.disabled || h('year'),
                        'onHover:year': k[4] || (k[4] = (T) => A.$emit('hover:year', T)),
                        'onUpdate:modelValue': g,
                        'onClick:year': f,
                      }),
                      st({ _: 2 }, [Ie(A.$slots, (T, O) => ({ name: O, fn: z((M) => [V(A.$slots, O, J(ie(M)))]) }))]),
                      1040,
                      ['view', 'model-value', 'readonly'],
                    ))
                  : E('', !0),
              ]),
            ],
            6,
          )
        )
      )
    },
  }),
  Ii = Ee(Ct, ['innerAnchorSelector', 'stateful', 'keyboardNavigation', 'modelValue']),
  Vt = {
    ...Ii,
    modelValue: {},
    closeOnChange: { type: Boolean, default: null },
    isOpen: { type: Boolean, default: void 0 },
  },
  al = ['update:isOpen'],
  ol = function (e, t, a = {}) {
    const [o] = ua('isOpen', e, t, !1),
      n = i(() => (e.closeOnChange !== null ? e.closeOnChange : s(a.defaultCloseOnValueUpdate || !1)))
    return (
      re(
        () => e.modelValue,
        () => {
          n.value && (o.value = !1)
        },
      ),
      { dropdownProps: ze(Ii), isOpenSync: o }
    )
  },
  dr = Ee(gt, ['focused', 'maxLength', 'counterValue']),
  vr = Ee(Io),
  Ug = G({
    name: 'VaDateInput',
    __name: 'VaDateInput',
    props: {
      ...Vt,
      ...no,
      ...dr,
      ...vr,
      ...zt,
      ...me,
      clearValue: { type: void 0, default: void 0 },
      modelValue: { type: [Date, Array, Object, String, Number] },
      resetOnClose: { type: Boolean, default: !0 },
      closeOnContentClick: { type: Boolean, default: !1 },
      offset: { ...Vt.offset, default: () => [2, 0] },
      format: { type: Function },
      formatDate: { type: Function, default: (e) => e.toLocaleDateString() },
      formatValue: { type: Function },
      parse: { type: Function },
      parseDate: { type: Function },
      delimiter: { type: String, default: ', ' },
      rangeDelimiter: { type: String, default: ' ~ ' },
      manualInput: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
      leftIcon: { type: Boolean, default: !1 },
      icon: { type: String, default: 'va-calendar' },
      ariaToggleDropdownLabel: ye('$t:toggleDropdown'),
      ariaResetLabel: ye('$t:resetDate'),
      ariaSelectedDateLabel: ye('$t:selectedDate'),
    },
    emits: [...Fo, ...ra(Io), ...zo, ...Xt, ...lt, ...al, 'update:text'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        r = D(),
        { resetOnClose: u } = Tt(o),
        { trapFocusIn: d, freeFocus: c } = Ms(),
        v = () => {
          const Z = Xe(r.value)
          if (!Z) {
            c()
            return
          }
          d(Z)
        }
      re([r], () => {
        v()
      })
      const { valueComputed: p } = Ke(o, n),
        { isOpenSync: f, dropdownProps: g } = ol(o, n, {
          defaultCloseOnValueUpdate: i(() => !(Array.isArray(m.value) || (Ba(m.value) && m.value.end === null))),
        }),
        y = i(() => !u.value),
        { valueComputed: m, reset: b } = mg(p, y)
      re(f, (Z) => {
        !Z && !y.value && b()
      })
      const { isFocused: h, focus: $, blur: S, onFocus: w, onBlur: I } = jt(l),
        A = Xn(r),
        k = (Z) => (Z ? o.formatDate(Z) : '...'),
        { parseDateInputValue: T, isValid: O } = gg(o)
      re(m, () => {
        O.value = !0
      })
      const M = (Z) =>
          o.format
            ? o.format(m.value)
            : Wo(Z)
              ? Z.map((he) => o.formatDate(he)).join(o.delimiter)
              : Uo(Z)
                ? o.formatDate(Z)
                : Ba(Z)
                  ? k(Z.start) + o.rangeDelimiter + k(Z.end)
                  : (Z == null, ''),
        { text: ae, normalized: oe } = Sg(m, ut(o, 'mode'), T, M, o.formatValue),
        B = i(() => (O.value ? (m.value ? ae.value : o.clearValue ? M(o.clearValue) : '') : '')),
        K = ({ target: Z }) => {
          if (o.disabled) return
          const he = Z.value
          O.value && (m.value = he === '' ? o.clearValue : T(he))
        },
        L = () =>
          Se(() => {
            ;((p.value = o.clearValue), n('clear'), ge())
          }),
        x = () => {
          ;((f.value = !1), $())
        },
        N = () => {
          Ye(() => {
            var Z
            return (Z = r.value) == null ? void 0 : Z.focusCurrentPicker()
          })
        },
        P = () => {
          f.value ? N() : $()
        },
        te = (Z) =>
          f.value
            ? !1
            : o.disabled || o.readonly
              ? !0
              : Z === void 0
                ? !1
                : o.manualInput && (Z == null ? void 0 : Z.code) !== 'Space',
        X = (Z) => {
          te(Z instanceof KeyboardEvent ? Z : void 0) || ((f.value = !f.value), Ye(P))
        },
        ce = () => {
          o.disabled || o.readonly || ((f.value = !0), Ye(N))
        },
        {
          isDirty: ke,
          isTouched: de,
          computedError: F,
          computedErrorMessages: le,
          listeners: ve,
          validationAriaAttributes: W,
          validate: j,
          withoutValidation: Se,
          resetValidation: ge,
        } = Ht(o, n, { reset: L, focus: $, value: m })
      re(f, (Z) => {
        Z || (de.value = !0)
      })
      const Ae = i(() => (!O.value && m.value !== o.clearValue) || F.value),
        je = dt(),
        ot = i(() => {
          const Z = [o.leftIcon && 'prependInner', (!o.leftIcon || o.clearable) && 'icon']
          return Object.keys(je).filter((he) => !Z.includes(he))
        }),
        { canBeCleared: ct, clearIconProps: it, onFocus: Le, onBlur: Ve } = Ho(o, m),
        $e = i(() => (o.disabled ? {} : o.manualInput ? { cursor: 'text' } : { cursor: 'pointer' })),
        _e = i(() => (o.manualInput ? (o.disabled || o.readonly ? -1 : 0) : -1)),
        at = i(() => ({
          role: _e.value === 0 ? 'button' : 'none',
          ariaHidden: _e.value === -1,
          name: o.icon,
          color: 'secondary',
          tabindex: _e.value,
        })),
        vt = ze(dr),
        yt = i(() => ({
          ...vt.value,
          focused: h.value || A.value,
          error: Ae.value,
          errorMessages: le.value,
          readonly: o.readonly || !o.manualInput,
        })),
        Sa = i(() => ({
          focus: () => {
            o.disabled || (w(), !o.readonly && Le())
          },
          blur: () => {
            o.disabled || (I(), !o.readonly && (Ve(), ve.onBlur()))
          },
        })),
        { tp: Ut } = He(),
        Fa = Yt(),
        Qt = i(() => ({
          readonly: o.readonly || !o.manualInput,
          disabled: o.disabled,
          tabindex: o.disabled ? -1 : 0,
          placeholder: o.placeholder,
          value: B.value,
          ariaLabel: o.label || Ut(o.ariaSelectedDateLabel),
          ariaRequired: o.requiredMark,
          ariaDisabled: o.disabled,
          ariaReadOnly: o.readonly,
          ...W.value,
          ...At(Fa, ['class', 'style']),
        })),
        Ma = i(() => ({
          ...g.value,
          stateful: !1,
          innerAnchorSelector: '.va-input-wrapper__field',
          trigger: ['click', 'right-click', 'enter', 'space'],
        })),
        ea = yt,
        $a = Sa,
        q = ze(vr)
      return (
        t({
          valueText: B,
          valueWithoutText: oe,
          valueDate: oe,
          focus: $,
          blur: S,
          reset: L,
          validate: j,
          showDropdown: ce,
          hideAndFocus: x,
          toggleDropdown: X,
          focusDatePicker: N,
          isDirty: ke,
          isTouched: de,
        }),
        (Z, he) => (
          C(),
          U(
            s(Ct),
            H(
              {
                modelValue: s(f),
                'onUpdate:modelValue': he[9] || (he[9] = (Be) => (mt(f) ? (f.value = Be) : null)),
                class: ['va-date-input', Z.$attrs.class],
                style: Z.$attrs.style,
              },
              Ma.value,
              { onOpen: N, role: 'none' },
            ),
            {
              anchor: z(() => [
                V(
                  Z.$slots,
                  'input',
                  J(
                    ie({
                      valueText: B.value,
                      inputAttributes: Qt.value,
                      inputWrapperProps: s(ea),
                      inputListeners: s($a),
                    }),
                  ),
                  () => [
                    ue(
                      s(gt),
                      H({ class: 'va-date-input__anchor', style: $e.value }, s(ea), wt(s($a)), {
                        'model-value': B.value,
                        onChange: K,
                      }),
                      st(
                        {
                          icon: z(() => [
                            s(ct)
                              ? (C(),
                                U(
                                  s(Oe),
                                  H(
                                    { key: 0, 'aria-label': s(Ut)(Z.$props.ariaResetLabel) },
                                    { ...at.value, ...s(it) },
                                    {
                                      onClick: ne(L, ['stop']),
                                      onKeydown: [se(ne(L, ['stop']), ['enter']), se(ne(L, ['stop']), ['space'])],
                                    },
                                  ),
                                  null,
                                  16,
                                  ['aria-label', 'onKeydown'],
                                ))
                              : E('', !0),
                            !Z.$props.leftIcon && Z.$props.icon
                              ? (C(),
                                U(
                                  s(Oe),
                                  H({ key: 1, 'aria-label': s(Ut)(Z.$props.ariaToggleDropdownLabel) }, at.value),
                                  null,
                                  16,
                                  ['aria-label'],
                                ))
                              : E('', !0),
                          ]),
                          _: 2,
                        },
                        [
                          Ie(ot.value, (Be) => ({ name: Be, fn: z((Je) => [V(Z.$slots, Be, J(ie(Je)))]) })),
                          Z.$slots.prependInner || Z.$props.leftIcon
                            ? {
                                name: 'prependInner',
                                fn: z((Be) => [
                                  V(Z.$slots, 'prependInner', J(ie(Be))),
                                  Z.$props.leftIcon
                                    ? (C(),
                                      U(
                                        s(Oe),
                                        H({ key: 0, 'aria-label': s(Ut)(Z.$props.ariaToggleDropdownLabel) }, at.value),
                                        null,
                                        16,
                                        ['aria-label'],
                                      ))
                                    : E('', !0),
                                ]),
                                key: '0',
                              }
                            : void 0,
                        ],
                      ),
                      1040,
                      ['style', 'model-value'],
                    ),
                  ],
                ),
              ]),
              default: z(() => [
                ue(
                  s(va),
                  {
                    class: 'va-date-input__dropdown-content',
                    onKeydown: he[8] || (he[8] = se((Be) => s($)(), ['esc'])),
                    role: 'dialog',
                  },
                  {
                    default: z(() => [
                      ue(
                        Io,
                        H({ ref_key: 'datePicker', ref: r }, s(q), {
                          modelValue: s(oe),
                          'onUpdate:modelValue': he[0] || (he[0] = (Be) => (mt(oe) ? (oe.value = Be) : null)),
                          'onClick:day': he[1] || (he[1] = (Be) => Z.$emit('click:day', Be)),
                          'onClick:month': he[2] || (he[2] = (Be) => Z.$emit('click:month', Be)),
                          'onClick:year': he[3] || (he[3] = (Be) => Z.$emit('click:year', Be)),
                          'onHover:day': he[4] || (he[4] = (Be) => Z.$emit('hover:day', Be)),
                          'onHover:month': he[5] || (he[5] = (Be) => Z.$emit('hover:month', Be)),
                          'onHover:year': he[6] || (he[6] = (Be) => Z.$emit('hover:year', Be)),
                          'onUpdate:view':
                            he[7] ||
                            (he[7] = (Be) => {
                              ;(Z.$nextTick(() => v()), Z.$emit('update:view', Be))
                            }),
                        }),
                        st({ _: 2 }, [
                          Ie(Z.$slots, (Be, Je) => ({ name: Je, fn: z(($t) => [V(Z.$slots, Je, J(ie($t)))]) })),
                        ]),
                        1040,
                        ['modelValue'],
                      ),
                    ]),
                    _: 3,
                  },
                ),
              ]),
              _: 3,
            },
            16,
            ['modelValue', 'class', 'style'],
          )
        )
      )
    },
  }),
  Wg = Q(Ug),
  Kg = Q(Io),
  Gg = ['aria-orientation'],
  qg = { key: 0, class: 'va-divider__text' },
  mo = 'va-divider',
  Yg = G({
    name: 'VaDivider',
    __name: 'VaDivider',
    props: {
      ...me,
      vertical: { type: Boolean, default: !1 },
      dashed: { type: Boolean, default: !1 },
      inset: { type: Boolean, default: !1 },
      orientation: { type: String, default: 'center', validator: (e) => ['left', 'right', 'center'].includes(e) },
      color: { type: String, default: 'backgroundBorder' },
    },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        o = i(() => a(t.color)),
        n = dt(),
        l = i(() => !!n.default),
        r = i(() => ({
          [`${mo}--vertical`]: t.vertical,
          [`${mo}--inset`]: t.inset,
          [`${mo}--${t.orientation}`]: t.orientation && !t.vertical,
          [`${mo}--dashed`]: t.dashed,
        }))
      return (u, d) => (
        C(),
        _(
          'div',
          {
            role: 'separator',
            class: pe(['va-divider', r.value]),
            'aria-orientation': e.vertical ? 'vertical' : 'horizontal',
            'aria-hidden': !0,
            style: Y(`--va-color-computed: ${String(o.value)}`),
          },
          [l.value && !e.vertical ? (C(), _('div', qg, [V(u.$slots, 'default')])) : E('', !0)],
          14,
          Gg,
        )
      )
    },
  }),
  Pi = Q(Yg),
  lo = Symbol('VaFileUpload'),
  Xg = G({
    name: 'VaList',
    __name: 'VaList',
    props: { ...me, fit: { type: Boolean, default: !1 } },
    setup(e) {
      const t = e,
        a = i(() => ({ 'va-list--fit': t.fit }))
      return (o, n) => (C(), _('div', { class: pe(['va-list', a.value]), role: 'list' }, [V(o.$slots, 'default')], 2))
    },
  }),
  Jg = G({
    name: 'VaListItem',
    __name: 'VaListItem',
    props: { ...ba, ...me, tag: { type: String, default: 'div' }, disabled: { type: Boolean, default: !1 } },
    emits: ['focus', 'click'],
    setup(e, { emit: t }) {
      const a = e,
        o = i(() => (a.disabled ? -1 : 0)),
        n = Fe('va-list-item', () => ({ ...Ge(a, ['disabled']) })),
        { tagComputed: l, hrefComputed: r } = Jt(a)
      return (u, d) => (
        C(),
        U(
          pt(s(l)),
          {
            class: pe(['va-list-item', s(n)]),
            role: 'listitem',
            href: s(r),
            target: u.target,
            to: u.to,
            replace: u.replace,
            exact: u.exact,
            'active-class': u.activeClass,
            'exact-active-class': u.exactActiveClass,
            tabindex: o.value,
          },
          {
            default: z(() => [
              R(
                'div',
                {
                  class: 'va-list-item__inner',
                  onClick: d[0] || (d[0] = (c) => u.$emit('click')),
                  onFocus: d[1] || (d[1] = (c) => u.$emit('focus')),
                },
                [V(u.$slots, 'default')],
                32,
              ),
            ]),
            _: 3,
          },
          8,
          ['href', 'target', 'to', 'replace', 'exact', 'active-class', 'exact-active-class', 'class', 'tabindex'],
        )
      )
    },
  }),
  Zg = G({
    name: 'VaListLabel',
    __name: 'VaListLabel',
    props: { ...me, color: { type: String, default: 'primary' } },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        o = i(() => ({ color: a(t.color) }))
      return (n, l) => (C(), _('div', { class: 'va-list-label', style: Y(o.value) }, [V(n.$slots, 'default')], 4))
    },
  }),
  Qg = G({
    name: 'VaListItemLabel',
    __name: 'VaListItemLabel',
    props: { ...me, caption: { type: Boolean, default: !1 }, lines: { type: [Number, String], default: 1 } },
    setup(e) {
      const t = e,
        a = Pe('lines'),
        o = i(() => ({ 'va-list-item-label--caption': t.caption })),
        n = i(() => ({ '-webkit-line-clamp': a.value }))
      return (l, r) => (
        C(),
        _('div', { class: pe(['va-list-item-label', o.value]), style: Y(n.value) }, [V(l.$slots, 'default')], 6)
      )
    },
  }),
  ey = G({
    name: 'VaListItemSection',
    __name: 'VaListItemSection',
    props: { ...me, icon: { type: Boolean, default: !1 }, avatar: { type: Boolean, default: !1 } },
    setup(e) {
      const t = e,
        a = i(() => ({
          'va-list-item-section--main': !t.icon && !t.avatar,
          'va-list-item-section--icon': t.icon,
          'va-list-item-section--avatar': t.avatar,
        }))
      return (o, n) => (C(), _('div', { class: pe(['va-list-item-section', a.value]) }, [V(o.$slots, 'default')], 2))
    },
  }),
  ty = G({
    name: 'VaListSeparator',
    __name: 'VaListSeparator',
    props: { ...me, fit: { type: Boolean, default: !1 }, spaced: { type: Boolean, default: !1 } },
    setup(e) {
      const t = e,
        a = i(() => ({ 'va-list-separator--offset': !t.fit, 'va-list-separator--spaced': t.spaced }))
      return (o, n) => (C(), _('div', { 'aria-hidden': 'true', class: pe(['va-list-separator', a.value]) }, null, 2))
    },
  }),
  Ko = Q(Jg),
  ay = Q(Zg),
  oy = Q(Qg),
  Ta = Q(ey),
  ny = Q(ty),
  Ai = Q(Xg),
  ly = { key: 0, class: 'va-progress-bar__info' },
  ry = G({
    name: 'VaProgressBar',
    __name: 'VaProgressBar',
    props: {
      ...me,
      modelValue: { type: [Number, String], default: 0 },
      indeterminate: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
      size: { type: [Number, String], default: 'medium' },
      buffer: { type: [Number, String], default: 100 },
      rounded: { type: Boolean, default: !0 },
      reverse: { type: Boolean, default: !1 },
      contentInside: { type: Boolean, default: !1 },
      showPercent: { type: Boolean, default: !1 },
      max: { type: [Number, String], default: 100 },
      ariaLabel: ye('$t:progressState'),
    },
    setup(e) {
      const t = e,
        { getColor: a, getHoverColor: o } = Ce(),
        n = i(() => a(t.color)),
        { textColorComputed: l } = tt(n),
        r = i(() => typeof t.size == 'string' && ['small', 'medium', 'large'].includes(t.size)),
        u = () => {
          if (typeof t.size == 'number') return `${t.size}px`
          if (!r.value) return t.size
        },
        { tp: d } = He(),
        c = i(() => (100 / Number(t.max)) * Number(t.modelValue)),
        v = i(() => ({ 'va-progress-bar--square': !t.rounded, [`va-progress-bar--${t.size}`]: r.value })),
        p = i(() => ({ '--va-progress-bar-color': n.value, '--va-progress-bar-background-color': o(n.value) })),
        f = i(() => ({ height: u() })),
        g = i(() => ({
          width: `${t.indeterminate ? 100 : da(Number(t.buffer), 0, 100)}%`,
          color: l.value,
          [t.reverse ? 'right' : 'left']: 0,
        })),
        y = i(() => ({ marginLeft: t.reverse ? 'auto' : void 0, width: `${da(c.value, 0, 100)}%` })),
        m = i(() => ({ animationDirection: t.reverse ? 'reverse' : 'normal' })),
        b = i(() => ({
          role: 'progressbar',
          'aria-label': d(t.ariaLabel),
          'aria-valuenow': t.indeterminate ? void 0 : t.modelValue,
        }))
      return (h, $) => (
        C(),
        _(
          'div',
          H({ class: ['va-progress-bar', v.value], style: p.value }, b.value),
          [
            h.$props.contentInside
              ? E('', !0)
              : (C(),
                _('div', ly, [
                  V(h.$slots, 'default', J(ie({ value: h.$props.modelValue })), () => [
                    h.$props.showPercent
                      ? (C(), _(be, { key: 0 }, [Te(fe(h.$props.modelValue) + '% ', 1)], 64))
                      : E('', !0),
                  ]),
                ])),
            R(
              'div',
              { class: 'va-progress-bar__wrapper', style: Y(f.value) },
              [
                R(
                  'div',
                  { class: 'va-progress-bar__buffer', style: Y(g.value) },
                  [
                    h.$props.contentInside
                      ? V(h.$slots, 'default', J(H({ key: 0 }, { value: h.$props.modelValue })), () => [
                          h.$props.showPercent
                            ? (C(), _(be, { key: 0 }, [Te(fe(h.$props.modelValue) + '% ', 1)], 64))
                            : E('', !0),
                        ])
                      : E('', !0),
                  ],
                  4,
                ),
                e.indeterminate
                  ? (C(),
                    _(
                      be,
                      { key: 0 },
                      [
                        R(
                          'div',
                          { class: 'va-progress-bar__progress--indeterminate-start', style: Y(m.value) },
                          null,
                          4,
                        ),
                        R('div', { class: 'va-progress-bar__progress--indeterminate-end', style: Y(m.value) }, null, 4),
                      ],
                      64,
                    ))
                  : (C(), _('div', { key: 1, class: 'va-progress-bar__progress', style: Y(y.value) }, null, 4)),
              ],
              4,
            ),
          ],
          16,
        )
      )
    },
  }),
  Li = Q(ry),
  ro = (e, t) => {
    const a = Lt(e)
    if (!a) throw new Error(t)
    return a
  },
  sy = { class: 'va-file-upload-undo__text' },
  iy = 'The VaFileUploadUndo component should be used in the context of VaFileUpload component',
  uy = G({
    name: 'VaFileUploadUndo',
    __name: 'VaFileUploadUndo',
    props: { vertical: { type: Boolean, default: !1 } },
    emits: ['recover'],
    setup(e, { emit: t }) {
      const a = e,
        o = D(100),
        { undoDuration: n, undoButtonText: l, deletedFileMessage: r } = ro(lo, iy),
        u = Fe('va-file-upload-undo', () => ({ vertical: a.vertical })),
        d = i(() => `${n.value ?? 0}ms`)
      return (
        Me(() => {
          const c = setTimeout(() => {
            ;((o.value = 0), clearTimeout(c))
          }, 0)
        }),
        (c, v) => (
          C(),
          _(
            be,
            null,
            [
              ue(
                s(Li),
                {
                  'model-value': o.value,
                  rounded: !1,
                  class: 'va-file-upload-undo-progress-bar',
                  style: Y(`--va-undo-duration-style: ${String(d.value)}`),
                },
                null,
                8,
                ['model-value', 'style'],
              ),
              R(
                'div',
                { class: pe(['va-file-upload-undo', s(u)]), style: Y(`--va-undo-duration-style: ${String(d.value)}`) },
                [
                  R('span', sy, fe(s(r)), 1),
                  ue(
                    s(xe),
                    {
                      class: 'va-file-upload-undo__button',
                      'aria-label': s(l),
                      size: 'small',
                      outline: '',
                      onClick: v[0] || (v[0] = (p) => c.$emit('recover')),
                    },
                    { default: z(() => [Te(fe(s(l)), 1)]), _: 1 },
                    8,
                    ['aria-label'],
                  ),
                ],
                6,
              ),
            ],
            64,
          )
        )
      )
    },
  }),
  Oi = Q(uy),
  cy = { class: 'va-file-upload-list-item__content' },
  dy = { key: 0, class: 'va-file-upload-list-item__name' },
  vy = { class: 'va-file-upload-list-item__size' },
  py = 'The VaFileUploadListItem component should be used in the context of VaFileUpload component',
  fy = G({
    name: 'VaFileUploadListItem',
    __name: 'VaFileUploadListItem',
    props: {
      file: { type: Object, default: null },
      color: { type: String, default: 'success' },
      ariaRemoveFileLabel: ye('$t:removeFile'),
    },
    emits: ['remove'],
    setup(e, { emit: t }) {
      const { tp: a } = He(),
        o = t,
        { undo: n, disabled: l, undoDuration: r } = ro(lo, py),
        { onFocus: u, onBlur: d } = jt(),
        c = D(!1),
        v = () => {
          n.value
            ? ((c.value = !0),
              setTimeout(() => {
                c.value && (o('remove'), (c.value = !1))
              }, r.value ?? 0))
            : (o('remove'), (c.value = !1))
        },
        p = () => {
          c.value = !1
        },
        f = Fe('va-file-upload-list-item', () => ({ undo: c.value }))
      return (g, y) => (
        C(),
        U(
          s(Ko),
          { class: pe(['va-file-upload-list-item', s(f)]), tabindex: '-1', disabled: s(l), 'aria-disabled': s(l) },
          {
            default: z(() => [
              c.value && s(n)
                ? (C(), U(s(Ta), { key: 0 }, { default: z(() => [ue(s(Oi), { onRecover: p })]), _: 1 }))
                : (C(),
                  U(
                    s(Ta),
                    { key: 1 },
                    {
                      default: z(() => [
                        R('div', cy, [
                          e.file && e.file.name ? (C(), _('div', dy, fe(e.file && e.file.name), 1)) : E('', !0),
                          R('div', vy, fe(e.file && e.file.size), 1),
                          s(l)
                            ? E('', !0)
                            : (C(),
                              U(
                                s(xe),
                                {
                                  key: 1,
                                  flat: '',
                                  color: 'danger',
                                  icon: 'clear',
                                  class: 'va-file-upload-list-item__delete',
                                  'aria-label': s(a)(g.$props.ariaRemoveFileLabel),
                                  onClick: ne(v, ['stop']),
                                  onKeydown: [se(ne(v, ['stop']), ['enter']), se(ne(v, ['stop']), ['space'])],
                                  onFocus: s(u),
                                  onBlur: s(d),
                                },
                                null,
                                8,
                                ['aria-label', 'onKeydown', 'onFocus', 'onBlur'],
                              )),
                        ]),
                      ]),
                      _: 1,
                    },
                  )),
            ]),
            _: 1,
          },
          8,
          ['class', 'disabled', 'aria-disabled'],
        )
      )
    },
  }),
  xi = Q(fy),
  my = ['src', 'alt'],
  gy = { class: 'va-file-upload-gallery-item__overlay' },
  yy = ['title'],
  by = 'The VaFileUploadGalleryItem component should be used in the context of VaFileUpload component',
  hy = G({
    name: 'VaFileUploadGalleryItem',
    __name: 'VaFileUploadGalleryItem',
    props: {
      file: { type: Object, default: null },
      color: { type: String, default: 'success' },
      ariaRemoveFileLabel: ye('$t:removeFile'),
    },
    emits: ['remove'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { undo: n, disabled: l, undoDuration: r } = ro(lo, by),
        { isFocused: u, onFocus: d, onBlur: c } = jt(),
        v = D(''),
        p = D(!1),
        f = i(() => ({ backgroundColor: ma(a.color, 0.7) })),
        g = Fe('va-file-upload-gallery-item', () => ({ notImage: !v.value, focused: u.value, undo: p.value })),
        y = () => {
          n.value
            ? ((p.value = !0),
              setTimeout(() => {
                p.value && (o('remove'), (p.value = !1))
              }, r.value ?? 0))
            : (o('remove'), (p.value = !1))
        },
        m = () => {
          p.value = !1
        },
        b = () => {
          if (!(!a.file.name || !a.file.image)) {
            if (a.file.image.url) v.value = a.file.image.url
            else if (a.file.image instanceof File) {
              const S = new FileReader()
              ;(S.readAsDataURL(a.file.image),
                (S.onload = (w) => {
                  var I, A
                  ;((I = w.target) == null ? void 0 : I.result).includes('image') &&
                    (v.value = (A = w.target) == null ? void 0 : A.result)
                }))
            }
          }
        }
      ;(Me(b), re(() => a.file, b))
      const { tp: h } = He(),
        { textColorComputed: $ } = tt(ut(a, 'color'))
      return (S, w) => (
        C(),
        U(
          s(Ko),
          {
            class: pe(['va-file-upload-gallery-item', s(g)]),
            tabindex: '-1',
            disabled: s(l),
            'aria-disabled': s(l),
            onFocus: s(d),
            onBlur: s(c),
          },
          {
            default: z(() => [
              p.value && s(n)
                ? (C(), U(s(Ta), { key: 0 }, { default: z(() => [ue(s(Oi), { vertical: '', onRecover: m })]), _: 1 }))
                : (C(),
                  U(
                    s(Ta),
                    { key: 1 },
                    {
                      default: z(() => [
                        v.value
                          ? (C(),
                            _(
                              'img',
                              {
                                key: 0,
                                src: v.value,
                                alt: e.file.name || '',
                                class: 'va-file-upload-gallery-item__image',
                              },
                              null,
                              8,
                              my,
                            ))
                          : E('', !0),
                        R('div', gy, [
                          R(
                            'div',
                            { class: 'va-file-upload-gallery-item__overlay-background', style: Y(f.value) },
                            null,
                            4,
                          ),
                          e.file && e.file.name
                            ? (C(),
                              _(
                                'div',
                                {
                                  key: 0,
                                  class: 'va-file-upload-gallery-item__name',
                                  title: e.file.name,
                                  style: Y({ color: s($) }),
                                },
                                fe(e.file.name),
                                13,
                                yy,
                              ))
                            : E('', !0),
                          s(l)
                            ? E('', !0)
                            : (C(),
                              U(
                                s(xe),
                                {
                                  key: 1,
                                  flat: '',
                                  color: 'danger',
                                  icon: 'va-delete',
                                  class: 'va-file-upload-gallery-item__delete',
                                  'aria-label': s(h)(S.$props.ariaRemoveFileLabel),
                                  onClick: y,
                                  onFocus: s(d),
                                  onBlur: s(c),
                                },
                                null,
                                8,
                                ['aria-label', 'onFocus', 'onBlur'],
                              )),
                        ]),
                      ]),
                      _: 1,
                    },
                  )),
            ]),
            _: 1,
          },
          8,
          ['class', 'disabled', 'aria-disabled', 'onFocus', 'onBlur'],
        )
      )
    },
  }),
  Ei = Q(hy),
  Cy = { class: 'va-file-upload-single-item__name' },
  Sy = 'The VaFileUploadSingleItem component should be used in the context of VaFileUpload component',
  $y = G({
    name: 'VaFileUploadSingleItem',
    __name: 'VaFileUploadSingleItem',
    props: { file: { type: Object, default: null }, ariaRemoveFileLabel: ye('$t:removeFile') },
    emits: ['remove'],
    setup(e, { emit: t }) {
      const { tp: a } = He(),
        { disabled: o } = ro(lo, Sy)
      return (n, l) => (
        C(),
        U(
          s(Ko),
          { disabled: s(o), 'aria-disabled': s(o), class: 'va-file-upload-single-item', tabindex: '-1' },
          {
            default: z(() => [
              ue(
                s(Ta),
                { class: 'va-file-upload-single-item__content' },
                {
                  default: z(() => [
                    R('div', Cy, fe(e.file && e.file.name), 1),
                    s(o)
                      ? E('', !0)
                      : (C(),
                        U(
                          s(xe),
                          {
                            key: 0,
                            class: 'va-file-upload-single-item__button',
                            'aria-label': s(a)(n.$props.ariaRemoveFileLabel),
                            size: 'small',
                            color: 'danger',
                            preset: 'secondary',
                            onClick: l[0] || (l[0] = (r) => n.$emit('remove')),
                          },
                          { default: z(() => [Te(' Delete ')]), _: 1 },
                          8,
                          ['aria-label'],
                        )),
                  ]),
                  _: 1,
                },
              ),
            ]),
            _: 1,
          },
          8,
          ['disabled', 'aria-disabled'],
        )
      )
    },
  }),
  Di = Q($y),
  pr = Ee(Ei),
  fr = Ee(xi),
  mr = Ee(Di),
  ky = G({
    name: 'VaFileUploadList',
    __name: 'VaFileUploadList',
    props: { type: { type: String, default: '' }, files: { type: Array, default: null }, ...pr, ...fr, ...mr },
    emits: ['remove', 'removeSingle'],
    setup(e, { emit: t }) {
      const a = e,
        o = i(() => a.files.map(n)),
        n = (v) => ({ name: v.name || v.url || '', size: l(v.size), date: r(new Date()), image: v }),
        l = (v) => {
          if (v === 0) return '0 Bytes'
          if (!v) return ''
          const p = 1024,
            f = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            g = Math.floor(Math.log(v) / Math.log(p))
          return parseFloat((v / Math.pow(p, g)).toFixed(2)) + ' ' + f[g]
        },
        r = (v = new Date()) =>
          v.toLocaleDateString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        u = ze(pr),
        d = ze(fr),
        c = ze(mr)
      return (v, p) => (
        C(),
        U(
          s(Ai),
          {
            class: pe(['va-file-upload-list', `va-file-upload-list--${e.type}`]),
            role: e.type !== 'single' ? 'list' : void 0,
          },
          {
            default: z(() => [
              e.type === 'list'
                ? (C(!0),
                  _(
                    be,
                    { key: 0 },
                    Ie(
                      o.value,
                      (f, g) => (
                        C(),
                        U(
                          s(xi),
                          H({ key: f.name }, s(d), {
                            file: f,
                            role: 'listitem',
                            onRemove: (y) => v.$emit('remove', g),
                          }),
                          null,
                          16,
                          ['file', 'onRemove'],
                        )
                      ),
                    ),
                    128,
                  ))
                : E('', !0),
              e.type === 'gallery'
                ? (C(!0),
                  _(
                    be,
                    { key: 1 },
                    Ie(
                      o.value,
                      (f, g) => (
                        C(),
                        U(
                          s(Ei),
                          H(s(u), { key: f.name, file: f, role: 'listitem', onRemove: (y) => v.$emit('remove', g) }),
                          null,
                          16,
                          ['file', 'onRemove'],
                        )
                      ),
                    ),
                    128,
                  ))
                : E('', !0),
              e.type === 'single' && o.value.length
                ? (C(),
                  U(
                    s(Di),
                    H({ key: 2 }, s(c), {
                      file: o.value[o.value.length - 1],
                      onRemove: p[0] || (p[0] = (f) => v.$emit('removeSingle')),
                    }),
                    null,
                    16,
                    ['file'],
                  ))
                : E('', !0),
            ]),
            _: 1,
          },
          8,
          ['role', 'class'],
        )
      )
    },
  }),
  Fi = Q(ky),
  wy = { class: 'va-file-upload__field' },
  _y = { key: 0, class: 'va-file-upload__field__text' },
  Vy = ['accept', 'multiple', 'disabled'],
  gr = Ee(Fi),
  By = G({
    name: 'VaFileUpload',
    __name: 'VaFileUpload',
    props: {
      ...me,
      ...gr,
      fileTypes: { type: String, default: '' },
      dropzone: { type: Boolean, default: !1 },
      hideFileList: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
      disabled: { type: Boolean, default: !1 },
      undo: { type: Boolean, default: !1 },
      undoDuration: { type: [Number, String], default: 3e3 },
      undoButtonText: ye('$t:undo'),
      dropZoneText: ye('$t:dropzone'),
      uploadButtonText: ye('$t:uploadFile'),
      deletedFileMessage: ye('$t:fileDeleted'),
      fileIncorrectMessage: ye('$t:fileTypeIncorrect'),
      modelValue: { type: [Object, Array], default: () => [] },
      type: { type: String, default: 'list', validator: (e) => ['list', 'gallery', 'single'].includes(e) },
    },
    emits: ['update:modelValue', 'file-removed', 'file-added'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        l = D(!1),
        r = D(!1),
        { getColor: u, shiftHSLAColor: d } = Ce(),
        c = i(() => u(a.color)),
        v = i(() => ({ backgroundColor: a.dropzone ? d(c.value, { a: r.value ? -0.82 : -0.92 }) : 'transparent' })),
        p = Fe('va-file-upload', () => ({ dropzone: a.dropzone, disabled: a.disabled })),
        f = i({
          get() {
            return Array.isArray(a.modelValue) ? a.modelValue : [a.modelValue]
          },
          set(I) {
            a.type === 'single' ? o('update:modelValue', I[0]) : o('update:modelValue', I)
          },
        }),
        g = (I) =>
          I.filter((A) => {
            const k = A.name || A.url
            if (!k) return !1
            if (A.url || ['audio/*', 'video/*', 'image/*'].find((oe) => a.fileTypes.includes(oe))) return !0
            const M = k.substring(k.lastIndexOf('.') + 1).toLowerCase(),
              ae = a.fileTypes.includes(M)
            return (ae || (l.value = !0), ae)
          }),
        y = (I) => {
          var A, k
          const T = ((A = I.target) == null ? void 0 : A.files) || ((k = I.dataTransfer) == null ? void 0 : k.files)
          if (!T) return
          const O = a.fileTypes ? g(Array.from(T)) : T
          ;((f.value = a.type === 'single' ? O : [...f.value, ...O]), o('file-added', O))
        },
        m = (I) => {
          ;(y(I), n.value && (n.value.value = ''))
        },
        b = (I) => {
          if (I in f.value) {
            const A = f.value[I]
            ;((f.value = f.value.filter((k, T) => T !== I)), o('file-removed', A))
          }
        },
        h = () => {
          if (f.value.length > 0) {
            const I = f.value[0]
            ;((f.value = []), o('file-removed', I))
          }
        },
        $ = () => {
          n.value && n.value.click()
        }
      Me(() => {
        if (Array.isArray(f.value)) {
          const I = g(f.value)
          I.length !== f.value.length && (f.value = I)
        }
      })
      const { tp: S } = He()
      Ot(lo, {
        undo: ut(a, 'undo'),
        disabled: ut(a, 'disabled'),
        undoDuration: Pe('undoDuration'),
        undoButtonText: i(() => S(a.undoButtonText)),
        deletedFileMessage: i(() => S(a.deletedFileMessage)),
      })
      const w = ze(gr)
      return (I, A) => (
        C(),
        _(
          'div',
          { class: pe(['va-file-upload', s(p)]), style: Y(v.value) },
          [
            V(I.$slots, 'default', {}, () => [
              R('div', wy, [
                e.dropzone ? (C(), _('div', _y, fe(s(S)(e.dropZoneText)), 1)) : E('', !0),
                ue(
                  s(xe),
                  {
                    class: 'va-file-upload__field__button',
                    disabled: e.disabled,
                    'aria-disabled': e.disabled,
                    color: c.value,
                    style: Y({ 'pointer-events': r.value ? 'none' : void 0 }),
                    onChange: m,
                    onClick: $,
                  },
                  { default: z(() => [Te(fe(s(S)(e.uploadButtonText)), 1)]), _: 1 },
                  8,
                  ['disabled', 'aria-disabled', 'color', 'style'],
                ),
              ]),
            ]),
            R(
              'input',
              {
                ref_key: 'fileInputRef',
                ref: n,
                type: 'file',
                class: 'va-file-upload__field__input',
                tabindex: -1,
                'aria-hidden': 'true',
                accept: e.fileTypes,
                multiple: e.type !== 'single',
                disabled: e.disabled,
                onChange: m,
                onDragenter: A[0] || (A[0] = (k) => (r.value = !0)),
                onDragleave: A[1] || (A[1] = (k) => (r.value = !1)),
              },
              null,
              40,
              Vy,
            ),
            f.value.length && !I.$props.hideFileList
              ? (C(),
                U(
                  s(Fi),
                  H({ key: 0 }, s(w), { type: e.type, files: f.value, color: c.value, onRemove: b, onRemoveSingle: h }),
                  null,
                  16,
                  ['type', 'files', 'color'],
                ))
              : E('', !0),
            ue(
              s(zn),
              {
                modelValue: l.value,
                'onUpdate:modelValue': A[2] || (A[2] = (k) => (l.value = k)),
                'hide-default-actions': '',
                message: s(S)('$t:fileTypeIncorrect'),
              },
              null,
              8,
              ['modelValue', 'message'],
            ),
          ],
          6,
        )
      )
    },
  }),
  Ty = Q(By),
  Iy = (e) => {
    const t = D(new Map())
    return {
      immediate: i(() => e.immediate),
      fields: i(() => [...t.value.values()]),
      forceHideErrors: i(() => e.hideErrors),
      forceHideErrorMessages: i(() => e.hideErrorMessages),
      forceHideLoading: i(() => e.hideLoading),
      forceDirty: D(!1),
      registerField: (a, o) => {
        t.value.set(a, o)
      },
      unregisterField: (a) => {
        t.value.delete(a)
      },
    }
  },
  Py = (e) => {
    const t = Iy(e)
    Ot(bs, t)
    const { fields: a, forceDirty: o } = t,
      n = i(() => a.value.map((S) => s(S.name)).filter(Boolean)),
      l = i(() => a.value.reduce((S, w) => (s(w.name) && (S[s(w.name)] = w), S), {})),
      r = i(() => a.value.reduce((S, w) => (s(w.name) && (S[s(w.name)] = s(w.value)), S), {})),
      u = i(() => a.value.every((S) => s(S.isValid))),
      d = i(() => a.value.some((S) => s(S.isLoading))),
      c = i(() => a.value.map((S) => s(S.errorMessages)).flat()),
      v = i(() => a.value.reduce((S, w) => (s(w.name) && (S[s(w.name)] = s(w.errorMessages)), S), {})),
      p = i({
        get() {
          return a.value.some((S) => s(S.isDirty)) || o.value
        },
        set(S) {
          ;((o.value = S),
            a.value.forEach((w) => {
              w.isDirty = S
            }))
        },
      }),
      f = i({
        get() {
          return a.value.some((S) => S.isTouched)
        },
        set(S) {
          a.value.forEach((w) => {
            w.isTouched = S
          })
        },
      }),
      g = () => ((p.value = !0), a.value.reduce((S, w) => w.validate() && S, !0)),
      y = () => ((p.value = !0), Promise.all(a.value.map((S) => S.validateAsync())).then((S) => S.every(Boolean))),
      m = () => {
        ;((p.value = !1), a.value.forEach((S) => S.reset()))
      },
      b = () => {
        ;((p.value = !1), a.value.forEach((S) => S.resetValidation()))
      },
      h = () => {
        var S
        ;(S = a.value[0]) == null || S.focus()
      },
      $ = () => {
        const S = a.value.find((w) => !w.isValid)
        S == null || S.focus()
      }
    return (
      hs({
        name: ut(e, 'name'),
        isValid: u,
        isLoading: d,
        isDirty: p,
        isTouched: f,
        validate: g,
        validateAsync: y,
        reset: m,
        resetValidation: b,
        focus: h,
        errorMessages: c,
      }),
      {
        immediate: i(() => e.immediate),
        isDirty: p,
        isTouched: f,
        formData: r,
        fields: a,
        fieldsNamed: l,
        fieldNames: n,
        isValid: u,
        isLoading: d,
        errorMessages: c,
        errorMessagesNamed: v,
        validate: g,
        validateAsync: y,
        reset: m,
        resetValidation: b,
        focus: h,
        focusInvalidField: $,
      }
    )
  },
  ht = { stateful: !0 },
  Ay = {
    VaInput: ht,
    VaSelect: ht,
    VaCheckbox: ht,
    VaRadio: ht,
    VaDatePicker: ht,
    VaTimePicker: ht,
    VaColorPicker: ht,
    VaSlider: ht,
    VaSwitch: ht,
    VaFileUpload: ht,
    VaRating: ht,
    VaDateInput: ht,
    VaTimeInput: ht,
  },
  Ly = G({
    name: 'VaForm',
    __name: 'VaForm',
    props: {
      ...me,
      autofocus: { type: Boolean, default: !1 },
      immediate: { type: Boolean, default: !1 },
      tag: { type: String, default: 'form' },
      trigger: { type: String, default: 'blur' },
      modelValue: { type: Boolean, default: !0 },
      hideErrors: { type: Boolean, default: !1 },
      hideErrorMessages: { type: Boolean, default: !1 },
      hideLoading: { type: Boolean, default: !1 },
      stateful: { type: Boolean, default: !1 },
      name: { type: String, default: void 0 },
    },
    emits: ['update:modelValue'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = Py(o)
      ;(re(l.isValid, (k) => {
        n('update:modelValue', k)
      }),
        re(
          () => o.autofocus,
          (k) => {
            k && l.focus()
          },
        ),
        Me(() => {
          o.autofocus && l.focus()
        }),
        re(
          l.fields,
          (k) => {
            k.length && o.immediate && l.validate()
          },
          { immediate: !0 },
        ),
        Pu(i(() => (o.stateful ? Ay : {}))))
      const {
        immediate: r,
        isDirty: u,
        isTouched: d,
        formData: c,
        fields: v,
        fieldsNamed: p,
        fieldNames: f,
        isValid: g,
        isLoading: y,
        errorMessages: m,
        errorMessagesNamed: b,
        validate: h,
        validateAsync: $,
        reset: S,
        resetValidation: w,
        focus: I,
        focusInvalidField: A,
      } = l
      return (
        t({
          immediate: r,
          isDirty: u,
          formData: c,
          fields: v,
          fieldsNamed: p,
          fieldNames: f,
          isValid: g,
          isTouched: d,
          isLoading: y,
          errorMessages: m,
          errorMessagesNamed: b,
          validate: h,
          validateAsync: $,
          reset: S,
          resetValidation: w,
          focus: I,
          focusInvalidField: A,
        }),
        (k, T) => (
          C(),
          U(
            pt(e.tag),
            H(
              { class: 'va-form', onSubmit: T[0] || (T[0] = (O) => k.$attrs.action === void 0 && O.preventDefault()) },
              k.$attrs,
            ),
            {
              default: z(() => [
                V(
                  k.$slots,
                  'default',
                  J(
                    ie({
                      isValid: s(g),
                      isDirty: s(u),
                      isTouched: s(d),
                      isLoading: s(y),
                      errorMessages: s(m),
                      errorMessagesNamed: s(b),
                      formData: s(c),
                      fields: s(v),
                      fieldsNamed: s(p),
                      fieldNames: s(f),
                      validate: s(h),
                      validateAsync: s($),
                      reset: s(S),
                      resetValidation: s(w),
                      focus: s(I),
                      focusInvalidField: s(A),
                    }),
                  ),
                ),
              ]),
              _: 3,
            },
            16,
          )
        )
      )
    },
  }),
  Oy = Q(Ly),
  xy = (e = 0) => new Promise((t) => setTimeout(t, e)),
  Ey = (e, t, a) => {
    const o = () => {
        var l
        ;(l = t.value) == null || l.addEventListener('scroll', a.value, { passive: !0 })
      },
      n = () => {
        var l
        ;(l = t.value) == null || l.removeEventListener('scroll', a.value)
      }
    return (
      Me(() => {
        t.value && ((t.value.style.overflowY = 'scroll'), e.reverse && (t.value.scrollTop = t.value.scrollHeight), o())
      }),
      et(n),
      { addScrollListener: o, removeScrollListener: n }
    )
  },
  Dy = { class: 'va-infinite-scroll__spinner__default' },
  Fy = G({
    name: 'VaInfiniteScroll',
    __name: 'VaInfiniteScroll',
    props: {
      ...me,
      load: { type: Function, required: !0 },
      offset: { type: [Number, String], default: 500 },
      reverse: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      scrollTarget: { type: [String, Object], default: null },
      debounce: { type: [Number, String], default: 100 },
      tag: { type: String, default: 'div' },
    },
    emits: ['onload', 'onerror'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        l = we(),
        r = D(!1),
        u = D(!1),
        d = D(!1),
        c = D(),
        v = D(0),
        p = D(0),
        f = i(() => {
          var B
          let K
          return (
            typeof a.scrollTarget == 'string'
              ? (K = document.querySelector(a.scrollTarget))
              : (K = a.scrollTarget || ((B = n.value) == null ? void 0 : B.parentElement)),
            K || document.body
          )
        }),
        { addScrollListener: g, removeScrollListener: y } = Ey(a, f, c),
        m = Pe('offset'),
        b = Pe('debounce'),
        { getColor: h } = Ce(),
        $ = i(() => (u.value ? h('danger') : h('primary'))),
        S = i(() => {
          var B
          return ((B = l.value) == null ? void 0 : B.offsetHeight) || 0
        }),
        w = i(() => m.value + S.value),
        I = () => {
          a.disabled || ((r.value = !1), y())
        },
        A = () => {
          a.disabled || g()
        },
        k = () => {
          const { scrollTop: B, scrollHeight: K, clientHeight: L } = f.value
          v.value = K - B
          const x = B - p.value
          if (((p.value = B), a.disabled || u.value || r.value)) return
          if (d.value) {
            d.value = !1
            return
          }
          ;(a.reverse && x > 0) ||
            (!a.reverse && x < 0) ||
            (a.reverse ? B : K - B - L) > w.value ||
            ((r.value = !0), a.load().then(M).catch(oe))
        },
        T = (B) => {
          ;((d.value = !0), (f.value.scrollTop = B))
        },
        O = () => {
          const { scrollTop: B, scrollHeight: K, clientHeight: L } = f.value
          if (a.reverse) {
            const x = K - B < v.value,
              N = B >= S.value
            if (x && N) return
            K - v.value > S.value ? T(K - v.value) : T(S.value)
          }
          a.reverse || (!(K - B - L >= S.value) && T(K - L - S.value))
        },
        M = () => {
          ;(O(), (r.value = !1), o('onload'))
        },
        ae = () => {
          ;(O(), (d.value = !1), (u.value = !1), (r.value = !1), o('onerror'))
        },
        oe = () => {
          ;(I(), (u.value = !0), xy(1200).then(ae).then(A))
        }
      return (
        re(
          () => b.value,
          (B) => {
            c.value = jn(k, B)
          },
          { immediate: !0 },
        ),
        re(
          () => a.disabled,
          (B) => {
            B ? I() : A()
          },
        ),
        (B, K) => (
          C(),
          U(
            pt(B.$props.tag),
            {
              ref_key: 'element',
              ref: n,
              role: 'feed',
              class: pe(['va-infinite-scroll', { 'va-infinite-scroll--reversed': B.$props.reverse }]),
              'aria-busy': r.value,
            },
            {
              default: z(() => [
                V(B.$slots, 'default'),
                R(
                  'div',
                  {
                    ref_key: 'spinnerSlotContainer',
                    ref: l,
                    class: pe(['va-infinite-scroll__spinner', { 'va-infinite-scroll__spinner--invisible': !r.value }]),
                  },
                  [
                    B.$props.disabled
                      ? E('', !0)
                      : V(B.$slots, 'loading', { key: 0 }, () => [
                          R('div', Dy, [
                            ue(s(Aa), { size: 'small', thickness: 0.15, color: $.value, indeterminate: '' }, null, 8, [
                              'color',
                            ]),
                          ]),
                        ]),
                  ],
                  2,
                ),
              ]),
              _: 3,
            },
            8,
            ['class', 'aria-busy'],
          )
        )
      )
    },
  }),
  My = Q(Fy),
  Ny = { top: [0, 1, 2], left: [0, 3, 6], right: [2, 5, 8], bottom: [6, 7, 8] },
  Ry = ['left', 'right', 'top', 'bottom'],
  zy = (e) => {
    const t = () => [...Ry].sort((o, n) => (e[o].order ?? 0) - (e[n].order ?? 0)),
      a = (o, n, l) => {
        n.forEach((r) => {
          o[r] = l
        })
      }
    return i(() => {
      const o = t(),
        n = ['.', '.', '.', '.', '.', '.', '.', '.', '.'].map(() => 'content')
      return (
        o.forEach((l) => {
          a(n, Ny[l], l)
        }),
        [
          '"' + n.slice(0, 3).join(' ') + '"',
          '"' + n.slice(3, 6).join(' ') + '"',
          '"' + n.slice(6, 9).join(' ') + '"',
        ].join(' ')
      )
    })
  },
  Hy = {
    top: { type: Object, default: () => ({ order: 2 }) },
    right: { type: Object, default: () => ({ order: 1 }) },
    left: { type: Object, default: () => ({ order: 1 }) },
    bottom: { type: Object, default: () => ({ order: 2 }) },
  },
  Mi = 'VaLayout',
  jy = (e) => {
    const t = D({ top: null, right: null, bottom: null, left: null }),
      a = i(() => {
        const { top: n, right: l, bottom: r, left: u } = t.value,
          { top: d, right: c, bottom: v, left: p } = e
        return {
          top: n && !d.absolute ? n.sizes.height : 0,
          right: l && !c.absolute ? l.sizes.width : 0,
          bottom: r && !v.absolute ? r.sizes.height : 0,
          left: u && !p.absolute ? u.sizes.width : 0,
        }
      }),
      o = i(() => ({
        top: e.top.order || 0,
        right: e.right.order || 0,
        bottom: e.bottom.order || 0,
        left: e.left.order || 0,
      }))
    return (Ot(Mi, { items: t, paddings: a, orders: o }), { paddings: a, orders: o, items: t })
  },
  Uy = (e, t) => {
    const a = Lt(Mi, null)
    if (!a) throw new Error('VaLayoutChild must be used inside VaLayout')
    return (
      St(() => {
        t.value ? (a.items.value[e] = { sizes: t.value }) : (a.items.value[e] = null)
      }),
      et(() => {
        a.items.value[e] = null
      }),
      {
        paddings: i(() =>
          Object.keys(a.paddings.value).reduce(
            (o, n) => (a.orders.value[n] > a.orders.value[e] && (o[n] = a.paddings.value[n]), o),
            {},
          ),
        ),
      }
    )
  },
  Wy = {},
  Ky = { class: 'va-layout__absolute-area-wrapper' }
function Gy(e, t) {
  return (C(), _('div', Ky, [V(e.$slots, 'default')]))
}
const qy = Ca(Wy, [['render', Gy]]),
  Yy = G({
    name: 'VaLayoutSizeKeeper',
    __name: 'VaResizeObserver',
    emits: { resize: (e) => !0 },
    setup(e, { emit: t }) {
      const a = t,
        o = D()
      let n = null
      return (
        re(o, (l) => {
          ;(n && n.disconnect(),
            (n = new ResizeObserver(([r]) => {
              a('resize', r.contentRect)
            })),
            n.observe(l))
        }),
        (l, r) => (C(), _('div', { class: 'va-resize-observer', ref_key: 'el', ref: o }, [V(l.$slots, 'default')], 512))
      )
    },
  }),
  yr = G({
    name: 'VaLayoutFixedWrapper',
    __name: 'VaLayoutFixedWrapper',
    props: { area: { type: String, required: !0 } },
    setup(e) {
      const t = e,
        a = D(null),
        o = i(() => (t.area === 'top' || t.area === 'bottom' ? 'vertical' : 'horizontal')),
        n = (u) => (u ? u + 'px' : '0px'),
        l = i(() =>
          o.value === 'vertical'
            ? { width: `calc(100% - ${n(r.value.left)} - ${n(r.value.right)})`, [t.area]: 0 }
            : { height: `calc(100% - ${n(r.value.top)} - ${n(r.value.bottom)})`, [t.area]: 0 },
        ),
        { paddings: r } = Uy(t.area, a)
      return (
        i(() => Object.keys(r.value).reduce((u, d) => (d === t.area ? u : { ...u, [d]: `${r.value[d]}px` }), {})),
        (u, d) => (
          C(),
          _(
            'div',
            {
              class: 'va-layout-fixed-wrapper',
              style: Y([
                [
                  {
                    height: a.value && o.value === 'vertical' ? a.value.height + 'px' : 'auto',
                    width: a.value && o.value === 'horizontal' ? a.value.width + 'px' : 'auto',
                  },
                ],
                `--va-styles-width: ${String(l.value.width)};--va-styles-height: ${String(l.value.height)}`,
              ]),
            },
            [
              ue(
                Yy,
                {
                  class: pe(['va-layout-fixed-wrapper__content', `va-layout-fixed-wrapper__content--${e.area}`]),
                  style: Y(a.value ? {} : { position: 'relative' }),
                  onResize: d[0] || (d[0] = (c) => (a.value = c)),
                },
                { default: z(() => [V(u.$slots, 'default')]), _: 3 },
                8,
                ['class', 'style'],
              ),
            ],
            4,
          )
        )
      )
    },
  }),
  Xy = G({
    name: 'VaLayoutArea',
    __name: 'VaLayoutArea',
    props: { area: { type: String, required: !0 }, config: { type: Object, required: !0 } },
    emits: ['overlay-click'],
    setup(e, { emit: t }) {
      const a = e,
        o = i(() => a.config.absolute || !1),
        n = i(() => a.config.fixed || !1),
        l = i(() => a.config.overlay || !1),
        r = i(() => (a.config.order || 0) + 1)
      return (u, d) => (
        C(),
        _(
          be,
          null,
          [
            o.value
              ? (C(),
                U(
                  qy,
                  {
                    key: 0,
                    style: Y(
                      `--va-props-area: ${String(u.$props.area)};--va-z-index: ${String(r.value)};--va-z-index-1: ${String(r.value - 1)}`,
                    ),
                  },
                  {
                    default: z(() => [
                      R(
                        'div',
                        { class: pe(`va-layout-area va-layout__area va-layout__area--${e.area}`) },
                        [
                          n.value
                            ? (C(),
                              U(yr, { key: 0, area: e.area }, { default: z(() => [V(u.$slots, 'default')]), _: 3 }, 8, [
                                'area',
                              ]))
                            : V(u.$slots, 'default', { key: 1 }),
                        ],
                        2,
                      ),
                    ]),
                    _: 3,
                  },
                  8,
                  ['style'],
                ))
              : (C(),
                _(
                  'div',
                  {
                    key: 1,
                    class: pe(`va-layout-area va-layout__area va-layout__area--${e.area}`),
                    style: Y(
                      `--va-props-area: ${String(u.$props.area)};--va-z-index: ${String(r.value)};--va-z-index-1: ${String(r.value - 1)}`,
                    ),
                  },
                  [
                    n.value
                      ? (C(),
                        U(yr, { key: 0, area: e.area }, { default: z(() => [V(u.$slots, 'default')]), _: 3 }, 8, [
                          'area',
                        ]))
                      : V(u.$slots, 'default', { key: 1 }),
                  ],
                  6,
                )),
            ue(
              Po,
              {
                style: Y(
                  `--va-props-area: ${String(u.$props.area)};--va-z-index: ${String(r.value)};--va-z-index-1: ${String(r.value - 1)}`,
                ),
              },
              {
                default: z(() => [
                  l.value
                    ? (C(),
                      _(
                        'div',
                        {
                          key: 0,
                          class: pe(['va-layout-area__overlay', { 'va-layout-area__overlay--fixed': n.value }]),
                          onClick: d[0] || (d[0] = (c) => u.$emit('overlay-click')),
                        },
                        null,
                        2,
                      ))
                    : E('', !0),
                ]),
                _: 1,
              },
              8,
              ['style'],
            ),
          ],
          64,
        )
      )
    },
  }),
  Jy = { class: 'va-layout__area va-layout__area--content' },
  br = ['top', 'left', 'right', 'bottom'],
  Zy = G({
    name: 'VaLayout',
    __name: 'VaLayout',
    props: { ...Hy, allowBodyScrollOnOverlay: { type: Boolean, default: !1 } },
    emits: ['top-overlay-click', 'left-overlay-click', 'right-overlay-click', 'bottom-overlay-click'],
    setup(e, { emit: t }) {
      const a = e,
        { paddings: o } = jy(a),
        n = i(
          () =>
            !a.allowBodyScrollOnOverlay &&
            br.some((v) => {
              var p
              return (p = a[v]) == null ? void 0 : p.overlay
            }),
        ),
        l = ya()
      St(() => {
        var v
        const p = (v = l.value) == null ? void 0 : v.body
        p && (n.value ? (p.style.overflow = 'hidden') : (p.style.overflow = ''))
      })
      const r = zy(a),
        u = dt(),
        d = i(() => [u.top ? 'min-content' : '0fr', '1fr', u.bottom ? 'min-content' : '0fr'].filter(Boolean).join(' ')),
        c = i(() => [u.left ? 'min-content' : '0fr', '1fr', u.right ? 'min-content' : '0fr'].filter(Boolean).join(' '))
      return (v, p) => (
        C(),
        _(
          'div',
          {
            class: 'va-layout',
            style: Y(
              `--va-horizontal-template: ${String(c.value)};--va-vertical-template: ${String(d.value)};--va-template-area: ${String(s(r))};--va-paddings-top-px: ${s(o).top + 'px'};--va-paddings-bottom-px: ${s(o).bottom + 'px'};--va-paddings-left-px: ${s(o).left + 'px'};--va-paddings-right-px: ${s(o).right + 'px'}`,
            ),
          },
          [
            (C(),
            _(
              be,
              null,
              Ie(br, (f) =>
                ue(
                  Xy,
                  { key: f, area: f, config: v.$props[f] || {}, onOverlayClick: (g) => v.$emit(`${f}-overlay-click`) },
                  { default: z(() => [V(v.$slots, f)]), _: 2 },
                  1032,
                  ['area', 'config', 'onOverlayClick'],
                ),
              ),
              64,
            )),
            R('div', Jy, [V(v.$slots, 'default', {}, () => [V(v.$slots, 'content')])]),
          ],
          4,
        )
      )
    },
  }),
  Qy = Rt(Zy),
  eb = { class: 'va-navbar__left' },
  tb = { class: 'va-navbar__center' },
  ab = { class: 'va-navbar__right' },
  ob = G({
    name: 'VaNavbar',
    __name: 'VaNavbar',
    props: {
      ...qs,
      ...me,
      color: { type: String, default: 'background-secondary' },
      textColor: { type: String },
      shape: { type: Boolean, default: !1 },
      shadowed: { type: Boolean, default: !1 },
      bordered: { type: Boolean, default: !1 },
    },
    setup(e) {
      const t = e,
        { scrollRoot: a, isScrolledDown: o } = Xs(t.fixed),
        { fixedBarStyleComputed: n } = Ys(t, o),
        { getColor: l, shiftHSLAColor: r } = Ce(),
        u = i(() => l(t.color)),
        { textColorComputed: d } = tt(u),
        c = i(() => ({ borderTopColor: r(u.value, { h: -1, s: -11, l: 10 }) })),
        v = i(() => ({ ...n.value, backgroundColor: u.value, color: d.value, fill: d.value })),
        p = Fe('va-navbar', () => ({ shadowed: t.shadowed, bordered: t.bordered }))
      return (f, g) => (
        C(),
        _(
          'header',
          { ref_key: 'scrollRoot', ref: a, class: pe(['va-navbar', s(p)]), style: Y(v.value) },
          [
            V(f.$slots, 'default', {}, () => [
              R('div', eb, [V(f.$slots, 'left')]),
              R('div', tb, [V(f.$slots, 'center')]),
              R('div', ab, [V(f.$slots, 'right')]),
            ]),
            e.shape
              ? (C(), _('div', { key: 0, class: 'va-navbar__background-shape', style: Y(c.value) }, null, 4))
              : E('', !0),
          ],
          6,
        )
      )
    },
  }),
  nb = G({ name: 'VaNavbarItem', props: {} }),
  lb = { class: 'va-navbar__item' }
function rb(e, t, a, o, n, l) {
  return (C(), _('div', lb, [V(e.$slots, 'default')]))
}
const sb = Ca(nb, [['render', rb]]),
  ib = Q(ob),
  ub = Q(sb),
  cb = ['role'],
  db = ['value', 'checked', 'aria-checked', 'onChange'],
  vb = R(
    'span',
    { 'aria-hidden': 'true', class: 'va-radio__icon' },
    [R('span', { class: 'va-radio__icon__background' }), R('span', { class: 'va-radio__icon__dot' })],
    -1,
  ),
  pb = G({
    name: 'VaRadio',
    __name: 'VaRadio',
    props: {
      ...Gn,
      ...me,
      ...Oa,
      modelValue: { type: [Boolean, Array, String, Object, Number], default: null },
      options: { type: Array, default: () => [] },
      name: { type: String, default: '' },
      label: { type: String, default: void 0 },
      leftLabel: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
      option: { type: [Object, String, Number], default: void 0 },
      vertical: { type: Boolean, default: !1 },
    },
    emits: Ro,
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { getColor: n } = Ce(),
        l = { container: we(), input: we(), label: we() },
        { computedError: r, computedErrorMessages: u, onBlur: d, onFocus: c } = qn(a, o, l),
        { getText: v, getDisabled: p, getValue: f } = xa(a),
        g = (B) => (a.options.length > 0 ? v(B) : (a.label ?? v(B))),
        y = (B) => p(B) || a.disabled,
        m = i(() => a.options.length === 0 && !a.option),
        b = (B) => (m.value ? a.modelValue : a.modelValue === f(B)),
        h = i(() => (m.value ? [{}] : a.option ? [a.option] : a.options)),
        $ = (B) => ({
          'va-radio--left-label': a.leftLabel,
          'va-radio--selected': b(B),
          'va-radio--readonly': a.readonly,
          'va-radio--disabled': a.disabled,
          'va-radio--indeterminate': a.indeterminate,
          'va-radio--error': r.value,
          'va-radio--single-option': m.value,
        }),
        S = (B, K) => {
          var L
          if (m.value) {
            o('update:modelValue', ((L = K == null ? void 0 : K.target) == null ? void 0 : L.checked) || !1)
            return
          }
          o('update:modelValue', B)
        },
        w = i(() => ({ color: r.value ? n('danger') : '' }))
      i(() => {
        const B = { background: n(a.color), borderColor: n(a.color) }
        return (r.value && (B.borderColor = n('danger')), B)
      })
      const I = i(() => ({ backgroundColor: n(a.color) })),
        A = i(() => ({ borderColor: r.value ? n('danger') : n(a.color), backgroundColor: n(a.color) })),
        k = i(() => ({ borderColor: r.value ? n('danger') : n(a.color) })),
        T = Dt(),
        O = i(() => a.name || T),
        M = (B) => {
          const K = y(B)
          return { name: O.value, disabled: K, readonly: a.readonly, tabindex: K ? -1 : 0 }
        },
        ae = i(() => (a.vertical ? 'column' : 'row')),
        oe = i(() => {
          var B
          return ((B = a.options) == null ? void 0 : B.length) > 0 ? 'radiogroup' : ''
        })
      return (B, K) => (
        C(),
        U(
          s(xo),
          {
            disabled: B.disabled,
            success: B.success,
            messages: B.messages,
            error: s(r),
            'error-messages': s(u),
            'error-count': B.errorCount,
            onBlur: s(d),
            style: Y(
              `--va-flex-direction: ${String(ae.value)};--va-label-style-color: ${String(w.value.color)};--va-icon-computed-styles-border-color: ${String(k.value.borderColor)};--va-icon-dot-computed-styles-border-color: ${String(A.value.borderColor)};--va-icon-dot-computed-styles-background-color: ${String(A.value.backgroundColor)};--va-icon-background-computed-styles-background-color: ${String(I.value.backgroundColor)}`,
            ),
          },
          {
            default: z(({ ariaAttributes: L }) => [
              R(
                'div',
                H({ ref: 'container', class: 'va-radio', role: oe.value }, L),
                [
                  (C(!0),
                  _(
                    be,
                    null,
                    Ie(
                      h.value,
                      (x, N) => (
                        C(),
                        _(
                          'label',
                          { key: N, class: pe([$(x), 'va-radio__square']) },
                          [
                            R(
                              'input',
                              H(
                                {
                                  ref_for: !0,
                                  ref: 'input',
                                  class: 'va-radio__input',
                                  type: 'radio',
                                  role: 'radio',
                                  value: b(x),
                                  checked: b(x),
                                  'aria-checked': b(x),
                                },
                                { ...M(x), ...L },
                                {
                                  onChange: (P) => S(s(f)(x), P),
                                  onFocus: K[0] || (K[0] = (...P) => s(c) && s(c)(...P)),
                                  onBlur: K[1] || (K[1] = (...P) => s(d) && s(d)(...P)),
                                },
                              ),
                              null,
                              16,
                              db,
                            ),
                            V(B.$slots, 'icon', J(ie({ value: b(x), text: g(x), disabled: y(x), index: N })), () => [
                              vb,
                            ]),
                            g(x) || B.$slots.default
                              ? (C(),
                                _(
                                  'div',
                                  { key: 0, ref_for: !0, ref: 'label', class: 'va-radio__text' },
                                  [
                                    V(
                                      B.$slots,
                                      'default',
                                      J(ie({ value: b(x), text: g(x), disabled: y(x), index: N })),
                                      () => [Te(fe(g(x)), 1)],
                                    ),
                                  ],
                                  512,
                                ))
                              : E('', !0),
                          ],
                          2,
                        )
                      ),
                    ),
                    128,
                  )),
                ],
                16,
                cb,
              ),
            ]),
            _: 3,
          },
          8,
          ['disabled', 'success', 'messages', 'error', 'error-messages', 'error-count', 'onBlur', 'style'],
        )
      )
    },
  }),
  Ni = Q(pb),
  fb = { class: 'va-switch__inner' },
  mb = { class: 'va-switch__checker-wrapper' },
  gb = { class: 'va-switch__checker' },
  yb = { class: 'va-switch__checker-circle' },
  bb = ['id'],
  hb = G({
    name: 'VaSwitch',
    __name: 'VaSwitch',
    props: {
      ...Gn,
      ...me,
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      modelValue: { type: [Number, Boolean, Array, String, Object], default: !1 },
      trueLabel: { type: String, default: null },
      falseLabel: { type: String, default: null },
      trueInnerLabel: { type: String, default: null },
      falseInnerLabel: { type: String, default: null },
      ariaLabel: ye('$t:switch'),
      color: { type: String, default: 'primary' },
      offColor: { type: String, default: 'background-element' },
      size: { type: String, default: 'medium', validator: (e) => ['medium', 'small', 'large'].includes(e) },
    },
    emits: [...Ro, 'focus', 'blur', 'update:modelValue'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = { container: we(), input: we(), label: we() },
        { getColor: r } = Ce(),
        { hasKeyboardFocus: u, keyboardFocusListeners: d } = Ea(),
        {
          isChecked: c,
          computedError: v,
          isIndeterminate: p,
          computedErrorMessages: f,
          validationAriaAttributes: g,
          toggleSelection: y,
          onBlur: m,
          onFocus: b,
          reset: h,
          focus: $,
          isDirty: S,
          isTouched: w,
          isLoading: I,
          isError: A,
        } = qn(o, n, l),
        k = i(() => r(c.value ? o.color : o.offColor)),
        { textColorComputed: T } = tt(k),
        O = i(() =>
          o.trueInnerLabel && c.value ? o.trueInnerLabel : o.falseInnerLabel && !c.value ? o.falseInnerLabel : '',
        ),
        M = i(() => (o.trueLabel && c.value ? o.trueLabel : o.falseLabel && !c.value ? o.falseLabel : o.label)),
        ae = Fe('va-switch', () => ({
          ...Ge(o, ['readonly', 'disabled', 'leftLabel']),
          checked: c.value,
          indeterminate: p.value,
          small: o.size === 'small',
          large: o.size === 'large',
          error: v.value,
          keyboardFocus: u.value,
        })),
        oe = i(() => ({ lineHeight: f.value.length ? 1 : 0 })),
        B = i(() => ({ small: '15px', medium: '20px', large: '25px' })[o.size]),
        K = i(() => ({ borderColor: v.value ? r('danger') : '', backgroundColor: k.value })),
        L = i(() => ({ color: v.value ? r('danger') : '' })),
        x = i(() => ({ color: T.value, 'text-align': c.value ? 'left' : 'right' })),
        N = dt(),
        P = Dt(),
        te = i(() => `aria-label-id-${P}`),
        X = i(() => ({
          id: o.id || void 0,
          name: o.name || void 0,
          disabled: o.disabled,
          readonly: o.readonly,
          'aria-disabled': o.disabled,
          'aria-readonly': o.readonly,
          'aria-checked': !!o.modelValue,
          'aria-label': N.default ? void 0 : o.ariaLabel,
          'aria-labelledby': M.value || N.default ? te.value : void 0,
          tabindex: o.disabled ? -1 : 0,
          checked: c.value,
          ...g.value,
        })),
        ce = () => {
          var de
          ;(de = l.input.value) == null || de.click()
        },
        ke = l.input
      return (
        t({ focus: $, reset: h, isDirty: S, isTouched: w, isLoading: I, isError: A }),
        (de, F) => (
          C(),
          U(
            s(xo),
            {
              class: pe(['va-switch', s(ae)]),
              style: Y(oe.value),
              disabled: de.$props.disabled,
              success: de.$props.success,
              messages: de.$props.messages,
              error: s(v),
              'error-messages': s(f),
              'error-count': de.$props.errorCount,
            },
            {
              default: z(() => [
                R(
                  'div',
                  {
                    ref: 'container',
                    class: 'va-switch__container',
                    tabindex: '-1',
                    onBlur: F[5] || (F[5] = (...le) => s(m) && s(m)(...le)),
                    onClick: F[6] || (F[6] = (...le) => s(y) && s(y)(...le)),
                  },
                  [
                    R('div', fb, [
                      R(
                        'input',
                        H(
                          { ref_key: 'input', ref: ke, type: 'checkbox', class: 'va-switch__input', role: 'switch' },
                          X.value,
                          wt(s(d), !0),
                          {
                            onFocus: F[0] || (F[0] = (...le) => s(b) && s(b)(...le)),
                            onBlur: F[1] || (F[1] = (...le) => s(m) && s(m)(...le)),
                            onKeypress: se(ce, ['enter']),
                          },
                        ),
                        null,
                        16,
                      ),
                      R(
                        'div',
                        { class: 'va-switch__track', 'aria-hidden': 'true', style: Y(K.value) },
                        [
                          O.value || de.$slots.innerLabel
                            ? (C(),
                              _(
                                'div',
                                { key: 0, class: 'va-switch__track-label', style: Y(x.value) },
                                [V(de.$slots, 'innerLabel', {}, () => [Te(fe(O.value), 1)])],
                                4,
                              ))
                            : E('', !0),
                          R('div', mb, [
                            R('div', gb, [
                              V(de.$slots, 'checker', J(ie({ value: s(c) })), () => [
                                R('div', yb, [
                                  de.$props.loading
                                    ? (C(),
                                      U(
                                        s(Aa),
                                        { key: 0, indeterminate: '', size: B.value, color: K.value.backgroundColor },
                                        null,
                                        8,
                                        ['size', 'color'],
                                      ))
                                    : E('', !0),
                                ]),
                              ]),
                            ]),
                          ]),
                        ],
                        4,
                      ),
                    ]),
                    M.value || de.$slots.default
                      ? (C(),
                        _(
                          'div',
                          {
                            key: 0,
                            ref: 'label',
                            class: 'va-switch__label',
                            style: Y(L.value),
                            id: te.value,
                            onBlur: F[2] || (F[2] = (...le) => s(m) && s(m)(...le)),
                            onClick: F[3] || (F[3] = (...le) => s(y) && s(y)(...le)),
                            onKeydown:
                              F[4] ||
                              (F[4] = se(
                                ne((...le) => s(y) && s(y)(...le), ['stop']),
                                ['enter'],
                              )),
                          },
                          [V(de.$slots, 'default', {}, () => [Te(fe(M.value), 1)])],
                          44,
                          bb,
                        ))
                      : E('', !0),
                  ],
                  544,
                ),
              ]),
              _: 3,
            },
            8,
            ['class', 'style', 'disabled', 'success', 'messages', 'error', 'error-messages', 'error-count'],
          )
        )
      )
    },
  }),
  Ri = Q(hb),
  Go = () => {
    const e = we([]),
      t = (o) => {
        o && e.value.push(o)
      },
      a = (o) => (n) => {
        n && (e.value[o] = n)
      }
    return (
      Hr(() => {
        e.value = []
      }),
      { itemRefs: e, setItemRef: t, setItemRefByIndex: a }
    )
  },
  Cb = { class: 'va-option-list__list' },
  Sb = G({
    name: 'VaOptionList',
    __name: 'VaOptionList',
    props: {
      ...me,
      ...Oa,
      ...zt,
      ...Qe,
      type: { type: String, default: 'checkbox', validator: (e) => ['radio', 'checkbox', 'switch'].includes(e) },
      disabled: { type: Boolean, default: !1 },
      readonly: { type: Boolean, default: !1 },
      defaultValue: { type: [String, Number, Boolean, Object, Array] },
      name: { type: String, default: '' },
      color: { type: String, default: 'primary' },
      leftLabel: { type: Boolean, default: !1 },
      modelValue: { type: [String, Number, Boolean, Object, Array] },
    },
    emits: [...lt, ...Xt, 'clear'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { valueComputed: l } = Ke(o, n, 'modelValue', { defaultValue: o.defaultValue }),
        { getValue: r, getText: u, getTrackBy: d, getDisabled: c } = xa(o),
        { itemRefs: v, setItemRef: p } = Go(),
        f = i(() => o.type === 'radio'),
        g = i({
          get() {
            const A = f.value ? null : []
            return l.value || A
          },
          set(A) {
            o.readonly ||
              (f.value && !Array.isArray(A)
                ? (l.value = A && r(A))
                : (l.value = Array.isArray(A) ? A.map(r) : [A && r(A)]))
          },
        }),
        y = (A) => o.disabled || c(A),
        m = () =>
          S(() => {
            ;((l.value = null), n('clear'), w())
          }),
        b = () => {
          const A = Array.isArray(v.value) && v.value.find((k) => !k.disabled)
          A && typeof A.focus == 'function' && A.focus()
        },
        {
          computedError: h,
          computedErrorMessages: $,
          withoutValidation: S,
          resetValidation: w,
        } = Ht(o, n, { reset: m, focus: b, value: l }),
        I = i(() => Ge(o, ['name', 'color', 'readonly', 'leftLabel']))
      return (
        Me(() => {
          Pa &&
            o.type !== 'radio' &&
            !Array.isArray(o.modelValue) &&
            console.warn(`Prop 'modelValue = ${o.modelValue}' has not a proper type!
 For component property 'type = ${o.type}' it must be of type 'array'.`)
        }),
        t({ focus: b, reset: m }),
        (A, k) => (
          C(),
          U(
            s(xo),
            { error: s(h), 'error-messages': s($), 'error-count': A.$props.errorCount },
            {
              default: z(() => [
                R('ul', Cb, [
                  (C(!0),
                  _(
                    be,
                    null,
                    Ie(
                      A.$props.options,
                      (T) => (
                        C(),
                        _('li', { key: s(d)(T) }, [
                          V(
                            A.$slots,
                            'default',
                            J(ie({ option: T, selectedValue: g.value, isDisabled: y, getText: s(u), getValue: s(r) })),
                            () => [
                              A.$props.type === 'radio'
                                ? (C(),
                                  U(
                                    s(Ni),
                                    H(
                                      {
                                        key: 0,
                                        ref_for: !0,
                                        ref: s(p),
                                        modelValue: g.value,
                                        'onUpdate:modelValue': k[0] || (k[0] = (O) => (g.value = O)),
                                        label: s(u)(T),
                                        disabled: y(T),
                                        option: s(r)(T),
                                      },
                                      I.value,
                                    ),
                                    null,
                                    16,
                                    ['modelValue', 'label', 'disabled', 'option'],
                                  ))
                                : A.$props.type === 'checkbox'
                                  ? (C(),
                                    U(
                                      s(oo),
                                      H(
                                        {
                                          key: 1,
                                          ref_for: !0,
                                          ref: s(p),
                                          modelValue: g.value,
                                          'onUpdate:modelValue': k[1] || (k[1] = (O) => (g.value = O)),
                                          label: s(u)(T),
                                          disabled: y(T),
                                          'array-value': s(r)(T),
                                        },
                                        I.value,
                                      ),
                                      null,
                                      16,
                                      ['modelValue', 'label', 'disabled', 'array-value'],
                                    ))
                                  : (C(),
                                    U(
                                      s(Ri),
                                      H(
                                        {
                                          key: 2,
                                          ref_for: !0,
                                          ref: s(p),
                                          modelValue: g.value,
                                          'onUpdate:modelValue': k[2] || (k[2] = (O) => (g.value = O)),
                                          label: s(u)(T),
                                          disabled: y(T),
                                          'array-value': s(r)(T),
                                        },
                                        I.value,
                                      ),
                                      null,
                                      16,
                                      ['modelValue', 'label', 'disabled', 'array-value'],
                                    )),
                            ],
                          ),
                        ])
                      ),
                    ),
                    128,
                  )),
                ]),
              ]),
              _: 3,
            },
            8,
            ['error', 'error-messages', 'error-count'],
          )
        )
      )
    },
  }),
  $b = Q(Sb),
  kb = (e = 1, t, a, o = !1) => {
    let n = 0
    if ((a === 0 && (a = 1), t > a && (t = a), t === 0)) ((n = 1), (t = a > 10 ? 10 : a))
    else {
      const r = t / 2
      e - r <= 0 || e > a ? (n = 1) : (n = e + r > a ? a - t + 1 : Math.ceil(e - r))
    }
    const l = []
    for (let r = 0; r < t; r++) l.push(n + r)
    return (
      o && t < 7
        ? a >= 7 &&
          De(
            '[va-pagination] To work in a proper way, the `boundaryNumbers` prop needs at least 7 visible pages to be set via the `visiblePages` prop (first, last, 2 boundaries, current, previous, next).',
          )
        : o && (n !== 1 && l.splice(0, 2, 1, '...'), l[l.length - 1] !== a && l.splice(-2, 2, '...', a)),
      l
    )
  },
  wb = ['aria-label', 'onKeydown'],
  _b = ['aria-label'],
  Vb = G({
    name: 'VaPagination',
    __name: 'VaPagination',
    props: {
      ...Qe,
      ...me,
      modelValue: { type: Number, default: 1 },
      visiblePages: { type: [Number, String], default: 0 },
      pages: { type: [Number, String], default: 0 },
      disabled: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
      size: { type: String, default: 'medium', validator: (e) => ['small', 'medium', 'large'].includes(e) },
      boundaryLinks: { type: Boolean, default: !0 },
      boundaryNumbers: { type: Boolean, default: !1 },
      directionLinks: { type: Boolean, default: !0 },
      input: { type: Boolean, default: !1 },
      hideOnSinglePage: { type: Boolean, default: !1 },
      total: { type: [Number, String], default: null },
      pageSize: { type: [Number, String], default: null },
      boundaryIconLeft: { type: String, default: 'va-arrow-first' },
      boundaryIconRight: { type: String, default: 'va-arrow-last' },
      directionIconLeft: { type: String, default: 'va-arrow-left' },
      directionIconRight: { type: String, default: 'va-arrow-right' },
      gapped: { type: Boolean, default: !1 },
      borderColor: { type: String, default: '' },
      rounded: { type: Boolean, default: !1 },
      activePageColor: { type: String, default: '' },
      activeButtonProps: { type: Object, default: () => ({}) },
      buttonProps: { type: Object, default: () => ({}) },
      buttonsPreset: { type: String, default: 'primary' },
      ariaLabel: ye('$t:pagination'),
      ariaGoToTheFirstPageLabel: ye('$t:goToTheFirstPage'),
      ariaGoToPreviousPageLabel: ye('$t:goToPreviousPage'),
      ariaGoToSpecificPageLabel: ye('$t:goToSpecificPage'),
      ariaGoToSpecificPageInputLabel: ye('$t:goToSpecificPageInput'),
      ariaGoToNextPageLabel: ye('$t:goNextPage'),
      ariaGoToLastPageLabel: ye('$t:goLastPage'),
    },
    emits: [...lt],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        r = D(''),
        u = i(() => !!((f.value || f.value === 0) && g.value)),
        { valueComputed: d } = Ke(o, n),
        c = i({
          get: () => (u.value ? Math.ceil(d.value / g.value) || 1 : d.value),
          set: (F) => {
            d.value = F
          },
        }),
        v = Pe('visiblePages'),
        p = Pe('pages'),
        f = Pe('total'),
        g = Pe('pageSize'),
        y = i(() => {
          const { boundaryNumbers: F } = o,
            le = c.value || 1,
            ve = u.value ? Math.ceil(f.value / g.value) : p.value
          return kb(le, v.value, ve, F)
        }),
        m = i(() => (u.value ? Math.ceil(f.value / g.value) || 1 : +p.value)),
        b = i(() => (!!v.value && m.value > v.value) || o.input),
        h = i(() => {
          const { boundaryLinks: F, boundaryNumbers: le } = o
          return b.value && F && !le
        }),
        $ = i(() => b.value && o.directionLinks),
        S = i(() => m.value > 1 || (!o.hideOnSinglePage && m.value <= 1)),
        w = () => {
          ;((r.value = String(c.value)),
            Ye(() => {
              var F
              return (F = l.value) == null ? void 0 : F.setSelectionRange(0, l.value.value.length)
            }))
        },
        { setItemRefByIndex: I, itemRefs: A } = Go(),
        k = (F) => {
          var le
          if (F === '...' || F === c.value) return
          const ve = da(F, 1, m.value)
          ;((c.value = u.value ? (ve - 1) * g.value + 1 : ve), (le = A.value[F - 1]) == null || le.focus())
        },
        T = () => {
          var F
          ;((r.value = ''), (F = l.value) == null || F.blur())
        },
        O = () => {
          if ((+r.value === c.value && T(), !r.value.length)) return
          let F = Number.parseInt(r.value)
          switch (!0) {
            case F < 1:
              F = 1
              break
            case F > m.value:
              F = m.value
              break
            case isNaN(F):
              F = c.value
              break
          }
          ;(k(F), T())
        },
        { getColor: M, colorToRgba: ae } = Ce(),
        oe = i(() => {
          const { color: F, buttonsPreset: le } = Tt(o)
          if (!F.value) return 'transparent'
          switch (le.value) {
            case 'default':
              return M(F.value)
            case void 0:
            case 'primary':
              return ae(M(F.value), 0.1)
            default:
              return 'transparent'
          }
        }),
        B = i(() => ({ cursor: 'default', color: M(o.color), opacity: o.disabled ? 0.4 : 1, borderColor: oe.value }))
      re([u, () => p.value], () => {
        if (Pa && u.value && p.value) throw new Error('Please, use either `total` and `page-size` props, or `pages`.')
      })
      const K = i(() => ({ disabled: o.disabled, placeholder: `${c.value}/${m.value}` })),
        L = i(() => ({
          size: o.size,
          preset: o.buttonsPreset,
          color: o.color,
          borderColor: o.borderColor,
          round: o.rounded,
          ...o.buttonProps,
        })),
        x = i(() => ({
          preset: o.buttonsPreset === 'default' ? 'primary' : 'default',
          color: o.activePageColor || o.color,
          ...o.activeButtonProps,
        })),
        N = (F) => (!isNaN(+F) && F === c.value ? Object.assign({}, L.value, x.value) : L.value),
        P = i(() => o.input && !o.boundaryLinks && !o.directionLinks),
        te = Fe('va-pagination__input', () => ({
          sm: o.size === 'small' && P.value,
          md: o.size === 'medium' && P.value,
          lg: o.size === 'large' && P.value,
          auto: !P.value,
        })),
        X = Fe('va-pagination', () => ({ ...Ge(o, ['gapped', 'rounded', 'disabled']), bordered: !!o.borderColor })),
        ce = () => k(c.value + 1),
        ke = () => k(c.value - 1),
        { tp: de } = He()
      return (
        t({ goNextPage: ce, goPrevPage: ke }),
        (F, le) =>
          S.value
            ? (C(),
              _(
                'nav',
                {
                  key: 0,
                  class: pe(['va-pagination', s(X)]),
                  'aria-label': s(de)(F.$props.ariaLabel),
                  onKeydown: [
                    se(ne(ke, ['stop']), ['left']),
                    se(ne(ce, ['stop']), ['right']),
                    se(ne(ke, ['stop']), ['up']),
                    se(ne(ce, ['stop']), ['down']),
                  ],
                },
                [
                  h.value
                    ? V(
                        F.$slots,
                        'firstPageLink',
                        J(H({ key: 0 }, { onClick: () => k(1), disabled: F.$props.disabled || c.value === 1 })),
                        () => [
                          h.value
                            ? (C(),
                              U(
                                s(xe),
                                H(
                                  {
                                    key: 0,
                                    'aria-label': s(de)(F.$props.ariaGoToTheFirstPageLabel),
                                    disabled: F.$props.disabled || c.value === 1,
                                    icon: F.$props.boundaryIconLeft,
                                  },
                                  L.value,
                                  { onClick: le[0] || (le[0] = (ve) => k(1)) },
                                ),
                                null,
                                16,
                                ['aria-label', 'disabled', 'icon'],
                              ))
                            : E('', !0),
                        ],
                      )
                    : E('', !0),
                  $.value
                    ? V(
                        F.$slots,
                        'prevPageLink',
                        J(H({ key: 1 }, { onClick: ke, disabled: F.$props.disabled || c.value === 1 })),
                        () => [
                          $.value
                            ? (C(),
                              U(
                                s(xe),
                                H(
                                  {
                                    key: 0,
                                    'aria-label': s(de)(F.$props.ariaGoToPreviousPageLabel),
                                    disabled: F.$props.disabled || c.value === 1,
                                    icon: F.$props.directionIconLeft,
                                  },
                                  L.value,
                                  { onClick: ke },
                                ),
                                null,
                                16,
                                ['aria-label', 'disabled', 'icon'],
                              ))
                            : E('', !0),
                        ],
                      )
                    : E('', !0),
                  F.$props.input
                    ? Bt(
                        (C(),
                        _(
                          'input',
                          H(
                            {
                              key: 3,
                              'onUpdate:modelValue': le[1] || (le[1] = (ve) => (r.value = ve)),
                              ref_key: 'htmlInput',
                              ref: l,
                              class: ['va-pagination__input va-button', s(te)],
                              'aria-label': s(de)(F.$props.ariaGoToSpecificPageInputLabel),
                              style: B.value,
                            },
                            K.value,
                            { onKeydown: se(O, ['enter']), onFocus: w, onBlur: O },
                          ),
                          null,
                          16,
                          _b,
                        )),
                        [[Ao, r.value]],
                      )
                    : V(F.$slots, 'default', { key: 2 }, () => [
                        (C(!0),
                        _(
                          be,
                          null,
                          Ie(
                            y.value,
                            (ve, W) => (
                              C(),
                              U(
                                s(xe),
                                H(
                                  {
                                    key: W,
                                    ref_for: !0,
                                    ref: s(I)(W),
                                    class: {
                                      'va-button--ellipsis': ve === '...',
                                      'va-button--current': ve === c.value,
                                    },
                                    'aria-label': s(de)(F.$props.ariaGoToSpecificPageLabel, { page: ve }),
                                    'aria-current': ve === c.value,
                                    disabled: F.$props.disabled || ve === '...',
                                  },
                                  N(ve),
                                  { onClick: (j) => k(ve) },
                                ),
                                { default: z(() => [Te(fe(ve), 1)]), _: 2 },
                                1040,
                                ['class', 'aria-label', 'aria-current', 'disabled', 'onClick'],
                              )
                            ),
                          ),
                          128,
                        )),
                      ]),
                  $.value
                    ? V(
                        F.$slots,
                        'nextPageLink',
                        J(H({ key: 4 }, { onClick: ce, disabled: F.$props.disabled || c.value === m.value })),
                        () => [
                          $.value
                            ? (C(),
                              U(
                                s(xe),
                                H(
                                  {
                                    key: 0,
                                    'aria-label': s(de)(F.$props.ariaGoToNextPageLabel),
                                    disabled: F.$props.disabled || c.value === m.value,
                                    icon: F.$props.directionIconRight,
                                  },
                                  L.value,
                                  { onClick: ce },
                                ),
                                null,
                                16,
                                ['aria-label', 'disabled', 'icon'],
                              ))
                            : E('', !0),
                        ],
                      )
                    : E('', !0),
                  h.value
                    ? V(
                        F.$slots,
                        'lastPageLink',
                        J(
                          H(
                            { key: 5 },
                            { onClick: () => k(m.value), disabled: F.$props.disabled || c.value === m.value },
                          ),
                        ),
                        () => [
                          h.value
                            ? (C(),
                              U(
                                s(xe),
                                H(
                                  {
                                    key: 0,
                                    'aria-label': s(de)(F.$props.ariaGoToLastPageLabel),
                                    disabled: F.$props.disabled || c.value === m.value,
                                    icon: F.$props.boundaryIconRight,
                                  },
                                  L.value,
                                  { onClick: le[2] || (le[2] = (ve) => k(m.value)) },
                                ),
                                null,
                                16,
                                ['aria-label', 'disabled', 'icon'],
                              ))
                            : E('', !0),
                        ],
                      )
                    : E('', !0),
                ],
                42,
                wb,
              ))
            : E('', !0)
      )
    },
  }),
  Bb = Q(Vb),
  Tb = () => {
    const e = Eo(),
      t = new Proxy(e.value || {}, {
        get: (o, n, l) => {
          var r, u
          if (n === 'scrollTop') return (r = e.value) == null ? void 0 : r.scrollY
          if (n === 'scrollLeft') return (u = e.value) == null ? void 0 : u.scrollX
          const d = Reflect.get(o, n, l)
          return typeof d == 'function' ? d.bind(o) : d
        },
      }),
      a = (o) => (o ? (o.scrollHeight > o.clientHeight ? o : a(o.parentElement)) : t)
    return { getScrollableParent: a }
  },
  Ib = { class: 'va-parallax__image-container' },
  Pb = ['src', 'alt'],
  Ab = { class: 'va-parallax__item-container' },
  Lb = G({
    name: 'VaParallax',
    __name: 'VaParallax',
    props: {
      ...me,
      target: { type: [Object, String] },
      src: { type: String, default: '', required: !0 },
      alt: { type: String, default: 'parallax' },
      height: { type: [Number, String], default: 400 },
      reversed: { type: Boolean, default: !1 },
      speed: {
        type: [Number, String],
        default: 0.5,
        validator: (e) => {
          const t = Number(e)
          return t >= 0 && t <= 1
        },
      },
    },
    setup(e) {
      const t = e,
        a = we(),
        o = we(),
        n = D(0),
        l = D(0),
        r = D(0),
        u = D(0),
        d = D(0),
        c = D(0),
        v = D(0),
        p = D(!1),
        f = i(() => ({ height: h.value + 'px' })),
        g = i(() => ({
          display: 'block',
          transform: `translate(-50%, ${l.value}px)`,
          opacity: p.value ? 1 : 0,
          top: t.reversed ? 0 : 'auto',
        })),
        { getScrollableParent: y } = Tb(),
        m = i(() => {
          var T
          if (!t.target) return y((T = a.value) == null ? void 0 : T.parentElement)
          if (t.target instanceof HTMLElement) return t.target
          const O = document.querySelector(t.target)
          return O || (De('VaParallax target prop got wrong selector. Target is null'), null)
        }),
        b = i(() => {
          var T
          return ((T = o.value) == null ? void 0 : T.naturalHeight) || 0
        }),
        h = Pe('height'),
        $ = Pe('speed'),
        S = () => {
          var T, O
          const M = ((T = a.value) == null ? void 0 : T.getBoundingClientRect()) || { top: 0 }
          ;((d.value = ((O = m.value) == null ? void 0 : O.scrollTop) || 0),
            (r.value = b.value - h.value),
            (n.value = M.top + d.value),
            (c.value = window.innerHeight),
            (v.value = d.value + c.value))
        },
        w = () => {
          ;(S(),
            (u.value = (v.value - n.value) / (h.value + c.value)),
            (l.value = Math.round(r.value * u.value) * $.value),
            t.reversed && (l.value = -l.value))
        },
        I = () => {
          var T, O
          ;((T = m.value) == null || T.addEventListener('scroll', w),
            (O = m.value) == null || O.addEventListener('resize', w))
        },
        A = () => {
          var T, O
          ;((T = m.value) == null || T.removeEventListener('scroll', w),
            (O = m.value) == null || O.removeEventListener('resize', w))
        }
      return (
        Me(() => {
          var T, O
          ;((T = o.value) != null && T.complete
            ? (w(), I())
            : (O = o.value) == null ||
              O.addEventListener(
                'load',
                () => {
                  ;(w(), I())
                },
                !1,
              ),
            (p.value = !0))
        }),
        et(A),
        (T, O) => (
          C(),
          _(
            'div',
            { ref_key: 'rootElement', ref: a, class: 'va-parallax', style: Y(f.value) },
            [
              R('div', Ib, [
                R(
                  'img',
                  {
                    ref_key: 'img',
                    ref: o,
                    class: 'va-parallax__image',
                    src: T.$props.src,
                    alt: T.$props.alt,
                    style: Y(g.value),
                  },
                  null,
                  12,
                  Pb,
                ),
              ]),
              R('div', Ab, [V(T.$slots, 'default')]),
            ],
            4,
          )
        )
      )
    },
  }),
  Ob = Q(Lb),
  xb = { key: 0, 'aria-hidden': 'true', class: 'va-popover__icon' },
  Eb = { key: 1 },
  Db = { key: 0, class: 'va-popover__title' },
  Fb = { key: 1, class: 'va-popover__body' },
  pn = Ee(Ct, ['closeOnClickOutside']),
  Mb = G({
    name: 'VaPopover',
    __name: 'VaPopover',
    props: {
      ...pn,
      ...me,
      trigger: { ...pn.trigger, default: ['hover', 'enter', 'space', 'arrow-down', 'arrow-up'] },
      color: { type: String, default: '#1b1a1f' },
      textColor: { type: String },
      icon: { type: String, default: '' },
      title: { type: String, default: '' },
      message: { type: String, default: '' },
      autoHide: { type: Boolean, default: !0 },
      offset: { type: [Array, Number], default: 4 },
      contentClass: { type: String, default: '' },
    },
    setup(e) {
      const t = e,
        a = ze(pn),
        { getColor: o, getBoxShadowColor: n } = Ce(),
        l = dt(),
        { textColorComputed: r } = tt(i(() => o(t.color))),
        u = i(() => t.icon || l.icon),
        d = i(() => t.title || l.title),
        c = i(() => t.message || l.body),
        v = i(() => d.value || c.value),
        p = i(() => ({
          boxShadow: `var(--va-popover-content-box-shadow) ${n(o(t.color))}`,
          backgroundColor: o(t.color),
          color: r.value,
        }))
      return (f, g) => (
        C(),
        U(
          s(Ct),
          H(s(a), {
            'model-value': f.modelValue,
            'close-on-click-outside': e.autoHide,
            offset: f.$props.offset,
            'content-class': f.$props.contentClass,
            class: 'va-popover',
          }),
          {
            default: z(() => [
              R(
                'div',
                { style: Y(p.value), class: 'va-popover__content', role: 'tooltip' },
                [
                  u.value
                    ? (C(),
                      _('div', xb, [
                        V(f.$slots, 'icon', {}, () => [
                          ue(s(Oe), { name: f.$props.icon, color: s(r) }, null, 8, ['name', 'color']),
                        ]),
                      ]))
                    : E('', !0),
                  v.value
                    ? (C(),
                      _('div', Eb, [
                        d.value
                          ? (C(), _('div', Db, [V(f.$slots, 'title', {}, () => [Te(fe(f.$props.title), 1)])]))
                          : E('', !0),
                        c.value
                          ? (C(), _('div', Fb, [V(f.$slots, 'body', {}, () => [Te(fe(f.$props.message), 1)])]))
                          : E('', !0),
                      ]))
                    : E('', !0),
                ],
                4,
              ),
            ]),
            anchor: z(() => [V(f.$slots, 'default')]),
            _: 3,
          },
          16,
          ['model-value', 'close-on-click-outside', 'offset', 'content-class'],
        )
      )
    },
  }),
  Nb = Q(Mb)
var nt = ((e) => ((e[(e.EMPTY = 0)] = 'EMPTY'), (e[(e.HALF = 0.5)] = 'HALF'), (e[(e.FULL = 1)] = 'FULL'), e))(nt || {})
const Rb = () => {
    const e = qe()
    if (!e) throw new Error('useRating hooks must be used on top of setup function')
    return { props: e.props, emit: e.emit }
  },
  zb = {
    ...Qe,
    modelValue: { type: Number, default: 0 },
    clearable: { type: Boolean, default: !1 },
    hover: { type: Boolean, default: !1 },
  },
  Hb = (e) => {
    const { emit: t } = Rb(),
      { isHovered: a, onMouseEnter: o, onMouseLeave: n } = ao(),
      { valueComputed: l } = Ke(e, t),
      r = D(0),
      u = i(() => (!e.disabled && !e.readonly && e.hover && a.value ? r.value : l.value))
    return {
      visibleValue: u,
      modelValue: l,
      hoveredValue: r,
      isHovered: a,
      onMouseEnter: o,
      onMouseLeave: n,
      onItemValueUpdate: (p, f) => {
        const g = p + f
        if (e.clearable && l.value === g) {
          l.value = 0
          return
        }
        l.value = g
      },
      onItemHoveredValueUpdate: (p, f) => {
        e.hover && (r.value = p + f)
      },
      getItemValue: (p) => {
        const f = u.value - p
        return da(f, nt.EMPTY, nt.FULL)
      },
    }
  },
  zi = { unselectedColor: { type: String }, color: { type: String, default: 'primary' }, modelValue: { type: Number } },
  Hi = (e) => {
    const { getColor: t, getFocusColor: a, getTextColor: o } = Ce(),
      n = i(() => t(e.color)),
      l = i(() => (e.unselectedColor ? t(e.unselectedColor) : a(t(e.color)))),
      r = i(() =>
        e.modelValue === nt.HALF
          ? `linear-gradient(90deg, ${n.value} 50%, ${l.value} 50%`
          : e.modelValue === nt.EMPTY
            ? l.value
            : n.value,
      ),
      u = i(() => (e.modelValue === nt.FULL ? t(o(n.value)) : t(o(l.value))))
    return { computedColor: n, backgroundComputed: r, textColorComputed: u }
  },
  jb = ['tabindex', 'onKeydown'],
  ji = G({
    name: 'VaRatingItem',
    __name: 'VaRatingItem',
    props: {
      modelValue: { type: Number, default: 0 },
      icon: { type: String, default: 'star' },
      halfIcon: { type: String, default: 'star_half' },
      emptyIcon: { type: String, default: 'star_outline' },
      halves: { type: Boolean, default: !1 },
      hover: { type: Boolean, default: !1 },
      tabindex: { type: [String, Number], default: 0 },
      disabled: { type: Boolean, default: !1 },
      readonly: { type: Boolean, default: !1 },
      size: { type: [String, Number], default: 'medium' },
      unselectedColor: { type: String },
      color: { type: String, default: 'primary' },
    },
    emits: ['update:modelValue', 'click', 'hover'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        [l] = ua('modelValue', a, o, nt.EMPTY),
        r = D(null),
        u = i(() => (a.hover && !a.disabled && !a.readonly && r.value) || l.value),
        { getColor: d } = Ce(),
        c = i(() => d(a.unselectedColor && u.value === nt.EMPTY ? a.unselectedColor : a.color)),
        v = (m) => {
          if (!n.value) return
          const { offsetX: b } = m,
            h = n.value.clientWidth
          a.halves ? (r.value = b / h <= nt.HALF ? nt.HALF : nt.FULL) : (r.value = nt.FULL)
        },
        p = () => {
          r.value = null
        },
        f = () => {
          ;((l.value = r.value || nt.FULL), o('click', r.value || nt.FULL))
        }
      re(r, () => o('hover', r.value || nt.EMPTY))
      const g = i(() => (a.halves && u.value === nt.HALF ? a.halfIcon : u.value === nt.EMPTY ? a.emptyIcon : a.icon)),
        y = i(() => (a.disabled ? -1 : a.tabindex))
      return (m, b) => (
        C(),
        _(
          'div',
          {
            ref_key: 'rootEl',
            ref: n,
            role: 'button',
            class: 'va-rating-item',
            tabindex: y.value,
            onKeydown: [se(f, ['enter']), se(ne(f, ['prevent']), ['space'])],
            onMousemove: v,
            onMouseleave: p,
            onClick: f,
          },
          [
            V(m.$slots, 'default', J(ie({ value: u.value, onClick: f })), () => [
              ue(
                s(Oe),
                {
                  class: 'va-rating-item__wrapper',
                  tabindex: '-1',
                  tag: 'button',
                  name: g.value,
                  size: m.$props.size,
                  color: c.value,
                },
                null,
                8,
                ['name', 'size', 'color'],
              ),
            ]),
          ],
          40,
          jb,
        )
      )
    },
  }),
  Ui = G({
    name: 'VaRatingItemNumberButton',
    __name: 'VaRatingItemNumberButton',
    props: { ...zi, ...pa, itemNumber: { type: Number, required: !0 }, modelValue: { type: Number, required: !0 } },
    setup(e) {
      const t = e,
        { textColorComputed: a, backgroundComputed: o } = Hi(t),
        { sizeComputed: n, fontSizeComputed: l } = fa(t, 'VaRating')
      return (r, u) => (
        C(),
        _(
          'button',
          {
            class: 'va-rating__number-item',
            tabindex: '-1',
            'aria-hidden': 'true',
            style: Y({
              background: s(o),
              color: s(a),
              width: s(n),
              height: s(n),
              fontSize: s(l),
              borderRadius: `${parseInt(s(l)) * 0.125}rem`,
            }),
          },
          fe(e.itemNumber),
          5,
        )
      )
    },
  }),
  Ub = ['aria-label'],
  hr = Ee(ji, ['modelValue', 'itemNumber']),
  Cr = Ee(Ui, ['modelValue', 'itemNumber']),
  Wb = G({
    name: 'VaRating',
    __name: 'VaRating',
    props: {
      ...Cr,
      ...zb,
      ...zi,
      ...Zt,
      ...hr,
      ...me,
      modelValue: { type: Number, default: 0 },
      numbers: { type: Boolean, default: !1 },
      halves: { type: Boolean, default: !1 },
      max: { type: [Number, String], default: 5 },
      texts: { type: Array, default: () => [] },
      ariaLabel: ye('$t:currentRating'),
      ariaItemLabel: ye('$t:voteRating'),
    },
    emits: ['update:modelValue'],
    setup(e, { emit: t }) {
      const a = e,
        { computedClasses: o } = vi('va-rating', a),
        {
          visibleValue: n,
          onMouseEnter: l,
          onMouseLeave: r,
          onItemValueUpdate: u,
          onItemHoveredValueUpdate: d,
          getItemValue: c,
        } = Hb(a),
        v = i(() => !a.disabled && !a.readonly),
        p = (h) => {
          const $ = Number(a.max),
            S = a.halves ? nt.HALF : nt.FULL,
            w = n.value + S * h,
            I = a.clearable ? 0 : S
          w >= I && w <= $ ? u(n.value, S * h) : w < I ? u(I, 0) : u($, h === -1 ? S * h : 0)
        },
        { tp: f } = He(),
        { computedColor: g } = Hi(a),
        y = i(() => (v.value ? 0 : void 0)),
        m = ze(hr),
        b = ze(Cr)
      return (h, $) => (
        C(),
        _(
          'div',
          {
            class: pe(['va-rating', s(o)]),
            'aria-label': s(f)(h.$props.ariaLabel, { max: h.$props.max, value: h.$props.modelValue }),
          },
          [
            R(
              'div',
              {
                class: 'va-rating__item-wrapper',
                onKeyup: [$[0] || ($[0] = se((S) => p(-1), ['left'])), $[1] || ($[1] = se((S) => p(1), ['right']))],
                onMouseenter: $[2] || ($[2] = (...S) => s(l) && s(l)(...S)),
                onMouseleave: $[3] || ($[3] = (...S) => s(r) && s(r)(...S)),
              },
              [
                (C(!0),
                _(
                  be,
                  null,
                  Ie(
                    Number(h.$props.max),
                    (S) => (
                      C(),
                      U(
                        ji,
                        H({ key: S, class: 'va-rating__item' }, s(m), {
                          'aria-label': s(f)(h.$props.ariaItemLabel, { max: h.$props.max, value: S }),
                          'model-value': s(c)(S - 1),
                          tabindex: y.value,
                          disabled: h.$props.disabled,
                          readonly: h.$props.readonly,
                          onHover: (w) => v.value && s(d)(S - 1, w),
                          'onUpdate:modelValue': (w) => v.value && s(u)(S - 1, w),
                        }),
                        {
                          default: z(({ value: w, onClick: I }) => [
                            V(h.$slots, 'item', J(ie({ value: w, onClick: I, index: S })), () => [
                              h.$props.numbers
                                ? (C(),
                                  U(Ui, H({ key: 0 }, s(b), { 'model-value': w, 'item-number': S }), null, 16, [
                                    'model-value',
                                    'item-number',
                                  ]))
                                : E('', !0),
                            ]),
                          ]),
                          _: 2,
                        },
                        1040,
                        [
                          'aria-label',
                          'model-value',
                          'tabindex',
                          'disabled',
                          'readonly',
                          'onHover',
                          'onUpdate:modelValue',
                        ],
                      )
                    ),
                  ),
                  128,
                )),
              ],
              32,
            ),
            h.$props.texts && h.$props.texts.length === h.$props.max
              ? (C(),
                _(
                  'span',
                  { key: 0, class: 'va-rating__text-wrapper', style: Y({ color: s(g) }) },
                  fe(h.$props.texts[Math.round(s(n)) - 1]),
                  5,
                ))
              : E('', !0),
          ],
          10,
          Ub,
        )
      )
    },
  }),
  Kb = Q(Wb),
  Gb = (e) => e.offsetTop,
  qb = (e) => e.offsetTop + e.offsetHeight,
  Yb = (e) => e.offsetTop + e.offsetHeight / 2,
  Xb = (e, t, a) => {
    const o = t.offsetHeight,
      n = t.scrollTop,
      l = Gb(e) - t.offsetTop,
      r = Yb(e) - t.offsetTop,
      u = qb(e) - t.offsetTop
    if (a === 'start') return l
    if (a === 'end') return u - o
    if (a === 'center') return r - o / 2
    if (a === 'any') {
      if (l - n < 0) return l
      if (u - n > o) return u - o
    }
  },
  Jb = (e, t = { scrollTarget: e.parentElement, verticalAlignment: 'any', smooth: !1 }) => {
    const a = t.scrollTarget || e.parentElement,
      o = Xb(e, a, t.verticalAlignment)
    o !== void 0 && a.scroll({ top: o, behavior: t.smooth ? 'smooth' : 'auto' })
  },
  Zb = ['aria-selected'],
  Qb = { key: 1, class: 'va-select-option__highlighted' },
  eh = G({
    name: 'VaSelectOption',
    __name: 'VaSelectOption',
    props: {
      ...Dn,
      disabled: { type: Boolean, default: !1 },
      option: { type: [Number, String, Boolean, Object], default: () => ({}) },
      getText: { type: Function, required: !0 },
      getTrackBy: { type: Function, required: !0 },
      currentOption: { type: [String, Number, Boolean, Object], default: null },
      getSelectedState: { type: Function, required: !0 },
      search: { type: String, default: '' },
      highlightMatchedText: { type: Boolean, default: !0 },
      inputFocused: { type: Boolean, default: !1 },
      minSearchChars: { type: [Number, String], default: 0 },
    },
    setup(e, { expose: t }) {
      const a = e,
        { getColor: o, getHoverColor: n } = Ce(),
        l = Pe('minSearchChars'),
        r = i(() => (sa(a.option) ? a.option.icon : void 0)),
        u = i(() => o(a.color)),
        d = i(() => a.getText(a.option)),
        c = i(() => {
          const y = { start: d.value, searchedSubString: '', end: '' }
          if (!d.value || !a.search || !a.highlightMatchedText || a.search.length < l.value) return y
          const m = d.value.toLowerCase().indexOf(a.search.toLowerCase())
          if (m < 0) return y
          const b = d.value.slice(0, m),
            h = d.value.slice(m, m + a.search.length),
            $ = d.value.slice(m + a.search.length)
          return { start: b, searchedSubString: h, end: $ }
        }),
        v = i(() => a.getSelectedState(a.option)),
        p = i(() =>
          typeof a.option == 'string'
            ? a.option === a.currentOption
            : a.getTrackBy(a.currentOption) === a.getTrackBy(a.option),
        ),
        f = Fe('va-select-option', () => ({ selected: v.value })),
        g = i(() => ({
          color: v.value ? o(a.color) : 'inherit',
          backgroundColor: p.value ? n(o(a.color)) : 'transparent',
          cursor: a.disabled ? 'default' : void 0,
          opacity: a.disabled ? 'var(--va-select-option-list-option-disabled-opacity)' : void 0,
        }))
      return (
        t({ isFocused: p, isSelected: v }),
        (y, m) => (
          C(),
          _(
            'div',
            { role: 'option', class: pe(['va-select-option', s(f)]), style: Y(g.value), 'aria-selected': v.value },
            [
              V(y.$slots, 'option-content', {}, () => [
                r.value
                  ? (C(),
                    U(s(Oe), { key: 0, size: 'small', class: 'va-select-option__icon', name: r.value }, null, 8, [
                      'name',
                    ]))
                  : E('', !0),
                Te(' ' + fe(c.value.start) + ' ', 1),
                c.value.searchedSubString ? (C(), _('span', Qb, fe(c.value.searchedSubString), 1)) : E('', !0),
                Te(' ' + fe(c.value.end), 1),
              ]),
              v.value
                ? (C(),
                  U(
                    s(Oe),
                    {
                      key: 0,
                      class: 'va-select-option__selected-icon',
                      size: 'small',
                      name: 'va-check',
                      color: u.value,
                    },
                    null,
                    8,
                    ['color'],
                  ))
                : E('', !0),
            ],
            14,
            Zb,
          )
        )
      )
    },
  }),
  Sr = Q(eh),
  th = () => {
    const e = we({}),
      t = (a) => (o) => {
        if (o) return ((e.value[a] = o), String(a))
      }
    return (
      Hr(() => {
        e.value = {}
      }),
      { itemRefs: e, setItemRef: t }
    )
  },
  ah = ['tabindex', 'onKeydown', 'aria-multiselectable'],
  oh = { key: 0, class: 'va-select-option-list__group-name', role: 'presentation' },
  nh = { key: 0, class: 'va-select-option-list--empty' },
  lh = G({
    name: 'VaSelectOptionList',
    __name: 'VaSelectOptionList',
    props: {
      ...Dn,
      ...me,
      ...Oa,
      ...Da,
      noOptionsText: { type: String, default: 'Items not found' },
      getSelectedState: { type: Function, required: !0 },
      multiple: { type: Boolean, default: !1 },
      search: { type: String, default: '' },
      tabindex: { type: [String, Number], default: 0 },
      hoveredOption: { type: [String, Number, Boolean, Object], default: null },
      virtualScroller: { type: Boolean, default: !0 },
      highlightMatchedText: { type: Boolean, default: !0 },
      minSearchChars: { type: [Number, String], default: 0 },
      autoSelectFirstOption: { type: Boolean, default: !1 },
      selectedTopShown: { type: Boolean, default: !1 },
      doShowAllOptions: { type: Boolean, default: !1 },
      searchFn: { type: Function, default: void 0 },
    },
    emits: ['select-option', 'update:hoveredOption', 'no-previous-option-to-hover', 'scroll-bottom'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        r = () => {
          var W
          ;(W = l.value) == null || W.focus({ preventScroll: !0 })
        },
        u = i(() => {
          var W
          return ((W = l.value) == null ? void 0 : W.clientHeight) ?? 200
        }),
        d = () => n('scroll-bottom'),
        c = (W) => {
          const j = W.target
          j && j.scrollTop + j.clientHeight === j.scrollHeight && d()
        },
        v = D(''),
        p = i(() => o.hoveredOption ?? null),
        f = (W, j) => {
          ;(n('update:hoveredOption', W), (v.value = j))
        },
        { getText: g, getGroupBy: y, getTrackBy: m, getDisabled: b } = xa(o),
        h = Pe('minSearchChars'),
        $ = i(() => {
          var W
          const j = o.getSelectedState,
            Se = (W = o.options) == null ? void 0 : W.find((ge) => j(ge))
          return Se ? g(Se) : ''
        }),
        S = i(() => {
          var W
          return $.value.toLowerCase() === ((W = o.search) == null ? void 0 : W.toLowerCase())
        }),
        w = i(() => {
          if ((o.doShowAllOptions && S.value) || !o.search || o.search.length < h.value) return o.options
          if (o.searchFn) return o.options.filter((j) => o.searchFn(o.search, j))
          const W = o.search.toUpperCase().trim()
          return o.options.filter((j) => g(j).toUpperCase().includes(W))
        }),
        I = i(() =>
          o.groupBy
            ? w.value.reduce(
                (W, j) => {
                  const Se = y(j)
                  return (Se ? (W[Se] || (W[Se] = []), W[Se].push(j)) : W._noGroup.push(j), W)
                },
                { _noGroup: [] },
              )
            : { _noGroup: w.value },
        ),
        A = Zn(I, o),
        k = (W) => !ft(W),
        T = (W) => {
          W === p.value || (k(W) && b(W)) || f(W ?? null, 'mouse')
        },
        O = (W) => {
          f(W ?? null, 'keyboard')
        },
        M = () => {
          const W = x.value && typeof x.value == 'object' ? { ...x.value } : x.value
          ;(n('select-option'), o.selectedTopShown && T(W))
        },
        ae = i(() => Object.values(A.value).flat()),
        oe = i(() => (w.value.some((W) => y(W)) ? ae.value : w.value)),
        B = i(() => oe.value.findIndex((W) => k(p.value) && m(W) === m(p.value))),
        K = i(() => ({
          ...Ge(o, ['getSelectedState', 'color', 'search', 'highlightMatchedText']),
          minSearchChars: h.value,
          getText: g,
          getTrackBy: m,
        })),
        L = (W, j = !1) => {
          const Se = [...(oe.value || [])],
            ge = j ? Se.reverse() : Se,
            Ae = j ? W * -1 - 1 : W
          return ge.slice(Ae).find((je) => !b(je))
        },
        x = i(() => {
          const W = B.value - 1,
            j = oe.value[W]
          if (k(j) && !(W === 0 && b(j))) return L(B.value - 1, !0)
        }),
        N = (W) => {
          ;(T(W), n('select-option'))
        },
        P = (W) => {
          o.selectedTopShown || T(W)
        },
        te = (W) => {
          o.selectedTopShown && T(W)
        },
        X = () => {
          if (!k(p.value)) {
            O(L(0, !0))
            return
          }
          k(x.value) ? O(x.value) : n('no-previous-option-to-hover')
        },
        ce = () => {
          if (!k(p.value)) {
            ke()
            return
          }
          const W = B.value + 1,
            j = oe.value[W]
          k(j) && !(W === oe.value.length - 1 && b(j)) && O(L(B.value + 1))
        },
        ke = () => O(L(0)),
        { itemRefs: de, setItemRef: F } = th(),
        le = we(),
        ve = (W) => {
          var j
          if (!k(W)) return
          const Se = Xe(de.value[m(W)])
          Se && Jb(Se)
          const ge = (j = le.value) == null ? void 0 : j[0]
          o.virtualScroller && ge.virtualScrollTo(B.value)
        }
      return (
        re(
          () => o.hoveredOption,
          (W) => {
            ;(!v.value || v.value === 'keyboard') && k(W) && ve(W)
          },
        ),
        re(
          w,
          () => {
            o.autoSelectFirstOption && ke()
          },
          { immediate: !0 },
        ),
        t({ focusPreviousOption: X, focusNextOption: ce, focusFirstOption: ke, scrollToOption: ve, focus: r }),
        (W, j) => (
          C(),
          _(
            'div',
            {
              ref_key: 'root',
              ref: l,
              class: 'va-select-option-list',
              tabindex: e.tabindex,
              onKeydown: [
                se(ne(X, ['stop', 'prevent']), ['up']),
                se(ne(X, ['stop', 'prevent']), ['left']),
                se(ne(ce, ['stop', 'prevent']), ['down']),
                se(ne(ce, ['stop', 'prevent']), ['right']),
                se(ne(M, ['stop', 'prevent']), ['enter']),
                se(ne(M, ['stop', 'prevent']), ['space']),
              ],
              onScrollPassive: c,
              role: 'listbox',
              'aria-multiselectable': W.$props.multiple,
            },
            [
              (C(!0),
              _(
                be,
                null,
                Ie(
                  s(A),
                  (Se, ge) => (
                    C(),
                    _(
                      be,
                      { key: ge },
                      [
                        ge !== '_noGroup' ? (C(), _('span', oh, fe(ge), 1)) : E('', !0),
                        W.$props.virtualScroller
                          ? (C(),
                            U(
                              s(jo),
                              {
                                key: 1,
                                ref_for: !0,
                                ref_key: 'virtualScrollerRef',
                                ref: le,
                                items: Se,
                                'track-by': s(m),
                                'wrapper-size': u.value,
                                'onScroll:bottom': d,
                              },
                              {
                                default: z(({ item: Ae, index: je }) => [
                                  V(
                                    W.$slots,
                                    'default',
                                    J(ie({ option: Ae, index: je, selectOption: (ot = Ae) => N(ot) })),
                                    () => [
                                      ue(
                                        s(Sr),
                                        H({ option: Ae, 'current-option': p.value, disabled: s(b)(Ae) }, K.value, {
                                          onClick: ne(M, ['stop']),
                                          onMouseenter: (ot) => te(Ae),
                                          onMousemove: (ot) => P(Ae),
                                        }),
                                        null,
                                        16,
                                        ['option', 'current-option', 'disabled', 'onMouseenter', 'onMousemove'],
                                      ),
                                    ],
                                  ),
                                ]),
                                _: 2,
                              },
                              1032,
                              ['items', 'track-by', 'wrapper-size'],
                            ))
                          : (C(!0),
                            _(
                              be,
                              { key: 2 },
                              Ie(Se, (Ae, je) =>
                                V(
                                  W.$slots,
                                  'default',
                                  J(H({ key: s(m)(Ae) }, { option: Ae, index: je, selectOption: N })),
                                  () => [
                                    ue(
                                      s(Sr),
                                      H(
                                        {
                                          ref_for: !0,
                                          ref: s(F)(s(m)(Ae)),
                                          'current-option': p.value,
                                          option: Ae,
                                          disabled: s(b)(Ae),
                                        },
                                        K.value,
                                        {
                                          onClick: ne(M, ['stop']),
                                          onMouseenter: (ot) => te(Ae),
                                          onMousemove: (ot) => P(Ae),
                                        },
                                      ),
                                      {
                                        'option-content': z(() => [
                                          V(W.$slots, 'option-content', J(ie({ option: Ae, index: je }))),
                                        ]),
                                        _: 2,
                                      },
                                      1040,
                                      ['current-option', 'option', 'disabled', 'onMouseenter', 'onMousemove'],
                                    ),
                                  ],
                                ),
                              ),
                              128,
                            )),
                      ],
                      64,
                    )
                  ),
                ),
                128,
              )),
              w.value.length ? E('', !0) : (C(), _('div', nh, fe(e.noOptionsText), 1)),
            ],
            40,
            ah,
          )
        )
      )
    },
  }),
  rh = Q(lh),
  sh = { key: 0, class: 'va-select-content__placeholder' },
  ih = ['placeholder'],
  uh = { key: 0, class: 'va-select-content__option' },
  ch = { key: 1, class: 'va-select-content__separator' },
  dh = ['placeholder', 'disabled', 'readonly'],
  vh = G({
    name: 'VaSelectContent',
    __name: 'VaSelectContent',
    props: {
      ...Zt,
      ariaAttributes: { type: Object },
      value: { type: Array, required: !0 },
      valueString: { type: String },
      separator: { type: String, default: ', ' },
      placeholder: { type: String, default: '' },
      tabindex: { type: [String, Number], default: 0 },
      hiddenSelectedOptionsAmount: { type: [Number, String], default: 0 },
      isAllOptionsShown: { type: Boolean, default: !1 },
      autocomplete: { type: Boolean, default: !1 },
      focused: { type: Boolean, default: !1 },
      multiple: { type: Boolean, default: !1 },
      getText: { type: Function, required: !0 },
      autocompleteInputValue: { type: String, default: '' },
    },
    emits: ['toggle-hidden', 'autocomplete-input', 'focus-prev', 'focus-next', 'select-option', 'delete-last-selected'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = D(),
        l = i(() => a.placeholder && !a.valueString),
        r = () => o('toggle-hidden'),
        { value: u, focused: d } = Tt(a),
        c = i({ get: () => a.autocompleteInputValue, set: (m) => o('autocomplete-input', m) }),
        v = Pe('hiddenSelectedOptionsAmount')
      ;(Me(() => {
        a.multiple || (a.autocomplete && (c.value = a.valueString))
      }),
        re(d, (m) => {
          var b, h
          !a.autocomplete ||
            !m ||
            (c.value
              ? (b = n.value) == null || b.setSelectionRange(0, c.value.length)
              : (h = n.value) == null || h.focus())
        }))
      const p = (m) => {
          a.multiple && u.value.length && m.key === 'Backspace' && !c.value && o('delete-last-selected')
        },
        f = (m) => {
          var b
          a.autocomplete && ((b = n.value) == null || b.focus(), m.stopPropagation())
        },
        g = (m) => (sa(m) ? m.icon : void 0),
        y = i(() => (a.multiple ? u.value : u.value[0]))
      return (m, b) => (
        C(),
        _('div', { class: 'va-select-content', onClick: f }, [
          l.value && !m.$props.autocomplete
            ? (C(),
              _('span', sh, [
                R('input', H(e.ariaAttributes, { placeholder: m.$props.placeholder, readonly: '' }), null, 16, ih),
              ]))
            : a.autocomplete && !a.multiple
              ? E('', !0)
              : V(
                  m.$slots,
                  'content',
                  J(
                    H(
                      { key: 1 },
                      {
                        value: y.value,
                        valueString: m.$props.valueString,
                        valueArray: m.$props.value,
                        tabindex: m.$props.tabindex,
                        ariaAttributes: e.ariaAttributes,
                      },
                    ),
                  ),
                  () => [
                    (C(!0),
                    _(
                      be,
                      null,
                      Ie(
                        m.$props.value,
                        (h, $) => (
                          C(),
                          _(
                            be,
                            { key: $ },
                            [
                              h !== ''
                                ? (C(),
                                  _('span', uh, [
                                    V(
                                      m.$slots,
                                      'option-content',
                                      J(ie({ option: h, index: $, selectOption: () => {} })),
                                      () => [
                                        g(h)
                                          ? (C(),
                                            U(
                                              s(Oe),
                                              { key: 0, size: 'small', class: 'va-select-option__icon', name: g(h) },
                                              null,
                                              8,
                                              ['name'],
                                            ))
                                          : E('', !0),
                                        Te(' ' + fe(e.getText(h)), 1),
                                      ],
                                    ),
                                  ]))
                                : E('', !0),
                              $ < m.$props.value.length - 1
                                ? (C(), _('span', ch, fe(m.$props.separator), 1))
                                : E('', !0),
                            ],
                            64,
                          )
                        ),
                      ),
                      128,
                    )),
                  ],
                ),
          m.$props.autocomplete
            ? Bt(
                (C(),
                _(
                  'input',
                  H({ key: 2 }, e.ariaAttributes, {
                    'onUpdate:modelValue': b[0] || (b[0] = (h) => (c.value = h)),
                    class: 'va-select-content__autocomplete',
                    ref_key: 'autocompleteInput',
                    ref: n,
                    autocomplete: 'off',
                    'aria-autocomplete': 'list',
                    placeholder: m.$props.placeholder,
                    disabled: m.$props.disabled,
                    readonly: m.$props.readonly,
                    onKeydown: [
                      b[1] ||
                        (b[1] = se(
                          ne((h) => m.$emit('focus-prev'), ['stop', 'prevent']),
                          ['up'],
                        )),
                      b[2] ||
                        (b[2] = se(
                          ne((h) => m.$emit('focus-next'), ['stop', 'prevent']),
                          ['down'],
                        )),
                      b[3] ||
                        (b[3] = se(
                          ne((h) => m.$emit('select-option'), ['stop', 'prevent']),
                          ['enter'],
                        )),
                      p,
                    ],
                  }),
                  null,
                  16,
                  dh,
                )),
                [[Ao, c.value]],
              )
            : E('', !0),
          V(
            m.$slots,
            'hiddenOptionsBadge',
            J(ie({ amount: e.hiddenSelectedOptionsAmount, isShown: m.$props.isAllOptionsShown, toggle: r })),
            () => [
              s(v) && !m.$props.isAllOptionsShown
                ? (C(),
                  U(
                    s(li),
                    {
                      key: 0,
                      class: 'va-select-content__state-icon',
                      color: 'info',
                      text: `+${s(v)}`,
                      tabindex: m.$props.tabindex,
                      onClick: ne(r, ['stop']),
                    },
                    null,
                    8,
                    ['text', 'tabindex'],
                  ))
                : E('', !0),
            ],
          ),
          V(m.$slots, 'hideOptionsButton', J(ie({ isShown: m.$props.isAllOptionsShown, toggle: r })), () => [
            m.$props.isAllOptionsShown
              ? (C(),
                U(
                  s(Oe),
                  {
                    key: 0,
                    role: 'button',
                    class: 'va-select-content__state-icon',
                    size: 'small',
                    name: 'reply',
                    tabindex: m.$props.tabindex,
                    onClick: ne(r, ['stop']),
                  },
                  null,
                  8,
                  ['tabindex'],
                ))
              : E('', !0),
          ]),
        ])
      )
    },
  }),
  ph = Q(vh),
  fh = { maxVisibleOptions: { type: Number || String, default: 0 } },
  mh = (e, t) => {
    const a = ut(e, 'modelValue'),
      o = D(!1),
      n = D([]),
      l = D([]),
      r = i(() => l.value.length),
      u = i(() => [...n.value, ...l.value]),
      d = i(() => (!e.maxVisibleOptions || o.value ? u.value : n.value))
    return (
      re(
        a,
        () => {
          if (!Array.isArray(a.value)) {
            ;((n.value = [t(a.value)]), (l.value = []))
            return
          }
          const v = a.value.filter((p) => !ft(p)).map(t)
          e.maxVisibleOptions
            ? ((n.value = v.slice(0, e.maxVisibleOptions)), (l.value = v.slice(e.maxVisibleOptions)))
            : ((n.value = [...v]), (l.value = []))
        },
        { immediate: !0 },
      ),
      {
        toggleHiddenOptionsState: () => (o.value = !o.value),
        isAllOptionsShown: o,
        visibleSelectedOptions: d,
        hiddenSelectedOptionsAmount: r,
        allSelectedOptions: u,
      }
    )
  },
  gh = {
    dropdownIcon: {
      type: [String, Object],
      default: () => ({ open: 'va-arrow-down', close: 'va-arrow-up' }),
      validator: (e) =>
        typeof e == 'string'
          ? !0
          : Object.entries(e).every(([t, a]) => ['open', 'close'].includes(t) && typeof a == 'string'),
    },
  },
  yh = (e, t) => {
    const a = i(() =>
        e.dropdownIcon
          ? typeof e.dropdownIcon == 'string'
            ? e.dropdownIcon
            : t.value
              ? e.dropdownIcon.close
              : e.dropdownIcon.open
          : '',
      ),
      { getHoverColor: o, getColor: n } = Ce(),
      l = i(() => n('secondary')),
      r = i(() => (e.readonly ? o(l.value) : l.value))
    return { toggleIcon: a, toggleIconColor: r }
  },
  bh = { separator: { type: String, default: ', ' } },
  hh = (e, t, a) =>
    i(() => {
      var o
      return (o = t.value) != null && o.length ? (t.value.map(a).join(e.separator) ?? '') : ''
    }),
  Ch = { autocomplete: { type: Boolean, default: !1 } },
  Sh = (e, t, a, o, n) => {
    const l = (u) => (u != null && u.length ? n(u.at(-1)) : '')
    ;(t.autocomplete && !t.multiple && (e.value = l(a.value)),
      re(a, (u, d) => {
        if (!t.autocomplete) return
        const c = l(u),
          v = l(d)
        c !== v && ((e.value = t.multiple ? '' : c), t.multiple || (o.value = !1))
      }),
      re(e, (u) => {
        t.autocomplete && u && u !== l(a.value) && (o.value = !0)
      }))
    const r = () => {
      e.value = t.multiple ? '' : l(a.value)
    }
    return (
      re(o, (u, d) => {
        t.autocomplete && (!u || d) && r()
      }),
      e
    )
  },
  $h = () => ({ popupId: `combobox-controls-${Dt()}` }),
  kh = { maxSelections: { type: [Number, String], default: void 0 } }
function wh(e, t) {
  return {
    exceedsMaxSelections: () => (t.value === void 0 || isNaN(+t.value) ? !1 : e.value.length >= Number(t.value)),
    addOption: (n) => [...e.value, n],
  }
}
const $r = Ee(gt),
  _h = G({
    name: 'VaSelect',
    __name: 'VaSelect',
    props: {
      ...$r,
      ...me,
      ...Oa,
      ...zt,
      ...to,
      ...kh,
      ...no,
      ...Zt,
      ...fh,
      ...gh,
      ...Da,
      ...bh,
      ...Ch,
      ...Vt,
      modelValue: { type: [String, Number, Array, Object, Boolean], default: void 0 },
      placement: { ...Vt.placement, default: 'bottom' },
      keepAnchorWidth: { ...Vt.keepAnchorWidth, default: !0 },
      offset: { ...Vt.offset, default: [1, 0] },
      closeOnContentClick: { ...Vt.closeOnContentClick, default: !1 },
      trigger: { ...Vt.trigger, default: () => ['click', 'right-click', 'space', 'enter'] },
      allowCreate: { type: [Boolean, String], default: !1, validator: (e) => [!0, !1, 'unique'].includes(e) },
      color: { type: String, default: 'primary' },
      multiple: { type: Boolean, default: !1 },
      searchable: { type: Boolean, default: !1 },
      width: { type: String, default: '100%' },
      maxHeight: { type: String, default: '256px' },
      noOptionsText: ye('$t:noOptions'),
      hideSelected: { type: Boolean, default: !1 },
      tabindex: { type: [String, Number], default: 0 },
      virtualScroller: { type: Boolean, default: !1 },
      selectedTopShown: { type: Boolean, default: !1 },
      highlightMatchedText: { type: Boolean, default: !0 },
      minSearchChars: { type: [Number, String], default: 0 },
      autoSelectFirstOption: { type: Boolean, default: !1 },
      placeholder: { type: String, default: '' },
      searchPlaceholderText: ye('$t:search'),
      ariaLabel: ye('$t:select'),
      ariaSearchLabel: ye('$t:optionsFilter'),
      ariaClearLabel: ye('$t:reset'),
      search: { type: String, default: void 0 },
      searchFn: { type: Function, default: void 0 },
      clearValue: { type: [String, Number, Array, Object, Boolean], default: '' },
    },
    emits: ['update:modelValue', 'update-search', 'create-new', 'scroll-bottom', 'update:search', ...al, ...Xt, ...zo],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { tp: l, t: r } = He(),
        u = we(),
        d = we(),
        c = we(),
        v = Xn(d),
        { getValue: p, getText: f, getTrackBy: g, tryResolveByValue: y } = xa(o),
        m = (ee) => f(y(ee)),
        b = () => n('scroll-bottom'),
        [h] = ua('search', o, n, ''),
        $ = i(() => o.searchable || (o.allowCreate && !o.autocomplete))
      re(h, (ee) => {
        ;(n('update-search', ee), o.autocomplete || (de.value = null))
      })
      const S = (ee) => {
          if (ft(ee) || typeof ee == 'object') return ee
          const Ue = o.options.find((Ne) => ee === p(Ne))
          return Ue === void 0
            ? (De(
                `[VaSelect]: can not find option in options list (${JSON.stringify(o.options)}) by provided value (${JSON.stringify(ee)})!`,
              ),
              ee)
            : Ue
        },
        {
          toggleHiddenOptionsState: w,
          isAllOptionsShown: I,
          visibleSelectedOptions: A,
          hiddenSelectedOptionsAmount: k,
          allSelectedOptions: T,
        } = mh(o, S),
        O = i({
          get() {
            if (o.multiple) return T.value
            const ee = S(o.modelValue)
            return Array.isArray(ee) &&
              (De('Model value should be a string, number, boolean or an object for a single Select.'), ee.length)
              ? ee.at(-1)
              : ee
          },
          set(ee) {
            Array.isArray(ee) ? n('update:modelValue', ee.map(p)) : n('update:modelValue', p(ee))
          },
        }),
        M = hh(o, A, m),
        { canBeCleared: ae, clearIconProps: oe, onFocus: B, onBlur: K } = Ho(o, O),
        L = i(() => (ae.value ? (o.multiple && Array.isArray(O.value) ? !!O.value.length : !0) : !1)),
        x = i(() =>
          o.options
            ? o.selectedTopShown
              ? o.options.slice().sort((ee, Ue) => {
                  const Ne = P(ee),
                    Ze = P(Ue)
                  return Ne && Ze ? 0 : Ne && !Ze ? -1 : 1
                })
              : o.hideSelected
                ? o.options.filter((ee) => !P(ee))
                : o.options
            : [],
        ),
        N = i(() => (Array.isArray(O.value) ? O.value.map((ee) => y(ee)) : y(O.value))),
        P = (ee) => (Array.isArray(N.value) ? !ft(N.value.find((Ue) => te(Ue, ee))) : te(N.value, ee)),
        te = (ee, Ue) => {
          const Ne = p(ee),
            Ze = p(Ue)
          return Ne === Ze
            ? !0
            : typeof Ne == 'string' && typeof Ze == 'string'
              ? Ne === Ze
              : Ne === null || Ze === null
                ? !1
                : typeof Ne == 'object' && typeof Ze == 'object'
                  ? g(Ne) === g(Ze)
                  : !1
        },
        X = (ee) => Array.isArray(ee.value),
        ce = (ee) => {
          if (de.value === null) {
            ct()
            return
          }
          if (($.value && (h.value = ''), o.multiple && X(O))) {
            const { exceedsMaxSelections: Ue, addOption: Ne } = wh(O, D(o.maxSelections))
            if (P(ee)) O.value = O.value.filter((Kt) => !te(ee, Kt))
            else {
              if (Ue()) return
              O.value = Ne(ee)
            }
          } else ((O.value = ee), ct())
          Yo()
        },
        ke = () => {
          var ee
          const Ue = (ee = o.options) == null ? void 0 : ee.some((Ze) => [h.value, bt.value].includes(f(Ze)))
          !((o.allowCreate === 'unique' || o.autocomplete) && Ue) &&
            (n('create-new', h.value || bt.value), (h.value = ''), (bt.value = ''))
        },
        de = D(null),
        F = () => {
          if (!j.value) {
            je()
            return
          }
          ce(de.value)
        },
        le = () => {
          const ee = !!o.allowCreate && (h.value || bt.value)
          de.value !== null ? F() : ee && ke()
        },
        ve = () => {
          var ee
          return (ee = u.value) == null ? void 0 : ee.focusPreviousOption()
        },
        W = () => {
          var ee
          return (ee = u.value) == null ? void 0 : ee.focusNextOption()
        },
        { isOpenSync: j, dropdownProps: Se } = ol(o, n, { defaultCloseOnValueUpdate: i(() => !o.multiple) }),
        ge = i(() => ({ ...Se.value, stateful: !1, innerAnchorSelector: '.va-input-wrapper__field' })),
        Ae = i({
          get: () => j.value,
          set: (ee) => {
            ee ? je() : ot()
          },
        }),
        je = () => {
          o.disabled || o.readonly || ((j.value = !0), vt(), Ve())
        },
        ot = () => {
          ;((j.value = !1),
            o.autocomplete || (h.value = ''),
            Ye(() => {
              ;(rl(), v.focusIfNothingIfFocused())
            }))
        },
        ct = () => {
          ;(ot(), (v.value = !0))
        },
        it = () => {
          var ee
          ;(ee = c.value) == null || ee.focus()
        },
        Le = () => {
          var ee, Ue
          ;((ee = u.value) == null || ee.focus(), !o.modelValue && ((Ue = u.value) == null || Ue.focusFirstOption()))
        },
        Ve = async () => {
          ;(await Ye(), $.value ? it() : Le())
        },
        $e = () => {
          Ae.value || (K(), ou.onBlur(), v.value ? (v.value = !1) : rl())
        },
        _e = i(() => (o.disabled ? -1 : o.tabindex)),
        at = i(() => (o.disabled || o.autocomplete ? -1 : 0)),
        vt = () => {
          const ee = O.value
          if (typeof ee != 'object' && Array.isArray(ee) && !ee.length) return
          const Ne = Array.isArray(ee) ? ee[ee.length - 1] : ee
          ;((de.value = Ne),
            Ye(() => {
              var Ze
              return (Ze = u.value) == null ? void 0 : Ze.scrollToOption(Ne)
            }))
        }
      let yt = '',
        Sa
      const Ut = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '],
        Fa = (ee) => {
          if (Ut.some((Ze) => Ze === ee.key)) return
          const Ue = ee.key.length === 1,
            Ne = ee.key === 'Backspace' || ee.key === 'Delete'
          if ((clearTimeout(Sa), Ne ? (yt = yt ? yt.slice(0, -1) : '') : Ue && (yt += ee.key), $.value)) {
            h.value = yt
            return
          }
          if (yt) {
            const Ze = o.options.find((Kt) => f(Kt).toLowerCase().startsWith(yt.toLowerCase()))
            Ze && (de.value = Ze)
          }
          Sa = setTimeout(() => {
            yt = ''
          }, 1e3)
        },
        Qt = Pe('minSearchChars'),
        Ma = i(() => ({
          ...Ge(o, [
            'textBy',
            'trackBy',
            'groupBy',
            'valueBy',
            'disabledBy',
            'color',
            'virtualScroller',
            'highlightMatchedText',
            'delay',
            'selectedTopShown',
          ]),
          autoSelectFirstOption: o.autoSelectFirstOption || o.autocomplete,
          search: h.value || bt.value,
          tabindex: _e.value,
          selectedValue: O.value,
          options: x.value,
          getSelectedState: P,
          noOptionsText: l(o.noOptionsText),
          doShowAllOptions: _t.value,
          minSearchChars: Qt.value,
        })),
        { toggleIcon: ea, toggleIconColor: $a } = yh(o, j),
        q = i(() => v.value || j.value),
        Z = dt(),
        he = Fe('va-select-anchor', () => ({ nowrap: !!(o.maxVisibleOptions && !Z.content) })),
        Be = ze($r),
        Je = i(() => ({
          ...Be.value,
          error: Qi.value,
          errorMessages: eu.value,
          focused: q.value,
          'aria-label':
            o.ariaLabel || (o.modelValue ? `${r('selectedOption')}: ${o.modelValue}` : r('noSelectedOption')),
        })),
        $t = i(() => ({
          ...Ge(o, ['placeholder', 'autocomplete', 'multiple', 'disabled', 'readonly']),
          tabindex: _e.value,
          value: A.value,
          valueString: M.value,
          hiddenSelectedOptionsAmount: k.value,
          isAllOptionsShown: I.value,
          focused: v.value,
          autocompleteInputValue: bt.value,
          getText: m,
        })),
        bt = Sh(h, o, A, j, f),
        ta = (ee) => (bt.value = ee),
        _t = D(!0)
      ;(re(Ae, () => {
        _t.value = !0
      }),
        re(h, () => {
          _t.value = !1
        }))
      const so = () => {
          o.disabled || Pt(Xe(d.value))
        },
        io = () => {
          ;(Ae.value && (Ae.value = !1),
            Ye(() => {
              o.disabled || Do(Xe(d.value))
            }))
        },
        Wt = () =>
          tu(() => {
            ;(o.multiple ? (O.value = Array.isArray(o.clearValue) ? o.clearValue : []) : (O.value = o.clearValue),
              (h.value = ''),
              n('clear'),
              au(),
              Ye(() => {
                v.value = !0
              }))
          }),
        Yo = (ee) => {
          o.autocomplete && !o.disabled && !o.readonly && ((v.value = !0), (j.value = !0))
        },
        rt = (ee) => {
          if (o.disabled || o.readonly) return
          const Ue = ee.target && 'tagName' in ee.target && ee.target.tagName === 'INPUT'
          ;(ee.code === 'Space' && Ue) || (ee.preventDefault(), (Ae.value = !Ae.value))
        },
        Zi = () => {
          Array.isArray(O.value) && (O.value = O.value.slice(0, -1))
        },
        {
          validate: rl,
          computedError: Qi,
          computedErrorMessages: eu,
          withoutValidation: tu,
          resetValidation: au,
          listeners: ou,
          isTouched: nu,
        } = Ht(o, n, { reset: Wt, focus: so, value: O })
      re(j, (ee) => {
        ee || (nu.value = !0)
      })
      const { popupId: Xo } = $h(),
        Jo = h,
        lu = B
      return (
        t({ focus: so, blur: io, reset: Wt }),
        (ee, Ue) => (
          C(),
          U(
            s(Ct),
            H(
              {
                ref: 'dropdown',
                modelValue: Ae.value,
                'onUpdate:modelValue': Ue[4] || (Ue[4] = (Ne) => (Ae.value = Ne)),
                class: 'va-select va-select__dropdown va-select-dropdown',
              },
              ge.value,
              { role: 'combobox', 'inner-anchor-selector': '.va-input-wrapper__field', 'keyboard-navigation': !1 },
            ),
            {
              anchor: z(() => [
                ue(
                  s(gt),
                  H(Je.value, {
                    ref_key: 'input',
                    ref: d,
                    class: ['va-select__anchor va-select-anchor__input', s(he)],
                    'aria-haspopup': 'listbox',
                    'model-value': s(M),
                    readonly: !0,
                    'aria-label': ee.$props.ariaLabel,
                    'aria-controls': s(Xo),
                    'aria-owns': s(Xo),
                    onFocus: s(lu),
                    onBlur: $e,
                  }),
                  st(
                    {
                      icon: z(() => [
                        L.value
                          ? (C(),
                            U(
                              s(Oe),
                              H({ key: 0, role: 'button', 'aria-label': s(l)(ee.$props.ariaClearLabel) }, s(oe), {
                                onClick: ne(Wt, ['stop']),
                                onKeydown: [se(ne(Wt, ['stop']), ['enter']), se(ne(Wt, ['stop']), ['space'])],
                              }),
                              null,
                              16,
                              ['aria-label', 'onKeydown'],
                            ))
                          : E('', !0),
                      ]),
                      appendInner: z(() => [
                        ue(
                          s(Oe),
                          {
                            color: s($a),
                            name: s(ea),
                            class: 'va-select__toggle-icon',
                            role: 'button',
                            tabindex: at.value,
                            'aria-expanded': Ae.value,
                            onKeydown: se(rt, ['enter']),
                          },
                          null,
                          8,
                          ['color', 'name', 'tabindex', 'aria-expanded'],
                        ),
                      ]),
                      default: z(({ ariaAttributes: Ne }) => [
                        ue(
                          s(ph),
                          H($t.value, {
                            ariaAttributes: Ne,
                            separator: ee.$props.separator,
                            onToggleHidden: s(w),
                            onAutocompleteInput: ta,
                            onFocusPrev: ve,
                            onFocusNext: W,
                            onSelectOption: le,
                            onDeleteLastSelected: Zi,
                          }),
                          st({ _: 2 }, [
                            Ie(ee.$slots, (Ze, Kt) => ({ name: Kt, fn: z((ru) => [V(ee.$slots, Kt, J(ie(ru)))]) })),
                          ]),
                          1040,
                          ['ariaAttributes', 'separator', 'onToggleHidden'],
                        ),
                      ]),
                      _: 2,
                    },
                    [Ie(ee.$slots, (Ne, Ze) => ({ name: Ze, fn: z((Kt) => [V(ee.$slots, Ze, J(ie(Kt)))]) }))],
                  ),
                  1040,
                  ['class', 'model-value', 'aria-label', 'aria-controls', 'aria-owns', 'onFocus'],
                ),
              ]),
              default: z(() => [
                ue(
                  s(va),
                  {
                    class: 'va-select-dropdown__content',
                    style: Y({ width: ee.$props.width }),
                    onKeydown: se(ct, ['esc']),
                    role: 'dialog',
                  },
                  {
                    default: z(() => [
                      $.value
                        ? (C(),
                          U(
                            s(gt),
                            {
                              key: 0,
                              ref_key: 'searchBar',
                              ref: c,
                              class: 'va-select-dropdown__content-search-input',
                              modelValue: s(Jo),
                              'onUpdate:modelValue': Ue[0] || (Ue[0] = (Ne) => (mt(Jo) ? (Jo.value = Ne) : null)),
                              'aria-label': s(l)(ee.$props.ariaSearchLabel),
                              tabindex: _e.value,
                              placeholder: s(l)(ee.$props.searchPlaceholderText),
                              preset: 'bordered',
                              onKeydown: [
                                se(ne(ve, ['stop', 'prevent']), ['up']),
                                se(ne(ve, ['stop', 'prevent']), ['left']),
                                se(ne(W, ['stop', 'prevent']), ['down']),
                                se(ne(W, ['stop', 'prevent']), ['right']),
                                se(ne(le, ['prevent']), ['enter']),
                              ],
                              onFocus: Ue[1] || (Ue[1] = (Ne) => (de.value = null)),
                            },
                            null,
                            8,
                            ['modelValue', 'aria-label', 'tabindex', 'placeholder', 'onKeydown'],
                          ))
                        : E('', !0),
                      ue(
                        s(rh),
                        H(
                          {
                            ref_key: 'optionList',
                            ref: u,
                            class: 'va-select-dropdown__options-wrapper',
                            hoveredOption: de.value,
                            'onUpdate:hoveredOption': Ue[2] || (Ue[2] = (Ne) => (de.value = Ne)),
                            style: { maxHeight: ee.$props.maxHeight },
                            id: s(Xo),
                            'search-fn': ee.$props.searchFn,
                          },
                          Ma.value,
                          {
                            onSelectOption: F,
                            onNoPreviousOptionToHover: it,
                            onKeydown: [
                              Ue[3] ||
                                (Ue[3] = se(
                                  ne((Ne) => c.value && c.value.focus(), ['stop', 'prevent']),
                                  ['tab'],
                                )),
                              Fa,
                            ],
                            onScrollBottom: b,
                          },
                        ),
                        {
                          default: z((Ne) => [V(ee.$slots, 'option', J(ie(Ne)))]),
                          'option-content': z((Ne) => [V(ee.$slots, 'option-content', J(ie(Ne)))]),
                          _: 3,
                        },
                        16,
                        ['hoveredOption', 'style', 'id', 'search-fn'],
                      ),
                    ]),
                    _: 3,
                  },
                  8,
                  ['style'],
                ),
              ]),
              _: 3,
            },
            16,
            ['modelValue'],
          )
        )
      )
    },
  }),
  Vh = Q(_h),
  Bh = { key: 0, class: 'va-skeleton__wave' },
  Th = G({
    name: 'VaSkeleton',
    __name: 'VaSkeleton',
    props: {
      color: { type: String, default: 'backgroundElement' },
      delay: { type: [Number, String], default: 100 },
      tag: { type: String, default: 'div' },
      animation: { type: String, default: 'pulse' },
      lines: { type: [String, Number], default: 1 },
      height: { type: [String], default: '5em' },
      width: { type: [String], default: '100%' },
      lineGap: { type: String, default: '8px' },
      lastLineWidth: { type: [String], default: '75%' },
      variant: { type: String, default: 'squared' },
      ariaLabel: ye('$t:loading'),
    },
    setup(e) {
      const t = e,
        a = D(!1),
        o = Pe('delay')
      let n
      ;(Me(() => {
        ;(clearTimeout(n),
          setTimeout(() => {
            a.value = !0
          }, o.value))
      }),
        et(() => {
          clearTimeout(n)
        }))
      const l = i(() => (t.variant === 'text' ? `${t.lines}em` : t.height)),
        r = i(() => (t.variant === 'circle' ? l.value : t.width)),
        { getColor: u } = Ce(),
        d = i(() => u(t.color))
      i(() => `-${t.lineGap}`)
      const c = Fe('va-skeleton', () => ({
          lines: Number(t.lines) > 1,
          text: t.variant === 'text',
          circle: t.variant === 'circle',
          hidden: !a.value,
          pulse: t.animation === 'pulse',
          wave: t.animation === 'wave',
        })),
        v = i(() =>
          t.variant === 'circle'
            ? '50%'
            : t.variant === 'rounded'
              ? `var(--va-skeleton-border-radius, calc(${l.value} / 5))`
              : '0px',
        ),
        { tp: p } = He(),
        f = Yt(),
        g = i(() => [...Object.keys(c), f.class])
      return (y, m) => (
        C(),
        U(
          pt(e.tag),
          {
            class: pe(['va-skeleton', g.value]),
            role: 'status',
            'aria-live': 'polite',
            'aria-label': s(p)(y.$props.ariaLabel),
            'aria-atomic': 'true',
            style: Y(
              `--va-color-computed: ${String(d.value)};--va-height-computed: ${String(l.value)};--va-width-computed: ${String(r.value)};--va-border-radius: ${String(v.value)};--va-line-gap: ${String(e.lineGap)};--va-last-line-width: ${String(e.lastLineWidth)}`,
            ),
          },
          {
            default: z(() => [V(y.$slots, 'default'), e.animation === 'wave' ? (C(), _('div', Bh)) : E('', !0)]),
            _: 3,
          },
          8,
          ['aria-label', 'class', 'style'],
        )
      )
    },
  }),
  Ih = G({
    name: 'VaSkeletonGroup',
    __name: 'VaSkeletonGroup',
    props: {
      color: { type: String, default: 'backgroundElement' },
      delay: { type: [Number, String], default: 100 },
      animation: { type: String, default: 'pulse' },
      lines: { type: [Number, String], default: 1 },
      lineGap: { type: String, default: '8px' },
      lastLineWidth: { type: [String], default: '75%' },
    },
    setup(e) {
      const t = e,
        a = D(!1),
        o = Pe('delay')
      let n
      ;(Me(() => {
        n = setTimeout(() => {
          a.value = !0
        }, o.value)
      }),
        Rr(() => {
          clearTimeout(n)
        }))
      const l = Fe('va-skeleton-group', () => ({ hidden: a.value === !1 })),
        r = i(() => ({ ...t, delay: 0 }))
      return (u, d) => (
        C(),
        U(
          s(Qa),
          { components: { VaSkeleton: r.value } },
          {
            default: z(() => [
              R(
                'div',
                H({ class: ['va-skeleton-group', s(l)] }, u.$attrs),
                [V(u.$slots, 'default', {}, void 0, !0)],
                16,
              ),
            ]),
            _: 3,
          },
          8,
          ['components'],
        )
      )
    },
  }),
  Ph = Ca(Ih, [['__scopeId', 'data-v-597bab9a']]),
  Ah = Q(Th),
  Lh = Q(Ph),
  Wi = Symbol('VaSidebar'),
  Oh = (e) => {
    Ot(Wi, e)
  },
  xh = () => Lt(Wi, { color: 'background-element' }),
  Ki = (e) => {
    const t = D(null)
    return (
      ca([e], () => {
        var a
        t.value = ((a = e.value) == null ? void 0 : a.clientWidth) ?? null
      }),
      St(() => {
        var a
        t.value = ((a = e.value) == null ? void 0 : a.clientWidth) ?? null
      }),
      t
    )
  },
  Eh = G({
    name: 'VaSidebar',
    __name: 'VaSidebar',
    props: {
      ...me,
      activeColor: { type: String, default: 'primary' },
      hoverColor: { type: String, default: void 0 },
      hoverOpacity: { type: [Number, String], default: 0.2, validator: (e) => Number(e) >= 0 && Number(e) <= 1 },
      borderColor: { type: String, default: void 0 },
      color: { type: String, default: 'background-element' },
      textColor: { type: String },
      gradient: { type: Boolean, default: !1 },
      minimized: { type: Boolean, default: !1 },
      hoverable: { type: Boolean, default: !1 },
      width: { type: String, default: '16rem' },
      minimizedWidth: { type: String, default: '4rem' },
      modelValue: { type: Boolean, default: !0 },
      animated: { type: [Boolean, String], default: !0 },
      closeOnClickOutside: { type: Boolean, default: !1 },
    },
    emits: ['update:modelValue'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { getColor: l } = Ce()
      Oh(o)
      const r = D(!1),
        u = i(() => o.minimized || (o.hoverable && !r.value)),
        d = D(),
        c = Ki(d),
        v = i(() => (o.modelValue === !0 || c.value === null ? !0 : c.value > 0)),
        p = D(),
        f = () => (o.modelValue ? (u.value ? o.minimizedWidth : o.width) : 0),
        g = i(() => (u.value ? o.minimizedWidth : o.width))
      St(() => {
        const I = f()
        setTimeout(() => {
          p.value = I
        })
      })
      const y = i(() => l(o.color)),
        { textColorComputed: m } = tt(y),
        b = i(() => {
          const I = l(y.value)
          return {
            color: m.value,
            backgroundColor: I,
            backgroundImage: o.gradient ? En(I) : void 0,
            overflowX: c.value === p.value ? void 0 : 'hidden',
            width: p.value,
            minWidth: p.value,
          }
        }),
        h = Fe('va-sidebar', () => ({
          minimized: u.value,
          animated: !!o.animated,
          'animated-right': o.animated === 'right',
          'animated-left': o.animated === 'left' || o.animated === !0,
        })),
        $ = (I) => {
          r.value = o.hoverable && I
        },
        S = we()
      Mo([S], () => {
        o.closeOnClickOutside &&
          o.modelValue &&
          setTimeout(() => {
            n('update:modelValue', !1)
          }, 0)
      })
      const w = i(() => ({
        textColor: o.textColor,
        activeColor: o.activeColor,
        hoverColor: o.hoverColor,
        borderColor: o.borderColor,
        hoverOpacity: o.hoverOpacity,
      }))
      return (
        t({
          isMinimized: u,
          isHovered: r,
          updateHoverState: $,
          rootElement: S,
          menu: d,
          doShowMenu: v,
          menuWidth: g,
          sidebarWidth: p,
        }),
        (I, A) => (
          C(),
          _(
            'aside',
            {
              ref_key: 'rootElement',
              ref: S,
              class: pe(['va-sidebar', s(h)]),
              style: Y(b.value),
              onMouseenter: A[0] || (A[0] = (k) => $(!0)),
              onMouseleave: A[1] || (A[1] = (k) => $(!1)),
            },
            [
              Bt(
                R(
                  'div',
                  {
                    class: 'va-sidebar__menu',
                    ref_key: 'menu',
                    ref: d,
                    style: Y({ width: g.value, minWidth: g.value }),
                  },
                  [
                    ue(
                      s(Qa),
                      { components: { VaSidebarItem: w.value } },
                      { default: z(() => [V(I.$slots, 'default')]), _: 3 },
                      8,
                      ['components'],
                    ),
                  ],
                  4,
                ),
                [[Ka, v.value]],
              ),
            ],
            38,
          )
        )
      )
    },
  }),
  Dh = Q(Eh),
  Fh = G({
    name: 'VaSidebarItem',
    __name: 'VaSidebarItem',
    props: {
      ...ba,
      ...me,
      active: { type: Boolean, default: !1 },
      textColor: { type: String, default: void 0 },
      activeColor: { type: String, default: 'primary' },
      hoverColor: { type: String, default: void 0 },
      hoverOpacity: { type: [Number, String], default: 0.2 },
      borderColor: { type: String, default: void 0 },
      disabled: { type: Boolean, default: !1 },
    },
    setup(e) {
      const t = e,
        a = ho(),
        o = xh(),
        { isHovered: n } = ao(a, ut(t, 'disabled')),
        { getColor: l, getHoverColor: r, getFocusColor: u } = Ce(),
        { hasKeyboardFocus: d, keyboardFocusListeners: c } = Ea(),
        v = i(() =>
          t.active && !n.value && !d.value
            ? l(t.activeColor)
            : d.value
              ? u(l(t.hoverColor || t.activeColor))
              : '#ffffff00',
        ),
        p = i(() => Ac(l(o == null ? void 0 : o.color), v.value)),
        { textColorComputed: f } = tt(p),
        g = i(() => {
          const b = { color: f.value }
          if (t.disabled) return b
          if (((n.value || t.active || d.value) && (b.backgroundColor = v.value), t.active)) {
            const h = { ...o, ...t }
            b.borderColor = l(h.borderColor || h.activeColor)
          }
          return (
            d.value && (b.backgroundColor = u(l(t.hoverColor || t.activeColor))),
            n.value && (b.backgroundColor = r(l(t.hoverColor || t.activeColor), Number(t.hoverOpacity))),
            b
          )
        }),
        { tagComputed: y, linkAttributesComputed: m } = Jt(t)
      return (b, h) => (
        C(),
        U(
          pt(s(y)),
          H(
            {
              ref_key: 'rootElement',
              ref: a,
              class: [
                'va-sidebar__item va-sidebar-item',
                { 'va-sidebar-item--active': b.$props.active, 'va-sidebar-item--disabled': b.$props.disabled },
              ],
              tabindex: b.$props.disabled ? -1 : 0,
              style: g.value,
            },
            s(m),
            wt(s(c)),
          ),
          { default: z(() => [V(b.$slots, 'default')]), _: 3 },
          16,
          ['tabindex', 'class', 'style'],
        )
      )
    },
  }),
  Mh = { class: 'va-sidebar__item__content va-sidebar-item-content' },
  Nh = G({
    name: 'VaSidebarItemContent',
    __name: 'VaSidebarItemContent',
    setup(e) {
      return (t, a) => (C(), _('div', Mh, [V(t.$slots, 'default')]))
    },
  }),
  Rh = { class: 'va-sidebar__title va-sidebar-item-title' },
  zh = G({
    name: 'VaSidebarItemTitle',
    __name: 'VaSidebarItemTitle',
    setup(e) {
      return (t, a) => (C(), _('div', Rh, [V(t.$slots, 'default')]))
    },
  }),
  Hh = Q(Nh),
  jh = Q(zh),
  Uh = Q(Fh),
  kr = (e, t, a, o, n) => {
    ;(((Array.isArray(e) && !n) || (!Array.isArray(e) && n)) &&
      De(
        `The type "${Array.isArray(e) ? 'array' : typeof e}" of prop "model-value" does not match prop "range = ${n}".`,
      ),
      o < a && De(`The maximum value (${o}) can not be less than the minimum value (${a}).`),
      sm(o - a, t) || De(`Step ${t} is illegal. Slider is non-divisible (Min:Max ${a}:${o}).`))
    const l = (r) => {
      r < a
        ? De(
            `The value of the slider is ${r}, the minimum value is ${a}, the value of this slider can not be less than the minimum value`,
          )
        : r > o &&
          De(
            `The value of the slider is ${r}, the maximum value is ${o}, the value of this slider can not be greater than the maximum value`,
          )
    }
    return (Array.isArray(e) ? e.map(l) : l(e), !0)
  },
  Wh = { key: 0, class: 'va-slider__input-wrapper', 'aria-hidden': 'true' },
  Kh = ['id'],
  Gh = { key: 2, class: 'va-input__label', 'aria-hidden': 'true' },
  qh = ['tabindex', 'onFocus'],
  Yh = ['tabindex'],
  Xh = { key: 3, class: 'va-input__label--inverse', 'aria-hidden': 'true' },
  Jh = ['id'],
  Zh = { key: 5, class: 'va-slider__input-wrapper' },
  Qh = G({
    name: 'VaSlider',
    __name: 'VaSlider',
    props: {
      ...Qe,
      ...me,
      range: { type: Boolean, default: !1 },
      modelValue: { type: [Number, Array], default: 0 },
      trackLabel: { type: [Function, String] },
      color: { type: String, default: 'primary' },
      trackColor: { type: String, default: '' },
      labelColor: { type: String, default: '' },
      trackLabelVisible: { type: Boolean, default: !1 },
      min: { type: [Number, String], default: 0 },
      max: { type: [Number, String], default: 100 },
      step: { type: [Number, String], default: 1 },
      label: { type: String, default: '' },
      invertLabel: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      readonly: { type: Boolean, default: !1 },
      pins: { type: Boolean, default: !1 },
      iconPrepend: { type: String, default: '' },
      iconAppend: { type: String, default: '' },
      vertical: { type: Boolean, default: !1 },
      showTrack: { type: Boolean, default: !0 },
      ariaLabel: ye('$t:sliderValue'),
    },
    emits: ['drag-start', 'drag-end', 'change', 'update:modelValue'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { getColor: n, getHoverColor: l } = Ce(),
        r = we(),
        u = we(),
        { setItemRefByIndex: d, itemRefs: c } = Go(),
        v = D(!1),
        p = D(!1),
        f = D(0),
        g = D(0),
        y = a.range ? [0, 100] : 0,
        { valueComputed: m } = Ke(a, o, 'modelValue', { defaultValue: y }),
        b = D(0),
        h = D(!1),
        $ = Pe('min'),
        S = Pe('max'),
        w = Pe('step'),
        I = i(() => (a.vertical ? [1, 0] : [0, 1])),
        A = i(() => (a.vertical ? 'bottom' : 'left')),
        k = i(() => (a.vertical ? 'height' : 'width')),
        T = i(() => Array.isArray(P.value) && P.value[1] - w.value < P.value[0]),
        O = i(() => Array.isArray(P.value) && P.value[0] + w.value > P.value[1]),
        M = Fe('va-slider', () => ({
          ...Ge(a, ['disabled', 'readonly', 'vertical']),
          active: v.value,
          horizontal: !a.vertical,
          grabbing: h.value,
        })),
        ae = Fe('va-slider__handler', () => ({ onFocus: !a.range && (p.value || v.value), inactive: !v.value })),
        oe = i(() => ({ color: a.labelColor ? n(a.labelColor) : n(a.color) })),
        B = i(() => ({ backgroundColor: a.trackColor ? n(a.trackColor) : l(n(a.color)) })),
        K = (q) => {
          const Z = $.value,
            he = S.value
          return ((ge(Z, q, he) - Z) / (he - Z)) * 100
        },
        L = i(() => {
          if (Array.isArray(P.value)) {
            const q = K(P.value[0]),
              Z = K(P.value[1])
            return {
              [A.value]: `${q}%`,
              [k.value]: `${Z - q}%`,
              backgroundColor: n(a.color),
              visibility: a.showTrack ? 'visible' : 'hidden',
            }
          } else {
            const q = K(P.value)
            return {
              [k.value]: `${q > 100 ? 100 : q}%`,
              backgroundColor: n(a.color),
              visibility: a.showTrack ? 'visible' : 'hidden',
            }
          }
        }),
        x = i(() => {
          if (Array.isArray(P.value)) {
            const q = K(P.value[0]),
              Z = K(P.value[1])
            return [
              { [A.value]: `${q}%`, backgroundColor: ve(0) ? n(a.color) : '#ffffff', borderColor: n(a.color) },
              { [A.value]: `${Z}%`, backgroundColor: ve(1) ? n(a.color) : '#ffffff', borderColor: n(a.color) },
            ]
          } else {
            const q = K(P.value)
            return {
              [A.value]: `${q > 100 ? 100 : q}%`,
              backgroundColor: ve(0) ? n(a.color) : '#ffffff',
              borderColor: n(a.color),
            }
          }
        }),
        N = (q) => (a.range ? x.value[q] : x.value),
        P = i({
          get: () => m.value,
          set: (q) => {
            ;(p.value || o('change', q), (m.value = q))
          },
        }),
        te = (q) => (a.range && q !== void 0 ? P.value[q] : P.value),
        X = i(() => {
          const q = (S.value - $.value) / w.value
          return g.value / q
        }),
        ce = i(() => {
          const q = `${w.value}`.split('.')[1]
          return q ? Math.pow(10, q.length) : 1
        }),
        ke = i(() => (S.value - $.value) / w.value - 1),
        de = i(() =>
          Array.isArray(P.value)
            ? [((P.value[0] - $.value) / w.value) * X.value, ((P.value[1] - $.value) / w.value) * X.value]
            : ((P.value - $.value) / w.value) * X.value,
        ),
        F = i(() => [0, g.value]),
        le = i(() => [$.value, S.value]),
        ve = (q) => ((!v.value && !p.value) || a.disabled || a.readonly ? !1 : a.range ? b.value === q : b.value === 0),
        W = (q, Z = b.value) => {
          var he, Be
          if ((q.preventDefault(), !Z)) {
            if (!a.range) Z = 0
            else if (Array.isArray(de.value)) {
              const Je = 'touches' in q ? q.touches[0] : q
              Z = it(Je) > (de.value[1] - de.value[0]) / 2 + de.value[0] ? 1 : 0
            }
          }
          ;(Array.isArray(P.value) && (b.value = Z),
            Array.isArray(P.value) ? (he = c.value[Z]) == null || he.focus() : (Be = u.value) == null || Be.focus(),
            (p.value = !0),
            o('drag-start'))
        },
        j = (q) => {
          !h.value ||
            !p.value ||
            a.disabled ||
            a.readonly ||
            (q.preventDefault(), 'touches' in q ? at(it(q.touches[0])) : at(it(q)))
        },
        Se = () => {
          !a.disabled &&
            !a.readonly &&
            (p.value && (o('drag-end'), o('change', P.value)), (p.value = !1), (h.value = !1))
        },
        ge = (q, Z, he) => Math.max(Math.min(Z, he), q),
        Ae = (q) => {
          var Z, he
          if (![c.value[0], c.value[1], u.value].includes(document.activeElement) || a.disabled || a.readonly) return
          const Be = ($t, bt) => {
            if (Array.isArray(P.value)) {
              const ta = P.value[bt] + ($t ? w.value : -w.value),
                _t = ge($.value, ta, S.value)
              P.value = [bt === 0 ? _t : P.value[0], bt === 1 ? _t : P.value[1]]
            } else {
              const ta = P.value + ($t ? w.value : -w.value),
                _t = ge($.value, ta, S.value)
              P.value = _t
            }
          }
          ;['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(q.key) && q.preventDefault()
          const Je = ($t) => $t === document.activeElement
          if (a.range && Array.isArray(P.value)) {
            const $t = (rt) => a.vertical && Je(c.value[0]) && rt.key === 'ArrowUp',
              bt = (rt) => a.vertical && Je(c.value[0]) && rt.key === 'ArrowDown',
              ta = (rt) => a.vertical && Je(c.value[1]) && rt.key === 'ArrowUp',
              _t = (rt) => a.vertical && Je(c.value[1]) && rt.key === 'ArrowDown',
              so = (rt) => !a.vertical && Je(c.value[0]) && rt.key === 'ArrowLeft',
              io = (rt) => !a.vertical && Je(c.value[0]) && rt.key === 'ArrowRight',
              Wt = (rt) => !a.vertical && Je(c.value[1]) && rt.key === 'ArrowLeft',
              Yo = (rt) => !a.vertical && Je(c.value[1]) && rt.key === 'ArrowRight'
            switch (!0) {
              case (_t(q) || Wt(q)) && T.value && P.value[0] !== $.value:
                ;((Z = c.value[0]) == null || Z.focus(), Be(0, 0))
                break
              case ($t(q) || io(q)) && O.value && P.value[1] !== S.value:
                ;((he = c.value[1]) == null || he.focus(), Be(1, 1))
                break
              case (bt(q) || so(q)) && P.value[0] !== $.value:
                Be(0, 0)
                break
              case (ta(q) || Yo(q)) && P.value[1] !== S.value:
                Be(1, 1)
                break
              case (_t(q) || Wt(q)) && P.value[1] !== $.value:
                Be(0, 1)
                break
              case ($t(q) || io(q)) && P.value[0] !== S.value:
                Be(1, 0)
                break
            }
          } else
            a.vertical
              ? (q.key === 'ArrowDown' && Be(0, 0), q.key === 'ArrowUp' && Be(1, 0))
              : (q.key === 'ArrowLeft' && Be(0, 0), q.key === 'ArrowRight' && Be(1, 0))
        },
        je = (q) =>
          Array.isArray(P.value) ? q * w.value > P.value[0] && q * w.value < P.value[1] : q * w.value < P.value,
        ot = i(() => (w.value / (S.value - $.value)) * 100),
        ct = (q) => ({
          backgroundColor: je(q) ? n(a.color) : l(n(a.color)),
          [A.value]: `${q * ot.value}%`,
          transition: h.value ? 'none' : 'var(--va-slider-pin-transition)',
        }),
        it = (q) => (Le(), a.vertical ? f.value - q.clientY : q.clientX - f.value),
        Le = () => {
          r.value &&
            ((g.value = r.value[a.vertical ? 'offsetHeight' : 'offsetWidth']),
            (f.value = r.value.getBoundingClientRect()[A.value]))
        },
        Ve = (q) => (w.value * ce.value * q + $.value * ce.value) / ce.value,
        $e = (q, Z) => (a.trackLabel ? (typeof a.trackLabel == 'function' ? a.trackLabel(q, Z) : a.trackLabel) : q),
        _e = (q) => {
          const Z = b.value
          Array.isArray(P.value)
            ? vt(P.value[Z], q) && (Z === 0 ? (P.value = [q, P.value[1]]) : (P.value = [P.value[0], q]))
            : q < $.value
              ? (P.value = $.value)
              : q > S.value
                ? (P.value = S.value)
                : vt(P.value, q) && (P.value = q)
        },
        at = (q) => {
          const Z = F.value,
            he = le.value,
            Be = Array.isArray(P.value) ? c.value[b.value] : u.value
          if ((Be == null || Be.focus(), q >= Z[0] && q <= Z[1])) {
            const Je = Ve(Math.round(q / X.value))
            b.value
              ? Array.isArray(de.value) && Array.isArray(P.value) && q <= de.value[0]
                ? ((P.value = [Je, P.value[0]]), (b.value = 0))
                : _e(Je)
              : Array.isArray(de.value) && Array.isArray(P.value) && q >= de.value[1]
                ? ((P.value = [P.value[1], Je]), (b.value = 1))
                : _e(Je)
          } else q < Z[0] ? _e(he[0]) : _e(he[1])
        },
        vt = (q, Z) => JSON.stringify(q) !== JSON.stringify(Z),
        yt = (q) => {
          if (a.disabled || a.readonly) return
          const Z = 'touches' in q ? it(q.touches[0]) : it(q)
          ;(Array.isArray(de.value) && (b.value = Z > (de.value[1] - de.value[0]) / 2 + de.value[0] ? 1 : 0),
            (h.value = !0),
            at(Z),
            W(q, b.value))
        },
        Sa = () => {
          ;(document.addEventListener('mousemove', j),
            document.addEventListener('touchmove', j, { passive: !1 }),
            document.addEventListener('mouseup', Se),
            document.addEventListener('mouseleave', Se),
            document.addEventListener('touchcancel', Se),
            document.addEventListener('touchend', Se),
            document.addEventListener('keydown', Ae))
        },
        Ut = () => {
          ;(document.removeEventListener('mousemove', j),
            document.removeEventListener('touchmove', j),
            document.removeEventListener('mouseup', Se),
            document.removeEventListener('mouseleave', Se),
            document.removeEventListener('touchcancel', Se),
            document.removeEventListener('touchend', Se),
            document.removeEventListener('keydown', Ae))
        },
        Fa = Dt(),
        Qt = i(() => `aria-label-id-${Fa}`),
        { tp: Ma } = He(),
        ea = dt(),
        $a = i(() => ({
          role: 'slider',
          'aria-valuemin': $.value,
          'aria-valuemax': S.value,
          'aria-label': !ea.label && !a.label ? Ma(a.ariaLabel, { value: String(P.value) }) : void 0,
          'aria-labelledby': ea.label || a.label ? Qt.value : void 0,
          'aria-orientation': a.vertical ? 'vertical' : 'horizontal',
          'aria-disabled': a.disabled,
          'aria-readonly': a.readonly,
          'aria-valuenow': Array.isArray(P.value) ? void 0 : P.value,
          'aria-valuetext': Array.isArray(P.value) ? String(P.value) : void 0,
        }))
      return (
        Me(() => {
          kr(P.value, w.value, $.value, S.value, a.range) && (Le(), Sa())
        }),
        et(Ut),
        re([P, () => w.value, () => $.value, () => S.value, () => a.range], ([q, Z, he, Be, Je]) => {
          kr(q, Z, he, Be, Je)
        }),
        re(h, (q) => {
          document.documentElement.style.cursor = q ? 'grabbing' : ''
        }),
        (q, Z) => (
          C(),
          _(
            'div',
            H({ class: ['va-slider', s(M)] }, $a.value),
            [
              (e.vertical ? q.$slots.append : q.$slots.prepend)
                ? (C(), _('div', Wh, [V(q.$slots, e.vertical ? 'append' : 'prepend')]))
                : E('', !0),
              (q.$slots.label || e.label) && !e.invertLabel
                ? (C(),
                  _(
                    'span',
                    { key: 1, class: 'va-input__label', id: Qt.value, style: Y(oe.value) },
                    [V(q.$slots, 'label', {}, () => [Te(fe(e.label), 1)])],
                    12,
                    Kh,
                  ))
                : E('', !0),
              (e.vertical ? e.iconAppend : e.iconPrepend)
                ? (C(),
                  _('span', Gh, [
                    ue(
                      s(Oe),
                      { name: e.vertical ? e.iconAppend : e.iconPrepend, color: s(n)(q.$props.color), size: 16 },
                      null,
                      8,
                      ['name', 'color'],
                    ),
                  ]))
                : E('', !0),
              R(
                'div',
                {
                  ref_key: 'sliderContainer',
                  ref: r,
                  class: 'va-slider__container',
                  onMousedown: yt,
                  onTouchstart: yt,
                },
                [
                  R('div', { class: 'va-slider__track', 'aria-hidden': 'true', style: Y(B.value) }, null, 4),
                  e.pins
                    ? (C(!0),
                      _(
                        be,
                        { key: 0 },
                        Ie(
                          ke.value,
                          (he, Be) => (
                            C(),
                            _(
                              'div',
                              {
                                key: Be,
                                class: pe(['va-slider__mark', { 'va-slider__mark--active': je(he) }]),
                                style: Y(ct(he)),
                              },
                              null,
                              6,
                            )
                          ),
                        ),
                        128,
                      ))
                    : E('', !0),
                  q.$props.range
                    ? (C(),
                      _(
                        be,
                        { key: 1 },
                        [
                          R(
                            'div',
                            {
                              ref: 'process',
                              class: pe([
                                'va-slider__track va-slider__track--selected',
                                { 'va-slider__track--active': v.value },
                              ]),
                              'aria-hidden': 'true',
                              style: Y(L.value),
                            },
                            null,
                            6,
                          ),
                          (C(!0),
                          _(
                            be,
                            null,
                            Ie(
                              I.value,
                              (he) => (
                                C(),
                                _(
                                  'div',
                                  {
                                    key: 'dot' + he,
                                    ref_for: !0,
                                    ref: s(d)(he),
                                    class: pe(['va-slider__handler', s(ae)]),
                                    style: Y(N(he)),
                                    tabindex: e.disabled || e.readonly ? void 0 : 0,
                                    onFocus: (Be) => ((v.value = !0), (b.value = he)),
                                    onBlur: Z[0] || (Z[0] = (Be) => (v.value = !1)),
                                  },
                                  [
                                    ve(he)
                                      ? (C(),
                                        _(
                                          'div',
                                          {
                                            key: 0,
                                            style: Y({ backgroundColor: s(n)(q.$props.color) }),
                                            class: 'va-slider__handler__dot--focus',
                                          },
                                          null,
                                          4,
                                        ))
                                      : E('', !0),
                                    e.trackLabelVisible
                                      ? (C(),
                                        _(
                                          'div',
                                          { key: 1, style: Y(oe.value), class: 'va-slider__handler__dot--value' },
                                          [
                                            V(q.$slots, 'trackLabel', J(ie({ value: te(he), order: he })), () => [
                                              Te(fe($e(te(he), he)), 1),
                                            ]),
                                          ],
                                          4,
                                        ))
                                      : E('', !0),
                                  ],
                                  46,
                                  qh,
                                )
                              ),
                            ),
                            128,
                          )),
                        ],
                        64,
                      ))
                    : (C(),
                      _(
                        be,
                        { key: 2 },
                        [
                          R(
                            'div',
                            {
                              ref: 'process',
                              'aria-hidden': 'true',
                              class: pe([
                                'va-slider__track va-slider__track--selected',
                                { 'va-slider__track--active': v.value },
                              ]),
                              style: Y(L.value),
                            },
                            null,
                            6,
                          ),
                          R(
                            'div',
                            {
                              ref_key: 'dot',
                              ref: u,
                              class: pe(['va-slider__handler', s(ae)]),
                              style: Y(x.value),
                              tabindex: q.$props.disabled || q.$props.readonly ? void 0 : 0,
                              onFocus: Z[1] || (Z[1] = (he) => (v.value = !0)),
                              onBlur: Z[2] || (Z[2] = (he) => (v.value = !1)),
                            },
                            [
                              ve(0)
                                ? (C(),
                                  _(
                                    'div',
                                    {
                                      key: 0,
                                      class: 'va-slider__handler__dot--focus',
                                      style: Y({ backgroundColor: s(n)(q.$props.color) }),
                                    },
                                    null,
                                    4,
                                  ))
                                : E('', !0),
                              e.trackLabelVisible
                                ? (C(),
                                  _(
                                    'div',
                                    { key: 1, class: 'va-slider__handler__dot--value', style: Y(oe.value) },
                                    [V(q.$slots, 'trackLabel', J(ie({ value: te() })), () => [Te(fe($e(te())), 1)])],
                                    4,
                                  ))
                                : E('', !0),
                            ],
                            46,
                            Yh,
                          ),
                        ],
                        64,
                      )),
                ],
                544,
              ),
              (e.vertical ? e.iconPrepend : e.iconAppend)
                ? (C(),
                  _('span', Xh, [
                    ue(
                      s(Oe),
                      { name: e.vertical ? e.iconPrepend : e.iconAppend, color: s(n)(q.$props.color), size: 16 },
                      null,
                      8,
                      ['name', 'color'],
                    ),
                  ]))
                : E('', !0),
              (q.$slots.label || e.label) && e.invertLabel
                ? (C(),
                  _(
                    'span',
                    { key: 4, class: 'va-input__label va-input__label--inverse', style: Y(oe.value), id: Qt.value },
                    [V(q.$slots, 'label', {}, () => [Te(fe(e.label), 1)])],
                    12,
                    Jh,
                  ))
                : E('', !0),
              (e.vertical ? q.$slots.prepend : q.$slots.append)
                ? (C(), _('div', Zh, [V(q.$slots, e.vertical ? 'prepend' : 'append')]))
                : E('', !0),
            ],
            16,
          )
        )
      )
    },
  }),
  e0 = Q(Qh),
  wr = (e) => typeof e == 'number',
  t0 = { vertical: { type: Boolean, default: !1 }, disabled: { type: Boolean, default: !1 } },
  a0 = (e, t, a) => {
    const o = D(!1),
      n = D(0),
      l = D(0),
      r = D(0),
      u = (p, f) => {
        const g = p.type === f ? p : p.changedTouches[0]
        return a.vertical ? g.pageY : g.pageX
      },
      d = (p) => {
        a.disabled || !e.value || ((o.value = !0), (n.value = u(p, 'mousedown')), (l.value = t.value))
      },
      c = (p) => {
        if (!o.value) return
        const g = u(p, 'mousemove') - n.value
        r.value = l.value + Math.floor((g / e.value) * 100)
      },
      v = () => {
        o.value = !1
      }
    return (
      We(['mousemove', 'touchmove'], c),
      We(['mouseup', 'touchcancel'], v),
      { isDragging: o, startDragging: d, currentSplitterPosition: r }
    )
  },
  o0 = ['aria-label'],
  n0 = { class: 'va-split__dragger' },
  l0 = G({
    name: 'VaSplit',
    __name: 'VaSplit',
    props: {
      ...me,
      ...t0,
      ...Qe,
      modelValue: { type: Number, default: 50, validator: (e) => e <= 100 },
      maximization: { type: Boolean, default: !1 },
      maximizeStart: { type: Boolean, default: !1 },
      limits: { type: Array, default: () => [0, 0] },
      snapping: { type: Array, default: void 0 },
      snappingRange: { type: [Number, String], default: 4 },
      ariaLabel: ye('$t:splitPanels'),
    },
    emits: [...lt],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        { valueComputed: l } = Ke(a, o),
        r = D(),
        u = D(16),
        d = () => {
          var B
          const { width: K, height: L } = ((B = n.value) == null ? void 0 : B.getBoundingClientRect()) || {
            width: 0,
            height: 0,
          }
          ;((r.value = a.vertical ? L : K), (u.value = parseFloat(getComputedStyle(document.documentElement).fontSize)))
        }
      ;(Me(d), ca([n], d))
      const c = (B, K) => {
          let L = '',
            x = ''
          if (wr(B)) return B
          switch (
            (B.split('')
              .filter((N) => N && N !== ' ')
              .forEach((N) => {
                isNaN(+N) ? (x += N) : (L += N)
              }),
            x)
          ) {
            case '%':
              return +L
            case 'px':
              return (+L / r.value) * 100
            case 'rem':
              return ((+L * u.value) / r.value) * 100
            case 'any':
              return ['min', 'snapping'].includes(K) ? 0 : 100
            case '':
              return 100
            default:
              return (De('Invalid limits measure!'), 0)
          }
        },
        v = (B) => {
          if (B === 'undefined' || !r.value) return
          let K = 0,
            L = 100
          return (
            (wo(B) || wr(B)) && (K = c(B, 'min')),
            Array.isArray(B) && ((K = c(B[0], 'min')), (L = c(B[1], 'max'))),
            K > L && (De(`Min panels size can not be larger than max one! Passed limit: ${B}.`), (L = K)),
            { min: K ?? 0, max: L ?? 100 }
          )
        },
        p = i(() => v(a.limits[0]) ?? { min: 0, max: 100 }),
        f = i(() => v(a.limits[1]) ?? { min: 0, max: 100 }),
        g = i(() => {
          const B = !(p.value.min + f.value.min > 100)
          return (
            B || De('The sum of different panels min sizes should be lesser or equal to 100% of the container size!'),
            B ? f.value.min : 100 - p.value.min
          )
        }),
        y = i(
          () => (
            Math.ceil(f.value.max + p.value.max) < 100 &&
              De('The sum of different panels max sizes should be equal to 100% of the container size!'),
            {
              start: { min: p.value.min, max: Math.min(p.value.max, 100 - g.value) },
              end: { min: g.value, max: Math.min(f.value.max, 100 - p.value.min) },
            }
          ),
        ),
        m = (B) => B >= y.value.start.min && B >= y.value.end.min && B <= y.value.start.max && B <= y.value.end.max,
        b = i(() => {
          if (!Array.isArray(a.snapping) || !r.value) return
          let B = a.snapping.map((L) => c(L, 'snapping'))
          if (!B.every(m)) {
            const L = B.filter(m)
            ;(De(
              `Some of the snapping marks (${B}) are not in allowed range (${Object.values(y.value.start).join('-')} / ${Object.values(y.value.end).join('-')}) and will be removed (${L})!`,
            ),
              (B = L))
          }
          return (
            B.every((L, x, N) => (N[x + 1] ? Math.abs(L - N[x + 1]) > Number(a.snappingRange) : !0)) ||
              De('Distance between some snapping marks is lesser than snapping range!'),
            B
          )
        }),
        h = i(() => c(a.snappingRange, 'snapping')),
        $ = D(l.value),
        S = i(() => {
          if (b.value) {
            const B = b.value.find((K) => $.value + h.value > K && $.value - h.value < K)
            if (B) return B
          }
          return da(
            $.value,
            Math.max(y.value.start.min, 100 - y.value.end.max),
            Math.min(y.value.start.max, 100 - y.value.end.min),
          )
        }),
        { isDragging: w, startDragging: I, currentSplitterPosition: A } = a0(r, S, a),
        k = () => {
          !a.maximization || a.disabled || ($.value = a.maximizeStart ? y.value.start.max : 100 - y.value.end.max)
        }
      ;(re(
        l,
        (B) => {
          ;((B < y.value.start.min || B > 100 - y.value.end.min) &&
            De('Incorrect `modelValue`. Check current `limits` prop value.'),
            ($.value = B))
        },
        { immediate: !0 },
      ),
        re(A, (B) => {
          $.value = B
        }),
        re(w, (B) => {
          ;(B || (l.value = S.value),
            (document.documentElement.style.cursor = B ? 'var(--va-split-dragging-cursor)' : ''))
        }))
      const T = i(() => (a.vertical ? 'height' : 'width')),
        O = (B) => {
          let K = B === 'start' ? S.value : 100 - S.value
          return (K < 0 && (K = 0), K > 100 && (K = 100), { [T.value]: `${K}%` })
        },
        M = i(() =>
          a.disabled
            ? {}
            : w.value
              ? { cursor: 'var(--va-split-dragging-cursor)' }
              : {
                  cursor: a.vertical
                    ? 'var(--va-split-vertical-dragger-cursor)'
                    : 'var(--va-split-horizontal-dragger-cursor)',
                },
        ),
        ae = Fe('va-split', () => ({ horizontal: !a.vertical, vertical: a.vertical, dragging: w.value })),
        { tp: oe } = He()
      return (B, K) => (
        C(),
        _(
          'section',
          {
            ref_key: 'splitPanelsContainer',
            ref: n,
            class: pe(['va-split', s(ae)]),
            'aria-label': s(oe)(B.$props.ariaLabel),
          },
          [
            R(
              'div',
              { class: 'va-split__panel', style: Y(O('start')) },
              [V(B.$slots, 'start', J(ie({ containerSize: r.value })))],
              4,
            ),
            R('div', n0, [
              R(
                'div',
                {
                  class: 'va-split__dragger__overlay',
                  style: Y(M.value),
                  onMousedown: K[0] || (K[0] = ne((...L) => s(I) && s(I)(...L), ['prevent'])),
                  onTouchstart: K[1] || (K[1] = ne((...L) => s(I) && s(I)(...L), ['prevent'])),
                  onDblclick: ne(k, ['prevent']),
                  onContextmenu: K[2] || (K[2] = ne(() => {}, ['prevent'])),
                  onDragstart: K[3] || (K[3] = ne(() => {}, ['prevent'])),
                },
                [
                  V(B.$slots, 'grabber', {}, () => [
                    ue(s(Pi), { class: 'va-split__dragger__default', vertical: !B.$props.vertical }, null, 8, [
                      'vertical',
                    ]),
                  ]),
                ],
                36,
              ),
            ]),
            R(
              'div',
              { class: 'va-split__panel', style: Y(O('end')) },
              [V(B.$slots, 'end', J(ie({ containerSize: r.value })))],
              4,
            ),
          ],
          10,
          o0,
        )
      )
    },
  }),
  r0 = Q(l0),
  Gi = Symbol('TabsView'),
  s0 = ['aria-disabled'],
  i0 = R('div', { class: 'va-tabs__slider' }, null, -1),
  u0 = [i0],
  c0 = { class: 'va-tabs__tabs-items' },
  d0 = { class: 'va-tabs__content' },
  Gt = (e) => (e == null ? void 0 : e.clientWidth) || 0,
  v0 = G({
    name: 'VaTabs',
    __name: 'VaTabs',
    props: {
      ...Qe,
      ...me,
      modelValue: { type: [String, Number], default: null },
      left: { type: Boolean, default: !0 },
      right: { type: Boolean, default: !1 },
      center: { type: Boolean, default: !1 },
      grow: { type: Boolean, default: !1 },
      hidePagination: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      hideSlider: { type: Boolean, default: !1 },
      vertical: { type: Boolean, default: !1 },
      color: { type: String, default: 'primary' },
      prevIcon: { type: String, default: 'va-arrow-left' },
      nextIcon: { type: String, default: 'va-arrow-right' },
      ariaMoveRightLabel: ye('$t:movePaginationLeft'),
      ariaMoveLeftLabel: ye('$t:movePaginationRight'),
    },
    emits: ['update:modelValue', 'click:next', 'click:prev'],
    setup(e, { expose: t, emit: a }) {
      const { tp: o } = He(),
        n = e,
        l = a,
        r = we(),
        u = we(),
        d = we(),
        c = D([]),
        v = D(null),
        p = D(null),
        f = D(0),
        g = D(0),
        y = D(!1),
        m = D(0),
        b = D(0),
        h = D(!1),
        { valueComputed: $ } = Ke(n, l),
        S = Nt({ VaTab: { color: n.color } }),
        w = i(() => {
          const { left: F, right: le, center: ve, grow: W, disabled: j } = n
          return {
            'va-tabs__container--left': F && !le && !ve && !W,
            'va-tabs__container--right': le,
            'va-tabs__container--center': ve,
            'va-tabs__container--grow': W,
            'va-tabs__container--disabled': j,
          }
        }),
        I = i(() => ({ 'va-tabs--vertical': n.vertical })),
        { getColor: A } = Ce(),
        k = i(() => A(n.color)),
        T = i(() =>
          n.hideSlider
            ? { display: 'none' }
            : {
                backgroundColor: k.value,
                height: n.vertical ? `${v.value}px` : '',
                width: n.vertical ? '' : `${p.value}px`,
                transform: `translateY(-${g.value}px) translateX(${f.value}px)`,
                transition: h.value ? 'var(--va-tabs-slider-wrapper-transition)' : '',
              },
        ),
        O = i(() =>
          n.vertical
            ? { transform: 'translateX(0px)' }
            : {
                transform: `translateX(${b.value - m.value}px)`,
                transition: h.value ? 'var(--va-tabs-slider-transition)' : '',
                position: n.hidePagination ? 'unset' : 'absolute',
              },
        ),
        M = i(() => m.value === 0),
        ae = i(() => {
          const F = c.value[c.value.length - 1],
            le = s(F.leftSidePosition),
            ve = s(F.rightSidePosition),
            W = Gt(u.value)
          return ve <= m.value + W || le <= m.value
        }),
        oe = () => {
          ;((p.value = 0), (v.value = 0))
        },
        B = (F) => {
          const le = Gt(u.value),
            ve = s(F.leftSidePosition),
            W = s(F.rightSidePosition)
          if (!y.value) {
            m.value = 0
            return
          }
          if (!(ve - m.value >= 0 && W - m.value <= le)) {
            if (ve - m.value < 0) {
              m.value = ve
              return
            }
            if (W - m.value > le) {
              m.value = W - le
              return
            }
            m.value = 0
          }
        },
        K = () => {
          if (((b.value = 0), !y.value)) return
          const F = Gt(u.value),
            le = Gt(d.value)
          n.right ? (b.value = le - F) : n.center && (b.value = Math.floor((le - F) / 2))
        },
        L = () => {
          ;(oe(),
            c.value.forEach((F) => {
              var le
              F.updateSidePositions()
              const ve = (((le = F.name) == null ? void 0 : le.value) || F.id) === $.value
              ;((F.isActive = F.isActiveRouterLink || ve), F.isActive && (B(F), te(F)))
            }),
            K())
        }
      St(() => {
        L()
      })
      const x = () => {
          const F = Gt(d.value),
            le = Gt(r.value)
          requestAnimationFrame(() => {
            y.value = !!(d.value && r.value && F > le)
          })
        },
        N = () => {
          var F, le
          const ve = Gt(u.value)
          let W = m.value - ve
          for (let j = 0; j < c.value.length - 1; j++) {
            const Se = s((F = c.value[j]) == null ? void 0 : F.leftSidePosition),
              ge = s((le = c.value[j + 1]) == null ? void 0 : le.leftSidePosition)
            if ((Se > W && Se < m.value) || ge >= m.value) {
              W = Se
              break
            }
          }
          ;((m.value = Math.max(0, W)), l('click:prev'))
        },
        P = () => {
          var F
          const le = Gt(u.value),
            ve = m.value + le
          let W = ve
          for (
            let ge = 0;
            ge < c.value.length - 1 &&
            !(s(c.value[ge].rightSidePosition) > ve && ((W = s(c.value[ge].leftSidePosition)), m.value < W));
            ge++
          );
          const Se = s((F = c.value[c.value.length - 1]) == null ? void 0 : F.rightSidePosition) - le
          ;((W = Math.min(Se, W)), (m.value = Math.max(0, W)), l('click:next'))
        },
        te = (F) => {
          var le
          const ve = s(F.tabElement),
            W = (ve == null ? void 0 : ve.offsetTop) || 0,
            j = (ve == null ? void 0 : ve.offsetLeft) || 0,
            Se = (ve == null ? void 0 : ve.clientHeight) || 0,
            ge = (ve == null ? void 0 : ve.clientWidth) || 0
          if (n.vertical) {
            const je = (((le = u.value) == null ? void 0 : le.clientHeight) || 0) - W - Se
            ;((g.value = Math.max(je, 0)), (v.value = Se), (f.value = 0), (p.value = 0))
          } else ((f.value = j), (p.value = ge), (g.value = 0), (v.value = 0))
        },
        X = () => {
          h.value ||
            requestAnimationFrame(() => {
              h.value = !0
            })
        },
        ce = (F) => {
          var le
          F && (($.value = ((le = F.name) == null ? void 0 : le.value) || F.id), n.stateful && L())
        },
        ke = (F) => {
          var le
          const ve = c.value.push(F) - 1
          F.id = ((le = F.name) == null ? void 0 : le.value) || ve
        },
        de = (F) => {
          ;((c.value = c.value.filter((le) => le.id !== F.id)),
            c.value.forEach((le, ve) => {
              var W
              le.id = ((W = le.name) == null ? void 0 : W.value) || ve
            }))
        }
      return (
        Ot(Gi, { parentDisabled: n.disabled, selectTab: ce, moveToTab: B, registerTab: ke, unregisterTab: de }),
        re(() => n.modelValue, L),
        ca([r], x),
        ca([u], L),
        Me(() => {
          requestAnimationFrame(() => {
            X()
          })
        }),
        t({ selectTab: ce, moveToTab: B, movePaginationLeft: N, movePaginationRight: P }),
        (F, le) => (
          C(),
          _(
            'div',
            { class: pe(['va-tabs', I.value]) },
            [
              R(
                'div',
                {
                  ref_key: 'wrapper',
                  ref: r,
                  class: 'va-tabs__wrapper',
                  role: 'tablist',
                  'aria-disabled': F.$props.disabled,
                },
                [
                  y.value && !F.$props.hidePagination
                    ? (C(),
                      U(
                        s(xe),
                        {
                          key: 0,
                          class: 'va-tabs__pagination',
                          'aria-label': s(o)(F.$props.ariaMoveLeftLabel),
                          size: 'medium',
                          disabled: M.value,
                          color: e.color,
                          preset: 'secondary',
                          icon: F.$props.prevIcon,
                          onClick: N,
                        },
                        null,
                        8,
                        ['aria-label', 'disabled', 'color', 'icon'],
                      ))
                    : E('', !0),
                  R(
                    'div',
                    { ref_key: 'container', ref: u, class: pe(['va-tabs__container', w.value]) },
                    [
                      R(
                        'div',
                        { ref_key: 'tabs', ref: d, class: 'va-tabs__tabs', style: Y(O.value) },
                        [
                          R(
                            'div',
                            { class: 'va-tabs__slider-wrapper', 'aria-hidden': 'true', style: Y(T.value) },
                            u0,
                            4,
                          ),
                          ue(
                            s(Qa),
                            { components: S },
                            { default: z(() => [R('div', c0, [V(F.$slots, 'tabs')])]), _: 3 },
                            8,
                            ['components'],
                          ),
                        ],
                        4,
                      ),
                    ],
                    2,
                  ),
                  y.value && !F.$props.hidePagination
                    ? (C(),
                      U(
                        s(xe),
                        {
                          key: 1,
                          class: 'va-tabs__pagination',
                          'aria-label': s(o)(F.$props.ariaMoveRightLabel),
                          size: 'medium',
                          color: e.color,
                          disabled: ae.value,
                          preset: 'secondary',
                          icon: F.$props.nextIcon,
                          onClick: P,
                        },
                        null,
                        8,
                        ['aria-label', 'color', 'disabled', 'icon'],
                      ))
                    : E('', !0),
                ],
                8,
                s0,
              ),
              R('div', d0, [V(F.$slots, 'default')]),
            ],
            2,
          )
        )
      )
    },
  }),
  p0 = Q(v0),
  f0 = { class: 'va-tab__content' },
  m0 = ['textContent'],
  g0 = G({
    name: 'VaTab',
    __name: 'VaTab',
    props: {
      ...ba,
      ...me,
      selected: { type: Boolean, default: !1 },
      color: { type: String, default: '' },
      icon: { type: String, default: '' },
      label: { type: String, default: '' },
      disabled: { type: Boolean },
      name: { type: [String, Number] },
      tag: { type: String, default: 'div' },
    },
    emits: ['click', 'keydown-enter', 'focus'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        n = we(),
        l = i(() => Xe(n.value)),
        r = D(!1),
        u = D(!1),
        d = D(0),
        c = D(0),
        { keyboardFocusListeners: v, hasKeyboardFocus: p } = Ea(),
        { tagComputed: f, isActiveRouterLink: g, linkAttributesComputed: y } = Jt(a),
        m = i(() => ({ 'va-tab--disabled': a.disabled })),
        {
          parentDisabled: b,
          selectTab: h,
          moveToTab: $,
          registerTab: S,
          unregisterTab: w,
        } = Lt(Gi, {
          parentDisabled: !1,
          tabsList: [],
          selectTab: (x) => x,
          moveToTab: (x) => x,
          registerTab: (x) => x,
          unregisterTab: (x) => x,
        }),
        I = i(() => (a.disabled || b ? -1 : 0)),
        { getColor: A } = Ce(),
        k = i(() => A(a.color)),
        T = i(() => ({ color: u.value || r.value ? k.value : 'inherit' })),
        O = (x) => {
          u.value = x
        },
        M = () => {
          var x, N
          const P = ((x = l.value) == null ? void 0 : x.offsetLeft) || 0,
            te = ((N = l.value) == null ? void 0 : N.offsetWidth) || 0
          ;((d.value = P + te), (c.value = P))
        },
        ae = Ki(n)
      re(ae, () => {
        M()
      })
      const oe = async () => {
          ;(await Ye(), h(L), o('click'))
        },
        B = async () => {
          ;(await Ye(), h(L), o('keydown-enter'))
        },
        K = () => {
          ;(p.value && $(L), o('focus'))
        },
        L = {
          name: i(() => a.name),
          id: null,
          tabElement: l,
          isActive: r,
          tabIndexComputed: I,
          isActiveRouterLink: g,
          rightSidePosition: d,
          leftSidePosition: c,
          onTabClick: oe,
          onTabKeydown: B,
          onFocus: K,
          updateSidePositions: M,
        }
      return (
        Me(() => {
          S(L)
        }),
        et(() => {
          w(L)
        }),
        (x, N) => (
          C(),
          U(
            pt(s(f)),
            H(
              {
                ref_key: 'rootElement',
                ref: n,
                class: ['va-tab', m.value],
                role: 'tab',
                'aria-selected': r.value,
                'aria-disabled': x.$props.disabled || s(b),
                style: T.value,
                onMouseenter: N[0] || (N[0] = (P) => O(!0)),
                onMouseleave: N[1] || (N[1] = (P) => O(!1)),
                onFocus: K,
                onClick: oe,
                onKeydown: se(B, ['enter']),
                tabindex: I.value,
              },
              wt(s(v)),
              s(y),
            ),
            {
              default: z(() => [
                R('div', f0, [
                  V(x.$slots, 'default', {}, () => [
                    e.icon
                      ? (C(),
                        U(s(Oe), { key: 0, class: 'va-tab__icon', size: 'small', name: e.icon }, null, 8, ['name']))
                      : E('', !0),
                    R('span', { class: 'va-tab__label', textContent: fe(e.label) }, null, 8, m0),
                  ]),
                ]),
              ]),
              _: 3,
            },
            16,
            ['aria-selected', 'aria-disabled', 'class', 'style', 'tabindex'],
          )
        )
      )
    },
  }),
  y0 = Q(g0),
  nl = (e, ...t) => (Xa(e) ? e(...t) : e),
  b0 = { class: 'va-stepper__default-controls' },
  h0 = G({
    name: 'VaStepperControls',
    __name: 'VaStepperControls',
    props: {
      modelValue: { type: [Number, String], required: !0 },
      steps: { type: Array, required: !0 },
      nextDisabled: { type: Boolean, required: !0 },
      stepControls: { type: Object, required: !0 },
      finishButtonHidden: { type: Boolean, default: !1 },
    },
    setup(e) {
      const t = e,
        { t: a } = He(),
        o = i(() => {
          const l = t.steps[Number(t.modelValue)]
          return nl(l.isLoading) || !1
        }),
        n = i(() => {
          const l = t.steps.length - 1
          return Number(t.modelValue) >= l
        })
      return (l, r) => (
        C(),
        _('div', b0, [
          ue(
            s(xe),
            {
              preset: 'primary',
              disabled: Number(l.$props.modelValue) <= 0,
              loading: o.value,
              onClick: r[0] || (r[0] = (u) => l.$props.stepControls.prevStep()),
            },
            { default: z(() => [Te(fe(s(a)('back')), 1)]), _: 1 },
            8,
            ['disabled', 'loading'],
          ),
          n.value
            ? l.$props.finishButtonHidden
              ? E('', !0)
              : (C(),
                U(
                  s(xe),
                  { key: 1, onClick: r[2] || (r[2] = (u) => l.$props.stepControls.finish()), loading: o.value },
                  { default: z(() => [Te(fe(s(a)('finish')), 1)]), _: 1 },
                  8,
                  ['loading'],
                ))
            : (C(),
              U(
                s(xe),
                {
                  key: 0,
                  onClick: r[1] || (r[1] = (u) => l.$props.stepControls.nextStep()),
                  disabled: l.$props.nextDisabled,
                  loading: o.value,
                },
                { default: z(() => [Te(fe(s(a)('next')), 1)]), _: 1 },
                8,
                ['disabled', 'loading'],
              )),
        ])
      )
    },
  }),
  wa = (e) => nl(e.hasError, e) || !1,
  C0 = { class: 'va-stepper__step-button__icon' },
  S0 = G({
    name: 'VaStepperStepButton',
    __name: 'VaStepperStepButton',
    props: {
      modelValue: { type: Number, required: !0 },
      step: { type: Object, required: !0 },
      color: { type: String, required: !0 },
      stepIndex: { type: [Number, String], required: !0 },
      navigationDisabled: { type: Boolean, required: !0 },
      nextDisabled: { type: Boolean, required: !0 },
      focus: { type: Object, required: !0 },
      stepControls: { type: Object, required: !0 },
    },
    emits: ['update:modelValue'],
    setup(e, { emit: t }) {
      const a = e,
        o = we(),
        n = i(() => wa(a.step)),
        l = Pe('stepIndex'),
        r = i(() => n.value && a.modelValue === l.value),
        u = i(() => nl(a.step.isLoading) || !1),
        { getColor: d } = Ce(),
        c = i(() => d(n.value ? 'danger' : a.color)),
        v = (y) => a.nextDisabled && y > a.modelValue,
        { t: p } = He(),
        f = Fe('va-stepper__step-button', () => ({
          active: a.modelValue >= l.value,
          disabled: a.step.disabled || v(l.value),
          'navigation-disabled': a.navigationDisabled,
          error: r.value,
        }))
      re(
        () => a.focus,
        () => {
          a.focus.trigger &&
            Ye(() => {
              var y
              return (y = o.value) == null ? void 0 : y.focus()
            })
        },
        { deep: !0 },
      )
      const g = i(() => ({
        tabindex: a.focus.stepIndex === l.value && !a.navigationDisabled ? 0 : void 0,
        'aria-disabled': a.step.disabled || v(l.value) ? !0 : void 0,
        'aria-current': a.modelValue === a.stepIndex ? p('step') : void 0,
      }))
      return (y, m) => (
        C(),
        _(
          'li',
          H(
            {
              ref_key: 'stepElement',
              ref: o,
              class: ['va-stepper__step-button', s(f)],
              onClick: m[0] || (m[0] = (b) => !y.$props.navigationDisabled && y.$props.stepControls.setStep(s(l))),
              onKeyup: [
                m[1] ||
                  (m[1] = se((b) => !y.$props.navigationDisabled && y.$props.stepControls.setStep(s(l)), ['enter'])),
                m[2] ||
                  (m[2] = se((b) => !y.$props.navigationDisabled && y.$props.stepControls.setStep(s(l)), ['space'])),
              ],
            },
            g.value,
            { style: `--va-stepper-color: ${String(c.value)}` },
          ),
          [
            R('div', C0, [
              u.value
                ? (C(), U(s(Aa), { key: 0, color: 'currentColor', indeterminate: '', size: 'small' }))
                : e.step.icon
                  ? (C(), U(s(Oe), { key: 1, name: e.step.icon, size: '1.3rem' }, null, 8, ['name']))
                  : (C(), _(be, { key: 2 }, [Te(fe(s(l) + 1), 1)], 64)),
            ]),
            Te(' ' + fe(e.step.label), 1),
          ],
          16,
        )
      )
    },
  }),
  $0 = { class: 'va-stepper__step-content' },
  k0 = { class: 'va-stepper__controls' },
  w0 = G({
    name: 'VaStepper',
    __name: 'VaStepper',
    props: {
      ...Qe,
      modelValue: { type: Number, default: 0 },
      steps: { type: Array, default: () => [], required: !0 },
      color: { type: String, default: 'primary' },
      vertical: { type: Boolean, default: !1 },
      navigationDisabled: { type: Boolean, default: !1 },
      controlsHidden: { type: Boolean, default: !1 },
      nextDisabled: { type: Boolean, default: !1 },
      nextDisabledOnError: { type: Boolean, default: !1 },
      finishButtonHidden: { type: Boolean, default: !1 },
      ariaLabel: ye('$t:progress'),
      linear: { type: Boolean, default: !1 },
      finishStep: { type: Object },
    },
    emits: ['update:modelValue', 'finish', 'update:steps'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        { valueComputed: r } = Ke(o, n, 'modelValue'),
        u = i(() => (o.finishStep ? [...o.steps, o.finishStep] : o.steps)),
        d = (L) => (o.finishStep ? L === u.value.length - 1 : !1),
        c = D({ trigger: !1, stepIndex: o.navigationDisabled ? -1 : o.modelValue }),
        { getColor: v } = Ce(),
        p = (L) => (o.nextDisabledOnError && wa(u.value[L]) ? !0 : o.nextDisabled),
        f = (L, x) => {
          for (; L >= 0 && L < u.value.length; ) {
            L += x
            const N = u.value[L]
            if (!N) return
            if (!N.disabled) return N
          }
        },
        g = (L, x) => {
          for (; L >= 0 && L < u.value.length; ) {
            L += x
            const N = u.value[L]
            if (!N) return
            if (wa(N) === !0) return L
          }
        },
        y = async (L) => {
          var x
          const N = u.value[L],
            P = u.value[r.value],
            te = f(L, -1)
          if (N.disabled) return !1
          if (o.linear && L < r.value) return !0
          const X = g(r.value, 1)
          if (o.linear && X !== void 0 && X < L) return !1
          let ce
          try {
            ce = await ((x = P.beforeLeave) == null ? void 0 : x.call(P, P, N))
          } catch (ke) {
            throw new Error(`Error in beforeLeave function: ${ke}`)
          }
          return !(
            ce === !1 ||
            (P.completed === void 0 && (P.completed = !0), o.linear && te && !te.completed) ||
            (o.linear && wa(P))
          )
        },
        m = async (L) => {
          ;(await y(L)) && (r.value = L)
        },
        b = (L) => {
          o.navigationDisabled || (L === 'next' ? h(1) : $(1))
        },
        h = (L = 1) => {
          const x = c.value.stepIndex + L
          if (!p(x)) {
            if (x < u.value.length) {
              if (u.value[x].disabled) {
                h(L + 1)
                return
              }
              ;((c.value.stepIndex = x), (c.value.trigger = !0))
            } else
              for (let N = 0; N < u.value.length; N++)
                if (!u.value[N].disabled) {
                  ;((c.value.stepIndex = N), (c.value.trigger = !0))
                  break
                }
          }
        },
        $ = (L = 1) => {
          const x = c.value.stepIndex - L
          if (x >= 0) {
            if (u.value[x].disabled) {
              $(L + 1)
              return
            }
            ;((c.value.stepIndex = x), (c.value.trigger = !0))
          } else
            for (let N = u.value.length - 1; N >= 0; N--)
              if (!u.value[N].disabled && !p(N)) {
                ;((c.value.stepIndex = N), (c.value.trigger = !0))
                break
              }
        },
        S = () => {
          requestAnimationFrame(() => {
            var L
            ;((L = l.value) != null && L.contains(document.activeElement)) ||
              ((c.value.stepIndex = o.modelValue), (c.value.trigger = !1))
          })
        }
      re(
        () => o.modelValue,
        () => {
          ;((c.value.stepIndex = o.modelValue), (c.value.trigger = !1))
        },
      )
      const w = (L = 0) => {
          const x = r.value + 1 + L
          u.value[x] && (u.value[x].disabled && w(L + 1), m(x))
        },
        I = (L = 0) => {
          const x = r.value - 1 - L
          u.value[x] && (u.value[x].disabled && I(L + 1), m(x))
        },
        k = {
          setStep: m,
          nextStep: w,
          prevStep: I,
          finish: async () => {
            ;(await y(o.steps.length - 1)) && n('finish')
          },
        },
        T = (L, x) => ({
          ...k,
          focus: c,
          isActive: o.modelValue === x,
          isCompleted: o.modelValue > x,
          isLastStep: u.value.length - 1 === x,
          isNextStepDisabled: p(x),
          isPrevStepDisabled: x === 0,
          index: x,
          step: L,
          hasError: wa(L),
        }),
        { tp: O } = He(),
        M = () => {
          ;((c.value.stepIndex = o.modelValue), (c.value.trigger = !0))
        },
        ae = i(() => ({
          role: 'group',
          'aria-label': O(o.ariaLabel),
          'aria-orientation': o.vertical ? 'vertical' : 'horizontal',
        }))
      function oe(L) {
        return wa(u.value[L]) ? 'danger' : v(o.color)
      }
      return (
        t({
          modelValue: r,
          focusedStep: c,
          getIterableSlotData: T,
          stepControls: k,
          nextStep: w,
          prevStep: I,
          setStep: m,
          setFocus: b,
          completeStep: (L) => {
            const x = { ...u.value }
            ;(L === !0 && (x[o.modelValue].hasError = !1), (x[o.modelValue].completed = L ?? !0), n('update:steps', x))
          },
          setError: (L) => {
            const x = { ...u.value }
            ;((x[o.modelValue].hasError = L ?? !0), (x[o.modelValue].completed = !L), n('update:steps', x))
          },
        }),
        (L, x) => (
          C(),
          _(
            'div',
            H({ class: ['va-stepper', { 'va-stepper--vertical': L.$props.vertical }] }, ae.value),
            [
              R(
                'ol',
                {
                  class: pe(['va-stepper__navigation', { 'va-stepper__navigation--vertical': L.$props.vertical }]),
                  ref_key: 'stepperNavigation',
                  ref: l,
                  onClick: M,
                  onKeyup: [
                    se(M, ['enter']),
                    se(M, ['space']),
                    x[0] || (x[0] = se((N) => b('prev'), ['left'])),
                    x[1] || (x[1] = se((N) => b('next'), ['right'])),
                  ],
                  onFocusout: S,
                },
                [
                  (C(!0),
                  _(
                    be,
                    null,
                    Ie(
                      u.value,
                      (N, P) => (
                        C(),
                        _(
                          be,
                          { key: P + N.label },
                          [
                            d(P)
                              ? E('', !0)
                              : (C(),
                                _(
                                  be,
                                  { key: 0 },
                                  [
                                    P > 0
                                      ? V(L.$slots, 'divider', J(H({ key: 0 }, T(N, P))), () => [
                                          R(
                                            'span',
                                            {
                                              class: pe([
                                                'va-stepper__divider',
                                                { 'va-stepper__divider--vertical': L.$props.vertical },
                                              ]),
                                              'aria-hidden': 'true',
                                            },
                                            null,
                                            2,
                                          ),
                                        ])
                                      : E('', !0),
                                    V(L.$slots, `step-button-${P}`, J(ie(T(N, P))), () => [
                                      ue(
                                        S0,
                                        {
                                          stepIndex: P,
                                          color: oe(P),
                                          modelValue: s(r),
                                          nextDisabled: e.nextDisabled,
                                          step: N,
                                          stepControls: k,
                                          navigationDisabled: e.navigationDisabled,
                                          focus: c.value,
                                        },
                                        null,
                                        8,
                                        [
                                          'stepIndex',
                                          'color',
                                          'modelValue',
                                          'nextDisabled',
                                          'step',
                                          'navigationDisabled',
                                          'focus',
                                        ],
                                      ),
                                    ]),
                                  ],
                                  64,
                                )),
                          ],
                          64,
                        )
                      ),
                    ),
                    128,
                  )),
                ],
                34,
              ),
              R(
                'div',
                {
                  class: pe([
                    'va-stepper__step-content-wrapper',
                    { 'va-stepper__step-content-wrapper--vertical': L.$props.vertical },
                  ]),
                },
                [
                  R('div', $0, [
                    V(L.$slots, `step-content-${d(s(r)) ? 'finish' : s(r)}`, J(ie(T(u.value[s(r)], s(r))))),
                  ]),
                  R('div', k0, [
                    V(L.$slots, 'controls', J(ie(T(u.value[s(r)], s(r)))), () => [
                      e.controlsHidden
                        ? E('', !0)
                        : (C(),
                          U(
                            h0,
                            {
                              key: 0,
                              modelValue: s(r),
                              nextDisabled: p(s(r)),
                              steps: u.value,
                              stepControls: k,
                              finishButtonHidden: e.finishButtonHidden,
                            },
                            null,
                            8,
                            ['modelValue', 'nextDisabled', 'steps', 'finishButtonHidden'],
                          )),
                    ]),
                  ]),
                ],
                2,
              ),
            ],
            16,
          )
        )
      )
    },
  }),
  _0 = Q(w0),
  V0 = (e) => {
    const t = e.match(/[0-9]{1,2}/g)
    return t ? t.map((a) => Number(a)) : []
  },
  B0 = (e) => {
    const t = e.match(/pm|am/i)
    return t ? +(t[0].toLowerCase() === 'pm') : null
  },
  T0 = (e) => {
    const t = new Date(),
      [a, o, n] = V0(e),
      l = B0(e)
    if (!a) return null
    const r = l !== null && a <= 12,
      u = r && !!l,
      d = r && a === 12 ? 0 : a
    return (
      t.setHours(Math.min(d || 0, r ? 12 : 24) + (u ? 12 : 0)),
      t.setMinutes(Math.min(o || 0, 60)),
      t.setSeconds(Math.min(n || 0, 60)),
      t
    )
  },
  I0 = (e) => {
    const t = () => e.parse || T0,
      a = D(!0),
      o = (l) => {
        const u = t()(l)
        return (u || (a.value = !1), u)
      }
    return { parse: (l) => ((a.value = !0), o(l)), isValid: a }
  },
  P0 = (e) => {
    const t = (n) => (n ? (e.ampm ? n.toLocaleTimeString('en-US') : n.toLocaleTimeString('en-GB')) : ''),
      a = (n, l, r) => n.split(':').slice(l, r).join(':'),
      o = (n) => {
        if (e.view === 'seconds') return t(n)
        const [l, r] = t(n).split(' ')
        return e.view === 'minutes'
          ? r
            ? [a(l, 0, 2), r].join(' ')
            : a(l, 0, 2)
          : e.view === 'hours'
            ? r
              ? [a(l, 0, 1), r].join(' ')
              : a(l, 0, 1)
            : ''
      }
    return { format: (n) => (e.format ? e.format(n) : o(n)) }
  },
  Ia = (e) => (e.value ? e.value : new Date(new Date().setHours(0, 0, 0, 0))),
  ll = (e) => Array.from(Array(e).keys()),
  _r = (e) => (e === 0 ? 12 : e) - +(e > 12) * 12,
  A0 = (e, t = !1) => (e === 12 ? 0 : e) + Number(t) * 12,
  L0 = (e, t, a) => {
    const o = i(() => (e.ampm ? 12 : 24)),
      n = i(() => {
        let r = ll(o.value)
        return (
          e.hoursFilter && (r = r.filter((u) => e.hoursFilter(e.ampm ? u + 12 * Number(a.value) : u))),
          r.map((u) => (e.ampm ? _r(u) : u))
        )
      }),
      l = i({
        get: () => {
          if (!t.value) return -1
          if (e.ampm) {
            const u = _r(t.value.getHours() - 12 * Number(a.value))
            return n.value.findIndex((d) => d === u)
          }
          const r = t.value.getHours()
          return n.value.findIndex((u) => u === r)
        },
        set: (r) => {
          if (e.readonly) return
          const u = e.ampm ? A0(n.value[r], a.value) : n.value[r]
          t.value = new Date(Ia(t).setHours(u))
        },
      })
    return i(() => ({ items: n.value, activeItem: l }))
  },
  O0 = (e, t) => {
    const a = i(() => {
        const n = ll(60)
        return e.minutesFilter ? n.filter(e.minutesFilter) : n
      }),
      o = i({
        get: () => {
          if (!t.value) return -1
          const n = t.value.getMinutes()
          return a.value.findIndex((l) => l === n)
        },
        set: (n) => {
          if (e.readonly) return
          const l = a.value[n]
          t.value = new Date(Ia(t).setMinutes(l))
        },
      })
    return i(() => ({ items: a.value, activeItem: o }))
  },
  x0 = (e, t) => {
    const a = i(() => {
        const n = ll(60)
        return e.secondsFilter ? n.filter(e.secondsFilter) : n
      }),
      o = i({
        get: () => {
          if (!t.value) return -1
          const n = t.value.getSeconds()
          return a.value.findIndex((l) => l === n)
        },
        set: (n) => {
          if (e.readonly) return
          const l = a.value[n]
          t.value = new Date(Ia(t).setSeconds(l))
        },
      })
    return i(() => ({ items: a.value, activeItem: o }))
  },
  E0 = (e, t, a) =>
    i(() => ({
      items: ['AM', 'PM'],
      activeItem: i({
        get: () => (t.value ? Number(a.value) : -1),
        set: (o) => {
          a.value = !!o
          const n = Ia(t).getHours()
          let l = a.value ? n + 12 : n
          ;(a.value && n <= 12 && (l = n + 12), !a.value && n >= 12 && (l = n - 12))
          const r = !e.hoursFilter || e.hoursFilter(l)
          e.periodUpdatesModelValue && r && (t.value = new Date(Ia(t).setHours(l)))
        },
      }),
    })),
  D0 = (e, t) => {
    const { view: a } = Tt(e),
      o = D(!1)
    re(
      t,
      () => {
        o.value = Ia(t).getHours() >= 12
      },
      { immediate: !0 },
    )
    const n = L0(e, t, o),
      l = O0(e, t),
      r = x0(e, t),
      u = E0(e, t, o)
    return {
      columns: i(() => {
        const c = []
        return (
          a.value === 'hours'
            ? c.push(n.value)
            : a.value === 'minutes'
              ? c.push(n.value, l.value)
              : a.value === 'seconds' && c.push(n.value, l.value, r.value),
          e.ampm && !e.hidePeriodSwitch && c.push(u.value),
          c
        )
      }),
      isPM: o,
    }
  },
  F0 = G({
    name: 'VaTimePickerColumnCell',
    __name: 'VaTimePickerColumnCell',
    setup(e) {
      const { isHovered: t, onMouseEnter: a, onMouseLeave: o } = ao(),
        { getTextColor: n, getColor: l } = Ce(),
        r = i(() =>
          t.value ? { color: l(n(l('background-secondary'))), background: l('background-secondary') } : void 0,
        )
      return (u, d) => (
        C(),
        _(
          'div',
          {
            onMouseenter: d[0] || (d[0] = (...c) => s(a) && s(a)(...c)),
            onMouseleave: d[1] || (d[1] = (...c) => s(o) && s(o)(...c)),
            style: Y(r.value),
          },
          [V(u.$slots, 'default')],
          36,
        )
      )
    },
  }),
  M0 = ['onClick'],
  N0 = G({
    name: 'VaTimePickerColumn',
    __name: 'VaTimePickerColumn',
    props: {
      items: { type: Array, default: () => [] },
      activeItemIndex: { type: Number, default: 0 },
      cellHeight: { type: [Number, String], default: 30 },
    },
    emits: ['item-selected', 'update:activeItemIndex', ...Fo],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        { focus: r, blur: u } = jt(l, n),
        [d] = ua('activeItemIndex', o, n),
        c = Pe('cellHeight')
      ;(re(d, (h) => {
        v(h)
      }),
        Me(() => v(d.value, !1)))
      const v = (h, $ = !0) => {
          Ye(() => {
            var S, w
            ;(w = (S = l.value) == null ? void 0 : S.scrollTo) == null ||
              w.call(S, { behavior: $ ? 'smooth' : 'auto', top: h * c.value })
          })
        },
        p = (h) => {
          ;((d.value = (d.value + (h || 1)) % o.items.length), Ye(() => v(d.value)))
        },
        f = (h) => {
          ;((d.value = (d.value - 1 + o.items.length) % o.items.length), Ye(() => v(d.value)))
        },
        g = (h) => {
          d.value = h
        },
        y = (h) => (Number.isInteger(h) ? (Number(h) < 10 ? `0${h}` : `${h}`) : h),
        m = () => {
          const h = l.value.scrollTop,
            $ = Math.max((h - (h % c.value)) / c.value, h / c.value)
          return $ >= o.items.length
            ? o.items.length - 1
            : $ < 0
              ? 0
              : d.value * c.value < h
                ? Math.ceil($)
                : d.value * c.value > h
                  ? Math.floor($)
                  : Math.round($)
        },
        b = jn(() => {
          l.value && d.value !== -1 && (d.value = m())
        }, 200)
      return (
        t({ focus: r, blur: u }),
        (h, $) => (
          C(),
          _(
            'div',
            {
              ref_key: 'rootElement',
              ref: l,
              tabindex: '0',
              class: 'va-time-picker-column',
              onKeydown: [
                $[0] ||
                  ($[0] = se(
                    ne((S) => p(), ['stop', 'prevent']),
                    ['down'],
                  )),
                $[1] ||
                  ($[1] = se(
                    ne((S) => p(5), ['stop', 'prevent']),
                    ['space'],
                  )),
                $[2] ||
                  ($[2] = se(
                    ne((S) => f(), ['stop', 'prevent']),
                    ['up'],
                  )),
              ],
            },
            [
              (C(!0),
              _(
                be,
                null,
                Ie(
                  e.items,
                  (S, w) => (
                    C(),
                    U(
                      F0,
                      { key: S, onScrollPassive: s(b), onTouchmovePassive: s(b), onMousewheelPassive: s(b) },
                      {
                        default: z(() => [
                          R(
                            'div',
                            {
                              class: pe([
                                'va-time-picker-cell',
                                { 'va-time-picker-cell--active': w === h.$props.activeItemIndex },
                              ]),
                              onClick: (I) => g(w),
                            },
                            [
                              V(
                                h.$slots,
                                'cell',
                                J(
                                  ie({
                                    item: S,
                                    index: w,
                                    activeItemIndex: e.activeItemIndex,
                                    items: e.items,
                                    formattedItem: y(S),
                                  }),
                                ),
                                () => [Te(fe(y(S)), 1)],
                              ),
                            ],
                            10,
                            M0,
                          ),
                        ]),
                        _: 2,
                      },
                      1032,
                      ['onScrollPassive', 'onTouchmovePassive', 'onMousewheelPassive'],
                    )
                  ),
                ),
                128,
              )),
            ],
            544,
          )
        )
      )
    },
  }),
  R0 = Q(N0),
  z0 = (e, t) => i(() => Object.entries(t()).reduce((a, [o, n]) => ((a[`--${e}-${qa(o)}`] = n), a), {})),
  So = G({
    name: 'VaTimePicker',
    __name: 'VaTimePicker',
    props: {
      ...Qe,
      ...Zt,
      ...me,
      modelValue: { type: Date, required: !1 },
      ampm: { type: Boolean, default: !1 },
      hidePeriodSwitch: { type: Boolean, default: !1 },
      periodUpdatesModelValue: { type: Boolean, default: !0 },
      view: { type: String, default: 'minutes' },
      hoursFilter: { type: Function },
      minutesFilter: { type: Function },
      secondsFilter: { type: Function },
      framed: { type: Boolean, default: !1 },
      cellHeight: { type: [Number, String], default: 30 },
      visibleCellsCount: { type: [Number, String], default: 7 },
    },
    emits: [...lt],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        { valueComputed: l } = Ke(o, n),
        { columns: r } = D0(o, l),
        u = Pe('cellHeight'),
        d = Pe('visibleCellsCount'),
        { setItemRef: c, itemRefs: v } = Go(),
        p = D(),
        f = (S = 0) => {
          var w
          ;(w = v.value[S]) == null || w.focus()
        },
        g = (S) => {
          var w
          S ? (w = v.value[S]) == null || w.blur() : v.value.forEach((I) => (I == null ? void 0 : I.blur()))
        },
        { computedClasses: y } = vi('va-time-picker', o),
        m = () => {
          const S = ((p == null ? void 0 : p.value) || 0) + 1
          ;((p.value = S % r.value.length), f(p.value))
        },
        b = () => {
          const S = ((p == null ? void 0 : p.value) || 0) - 1 + r.value.length
          ;((p.value = S % r.value.length), f(p.value))
        },
        h = i(() => ({ ...y, 'va-time-picker--framed': o.framed })),
        $ = z0('va-time-picker', () => {
          const S = ((d.value - 1) / 2) * u.value
          return { height: `${u.value * d.value}px`, 'cell-height': `${u.value}px`, 'column-gap-height': `${S}px` }
        })
      return (
        t({ focus: f, blur: g, focusNext: m, focusPrev: b }),
        (S, w) => (
          C(),
          _(
            'div',
            { class: pe(['va-time-picker', h.value]), style: Y(s($)) },
            [
              (C(!0),
              _(
                be,
                null,
                Ie(
                  s(r),
                  (I, A) => (
                    C(),
                    U(
                      s(R0),
                      {
                        key: A,
                        ref_for: !0,
                        ref: s(c),
                        items: I.items,
                        tabindex: S.disabled ? -1 : 0,
                        'cell-height': s(u),
                        activeItemIndex: I.activeItem.value,
                        'onUpdate:activeItemIndex': (k) => (I.activeItem.value = k),
                        onKeydown: [
                          w[0] ||
                            (w[0] = se(
                              ne((k) => m(), ['stop', 'prevent']),
                              ['right'],
                            )),
                          w[1] ||
                            (w[1] = se(
                              ne((k) => m(), ['exact', 'stop', 'prevent']),
                              ['tab'],
                            )),
                          w[2] ||
                            (w[2] = se(
                              ne((k) => b(), ['stop', 'prevent']),
                              ['left'],
                            )),
                          w[3] ||
                            (w[3] = se(
                              ne((k) => b(), ['shift', 'stop', 'prevent']),
                              ['tab'],
                            )),
                        ],
                        onFocus: (k) => (p.value = A),
                      },
                      null,
                      8,
                      ['items', 'tabindex', 'cell-height', 'activeItemIndex', 'onUpdate:activeItemIndex', 'onFocus'],
                    )
                  ),
                ),
                128,
              )),
            ],
            6,
          )
        )
      )
    },
  })
function H0(e, t) {
  let a = -1,
    o = -1
  const n = (u) => {
      var d
      ;((d = t.onStart) == null || d.call(t, u),
        clearTimeout(a),
        (a = setTimeout(
          () => {
            o = setInterval(() => {
              var c
              return (c = t.onUpdate) == null ? void 0 : c.call(t, u)
            }, t.interval || 100)
          },
          s(t.delay) || 500,
        )))
    },
    l = (u) => {
      var d
      ;(clearTimeout(a), clearInterval(o), (d = t.onEnd) == null || d.call(t, u))
    },
    r = La(e)
  ;(We(['keydown'], n, r), We(['keyup', 'blur'], l, !0))
}
const Vr = Ee(gt, ['focused', 'maxLength', 'counterValue']),
  j0 = G({
    name: 'VaTimeInput',
    inheritAttrs: !1,
    __name: 'VaTimeInput',
    props: {
      ...Vr,
      ...Vt,
      ...me,
      ...no,
      ...Ee(So),
      ...zt,
      ...Qe,
      closeOnContentClick: { type: Boolean, default: !1 },
      offset: { ...Vt.offset, default: () => [2, 0] },
      placement: { ...Vt.placement, default: 'bottom-end' },
      modelValue: { type: Date, default: void 0 },
      clearValue: { type: Date, default: null },
      format: { type: Function },
      parse: { type: Function },
      manualInput: { type: Boolean, default: !1 },
      leftIcon: { type: Boolean, default: !1 },
      icon: { type: String, default: 'schedule' },
      ariaLabel: ye('$t:selectedTime'),
      ariaResetLabel: ye('$t:resetTime'),
      ariaToggleDropdownLabel: ye('$t:toggleDropdown'),
    },
    emits: [...Fo, ...Xt, ...zo, ...lt, ...al, 'update:modelValue'],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = we(),
        r = we(),
        { isOpenSync: u, dropdownProps: d } = ol(o, n, {
          defaultCloseOnValueUpdate: i(() => Array.isArray(o.view) && o.view.length === 1),
        }),
        { valueComputed: c } = Ke(o, n),
        { parse: v, isValid: p } = I0(o),
        { format: f } = P0(o),
        g = i(() => f(c.value || o.clearValue)),
        y = i({
          get() {
            return o.disabled || o.readonly ? !1 : u.value
          },
          set(Le) {
            ;((u.value = Le),
              Le
                ? Ye(() => {
                    var Ve
                    return (Ve = r.value) == null ? void 0 : Ve.focus()
                  })
                : Ye(() => {
                    var Ve
                    return (Ve = l.value) == null ? void 0 : Ve.focus()
                  }))
          },
        }),
        { isFocused: m, focus: b, blur: h, onFocus: $, onBlur: S } = jt(l),
        w = (Le) => {
          var Ve
          if (o.disabled) return
          const $e = (Ve = Le.target) == null ? void 0 : Ve.value
          if (!$e) return I()
          const _e = v($e)
          p.value && _e ? (c.value = _e) : ((c.value = void 0), (p.value = !0))
        },
        I = () =>
          M(() => {
            ;(n('update:modelValue', o.clearValue), n('clear'), ae(), ve())
          }),
        {
          computedError: A,
          computedErrorMessages: k,
          listeners: T,
          validationAriaAttributes: O,
          withoutValidation: M,
          resetValidation: ae,
          isDirty: oe,
          isTouched: B,
        } = Ht(o, n, { reset: I, focus: b, value: c })
      re(y, (Le) => {
        Le || (B.value = !0)
      })
      const { canBeCleared: K, clearIconProps: L, onFocus: x, onBlur: N } = Ho(o, g),
        P = i(() => K.value && g.value !== f(o.clearValue)),
        te = ze(Vr),
        X = i(() => ({
          ...te.value,
          focused: m.value,
          error: A.value,
          errorMessages: k.value,
          readonly: o.readonly || !o.manualInput,
          modelValue: g.value,
        })),
        ce = { seconds: 1e3, minutes: 1e3 * 60, hours: 1e3 * 60 * 60 },
        ke = (Le) => {
          'key' in Le &&
            (Le.key === 'ArrowDown' && ((c.value = new Date(Number(c.value) - ce[o.view])), Le.preventDefault()),
            Le.key === 'ArrowUp' && ((c.value = new Date(Number(c.value) + ce[o.view])), Le.preventDefault()))
        }
      H0(l, { onStart: ke, onUpdate: ke })
      const de = {
          onFocus: () => {
            o.disabled || ($(), !o.readonly && x())
          },
          onBlur: () => {
            o.disabled || (S(), !o.readonly && (N(), T.onBlur()))
          },
        },
        F = dt(),
        le = i(() => {
          const Le = [o.leftIcon && 'prependInner', (!o.leftIcon || o.clearable) && 'icon']
          return Object.keys(F).filter((Ve) => !Le.includes(Ve))
        }),
        ve = () => {
          y.value = !1
        },
        W = (Le, Ve, $e) => {
          y.value = !0
        },
        j = (Le) =>
          u.value
            ? !1
            : o.disabled || o.readonly
              ? !0
              : Le === void 0
                ? !1
                : o.manualInput && (Le == null ? void 0 : Le.code) !== 'Space',
        Se = (Le) => {
          j(Le instanceof KeyboardEvent ? Le : void 0) || (y.value = !y.value)
        },
        ge = i(() => (o.disabled ? {} : o.manualInput ? { cursor: 'text' } : { cursor: 'pointer' })),
        Ae = i(() => (o.manualInput ? (o.disabled || o.readonly ? -1 : 0) : -1)),
        je = i(() => ({ role: 'button', 'aria-hidden': !1, name: o.icon, color: 'secondary', tabindex: Ae.value })),
        { tp: ot } = He()
      Yt()
      const ct = i(() => ({
          ...d.value,
          innerAnchorSelector: '.va-input-wrapper__field',
          trigger: ['click', 'right-click', 'space', 'enter'],
        })),
        it = ze(Ee(So))
      return (
        t({
          isFocused: m,
          isValid: p,
          value: c,
          isDirty: oe,
          isTouched: B,
          focus: b,
          blur: h,
          reset: I,
          withoutValidation: M,
          resetValidation: ae,
          toggleDropdown: Se,
          showDropdown: W,
          hideDropdown: ve,
        }),
        (Le, Ve) => (
          C(),
          U(
            s(Ct),
            H(
              {
                modelValue: y.value,
                'onUpdate:modelValue': Ve[1] || (Ve[1] = ($e) => (y.value = $e)),
                class: ['va-time-input', Le.$attrs.class],
                style: Le.$attrs.style,
              },
              ct.value,
            ),
            {
              anchor: z(() => [
                ue(
                  s(gt),
                  H(
                    { class: 'va-time-input__anchor', ref_key: 'input', ref: l, style: ge.value },
                    { ...X.value, ...s(O), ...de },
                    { onChange: w },
                  ),
                  st(
                    {
                      icon: z(() => [
                        P.value
                          ? (C(),
                            U(
                              s(Oe),
                              H(
                                { key: 0, class: 'va-time-input__clear-button' },
                                { ...je.value, ...s(L) },
                                {
                                  'aria-label': s(ot)(Le.$props.ariaResetLabel),
                                  onClick: ne(I, ['stop']),
                                  onKeydown: [se(ne(I, ['stop']), ['enter']), se(ne(I, ['stop']), ['space'])],
                                },
                              ),
                              null,
                              16,
                              ['aria-label', 'onKeydown'],
                            ))
                          : E('', !0),
                        !Le.$props.leftIcon && Le.$props.icon
                          ? (C(),
                            U(
                              s(Oe),
                              H(
                                {
                                  key: 1,
                                  class: 'va-time-input__right-button va-time-input__side-button',
                                  'aria-label': s(ot)(Le.$props.ariaToggleDropdownLabel),
                                },
                                je.value,
                              ),
                              null,
                              16,
                              ['aria-label'],
                            ))
                          : E('', !0),
                      ]),
                      _: 2,
                    },
                    [
                      Ie(le.value, ($e) => ({
                        name: $e,
                        fn: z((_e) => [
                          V(
                            Le.$slots,
                            $e,
                            J(
                              ie({
                                ..._e,
                                toggleDropdown: Se,
                                showDropdown: W,
                                hideDropdown: ve,
                                isOpen: s(u),
                                focus: s(b),
                              }),
                            ),
                          ),
                        ]),
                      })),
                      Le.$slots.prependInner || Le.$props.leftIcon
                        ? {
                            name: 'prependInner',
                            fn: z(($e) => [
                              V(
                                Le.$slots,
                                'prependInner',
                                J(
                                  ie({
                                    ...$e,
                                    toggleDropdown: Se,
                                    showDropdown: W,
                                    hideDropdown: ve,
                                    isOpen: s(u),
                                    focus: s(b),
                                  }),
                                ),
                              ),
                              Le.$props.leftIcon
                                ? (C(),
                                  U(
                                    s(Oe),
                                    H(
                                      {
                                        key: 0,
                                        class: 'va-time-input__left-button va-time-input__side-button',
                                        'aria-label': s(ot)(Le.$props.ariaToggleDropdownLabel),
                                      },
                                      je.value,
                                    ),
                                    null,
                                    16,
                                    ['aria-label'],
                                  ))
                                : E('', !0),
                            ]),
                            key: '0',
                          }
                        : void 0,
                    ],
                  ),
                  1040,
                  ['style'],
                ),
              ]),
              default: z(() => [
                ue(
                  s(va),
                  {
                    'no-padding': '',
                    onKeydown: [se(ne(ve, ['prevent']), ['esc']), se(ne(ve, ['prevent']), ['enter'])],
                  },
                  {
                    default: z(() => [
                      ue(
                        So,
                        H({ ref_key: 'timePicker', ref: r }, s(it), {
                          modelValue: s(c),
                          'onUpdate:modelValue': Ve[0] || (Ve[0] = ($e) => (mt(c) ? (c.value = $e) : null)),
                        }),
                        null,
                        16,
                        ['modelValue'],
                      ),
                    ]),
                    _: 1,
                  },
                  8,
                  ['onKeydown'],
                ),
              ]),
              _: 3,
            },
            16,
            ['modelValue', 'class', 'style'],
          )
        )
      )
    },
  }),
  U0 = Q(j0),
  Br = (e) => (e == null ? void 0 : e.props),
  Tr = (e) => {
    var t
    return !!((t = e == null ? void 0 : e.props) != null && t.active) || !1
  },
  W0 = (e) => e.type === be,
  K0 = (e) => e && e.length === 0
function G0(e) {
  var t
  const a = (t = e.default) == null ? void 0 : t.call(e)
  return !a || K0(a) ? [] : W0(a[0]) ? a[0].children : a
}
const q0 = (e) => {
    const t = G0(e.slots)
    return (
      t.forEach((a, o) => {
        Br(a) || (a.props = {})
        const n = Br(a)
        ;((n.vertical = e.props.vertical),
          e.props.centered && (n.inverted = !!(o % 2)),
          o === 0 && (n.isFirst = !0),
          o === t.length - 1 && (n.isLast = !0))
        const l = n.active
        if (!l) return
        ;(o === 0 && (n.activePrevious = l),
          o === t.length - 1 && (n.activeNext = l),
          Tr(t[o - 1]) && (n.activePrevious = !0),
          Tr(t[o + 1]) && (n.activeNext = !0))
      }),
      t
    )
  },
  go = 'va-timeline',
  Y0 = {
    name: go,
    props: { ...me, vertical: { type: Boolean }, centered: { type: Boolean }, alignTop: { type: Boolean } },
    setup(e, { slots: t }) {
      return () =>
        Re(
          'div',
          { class: { [go]: !0, [`${go}--vertical`]: e.vertical, [`${go}--align-top`]: e.alignTop } },
          q0({ props: e, slots: t }),
        )
    },
  },
  X0 = Q(Y0),
  Mt = 'va-timeline-separator',
  J0 = G({
    name: Mt,
    props: {
      ...me,
      color: { type: String, default: 'primary' },
      vertical: { type: Boolean },
      active: { type: Boolean },
      activePrevious: { type: Boolean },
      activeNext: { type: Boolean },
    },
    setup(e) {
      const { getColor: t } = Ce()
      return () =>
        Re('div', { class: { [Mt]: !0, [`${Mt}--vertical`]: e.vertical } }, [
          Re('div', {
            class: { [`${Mt}__line`]: !0, [`${Mt}__line--active`]: e.activePrevious },
            style: { backgroundColor: t(e.activePrevious ? e.color : 'divider') },
          }),
          Re('div', {
            class: { [`${Mt}__center`]: !0, [`${Mt}__center--active`]: e.active },
            style: { backgroundColor: t(e.active ? e.color : 'divider') },
          }),
          Re('div', {
            class: { [`${Mt}__line`]: !0, [`${Mt}__line--active`]: e.activeNext },
            style: { backgroundColor: t(e.activeNext ? e.color : 'divider') },
          }),
        ])
    },
  }),
  qi = Q(J0),
  oa = 'va-timeline-item',
  Ir = Ee(qi),
  Z0 = G({
    name: oa,
    props: {
      ...me,
      ...Ir,
      color: { type: String, default: 'primary' },
      isFirst: { type: Boolean },
      isLast: { type: Boolean },
      inverted: { type: Boolean },
    },
    setup(e, { slots: t }) {
      const a = [Re(qi, { ...ze(Ir).value })],
        o = e.inverted ? t.after : t.before
      o && a.unshift(Re('div', { class: `${oa}__before` }, o()))
      const n = e.inverted ? t.before : t.after
      return (
        n && a.push(Re('div', { class: `${oa}__after` }, n())),
        () =>
          Re(
            'div',
            {
              class: [
                { [oa]: !0 },
                { [`${oa}--vertical`]: e.vertical },
                { [`${oa}--is-first`]: e.isFirst },
                { [`${oa}--is-last`]: e.isLast },
              ],
            },
            a,
          )
      )
    },
  }),
  Q0 = Q(Z0),
  eC = Q(So),
  tC = {
    nodes: { type: Array, default: [] },
    stateful: { type: Boolean, default: !0 },
    selectable: { type: Boolean, default: !1 },
    selectionType: { type: String, default: 'leaf', validator: (e) => ['leaf', 'independent'].includes(e) },
    valueBy: { type: [String, Function], default: 'id' },
    textBy: { type: [String, Function], default: 'label' },
    trackBy: { type: [String, Function], default: 'id' },
    iconBy: { type: [String, Function], default: 'icon' },
    disabledBy: { type: [String, Function], default: 'disabled' },
    expandedBy: { type: [String, Function], default: 'expanded' },
    checkedBy: { type: [String, Function], default: 'checked' },
    childrenBy: { type: [String, Function], default: 'children' },
    expandAll: { type: Boolean, default: !1 },
    expanded: { type: Array, default: [] },
    expandNodeBy: { type: String, default: 'leaf' },
    filter: { type: String, default: '' },
    filterMethod: { type: Function, default: void 0 },
    checked: { type: Array, default: [] },
    color: { type: String, default: 'primary' },
  },
  aC = ['update:modelValue', 'update:checked', 'update:expanded', 'update:selected'],
  oC = (e) => {
    const t = (f) => {
        const g = typeof f
        return g === 'string' || g === 'number'
      },
      a = (f, g) => (!g || t(f) ? f : ui(f, g)),
      o = (f) => a(f, e.valueBy),
      n = (f) => (e.valueBy && e.nodes.find((g) => f === o(g))) || f,
      l = (f) => a(f, e.textBy),
      r = (f) => a(f, e.checkedBy),
      u = (f) => a(f, e.disabledBy),
      d = (f) => a(f, e.expandedBy),
      c = (f) => a(f, e.trackBy),
      v = (f) => a(f, e.childrenBy) ?? [],
      p = (f, g) => {
        f.forEach((y) => {
          const m = y.children || []
          ;(m.length && p(m, g), g(y))
        })
      }
    return {
      getText: l,
      getValue: o,
      getChecked: r,
      getTrackBy: c,
      getChildren: v,
      getDisabled: u,
      getExpanded: d,
      iterateNodes: p,
      getNodeByValue: n,
      getNodeProperty: a,
    }
  },
  Yi = Symbol('TreeView'),
  nC = (e, t) => {
    const { emit: a, toggleNode: o, toggleCheckbox: n } = t,
      l = (b) => (b == null ? void 0 : b.getAttribute('aria-expanded')) === 'true',
      r = (b) => {
        var h
        return ((h = b == null ? void 0 : b.parentElement) == null ? void 0 : h.closest('.va-tree-node')) || null
      },
      u = (b) => (b == null ? void 0 : b.previousElementSibling),
      d = (b) => {
        if (!b) return null
        let h = u(b),
          $ = l(h) && f(h)
        if ($)
          do
            if (l($)) {
              if ((($ = f($)), $)) continue
              break
            } else {
              h = $
              break
            }
          while (!0)
        return h || r(b)
      },
      c = (b) => (b == null ? void 0 : b.nextElementSibling),
      v = (b) => {
        if (!b) return null
        let h = c(b)
        const $ = l(b)
        if (!h) {
          let S = r(b)
          do
            if (c(S)) {
              h = c(S)
              break
            } else {
              if (((S = r(S)), S)) continue
              break
            }
          while (!0)
        }
        return $ ? p(b) : h
      },
      p = (b) => {
        var h
        return (
          ((h = b == null ? void 0 : b.querySelector('.va-tree-node-children')) == null
            ? void 0
            : h.firstElementChild) || null
        )
      },
      f = (b) => {
        var h
        return (
          ((h = b == null ? void 0 : b.querySelector('.va-tree-node-children')) == null
            ? void 0
            : h.lastElementChild) || null
        )
      },
      g = (b, h, $) => {
        var S, w
        const I = l(b)
        h === 'left' ? (I ? o($) : (S = r(b)) == null || S.focus()) : I ? (w = p(b)) == null || w.focus() : o($)
      },
      y = (b, h) => {
        var $, S
        h === 'up' ? ($ = d(b)) == null || $.focus() : (S = v(b)) == null || S.focus()
      }
    return {
      handleKeyboardNavigation: (b, h) => {
        const $ = b.target
        switch (b.code) {
          case 'ArrowUp':
            y($, 'up')
            break
          case 'ArrowRight':
            g($, 'right', h)
            break
          case 'ArrowDown':
            y($, 'down')
            break
          case 'ArrowLeft':
            g($, 'left', h)
            break
          case 'Space':
            if (e.selectable) {
              const S = typeof h.checked < 'u' ? !h.checked : null
              n(h, S)
            } else a('update:selected', h)
            break
          case 'Escape':
            ;(e.selectable || a('update:selected', null), $.blur())
            break
          default:
            $.blur()
        }
      },
    }
  },
  lC = nC,
  rC = (e, t) => {
    const { getColor: a } = Ce(),
      o = i(() => a(e.color)),
      n = i(() => e.selectionType === 'leaf'),
      {
        getText: l,
        getValue: r,
        getChecked: u,
        getTrackBy: d,
        getChildren: c,
        getDisabled: v,
        getExpanded: p,
        iterateNodes: f,
        getNodeProperty: g,
      } = oC(e),
      { nodes: y, expandAll: m, filter: b, filterMethod: h, textBy: $ } = Tt(e),
      { valueComputed: S } = Ke(e, t, 'expanded'),
      { valueComputed: w } = Ke(e, t, 'checked'),
      I = D(),
      A = i({
        get: () => I.value,
        set: (N) => {
          const P = r(N)
          I.value !== P && ((I.value = P), t('update:selected', N))
        },
      }),
      k = (N, P, te) => {
        te
          ? (N.value = N.value.concat(P).filter((X, ce, ke) => ke.indexOf(X) === ce))
          : (N.value = N.value.filter((X) => !P.includes(X)))
      },
      T = (N, P) => {
        let te = P === null ? !0 : P
        P && N.indeterminate && (te = !1)
        const X = [r(N)]
        if (n.value && N.hasChildren) {
          const ce = (ke) => {
            ke.forEach((de) => {
              if (de.disabled) return
              const F = c(de)
              ;(F.length && ce(F), X.push(r(de)))
            })
          }
          ce(c(N))
        }
        k(w, X, te)
      },
      O = (N) => {
        N.expanded = !N.expanded
      },
      M = ({ node: N, level: P, children: te = [], computedFilterMethod: X }) => {
        var ce
        const ke = r(N)
        let de = !0
        const F = !!te.length
        let le = !1,
          ve = w.value.includes(ke) || !1
        if (n.value && F) {
          const W = te.every((j) => j.checked)
          ;((ve = W), (le = !W && te.some((j) => j.indeterminate || j.checked)), le && (ve = null))
        }
        return (
          b.value &&
            (de =
              (te == null ? void 0 : te.some((W) => W.matchesFilter)) ||
              ((ce = X.value) == null ? void 0 : ce.call(X, N, b.value, $.value))),
          {
            ...N,
            level: P,
            checked: ve,
            children: te,
            get disabled() {
              return v(N) || !1
            },
            get expanded() {
              const W = e.expandedBy
              return W in N ? N[W] : S.value.includes(ke) || !1
            },
            set expanded(W) {
              const j = e.expandedBy
              ;((N[j] = W), F && k(S, [r(N)], W))
            },
            hasChildren: F,
            matchesFilter: de,
            indeterminate: le,
          }
        )
      },
      ae = i(() => (h != null && h.value ? h.value : (N, P) => l(N).toLowerCase().includes(P.toLowerCase()))),
      oe = (N, P = 0) =>
        N.map((te) => {
          const X = c(te)
          if (X.length) {
            const ce = oe(X, P + 1)
            return M({ node: te, level: P, children: ce, computedFilterMethod: ae })
          }
          return M({ node: te, level: P, computedFilterMethod: ae })
        }),
      B = (N) =>
        N.filter(
          (P) => (
            P.children && (P.children = B(P.children)),
            P.children.length === 0 && (P.hasChildren = !1),
            P.matchesFilter
          ),
        ),
      { handleKeyboardNavigation: K } = lC(e, { emit: t, toggleCheckbox: T, toggleNode: O })
    Ot(Yi, {
      selectedNodeComputed: A,
      colorComputed: o,
      iconBy: e.iconBy,
      selectable: e.selectable,
      expandNodeBy: e.expandNodeBy,
      getText: l,
      getValue: r,
      getTrackBy: d,
      toggleNode: O,
      toggleCheckbox: T,
      getNodeProperty: g,
      handleKeyboardNavigation: K,
    })
    const L = i(() => oe(y.value))
    return (
      (() => {
        const N = [],
          P = []
        ;(f(y.value, (te) => {
          ;((m.value || p(te)) && N.push(r(te)), u(te) && P.push(r(te)))
        }),
          N.length && k(S, N, !0),
          P.length && k(w, P, !0))
      })(),
      { treeItems: i(() => B(L.value)), getText: l, getTrackBy: d, toggleCheckbox: T }
    )
  },
  sC = rC,
  iC = ['role', 'aria-expanded', 'aria-disabled', 'aria-checked', 'tabindex'],
  uC = { class: 'va-tree-node-root' },
  cC = { key: 2, class: 'va-tree-node-content__item' },
  dC = ['aria-hidden'],
  vC = 'The VaTreeNode component should be used in the context of VaTreeView component',
  pC = G({
    name: 'VaTreeNode',
    __name: 'VaTreeNode',
    props: { node: { type: Object, required: !0 } },
    setup(e) {
      const t = e,
        {
          iconBy: a,
          selectable: o,
          expandNodeBy: n,
          colorComputed: l,
          selectedNodeComputed: r,
          getText: u,
          getTrackBy: d,
          toggleNode: c,
          toggleCheckbox: v,
          getNodeProperty: p,
          handleKeyboardNavigation: f,
        } = ro(Yi, vC),
        g = i(() => u(t.node) || ''),
        y = i(() => (t.node.hasChildren ? !!t.node.expanded : void 0)),
        m = i(() => p(t.node, a)),
        b = i(() => (t.node.hasChildren ? 'group' : 'treeitem')),
        h = Fe('va-tree-node', () => ({
          disabled: !!t.node.disabled,
          checked: !!t.node.checked,
          hasChildren: !!t.node.hasChildren,
          [`level-${t.node.level}`]: !0,
          [`expand-by-${n}`]: !0,
        })),
        $ = Fe('va-tree-node-children', () => ({ expanded: !!y.value })),
        S = Fe('va-tree-node-content', () => ({ indent: t.node.hasChildren === !1 })),
        w = Fe('va-tree-node-content', () => ({ clickable: t.node.hasChildren === !0 && n === 'node' })),
        I = i(() => (t.node.disabled ? -1 : 0)),
        A = (k) => {
          ;(n === (n === 'node' && k === 'leaf' ? 'node' : k) && c(t.node), (r.value = t.node))
        }
      return (k, T) => {
        const O = yo('va-tree-node', !0)
        return (
          C(),
          _(
            'div',
            {
              class: pe(['va-tree-node', s(h)]),
              role: b.value,
              'aria-expanded': y.value,
              'aria-disabled': k.$props.node.disabled,
              'aria-checked': !!k.$props.node.checked,
              tabindex: I.value,
              onKeydown: [
                T[4] ||
                  (T[4] = se(
                    ne((M) => s(f)(M, k.$props.node), ['stop', 'prevent']),
                    ['up'],
                  )),
                T[5] ||
                  (T[5] = se(
                    ne((M) => s(f)(M, k.$props.node), ['stop', 'prevent']),
                    ['right'],
                  )),
                T[6] ||
                  (T[6] = se(
                    ne((M) => s(f)(M, k.$props.node), ['stop', 'prevent']),
                    ['down'],
                  )),
                T[7] ||
                  (T[7] = se(
                    ne((M) => s(f)(M, k.$props.node), ['stop', 'prevent']),
                    ['left'],
                  )),
                T[8] ||
                  (T[8] = se(
                    ne((M) => s(f)(M, k.$props.node), ['stop', 'prevent']),
                    ['space'],
                  )),
                T[9] ||
                  (T[9] = se(
                    ne((M) => s(f)(M, k.$props.node), ['stop', 'prevent']),
                    ['esc'],
                  )),
              ],
            },
            [
              R('div', uC, [
                R(
                  'div',
                  { class: pe(['va-tree-node-content', s(S)]), onClick: T[3] || (T[3] = (M) => A('node')) },
                  [
                    k.$props.node.hasChildren
                      ? (C(),
                        _(
                          'div',
                          {
                            key: 0,
                            class: 'va-tree-node-content__item va-tree-node-content__item--leaf',
                            onClick: T[0] || (T[0] = ne((M) => A('leaf'), ['stop'])),
                          },
                          [
                            V(k.$slots, 'icon-toggle', J(ie(k.$props.node)), () => [
                              ue(
                                s(Oe),
                                { name: y.value ? 'keyboard_arrow_down' : 'keyboard_arrow_right', size: '20px' },
                                null,
                                8,
                                ['name'],
                              ),
                            ]),
                          ],
                        ))
                      : E('', !0),
                    s(o)
                      ? (C(),
                        _(
                          'div',
                          {
                            key: 1,
                            class: 'va-tree-node-content__item',
                            onClick: T[2] || (T[2] = ne(() => {}, ['stop'])),
                          },
                          [
                            V(k.$slots, 'checkbox', J(ie(k.$props.node)), () => [
                              ue(
                                s(oo),
                                {
                                  'model-value': k.$props.node.checked,
                                  color: s(l),
                                  indeterminate: '',
                                  'onUpdate:modelValue': T[1] || (T[1] = (M) => s(v)(k.$props.node, M)),
                                  class: 'va-tree-node__checkbox',
                                },
                                null,
                                8,
                                ['model-value', 'color'],
                              ),
                            ]),
                          ],
                        ))
                      : E('', !0),
                    m.value
                      ? (C(),
                        _('div', cC, [
                          V(k.$slots, 'icon', J(ie(k.$props.node)), () => [
                            ue(s(Oe), { name: m.value, size: 'small' }, null, 8, ['name']),
                          ]),
                        ]))
                      : E('', !0),
                    R(
                      'div',
                      { class: pe(['va-tree-node-content__body', s(w)]) },
                      [V(k.$slots, 'content', J(ie(k.$props.node)), () => [Te(fe(g.value), 1)])],
                      2,
                    ),
                  ],
                  2,
                ),
              ]),
              Bt(
                R(
                  'div',
                  { 'aria-hidden': !k.$props.node.expanded, class: pe(['va-tree-node-children', s($)]) },
                  [
                    (C(!0),
                    _(
                      be,
                      null,
                      Ie(
                        k.$props.node.children,
                        (M) => (
                          C(),
                          U(
                            O,
                            { key: s(d)(M), node: M },
                            st({ _: 2 }, [
                              Ie(k.$slots, (ae, oe) => ({ name: oe, fn: z((B) => [V(k.$slots, oe, J(ie(B)))]) })),
                            ]),
                            1032,
                            ['node'],
                          )
                        ),
                      ),
                      128,
                    )),
                  ],
                  10,
                  dC,
                ),
                [[Ka, k.$props.node.hasChildren]],
              ),
            ],
            42,
            iC,
          )
        )
      }
    },
  }),
  fC = Q(pC),
  mC = { class: 'va-tree-view', role: 'tree' },
  gC = G({
    name: 'VaTreeView',
    __name: 'VaTreeView',
    props: { ...tC },
    emits: [...aC],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { treeItems: n, getTrackBy: l } = sC(a, o)
      return (r, u) => (
        C(),
        _('div', mC, [
          r.$props.filter && !s(n).length
            ? V(r.$slots, 'not-found', { key: 0 }, () => [Te('No matching nodes found')])
            : (C(!0),
              _(
                be,
                { key: 1 },
                Ie(
                  s(n),
                  (d) => (
                    C(),
                    U(
                      s(fC),
                      { key: s(l)(d), node: d },
                      st({ _: 2 }, [Ie(r.$slots, (c, v) => ({ name: v, fn: z((p) => [V(r.$slots, v, J(ie(p)))]) }))]),
                      1032,
                      ['node'],
                    )
                  ),
                ),
                128,
              )),
        ])
      )
    },
  }),
  yC = Q(gC),
  bC = { class: 'va-scroll-container__content' },
  hC = G({
    name: 'VaScrollContainer',
    __name: 'VaScrollContainer',
    props: {
      ...pa,
      vertical: { type: Boolean, default: !1 },
      horizontal: { type: Boolean, default: !1 },
      color: { type: String, default: 'secondary' },
      rtl: { type: Boolean, default: !1 },
      gradient: { type: Boolean, default: !1 },
      sizesConfig: { type: Object, default: () => ({ defaultSize: 4, sizes: { small: 4, medium: 6, large: 8 } }) },
      size: { type: String, default: 'small', validator: (e) => ['small', 'medium', 'large'].includes(e) },
    },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        { sizeComputed: o } = fa(t),
        n = i(() => (t.horizontal ? 'auto' : 'hidden')),
        l = i(() => (t.vertical ? 'auto' : 'hidden')),
        r = i(() => {
          const c = a(t.color)
          return t.gradient
            ? `linear-gradient(0deg, var(--va-scroll-container-scrollbar-gradient-to) 0%, ${c} 100%)`
            : c
        }),
        u = i(() => o.value),
        d = i(() => (t.rtl ? 'rtl' : 'ltr'))
      return (c, v) => (
        C(),
        _(
          'div',
          {
            class: 'va-scroll-container',
            style: Y(
              `--va-scroll-color: ${String(r.value)};--va-scrollbar-size: ${String(u.value)};--va-overflow-x: ${String(n.value)};--va-overflow-y: ${String(l.value)};--va-scrollbar-position: ${String(d.value)}`,
            ),
          },
          [R('div', bC, [V(c.$slots, 'default')])],
          4,
        )
      )
    },
  }),
  CC = Q(hC),
  SC = { class: 'va-viewer-content' },
  $C = G({
    name: 'VaViewer',
    inheritAttrs: !1,
    __name: 'VaViewer',
    setup(e, { expose: t }) {
      const a = D(),
        o = D(),
        n = eo(),
        l = D(!0),
        r = i(() => n.value && !l.value),
        u = () => (l.value = !1),
        d = () => (l.value = !0),
        c = dt(),
        v = () => {
          c.anchor || u()
        }
      Mo([a, o], d)
      const p = ya(),
        f = i(() => {
          var g
          return (g = p.value) == null ? void 0 : g.body
        })
      return (
        t({ openViewer: u, closeViewer: d }),
        (g, y) => (
          C(),
          _(
            be,
            null,
            [
              R(
                'div',
                H({ class: 'va-viewer' }, g.$attrs, { onClick: v }),
                [
                  V(g.$slots, 'anchor', J(ie({ openViewer: u }))),
                  g.$slots.anchor ? E('', !0) : V(g.$slots, 'default', { key: 0 }),
                ],
                16,
              ),
              r.value
                ? (C(),
                  U(
                    Wa,
                    { key: 0, to: f.value },
                    [
                      R('div', SC, [
                        R(
                          'div',
                          { ref_key: 'content', ref: a, class: 'va-viewer-content__main-area' },
                          [g.$slots.image ? E('', !0) : V(g.$slots, 'default', { key: 0 }), V(g.$slots, 'image')],
                          512,
                        ),
                        R(
                          'div',
                          { ref_key: 'controls', ref: o, class: 'va-viewer-content__controls-panel' },
                          [
                            V(g.$slots, 'controls'),
                            V(g.$slots, 'close', J(ie({ close: d })), () => [
                              R('button', { class: 'va-viewer-content__close-button', onClick: d }, [
                                ue(s(Oe), { name: 'close', color: 'backgroundPrimary' }),
                              ]),
                            ]),
                          ],
                          512,
                        ),
                      ]),
                    ],
                    8,
                    ['to'],
                  ))
                : E('', !0),
            ],
            64,
          )
        )
      )
    },
  }),
  kC = Q($C),
  wC = G({
    name: 'VaValue',
    props: { defaultValue: { type: null, required: !1, default: !1 } },
    setup(e, { slots: t }) {
      const a = D(e.defaultValue),
        o = new Proxy(a, {
          get(n, l) {
            return l === 'value' ? n.value : n[l]
          },
          set(n, l, r) {
            return (l === 'value' && (n.value = r), !0)
          },
        })
      return () => Re(be, [Cs(t.default, o)])
    },
  }),
  _C = Q(wC),
  VC = (e) => {
    const t = document.createElement('div')
    ;((t.style.position = 'absolute'), (t.style.top = '0'), (t.style.left = '0'), (t.style.width = 'auto'))
    const { font: a } = window.getComputedStyle(e)
    return (
      (t.style.font = a),
      (t.textContent = 'Vuestic'),
      (t.style.zIndex = '-1'),
      (t.style.pointerEvents = 'none'),
      (t.style.opacity = '0'),
      (t.ariaHidden = 'true'),
      (t.innerText = e.value),
      t
    )
  },
  BC = (e, t) => {
    const a = D(),
      o = D()
    return (
      re(e, (n) => {
        var l, r
        n &&
          ((a.value = VC(n)), (r = (l = e.value) == null ? void 0 : l.parentElement) == null || r.appendChild(a.value))
      }),
      ca(a, (n) => {
        !n || !e.value || (o.value = n[0].contentRect.height)
      }),
      re(t, (n) => {
        a.value && ((a.value.innerText = String(n)), (a.value.innerHTML += '&nbsp;;'))
      }),
      o
    )
  },
  TC = ['rows', 'loading', 'ariaLabel'],
  Pr = (e) => {
    if (e > 0) return !0
    throw new Error(`\`minRows|maxRows\` must be a positive integer greater than 0, but ${e} is provided`)
  },
  { createEmits: IC, createListeners: PC } = ha(['input', 'change', 'click', 'update:modelValue']),
  Ar = Ee(gt),
  AC = G({
    name: 'VaTextarea',
    __name: 'VaTextarea',
    props: {
      ...Zt,
      ...Ar,
      ...Qe,
      ...zt,
      modelValue: { type: [String, Number], default: '' },
      placeholder: { type: String },
      autosize: { type: Boolean, default: !1 },
      minRows: { type: [Number, String], default: 1, validator: Pr },
      maxRows: { type: [Number, String], validator: Pr },
      resize: { type: Boolean, default: !0 },
      clearValue: { type: [String], default: '' },
    },
    emits: [...IC(), ...Xt],
    setup(e, { expose: t, emit: a }) {
      const o = e,
        n = a,
        l = Yt(),
        r = we(),
        { valueComputed: u } = Ke(o, n, 'modelValue', { defaultValue: '' }),
        d = () => {
          Pt(r.value)
        },
        c = () => {
          Do(r.value)
        },
        v = () =>
          S(() => {
            ;(n('update:modelValue', o.clearValue), n('clear'), $())
          }),
        {
          isDirty: p,
          isTouched: f,
          computedError: g,
          computedErrorMessages: y,
          listeners: m,
          validationAriaAttributes: b,
          isLoading: h,
          resetValidation: $,
          withoutValidation: S,
        } = Ht(o, n, { value: u, focus: d, reset: v }),
        w = i(() => o.resize && !o.autosize),
        I = D(o.minRows),
        A = BC(r, u)
      function k() {
        let B = parseFloat(String(o.minRows)),
          K = parseFloat(String(o.maxRows))
        if (((B = isNaN(B) ? 1 : B), (K = isNaN(K) ? 1 / 0 : K), !o.autosize)) {
          I.value = Math.max(K, Math.min(B, K ?? 0))
          return
        }
        if (!A.value || !r.value) return
        const L = getComputedStyle(r.value),
          x = A.value,
          N = parseFloat(L.lineHeight),
          P = Math.max(B * N, B + Math.round(N)),
          te = K * N || 1 / 0,
          X = Math.max(P, Math.min(te, x ?? 0))
        ;((I.value = Math.round(X / N)), (r.value.style.height = `${X + 1}px`))
      }
      St(() => {
        k()
      })
      const T = i(() => ({ resize: w.value ? void 0 : 'none' })),
        O = i(() => ({ ...Ge(o, ['disabled', 'readonly', 'placeholder', 'name']) })),
        M = i(() => ({ ...b.value, ...At(l, ['class', 'style']) })),
        ae = ze(Ar),
        oe = PC(n)
      return (
        t({
          isDirty: p,
          isTouched: f,
          isLoading: h,
          computedError: g,
          computedErrorMessages: y,
          reset: v,
          focus: d,
          blur: c,
          value: u,
          withoutValidation: S,
          resetValidation: $,
        }),
        (B, K) => (
          C(),
          U(
            s(gt),
            H({ class: 'va-textarea' }, s(ae), { error: s(g), 'error-messages': s(y) }),
            {
              default: z(() => [
                R(
                  'div',
                  { class: pe(['va-textarea__resize-wrapper', { 'va-textarea__resize-wrapper--resizable': w.value }]) },
                  [
                    Bt(
                      R(
                        'textarea',
                        H(
                          { 'onUpdate:modelValue': K[0] || (K[0] = (L) => (mt(u) ? (u.value = L) : null)) },
                          { ...O.value, ...s(oe), ...M.value, ...s(m) },
                          {
                            class: ['va-textarea__textarea', { 'va-textarea__textarea--autosize': e.autosize }],
                            ref_key: 'textarea',
                            ref: r,
                            rows: I.value,
                            style: T.value,
                            loading: s(h),
                            ariaLabel: B.$props.label,
                          },
                        ),
                        null,
                        16,
                        TC,
                      ),
                      [[zr, s(u)]],
                    ),
                  ],
                  2,
                ),
              ]),
              _: 1,
            },
            16,
            ['error', 'error-messages'],
          )
        )
      )
    },
  }),
  LC = Rt(AC),
  Lr = '[role="menuitem"]:not([aria-disabled="true"])',
  OC = '[role="menuitem"]:focus',
  xC = (e) => ({ role: 'menuitem', tabindex: -1, 'aria-disabled': !!e.disabled }),
  EC = () => ({ role: 'menu', tabindex: 0 }),
  DC = (e) => {
    We(
      'keydown',
      ({ key: t }) => {
        if (!e.value) return
        const a = e.value.querySelectorAll(Lr),
          o = e.value.querySelector(OC)
        if (a.length) {
          if (!o) {
            const n = e.value.querySelector(Lr)
            n && Pt(n)
            return
          }
          if (t === 'ArrowDown' || t === 'ArrowRight') {
            const n = Array.from(a).indexOf(o)
            Pt(a[n + 1])
          }
          if (t === 'ArrowUp' || t === 'ArrowLeft') {
            const n = Array.from(a).indexOf(o)
            Pt(a[n - 1])
          }
        }
      },
      e,
    )
  },
  FC = { class: 'va-menu-item__cell va-menu-item__cell--left' },
  MC = { class: 'va-menu-item__cell va-menu-item__cell--center' },
  NC = { class: 'va-menu-item__content' },
  RC = { class: 'va-menu-item__cell va-menu-item__cell--right' },
  Xi = G({
    name: 'VaMenuItem',
    __name: 'VaMenuItem',
    props: {
      name: { type: String, default: '' },
      icon: { type: String, defatult: '' },
      rightIcon: { type: String, defatult: '' },
      disabled: { type: Boolean, default: !1 },
    },
    emits: ['selected'],
    setup(e, { emit: t }) {
      const { hasKeyboardFocus: a, keyboardFocusListeners: o } = ff()
      return (n, l) => (
        C(),
        _(
          'tr',
          H({ class: 'va-menu-item' }, s(xC)({ disabled: e.disabled }), wt(s(o), !0), {
            class: { 'va-menu-item--disabled': e.disabled, 'va-menu-item--keyboard-focus': s(a) },
            onClick: l[0] || (l[0] = (r) => n.$emit('selected')),
            onKeydown: l[1] || (l[1] = se((r) => n.$emit('selected'), ['enter', 'space'])),
          }),
          [
            R('td', FC, [
              V(n.$slots, 'left-icon', {}, () => [
                e.icon
                  ? (C(), U(s(Oe), { key: 0, class: 'va-menu-item__icon--left', name: e.icon }, null, 8, ['name']))
                  : E('', !0),
              ]),
            ]),
            R('td', MC, [V(n.$slots, 'default', {}, () => [R('a', NC, fe(e.name), 1)])]),
            R('td', RC, [
              V(n.$slots, 'right-icon', {}, () => [
                e.rightIcon
                  ? (C(),
                    U(s(Oe), { key: 0, class: 'va-menu-item__icon--right', name: e.rightIcon }, null, 8, ['name']))
                  : E('', !0),
              ]),
            ]),
          ],
          16,
        )
      )
    },
  }),
  zC = { class: 'va-menu-list__group-name' },
  HC = G({
    name: 'VaMenuGroup',
    __name: 'VaMenuGroup',
    props: { groupName: { type: String, required: !0 }, color: { type: String, default: 'secondary' } },
    setup(e) {
      const t = e,
        { getColor: a } = Ce(),
        o = i(() => a(t.color))
      return (n, l) => (
        C(),
        _(
          be,
          null,
          [
            R(
              'div',
              {
                class: 'va-menu-list__group-name-wrapper',
                colspan: '99999',
                style: Y(`--va-color-computed: ${String(o.value)}`),
              },
              [R('span', zC, fe(e.groupName), 1)],
              4,
            ),
            V(n.$slots, 'default', { style: Y(`--va-color-computed: ${String(o.value)}`) }, void 0, !0),
          ],
          64,
        )
      )
    },
  }),
  Ji = Ca(HC, [['__scopeId', 'data-v-4dd1ae9a']]),
  jC = { colspan: '9999' },
  UC = G({
    name: 'VaMenuList',
    __name: 'VaMenuList',
    props: { ...Oa, options: { type: Array, default: () => [] } },
    emits: ['selected'],
    setup(e, { emit: t }) {
      const a = e,
        o = D()
      DC(o)
      const { getText: n, getValue: l, getDisabled: r, getGroupBy: u, getTrackBy: d } = xa(a),
        c = i(() =>
          a.options.reduce(
            (g, y) => {
              const m = u(y)
              return (m ? (g[m] || (g[m] = []), g[m].push(y)) : g._noGroup.push(y), g)
            },
            { _noGroup: [] },
          ),
        ),
        v = (g) => (Array.isArray(g) && g[0].type === be ? g[0].children : g),
        p = (g) => (typeof g.type == 'object' && 'name' in g.type && typeof g.type.name == 'string' ? g.type.name : ''),
        f = (g) =>
          typeof g.type == 'string'
            ? g.type
            : typeof g.type == 'object' && 'name' in g.type && typeof g.type.name == 'string'
              ? g.type.name
              : String(g.key)
      return (g, y) => (
        C(),
        _(
          'table',
          H({ class: 'va-menu-list', ref_key: 'container', ref: o }, s(EC)()),
          [
            R('tbody', null, [
              g.$slots.default
                ? (C(!0),
                  _(
                    be,
                    { key: 0 },
                    Ie(
                      v(g.$slots.default()),
                      (m) => (
                        C(),
                        _(
                          be,
                          null,
                          [
                            p(m) === 'VaMenuItem'
                              ? (C(), U(pt(m), { key: f(m) + 'menuitem' }))
                              : p(m) === 'VaDropdown'
                                ? (C(), U(pt(m), { key: f(m) + 'menu-dropdown' }))
                                : (C(),
                                  _('td', { colspan: '999', key: f(m), class: 'va-menu-list__virtual-td' }, [
                                    (C(), U(pt(m))),
                                  ])),
                          ],
                          64,
                        )
                      ),
                    ),
                    256,
                  ))
                : V(g.$slots, 'default', { key: 1 }, () => [
                    (C(!0),
                    _(
                      be,
                      null,
                      Ie(
                        c.value,
                        (m, b) => (
                          C(),
                          _(
                            be,
                            { key: b },
                            [
                              b !== '_noGroup'
                                ? V(g.$slots, 'group', { key: 0 }, () => [
                                    R('tr', null, [
                                      R('td', jC, [ue(Ji, { 'group-name': b }, null, 8, ['group-name'])]),
                                    ]),
                                  ])
                                : E('', !0),
                              (C(!0),
                              _(
                                be,
                                null,
                                Ie(
                                  m,
                                  (h) => (
                                    C(),
                                    U(
                                      Xi,
                                      {
                                        key: s(d)(h),
                                        name: s(n)(h),
                                        icon: h.icon,
                                        'right-icon': h.rightIcon,
                                        disabled: s(r)(h),
                                        onSelected: ($) => g.$emit('selected', s(l)(h), h),
                                      },
                                      {
                                        'left-icon': z(($) => [V(g.$slots, 'left-icon', J(ie($)))]),
                                        'right-icon': z(($) => [V(g.$slots, 'right-icon', J(ie($)))]),
                                        _: 2,
                                      },
                                      1032,
                                      ['name', 'icon', 'right-icon', 'disabled', 'onSelected'],
                                    )
                                  ),
                                ),
                                128,
                              )),
                            ],
                            64,
                          )
                        ),
                      ),
                      128,
                    )),
                  ]),
            ]),
          ],
          16,
        )
      )
    },
  }),
  qo = Rt(UC),
  WC = Rt(Xi),
  KC = Rt(Ji),
  GC = (e) => {
    St(() => {
      e.value &&
        Ye(() => {
          Pt(Xe(e.value))
        })
    })
  },
  Or = Ee(qo),
  qC = ra(qo),
  xr = Ee(Ct),
  YC = ra(Ct),
  XC = G({
    name: 'VaMenu',
    __name: 'VaMenu',
    props: { ...me, ...Or, ...xr, stickToEdges: { type: Boolean, default: !0 } },
    emits: [...YC, ...qC],
    setup(e, { expose: t, emit: a }) {
      const o = D(),
        n = D()
      GC(o)
      const l = () => {
          var c
          ;((c = n.value) == null || c.hide(),
            Ye(() => {
              var v
              const p = Xe((v = n.value) == null ? void 0 : v.anchorRef)
              p && $n(p)
            }))
        },
        r = (c) => {
          ;(c.key === 'Escape' && l(), (c.key === 'ArrowDown' || c.key === 'ArrowUp') && c.preventDefault())
        },
        u = ze(Or),
        d = ze(xr)
      return (
        t({ close: l }),
        (c, v) => (
          C(),
          U(
            s(Ct),
            H(s(d), { ref_key: 'dropdown', ref: n }),
            {
              anchor: z(() => [V(c.$slots, 'anchor')]),
              default: z(() => [
                ue(
                  s(va),
                  { onKeydown: r },
                  {
                    default: z(() => [
                      ue(
                        s(qo),
                        H(
                          {
                            onKeydown:
                              v[0] ||
                              (v[0] = se(
                                ne(() => {}, ['prevent', 'stop']),
                                ['enter', 'space'],
                              )),
                          },
                          s(u),
                          {
                            ref_key: 'menuList',
                            ref: o,
                            onSelected:
                              v[1] ||
                              (v[1] = (p) => {
                                ;(c.$emit('selected', p), l())
                              }),
                          },
                        ),
                        st({ _: 2 }, [
                          c.$slots.default
                            ? { name: 'default', fn: z(() => [V(c.$slots, 'default')]), key: '0' }
                            : void 0,
                        ]),
                        1040,
                      ),
                    ]),
                    _: 3,
                  },
                ),
              ]),
              _: 3,
            },
            16,
          )
        )
      )
    },
  }),
  JC = Rt(XC),
  ZC = { rules: () => [], dirty: !1, errorCount: 1, success: !1, messages: () => [], immediateValidation: !1 },
  QC = { stateful: !1 },
  eS = G({
    __name: 'VaFormField',
    props: pu(
      {
        stateful: { type: Boolean },
        modelValue: {},
        name: {},
        rules: {},
        dirty: { type: Boolean },
        error: { type: Boolean },
        errorMessages: {},
        errorCount: {},
        success: { type: Boolean },
        messages: {},
        immediateValidation: { type: Boolean },
        clearValue: {},
      },
      { ...QC, ...ZC },
    ),
    emits: ['update:error', 'update:errorMessages', 'update:dirty', 'update:modelValue'],
    setup(e, { emit: t }) {
      const a = e,
        o = t,
        { valueComputed: n } = Ke(a, o, 'modelValue'),
        l = () => {
          n.value = a.clearValue
        },
        r = () => {},
        {
          computedError: u,
          computedErrorMessages: d,
          validate: c,
          isDirty: v,
          isLoading: p,
          isValid: f,
          resetValidation: g,
          validationAriaAttributes: y,
          listeners: m,
        } = Ht(a, o, { reset: l, focus: r, value: n }),
        b = i(() => (u.value ? d.value : a.messages)),
        h = i(() => (f.value ? (a.success ? 'success' : '') : 'danger')),
        $ = i(() => (a.error ? Number(a.errorCount) : 99)),
        S = D(n.value)
      St(() => {
        S.value = n.value
      })
      const w = () =>
        new Proxy(S, {
          get(I, A) {
            return A === 'ref' ? S.value : Reflect.get(I, A)
          },
          set(I, A, k) {
            return A === 'ref' ? ((S.value = k), (n.value = k), !0) : Reflect.set(n, A, k)
          },
        })
      return (I, A) => (
        C(),
        U(
          s(Oo),
          { 'model-value': b.value, 'has-error': !s(f), color: h.value, limit: $.value },
          st(
            {
              default: z(({ ariaAttributes: k, attrs: T }) => [
                V(
                  I.$slots,
                  'default',
                  J(
                    ie({
                      error: s(u),
                      errorMessages: b.value,
                      messages: b.value,
                      validate: s(c),
                      isDirty: s(v),
                      isLoading: s(p),
                      isValid: s(f),
                      resetValidation: s(g),
                      validationAriaAttributes: s(y),
                      ...s(m),
                      value: w(),
                      modelValue: w(),
                      ariaAttributes: k,
                      bind: { ...T, ...k, ...s(m) },
                    }),
                  ),
                ),
              ]),
              _: 2,
            },
            [Ie(['message', 'messages'], (k) => ({ name: k, fn: z((T) => [V(I.$slots, k, J(ie(T)))]) }))],
          ),
          1032,
          ['model-value', 'has-error', 'color', 'limit'],
        )
      )
    },
  }),
  tS = Rt(eS),
  aS = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        VaAccordion: yv,
        VaAffix: kv,
        VaAlert: Tv,
        VaAppBar: Av,
        VaAspectRatio: Js,
        VaAvatar: To,
        VaAvatarGroup: Rv,
        VaBacktop: jv,
        VaBadge: li,
        VaBreadcrumbs: up,
        VaBreadcrumbsItem: ip,
        VaButton: xe,
        VaButtonDropdown: Vp,
        VaButtonGroup: No,
        VaButtonToggle: Tp,
        VaCard: Rp,
        VaCardActions: Mp,
        VaCardBlock: Np,
        VaCardContent: Dp,
        VaCardTitle: Fp,
        VaCarousel: vf,
        VaCheckbox: oo,
        VaChip: Cf,
        VaCollapse: _f,
        VaColorIndicator: Yn,
        VaColorInput: Jf,
        VaColorPalette: em,
        VaConfig: Qa,
        VaContent: lm,
        VaCounter: fm,
        VaDataTable: fg,
        VaDateInput: Wg,
        VaDatePicker: Kg,
        VaDivider: Pi,
        VaDropdown: Ct,
        VaDropdownContent: va,
        VaFallback: Va,
        VaFileUpload: Ty,
        VaForm: Oy,
        VaFormField: tS,
        VaHover: bo,
        VaIcon: Oe,
        VaImage: Wn,
        VaInfiniteScroll: My,
        VaInnerLoading: wi,
        VaInput: Jn,
        VaInputWrapper: gt,
        VaLayout: Qy,
        VaList: Ai,
        VaListItem: Ko,
        VaListItemLabel: oy,
        VaListItemSection: Ta,
        VaListLabel: ay,
        VaListSeparator: ny,
        VaMenu: JC,
        VaMenuGroup: KC,
        VaMenuItem: WC,
        VaMenuList: qo,
        VaMessageList: Oo,
        VaModal: zn,
        VaNavbar: ib,
        VaNavbarItem: ub,
        VaOptionList: $b,
        VaPagination: Bb,
        VaParallax: Ob,
        VaPopover: Nb,
        VaProgressBar: Li,
        VaProgressCircle: Aa,
        VaRadio: Ni,
        VaRating: Kb,
        VaScrollContainer: CC,
        VaSelect: Vh,
        VaSeparator: Kc,
        VaSidebar: Dh,
        VaSidebarItem: Uh,
        VaSidebarItemContent: Hh,
        VaSidebarItemTitle: jh,
        VaSkeleton: Ah,
        VaSkeletonGroup: Lh,
        VaSlider: e0,
        VaSpacer: qc,
        VaSplit: r0,
        VaStepper: _0,
        VaStickyScrollbar: Zc,
        VaSwitch: Ri,
        VaTab: y0,
        VaTabs: p0,
        VaTextarea: LC,
        VaTimeInput: U0,
        VaTimePicker: eC,
        VaTimeline: X0,
        VaTimelineItem: Q0,
        VaToast: Is,
        VaTreeView: yC,
        VaValue: _C,
        VaViewer: kC,
        VaVirtualScroller: jo,
      },
      Symbol.toStringTag,
      { value: 'Module' },
    ),
  ),
  oS = (e) => typeof e == 'function',
  kt = (e, t, ...a) => {
    oS(t) ? e.use(t(...a)) : e.use(t)
  },
  dS = Et((e = {}) => ({
    install(t) {
      const { config: a } = e
      ;($o(t),
        Object.entries(aS).forEach(([o, n]) => {
          t.component(o, n)
        }),
        kt(t, Vs(a)),
        kt(t, ls),
        kt(t, Bs(a)),
        kt(t, vv),
        kt(t, dd),
        kt(t, Ld),
        kt(t, Ad),
        kt(t, cv),
        $o(null))
    },
  })),
  nS = ['GlobalConfigPlugin', 'ColorConfigPlugin'],
  vS = Et((e = {}) => ({
    install(t) {
      const { config: a, components: o, plugins: n } = e
      ;($o(t),
        kt(t, (n == null ? void 0 : n.GlobalConfigPlugin) || Vs, a),
        kt(t, (n == null ? void 0 : n.CachePlugin) || ls),
        kt(t, (n == null ? void 0 : n.ColorConfigPlugin) || Bs, a),
        n &&
          Object.entries(n).forEach(([l, r]) => {
            nS.includes(l) || kt(t, r)
          }),
        o &&
          Object.entries(o).forEach(([l, r]) => {
            t.component(l, r)
          }),
        $o(null))
    },
  })),
  pS = () => {
    var e
    const t = (e = qe()) == null ? void 0 : e.appContext
    if (!t)
      throw new Error(
        'useModal can be used only in setup function. You can use app.config.globalProperties.$vaModal outside setup function',
      )
    return {
      init: (n) => _a(n, t),
      confirm: (n) =>
        typeof n == 'string'
          ? new Promise((l, r) => {
              _a(
                {
                  message: n,
                  onOk() {
                    l(!0)
                  },
                  onCancel() {
                    l(!1)
                  },
                },
                t,
              )
            })
          : new Promise((l, r) => {
              _a(
                {
                  ...n,
                  onOk() {
                    var u
                    ;((u = n == null ? void 0 : n.onOk) == null || u.call(n), l(!0))
                  },
                  onCancel() {
                    var u
                    ;((u = n == null ? void 0 : n.onCancel) == null || u.call(n), l(!1))
                  },
                },
                t,
              )
            }),
    }
  },
  lS = () => {
    const e = qe()
    return i(() => {
      var t
      return ((t = In()) == null ? void 0 : t._context) || (e == null ? void 0 : e.appContext)
    })
  },
  fS = () => {
    const e = lS(),
      t = [],
      a = (u) => {
        const d = As(u, e.value)
        return (d && t.push(d), d)
      }
    return {
      init: (u) => a(u),
      notify: a,
      close: (u) => Sn(u),
      closeAll: (u = !1) => Ps(u ? void 0 : e.value),
      closeAllCreatedInThisHook: () => {
        t.forEach((u) => Sn(u))
      },
    }
  }
export {
  Dp as A,
  Jn as B,
  Wg as C,
  Jf as D,
  U0 as E,
  pS as F,
  Tp as G,
  Aa as H,
  Tv as I,
  Ty as J,
  Li as K,
  p0 as L,
  y0 as M,
  Ta as N,
  oy as O,
  e0 as P,
  Ri as Q,
  cS as R,
  Oy as S,
  _C as T,
  oo as U,
  Qy as V,
  Wn as W,
  vf as X,
  uS as a,
  ip as b,
  up as c,
  Ct as d,
  va as e,
  Ai as f,
  Ko as g,
  Oe as h,
  ny as i,
  xe as j,
  To as k,
  ib as l,
  yv as m,
  _f as n,
  Uh as o,
  Hh as p,
  jh as q,
  Dh as r,
  Uu as s,
  iS as t,
  Ce as u,
  vS as v,
  dS as w,
  fS as x,
  Rp as y,
  zn as z,
}
//# sourceMappingURL=vuestic-ui-hYeKHxJy.js.map

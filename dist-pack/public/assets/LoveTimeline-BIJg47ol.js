import { u as Me, p as $e, _ as me, a as Te } from './index-D_419K7i.js'
import {
  x as Ie,
  F as ze,
  G as Fe,
  j as Ce,
  H as Ee,
  h as je,
  z as Ae,
  k as Ne,
  B as Pe,
  I as Be,
  J as Le,
  K as Oe,
} from './vuestic-ui-hYeKHxJy.js'
import {
  k as Ge,
  a as N,
  r as h,
  E as We,
  G as Ye,
  q as x,
  C as s,
  L as f,
  d as Q,
  w as T,
  F as pe,
  D as ge,
  o as p,
  v as W,
  x as V,
  c as M,
  u as g,
  t as Y,
  W as He,
} from './vue-vendor-CS4KimFI.js'
import { m as H } from './moment.service-emWBjwx5.js'
import './vendor-Qzk3SZgC.js'
const Ke = { class: 'love-timeline' },
  Re = { class: 'row mb-4' },
  qe = { class: 'flex xs12 w-full' },
  Je = {
    class:
      'grid grid-cols-1 md:grid-cols-3 items-center bg-transparent p-4 rounded-lg gap-4 w-full border border-backgroundBorder',
  },
  Xe = { class: 'flex justify-center md:justify-start' },
  Qe = { class: 'flex justify-center w-full' },
  Ze = { class: 'flex justify-center md:justify-end' },
  et = { key: 0, class: 'flex justify-center p-8' },
  tt = {
    key: 1,
    class:
      'text-center p-12 text-gray-400 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700',
  },
  at = { key: 2 },
  st = { class: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2' },
  ot = ['onClick'],
  lt = ['src', 'onError'],
  rt = { class: 'absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300' },
  nt = { class: 'absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300' },
  it = {
    class:
      'bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-100 dark:border-white/10 shadow-sm',
  },
  dt = { class: 'text-gray-800 dark:text-gray-200 text-[10px] font-bold' },
  ct = {
    class:
      'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3',
  },
  ut = { key: 0, class: 'text-white font-medium text-sm line-clamp-2 mb-1 drop-shadow-md' },
  mt = { class: 'flex justify-between items-end' },
  pt = {
    class:
      'relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] w-full max-w-[95vw] md:max-w-4xl',
  },
  gt = {
    class:
      'bg-black flex items-center justify-center relative flex-grow overflow-hidden group min-h-[40vh] md:min-h-[50vh]',
  },
  ft = ['src'],
  vt = { class: 'p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700' },
  yt = { class: 'flex items-center gap-3' },
  ht = { class: 'flex-grow min-w-0' },
  wt = { class: 'flex items-center gap-2 mb-0.5' },
  _t = { class: 'font-bold text-gray-800 dark:text-gray-100 text-sm truncate' },
  xt = { class: 'text-xs text-gray-500 dark:text-gray-400' },
  bt = { key: 0, class: 'flex flex-col md:flex-row items-start justify-between gap-3' },
  kt = { class: 'text-gray-700 dark:text-gray-300 text-sm leading-snug whitespace-pre-wrap flex-grow' },
  Dt = { class: 'flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-start' },
  St = { key: 1, class: 'flex flex-col gap-3 mt-2' },
  Vt = { class: 'flex flex-col md:flex-row gap-3 items-end md:items-start' },
  Ut = { class: 'flex flex-row md:flex-col gap-2 shrink-0' },
  Mt = { class: 'flex flex-col gap-6' },
  $t = { key: 0, class: 'text-center' },
  Tt = { class: 'text-sm text-gray-500 mt-2' },
  It = Ge({
    __name: 'LoveTimeline',
    setup(zt) {
      const d = Me(),
        { init: D } = Ie(),
        { confirm: fe } = ze(),
        ve = N(() => ({ color: d.preferences.theme === 'dark' ? '#f3f4f6' : '#111827' })),
        ye = N(() => ({
          backgroundColor: d.preferences.theme === 'dark' ? '#1e293b' : '#ffffff',
          color: d.preferences.theme === 'dark' ? '#f3f4f6' : '#111827',
        })),
        he = N(() => ({ backgroundColor: d.preferences.theme === 'dark' ? '#0f172a' : '#f9fafb' })),
        S = h([]),
        K = h(!1),
        F = h('day'),
        Z = (t) => {
          const e = t.getFullYear(),
            a = String(t.getMonth() + 1).padStart(2, '0'),
            o = String(t.getDate()).padStart(2, '0')
          return `${e}-${a}-${o}`
        },
        R = (t) => {
          const e = t.getFullYear(),
            a = String(t.getMonth() + 1).padStart(2, '0'),
            o = String(t.getDate()).padStart(2, '0'),
            n = String(t.getHours()).padStart(2, '0'),
            m = String(t.getMinutes()).padStart(2, '0'),
            c = String(t.getSeconds()).padStart(2, '0')
          return `${e}-${a}-${o}T${n}:${m}:${c}`
        },
        P = h(!1),
        I = h(!1),
        q = h(0),
        B = h(0),
        b = h({ description: '', images: [] }),
        z = h(!1),
        r = h(null),
        we = N(() => {
          if (!S.value.length) return {}
          const t = {}
          return (
            S.value.forEach((e) => {
              const a = new Date(e.date)
              let o = '',
                n = '',
                m = 0
              if (F.value === 'year') ((o = a.getFullYear().toString()), (n = o), (m = a.getFullYear()))
              else if (F.value === 'month')
                ((o = `${a.getFullYear()}-${a.getMonth()}`),
                  (n = a.toLocaleDateString('default', { month: 'long', year: 'numeric' })),
                  (m = a.getFullYear() * 100 + a.getMonth()))
              else if (F.value === 'week') {
                const c = new Date(a)
                ;(c.setDate(a.getDate() - a.getDay()),
                  (o = Z(c)),
                  (n = `Week of ${c.toLocaleDateString()}`),
                  (m = c.getTime()))
              } else
                ((o = Z(a)),
                  (n = a.toLocaleDateString('default', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })),
                  (m = a.getTime()))
              ;(t[o] || (t[o] = { title: n, items: [], sortKey: m }), t[o].items.push(e))
            }),
            Object.entries(t)
              .sort(([, e], [, a]) => a.sortKey - e.sortKey)
              .reduce(
                (e, [a, o]) => (
                  o.items.sort((n, m) => new Date(m.date).getTime() - new Date(n.date).getTime()),
                  (e[a] = o),
                  e
                ),
                {},
              )
          )
        }),
        L = async () => {
          K.value = !0
          try {
            S.value = await H.getAll()
          } catch (t) {
            ;(console.error('Failed to fetch moments', t), D({ message: 'Failed to load memories', color: 'danger' }))
          } finally {
            K.value = !1
          }
        },
        _e = () => {
          ;((b.value = { description: '', images: [] }), (q.value = 0), (B.value = 0), (P.value = !0))
        },
        xe = async () => {
          if (b.value.images.length === 0) return
          ;((I.value = !0), (B.value = 0))
          const t = b.value.images.length
          let e = 0
          try {
            for (const a of b.value.images) {
              const o = await be(a)
              let n = a
              const m = new FormData()
              if (
                (m.append('description', b.value.description),
                n.name.toLowerCase().endsWith('.heic') || n.type === 'image/heic')
              )
                try {
                  const c = (
                      await me(async () => {
                        const { default: w } = await import('./vendor-Qzk3SZgC.js').then((k) => k.h)
                        return { default: w }
                      }, [])
                    ).default,
                    l = await c({ blob: n, toType: 'image/jpeg', quality: 0.7 }),
                    v = Array.isArray(l) ? l[0] : l
                  n = new File([v], n.name.replace(/\.heic$/i, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: n.lastModified,
                  })
                } catch (c) {
                  console.error('HEIC conversion failed', c)
                }
              if (n.size > 30 * 1024 * 1024) {
                D({ message: `File ${n.name} is too large (>30MB). Skipping.`, color: 'warning' })
                continue
              }
              ;(m.append('date', R(o)), m.append('image', n))
              try {
                ;(await H.create(m), e++)
              } catch (c) {
                ;(console.error(`Failed to upload ${n.name}:`, c),
                  D({ message: `Failed to upload ${n.name}: ${c.message || 'Unknown error'}`, color: 'danger' }))
              }
              ;((B.value = e), (q.value = Math.round((e / t) * 100)))
            }
            e > 0
              ? (D({ message: `Successfully added ${e} memories!`, color: 'success' }), (P.value = !1), L())
              : D({ message: 'No photos were uploaded successfully', color: 'danger' })
          } catch (a) {
            ;(console.error(a), D({ message: `Upload error: ${a.message || 'Unknown error'}`, color: 'danger' }))
          } finally {
            I.value = !1
          }
        },
        be = async (t) => {
          const e = new Date(),
            a = t.lastModified ? new Date(t.lastModified) : e,
            o = (l) => {
              if (!l || isNaN(l.getTime())) return !1
              const v = new Date(),
                w = new Date('2010-01-01'),
                k = new Date(v.getTime() + 864e5)
              return l > w && l < k
            }
          if (t.type.startsWith('image/'))
            try {
              const l = await me(() => import('./vendor-Qzk3SZgC.js').then((u) => u.a1), []),
                v = l.default || l,
                w = new Promise((u, _) => {
                  setTimeout(() => _(new Error('EXIF_TIMEOUT')), 2e3)
                }),
                k = await Promise.race([v.load(t), w]),
                X = [
                  'DateTimeOriginal',
                  'DateTimeDigitized',
                  'DateTime',
                  'DateCreated',
                  'CreateDate',
                  'ModifyDate',
                  'GPSDateStamp',
                  'FileDateTime',
                ]
              for (const u of X) {
                const _ = k[u]
                if (_ && _.description) {
                  let i = _.description
                  if (i.includes(':') && !i.includes('-')) {
                    const y = i.split(' ')
                    y[0] && ((y[0] = y[0].replace(/:/g, '-')), (i = y.join(' ')))
                  }
                  const $ = new Date(i)
                  if (o($)) return $
                }
              }
              if (k.GPSDateStamp && k.GPSTimeStamp) {
                const u = k.GPSDateStamp.description.replace(/:/g, '-'),
                  _ = k.GPSTimeStamp.description,
                  i = new Date(`${u} ${_} UTC`)
                if (o(i)) return i
              }
            } catch {}
          const n = t.name.match(/(?:^|\D)(\d{13})(?:\D|$)/)
          if (n) {
            const l = new Date(parseInt(n[1]))
            if (o(l)) return l
          }
          const m = t.name.match(/(?:^|\D)(\d{10})(?:\D|$)/)
          if (m) {
            const l = new Date(parseInt(m[1]) * 1e3)
            if (o(l)) return l
          }
          const c = [
            { regex: /(?:^|\D)(\d{4})[-_](\d{2})[-_](\d{2})(?:\D|$)/, type: 'ymd' },
            { regex: /(?:^|\D)(\d{4})(\d{2})(\d{2})(?:\D|$)/, type: 'ymd_flat' },
            { regex: /(?:^|\D)(\d{2})[-_](\d{2})[-_](\d{4})(?!\d)/, type: 'dmy' },
            { regex: /(?:^|\D)(\d{2})(\d{2})(\d{4})(?!\d)/, type: 'dmy_flat' },
          ]
          for (const l of c) {
            const v = t.name.match(l.regex)
            if (v) {
              let w = null
              if (
                (l.type === 'ymd' || l.type === 'ymd_flat'
                  ? (w = new Date(`${v[1]}-${v[2]}-${v[3]}`))
                  : (l.type === 'dmy' || l.type === 'dmy_flat') && (w = new Date(`${v[3]}-${v[2]}-${v[1]}`)),
                w && o(w))
              )
                return w
            }
          }
          return a
        },
        ee = async (t) => {
          if (await fe('Are you sure you want to delete this memory?'))
            try {
              ;(await H.delete(t),
                (S.value = S.value.filter((a) => a.id !== t)),
                D({ message: 'Memory deleted', color: 'success' }))
            } catch {
              ;(D({ message: 'Failed to delete memory', color: 'danger' }), L())
            }
        },
        ke = (t) => {
          ;((r.value = t), (z.value = !0))
        },
        te = (t, e) => {
          const a = t.target
          if (e && a.src !== e && !a.src.includes('placeholder')) {
            a.src = e
            return
          }
          a.src.includes('placeholder') || (a.src = 'https://via.placeholder.com/300?text=Image+Error')
        },
        C = h(!1),
        O = h(''),
        G = h(''),
        J = h(!1),
        ae = N(() => {
          var e
          if (!r.value) return !1
          const t = ((e = r.value.User) == null ? void 0 : e.id) || r.value.userId
          return d.id && t && String(d.id) === String(t)
        }),
        De = () => {
          var t, e
          if (((O.value = ((t = r.value) == null ? void 0 : t.description) || ''), (e = r.value) != null && e.date)) {
            const a = new Date(r.value.date)
            G.value = R(a).slice(0, 16)
          }
          C.value = !0
        },
        Se = () => {
          C.value = !1
        },
        Ve = async () => {
          r.value &&
            (await ee(r.value.id),
            S.value.find((t) => {
              var e
              return t.id === ((e = r.value) == null ? void 0 : e.id)
            }) || (z.value = !1))
        },
        Ue = async () => {
          if (r.value) {
            J.value = !0
            try {
              const t = await H.update(r.value.id, { description: O.value, date: R(new Date(G.value)) }),
                e = S.value.findIndex((a) => a.id === t.id)
              ;(e !== -1 && (S.value[e] = { ...S.value[e], description: t.description, date: t.date }),
                (r.value.description = t.description),
                (r.value.date = t.date),
                (C.value = !1),
                D({ message: 'Updated!', color: 'success' }),
                L())
            } catch {
              D({ message: 'Failed to update', color: 'danger' })
            } finally {
              J.value = !1
            }
          }
        }
      return (
        We(z, (t) => {
          t || (C.value = !1)
        }),
        Ye(() => {
          L()
        }),
        (t, e) => {
          const a = Fe,
            o = Ce,
            n = Ee,
            m = je,
            c = Ne,
            l = Pe,
            v = Ae,
            w = Be,
            k = Le,
            X = Oe
          return (
            p(),
            x('div', Ke, [
              s('div', Re, [
                s('div', qe, [
                  s('div', Je, [
                    s('div', Xe, [
                      s('h2', { class: 'text-xl font-bold whitespace-nowrap', style: Q(ve.value) }, 'Our Journey', 4),
                    ]),
                    s('div', Qe, [
                      f(
                        a,
                        {
                          modelValue: F.value,
                          'onUpdate:modelValue': e[0] || (e[0] = (u) => (F.value = u)),
                          options: [
                            { label: 'Day', value: 'day' },
                            { label: 'Week', value: 'week' },
                            { label: 'Month', value: 'month' },
                            { label: 'Year', value: 'year' },
                          ],
                          size: 'medium',
                          color: 'primary',
                          preset: 'secondary',
                          'border-color': 'primary',
                          class: 'justify-center',
                        },
                        null,
                        8,
                        ['modelValue'],
                      ),
                    ]),
                    s('div', Ze, [
                      f(
                        o,
                        { icon: 'add_a_photo', round: '', onClick: _e },
                        { default: T(() => e[9] || (e[9] = [W('Add Memories')])), _: 1 },
                      ),
                    ]),
                  ]),
                ]),
              ]),
              K.value
                ? (p(), x('div', et, [f(n, { indeterminate: '' })]))
                : S.value.length === 0
                  ? (p(),
                    x('div', tt, [
                      f(m, { name: 'collections', size: 'large', color: 'secondary', class: 'mb-2' }),
                      e[10] || (e[10] = s('p', null, 'No memories yet. Start capturing your journey!', -1)),
                    ]))
                  : (p(),
                    x('div', at, [
                      (p(!0),
                      x(
                        pe,
                        null,
                        ge(
                          we.value,
                          (u, _) => (
                            p(),
                            x('div', { key: _, class: 'mb-8' }, [
                              s(
                                'div',
                                { class: 'flex items-center gap-4 mb-6 sticky top-0 z-10 py-3', style: Q(he.value) },
                                [
                                  e[11] ||
                                    (e[11] = s(
                                      'div',
                                      { class: 'h-px bg-gray-200 dark:bg-slate-800 flex-grow' },
                                      null,
                                      -1,
                                    )),
                                  s(
                                    'h3',
                                    {
                                      class:
                                        'text-lg font-bold whitespace-nowrap px-6 py-2 rounded-full shadow-sm border border-gray-100 dark:border-slate-700',
                                      style: Q(ye.value),
                                    },
                                    V(u.title),
                                    5,
                                  ),
                                  e[12] ||
                                    (e[12] = s(
                                      'div',
                                      { class: 'h-px bg-gray-200 dark:bg-slate-800 flex-grow' },
                                      null,
                                      -1,
                                    )),
                                ],
                                4,
                              ),
                              s('div', st, [
                                (p(!0),
                                x(
                                  pe,
                                  null,
                                  ge(u.items, (i) => {
                                    var $
                                    return (
                                      p(),
                                      x(
                                        'div',
                                        {
                                          key: i.id,
                                          class:
                                            'gallery-item relative group overflow-hidden rounded-xl shadow-sm cursor-pointer bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700',
                                          style: { 'padding-bottom': '100%', height: '0' },
                                          onClick: (y) => ke(i),
                                        },
                                        [
                                          s(
                                            'img',
                                            {
                                              src: i.thumbnailUrl,
                                              class:
                                                'absolute top-0 left-0 w-full h-full object-cover transform transition duration-500 group-hover:scale-110',
                                              loading: 'lazy',
                                              onError: (y) => te(y, i.originalUrl),
                                            },
                                            null,
                                            40,
                                            lt,
                                          ),
                                          s('div', rt, [
                                            ($ = i.User) != null && $.avatarUrl
                                              ? (p(),
                                                M(
                                                  c,
                                                  {
                                                    key: 0,
                                                    src: i.User.avatarUrl,
                                                    size: 'small',
                                                    class: 'shadow-md border-2 border-white',
                                                  },
                                                  null,
                                                  8,
                                                  ['src'],
                                                ))
                                              : i.userId === g(d).id && g(d).pfp
                                                ? (p(),
                                                  M(
                                                    c,
                                                    {
                                                      key: 1,
                                                      src: g(d).pfp,
                                                      size: 'small',
                                                      class: 'shadow-md border-2 border-white',
                                                    },
                                                    null,
                                                    8,
                                                    ['src'],
                                                  ))
                                                : (p(),
                                                  M(
                                                    c,
                                                    {
                                                      key: 2,
                                                      size: 'small',
                                                      color: 'primary',
                                                      class: 'shadow-md border-2 border-white',
                                                    },
                                                    {
                                                      default: T(() => {
                                                        var y, E, j
                                                        return [
                                                          W(
                                                            V(
                                                              ((E = (y = i.User) == null ? void 0 : y.displayName) ==
                                                              null
                                                                ? void 0
                                                                : E.charAt(0)) ||
                                                                (i.userId === g(d).id
                                                                  ? (j = g(d).displayName) == null
                                                                    ? void 0
                                                                    : j.charAt(0)
                                                                  : '?'),
                                                            ),
                                                            1,
                                                          ),
                                                        ]
                                                      }),
                                                      _: 2,
                                                    },
                                                    1024,
                                                  )),
                                          ]),
                                          s('div', nt, [
                                            s('div', it, [s('p', dt, V(new Date(i.date).toLocaleDateString()), 1)]),
                                          ]),
                                          s('div', ct, [
                                            i.description ? (p(), x('p', ut, V(i.description), 1)) : Y('', !0),
                                            s('div', mt, [
                                              e[13] || (e[13] = s('div', null, null, -1)),
                                              f(
                                                o,
                                                {
                                                  icon: 'delete',
                                                  flat: '',
                                                  color: 'danger',
                                                  size: 'small',
                                                  round: '',
                                                  class: 'bg-white/20 hover:bg-white/40 text-white',
                                                  onClick: He((y) => ee(i.id), ['stop']),
                                                },
                                                null,
                                                8,
                                                ['onClick'],
                                              ),
                                            ]),
                                          ]),
                                        ],
                                        8,
                                        ot,
                                      )
                                    )
                                  }),
                                  128,
                                )),
                              ]),
                            ])
                          ),
                        ),
                        128,
                      )),
                    ])),
              f(
                v,
                {
                  modelValue: z.value,
                  'onUpdate:modelValue': e[5] || (e[5] = (u) => (z.value = u)),
                  'hide-default-actions': '',
                  'no-padding': '',
                  class: 'image-preview-modal',
                },
                {
                  default: T(() => {
                    var u, _, i, $, y, E, j, se, oe, le, re
                    return [
                      s('div', pt, [
                        s('div', gt, [
                          s(
                            'img',
                            {
                              src: (u = r.value) == null ? void 0 : u.thumbnailUrl,
                              class: 'max-w-full max-h-[60vh] md:max-h-[80vh] object-contain',
                              onError:
                                e[1] ||
                                (e[1] = (U) => {
                                  var A
                                  return te(U, (A = r.value) == null ? void 0 : A.originalUrl)
                                }),
                            },
                            null,
                            40,
                            ft,
                          ),
                          s(
                            'button',
                            {
                              class:
                                'absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 backdrop-blur-sm',
                              onClick: e[2] || (e[2] = (U) => (z.value = !1)),
                            },
                            [f(m, { name: 'close', size: 'small' })],
                          ),
                        ]),
                        s('div', vt, [
                          s('div', yt, [
                            (i = (_ = r.value) == null ? void 0 : _.User) != null && i.avatarUrl
                              ? (p(),
                                M(
                                  c,
                                  { key: 0, size: 'small', src: r.value.User.avatarUrl, class: 'flex-shrink-0' },
                                  null,
                                  8,
                                  ['src'],
                                ))
                              : String(($ = r.value) == null ? void 0 : $.userId) === String(g(d).id) && g(d).pfp
                                ? (p(),
                                  M(c, { key: 1, size: 'small', src: g(d).pfp, class: 'flex-shrink-0' }, null, 8, [
                                    'src',
                                  ]))
                                : String((y = r.value) == null ? void 0 : y.userId) !== String(g(d).id) &&
                                    (E = g(d).partner) != null &&
                                    E.avatarUrl
                                  ? (p(),
                                    M(
                                      c,
                                      {
                                        key: 2,
                                        size: 'small',
                                        src: g($e)(g(d).partner.avatarUrl),
                                        class: 'flex-shrink-0',
                                      },
                                      null,
                                      8,
                                      ['src'],
                                    ))
                                  : (p(),
                                    M(
                                      c,
                                      { key: 3, size: 'small', color: 'primary', class: 'flex-shrink-0' },
                                      {
                                        default: T(() => {
                                          var U, A, ne, ie, de, ce, ue
                                          return [
                                            W(
                                              V(
                                                ((ne =
                                                  (A = (U = r.value) == null ? void 0 : U.User) == null
                                                    ? void 0
                                                    : A.displayName) == null
                                                  ? void 0
                                                  : ne.charAt(0)) ||
                                                  (String((ie = r.value) == null ? void 0 : ie.userId) ===
                                                  String(g(d).id)
                                                    ? (de = g(d).displayName) == null
                                                      ? void 0
                                                      : de.charAt(0)
                                                    : ((ue = (ce = g(d).partner) == null ? void 0 : ce.displayName) ==
                                                      null
                                                        ? void 0
                                                        : ue.charAt(0)) || '?'),
                                              ),
                                              1,
                                            ),
                                          ]
                                        }),
                                        _: 1,
                                      },
                                    )),
                            s('div', ht, [
                              s('div', wt, [
                                s(
                                  'p',
                                  _t,
                                  V(
                                    ((se = (j = r.value) == null ? void 0 : j.User) == null
                                      ? void 0
                                      : se.displayName) ||
                                      (String((oe = r.value) == null ? void 0 : oe.userId) === String(g(d).id)
                                        ? g(d).displayName
                                        : ((le = g(d).partner) == null ? void 0 : le.displayName) || 'Unknown User'),
                                  ),
                                  1,
                                ),
                                e[14] || (e[14] = s('span', { class: 'text-xs text-gray-400' }, '•', -1)),
                                s('span', xt, V(r.value ? new Date(r.value.date).toLocaleString() : ''), 1),
                              ]),
                              C.value
                                ? (p(),
                                  x('div', St, [
                                    f(
                                      l,
                                      {
                                        modelValue: G.value,
                                        'onUpdate:modelValue': e[3] || (e[3] = (U) => (G.value = U)),
                                        type: 'datetime-local',
                                        label: 'Date Taken',
                                        class: 'w-full text-sm',
                                      },
                                      null,
                                      8,
                                      ['modelValue'],
                                    ),
                                    s('div', Vt, [
                                      f(
                                        l,
                                        {
                                          modelValue: O.value,
                                          'onUpdate:modelValue': e[4] || (e[4] = (U) => (O.value = U)),
                                          type: 'textarea',
                                          autosize: '',
                                          class: 'w-full text-sm',
                                          placeholder: 'Add a description...',
                                        },
                                        null,
                                        8,
                                        ['modelValue'],
                                      ),
                                      s('div', Ut, [
                                        f(
                                          o,
                                          {
                                            icon: 'check',
                                            size: 'small',
                                            round: '',
                                            color: 'success',
                                            loading: J.value,
                                            onClick: Ue,
                                          },
                                          null,
                                          8,
                                          ['loading'],
                                        ),
                                        f(o, {
                                          icon: 'close',
                                          size: 'small',
                                          round: '',
                                          flat: '',
                                          color: 'secondary',
                                          onClick: Se,
                                        }),
                                      ]),
                                    ]),
                                  ]))
                                : (p(),
                                  x('div', bt, [
                                    s(
                                      'p',
                                      kt,
                                      V(((re = r.value) == null ? void 0 : re.description) || 'No description'),
                                      1,
                                    ),
                                    s('div', Dt, [
                                      ae.value
                                        ? (p(),
                                          M(o, {
                                            key: 0,
                                            icon: 'edit',
                                            size: 'small',
                                            round: '',
                                            color: 'primary',
                                            preset: 'secondary',
                                            onClick: De,
                                          }))
                                        : Y('', !0),
                                      ae.value
                                        ? (p(),
                                          M(o, {
                                            key: 1,
                                            icon: 'delete',
                                            size: 'small',
                                            round: '',
                                            color: 'danger',
                                            preset: 'secondary',
                                            onClick: Ve,
                                          }))
                                        : Y('', !0),
                                    ]),
                                  ])),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]
                  }),
                  _: 1,
                },
                8,
                ['modelValue'],
              ),
              f(
                v,
                {
                  modelValue: P.value,
                  'onUpdate:modelValue': e[8] || (e[8] = (u) => (P.value = u)),
                  title: 'Upload Memories',
                  'ok-text': I.value ? 'Uploading...' : 'Upload',
                  'cancel-disabled': I.value,
                  'ok-disabled': I.value || b.value.images.length === 0,
                  size: 'large',
                  onOk: xe,
                },
                {
                  default: T(() => [
                    s('div', Mt, [
                      f(
                        w,
                        { color: 'info', outline: '', class: 'mb-0' },
                        {
                          icon: T(() => [f(m, { name: 'info' })]),
                          default: T(() => [e[15] || (e[15] = W(' Select one or more photos to upload. '))]),
                          _: 1,
                        },
                      ),
                      f(
                        l,
                        {
                          modelValue: b.value.description,
                          'onUpdate:modelValue': e[6] || (e[6] = (u) => (b.value.description = u)),
                          label: 'Description / Story',
                          placeholder: 'What was happening in these photos?',
                          type: 'textarea',
                          rows: 3,
                          class: 'w-full',
                        },
                        null,
                        8,
                        ['modelValue'],
                      ),
                      s('div', null, [
                        e[16] || (e[16] = s('label', { class: 'va-title mb-2 block text-gray-600' }, 'Photos', -1)),
                        f(
                          k,
                          {
                            modelValue: b.value.images,
                            'onUpdate:modelValue': e[7] || (e[7] = (u) => (b.value.images = u)),
                            type: 'gallery',
                            'file-types': 'image/*',
                            dropzone: '',
                            multiple: '',
                          },
                          null,
                          8,
                          ['modelValue'],
                        ),
                      ]),
                      I.value
                        ? (p(),
                          x('div', $t, [
                            f(X, { 'model-value': q.value }, null, 8, ['model-value']),
                            s(
                              'p',
                              Tt,
                              ' Uploading ' + V(B.value) + ' / ' + V(b.value.images.length) + ' photos... ',
                              1,
                            ),
                          ]))
                        : Y('', !0),
                    ]),
                  ]),
                  _: 1,
                },
                8,
                ['modelValue', 'ok-text', 'cancel-disabled', 'ok-disabled'],
              ),
            ])
          )
        }
      )
    },
  }),
  Nt = Te(It, [['__scopeId', 'data-v-902a4ef7']])
export { Nt as default }
//# sourceMappingURL=LoveTimeline-BIJg47ol.js.map

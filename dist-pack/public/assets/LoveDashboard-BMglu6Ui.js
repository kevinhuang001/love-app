const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'assets/UpcomingDates-D277uwrZ.js',
      'assets/vuestic-ui-hYeKHxJy.js',
      'assets/vue-vendor-CS4KimFI.js',
      'assets/vendor-Qzk3SZgC.js',
      'assets/vuestic-ui-DDnD9wr0.css',
      'assets/index-D_419K7i.js',
      'assets/index-DsixfF9C.css',
      'assets/message.service-0pLRvHXE.js',
      'assets/message-Dym3VtgI.css',
      'assets/MemoriesCarousel-CkLh4_DK.js',
      'assets/LoveNotes-C8eMccdQ.js',
    ]),
) => i.map((i) => d[i])
import { u as Ae, _ as q, a as $e } from './index-D_419K7i.js'
import {
  x as Me,
  y as Ie,
  z as Pe,
  j as Ue,
  A as Ee,
  h as Ne,
  k as Le,
  B as Oe,
  C as Be,
  D as je,
  E as ze,
} from './vuestic-ui-hYeKHxJy.js'
import { u as Fe, m as Re, P as F, T as He } from './message.service-0pLRvHXE.js'
import {
  k as Ke,
  r as d,
  a as T,
  G as We,
  q as g,
  C as r,
  L as u,
  w as S,
  u as i,
  F as R,
  D as G,
  o as p,
  d as J,
  n as h,
  x as N,
  ae as Ye,
  v as qe,
  t as L,
  c as Q,
  al as X,
} from './vue-vendor-CS4KimFI.js'
import { a as _ } from './anniversary.service-D50iqdsx.js'
import { m as Ge } from './moment.service-emWBjwx5.js'
import './vendor-Qzk3SZgC.js'
const Je = { class: 'love-dashboard' },
  Qe = { class: 'row' },
  Xe = { class: 'flex xs12 flex-col gap-6' },
  Ze = { class: 'absolute top-4 right-4 z-20' },
  et = { key: 0 },
  tt = { key: 1, class: 'py-6 flex flex-col items-center' },
  at = { class: 'flex justify-center gap-8 md:gap-12 mt-2 md:mt-4' },
  ot = { class: 'flex flex-col items-center' },
  st = { class: 'flex flex-col items-center' },
  lt = { class: 'py-2 flex flex-col gap-5' },
  rt = { key: 0, class: 'flex flex-col gap-4' },
  nt = { class: 'bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700' },
  dt = { class: 'flex flex-wrap gap-3 justify-center sm:justify-start' },
  ut = ['onClick'],
  it = { class: 'mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between' },
  ct = { class: 'py-2 flex flex-col gap-5' },
  mt = { class: 'text-sm text-gray-500 dark:text-gray-400 leading-relaxed' },
  pt = { key: 0, class: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
  vt = { class: 'bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700' },
  ft = { class: 'flex flex-wrap gap-3 justify-center sm:justify-start' },
  gt = ['onClick'],
  yt = { class: 'mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between' },
  ht = { class: 'py-4 px-2' },
  bt = Ke({
    __name: 'LoveDashboard',
    setup(xt) {
      const de = X(() => q(() => import('./UpcomingDates-D277uwrZ.js'), __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8]))),
        ue = X(() => q(() => import('./MemoriesCarousel-CkLh4_DK.js'), __vite__mapDeps([9, 1, 2, 3, 4, 5, 6]))),
        ie = X(() => q(() => import('./LoveNotes-C8eMccdQ.js'), __vite__mapDeps([10, 1, 2, 3, 4, 5, 6]))),
        o = Ae(),
        { isDarkTheme: C } = Fe(),
        ce = Ye(),
        { init: f } = Me(),
        A = d(!1),
        $ = d(!1),
        H = d(!1),
        b = d(null),
        O = d([]),
        s = d({ title: '', date: new Date(), description: '', type: 'other', color: 'primary' }),
        k = d(''),
        V = d(null),
        x = d('#3D9209'),
        w = d(new Date()),
        B = d(!1),
        K = d(null),
        Z = d([]),
        ee = d([]),
        j = d(!1),
        M = d('note'),
        D = d(''),
        I = d('#ffffff'),
        me = T(() => {
          const t = o.preferences.heroTheme
          return C(t) ? `${t} text-white` : t
        }),
        z = T(() => (C(o.preferences.heroTheme) ? 'text-gray-100' : 'text-gray-900')),
        pe = T(() => (C(o.preferences.heroTheme) ? 'text-pink-400' : 'text-primary')),
        te = T(() => (C(o.preferences.heroTheme) ? 'text-gray-300' : 'text-gray-700')),
        ae = (t) => {
          ;((M.value = t),
            t === 'hero'
              ? ((D.value = o.preferences.heroTheme), (I.value = '#ffffff'))
              : ((D.value = o.preferences.noteTheme), (I.value = o.preferences.noteCardColor || '#ffffff')),
            (j.value = !0))
        },
        ve = () => {
          ;(M.value === 'hero'
            ? o.updatePreferences({ heroTheme: D.value })
            : o.updatePreferences({ noteTheme: D.value, noteCardColor: I.value }),
            (j.value = !1),
            f({ message: 'Theme updated successfully!', color: 'success' }))
        },
        W = T(() => k.value),
        fe = T(() => {
          const t = []
          let e = !1
          const m = [...O.value.map((l) => (l.type === 'start_date' && k.value ? { ...l, date: k.value } : l))].sort(
            (l, c) => {
              const v = new Date(l.date),
                y = new Date(c.date)
              return v.getTime() - y.getTime()
            },
          )
          for (const l of m) l.type === 'start_date' ? e || (t.push(l), (e = !0)) : t.push(l)
          return t
        }),
        Y = d(''),
        ge = () => {
          if (!W.value) return
          const t = new Date(W.value).getTime(),
            n = new Date().getTime() - t
          if (n < 0) {
            Y.value = 'Not started yet!'
            return
          }
          const m = Math.floor(n / (1e3 * 60 * 60 * 24)),
            l = Math.floor((n % (1e3 * 60 * 60 * 24)) / (1e3 * 60 * 60)),
            c = Math.floor((n % (1e3 * 60 * 60)) / (1e3 * 60)),
            v = Math.floor((n % (1e3 * 60)) / 1e3)
          Y.value = `${m}d ${l}h ${c}m ${v}s`
        },
        P = (t) => {
          const e = o.preferences.cardColors || {},
            n = t.type === 'start_date' ? 'start_date' : `${t.type}_${t.id}`
          if (e[n]) return e[n]
          switch (t.type) {
            case 'birthday':
              return '#2C82E0'
            case 'anniversary':
              return '#EF476F'
            case 'start_date':
              return '#3D9209'
            default:
              return '#2C82E0'
          }
        },
        U = async () => {
          try {
            const t = await _.getAll()
            O.value = t
            const e = t.find((n) => n.type === 'start_date')
            e && ((k.value = e.date), (V.value = e.id), (x.value = P(e)))
          } catch (t) {
            console.error(t)
          }
        },
        ye = async () => {
          try {
            const t = await Ge.getAll(),
              e = o.preferences.carouselLimit || 5
            Z.value = t
              .filter((n) => n.imageUrl)
              .sort(() => 0.5 - Math.random())
              .slice(0, e)
          } catch (t) {
            console.error(t)
          }
        },
        he = async () => {
          try {
            const t = await Re.getAll()
            if (t.length > 0) {
              const e = o.preferences.noteLimit || 1
              ee.value = [...t].reverse().slice(0, e)
            }
          } catch (t) {
            console.error(t)
          }
        },
        be = () => {
          ;((b.value = null),
            (s.value = { title: '', date: new Date(), description: '', type: 'other', color: we() }),
            (A.value = !0))
        },
        xe = (t) => {
          if (t.type === 'start_date') {
            ke(t)
            return
          }
          b.value = t.id
          const e = Number(t.userId) === Number(o.id)
          ;(t.type === 'birthday' && !e
            ? (s.value = {
                title: t.title,
                date: new Date(t.date),
                description: t.description || '',
                type: t.type,
                color: P(t),
              })
            : (s.value = {
                title: t.title,
                date: new Date(t.date),
                description: t.description || '',
                type: t.type,
                color: P(t),
              }),
            (A.value = !0))
        },
        we = () => F[Math.floor(Math.random() * F.length)],
        _e = (t) => {
          if (!t) return ''
          const e = new Date(t),
            n = e.getFullYear(),
            m = String(e.getMonth() + 1).padStart(2, '0'),
            l = String(e.getDate()).padStart(2, '0')
          return `${n}-${m}-${l}`
        },
        oe = (t) => {
          if (!t) return ''
          const e = new Date(t),
            n = e.getFullYear(),
            m = String(e.getMonth() + 1).padStart(2, '0'),
            l = String(e.getDate()).padStart(2, '0'),
            c = String(e.getHours()).padStart(2, '0'),
            v = String(e.getMinutes()).padStart(2, '0'),
            y = String(e.getSeconds()).padStart(2, '0')
          return `${n}-${m}-${l}T${c}:${v}:${y}`
        },
        Ce = async () => {
          if (!s.value.title && s.value.type !== 'birthday') {
            f({ message: 'Please enter a title', color: 'warning' })
            return
          }
          if (!s.value.date) {
            f({ message: 'Please select a date', color: 'warning' })
            return
          }
          try {
            const t = { ...s.value, date: _e(s.value.date) },
              e = b.value ? O.value.find((l) => l.id === b.value) : null,
              n = e ? Number(e.userId) === Number(o.id) : !0,
              m = s.value.type === 'birthday' && !n
            if (b.value) {
              const l = s.value.type === 'start_date' ? 'start_date' : `${s.value.type}_${b.value}`,
                c = { ...(o.preferences.cardColors || {}) }
              if (((c[l] = s.value.color), o.updatePreferences({ cardColors: c }), !m)) {
                const v = { ...t }
                ;(delete v.color, await _.update(b.value, v))
              }
              f({ message: 'Updated successfully!', color: 'success' })
            } else {
              const l = { ...t }
              delete l.color
              const c = await _.create(l)
              if (c && c.id) {
                const v = { ...(o.preferences.cardColors || {}) },
                  y = `${s.value.type}_${c.id}`
                ;((v[y] = s.value.color), o.updatePreferences({ cardColors: v }))
              }
              f({ message: 'Added successfully!', color: 'success' })
            }
            ;((A.value = !1), await U())
          } catch {
            f({ message: 'Failed to save', color: 'danger' })
          }
        },
        ke = (t) => {
          ;((H.value = !!t),
            t
              ? ((w.value = new Date(k.value)), (x.value = P(t)), (V.value = t.id))
              : ((w.value = new Date(k.value)), (x.value = P({ type: 'start_date' }))),
            ($.value = !0))
        },
        Ve = async () => {
          var t
          try {
            const e = oe(w.value),
              n = { ...(o.preferences.cardColors || {}) }
            ;((n.start_date = x.value), o.updatePreferences({ cardColors: n }))
            const m = {
              title: 'Start Date',
              date: e,
              type: 'start_date',
              description: 'The day we started our journey',
            }
            if (V.value) await _.update(V.value, m)
            else {
              const l = O.value.find((c) => c.type === 'start_date')
              l ? await _.update(l.id, m) : await _.create(m)
            }
            ;(($.value = !1), await U(), f({ message: 'Start date updated!', color: 'success' }))
          } catch (e) {
            if (V.value && (t = e.message) != null && t.includes('404'))
              try {
                ;(await _.create({
                  title: 'Start Date',
                  date: oe(w.value),
                  type: 'start_date',
                  description: 'The day we started our journey',
                }),
                  await U(),
                  ($.value = !1),
                  f({ message: 'Love start date re-created successfully!', color: 'success' }))
                return
              } catch (n) {
                console.error('Failed to re-create start date:', n)
              }
            f({ message: 'Failed to update start date', color: 'danger' })
          }
        },
        De = async (t) => {
          ;((K.value = t), (B.value = !0))
        },
        Te = async () => {
          if (K.value)
            try {
              ;(await _.delete(K.value), U(), f({ message: 'Special date deleted', color: 'success' }))
            } catch {
              f({ message: 'Failed to delete', color: 'danger' })
            }
          B.value = !1
        }
      return (
        We(() => {
          ;(U(), ye(), he(), setInterval(ge, 1e3))
        }),
        (t, e) => {
          const n = Ue,
            m = Ne,
            l = Le,
            c = Ee,
            v = Ie,
            y = Pe,
            se = Oe,
            le = Be,
            re = je,
            Se = ze
          return (
            p(),
            g('div', Je, [
              r('div', Qe, [
                r('div', Xe, [
                  u(
                    v,
                    {
                      class:
                        'mb-4 overflow-hidden min-h-[220px] md:min-h-[300px] flex flex-col justify-center relative border border-backgroundBorder',
                      gradient: '',
                      color: (i(C)(i(o).preferences.heroTheme), 'backgroundSecondary'),
                    },
                    {
                      default: S(() => [
                        r('div', Ze, [
                          u(n, {
                            icon: 'palette',
                            flat: '',
                            round: '',
                            size: 'small',
                            class: 'bg-white/20 hover:bg-white/40',
                            onClick: e[0] || (e[0] = (a) => ae('hero')),
                          }),
                        ]),
                        u(
                          c,
                          {
                            class: h(['relative z-10 p-4 md:p-8 text-center', me.value]),
                            style: J({ color: i(C)(i(o).preferences.heroTheme) ? '#f3f4f6' : '#111827' }),
                          },
                          {
                            default: S(() => {
                              var a, E, ne
                              return [
                                V.value
                                  ? (p(),
                                    g('div', et, [
                                      r(
                                        'h2',
                                        { class: h(['text-lg md:text-xl font-light mb-2 md:mb-4', z.value]) },
                                        " We've been loving each other for ",
                                        2,
                                      ),
                                      r(
                                        'div',
                                        {
                                          class: h([
                                            'timer text-3xl sm:text-4xl md:text-6xl font-bold tracking-wider mb-2 md:mb-4 break-words',
                                            pe.value,
                                          ]),
                                        },
                                        N(Y.value),
                                        3,
                                      ),
                                      r(
                                        'p',
                                        { class: h(['text-base md:text-lg mb-4 md:mb-6', te.value]) },
                                        ' Since ' + N(new Date(W.value).toLocaleDateString()),
                                        3,
                                      ),
                                    ]))
                                  : (p(),
                                    g('div', tt, [
                                      u(m, {
                                        name: 'favorite_border',
                                        size: '4rem',
                                        color: 'primary',
                                        class: 'mb-4 opacity-50',
                                      }),
                                      r(
                                        'h2',
                                        { class: h(['text-xl font-bold mb-2', z.value]) },
                                        'When did your story begin?',
                                        2,
                                      ),
                                      r(
                                        'p',
                                        { class: h(['mb-6 max-w-sm mx-auto', te.value]) },
                                        ' Set your relationship start date to start counting the days of your love journey. ',
                                        2,
                                      ),
                                      u(
                                        n,
                                        {
                                          icon: 'settings',
                                          onClick: e[1] || (e[1] = (wt) => i(ce).push({ name: 'love-settings' })),
                                        },
                                        { default: S(() => e[16] || (e[16] = [qe('Set Start Date')])), _: 1 },
                                      ),
                                    ])),
                                r('div', at, [
                                  r('div', ot, [
                                    u(
                                      l,
                                      { size: 'large', src: i(o).pfp, class: 'w-12 h-12 md:w-16 md:h-16' },
                                      null,
                                      8,
                                      ['src'],
                                    ),
                                    r(
                                      'span',
                                      { class: h(['text-xs md:text-sm font-bold mt-2', z.value]) },
                                      N(i(o).displayName || i(o).userName),
                                      3,
                                    ),
                                  ]),
                                  e[17] ||
                                    (e[17] = r(
                                      'div',
                                      { class: 'heart-beat text-3xl md:text-4xl text-red-500 self-center' },
                                      '❤️',
                                      -1,
                                    )),
                                  r('div', st, [
                                    u(
                                      l,
                                      {
                                        size: 'large',
                                        src: (a = i(o).partner) == null ? void 0 : a.avatarUrl,
                                        class: 'w-12 h-12 md:w-16 md:h-16',
                                      },
                                      null,
                                      8,
                                      ['src'],
                                    ),
                                    r(
                                      'span',
                                      { class: h(['text-xs md:text-sm font-bold mt-2', z.value]) },
                                      N(
                                        ((E = i(o).partner) == null ? void 0 : E.displayName) ||
                                          ((ne = i(o).partner) == null ? void 0 : ne.username) ||
                                          'Partner',
                                      ),
                                      3,
                                    ),
                                  ]),
                                ]),
                              ]
                            }),
                            _: 1,
                          },
                          8,
                          ['class', 'style'],
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    ['color'],
                  ),
                  (p(!0),
                  g(
                    R,
                    null,
                    G(
                      i(o).preferences.dashboardOrder,
                      (a) => (
                        p(),
                        g(
                          R,
                          { key: a },
                          [
                            a === 'dates'
                              ? (p(),
                                Q(
                                  i(de),
                                  { key: 0, anniversaries: fe.value, onAdd: be, onEdit: xe, onDelete: De },
                                  null,
                                  8,
                                  ['anniversaries'],
                                ))
                              : L('', !0),
                            a === 'memories'
                              ? (p(), Q(i(ue), { key: 1, images: Z.value }, null, 8, ['images']))
                              : L('', !0),
                            a === 'notes'
                              ? (p(),
                                Q(
                                  i(ie),
                                  { key: 2, messages: ee.value, onOpenTheme: e[2] || (e[2] = (E) => ae('note')) },
                                  null,
                                  8,
                                  ['messages'],
                                ))
                              : L('', !0),
                          ],
                          64,
                        )
                      ),
                    ),
                    128,
                  )),
                ]),
              ]),
              u(
                y,
                {
                  modelValue: B.value,
                  'onUpdate:modelValue': e[3] || (e[3] = (a) => (B.value = a)),
                  title: 'Delete Special Date?',
                  message: 'Are you sure you want to remove this date? This cannot be undone.',
                  'ok-text': 'Yes, delete it',
                  'cancel-text': 'Cancel',
                  onOk: Te,
                },
                null,
                8,
                ['modelValue'],
              ),
              u(
                y,
                {
                  modelValue: A.value,
                  'onUpdate:modelValue': e[8] || (e[8] = (a) => (A.value = a)),
                  title: b.value ? 'Edit Special Date' : 'Add Special Date',
                  'ok-text': 'Save Date',
                  'cancel-text': 'Cancel',
                  onOk: Ce,
                },
                {
                  default: S(() => [
                    r('div', lt, [
                      s.value.type !== 'birthday'
                        ? (p(),
                          g('div', rt, [
                            u(
                              se,
                              {
                                modelValue: s.value.title,
                                'onUpdate:modelValue': e[4] || (e[4] = (a) => (s.value.title = a)),
                                label: 'Title',
                                placeholder: 'e.g. First Date',
                                disabled: s.value.type === 'start_date',
                                class: 'w-full',
                              },
                              null,
                              8,
                              ['modelValue', 'disabled'],
                            ),
                            u(
                              le,
                              {
                                modelValue: s.value.date,
                                'onUpdate:modelValue': e[5] || (e[5] = (a) => (s.value.date = a)),
                                label: 'Date',
                                clearable: s.value.type !== 'start_date',
                                disabled: s.value.type === 'start_date',
                                class: 'w-full',
                              },
                              null,
                              8,
                              ['modelValue', 'clearable', 'disabled'],
                            ),
                            u(
                              se,
                              {
                                modelValue: s.value.description,
                                'onUpdate:modelValue': e[6] || (e[6] = (a) => (s.value.description = a)),
                                label: 'Description (Optional)',
                                type: 'textarea',
                                rows: 3,
                                placeholder: 'Write a sweet note...',
                                disabled: s.value.type === 'start_date',
                                class: 'w-full',
                              },
                              null,
                              8,
                              ['modelValue', 'disabled'],
                            ),
                          ]))
                        : L('', !0),
                      r('div', nt, [
                        e[19] ||
                          (e[19] = r(
                            'label',
                            {
                              class:
                                'va-title mb-3 block text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider',
                            },
                            'Card Theme Color',
                            -1,
                          )),
                        r('div', dt, [
                          (p(!0),
                          g(
                            R,
                            null,
                            G(
                              i(F),
                              (a) => (
                                p(),
                                g(
                                  'div',
                                  {
                                    key: a,
                                    class: h([
                                      'w-9 h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 border-2 shadow-sm',
                                      s.value.color === a
                                        ? 'border-gray-800 dark:border-white scale-110 ring-2 ring-gray-200 dark:ring-slate-600 ring-offset-1 dark:ring-offset-slate-800'
                                        : 'border-white dark:border-slate-700 opacity-80 hover:opacity-100',
                                    ]),
                                    style: J({ backgroundColor: a }),
                                    onClick: (E) => (s.value.color = a),
                                  },
                                  null,
                                  14,
                                  ut,
                                )
                              ),
                            ),
                            128,
                          )),
                        ]),
                        r('div', it, [
                          e[18] ||
                            (e[18] = r(
                              'span',
                              { class: 'text-sm font-medium text-gray-500 dark:text-gray-400' },
                              'Custom Color:',
                              -1,
                            )),
                          u(
                            re,
                            {
                              modelValue: s.value.color,
                              'onUpdate:modelValue': e[7] || (e[7] = (a) => (s.value.color = a)),
                            },
                            null,
                            8,
                            ['modelValue'],
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                  _: 1,
                },
                8,
                ['modelValue', 'title'],
              ),
              u(
                y,
                {
                  modelValue: $.value,
                  'onUpdate:modelValue': e[12] || (e[12] = (a) => ($.value = a)),
                  title: 'Customize Start Date',
                  'ok-text': 'Update',
                  'cancel-text': 'Cancel',
                  onOk: Ve,
                },
                {
                  default: S(() => [
                    r('div', ct, [
                      r(
                        'p',
                        mt,
                        N(
                          H.value
                            ? 'Update the color of your relationship milestone.'
                            : 'Set the day your love story began.',
                        ),
                        1,
                      ),
                      H.value
                        ? L('', !0)
                        : (p(),
                          g('div', pt, [
                            u(
                              le,
                              {
                                modelValue: w.value,
                                'onUpdate:modelValue': e[9] || (e[9] = (a) => (w.value = a)),
                                label: 'Date',
                                class: 'w-full',
                              },
                              null,
                              8,
                              ['modelValue'],
                            ),
                            u(
                              Se,
                              {
                                modelValue: w.value,
                                'onUpdate:modelValue': e[10] || (e[10] = (a) => (w.value = a)),
                                label: 'Time',
                                class: 'w-full',
                              },
                              null,
                              8,
                              ['modelValue'],
                            ),
                          ])),
                      r('div', vt, [
                        e[21] ||
                          (e[21] = r(
                            'label',
                            {
                              class:
                                'va-title mb-3 block text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider',
                            },
                            'Card Theme Color',
                            -1,
                          )),
                        r('div', ft, [
                          (p(!0),
                          g(
                            R,
                            null,
                            G(
                              i(F),
                              (a) => (
                                p(),
                                g(
                                  'div',
                                  {
                                    key: a,
                                    class: h([
                                      'w-9 h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 border-2 shadow-sm',
                                      x.value === a
                                        ? 'border-gray-800 dark:border-white scale-110 ring-2 ring-gray-200 dark:ring-slate-600 ring-offset-1 dark:ring-offset-slate-800'
                                        : 'border-white dark:border-slate-700 opacity-80 hover:opacity-100',
                                    ]),
                                    style: J({ backgroundColor: a }),
                                    onClick: (E) => (x.value = a),
                                  },
                                  null,
                                  14,
                                  gt,
                                )
                              ),
                            ),
                            128,
                          )),
                        ]),
                        r('div', yt, [
                          e[20] ||
                            (e[20] = r(
                              'span',
                              { class: 'text-sm font-medium text-gray-500 dark:text-gray-400' },
                              'Custom Color:',
                              -1,
                            )),
                          u(
                            re,
                            { modelValue: x.value, 'onUpdate:modelValue': e[11] || (e[11] = (a) => (x.value = a)) },
                            null,
                            8,
                            ['modelValue'],
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                  _: 1,
                },
                8,
                ['modelValue'],
              ),
              u(
                y,
                {
                  modelValue: j.value,
                  'onUpdate:modelValue': e[15] || (e[15] = (a) => (j.value = a)),
                  title: M.value === 'hero' ? 'Customize Hero Theme' : 'Customize Love Notes Theme',
                  'ok-text': 'Save Changes',
                  'max-width': '600px',
                  onOk: ve,
                },
                {
                  default: S(() => [
                    r('div', ht, [
                      u(
                        He,
                        {
                          modelValue: D.value,
                          'onUpdate:modelValue': e[13] || (e[13] = (a) => (D.value = a)),
                          'color-value': I.value,
                          'onUpdate:colorValue': e[14] || (e[14] = (a) => (I.value = a)),
                          'show-colors': M.value === 'note',
                          'pattern-label': M.value === 'hero' ? 'Hero Background Pattern' : 'Notes Background Pattern',
                          'color-label': 'Note Card Color',
                        },
                        null,
                        8,
                        ['modelValue', 'color-value', 'show-colors', 'pattern-label'],
                      ),
                    ]),
                  ]),
                  _: 1,
                },
                8,
                ['modelValue', 'title'],
              ),
            ])
          )
        }
      )
    },
  }),
  At = $e(bt, [['__scopeId', 'data-v-aad403b0']])
export { At as default }
//# sourceMappingURL=LoveDashboard-BMglu6Ui.js.map

import {
  x as ee,
  h as te,
  y as se,
  A as ae,
  j as oe,
  B as le,
  C as re,
  E as ne,
  P as de,
  Q as ie,
} from './vuestic-ui-hYeKHxJy.js'
import { u as ce, a as ue } from './index-D_419K7i.js'
import { a as A } from './anniversary.service-D50iqdsx.js'
import {
  k as me,
  a as b,
  r as c,
  G as pe,
  q as I,
  C as e,
  d,
  L as s,
  w as r,
  o as U,
  u as C,
  v,
  F as fe,
  D as ve,
  x as T,
} from './vue-vendor-CS4KimFI.js'
import './vendor-Qzk3SZgC.js'
const ye = { class: 'love-settings p-4 md:p-8 max-w-4xl mx-auto' },
  ge = { class: 'mb-10 text-center md:text-left' },
  _e = { class: 'space-y-8' },
  he = { class: 'flex items-center gap-2 mb-4' },
  be = { class: 'flex flex-col sm:flex-row gap-4' },
  xe = { class: 'flex items-center gap-2 mb-4' },
  we = { class: 'grid grid-cols-1 md:grid-cols-2 gap-6 items-end' },
  Ve = { class: 'mt-6 flex justify-end' },
  Se = { class: 'flex items-center gap-2 mb-4' },
  ke = { class: 'grid grid-cols-1 md:grid-cols-2 gap-6 items-end' },
  Ce = { class: 'mt-6 flex justify-end' },
  De = { class: 'flex items-center gap-2 mb-4' },
  Ne = { class: 'space-y-2' },
  je = { class: 'flex items-center gap-3' },
  ze = { class: 'flex items-center gap-1' },
  Le = { class: 'mt-6 flex justify-end' },
  Ae = { class: 'flex items-center gap-2 mb-4' },
  Ie = { class: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
  Ue = { class: 'flex items-center gap-2 mb-4' },
  Te = { class: 'space-y-6' },
  Be = { class: 'flex justify-between items-center mb-2' },
  Pe = { class: 'text-sm font-bold text-primary' },
  $e = { class: 'flex justify-end' },
  Me = { class: 'flex items-center gap-2 mb-4' },
  Oe = { class: 'space-y-6' },
  Ee = { class: 'flex justify-between items-center mb-2' },
  Fe = { class: 'text-sm font-bold text-primary' },
  Re = { class: 'flex flex-wrap gap-x-6 gap-y-3' },
  Je = { class: 'flex justify-end' },
  qe = me({
    __name: 'LoveSettings',
    setup(Ge) {
      const a = ce(),
        { init: f } = ee(),
        F = b(() => ({ color: a.preferences.theme === 'dark' ? '#f3f4f6' : '#111827' })),
        y = b(() => ({ color: a.preferences.theme === 'dark' ? '#94a3b8' : '#4b5563' })),
        u = b(() => ({ color: a.preferences.theme === 'dark' ? '#e2e8f0' : '#1f2937' })),
        R = b(() => ({
          backgroundColor: a.preferences.theme === 'dark' ? '#1e293b' : '#ffffff',
          borderColor: a.preferences.theme === 'dark' ? '#334155' : '#e5e7eb',
        })),
        J = b(() => ({
          backgroundColor: a.preferences.theme === 'dark' ? '#334155' : '#f3f4f6',
          color: a.preferences.theme === 'dark' ? '#94a3b8' : '#4b5563',
        })),
        _ = c([...a.preferences.dashboardOrder]),
        B = [
          { id: 'dates', name: 'Upcoming Dates', icon: 'event' },
          { id: 'memories', name: 'Sweet Memories', icon: 'photo_library' },
          { id: 'notes', name: 'Love Notes', icon: 'edit_note' },
        ],
        P = (n, t) => {
          const l = [..._.value],
            i = t === 'up' ? n - 1 : n + 1
          i >= 0 && i < l.length && (([l[n], l[i]] = [l[i], l[n]]), (_.value = l))
        },
        q = () => {
          ;(a.updatePreferences({ dashboardOrder: _.value }),
            f({ message: 'Dashboard layout updated!', color: 'success' }))
        },
        D = c(a.preferences.appName || 'Our Love Journey'),
        N = c(a.preferences.appEmoji || '❤️'),
        g = c(new Date()),
        x = c(null),
        j = c(!1),
        w = c(a.preferences.carouselLimit || 5),
        V = c(a.preferences.noteLimit || 1),
        z = c(a.preferences.showNoteDate !== !1),
        L = c(a.preferences.showNoteAuthor !== !1),
        G = async () => {
          try {
            const t = (await A.getAll()).find((l) => l.type === 'start_date')
            t && ((g.value = new Date(t.date)), (x.value = t.id))
          } catch (n) {
            console.error(n)
          }
        },
        H = (n) => {
          const t = n.getFullYear(),
            l = String(n.getMonth() + 1).padStart(2, '0'),
            i = String(n.getDate()).padStart(2, '0'),
            m = String(n.getHours()).padStart(2, '0'),
            p = String(n.getMinutes()).padStart(2, '0'),
            S = String(n.getSeconds()).padStart(2, '0')
          return `${t}-${l}-${i}T${m}:${p}:${S}`
        },
        Q = () => {
          ;(a.updatePreferences({ appName: D.value, appEmoji: N.value }),
            f({ message: 'App identity updated!', color: 'success' }))
        },
        Y = async () => {
          j.value = !0
          const n = {
            title: 'Start Date',
            date: H(g.value),
            type: 'start_date',
            description: 'The day we started our journey',
          }
          try {
            if (x.value)
              (await A.update(x.value, n), f({ message: 'Relationship start date updated!', color: 'success' }))
            else {
              const t = await A.create(n)
              ;((x.value = t.id), f({ message: 'Relationship start date set!', color: 'success' }))
            }
          } catch {
            f({ message: 'Failed to update date', color: 'danger' })
          } finally {
            j.value = !1
          }
        },
        K = () => {
          ;(a.updatePreferences({ carouselLimit: w.value }),
            f({ message: 'Carousel settings saved!', color: 'success' }))
        },
        W = () => {
          ;(a.updatePreferences({ noteLimit: V.value, showNoteDate: z.value, showNoteAuthor: L.value }),
            f({ message: 'Display options saved!', color: 'success' }))
        }
      return (
        pe(() => {
          G()
        }),
        (n, t) => {
          const l = te,
            i = oe,
            m = ae,
            p = se,
            S = le,
            X = re,
            Z = ne,
            $ = de,
            M = ie
          return (
            U(),
            I('div', ye, [
              e('header', ge, [
                e(
                  'h1',
                  { class: 'text-3xl md:text-4xl font-extrabold tracking-tight mb-2', style: d(F.value) },
                  ' Settings ',
                  4,
                ),
                e('p', { class: 'text-lg', style: d(y.value) }, 'Personalize your love journey experience', 4),
              ]),
              e('div', _e, [
                e('section', null, [
                  e('div', he, [
                    s(l, { name: 'palette', color: 'primary', size: '20px' }),
                    e('h2', { class: 'text-xl font-bold', style: d(u.value) }, 'Appearance', 4),
                  ]),
                  s(
                    p,
                    { class: 'overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm' },
                    {
                      default: r(() => [
                        s(
                          m,
                          { class: 'p-6' },
                          {
                            default: r(() => [
                              e(
                                'p',
                                { class: 'text-sm mb-6', style: d(y.value) },
                                'Choose how the application looks to you.',
                                4,
                              ),
                              e('div', be, [
                                s(
                                  i,
                                  {
                                    preset: C(a).preferences.theme === 'light' ? 'primary' : 'secondary',
                                    icon: 'light_mode',
                                    class: 'flex-1',
                                    onClick: t[0] || (t[0] = (o) => C(a).updatePreferences({ theme: 'light' })),
                                  },
                                  { default: r(() => t[10] || (t[10] = [v(' Light Mode ')])), _: 1 },
                                  8,
                                  ['preset'],
                                ),
                                s(
                                  i,
                                  {
                                    preset: C(a).preferences.theme === 'dark' ? 'primary' : 'secondary',
                                    icon: 'dark_mode',
                                    class: 'flex-1',
                                    onClick: t[1] || (t[1] = (o) => C(a).updatePreferences({ theme: 'dark' })),
                                  },
                                  { default: r(() => t[11] || (t[11] = [v(' Dark Mode ')])), _: 1 },
                                  8,
                                  ['preset'],
                                ),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                e('section', null, [
                  e('div', xe, [
                    s(l, { name: 'branding_watermark', color: 'primary', size: '20px' }),
                    e('h2', { class: 'text-xl font-bold', style: d(u.value) }, 'App Branding', 4),
                  ]),
                  s(
                    p,
                    { class: 'overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm' },
                    {
                      default: r(() => [
                        s(
                          m,
                          { class: 'p-6' },
                          {
                            default: r(() => [
                              e('div', we, [
                                s(
                                  S,
                                  {
                                    modelValue: N.value,
                                    'onUpdate:modelValue': t[2] || (t[2] = (o) => (N.value = o)),
                                    label: 'App Icon (Emoji)',
                                    placeholder: 'e.g. ❤️',
                                    class: 'w-full',
                                  },
                                  null,
                                  8,
                                  ['modelValue'],
                                ),
                                s(
                                  S,
                                  {
                                    modelValue: D.value,
                                    'onUpdate:modelValue': t[3] || (t[3] = (o) => (D.value = o)),
                                    label: 'App Display Name',
                                    placeholder: 'e.g. Our Love Journey',
                                    class: 'w-full',
                                  },
                                  null,
                                  8,
                                  ['modelValue'],
                                ),
                              ]),
                              e('div', Ve, [
                                s(
                                  i,
                                  { icon: 'save', onClick: Q },
                                  { default: r(() => t[12] || (t[12] = [v('Update Branding')])), _: 1 },
                                ),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                e('section', null, [
                  e('div', Se, [
                    s(l, { name: 'favorite', color: 'primary', size: '20px' }),
                    e('h2', { class: 'text-xl font-bold', style: d(u.value) }, 'Relationship Milestone', 4),
                  ]),
                  s(
                    p,
                    { class: 'overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm' },
                    {
                      default: r(() => [
                        s(
                          m,
                          { class: 'p-6' },
                          {
                            default: r(() => [
                              e(
                                'p',
                                { class: 'text-sm mb-6', style: d(y.value) },
                                'The day you two started this beautiful journey together.',
                                4,
                              ),
                              e('div', ke, [
                                s(
                                  X,
                                  {
                                    modelValue: g.value,
                                    'onUpdate:modelValue': t[4] || (t[4] = (o) => (g.value = o)),
                                    label: 'Anniversary Date',
                                    class: 'w-full',
                                  },
                                  null,
                                  8,
                                  ['modelValue'],
                                ),
                                s(
                                  Z,
                                  {
                                    modelValue: g.value,
                                    'onUpdate:modelValue': t[5] || (t[5] = (o) => (g.value = o)),
                                    label: 'Exact Time',
                                    class: 'w-full',
                                  },
                                  null,
                                  8,
                                  ['modelValue'],
                                ),
                              ]),
                              e('div', Ce, [
                                s(
                                  i,
                                  { icon: 'calendar_today', loading: j.value, onClick: Y },
                                  { default: r(() => t[13] || (t[13] = [v('Update Start Date')])), _: 1 },
                                  8,
                                  ['loading'],
                                ),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                e('section', null, [
                  e('div', De, [
                    s(l, { name: 'dashboard', color: 'primary', size: '20px' }),
                    e('h2', { class: 'text-xl font-bold', style: d(u.value) }, 'Dashboard Layout', 4),
                  ]),
                  s(
                    p,
                    { class: 'overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm' },
                    {
                      default: r(() => [
                        s(
                          m,
                          { class: 'p-6' },
                          {
                            default: r(() => [
                              e(
                                'p',
                                { class: 'text-sm mb-6', style: d(y.value) },
                                'Arrange the sections of your dashboard in your preferred order.',
                                4,
                              ),
                              e('div', Ne, [
                                (U(!0),
                                I(
                                  fe,
                                  null,
                                  ve(_.value, (o, k) => {
                                    var O, E
                                    return (
                                      U(),
                                      I(
                                        'div',
                                        {
                                          key: o,
                                          class:
                                            'flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-opacity-80 group',
                                          style: d(R.value),
                                        },
                                        [
                                          e('div', je, [
                                            e(
                                              'div',
                                              {
                                                class:
                                                  'w-8 h-8 flex items-center justify-center rounded shadow-sm group-hover:text-primary transition-colors',
                                                style: d(J.value),
                                              },
                                              [
                                                s(
                                                  l,
                                                  {
                                                    name: (O = B.find((h) => h.id === o)) == null ? void 0 : O.icon,
                                                    size: '18px',
                                                  },
                                                  null,
                                                  8,
                                                  ['name'],
                                                ),
                                              ],
                                              4,
                                            ),
                                            e(
                                              'span',
                                              { class: 'font-semibold text-sm', style: d(u.value) },
                                              T((E = B.find((h) => h.id === o)) == null ? void 0 : E.name),
                                              5,
                                            ),
                                          ]),
                                          e('div', ze, [
                                            s(
                                              i,
                                              {
                                                icon: 'keyboard_arrow_up',
                                                flat: '',
                                                size: 'small',
                                                color: 'primary',
                                                disabled: k === 0,
                                                onClick: (h) => P(k, 'up'),
                                              },
                                              null,
                                              8,
                                              ['disabled', 'onClick'],
                                            ),
                                            s(
                                              i,
                                              {
                                                icon: 'keyboard_arrow_down',
                                                flat: '',
                                                size: 'small',
                                                color: 'primary',
                                                disabled: k === _.value.length - 1,
                                                onClick: (h) => P(k, 'down'),
                                              },
                                              null,
                                              8,
                                              ['disabled', 'onClick'],
                                            ),
                                          ]),
                                        ],
                                        4,
                                      )
                                    )
                                  }),
                                  128,
                                )),
                              ]),
                              e('div', Le, [
                                s(
                                  i,
                                  { icon: 'sort', onClick: q },
                                  { default: r(() => t[14] || (t[14] = [v('Apply New Order')])), _: 1 },
                                ),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                e('section', null, [
                  e('div', Ae, [
                    s(l, { name: 'tune', color: 'primary', size: '20px' }),
                    e('h2', { class: 'text-xl font-bold', style: d(u.value) }, 'Content Preferences', 4),
                  ]),
                  e('div', Ie, [
                    s(
                      p,
                      { class: 'overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm' },
                      {
                        default: r(() => [
                          s(
                            m,
                            { class: 'p-6' },
                            {
                              default: r(() => [
                                e('div', Ue, [
                                  s(l, { name: 'photo_library', size: '18px' }),
                                  e('h3', { class: 'font-bold', style: d(u.value) }, 'Memories Carousel', 4),
                                ]),
                                e('div', Te, [
                                  e('div', null, [
                                    e('div', Be, [
                                      e('span', { class: 'text-sm', style: d(y.value) }, 'Photos count', 4),
                                      e('span', Pe, T(w.value), 1),
                                    ]),
                                    s(
                                      $,
                                      {
                                        modelValue: w.value,
                                        'onUpdate:modelValue': t[6] || (t[6] = (o) => (w.value = o)),
                                        min: 3,
                                        max: 15,
                                        step: 1,
                                      },
                                      null,
                                      8,
                                      ['modelValue'],
                                    ),
                                  ]),
                                  e('div', $e, [
                                    s(
                                      i,
                                      { size: 'small', preset: 'secondary', onClick: K },
                                      { default: r(() => t[15] || (t[15] = [v('Save Carousel')])), _: 1 },
                                    ),
                                  ]),
                                ]),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                    s(
                      p,
                      { class: 'overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm' },
                      {
                        default: r(() => [
                          s(
                            m,
                            { class: 'p-6' },
                            {
                              default: r(() => [
                                e('div', Me, [
                                  s(l, { name: 'edit_note', size: '18px' }),
                                  e('h3', { class: 'font-bold', style: d(u.value) }, 'Love Notes', 4),
                                ]),
                                e('div', Oe, [
                                  e('div', null, [
                                    e('div', Ee, [
                                      e('span', { class: 'text-sm', style: d(y.value) }, 'Max notes shown', 4),
                                      e('span', Fe, T(V.value), 1),
                                    ]),
                                    s(
                                      $,
                                      {
                                        modelValue: V.value,
                                        'onUpdate:modelValue': t[7] || (t[7] = (o) => (V.value = o)),
                                        min: 1,
                                        max: 10,
                                        step: 1,
                                      },
                                      null,
                                      8,
                                      ['modelValue'],
                                    ),
                                  ]),
                                  e('div', Re, [
                                    s(
                                      M,
                                      {
                                        modelValue: z.value,
                                        'onUpdate:modelValue': t[8] || (t[8] = (o) => (z.value = o)),
                                        label: 'Show Date',
                                        size: 'small',
                                      },
                                      null,
                                      8,
                                      ['modelValue'],
                                    ),
                                    s(
                                      M,
                                      {
                                        modelValue: L.value,
                                        'onUpdate:modelValue': t[9] || (t[9] = (o) => (L.value = o)),
                                        label: 'Show Author',
                                        size: 'small',
                                      },
                                      null,
                                      8,
                                      ['modelValue'],
                                    ),
                                  ]),
                                  e('div', Je, [
                                    s(
                                      i,
                                      { size: 'small', preset: 'secondary', onClick: W },
                                      { default: r(() => t[16] || (t[16] = [v('Save Notes')])), _: 1 },
                                    ),
                                  ]),
                                ]),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                ]),
              ]),
            ])
          )
        }
      )
    },
  }),
  Xe = ue(qe, [['__scopeId', 'data-v-786001c6']])
export { Xe as default }
//# sourceMappingURL=LoveSettings-DegUIPPK.js.map

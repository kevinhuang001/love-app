import {
  x as K,
  h as W,
  y as H,
  z as J,
  A as Q,
  k as X,
  B as Z,
  C as ee,
  K as ae,
  j as te,
} from './vuestic-ui-hYeKHxJy.js'
import {
  k as se,
  a as C,
  r as d,
  G as oe,
  q as p,
  C as a,
  L as s,
  d as u,
  w as i,
  u as c,
  o as m,
  t as le,
  x,
  v as I,
  W as re,
  ae as ne,
} from './vue-vendor-CS4KimFI.js'
import { u as de } from './index-D_419K7i.js'
import { a as ie } from './anniversary.service-D50iqdsx.js'
import { p as ce } from './pairing.service-D6zThsnd.js'
import './vendor-Qzk3SZgC.js'
const ue = { class: 'love-profile p-4 md:p-8 max-w-4xl mx-auto' },
  pe = { class: 'mb-10 text-center md:text-left' },
  me = { class: 'space-y-8' },
  fe = { class: 'flex items-center gap-2 mb-4' },
  ve = { class: 'flex flex-col md:flex-row gap-10 items-center md:items-start' },
  ye = {
    class:
      'w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-2xl relative',
  },
  ge = {
    class:
      'absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300',
  },
  xe = { class: 'flex-grow w-full space-y-6' },
  he = { class: 'grid grid-cols-1 sm:grid-cols-2 gap-6' },
  be = { key: 0, class: 'space-y-2' },
  ke = { class: 'flex justify-between text-xs font-bold text-primary' },
  _e = { class: 'pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-slate-800' },
  we = { key: 0 },
  Ve = { class: 'flex items-center gap-2 mb-4' },
  Ce = { class: 'flex flex-col md:flex-row items-center gap-8' },
  Ne = { class: 'w-24 h-24 rounded-full overflow-hidden ring-4 ring-pink-100 dark:ring-pink-900/30 shadow-lg' },
  De = { class: 'flex-grow text-center md:text-left' },
  Se = {
    class:
      'inline-flex items-center gap-2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-pink-100 dark:border-pink-900/30 text-pink-600 dark:text-pink-400 px-5 py-2 rounded-2xl text-sm font-bold shadow-sm',
  },
  Ue = { key: 0 },
  Pe = { key: 1 },
  Ae = { class: 'shrink-0' },
  Ie = { key: 1 },
  ze = { class: 'flex items-center gap-2 mb-4' },
  Be = { class: 'py-4 space-y-4' },
  Me = { class: 'space-y-2' },
  Te = {
    class:
      'block p-3 bg-gray-100 dark:bg-slate-700 rounded-lg text-red-600 dark:text-red-400 font-black text-center select-all',
  },
  Ye = se({
    __name: 'LoveProfile',
    setup(Fe) {
      const t = de(),
        z = ne(),
        { init: h } = K(),
        B = C(() => ({ color: t.preferences.theme === 'dark' ? '#f3f4f6' : '#111827' })),
        N = C(() => ({ color: t.preferences.theme === 'dark' ? '#94a3b8' : '#4b5563' })),
        D = C(() => ({ color: t.preferences.theme === 'dark' ? '#e2e8f0' : '#1f2937' })),
        b = d(''),
        M = d(null),
        f = d(null),
        S = d(''),
        v = d(null),
        $ = d(null),
        k = d(!1),
        _ = d(''),
        T = C(() => {
          var l, r
          const o = t.displayName || t.userName,
            e =
              ((l = t.partner) == null ? void 0 : l.displayName) ||
              ((r = t.partner) == null ? void 0 : r.username) ||
              '对方'
          return `${o}和${e}解除关系`
        }),
        L = async () => {
          try {
            ;(await ce.unpair(),
              await t.checkAuth(),
              h({ message: '关系已解除，共享数据已清空', color: 'success' }),
              z.push('/love/pairing'))
          } catch {
            h({ message: '解除关系失败', color: 'danger' })
          } finally {
            ;((k.value = !1), (_.value = ''))
          }
        }
      oe(async () => {
        ;(await t.checkAuth(), (b.value = t.displayName), await F())
      })
      const F = async () => {
          try {
            const e = (await ie.getAll()).find((l) => l.type === 'birthday' && l.userId === t.id)
            e && ((v.value = new Date(e.date)), ($.value = e.id))
          } catch (o) {
            console.error(o)
          }
        },
        j = () => {
          var o
          ;(o = M.value) == null || o.click()
        },
        R = (o) => {
          const e = o.target
          if (e.files && e.files.length > 0) {
            const l = e.files[0]
            f.value = l
            const r = new FileReader()
            ;((r.onload = (g) => {
              var V
              S.value = (V = g.target) == null ? void 0 : V.result
            }),
              r.readAsDataURL(l))
          }
        },
        y = d(!1),
        w = d(0),
        G = (o) => {
          if (!o) return ''
          const e = o.getFullYear(),
            l = String(o.getMonth() + 1).padStart(2, '0'),
            r = String(o.getDate()).padStart(2, '0')
          return `${e}-${l}-${r}`
        },
        O = async () => {
          const o = new FormData()
          ;(o.append('displayName', b.value),
            v.value && o.append('birthday', G(v.value)),
            f.value && o.append('avatar', f.value),
            (y.value = !0),
            (w.value = 0))
          try {
            ;(await t.updateProfile(o, (e) => {
              w.value = e
            }),
              await t.checkAuth(),
              await F(),
              f.value && ((f.value = null), (S.value = '')),
              h({ message: 'Profile updated!', color: 'success' }))
          } catch {
            h({ message: 'Failed to update profile', color: 'danger' })
          } finally {
            y.value = !1
          }
        },
        Y = () => {
          ;(t.logout(), z.push('/auth/login'))
        }
      return (o, e) => {
        const l = W,
          r = X,
          g = Z,
          V = ee,
          q = ae,
          U = te,
          P = Q,
          A = H,
          E = J
        return (
          m(),
          p('div', ue, [
            a('header', pe, [
              a(
                'h1',
                { class: 'text-3xl md:text-4xl font-extrabold tracking-tight mb-2', style: u(B.value) },
                ' Profile ',
                4,
              ),
              a('p', { class: 'text-lg', style: u(N.value) }, 'Manage your personal presence', 4),
            ]),
            a('div', me, [
              a('section', null, [
                a('div', fe, [
                  s(l, { name: 'account_circle', color: 'primary', size: '20px' }),
                  a('h2', { class: 'text-xl font-bold', style: u(D.value) }, 'My Presence', 4),
                ]),
                s(
                  A,
                  { class: 'overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm' },
                  {
                    default: i(() => [
                      s(
                        P,
                        { class: 'p-6 md:p-10' },
                        {
                          default: i(() => [
                            a('div', ve, [
                              a('div', { class: 'relative group cursor-pointer shrink-0', onClick: j }, [
                                a('div', ye, [
                                  s(
                                    r,
                                    {
                                      src: S.value || c(t).pfp,
                                      class: 'w-full h-full',
                                      style: { '--va-avatar-size': '100%' },
                                    },
                                    null,
                                    8,
                                    ['src'],
                                  ),
                                  a('div', ge, [
                                    s(l, { name: 'photo_camera', color: 'white', size: '32px' }),
                                    e[7] ||
                                      (e[7] = a(
                                        'span',
                                        { class: 'text-white text-xs mt-1 font-bold uppercase tracking-wider' },
                                        'Change',
                                        -1,
                                      )),
                                  ]),
                                ]),
                                a(
                                  'input',
                                  {
                                    ref_key: 'fileInput',
                                    ref: M,
                                    type: 'file',
                                    class: 'hidden',
                                    accept: 'image/*',
                                    onChange: R,
                                  },
                                  null,
                                  544,
                                ),
                              ]),
                              a('div', xe, [
                                a('div', he, [
                                  s(
                                    g,
                                    {
                                      modelValue: b.value,
                                      'onUpdate:modelValue': e[0] || (e[0] = (n) => (b.value = n)),
                                      label: 'Display Name',
                                      placeholder: 'Nickname',
                                      class: 'w-full',
                                    },
                                    null,
                                    8,
                                    ['modelValue'],
                                  ),
                                  s(
                                    g,
                                    {
                                      modelValue: c(t).userName,
                                      'onUpdate:modelValue': e[1] || (e[1] = (n) => (c(t).userName = n)),
                                      label: 'Username (Read-only)',
                                      readonly: '',
                                      class: 'w-full opacity-70',
                                    },
                                    null,
                                    8,
                                    ['modelValue'],
                                  ),
                                ]),
                                s(
                                  V,
                                  {
                                    modelValue: v.value,
                                    'onUpdate:modelValue': e[2] || (e[2] = (n) => (v.value = n)),
                                    label: 'My Birthday',
                                    clearable: '',
                                    class: 'w-full',
                                  },
                                  null,
                                  8,
                                  ['modelValue'],
                                ),
                                y.value
                                  ? (m(),
                                    p('div', be, [
                                      a('div', ke, [
                                        e[8] || (e[8] = a('span', null, 'UPLOADING IMAGE', -1)),
                                        a('span', null, x(w.value) + '%', 1),
                                      ]),
                                      s(q, { 'model-value': w.value }, null, 8, ['model-value']),
                                    ]))
                                  : le('', !0),
                                a('div', _e, [
                                  s(
                                    U,
                                    {
                                      preset: 'secondary',
                                      color: 'danger',
                                      disabled: y.value,
                                      onClick: Y,
                                      class: 'order-2 sm:order-1',
                                    },
                                    { default: i(() => e[9] || (e[9] = [I(' Sign Out ')])), _: 1 },
                                    8,
                                    ['disabled'],
                                  ),
                                  s(
                                    U,
                                    { loading: y.value, icon: 'check', onClick: O, class: 'order-1 sm:order-2' },
                                    { default: i(() => e[10] || (e[10] = [I(' Save Changes ')])), _: 1 },
                                    8,
                                    ['loading'],
                                  ),
                                ]),
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
              c(t).partner
                ? (m(),
                  p('section', we, [
                    a('div', Ve, [
                      s(l, { name: 'favorite', color: 'primary', size: '20px' }),
                      a('h2', { class: 'text-xl font-bold', style: u(D.value) }, 'Partner Connection', 4),
                    ]),
                    s(
                      A,
                      {
                        class:
                          'overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-pink-50/30 dark:from-slate-800 dark:to-pink-900/10',
                      },
                      {
                        default: i(() => [
                          s(
                            P,
                            { class: 'p-6 md:p-10' },
                            {
                              default: i(() => [
                                a('div', Ce, [
                                  a('div', Ne, [
                                    s(
                                      r,
                                      {
                                        src: c(t).partner.avatarUrl,
                                        class: 'w-full h-full',
                                        style: { '--va-avatar-size': '100%' },
                                      },
                                      null,
                                      8,
                                      ['src'],
                                    ),
                                  ]),
                                  a('div', De, [
                                    a(
                                      'h3',
                                      { class: 'text-2xl font-black mb-1', style: u(B.value) },
                                      x(c(t).partner.displayName || c(t).partner.username),
                                      5,
                                    ),
                                    a(
                                      'p',
                                      { class: 'font-medium mb-4', style: u(N.value) },
                                      '@' + x(c(t).partner.username),
                                      5,
                                    ),
                                    a('div', Se, [
                                      s(l, { name: 'cake', size: '18px' }),
                                      c(t).partner.birthday
                                        ? (m(),
                                          p(
                                            'span',
                                            Ue,
                                            x(
                                              new Date(c(t).partner.birthday).toLocaleDateString(void 0, {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                              }),
                                            ),
                                            1,
                                          ))
                                        : (m(), p('span', Pe, 'Birthday not set')),
                                    ]),
                                  ]),
                                  a('div', Ae, [
                                    s(
                                      U,
                                      {
                                        preset: 'secondary',
                                        color: 'danger',
                                        size: 'small',
                                        borderless: '',
                                        icon: 'link_off',
                                        onClick: e[3] || (e[3] = (n) => (k.value = !0)),
                                      },
                                      { default: i(() => e[11] || (e[11] = [I(' Disconnect ')])), _: 1 },
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
                  ]))
                : (m(),
                  p('section', Ie, [
                    a('div', ze, [
                      s(l, { name: 'link_off', color: 'gray', size: '20px' }),
                      a('h2', { class: 'text-xl font-bold', style: u(D.value) }, 'No Connection', 4),
                    ]),
                    s(
                      A,
                      {
                        class:
                          'border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shadow-none',
                      },
                      {
                        default: i(() => [
                          s(
                            P,
                            { class: 'p-10 text-center' },
                            {
                              default: i(() => [
                                s(l, {
                                  name: 'favorite_border',
                                  size: '48px',
                                  class: 'text-gray-300 dark:text-gray-600 mb-4',
                                }),
                                a(
                                  'p',
                                  { class: 'max-w-md mx-auto', style: u(N.value) },
                                  " You haven't paired with anyone yet. Visit the pairing page to invite your partner! ",
                                  4,
                                ),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ])),
            ]),
            s(
              E,
              {
                modelValue: k.value,
                'onUpdate:modelValue': e[6] || (e[6] = (n) => (k.value = n)),
                title: 'Dangerous Action',
                'ok-text': 'Disconnect',
                'cancel-text': 'Keep Connection',
                'ok-disabled': _.value !== T.value,
                onOk: L,
                'max-width': '450px',
              },
              {
                default: i(() => [
                  a('div', Be, [
                    e[13] ||
                      (e[13] = a(
                        'div',
                        {
                          class:
                            'bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30',
                        },
                        [
                          a(
                            'p',
                            { class: 'text-red-700 dark:text-red-400 font-bold mb-2' },
                            'You are about to disconnect.',
                          ),
                          a(
                            'p',
                            { class: 'text-red-600 dark:text-red-300 text-sm' },
                            'This will permanently erase all shared letters, memories, and photos. This cannot be undone.',
                          ),
                        ],
                        -1,
                      )),
                    a('div', Me, [
                      e[12] ||
                        (e[12] = a(
                          'p',
                          { class: 'text-sm font-bold text-gray-700 dark:text-gray-300' },
                          'Type this to confirm:',
                          -1,
                        )),
                      a('code', Te, x(T.value), 1),
                      s(
                        g,
                        {
                          modelValue: _.value,
                          'onUpdate:modelValue': e[4] || (e[4] = (n) => (_.value = n)),
                          placeholder: 'Type exactly as shown above',
                          class: 'w-full mt-2',
                          onPaste: e[5] || (e[5] = re(() => {}, ['prevent'])),
                        },
                        null,
                        8,
                        ['modelValue'],
                      ),
                    ]),
                  ]),
                ]),
                _: 1,
              },
              8,
              ['modelValue', 'ok-disabled'],
            ),
          ])
        )
      }
    },
  })
export { Ye as default }
//# sourceMappingURL=LoveProfile-CgrzggU4.js.map

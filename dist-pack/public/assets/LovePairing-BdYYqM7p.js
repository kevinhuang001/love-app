import {
  x as D,
  y as E,
  L as M,
  M as G,
  B as O,
  j as $,
  g as H,
  N as J,
  k as K,
  O as Q,
  f as W,
} from './vuestic-ui-hYeKHxJy.js'
import { u as X, a as Y } from './index-D_419K7i.js'
import {
  k as Z,
  a as S,
  r as y,
  G as ee,
  q as d,
  L as a,
  w as t,
  o as r,
  C as V,
  t as w,
  d as x,
  v as o,
  c as C,
  F as te,
  D as ae,
  x as q,
  ae as se,
} from './vue-vendor-CS4KimFI.js'
import { p as g } from './pairing.service-D6zThsnd.js'
import './vendor-Qzk3SZgC.js'
const oe = { class: 'pairing-container flex justify-center items-center h-screen bg-backgroundPrimary' },
  ne = { key: 0, class: 'p-4' },
  re = { key: 1, class: 'p-4' },
  le = { key: 0, class: 'text-gray-500' },
  ce = { class: 'mt-4' },
  ue = Z({
    __name: 'LovePairing',
    setup(de) {
      const i = X(),
        b = se(),
        { init: m } = D(),
        I = S(() => ({ color: i.preferences.theme === 'dark' ? '#f3f4f6' : '#111827' })),
        B = S(() => ({ color: i.preferences.theme === 'dark' ? '#94a3b8' : '#4b5563' })),
        p = y('send'),
        c = y(''),
        f = y([]),
        T = async () => {
          try {
            ;(await g.sendRequest(c.value),
              m({ message: 'Request sent successfully!', color: 'success' }),
              (c.value = ''))
          } catch (n) {
            m({ message: n.message || 'Error sending request', color: 'danger' })
          }
        },
        k = async () => {
          try {
            const n = await g.getRequests()
            f.value = n
          } catch (n) {
            console.error(n)
          }
        },
        h = async (n) => {
          try {
            ;(await g.acceptRequest(n),
              m({ message: 'Connected! Redirecting...', color: 'success' }),
              await i.checkAuth(),
              b.push({ name: 'love-dashboard' }))
          } catch {
            m({ message: 'Failed to accept request', color: 'danger' })
          }
        },
        N = () => {
          ;(i.logout(), b.push({ name: 'login' }))
        }
      return (
        ee(() => {
          k()
        }),
        (n, e) => {
          const L = G,
            U = M,
            P = O,
            _ = $,
            A = K,
            v = J,
            R = Q,
            j = H,
            z = W,
            F = E
          return (
            r(),
            d('div', oe, [
              a(
                F,
                { class: 'pairing-card p-5 text-center border border-backgroundBorder' },
                {
                  default: t(() => [
                    V(
                      'h1',
                      { class: 'display-5 mb-3 text-primary', style: x(I.value) },
                      '❤️ Pair with your Partner',
                      4,
                    ),
                    V(
                      'p',
                      { class: 'mb-4', style: x(B.value) },
                      'To start your journey, you need to connect with your special someone.',
                      4,
                    ),
                    a(
                      U,
                      { modelValue: p.value, 'onUpdate:modelValue': e[0] || (e[0] = (s) => (p.value = s)), grow: '' },
                      {
                        tabs: t(() => [
                          a(L, { name: 'send' }, { default: t(() => e[2] || (e[2] = [o('Send Request')])), _: 1 }),
                          a(
                            L,
                            { name: 'received' },
                            { default: t(() => e[3] || (e[3] = [o('Received Requests')])), _: 1 },
                          ),
                        ]),
                        _: 1,
                      },
                      8,
                      ['modelValue'],
                    ),
                    p.value === 'send'
                      ? (r(),
                        d('div', ne, [
                          a(
                            P,
                            {
                              modelValue: c.value,
                              'onUpdate:modelValue': e[1] || (e[1] = (s) => (c.value = s)),
                              label: "Partner's Username",
                              class: 'mb-3',
                            },
                            null,
                            8,
                            ['modelValue'],
                          ),
                          a(
                            _,
                            { disabled: !c.value, class: 'w-full', onClick: T },
                            { default: t(() => e[4] || (e[4] = [o(' Send Love Request ')])), _: 1 },
                            8,
                            ['disabled'],
                          ),
                        ]))
                      : w('', !0),
                    p.value === 'received'
                      ? (r(),
                        d('div', re, [
                          f.value.length === 0
                            ? (r(), d('div', le, 'No pending requests.'))
                            : (r(),
                              C(
                                z,
                                { key: 1 },
                                {
                                  default: t(() => [
                                    (r(!0),
                                    d(
                                      te,
                                      null,
                                      ae(
                                        f.value,
                                        (s) => (
                                          r(),
                                          C(
                                            j,
                                            { key: s.id },
                                            {
                                              default: t(() => [
                                                a(
                                                  v,
                                                  { avatar: '' },
                                                  {
                                                    default: t(() => {
                                                      var l
                                                      return [
                                                        a(
                                                          A,
                                                          {
                                                            src:
                                                              ((l = s.Sender) == null ? void 0 : l.avatarUrl) || void 0,
                                                          },
                                                          {
                                                            default: t(() => {
                                                              var u
                                                              return [
                                                                o(
                                                                  q((u = s.Sender) != null && u.avatarUrl ? '' : '👤'),
                                                                  1,
                                                                ),
                                                              ]
                                                            }),
                                                            _: 2,
                                                          },
                                                          1032,
                                                          ['src'],
                                                        ),
                                                      ]
                                                    }),
                                                    _: 2,
                                                  },
                                                  1024,
                                                ),
                                                a(
                                                  v,
                                                  null,
                                                  {
                                                    default: t(() => [
                                                      a(
                                                        R,
                                                        null,
                                                        {
                                                          default: t(() => {
                                                            var l, u
                                                            return [
                                                              o(
                                                                q(
                                                                  ((l = s.Sender) == null ? void 0 : l.displayName) ||
                                                                    ((u = s.Sender) == null ? void 0 : u.username),
                                                                ),
                                                                1,
                                                              ),
                                                            ]
                                                          }),
                                                          _: 2,
                                                        },
                                                        1024,
                                                      ),
                                                      a(
                                                        R,
                                                        { caption: '' },
                                                        {
                                                          default: t(
                                                            () => e[5] || (e[5] = [o('wants to pair with you')]),
                                                          ),
                                                          _: 1,
                                                        },
                                                      ),
                                                    ]),
                                                    _: 2,
                                                  },
                                                  1024,
                                                ),
                                                a(
                                                  v,
                                                  { side: '' },
                                                  {
                                                    default: t(() => [
                                                      a(
                                                        _,
                                                        { size: 'small', color: 'success', onClick: (l) => h(s.id) },
                                                        { default: t(() => e[6] || (e[6] = [o('Accept')])), _: 2 },
                                                        1032,
                                                        ['onClick'],
                                                      ),
                                                    ]),
                                                    _: 2,
                                                  },
                                                  1024,
                                                ),
                                              ]),
                                              _: 2,
                                            },
                                            1024,
                                          )
                                        ),
                                      ),
                                      128,
                                    )),
                                  ]),
                                  _: 1,
                                },
                              )),
                          a(
                            _,
                            { flat: '', size: 'small', class: 'mt-2', onClick: k },
                            { default: t(() => e[7] || (e[7] = [o('Refresh')])), _: 1 },
                          ),
                        ]))
                      : w('', !0),
                    V('div', ce, [
                      a(
                        _,
                        { flat: '', color: 'secondary', onClick: N },
                        { default: t(() => e[8] || (e[8] = [o('Logout')])), _: 1 },
                      ),
                    ]),
                  ]),
                  _: 1,
                },
              ),
            ])
          )
        }
      )
    },
  }),
  ve = Y(ue, [['__scopeId', 'data-v-9d81e901']])
export { ve as default }
//# sourceMappingURL=LovePairing-BdYYqM7p.js.map

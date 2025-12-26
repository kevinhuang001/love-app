import { R as B, x as q, S as T, B as j, h as F, T as S, U as M, j as N } from './vuestic-ui-hYeKHxJy.js'
import {
  k as R,
  ae as A,
  r as H,
  f as $,
  G as D,
  c as E,
  w as n,
  W as y,
  o as d,
  C as l,
  L as o,
  v as u,
  a3 as G,
  u as p,
  q as b,
} from './vue-vendor-CS4KimFI.js'
import { u as K, g as W } from './index-D_419K7i.js'
import './vendor-Qzk3SZgC.js'
const f = {
    email: (r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r) || 'Please enter a valid email address',
    required: (r) => !!r || 'This field is required',
  },
  Y = { class: 'text-base mb-4 leading-5' },
  z = { class: 'auth-layout__options flex flex-col sm:flex-row items-start sm:items-center justify-between' },
  J = { class: 'mt-4 flex flex-col sm:flex-row items-center sm:items-center gap-2' },
  O = ['innerHTML'],
  Q = { key: 1, class: 'px-4 py-2 text-sm text-gray-400' },
  X = { class: 'flex justify-center mt-4' },
  te = R({
    __name: 'Login',
    setup(r) {
      const { validate: g } = B('form'),
        { push: w } = A(),
        { init: v } = q(),
        k = K(),
        i = H(''),
        s = $({ username: '', password: '', captcha: '', keepLoggedIn: !1 }),
        m = async () => {
          try {
            const a = await fetch(W(), { credentials: 'include' })
            a.ok && (i.value = await a.text())
          } catch (a) {
            console.error('Failed to load captcha', a)
          }
        }
      D(() => {
        m()
      })
      const x = async () => {
        if (g()) {
          const a = await k.login(s.username, s.password, s.captcha)
          a.success
            ? (v({ message: "You've successfully logged in", color: 'success' }), w({ name: 'love-dashboard' }))
            : (v({ message: a.error || 'Login failed', color: 'danger' }), m(), (s.captcha = ''))
        }
      }
      return (a, e) => {
        const V = G('RouterLink'),
          c = j,
          h = F,
          C = S,
          L = M,
          I = N,
          U = T
        return (
          d(),
          E(
            U,
            { ref: 'form', onSubmit: y(x, ['prevent']) },
            {
              default: n(() => [
                e[8] || (e[8] = l('h1', { class: 'font-semibold text-4xl mb-4' }, 'Log in', -1)),
                l('p', Y, [
                  e[5] || (e[5] = u(' New to Vuestic? ')),
                  o(
                    V,
                    { to: { name: 'signup' }, class: 'font-semibold text-primary' },
                    { default: n(() => e[4] || (e[4] = [u('Sign up')])), _: 1 },
                  ),
                ]),
                o(
                  c,
                  {
                    modelValue: s.username,
                    'onUpdate:modelValue': e[0] || (e[0] = (t) => (s.username = t)),
                    rules: [p(f).required],
                    class: 'mb-4',
                    label: 'Username',
                    type: 'text',
                  },
                  null,
                  8,
                  ['modelValue', 'rules'],
                ),
                o(
                  C,
                  { 'default-value': !1 },
                  {
                    default: n((t) => [
                      o(
                        c,
                        {
                          modelValue: s.password,
                          'onUpdate:modelValue': e[1] || (e[1] = (_) => (s.password = _)),
                          rules: [p(f).required],
                          type: t.value ? 'text' : 'password',
                          class: 'mb-4',
                          label: 'Password',
                          onClickAppendInner: y((_) => (t.value = !t.value), ['stop']),
                        },
                        {
                          appendInner: n(() => [
                            o(
                              h,
                              {
                                name: t.value ? 'mso-visibility_off' : 'mso-visibility',
                                class: 'cursor-pointer',
                                color: 'secondary',
                              },
                              null,
                              8,
                              ['name'],
                            ),
                          ]),
                          _: 2,
                        },
                        1032,
                        ['modelValue', 'rules', 'type', 'onClickAppendInner'],
                      ),
                    ]),
                    _: 1,
                  },
                ),
                l('div', z, [
                  o(
                    L,
                    {
                      modelValue: s.keepLoggedIn,
                      'onUpdate:modelValue': e[2] || (e[2] = (t) => (s.keepLoggedIn = t)),
                      class: 'mb-2 sm:mb-0',
                      label: 'Keep me signed in on this device',
                    },
                    null,
                    8,
                    ['modelValue'],
                  ),
                  o(
                    V,
                    { to: { name: 'recover-password' }, class: 'mt-2 sm:mt-0 sm:ml-1 font-semibold text-primary' },
                    { default: n(() => e[6] || (e[6] = [u(' Forgot password? ')])), _: 1 },
                  ),
                ]),
                l('div', J, [
                  o(
                    c,
                    {
                      modelValue: s.captcha,
                      'onUpdate:modelValue': e[3] || (e[3] = (t) => (s.captcha = t)),
                      rules: [p(f).required],
                      label: 'Captcha',
                      class: 'w-full sm:flex-grow',
                    },
                    null,
                    8,
                    ['modelValue', 'rules'],
                  ),
                  l(
                    'div',
                    {
                      class:
                        'cursor-pointer border rounded overflow-hidden h-[44px] min-w-[120px] flex items-center justify-center bg-gray-50 self-center sm:self-auto mt-2 sm:mt-0',
                      onClick: m,
                      title: 'Click to refresh',
                    },
                    [
                      i.value
                        ? (d(),
                          b(
                            'div',
                            {
                              key: 0,
                              innerHTML: i.value,
                              class: 'w-full h-full flex items-center justify-center scale-110',
                            },
                            null,
                            8,
                            O,
                          ))
                        : (d(), b('div', Q, 'Loading...')),
                    ],
                  ),
                ]),
                l('div', X, [
                  o(I, { class: 'w-full', onClick: x }, { default: n(() => e[7] || (e[7] = [u(' Login')])), _: 1 }),
                ]),
              ]),
              _: 1,
            },
            512,
          )
        )
      }
    },
  })
export { te as default }
//# sourceMappingURL=Login-Djkdg_kn.js.map

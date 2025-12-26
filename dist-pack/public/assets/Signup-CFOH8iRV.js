import { R as B, x as L, S as D, B as R, C as q, h as P, T as $, j as A } from './vuestic-ui-hYeKHxJy.js'
import {
  k as F,
  ae as M,
  r as V,
  f as T,
  G as j,
  c as H,
  w as r,
  W as p,
  o as f,
  C as u,
  L as o,
  v as y,
  a3 as Y,
  q as b,
} from './vue-vendor-CS4KimFI.js'
import { u as z, g as E } from './index-D_419K7i.js'
import './vendor-Qzk3SZgC.js'
const G = { class: 'text-base mb-4 leading-5' },
  O = { class: 'mt-4 flex flex-col sm:flex-row items-center sm:items-center gap-2' },
  W = ['innerHTML'],
  Z = { key: 1, class: 'px-4 py-2 text-sm text-gray-400' },
  J = { class: 'flex justify-center mt-4' },
  te = F({
    __name: 'Signup',
    setup(K) {
      const { validate: x } = B('form'),
        { push: h } = M(),
        { init: v } = L(),
        _ = z(),
        d = V(!1),
        i = V(''),
        s = T({ username: '', displayName: '', password: '', repeatPassword: '', birthday: void 0, captcha: '' }),
        c = async () => {
          try {
            const e = await fetch(E(), { credentials: 'include' })
            e.ok && (i.value = await e.text())
          } catch (e) {
            console.error('Failed to load captcha', e)
          }
        }
      j(() => {
        c()
      })
      const C = (e) => {
          if (!e) return ''
          const a = e.getFullYear(),
            m = String(e.getMonth() + 1).padStart(2, '0'),
            n = String(e.getDate()).padStart(2, '0')
          return `${a}-${m}-${n}`
        },
        g = async () => {
          if (!d.value && x()) {
            d.value = !0
            const e = await _.register(s.username, s.password, s.displayName, C(s.birthday), s.captcha)
            ;((d.value = !1),
              e.success
                ? (v({ message: "You've successfully signed up", color: 'success' }), h({ name: 'login' }))
                : (v({ message: e.error || 'Signup failed', color: 'danger' }), c(), (s.captcha = '')))
          }
        },
        k = [
          (e) => !!e || 'Password field is required',
          (e) => (e && e.length >= 8) || 'Password must be at least 8 characters long',
          (e) => (e && /[A-Za-z]/.test(e)) || 'Password must contain at least one letter',
          (e) => (e && /\d/.test(e)) || 'Password must contain at least one number',
          (e) => (e && /[!@#$%^&*(),.?":{}|<>]/.test(e)) || 'Password must contain at least one special character',
        ]
      return (e, a) => {
        const m = Y('RouterLink'),
          n = R,
          I = q,
          w = P,
          S = $,
          U = A,
          N = D
        return (
          f(),
          H(
            N,
            { ref: 'form', onSubmit: p(g, ['prevent']) },
            {
              default: r(() => [
                a[9] || (a[9] = u('h1', { class: 'font-semibold text-4xl mb-4' }, 'Sign up', -1)),
                u('p', G, [
                  a[7] || (a[7] = y(' Have an account? ')),
                  o(
                    m,
                    { to: { name: 'login' }, class: 'font-semibold text-primary' },
                    { default: r(() => a[6] || (a[6] = [y('Login')])), _: 1 },
                  ),
                ]),
                o(
                  n,
                  {
                    modelValue: s.username,
                    'onUpdate:modelValue': a[0] || (a[0] = (t) => (s.username = t)),
                    rules: [(t) => !!t || 'Username field is required'],
                    class: 'mb-4',
                    label: 'Username',
                    type: 'text',
                  },
                  null,
                  8,
                  ['modelValue', 'rules'],
                ),
                o(
                  n,
                  {
                    modelValue: s.displayName,
                    'onUpdate:modelValue': a[1] || (a[1] = (t) => (s.displayName = t)),
                    rules: [(t) => !!t || 'Display Name is required'],
                    class: 'mb-4',
                    label: 'Display Name',
                    type: 'text',
                  },
                  null,
                  8,
                  ['modelValue', 'rules'],
                ),
                o(
                  I,
                  {
                    modelValue: s.birthday,
                    'onUpdate:modelValue': a[2] || (a[2] = (t) => (s.birthday = t)),
                    class: 'mb-4',
                    label: 'Birthday (Optional)',
                    clearable: '',
                  },
                  null,
                  8,
                  ['modelValue'],
                ),
                o(
                  S,
                  { 'default-value': !1 },
                  {
                    default: r((t) => [
                      o(
                        n,
                        {
                          ref: 'password1',
                          modelValue: s.password,
                          'onUpdate:modelValue': a[3] || (a[3] = (l) => (s.password = l)),
                          rules: k,
                          type: t.value ? 'text' : 'password',
                          class: 'mb-4',
                          label: 'Password',
                          messages: 'Password should be 8+ characters: letters, numbers, and special characters.',
                          onClickAppendInner: p((l) => (t.value = !t.value), ['stop']),
                        },
                        {
                          appendInner: r(() => [
                            o(
                              w,
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
                        ['modelValue', 'type', 'onClickAppendInner'],
                      ),
                      o(
                        n,
                        {
                          ref: 'password2',
                          modelValue: s.repeatPassword,
                          'onUpdate:modelValue': a[4] || (a[4] = (l) => (s.repeatPassword = l)),
                          rules: [
                            (l) => !!l || 'Repeat Password field is required',
                            (l) => l === s.password || "Passwords don't match",
                          ],
                          type: t.value ? 'text' : 'password',
                          class: 'mb-4',
                          label: 'Repeat Password',
                          onClickAppendInner: p((l) => (t.value = !t.value), ['stop']),
                        },
                        {
                          appendInner: r(() => [
                            o(
                              w,
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
                u('div', O, [
                  o(
                    n,
                    {
                      modelValue: s.captcha,
                      'onUpdate:modelValue': a[5] || (a[5] = (t) => (s.captcha = t)),
                      rules: [(t) => !!t || 'Captcha is required'],
                      label: 'Captcha',
                      class: 'w-full sm:flex-grow',
                    },
                    null,
                    8,
                    ['modelValue', 'rules'],
                  ),
                  u(
                    'div',
                    {
                      class:
                        'cursor-pointer border rounded overflow-hidden h-[44px] min-w-[120px] flex items-center justify-center bg-gray-50 self-center sm:self-auto mt-2 sm:mt-0',
                      onClick: c,
                      title: 'Click to refresh',
                    },
                    [
                      i.value
                        ? (f(),
                          b(
                            'div',
                            {
                              key: 0,
                              innerHTML: i.value,
                              class: 'w-full h-full flex items-center justify-center scale-110',
                            },
                            null,
                            8,
                            W,
                          ))
                        : (f(), b('div', Z, 'Loading...')),
                    ],
                  ),
                ]),
                u('div', J, [
                  o(
                    U,
                    { class: 'w-full', onClick: g, loading: d.value },
                    { default: r(() => a[8] || (a[8] = [y(' Create account')])), _: 1 },
                    8,
                    ['loading'],
                  ),
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
//# sourceMappingURL=Signup-CFOH8iRV.js.map

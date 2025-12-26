import { R as f, S as c, B as w, j as b } from './vuestic-ui-hYeKHxJy.js'
import {
  k as y,
  r as V,
  c as v,
  w as a,
  W as x,
  o as _,
  C as l,
  L as t,
  v as m,
  ae as k,
} from './vue-vendor-CS4KimFI.js'
import './vendor-Qzk3SZgC.js'
const S = y({
  __name: 'RecoverPassword',
  setup(B) {
    const r = V(''),
      u = f('passwordForm'),
      d = k(),
      o = () => {
        u.validate() && d.push({ name: 'recover-password-email' })
      }
    return (F, e) => {
      const i = w,
        n = b,
        p = c
      return (
        _(),
        v(
          p,
          { ref: 'passwordForm', onSubmit: x(o, ['prevent']) },
          {
            default: a(() => [
              e[3] || (e[3] = l('h1', { class: 'font-semibold text-4xl mb-4' }, 'Forgot your password?', -1)),
              e[4] ||
                (e[4] = l(
                  'p',
                  { class: 'text-base mb-4 leading-5' },
                  " If you've forgotten your password, don't worry. Simply enter your email address below, and we'll send you an email with a temporary password. Restoring access to your account has never been easier. ",
                  -1,
                )),
              t(
                i,
                {
                  modelValue: r.value,
                  'onUpdate:modelValue': e[0] || (e[0] = (s) => (r.value = s)),
                  rules: [(s) => !!s || 'Email field is required'],
                  class: 'mb-4',
                  label: 'Enter your email',
                  type: 'email',
                },
                null,
                8,
                ['modelValue', 'rules'],
              ),
              t(
                n,
                { class: 'w-full mb-2', onClick: o },
                { default: a(() => e[1] || (e[1] = [m('Send password')])), _: 1 },
              ),
              t(
                n,
                { to: { name: 'login' }, class: 'w-full', preset: 'secondary', onClick: o },
                { default: a(() => e[2] || (e[2] = [m('Go back')])), _: 1 },
              ),
            ]),
            _: 1,
          },
          512,
        )
      )
    }
  },
})
export { S as default }
//# sourceMappingURL=RecoverPassword-CNWFQfQE.js.map

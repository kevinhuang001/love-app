import { j as a } from './vuestic-ui-hYeKHxJy.js'
import { a as n } from './index-D_419K7i.js'
import { q as r, o as i, C as t, v as s, L as l, w as c } from './vue-vendor-CS4KimFI.js'
import './vendor-Qzk3SZgC.js'
const m = {},
  d = { class: 'flex justify-center mt-4' }
function f(u, e) {
  const o = a
  return (
    i(),
    r('div', null, [
      e[1] || (e[1] = t('h1', { class: 'font-semibold text-4xl mb-4' }, 'Check the email', -1)),
      e[2] ||
        (e[2] = t(
          'p',
          { class: 'text-base mb-4 leading-5' },
          [
            s(
              ' Password reset instructions have been sent to your email. Check your inbox, including the spam folder if needed. For assistance, ',
            ),
            t('span', { class: 'va-link' }, 'contact support'),
            s('. '),
          ],
          -1,
        )),
      t('div', d, [
        l(
          o,
          { to: { name: 'login' }, class: 'w-full' },
          { default: c(() => e[0] || (e[0] = [s('Back to login')])), _: 1 },
        ),
      ]),
    ])
  )
}
const b = n(m, [['render', f]])
export { b as default }
//# sourceMappingURL=CheckTheEmail-FwfkFGzL.js.map

import { h as i, j as m } from './vuestic-ui-hYeKHxJy.js'
import { a as c } from './index-D_419K7i.js'
import { q as d, o as p, L as o, C as t, w as s, v as n, a3 as x } from './vue-vendor-CS4KimFI.js'
import './vendor-Qzk3SZgC.js'
const f = {},
  u = { class: 'flex flex-col justify-between h-screen items-center bg-[var(--va-background-secondary)]' },
  _ = { class: 'flex flex-col items-center gap-6 px-4 my-8' },
  v = { class: 'flex flex-col sm:flex-row gap-4' }
function g(y, e) {
  const a = x('RouterLink'),
    r = i,
    l = m
  return (
    p(),
    d('div', u, [
      o(
        a,
        { to: '/', class: 'my-8 text-primary font-bold text-xl' },
        { default: s(() => e[0] || (e[0] = [n(' Love App ')])), _: 1 },
      ),
      t('div', _, [
        o(r, { name: 'sentiment_dissatisfied', size: '80px', color: 'primary' }),
        e[2] || (e[2] = t('h1', { class: 'va-h1 text-center sm:text-5xl text-4xl' }, 'Page not found', -1)),
        e[3] ||
          (e[3] = t(
            'p',
            { class: 'text-center' },
            ' The page you are looking for might have been removed had its name changed or is temporarily unavailable. ',
            -1,
          )),
        t('div', v, [o(l, { to: '/' }, { default: s(() => e[1] || (e[1] = [n('Go to homepage')])), _: 1 })]),
      ]),
      e[4] || (e[4] = t('div', null, null, -1)),
    ])
  )
}
const B = c(f, [['render', g]])
export { B as default }
//# sourceMappingURL=404-CyiAwkBD.js.map

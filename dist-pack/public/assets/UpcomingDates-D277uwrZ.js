import { j as v, h as $, A as z, y as T } from './vuestic-ui-hYeKHxJy.js'
import {
  k as F,
  q as _,
  o as i,
  C as o,
  d as B,
  u as S,
  L as n,
  w as u,
  v as h,
  t as k,
  F as I,
  D as L,
  c as x,
  n as b,
  x as m,
  W as N,
} from './vue-vendor-CS4KimFI.js'
import { u as j } from './index-D_419K7i.js'
import { u as E } from './message.service-0pLRvHXE.js'
import './vendor-Qzk3SZgC.js'
const Y = { class: 'p-0' },
  A = { class: 'relative flex justify-center items-center mb-6' },
  M = { class: 'absolute right-0 hidden md:block' },
  U = { class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
  H = {
    key: 0,
    class: 'col-span-full text-center py-8 bg-transparent rounded-lg border-2 border-dashed border-backgroundBorder',
  },
  W = { class: 'flex justify-between items-start z-10 relative' },
  q = { class: 'text-3xl font-black mb-1 leading-none' },
  K = { class: 'text-[10px] uppercase font-bold tracking-widest opacity-80' },
  R = { class: 'flex gap-2' },
  G = { class: 'mt-6 z-10 relative' },
  J = { class: 'font-black text-xl tracking-tight mb-0.5' },
  O = { class: 'text-xs font-bold opacity-75' },
  P = { class: 'mt-6 flex justify-center md:hidden' },
  ot = F({
    __name: 'UpcomingDates',
    props: { anniversaries: {} },
    emits: ['add', 'edit', 'delete'],
    setup(Q) {
      const p = j(),
        { textStyle: y } = E(),
        D = y,
        c = (s) => {
          const e = s.type === 'start_date' ? 'start_date' : `${s.type}_${s.id}`
          if (p.preferences.cardColors && p.preferences.cardColors[e]) return p.preferences.cardColors[e]
          if (s.color && s.color !== 'primary') return s.color
          switch (s.type) {
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
        f = (s) => {
          const e = (t) => {
              if (!t || !t.startsWith('#') || t.length < 7) return { r: 100, g: 100, b: 100 }
              const g = parseInt(t.slice(1, 3), 16),
                w = parseInt(t.slice(3, 5), 16),
                V = parseInt(t.slice(5, 7), 16)
              return { r: g, g: w, b: V }
            },
            { r: a, g: l, b: r } = e(s)
          return (0.299 * a + 0.587 * l + 0.114 * r) / 255 > 0.6 ? 'text-gray-900' : 'text-white'
        },
        d = (s) => {
          const e = new Date()
          e.setHours(0, 0, 0, 0)
          const a = new Date(s)
          ;(a.setFullYear(e.getFullYear()), a.setHours(0, 0, 0, 0), a < e && a.setFullYear(e.getFullYear() + 1))
          const l = Math.abs(a.getTime() - e.getTime()),
            r = Math.ceil(l / (1e3 * 60 * 60 * 24))
          return r === 365 || r === 0 ? 0 : r
        }
      return (s, e) => {
        const a = v,
          l = $,
          r = z,
          C = T
        return (
          i(),
          _('div', Y, [
            o('div', A, [
              o('h3', { class: 'text-2xl font-black tracking-tight', style: B(S(D)) }, 'Upcoming Special Dates', 4),
              o('div', M, [
                n(
                  a,
                  {
                    size: 'small',
                    round: '',
                    icon: 'add',
                    preset: 'secondary',
                    'border-color': 'primary',
                    onClick: e[0] || (e[0] = (t) => s.$emit('add')),
                  },
                  { default: u(() => e[2] || (e[2] = [h('Add Date')])), _: 1 },
                ),
              ]),
            ]),
            o('div', U, [
              s.anniversaries.length === 0
                ? (i(),
                  _('div', H, [
                    n(l, { name: 'event_busy', size: 'large', color: 'secondary', class: 'mb-2' }),
                    e[3] ||
                      (e[3] = o(
                        'p',
                        { class: 'text-gray-400 dark:text-gray-500 font-bold tracking-tight' },
                        'No special dates found.',
                        -1,
                      )),
                  ]))
                : k('', !0),
              (i(!0),
              _(
                I,
                null,
                L(
                  s.anniversaries,
                  (t) => (
                    i(),
                    x(
                      C,
                      {
                        key: t.id,
                        class: 'anniversary-card transform transition hover:scale-105 duration-300',
                        color: c(t),
                        gradient: '',
                      },
                      {
                        default: u(() => [
                          n(
                            r,
                            { class: b(['relative overflow-hidden', f(c(t))]) },
                            {
                              default: u(() => [
                                o('div', W, [
                                  o('div', null, [
                                    o(
                                      'div',
                                      q,
                                      m(d(t.date) === 0 ? 'Today' : d(t.date) === 1 ? 'Tomorrow' : d(t.date)),
                                      1,
                                    ),
                                    o(
                                      'div',
                                      K,
                                      m(d(t.date) === 0 ? 'Celebration' : d(t.date) === 1 ? 'Day Left' : 'Days Left'),
                                      1,
                                    ),
                                  ]),
                                  o('div', R, [
                                    n(
                                      a,
                                      {
                                        icon: 'edit',
                                        flat: '',
                                        size: 'small',
                                        class: b(['hover:bg-black/10 transition-colors', f(c(t))]),
                                        onClick: N((g) => s.$emit('edit', t), ['stop']),
                                      },
                                      null,
                                      8,
                                      ['class', 'onClick'],
                                    ),
                                  ]),
                                ]),
                                o('div', G, [
                                  o('h4', J, m(t.title), 1),
                                  o('p', O, m(new Date(t.date).toLocaleDateString()), 1),
                                ]),
                                t.type !== 'start_date' && t.type !== 'birthday'
                                  ? (i(),
                                    x(
                                      a,
                                      {
                                        key: 0,
                                        icon: 'delete',
                                        flat: '',
                                        size: 'small',
                                        class: b(['absolute bottom-2 right-2 z-10', f(c(t))]),
                                        onClick: (g) => s.$emit('delete', t.id),
                                      },
                                      null,
                                      8,
                                      ['class', 'onClick'],
                                    ))
                                  : k('', !0),
                                n(l, {
                                  name: 'favorite',
                                  class: 'absolute -bottom-4 -right-4 text-9xl opacity-20 transform rotate-12',
                                }),
                              ]),
                              _: 2,
                            },
                            1032,
                            ['class'],
                          ),
                        ]),
                        _: 2,
                      },
                      1032,
                      ['color'],
                    )
                  ),
                ),
                128,
              )),
            ]),
            o('div', P, [
              n(
                a,
                { round: '', icon: 'add', onClick: e[1] || (e[1] = (t) => s.$emit('add')) },
                { default: u(() => e[4] || (e[4] = [h('Add Date')])), _: 1 },
              ),
            ]),
          ])
        )
      }
    },
  })
export { ot as default }
//# sourceMappingURL=UpcomingDates-D277uwrZ.js.map

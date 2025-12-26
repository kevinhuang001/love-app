import { j as C, h as _ } from './vuestic-ui-hYeKHxJy.js'
import { u as w } from './index-D_419K7i.js'
import {
  k as N,
  a as x,
  ae as S,
  q as a,
  o as l,
  C as o,
  d as c,
  L as f,
  F as V,
  D as z,
  u as n,
  x as u,
  t as y,
  w as L,
  v as j,
  n as B,
} from './vue-vendor-CS4KimFI.js'
import './vendor-Qzk3SZgC.js'
const D = { class: 'love-notes-section' },
  I = { class: 'flex justify-center items-center mb-6' },
  T = { class: 'relative z-10' },
  $ = { class: 'absolute top-2 right-2' },
  q = { key: 0, class: 'flex flex-row gap-4 px-2 justify-center flex-wrap' },
  A = { key: 0, class: 'text-[10px] font-normal opacity-75 mb-0.5' },
  F = { key: 1 },
  K = {
    key: 1,
    class:
      'flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 bg-opacity-60 dark:bg-opacity-40 rounded-xl backdrop-blur-sm border border-gray-100 dark:border-slate-700',
  },
  J = N({
    __name: 'LoveNotes',
    props: { messages: {} },
    emits: ['openTheme'],
    setup(E) {
      const s = w(),
        g = x(() => ({ color: s.preferences.theme === 'dark' ? '#f3f4f6' : '#111827' })),
        h = S(),
        p = (e) => {
          if (!e) return !0
          const t = e.replace('#', ''),
            i = parseInt(t.substring(0, 2), 16),
            d = parseInt(t.substring(2, 4), 16),
            r = parseInt(t.substring(4, 6), 16)
          return (i * 299 + d * 587 + r * 114) / 1e3 > 155
        },
        k = (e) =>
          e
            ? ['800', '900', '950', 'black', 'indigo-950', 'rose-950', 'emerald-950', 'purple-950', 'slate-950'].some(
                (i) => e.includes(i),
              )
            : !1,
        v = x(() => {
          const e = s.preferences.noteTheme
          return k(e) ? `${e} text-white` : e
        })
      return (e, t) => {
        const i = C,
          d = _
        return (
          l(),
          a('div', D, [
            o('div', I, [o('h3', { class: 'text-2xl font-black tracking-tight', style: c(g.value) }, 'Love Notes', 4)]),
            o(
              'div',
              {
                class: B([
                  'p-6 rounded-lg shadow-sm text-center relative transition-all duration-500 overflow-hidden min-h-[150px]',
                  v.value,
                ]),
              },
              [
                o('div', T, [
                  o('div', $, [
                    f(i, {
                      icon: 'palette',
                      flat: '',
                      round: '',
                      size: 'small',
                      onClick: t[0] || (t[0] = (r) => e.$emit('openTheme')),
                    }),
                  ]),
                  e.messages.length > 0
                    ? (l(),
                      a('div', q, [
                        (l(!0),
                        a(
                          V,
                          null,
                          z(e.messages, (r) => {
                            var m, b
                            return (
                              l(),
                              a(
                                'div',
                                {
                                  key: r.id,
                                  class:
                                    'p-4 rounded-xl shadow-inner relative max-w-[200px] min-w-[200px] flex-shrink-0 backdrop-blur-sm snap-center transform transition hover:-translate-y-1 hover:shadow-lg border border-gray-100 dark:border-slate-700',
                                  style: c({
                                    backgroundColor:
                                      n(s).preferences.noteCardColor ||
                                      (n(s).preferences.theme === 'dark' ? '#1e293b' : '#ffffff'),
                                  }),
                                },
                                [
                                  f(d, {
                                    name: 'format_quote',
                                    class: 'absolute top-2 left-2 text-gray-400 text-2xl opacity-50',
                                  }),
                                  o(
                                    'p',
                                    {
                                      class:
                                        'italic text-sm px-4 py-2 font-serif min-h-[60px] flex items-center justify-center text-center line-clamp-3',
                                      style: c({
                                        color: p(n(s).preferences.noteCardColor || '#ffffff') ? '#1f2937' : '#f3f4f6',
                                      }),
                                    },
                                    u(r.content),
                                    5,
                                  ),
                                  o(
                                    'div',
                                    {
                                      class: 'mt-2 text-right text-xs font-bold border-t pt-2',
                                      style: c({
                                        color: p(n(s).preferences.noteCardColor || '#ffffff') ? '#4b5563' : '#d1d5db',
                                        borderColor: p(n(s).preferences.noteCardColor || '#ffffff')
                                          ? '#e5e7eb'
                                          : '#374151',
                                      }),
                                    },
                                    [
                                      n(s).preferences.showNoteDate
                                        ? (l(), a('div', A, u(new Date(r.createdAt).toLocaleString()), 1))
                                        : y('', !0),
                                      n(s).preferences.showNoteAuthor
                                        ? (l(),
                                          a(
                                            'span',
                                            F,
                                            '- ' +
                                              u(
                                                ((m = r.Sender) == null ? void 0 : m.displayName) ||
                                                  ((b = r.Sender) == null ? void 0 : b.username),
                                              ),
                                            1,
                                          ))
                                        : y('', !0),
                                    ],
                                    4,
                                  ),
                                ],
                                4,
                              )
                            )
                          }),
                          128,
                        )),
                      ]))
                    : (l(),
                      a('div', K, [
                        f(d, {
                          name: 'edit_note',
                          size: '3rem',
                          class: 'text-gray-400 dark:text-gray-500 mb-2 opacity-60',
                        }),
                        t[3] ||
                          (t[3] = o(
                            'p',
                            { class: 'text-gray-600 dark:text-gray-300 mb-3 font-medium' },
                            'No messages yet. Send a love note!',
                            -1,
                          )),
                        f(
                          i,
                          {
                            size: 'small',
                            round: '',
                            icon: 'send',
                            onClick: t[1] || (t[1] = (r) => n(h).push({ name: 'love-messages' })),
                          },
                          { default: L(() => t[2] || (t[2] = [j(' Send Note ')])), _: 1 },
                        ),
                      ])),
                ]),
              ],
              2,
            ),
          ])
        )
      }
    },
  })
export { J as default }
//# sourceMappingURL=LoveNotes-C8eMccdQ.js.map

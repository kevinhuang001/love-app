import { W as b, X as g, h as _, j as h } from './vuestic-ui-hYeKHxJy.js'
import {
  k as y,
  ae as k,
  a as x,
  q as r,
  o as s,
  C as o,
  d as v,
  L as a,
  w as l,
  t as V,
  x as w,
  v as C,
  u as B,
} from './vue-vendor-CS4KimFI.js'
import { u as S } from './index-D_419K7i.js'
import './vendor-Qzk3SZgC.js'
const j = { class: 'p-0' },
  I = { class: 'flex justify-center items-center mb-6' },
  N = { key: 0, class: 'carousel-container rounded-xl overflow-hidden bg-backgroundPrimary' },
  P = { class: 'w-full h-full flex items-center justify-center bg-backgroundPrimary relative' },
  U = {
    key: 0,
    class:
      'absolute bottom-0 left-0 right-0 bg-black/30 text-white p-3 text-center backdrop-blur-md border-t border-white/10',
  },
  M = { class: 'font-black text-sm tracking-wide' },
  z = {
    key: 1,
    class:
      'flex flex-col items-center justify-center py-16 bg-backgroundPrimary rounded-xl border-2 border-dashed border-backgroundBorder',
  },
  T = y({
    __name: 'MemoriesCarousel',
    props: { images: {} },
    setup(q) {
      const i = k(),
        c = S(),
        d = x(() => ({ color: c.preferences.theme === 'dark' ? '#f3f4f6' : '#111827' }))
      return (n, e) => {
        const m = b,
          u = g,
          p = _,
          f = h
        return (
          s(),
          r('div', j, [
            o('div', I, [
              o('h3', { class: 'text-2xl font-black tracking-tight', style: v(d.value) }, 'Sweet Memories', 4),
            ]),
            n.images.length > 0
              ? (s(),
                r('div', N, [
                  a(
                    u,
                    {
                      items: n.images,
                      indicators: '',
                      infinite: '',
                      autoscroll: '',
                      'autoscroll-interval': 4e3,
                      height: '350px',
                      color: 'backgroundPrimary',
                    },
                    {
                      default: l(({ item: t }) => [
                        o('div', P, [
                          a(m, { src: t.thumbnailUrl || t.imageUrl, class: 'w-full h-full', fit: 'contain' }, null, 8, [
                            'src',
                          ]),
                          t.title ? (s(), r('div', U, [o('p', M, w(t.title), 1)])) : V('', !0),
                        ]),
                      ]),
                      _: 1,
                    },
                    8,
                    ['items'],
                  ),
                ]))
              : (s(),
                r('div', z, [
                  a(p, { name: 'photo_library', size: '4rem', color: 'secondary', class: 'mb-4 opacity-20' }),
                  e[2] ||
                    (e[2] = o(
                      'p',
                      { class: 'text-gray-500 dark:text-gray-400 mb-6 font-bold tracking-tight' },
                      'Capture your best moments together',
                      -1,
                    )),
                  a(
                    f,
                    {
                      icon: 'add_a_photo',
                      preset: 'secondary',
                      'border-color': 'primary',
                      onClick: e[0] || (e[0] = (t) => B(i).push({ name: 'love-timeline' })),
                    },
                    { default: l(() => e[1] || (e[1] = [C(' Upload Memories ')])), _: 1 },
                  ),
                ])),
          ])
        )
      }
    },
  })
export { T as default }
//# sourceMappingURL=MemoriesCarousel-CkLh4_DK.js.map
